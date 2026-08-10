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
 * QUITAÇÃO — o toque só é devido se ninguém falou com a pessoa DEPOIS que ele
 * venceu.
 *
 * ⚠ ESTA É A REGRA QUE FALTAVA NO `combinado`, e a falta dela é o que fez a
 * Be Fitness ver a mesma aluna todo dia por um mês.
 *
 * As outras três origens já quitavam sozinhas, cada uma do seu jeito: a
 * cadência compara o último contato com o vencimento do passo, e recompra e
 * "esfriando" são calculadas A PARTIR do último contato, então avançam
 * sozinhas. O `combinado` não: ele é uma DATA FIXA em `next_action_at`, e
 * nada nunca a limpava. Uma vez vencida, a pessoa ficava na fila para sempre
 * — no motivo de prioridade 1, que MASCARA todos os outros. Medido na base
 * real: 233 dos 251 combinados vencidos, 74 deles com a pessoa já tendo
 * respondido depois da data.
 *
 * O padrão é o da casa: não apareceu como erro nenhum. A lista simplesmente
 * não encolhia.
 *
 * **Por que "qualquer interação" e não só a nossa.** O toque proativo existe
 * para fazer a conversa acontecer. Se ela aconteceu — ele escreveu, nós
 * respondemos, tanto faz quem começou — o motivo do toque foi cumprido, e
 * cobrar de novo é o que o fundador descreveu: falar duas vezes com quem já
 * respondeu. É também a regra que `computeDueTouches` já usava, então as
 * quatro origens passam a quitar do MESMO jeito em vez de cada uma do seu.
 *
 * O que isto NÃO faz: apagar o combinado do banco. `next_action_at` continua
 * sendo o que o vendedor escreveu. A quitação é derivada do histórico, então
 * ela se corrige sozinha — e um registro de envio que falhe não destrói o
 * compromisso, só adia a baixa. Falhar ≠ corromper, como em `paraE164BR`.
 */
