// Recorrência: quando chamar o cliente de volta.
// O núcleo calcula; QUAIS campos usar e quantos dias cada frequência vale
// vêm do manifesto do segmento (Lei 1 — nenhum vocabulário de mercado aqui).

const DAY = 86400000;

export type RecurrenceConfig = {
  frequency_field?: string;
  preferred_day_field?: string;
  remind_before_days?: number;
  intervals_days?: Record<string, number>;
  default_days?: number;
};

// Dias da semana como o manifesto os nomeia → índice do JS (0=domingo).
const DIAS: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
};

export type DueContact = {
  contactId: string;
  name: string;
  phone: string | null;
  ownerId: string | null;
  intervalDays: number;
  daysSince: number;
  dueDate: Date;      // quando o ciclo fecha
  suggested: Date;    // dia sugerido (respeita o dia preferido)
  overdueDays: number; // >0 já passou do ponto
  preferredDay: string | null;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Quem NÃO recebe recompra: as etapas finais que não são conquista.
 *
 * Uma etapa `won` também é final — mas é o cliente conquistado, exatamente
 * quem deve voltar. Tratar as duas igual apagava da lista justamente a
 * carteira ativa (era o caso da barbearia, cujo negócio é recompra).
 * `terminal` e `won` são vocabulário do núcleo, não de mercado — a Lei 1
 * continua de pé.
 */
export function stagesWithoutRecurrence(
  stages: { key: string; terminal?: boolean; won?: boolean }[],
): Set<string> {
  return new Set(stages.filter((s) => s.terminal && !s.won).map((s) => s.key));
}

/** Próxima data igual ou posterior a `from` que caia no dia da semana pedido. */
function snapToWeekday(from: Date, weekday: number): Date {
  const d = startOfDay(from);
  const delta = (weekday - d.getDay() + 7) % 7;
  return new Date(d.getTime() + delta * DAY);
}

/**
 * Clientes prontos para voltar. `lastVisitByContact` é a última data conhecida
 * de contato/atendimento; sem ela, usa a entrada na etapa atual.
 *
 * `excludedStages` vem de `stagesWithoutRecurrence` — etapa de conquista NÃO
 * entra nessa lista, senão a carteira ativa some da recompra.
 */
export function computeDue(
  contacts: {
    id: string;
    name: string;
    phone: string | null;
    owner_id: string | null;
    journey_stage: string;
    stage_entered_at: string;
    custom: Record<string, unknown> | null;
  }[],
  lastVisitByContact: Record<string, string>,
  cfg: RecurrenceConfig | null,
  excludedStages: Set<string>,
): DueContact[] {
  if (!cfg?.frequency_field) return [];
  const intervals = cfg.intervals_days ?? {};
  const padrao = cfg.default_days ?? 21;
  const antecedencia = cfg.remind_before_days ?? 0;
  const hoje = startOfDay(new Date());

  const out: DueContact[] = [];
  for (const c of contacts) {
    if (excludedStages.has(c.journey_stage)) continue;

    const custom = c.custom ?? {};
    const freq = String(custom[cfg.frequency_field] ?? "");
    // Sem frequência declarada não há ciclo a prever — não inventamos um.
    if (!freq) continue;
    const intervalDays = intervals[freq];
    if (!intervalDays) continue; // ex.: "esporadico" não tem ciclo

    const ref = lastVisitByContact[c.id] ?? c.stage_entered_at;
    if (!ref) continue;
    const last = startOfDay(new Date(ref));
    if (Number.isNaN(last.getTime())) continue;

    const daysSince = Math.floor((hoje.getTime() - last.getTime()) / DAY);
    // Só entra na fila quando falta pouco para fechar o ciclo (ou já passou).
    if (daysSince < intervalDays - antecedencia) continue;

    const dueDate = new Date(last.getTime() + intervalDays * DAY);

    const prefKey = cfg.preferred_day_field ? String(custom[cfg.preferred_day_field] ?? "") : "";
    const weekday = DIAS[prefKey];
    const base = dueDate.getTime() > hoje.getTime() ? dueDate : hoje;
    const suggested = weekday === undefined ? startOfDay(base) : snapToWeekday(base, weekday);

    out.push({
      contactId: c.id,
      name: c.name,
      phone: c.phone,
      ownerId: c.owner_id,
      intervalDays,
      daysSince,
      dueDate,
      suggested,
      overdueDays: Math.max(0, daysSince - intervalDays),
      preferredDay: prefKey && weekday !== undefined ? prefKey : null,
    });
  }

  // Mais atrasados primeiro.
  out.sort((a, b) => b.daysSince - b.intervalDays - (a.daysSince - a.intervalDays));
  return out;
}

export function labelDia(key: string | null): string {
  if (!key) return "";
  const nomes: Record<string, string> = {
    domingo: "domingo", segunda: "segunda", terca: "terça", quarta: "quarta",
    quinta: "quinta", sexta: "sexta", sabado: "sábado",
  };
  return nomes[key] ?? key;
}
