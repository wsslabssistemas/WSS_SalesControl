// O MOTOR PROATIVO — a DECISÃO de quem falar agora, sem banco e sem rede.
//
// ⚠ POR QUE ISTO É UM ARQUIVO PURO, e não código dentro do job.
//
// As regras anti-bloqueio da tela de Automação existem desde que ela nasceu e
// **nunca foram obedecidas**: `max_per_day`, `min_hours_between`,
// `max_no_reply`, `cooldown_hours`, a janela de horário e `stop_after_days`
// eram gravadas e nenhuma linha do sistema as lia. Um formulário que salva e
// ninguém cumpre é pior que não ter o formulário: ele promete um freio que não
// existe.
//
// Escrever essas seis regras dentro de um job agendado significaria só poder
// testá-las esperando o job rodar — e regra de horário testada "rodando e
// vendo" é o mesmo defeito da repescagem: o intervalo que nunca vence se
// parece exatamente com "ainda não chegou a hora". Aqui elas são função pura
// com relógio injetado.
//
// ⚠ E O MOTOR NÃO DECIDE O QUE DIZER, NEM PARA QUEM.
// Quem escolhe a pessoa é a fila (`lib/fila.ts`), com a mesma regra do manual.
// Quem escreve é o motor de IA, com a mesma trava anti-invenção. Este arquivo
// responde uma pergunta só: **destes que a fila já escolheu, quais podem sair
// AGORA, e quantos.** Duplicar a escolha aqui criaria duas filas divergindo em
// silêncio — o defeito de `phases` × `cadence`, pela terceira vez.

import type { MotivoDaFila } from "./fila";

/** O que o motor precisa saber de cada candidato. Tudo já calculado. */
export type Candidato = {
  contactId: string;
  motivo: MotivoDaFila;
  /** Horas desde a última conversa (qualquer direção). `null` = nunca houve. */
  horasDesdeUltimoContato: number | null;
  /** Mensagens NOSSAS seguidas sem ele responder. */
  semResposta: number;
  /** Dias desde a última vez que ELE deu qualquer sinal. `null` = nunca. */
  diasSemEngajamento: number | null;
  /** Ele respondeu recentemente — dispara o cooldown. Horas, ou `null`. */
  horasDesdeRespostaDele: number | null;
};

export type RegrasDoMotor = {
  mode: "off" | "simulation" | "auto";
  max_per_day: number;
  min_hours_between: number;
  max_no_reply: number;
  cooldown_hours: number;
  window_start: number;
  window_end: number;
  stop_after_days: number;
};

export type Veredito =
  | { contactId: string; enviar: true }
  | { contactId: string; enviar: false; motivo: string };

export type PlanoDoMotor = {
  /** `false` quando NADA sai agora — e `porque` diz o motivo, sempre. */
  ativo: boolean;
  porque: string;
  /** Só quem passou em tudo, já cortado pelo teto do dia. */
  enviar: string[];
  /** Todo mundo, com o veredito de cada um. É o que a tela mostra. */
  vereditos: Veredito[];
  /** `true` no modo simulação: gera e conta, não envia. */
  simulado: boolean;
};

/**
 * A JANELA DE HORÁRIO, e ela precisa suportar virar a meia-noite.
 *
 * `9 → 19` é o caso normal. `22 → 6` é madrugada, e uma comparação ingênua
 * (`h >= inicio && h < fim`) devolveria SEMPRE falso — a automação nunca
 * rodaria e ninguém saberia por quê, porque "não enviou nada" se parece com
 * "não havia nada para enviar".
 *
 * `inicio === fim` significa 24 horas. Zero horas seria a leitura alternativa
 * e é a errada: quem digita o mesmo número duas vezes quer "sempre", não
 * "nunca", e "nunca" é silencioso.
 */
export function dentroDaJanela(hora: number, inicio: number, fim: number): boolean {
  if (inicio === fim) return true;
  if (inicio < fim) return hora >= inicio && hora < fim;
  return hora >= inicio || hora < fim;
}

/**
 * O plano do motor para AGORA.
 *
 * `enviadosHoje` vem do banco (contagem de saídas do dia), não de um contador
 * próprio: contador paralelo diverge em silêncio, e divergência num freio só
 * aparece na fatura — é a mesma lição de `cota-db.ts`.
 */
