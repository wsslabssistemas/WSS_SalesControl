// O QUE A LINHA DA PLANILHA REPRESENTA — contrato, aula avulsa ou cortesia.
//
// Arquivo sem imports, testável em Node puro.
//
// ⚠ POR QUE ISTO EXISTE — a primeira leitura real da exportação, 20/ago/2026.
//
// A planilha de matrículas da Be Fitness traz uma coluna `Plano` que o sistema
// simplesmente ignorava. Das 393 linhas:
//
//   • ~331 são plano de verdade (Anual, 6 Meses, 3 Meses, à vista…);
//   • **46 são "Treino Avulso"** — o fundador explicou: *"normalmente são
//     pessoas que estão de passagem"*, turista que treinou um dia;
//   • **16 são "Semana FREE"** — a experimental gratuita.
//
// Tratar os três como contrato tem consequência dos dois lados:
//
//   1. O avulso vira "aluno" e depois "ex-aluno", e entra na reativação —
//      **oferecendo retorno a quem nunca foi cliente**, muitas vezes em outra
//      cidade. É a mesma classe do Gympass: mensagem plausível chegando em
//      quem não deveria receber, no nome da academia.
//   2. E infla o denominador: 46 pessoas de passagem contadas como carteira
//      fazem a taxa de conversão e a de retenção mentirem para baixo.
//
// ⚠ E A LISTA DE NOMES É DADO DO SEGMENTO, NUNCA CÓDIGO (Lei 2). "Treino
// Avulso" é vocabulário de academia; numa clínica o equivalente é "consulta
// avulsa", numa barbearia é o corte sem pacote. O núcleo não pode conhecer
// nenhum dos três.

export type TipoDeLinha =
  /** Plano de verdade: cria e mantém vigência. */
  | "contrato"
  /**
   * Sessão única. **Não é contrato e não vira ex-aluno.**
   *
   * Quem pagou uma aula não "deixou de ser aluno" — ele nunca foi. Colocá-lo
   * na régua de reativação é oferecer volta para quem não foi embora.
   */
  | "avulso"
  /**
   * Experimentação gratuita.
   *
   * ⚠ ESTE **PODE** VIRAR EX-ALUNO, e a diferença para o avulso é de intenção:
   * quem faz a semana experimental está avaliando a academia. Se não fechou,
   * é lead esfriado — exatamente o público da reativação. Foi a decisão do
   * fundador em 20/ago: *"tem também semana experimental, então pode entrar
   * numa lista de ex-aluno para tentarmos contactar"*.
   */
  | "experimental";

export type RegrasDePlano = {
  avulso?: string[];
  experimental?: string[];
};

/** Tira acento, caixa e espaço extra — a planilha vem com tudo isso. */
function normalizar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * O que esta linha é, a partir do nome do plano.
 *
 * ⚠ O PADRÃO É `contrato`, e essa escolha tem lado. Plano desconhecido tratado
 * como contrato entra na carteira e alguém percebe; tratado como avulso,
 * **some da renovação em silêncio** — e some justamente quem paga. Errar para
 * o lado de incluir é recuperável; errar para o lado de excluir não aparece.
 *
 * A comparação é por PEDAÇO do nome (`includes`), não igualdade: a mesma
 * planilha traz "Semana FREE", "Semana FREE2" e "Fitness Semanal". Exigir o
 * nome exato faria uma variação nova passar despercebida — e variação nova é o
 * normal, porque quem cria plano é a recepção, não o sistema.
 */
export function tipoDaLinha(
  nomeDoPlano: string | null | undefined,
  regras: RegrasDePlano | null | undefined,
): TipoDeLinha {
  const p = normalizar(nomeDoPlano ?? "");
  if (!p) return "contrato";

  // ⚠ AVULSO É TESTADO ANTES DE EXPERIMENTAL, de propósito. Um nome que casasse
  // com os dois (um hipotético "aula avulsa experimental") deve cair no mais
  // restritivo: avulso não vira ex-aluno, experimental vira. Na dúvida, não
  // colocar alguém numa lista de contato é o lado seguro.
  for (const t of regras?.avulso ?? []) {
    if (t && p.includes(normalizar(t))) return "avulso";
  }
  for (const t of regras?.experimental ?? []) {
    if (t && p.includes(normalizar(t))) return "experimental";
  }
  return "contrato";
}

/** Só o contrato cria e mantém vigência. */
export function contaComoContrato(tipo: TipoDeLinha): boolean {
  return tipo === "contrato";
}

/**
 * Quem pode entrar na régua de reativação quando some da fonte.
 *
 * Contrato e experimental sim; avulso não — ele nunca foi cliente para voltar
 * a ser.
 */
export function podeVirarExAluno(tipo: TipoDeLinha): boolean {
  return tipo !== "avulso";
}
