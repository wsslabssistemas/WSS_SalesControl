"use server";

import { getActiveTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rodarMotor } from "@/lib/motor-db";
import { ROTULO } from "@/lib/fila";
import { lerModelos } from "@/lib/roteamento";
import { primeiroNome } from "@/lib/modelo";
import { revalidatePath } from "next/cache";

export type LinhaDaSimulacao = {
  contactId: string;
  nome: string;
  motivo: string;
  sai: boolean;
  /** Por que NÃO sai. Vazio quando sai. */
  motivoDaRecusa: string;
  /**
   * O que a Meta vai preencher nas variáveis DESTA pessoa.
   *
   * ⚠ O corpo do modelo NÃO aparece aqui de propósito. Ele é fixo, mora na
   * Meta e foi aprovado por ela — copiá-lo para cá criaria uma segunda fonte
   * do mesmo texto, e as duas divergiriam no dia em que alguém editasse o
   * modelo lá. O que varia, e o que de fato pode sair errado, são as
   * variáveis: é isso que se confere antes de disparar.
   */
  variaveis: string[];
  modelo: string;
};

export type SimulacaoResult =
  | {
      ok: true;
      /** `false` quando nada sairia agora — e `porque` diz o motivo. */
      ativo: boolean;
      porque: string;
      linhas: LinhaDaSimulacao[];
      sairiam: number;
      avaliados: number;
    }
  | { ok: false; erro: string };

/**
 * A SIMULAÇÃO — "quem sairia agora, e por que cada um foi barrado".
 *
 * ⚠ POR QUE ESTA TELA EXISTE, e ela nasceu de um erro meu.
 *
 * O fundador configurou 10 mensagens/dia, escolheu "Simulação" e foi procurar
 * o botão de rodar. **Não havia nenhum** — o modo era gravado e nada o lia. Eu
 * descrevi um fluxo que não tinha construído, e ele passou um tempo procurando
 * uma coisa que não existe.
 *
 * ⚠ E ELA MOSTRA OS BARRADOS, NÃO SÓ OS ESCOLHIDOS. Uma lista só com "vão sair
 * 7" não permite conferir nada: quem lê não sabe se os outros 30 foram
 * poupados pela regra certa ou sumiram por um defeito. É a mesma exigência da
 * fila — sumir da lista sem explicação é como um erro vira "trabalho em dia".
 *
 * NUNCA ENVIA. `simular: true` força o modo simulação mesmo com a empresa em
 * automático, então apertar aqui é seguro por construção, não por disciplina.
 */
export async function simularMotor(): Promise<SimulacaoResult> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, erro: "Sem empresa vinculada." };
  if (!["owner", "admin"].includes(membership!.role)) {
    return { ok: false, erro: "Só quem é dono ou admin pode simular." };
  }

  try {
    const r = await rodarMotor({
      tenantId: tenant.id,
      skillKey: tenant.skill_key,
      tenantNome: tenant.name,
      simular: true,
    });

    // Os nomes vêm numa consulta só, e só dos que apareceram no plano.
    const ids = r.plano.vereditos.map((v) => v.contactId);
    const nomes = new Map<string, string>();
    if (ids.length) {
      const supabase = await createClient();
      // paginacao-ok: busca por lista de ids já limitada pelo plano.
      const { data } = await supabase
        .from("contacts")
        .select("id, name")
        .eq("tenant_id", tenant.id)
        .in("id", ids.slice(0, 200));
      for (const c of ((data as { id: string; name: string }[] | null) ?? [])) {
        nomes.set(c.id, c.name);
      }
    }

    // ⚠ O motivo da FILA vem do executor, não do veredito. O veredito também
    // tem um campo `motivo`, mas ele é o TEXTO da recusa — mesmo nome, camada
    // diferente. Ler o errado aqui mostraria "Fica para amanhã" onde deveria
    // aparecer "Ex-aluno — trazer de volta".
    const modelos = lerModelos(r.settings);

    const linhas: LinhaDaSimulacao[] = r.plano.vereditos.map((v) => {
      const nome = nomes.get(v.contactId) ?? "(contato sem nome)";
      const m = r.motivoPorContato[v.contactId];
      const pn = primeiroNome(nome);
      return {
        contactId: v.contactId,
        nome,
        motivo: ROTULO[m] ?? "",
        sai: v.enviar,
        motivoDaRecusa: v.enviar ? "" : v.motivo,
        variaveis: [pn.ok ? pn.valor : "(sem nome — não sai)", tenant.name],
        modelo: modelos[m] ?? "(nenhum modelo cadastrado para este motivo)",
      };
    });

    return {
      ok: true,
      ativo: r.plano.ativo,
      porque: r.plano.porque,
      linhas,
      sairiam: r.plano.enviar.length,
      avaliados: r.plano.vereditos.length,
    };
  } catch (e) {
    // O erro sobe INTEIRO. Simulação que falha em silêncio é pior que não ter
    // simulação: quem aperta conclui que não há ninguém para falar.
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * TIRA UMA PESSOA DE TODAS AS LISTAS DE CONTATO PROATIVO.
 *
 * ⚠ NASCEU DA PRIMEIRA SIMULAÇÃO REAL. O fundador leu os nove nomes e três
 * não eram ex-alunos: **Gympass** e **Total Pass** são convênios, e a
 * **Cinara** aluga uma sala. Os três estão na base porque PAGAM a academia —
 * e mandar "você já treinou com a gente e acabou parando" para o financeiro de
 * um convênio é erro que não quebra tela nenhuma: chega em quem paga, no nome
 * da academia.
 *
 * O motivo é OBRIGATÓRIO e não é burocracia: marcação sem justificativa é a
 * que ninguém tem coragem de desfazer seis meses depois, quando já não lembra
 * por que aquela pessoa está de fora.
 *
 * Vale para a fila do vendedor E para o motor, porque os dois leem a MESMA
 * carga (`lib/fila-db.ts`). Se o filtro morasse só na tela, o motor seguiria
 * mandando — e é justamente quando ninguém está olhando.
 */
export async function naoContatar(
  contactId: string,
  motivo: string,
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, erro: "Sem empresa vinculada." };
  if (!contactId) return { ok: false, erro: "Contato não informado." };

  const razao = motivo.trim();
  if (!razao) return { ok: false, erro: "Diga por que ele não deve receber." };

  const supabase = await createClient();
  // `.select()` porque escrita sem erro conferido é escrita que você ACHA que
  // fez — e esta decide se alguém recebe mensagem ou não.
  //
  // paginacao-ok: UPDATE de UMA linha, endereçada por chave primária. O
  // `.select("id")` devolve no máximo um registro — existe para conferir que a
  // gravação alcançou alguém, não para listar. (A trava sinalizou aqui porque
  // `update().select()` de fato devolve linhas; o motivo de ele ser seguro é
  // o `.eq("id", …)`, e por isso está escrito.)
  const { data, error } = await supabase
    .from("contacts")
    .update({ do_not_contact: true, do_not_contact_reason: razao })
    .eq("id", contactId)
    .eq("tenant_id", tenant.id)
    .select("id");

  if (error) return { ok: false, erro: error.message };
  if (!data || data.length === 0) return { ok: false, erro: "Contato não encontrado nesta empresa." };

  revalidatePath("/painel/automacao");
  revalidatePath("/painel/fila");
  revalidatePath(`/painel/contatos/${contactId}`);
  return { ok: true };
}
