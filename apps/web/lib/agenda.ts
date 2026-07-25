import type { Stage } from "./skill";

const DAY = 86400000;

export type AgendaAlert = {
  contactId: string;
  name: string;
  stageLabel: string;
  phaseLabel: string;
  date: Date;
  days: number; // dias a partir de hoje (negativo = atrasado)
};

export function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Toques a fazer: para cada contato em etapa com fases, calcula as datas
 * (fase.offset_days a partir de stage_entered_at). Puro — sem banco.
 */
export function computeAlerts(
  contacts: {
    id: string;
    name: string;
    journey_stage: string;
    stage_entered_at: string;
  }[],
  stages: Stage[],
): AgendaAlert[] {
  const today = startOfToday();
  const out: AgendaAlert[] = [];
  for (const c of contacts) {
    const sd = stages.find((s) => s.key === c.journey_stage);
    if (!sd?.phases?.length) continue;
    const start = new Date(c.stage_entered_at);
    start.setHours(0, 0, 0, 0);
    for (const ph of sd.phases) {
      const date = new Date(start.getTime() + ph.offset_days * DAY);
      const days = Math.round((date.getTime() - today) / DAY);
      out.push({
        contactId: c.id,
        name: c.name,
        stageLabel: sd.label,
        phaseLabel: ph.label,
        date,
        days,
      });
    }
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}