export function planejar(entrada: {
  candidatos: Candidato[];
  regras: RegrasDoMotor;
  enviadosHoje: number;
  /** A hora local da empresa, 0–23. Quem converte o fuso é quem chama. */
  horaLocal: number;
}): PlanoDoMotor {
  const { candidatos, regras, enviadosHoje, horaLocal } = entrada;
  const vazio = (porque: string): PlanoDoMotor => ({
    ativo: false, porque, enviar: [], vereditos: [], simulado: regras.mode === "simulation",
  });

  if (regras.mode === "off") return vazio("A automação está desligada.");
  if (!dentroDaJanela(horaLocal, regras.window_start, regras.window_end)) {
    return vazio(
      `Fora da janela de horário (${regras.window_start}h às ${regras.window_end}h). ` +
      `Agora são ${horaLocal}h na empresa.`,
    );
  }

  const resta = regras.max_per_day - enviadosHoje;
  if (resta <= 0) {
    return vazio(`O teto do dia (${regras.max_per_day}) já foi atingido: ${enviadosHoje} saíram.`);
  }

  const vereditos: Veredito[] = [];
  const enviar: string[] = [];

  for (const c of candidatos) {
    const nao = (motivo: string) => vereditos.push({ contactId: c.contactId, enviar: false, motivo });

    // ⚠ PAROU DE INTERAGIR HÁ MUITO TEMPO — a regra que protege o número.
    // Insistir com quem nunca dá sinal é o padrão que faz o WhatsApp marcar a
    // conta. Vem PRIMEIRO porque é a mais grave: as outras adiam, esta veta.
    if (
      regras.stop_after_days > 0 &&
      c.diasSemEngajamento !== null &&
      c.diasSemEngajamento >= regras.stop_after_days
    ) {
      nao(`Sem nenhum sinal dele há ${c.diasSemEngajamento} dias (limite: ${regras.stop_after_days}).`);
      continue;
    }

    // Nunca engajou é DIFERENTE de parou de engajar, e por isso não cai na
    // regra acima: o ex-aluno importado nunca respondeu por aqui, e vetá-lo
    // esvaziaria a reativação inteira — que é o motivo de o motor existir.

    if (regras.max_no_reply > 0 && c.semResposta >= regras.max_no_reply) {
      nao(`Já foram ${c.semResposta} mensagens nossas sem resposta (limite: ${regras.max_no_reply}).`);
      continue;
    }

    // ⚠ COOLDOWN APÓS ELE RESPONDER. Quem acabou de responder está sendo
    // atendido por uma PESSOA — mandar toque proativo em cima disso é o
    // sistema atropelando o próprio vendedor no meio da conversa.
    if (
      regras.cooldown_hours > 0 &&
      c.horasDesdeRespostaDele !== null &&
      c.horasDesdeRespostaDele < regras.cooldown_hours
    ) {
      nao(`Ele respondeu há ${Math.floor(c.horasDesdeRespostaDele)}h — o cooldown é de ${regras.cooldown_hours}h.`);
      continue;
    }

    if (
      regras.min_hours_between > 0 &&
      c.horasDesdeUltimoContato !== null &&
      c.horasDesdeUltimoContato < regras.min_hours_between
    ) {
      nao(`Falamos com ele há ${Math.floor(c.horasDesdeUltimoContato)}h — o mínimo é ${regras.min_hours_between}h.`);
      continue;
    }

    if (enviar.length >= resta) {
      // NÃO é recusa: é o teto do dia. O texto diz isso porque "bloqueado" e
      // "amanhã" são coisas diferentes para quem lê a tela.
      nao(`Fica para amanhã: o teto de ${regras.max_per_day}/dia se esgota antes dele.`);
      continue;
    }

    enviar.push(c.contactId);
    vereditos.push({ contactId: c.contactId, enviar: true });
  }

  return {
    ativo: enviar.length > 0,
    porque: enviar.length
      ? `${enviar.length} de ${candidatos.length} podem sair agora (restavam ${resta} no teto do dia).`
      : "Nenhum candidato passou nas regras agora.",
    enviar,
    vereditos,
    simulado: regras.mode === "simulation",
  };
}
