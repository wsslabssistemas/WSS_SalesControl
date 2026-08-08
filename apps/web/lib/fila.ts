// A FILA DE ENVIO — uma lista só, ordenada por prioridade, sem banco.
//
// O último item do `COS_Kairos_Vende_Kairos.md`: *"o motor proativo decide QUEM
// contatar e O QUE dizer; a mensagem cai numa fila; a pessoa abre e envia pelo
// `wa.me` com um clique. Sem API, sem template aprovado, sem risco de banimento
// do número — e com a parte difícil, que é quem e o quê, já resolvida."*
//
// POR QUE UMA FILA E NÃO QUATRO TELAS. Hoje o produto sabe de quatro motivos
// para falar com alguém, e cada um mora num lugar: o combinado com data, a
// cadência de follow-up, a renovação e a recompra. Quatro listas fazem o
// vendedor escolher por qual começar — e escolher é o trabalho que ele não vai
// fazer todo dia. Uma fila decide por ele.
//
// A ORDEM NÃO É POR DATA, É POR CUSTO DE FURAR:
//   1. COMBINADO — ele prometeu voltar num dia. O cliente lembra que marcou, e
//      furar isso custa a confiança inteira.
//   2. RENOVAÇÃO — receita já vendida saindo pela porta. Reconquistar custa
//      muito mais que renovar.
//   3. FOLLOW-UP — a cadência do ramo. É a maior perda medida do piloto (8 de
//      cada 9 perdas são silêncio), mas o relógio dela é mais frouxo.
//   4. RECOMPRA — o ciclo do cliente. Importante e o que mais tolera um dia
//      a mais.
//
// Dentro de cada motivo, o mais atrasado primeiro.

export type MotivoDaFila = "combinado" | "renovacao" | "followup" | "recompra";

export const PESO: Record<MotivoDaFila, number> = {
  combinado: 0,
  renovacao: 1,
  followup: 2,
  recompra: 3,
};

export const ROTULO: Record<MotivoDaFila, string> = {
  combinado: "Você combinou de voltar",
  renovacao: "Contrato a vencer",
  followup: "Follow-up devido",
  recompra: "Hora de chamar de volta",
};

export type ItemDaFila = {
  contactId: string;
  name: string;
  phone: string | null;
  ownerId: string | null;
  motivo: MotivoDaFila;
  /** O que fazer neste toque — vem do manifesto ou da regra de renovação. */
  intencao: string;
  /** Dias de atraso. 0 = vence hoje. */
  atraso: number;
};

/**
 * Junta as quatro origens numa fila só.
 *
 * UM CONTATO APARECE UMA VEZ, pelo motivo de MAIOR prioridade. Sem isso, quem
 * está atrasado em tudo apareceria quatro vezes e a fila viraria uma lista de
 * repetições — e o vendedor mandaria quatro mensagens para a mesma pessoa no
 * mesmo dia, que é a forma mais rápida de ser bloqueado.
 */
export function montarFila(itens: ItemDaFila[]): ItemDaFila[] {
  const melhor = new Map<string, ItemDaFila>();
  for (const i of itens) {
    const atual = melhor.get(i.contactId);
    if (!atual || PESO[i.motivo] < PESO[atual.motivo]) melhor.set(i.contactId, i);
  }
  return [...melhor.values()].sort(
    (a, b) => PESO[a.motivo] - PESO[b.motivo] || b.atraso - a.atraso || a.name.localeCompare(b.name, "pt-BR"),
  );
}

/**
 * O link de um toque.
 *
 * `wa.me` com o texto já preenchido: a pessoa clica, o WhatsApp abre com a
 * mensagem escrita, ela lê, ajusta se quiser e envia. **O envio continua
 * humano**, e isso não é limitação temporária — é o que evita template
 * aprovado pela Meta e, principalmente, o que protege o número do cliente
 * pagante de ser banido por padrão de disparo.
 *
 * Devolve `null` sem telefone: link de WhatsApp sem número abre uma tela de
 * erro, e tela de erro no meio de uma fila faz a pessoa abandonar a fila.
 */
export function linkDeEnvio(numeroE164Digits: string | null, texto: string): string | null {
  if (!numeroE164Digits) return null;
  return `https://wa.me/${numeroE164Digits}?text=${encodeURIComponent(texto)}`;
}
// NOTA: esta função recebe o número JÁ derivado (`lib/phone.ts` → `paraE164BR`)
// e por isso continua burra de propósito — quem sabe converter é um lugar só.
// Quando o canal virar API oficial, quem muda é `lib/envio.ts`; esta linha
// segue igual, porque link para humano clicar não deixa de existir: ele é o
// que sobra quando a janela de 24 horas fecha.
