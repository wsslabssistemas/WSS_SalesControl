// Métricas canônicas (CLAUDE.md): mediana e p90 (nunca só média), pessoas
// distintas, conversão = convertidos ÷ leads. Puro — sem banco.

export function median(vals: number[]): number | null {
  if (!vals.length) return null;
  const s = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function percentile(vals: number[], p: number): number | null {
  if (!vals.length) return null;
  const s = [...vals].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[idx];
}

/**
 * Tempo de resposta em minutos: para cada mensagem do cliente (inbound), o
 * tempo até a nossa próxima resposta (outbound) do mesmo contato. Uma medição
 * por rajada de entrada (zera ao responder).
 */
export function responseMinutes(
  events: { contact_id: string | null; direction: string; occurred_at: string }[],
): number[] {
  const byContact: Record<string, { direction: string; t: number }[]> = {};
  for (const e of events) {
    if (!e.contact_id) continue;
    (byContact[e.contact_id] ??= []).push({ direction: e.direction, t: new Date(e.occurred_at).getTime() });
  }
  const out: number[] = [];
  for (const list of Object.values(byContact)) {
    list.sort((a, b) => a.t - b.t);
    let lastInbound: number | null = null;
    for (const ev of list) {
      if (ev.direction === "inbound") {
        if (lastInbound == null) lastInbound = ev.t;
      } else if (ev.direction === "outbound" && lastInbound != null) {
        const min = (ev.t - lastInbound) / 60000;
        if (min >= 0) out.push(min);
        lastInbound = null;
      }
    }
  }
  return out;
}

export function fmtDuration(min: number | null): string {
  if (min == null) return "—";
  if (min < 60) return `${Math.round(min)}min`;
  const h = min / 60;
  if (h < 24) return `${h.toFixed(1).replace(".", ",")}h`;
  return `${(h / 24).toFixed(1).replace(".", ",")}d`;
}
