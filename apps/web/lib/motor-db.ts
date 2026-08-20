import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { carregarFila } from "@/lib/fila-db";
import { despacharToque } from "@/lib/despacho";
import { readAutomation } from "@/lib/automation";
import { lerRoteamento } from "@/lib/roteamento";
import { planejar, type Candidato, type PlanoDoMotor } from "@/lib/motor";
import type { MotivoDaFila } from "@/lib/fila";

// O EXECUTOR DO MOTOR — lê, decide, e (só no automático) manda.
//
// ⚠ ELE NÃO ESCOLHE NINGUÉM E NÃO ESCREVE NADA. Quem escolhe a pessoa é
// `lib/fila-db.ts`, a MESMA carga que a tela usa. Quem decide se pode sair
// agora é `lib/motor.ts`, puro e testado. Quem manda é `lib/despacho.ts`, o
// mesmo caminho do botão. Este arquivo só amarra os três — e é de propósito
// que ele seja quase vazio: cada peça que ganhasse lógica própria aqui viraria
// uma segunda versão da regra, divergindo em silêncio da que a tela usa.
//
// ⚠ E O MOTOR SÓ MANDA MODELO. Dentro da janela de 24h a pessoa está numa
// conversa ativa, e conversa ativa é de humano — é literalmente o que a regra
// de `cooldown_hours` protege. Fora da janela só sai modelo aprovado, cujo
// texto é FIXO: a IA não escreve uma palavra no caminho automático. Isso não é
// limitação temporária, é o que torna o automático aceitável hoje, com
// `decisions = 0` e nenhuma resposta de IA jamais entregue a cliente real.

export type ResultadoDoMotor = {
  tenantId: string;
  plano: PlanoDoMotor;
  /** Quantas saíram de fato. Sempre 0 em simulação. */
  enviadas: number;
  /** Falhas de envio, com o motivo da Meta inteiro. */
  falhas: { contactId: string; motivo: string }[];
  /**
   * O motivo DA FILA de cada candidato (`reativacao`, `renovacao`…).
   *
   * ⚠ Não confundir com o `motivo` de um veredito recusado, que é o TEXTO da
   * recusa. São duas coisas com o mesmo nome em camadas diferentes, e a tela
   * de simulação precisa das duas: uma diz por que estamos falando, a outra
   * por que não vamos falar agora.
   */
  motivoPorContato: Record<string, MotivoDaFila>;
};

const HORA = 3_600_000;

/**
 * Roda o motor de UMA empresa.
 *
 * `simular: true` força o modo simulação mesmo com a empresa em automático —
 * é o que a tela usa para mostrar "quem sairia amanhã" sem mandar nada.
 */
