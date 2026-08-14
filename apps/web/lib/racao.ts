// A RAÇÃO DO DIA — quantas pessoas cada vendedor fala hoje.
//
// ⚠ POR QUE UMA RAÇÃO, e não a lista inteira.
//
// Três motivos, e nenhum deles é enfeite de tela.
//
// **1. Lista grande faz a pessoa parar.** O fundador descreveu o problema real
// da operação dele: *"eu peço para os vendedores mandarem mensagem, cadastrarem
// as pessoas, e em determinado momento eles param de executar, sem motivo
// algum... quando eu percebo, já tem semanas."* E o que a tela mostrava
// alimentava exatamente isso: 245 combinados vencidos, 352 pessoas sem contato
// há mais de 30 dias. Abrir o dia com uma dívida de três dígitos que não
// encolhe ensina que não adianta começar.
//
// Ele também nomeou o outro lado: *"se por um milagre em 1 dia eu consigo
// deixar o sistema sem pendências... no outro dia não pode aparecer esses mil,
// pois é desanimador, vai parecer que a pessoa não evoluiu."* Com ração, o
// milagre não é possível por construção — e é por isso que ele não decepciona.
//
// **2. O número da empresa é o ativo.** Três pessoas disparando centenas de
// mensagens em poucos dias é o padrão que faz o WhatsApp banir, mesmo com envio
// manual e base própria. Está medido e escrito no `ESTADO_DO_PROJETO` §3.5 — e
// até aqui não existia teto nenhum. `prospeccao_dia` limita a BUSCA de empresas
// novas no módulo de prospecção; nunca limitou mensagem para contato.
//
// **3. É a peça que o modo automático vai obedecer.** Quando o motor proativo
// existir, ele precisa de um número para respeitar todo dia. Autonomia sem
// ração é uma máquina de queimar o número do cliente pagante na primeira
// semana. A ração é pré-requisito da automação, não melhoria posterior.
//
// ⚠ O QUE A RAÇÃO NÃO É: uma meta de vendas. Ela é o teto do que o sistema
// PEDE por dia. Ninguém é impedido de falar com mais gente — o cockpit manual
// continua ilimitado, e a busca por nome também. O que a ração governa é a
// lista que o sistema empurra.

/**
 * O padrão, e de onde ele veio.
 *
 * Chute do fundador — *"seria umas 10 mensagens por dia para cada vendedor"* —
 * conferido contra o que os três recepcionistas da Be Fitness de fato
 * registram: Luciana 22 saídas, João 8, Nycolas 8, todas na primeira semana de
 * uso. Ou seja, 10/dia é de 2 a 6 vezes o ritmo atual: apertado o suficiente
 * para significar alguma coisa e baixo o suficiente para ser possível.
 *
 * ⚠ Esse número mede REGISTRO, não trabalho. Mensagem mandada direto pelo
 * WhatsApp sem passar pela tela não existe para o sistema. Antes de cobrar em
 * cima dele é preciso saber se eles fazem pouco ou registram pouco — são
 * problemas diferentes, com soluções opostas.
 */
export const RACAO_PADRAO = 10;

/** Teto de sanidade. Acima disso não é ração, é rajada — ver o motivo 2. */
export const RACAO_MAXIMA = 60;

/**
 * Lê a ração configurada da empresa.
 *
 * Valor inválido não vira erro nem zero: volta ao padrão. Ração zero desligaria
 * a fila inteira em silêncio, que é a forma mais cara de errar aqui — o
 * vendedor abriria a tela vazia e concluiria que está tudo em dia.
 */
export function lerRacao(settings: Record<string, unknown> | null | undefined): number {
  const bruto = (settings as { racao_dia?: unknown } | null)?.racao_dia;
  const n = typeof bruto === "number" ? bruto : Number(bruto);
  if (!Number.isFinite(n) || n < 1) return RACAO_PADRAO;
  return Math.min(Math.floor(n), RACAO_MAXIMA);
}

export type EstadoDaRacao = {
  /** O teto do dia. */
  teto: number;
  /** Quantos toques a pessoa já registrou hoje. */
  feitos: number;
  /** Quantos ainda cabem hoje. */
  restam: number;
  /** Fez a ração inteira. */
  cumprida: boolean;
  /**
   * Quantas pessoas ficaram de fora da lista de hoje por causa do teto.
   *
   * Existe para a tela poder dizer a verdade em uma linha discreta sem
   * escancarar a dívida: "tem mais gente, e ela espera" é diferente de
   * "você está devendo 352".
   */
  aguardando: number;
};

/**
 * O estado do dia de uma pessoa.
 *
 * `naFila` é quanta gente o motor selecionou para ela; `feitos` é quanto ela já
 * registrou hoje. A conta é deliberadamente simples porque ela aparece na tela
 * toda manhã e precisa ser conferível de cabeça.
 */
export function estadoDaRacao(params: {
  teto: number;
  feitos: number;
  naFila: number;
}): EstadoDaRacao {
  const teto = Math.max(1, params.teto);
  const feitos = Math.max(0, params.feitos);
  const restam = Math.max(0, teto - feitos);
  const mostrados = Math.min(restam, params.naFila);
  return {
    teto,
    feitos,
    restam,
    cumprida: restam === 0,
    aguardando: Math.max(0, params.naFila - mostrados),
  };
}

/**
 * Quantos toques cada pessoa registrou HOJE.
 *
 * Conta só o que SAIU: resposta do cliente não é trabalho de quem atende. E
 * conta por `created_by`, que é o vínculo (`membership`) de quem registrou —
 * vendedor não é tabela neste produto, é um `membership` com papel `agent`.
 */
export function toquesDeHoje(
  interacoes: { created_by?: string | null; direction?: string | null; occurred_at: string }[],
  hojeISO: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of interacoes) {
    if (!i.created_by || i.direction !== "outbound") continue;
    if (i.occurred_at.slice(0, 10) !== hojeISO.slice(0, 10)) continue;
    out[i.created_by] = (out[i.created_by] ?? 0) + 1;
  }
  return out;
}