export function quitado(
  ultimoContatoISO: string | undefined,
  vencimentoISO: string,
): boolean {
  if (!ultimoContatoISO) return false;
  // Comparação por DIA. O vencimento vem como data (`2026-07-12`) e a
  // interação como instante; comparar as strings cruas faria
  // "2026-07-12T14:00" perder para "2026-07-12" e o toque continuaria devido
  // no próprio dia em que foi feito.
  return ultimoContatoISO.slice(0, 10) >= vencimentoISO.slice(0, 10);
}

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
 * CONSTRÓI A FILA INTEIRA — as quatro origens, quitadas e deduplicadas.
 *
 * ⚠ POR QUE ISTO SAIU DA TELA E VIROU FUNÇÃO.
 *
 * A regra "uma pessoa, um motivo" existia — mas só dentro de `/painel/fila`,
 * porque a montagem morava no componente. O Painel inicial montava CINCO
 * listas próprias e independentes ("Você combinou de voltar", "Contratos a
 * vencer", "Hora de chamar de volta", "Leads esfriando", "Para hoje"), sem
 * nenhuma dedução entre elas. A mesma aluna aparecia em três delas ao mesmo
 * tempo, e o vendedor não tinha como saber que era a mesma pessoa.
 *
 * Regra que ficou escrita: **fila é lógica, não é tela.** Lista de quem
 * contatar que não passa por aqui vai divergir — e vai divergir em silêncio,
 * porque duas listas erradas parecem duas listas.
 *
 * `phases` × `cadence` são a MESMA coisa declarada duas vezes no manifesto —
 * `convertido` da academia tem 4 fases (7/30/60/90) e a cadência
 * `pos_matricula` com os mesmos 4 passos. `computeDueTouches` lê a cadência e
 * quita; o `computeAlerts` da agenda lê as fases e emite UMA LINHA POR FASE
 * VENCIDA, sem quitação nenhuma — por isso 313 matriculadas geravam duas
 * pendências cada. Aqui vale a cadência, uma só; a agenda continua sendo o
 * calendário, não a fila de trabalho.
 */
export function construirFila(params: {
  contatos: ContatoDaFila[];
  /** Última interação por contato (QUALQUER direção), ISO. */
  ultimoContato: Record<string, string>;
  stages: EtapaDaFila[];
  cadences: CadenciaDaFila[];
  recurrence: unknown;
  hojeISO: string;
  deps: DepsDaFila;
}): ItemDaFila[] {
  const { contatos, ultimoContato, stages, cadences, recurrence, hojeISO, deps } = params;
  const foraDeJogo = deps.stagesForaDeJogo(stages);
  const itens: ItemDaFila[] = [];
  const porId = new Map(contatos.map((c) => [c.id, c]));

  // 1. COMBINADO — o compromisso que a PESSOA assumiu com o cliente.
  for (const c of contatos) {
    if (!c.next_action_at || c.next_action_at > hojeISO) continue;
    if (foraDeJogo.has(c.journey_stage)) continue;
    if (quitado(ultimoContato[c.id], c.next_action_at)) continue;
    itens.push({
      contactId: c.id, name: c.name, phone: c.phone, ownerId: c.owner_id,
      motivo: "combinado",
      intencao: c.next_action_note
        ? `Retomar o que ficou combinado: ${c.next_action_note}`
        : "Retomar o contato na data que foi combinada com ele.",
      atraso: Math.round((Date.parse(hojeISO) - Date.parse(c.next_action_at)) / 86400000),
    });
  }

  // 2. RENOVAÇÃO — receita já vendida saindo pela porta.
  for (const r of deps.computeRenovacoes(contatos, foraDeJogo)) {
    const c = porId.get(r.contactId);
    if (!c) continue;
    itens.push({
      contactId: r.contactId, name: r.name, phone: r.phone, ownerId: c.owner_id,
      motivo: "renovacao", intencao: r.intencao,
      atraso: r.vencido ? Math.abs(r.diasParaVencer) : 0,
    });
  }

  // 3. FOLLOW-UP — a cadência do ramo, que é a maior perda medida do piloto.
  for (const t of deps.computeDueTouches(contatos, ultimoContato, stages, cadences)) {
    itens.push({
      contactId: t.contactId, name: t.name, phone: t.phone, ownerId: t.ownerId,
      motivo: "followup",
      intencao: t.semCadencia
        ? "Sem cadência declarada para esta etapa: retome com um ângulo novo, sem cobrar o silêncio."
        : `${t.intent} (toque ${t.stepNumber} de ${t.totalSteps})`,
      atraso: t.overdueDays,
    });
  }

  // 4. RECOMPRA — o ciclo do cliente conquistado.
  for (const r of deps.computeDue(contatos, ultimoContato, recurrence, deps.stagesWithoutRecurrence(stages))) {
    const c = porId.get(r.contactId);
    if (!c) continue;
    itens.push({
      contactId: r.contactId, name: r.name, phone: r.phone, ownerId: c.owner_id,
      motivo: "recompra",
      intencao: `Está no ponto de voltar (ciclo de ${r.intervalDays} dias). Sugira uma data concreta, sem cobrar a ausência.`,
      atraso: Math.max(0, r.overdueDays),
    });
  }

  return montarFila(itens);
}

export type ContatoDaFila = {
  id: string;
  name: string;
  phone: string | null;
  owner_id: string | null;
  journey_stage: string;
  stage_entered_at: string;
  next_action_at: string | null;
  next_action_note: string | null;
  contract_end: string | null;
};

type EtapaDaFila = { key: string; label: string; terminal?: boolean; won?: boolean; lost?: boolean };
type CadenciaDaFila = { key: string };

/**
 * Os cálculos entram por PARÂMETRO, não por import.
 *
 * `lib/fila.ts` é o núcleo (Lei 1): ele não pode conhecer segmento, e também
 * não precisa conhecer cadência, recorrência ou vigência — ele só sabe juntar
 * e desempatar. Quem sabe calcular cada motivo continua no seu arquivo, e a
 * tela injeta. O efeito colateral útil é que a fila fica testável sem banco e
 * sem manifesto.
 */
export type DepsDaFila = {
  stagesForaDeJogo: (s: EtapaDaFila[]) => Set<string>;
  stagesWithoutRecurrence: (s: EtapaDaFila[]) => Set<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  computeRenovacoes: (c: any, fora: Set<string>) => { contactId: string; name: string; phone: string | null; intencao: string; diasParaVencer: number; vencido: boolean }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  computeDueTouches: (c: any, ultimo: Record<string, string>, s: any, cad: any) => { contactId: string; name: string; phone: string | null; ownerId: string | null; intent: string; stepNumber: number; totalSteps: number; overdueDays: number; semCadencia: boolean }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  computeDue: (c: any, ultimo: Record<string, string>, rec: any, excl: Set<string>) => { contactId: string; name: string; phone: string | null; intervalDays: number; overdueDays: number }[];
};

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
