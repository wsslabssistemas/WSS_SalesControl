// O QUE O SISTEMA AFIRMA E A FONTE NÃO CONFIRMA.
//
// ⚠ POR QUE ISTO EXISTE, e por que é uma tela e não um script de conserto.
//
// O fundador desconfiou de pessoas marcadas como matriculadas que não eram
// alunas, e achou que a importação de recebíveis tinha promovido quem pagou. A
// importação estava inocente — ela nunca toca a etapa. A causa era outra e é
// permanente: **`convertido` nunca é revogado.** Uma vez matriculado,
// matriculado para sempre, mesmo tendo saído há um ano.
//
// Consertar os 16 casos de agora resolveria hoje e o problema voltaria na
// próxima importação. **Etapa que só avança mente com o tempo**, e ninguém
// procura erro numa etapa que já foi verdade um dia.
//
// A REGRA GERAL, que vale para qualquer segmento com contrato: o sistema pode
// afirmar o que ele SABE, e tem que declarar o que ele apenas ACREDITA. Aqui
// ficam os casos em que o que ele mostra na tela e o que a fonte diz não
// batem — cada um com o motivo escrito e uma ação, em vez de um número solto
// num relatório.
//
// ⚠ E NADA AQUI SE CORRIGE SOZINHO. Mover pessoa de etapa em massa por
// dedução é exatamente a operação que a trava da planilha parcial existe para
// impedir. Quem decide é quem conhece a operação; o sistema aponta.
//
// Sem banco e sem imports do app: dá para testar em Node puro.

export type ContatoParaConferir = {
  id: string;
  name: string;
  journey_stage: string;
  contract_end: string | null;
  phone: string | null;
  custom: Record<string, unknown> | null;
};

export type TipoDeContradicao =
  | "fora_da_fonte"
  | "sem_pagamento"
  | "vigencia_vencida"
  | "sem_vigencia";

export type Contradicao = {
  contactId: string;
  nome: string;
  tipo: TipoDeContradicao;
  /** O que está errado, em português, para quem vai decidir. */
  descricao: string;
  /** O que o sistema faria se a pessoa confirmasse. */
  sugestao: string;
};

export const ROTULO_CONTRADICAO: Record<TipoDeContradicao, string> = {
  fora_da_fonte: "A fonte não conhece",
  sem_pagamento: "Nunca pagou",
  vigencia_vencida: "Vigência vencida",
  sem_vigencia: "Sem vigência",
};

/**
 * ⚠ A ORDEM É POR CUSTO DE ESTAR ERRADO, não por quantidade.
 *
 * "A fonte não conhece" vem primeiro porque é o único que o sistema **não
 * consegue corrigir sozinho nunca**: sem chave, a sincronização não alcança
 * aquela pessoa, então ela ficaria marcada como aluna para sempre, em qualquer
 * importação futura.
 */
const PESO: Record<TipoDeContradicao, number> = {
  fora_da_fonte: 0,
  vigencia_vencida: 1,
  sem_pagamento: 2,
  sem_vigencia: 3,
};

const dia = (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : null);

/**
 * Acha as contradições entre o que a etapa afirma e o que a fonte mostra.
 *
 * `etapasGanhas` e `etapaDeSaida` vêm do manifesto — o núcleo não sabe que
 * "convertido" quer dizer matriculado nem que "ex_aluno" é para onde vai quem
 * sai (Lei 1).
 *
 * `usaContrato` desliga tudo em segmento que não trabalha com vigência: numa
 * barbearia, "matriculado sem vigência" não é contradição, é o normal.
 */
export function acharContradicoes(params: {
  contatos: ContatoParaConferir[];
  etapasGanhas: Set<string>;
  usaContrato: boolean;
  hojeISO: string;
}): Contradicao[] {
  const { contatos, etapasGanhas, usaContrato, hojeISO } = params;
  if (!usaContrato) return [];

  const out: Contradicao[] = [];

  for (const c of contatos) {
    if (!etapasGanhas.has(c.journey_stage)) continue;
    // Quem já foi marcado como encerrado não é contradição: é história.
    if (c.custom?.["contrato_encerrado_em"]) continue;
    // Conferido à mão pelo gestor. A marca é o que faz a lista encolher — sem
    // ela, a tela repetiria os mesmos nomes toda semana e viraria ruído.
    if (c.custom?.["conferido_em"]) continue;

    const codigo = c.custom?.["codigo_sistema"];
    const pagamentos = c.custom?.["pagamentos"];
    const conferidoRecebimentos = c.custom?.["recebimentos_conferidos_em"];
    const fim = dia(c.contract_end);

    // 1. SEM CHAVE, a sincronização nunca vai alcançar esta pessoa. É o único
    //    caso que não se resolve com o tempo — por isso vem primeiro.
    if (!codigo) {
      out.push({
        contactId: c.id, nome: c.name, tipo: "fora_da_fonte",
        descricao: "Está marcado como cliente, mas não tem o código do sistema de origem — a sincronização nunca alcança esta pessoa, e ela vai continuar assim em toda importação futura.",
        sugestao: "Confira na origem: se ainda é cliente, preencha o código na ficha. Se não é, mova para a etapa de saída.",
      });
      continue;
    }

    // 2. VIGÊNCIA VENCIDA e ninguém deu baixa.
    if (fim && fim < hojeISO.slice(0, 10)) {
      out.push({
        contactId: c.id, nome: c.name, tipo: "vigencia_vencida",
        descricao: `A vigência terminou em ${fim.split("-").reverse().join("/")} e a pessoa continua como cliente ativo.`,
        sugestao: "Se renovou, a próxima sincronização corrige sozinha. Se saiu, mova para a etapa de saída.",
      });
      continue;
    }

    // 3. CONTRATO E NENHUM PAGAMENTO. Só vale afirmar quando os recebimentos
    //    FORAM conferidos — sem isso, "nunca pagou" é dedução sobre ausência
    //    de dado, que é o erro que este arquivo existe para não cometer.
    if (conferidoRecebimentos && (pagamentos === undefined || pagamentos === null || pagamentos === 0)) {
      out.push({
        contactId: c.id, nome: c.name, tipo: "sem_pagamento",
        descricao: "Tem contrato registrado e NENHUM pagamento no relatório conferido. Fechou e não pagou.",
        sugestao: "É cobrança, não reativação: fale antes que o contrato ande sozinho.",
      });
      continue;
    }

    // 4. CLIENTE SEM VIGÊNCIA num segmento que trabalha com contrato.
    if (!fim) {
      out.push({
        contactId: c.id, nome: c.name, tipo: "sem_vigencia",
        descricao: "Está como cliente e não tem data de vencimento — nenhuma régua de renovação alcança esta pessoa.",
        sugestao: "Confira a vigência na origem e importe de novo, ou preencha na ficha.",
      });
    }
  }

  return out.sort(
    (a, b) => PESO[a.tipo] - PESO[b.tipo] || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}
