// Cadência de follow-up: qual toque está vencido para cada contato.
//
// A maior lacuna metodológica do mercado brasileiro é o follow-up: a maioria
// abandona após 1 ou 2 contatos, quando a prática pede uma sequência de toques.
// Em serviços técnicos, a maior parte dos orçamentos nunca recebe uma segunda
// mensagem — perde-se por silêncio, não por preço.
//
// O núcleo calcula; QUAIS toques existem e em que dia cada um cai vêm do
// manifesto do segmento (Lei 1).

import type { Stage } from "./skill";

const DAY = 86400000;

export type CadenceStep = { offset_days: number; intent: string };
export type Cadence = {
  key: string;
  applies_to?: string;
  steps?: CadenceStep[];
  stop_on?: string[];
  max_attempts?: number;
};

export type DueTouch = {
  contactId: string;
  name: string;
  phone: string | null;
  ownerId: string | null;
  stageLabel: string;
  /** Qual toque da cadência está vencido (1 = primeiro). */
  stepNumber: number;
  totalSteps: number;
  /** O que fazer neste toque, direto do manifesto. */
  intent: string;
  daysSince: number;
  overdueDays: number;
  cadenceKey: string | null;
  /** Contatos sem cadência declarada entram como silêncio simples. */
  semCadencia: boolean;
};

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Toques vencidos. Para cada contato em etapa não-terminal:
 *  - se a etapa declara `cadence`, usa os passos dela (offset a partir da
 *    entrada na etapa) e aponta o último passo já vencido que ainda não foi
 *    coberto por um contato nosso;
 *  - se não declara, sinaliza silêncio a partir de `silenceDays`.
 */
export function computeDueTouches(
  contacts: {
    id: string;
    name: string;
    phone: string | null;
    owner_id: string | null;
    journey_stage: string;
    stage_entered_at: string;
  }[],
  lastTouchByContact: Record<string, string>,
  stages: Stage[],
  cadences: Cadence[],
  silenceDays = 5,
): DueTouch[] {
  const hoje = startOfDay(Date.now());
  const byKey = new Map(cadences.map((c) => [c.key, c]));
  const out: DueTouch[] = [];

  for (const c of contacts) {
    const stage = stages.find((s) => s.key === c.journey_stage);
    if (!stage || stage.terminal) continue;

    const entrada = startOfDay(new Date(c.stage_entered_at).getTime());
    if (Number.isNaN(entrada)) continue;

    const ultimo = lastTouchByContact[c.id]
      ? startOfDay(new Date(lastTouchByContact[c.id]).getTime())
      : entrada;
    const daysSince = Math.floor((hoje - ultimo) / DAY);
    const diasNaEtapa = Math.floor((hoje - entrada) / DAY);

    const cadKey = (stage as Stage & { cadence?: string }).cadence;
    const cad = cadKey ? byKey.get(cadKey) : undefined;
    const steps = (cad?.steps ?? []).slice().sort((a, b) => a.offset_days - b.offset_days);

    if (steps.length > 0) {
      // Último passo cuja data já venceu.
      let idx = -1;
      for (let i = 0; i < steps.length; i++) {
        if (diasNaEtapa >= steps[i].offset_days) idx = i;
      }
      if (idx < 0) continue; // nenhum toque venceu ainda

      // Já falamos depois que esse passo venceu? Então está em dia.
      const vencimento = entrada + steps[idx].offset_days * DAY;
      if (ultimo >= vencimento) continue;

      out.push({
        contactId: c.id,
        name: c.name,
        phone: c.phone,
        ownerId: c.owner_id,
        stageLabel: stage.label,
        stepNumber: idx + 1,
        totalSteps: steps.length,
        intent: steps[idx].intent,
        daysSince,
        overdueDays: Math.floor((hoje - vencimento) / DAY),
        cadenceKey: cad?.key ?? null,
        semCadencia: false,
      });
      continue;
    }

    // Sem cadência declarada: cobra o silêncio.
    if (daysSince >= silenceDays) {
      out.push({
        contactId: c.id,
        name: c.name,
        phone: c.phone,
        ownerId: c.owner_id,
        stageLabel: stage.label,
        stepNumber: 0,
        totalSteps: 0,
        intent: "Retomar o contato — ninguém falou com ele desde então.",
        daysSince,
        overdueDays: daysSince - silenceDays,
        cadenceKey: null,
        semCadencia: true,
      });
    }
  }

  out.sort((a, b) => b.overdueDays - a.overdueDays);
  return out;
}