export async function rodarMotor(entrada: {
  tenantId: string;
  skillKey: string;
  tenantNome: string;
  simular?: boolean;
  agora?: Date;
}): Promise<ResultadoDoMotor> {
  const { tenantId, skillKey, tenantNome, simular = false, agora = new Date() } = entrada;

  // O motor não tem sessão de usuário: usa o admin, com `tenant_id` explícito
  // em toda consulta. Ver a nota de `lib/despacho.ts`.
  const admin = createAdminClient();
  const carga = await carregarFila({ supabase: admin, tenantId, skillKey, ownerId: null });

  const regras = readAutomation(carga.settings);
  const roteamento = lerRoteamento(carga.settings);

  // ⚠ SÓ ENTRA NO PLANO QUEM SAI PELO NÚMERO DA EMPRESA. O resto da fila
  // continua existindo e continua sendo trabalho de gente — o motor não tem
  // como "clicar no wa.me" por ninguém, e fingir que tem faria a lista do
  // vendedor sumir sem que a mensagem existisse.
  const doCanal = carga.fila.filter((f) => roteamento[f.motivo as MotivoDaFila]);

  const candidatos: Candidato[] = doCanal.map((f) => ({
    contactId: f.contactId,
    motivo: f.motivo,
    horasDesdeUltimoContato: horasDesde(carga.ultimo[f.contactId], agora),
    semResposta: semRespostaDele(carga.interacoes, f.contactId),
    diasSemEngajamento: diasDesdeEntradaDele(carga.interacoes, f.contactId, agora),
    horasDesdeRespostaDele: horasDesde(ultimaEntradaDele(carga.interacoes, f.contactId), agora),
  }));

  // ⚠ O TETO DO DIA CONTA O QUE JÁ SAIU PELO CANAL, não o que a equipe fez à
  // mão. São bolsos diferentes: o teto da automação existe para proteger o
  // NÚMERO da empresa, e mensagem que sai do WhatsApp do vendedor não gasta
  // reputação do número do sistema.
  const enviadosHoje = saidasDoCanalHoje(carga.interacoes, agora);

  const plano = planejar({
    candidatos,
    regras: simular ? { ...regras, mode: "simulation" } : regras,
    enviadosHoje,
    horaLocal: agora.getHours(),
  });

  const motivoPorContato: Record<string, MotivoDaFila> = {};
  for (const f of doCanal) motivoPorContato[f.contactId] = f.motivo;

  if (plano.simulado || !plano.ativo) {
    return { tenantId, plano, enviadas: 0, falhas: [], motivoPorContato };
  }

  const falhas: ResultadoDoMotor["falhas"] = [];
  let enviadas = 0;

  // ⚠ EM SÉRIE, DE PROPÓSITO. Disparar em paralelo mandaria dez mensagens no
  // mesmo segundo, que é exatamente o padrão de rajada que faz o WhatsApp
  // marcar a conta — e o teto do dia perderia o sentido se as dez saíssem
  // antes de qualquer uma ser contada.
  for (const contactId of plano.enviar) {
    const item = doCanal.find((f) => f.contactId === contactId);
    if (!item) continue;

    const r = await despacharToque({
      supabase: admin,
      tenantId,
      tenantNome,
      // ⚠ SEM AUTOR. O toque do motor não pertence a vendedor nenhum: contá-lo
      // no placar de alguém seria creditar a uma pessoa um trabalho que a
      // máquina fez, e o placar é lido pela equipe.
      membershipId: null,
      contactId,
      motivo: item.motivo,
      // Vazio: fora da janela só sai modelo, e modelo é texto fixo.
      texto: "",
    });

    if (r.ok) enviadas++;
    else falhas.push({ contactId, motivo: r.motivo });
  }

  return { tenantId, plano, enviadas, falhas, motivoPorContato };
}

// ---------------------------------------------------------------------
// As derivações. Todas leem o array que a carga já trouxe — nenhuma volta ao
// banco, porque uma consulta por candidato seria N consultas por execução.
// ---------------------------------------------------------------------

type Ix = { contact_id: string | null; occurred_at: string; direction: string };

function horasDesde(iso: string | undefined | null, agora: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? (agora.getTime() - t) / HORA : null;
}

/** A última mensagem DELE, em qualquer canal. É o que dispara o cooldown. */
function ultimaEntradaDele(ix: Ix[], contactId: string): string | null {
  let melhor: string | null = null;
  for (const i of ix) {
    if (i.contact_id !== contactId || i.direction !== "inbound") continue;
    if (!melhor || i.occurred_at > melhor) melhor = i.occurred_at;
  }
  return melhor;
}

/**
 * Quantas mensagens NOSSAS saíram desde a última vez que ele falou.
 *
 * ⚠ "Desde a última resposta dele", não "no total". Quem respondeu ontem e
 * recebeu duas mensagens hoje está em conversa; quem recebeu duas e nunca
 * respondeu está sendo perseguido. O mesmo número, situações opostas.
 */
function semRespostaDele(ix: Ix[], contactId: string): number {
  const desde = ultimaEntradaDele(ix, contactId);
  let n = 0;
  for (const i of ix) {
    if (i.contact_id !== contactId || i.direction !== "outbound") continue;
    if (desde && i.occurred_at <= desde) continue;
    n++;
  }
  return n;
}

/**
 * Dias desde o último sinal DELE. `null` quando ele nunca deu sinal nenhum.
 *
 * ⚠ O `null` é obrigatório e não é detalhe: `stop_after_days` veta quem PAROU
 * de engajar, e o ex-aluno importado nunca engajou por aqui. Confundir os dois
 * esvaziaria a reativação inteira — que é o motivo de o motor existir.
 */
function diasDesdeEntradaDele(ix: Ix[], contactId: string, agora: Date): number | null {
  const h = horasDesde(ultimaEntradaDele(ix, contactId), agora);
  return h === null ? null : Math.floor(h / 24);
}

/** O que saiu HOJE pelo canal oficial — o que o teto do dia governa. */
function saidasDoCanalHoje(ix: Ix[], agora: Date): number {
  const hoje = agora.toISOString().slice(0, 10);
  let n = 0;
  for (const i of ix) {
    if (i.direction !== "outbound") continue;
    if (i.occurred_at.slice(0, 10) !== hoje) continue;
    n++;
  }
  return n;
}
