"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type CalItem = {
  contactId: string;
  name: string;
  stageLabel: string;
  phaseLabel: string;
  dateISO: string; // YYYY-MM-DD
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WD = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DAY = 86400000;

function key(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default function AgendaCalendar({ items }: { items: CalItem[] }) {
  const [offset, setOffset] = useState(0);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const byDay = useMemo(() => {
    const m = new Map<string, CalItem[]>();
    for (const it of items) {
      const arr = m.get(it.dateISO) ?? [];
      arr.push(it);
      m.set(it.dateISO, arr);
    }
    return m;
  }, [items]);

  const view = useMemo(() => {
    const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const month = first.getMonth();
    // Grade começa na segunda-feira on/antes do dia 1.
    const start = new Date(first);
    const dow = start.getDay(); // 0=Dom
    const back = dow === 0 ? 6 : dow - 1;
    start.setDate(start.getDate() - back);
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) cells.push(new Date(start.getTime() + i * DAY));
    // Corta a última semana se ela for inteiramente do mês seguinte.
    while (cells.length > 35 && cells[cells.length - 7].getMonth() !== month) {
      cells.splice(cells.length - 7, 7);
    }
    return { first, month, cells };
  }, [offset, today]);

  const monthTouches = useMemo(
    () => view.cells.filter((d) => d.getMonth() === view.month).reduce((n, d) => n + (byDay.get(key(d))?.length ?? 0), 0),
    [view, byDay],
  );

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="between" style={{ marginBottom: 14 }}>
        <div>
          <strong style={{ fontSize: 16 }}>
            {MONTHS[view.month]} {view.first.getFullYear()}
          </strong>
          <span className="text-faint" style={{ marginLeft: 10, fontSize: 13 }}>
            {monthTouches} toque{monthTouches === 1 ? "" : "s"}
          </span>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn-sm btn-ghost" onClick={() => setOffset((o) => o - 1)} aria-label="Mês anterior">‹</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setOffset(0)}>Hoje</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setOffset((o) => o + 1)} aria-label="Próximo mês">›</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {WD.map((w) => (
          <div key={w} className="text-faint" style={{ fontSize: 11, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em", paddingBottom: 2 }}>
            {w}
          </div>
        ))}
        {view.cells.map((d) => {
          const inMonth = d.getMonth() === view.month;
          const isToday = d.getTime() === today.getTime();
          const isPast = d < today && !isToday;
          const evs = byDay.get(key(d)) ?? [];
          return (
            <div
              key={d.getTime()}
              style={{
                // Altura fixa + overflow contido: todas as células ficam iguais
                // e alinhadas, independentemente de quantos toques têm.
                height: 92,
                boxSizing: "border-box",
                overflow: "hidden",
                minWidth: 0,
                borderRadius: 10,
                border: isToday ? "1px solid var(--border-brand)" : "1px solid var(--border)",
                background: isToday
                  ? "var(--brand-gradient-soft)"
                  : inMonth
                    ? "var(--surface)"
                    : "transparent",
                opacity: inMonth ? 1 : 0.4,
                padding: 6,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? "var(--brand-cyan)" : isPast ? "var(--text-faint)" : "var(--text-dim)",
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {d.getDate()}
              </div>
              {evs.slice(0, 2).map((e, i) => (
                <Link
                  key={`${e.contactId}-${i}`}
                  href={`/painel/contatos/${e.contactId}`}
                  title={`${e.name} · ${e.stageLabel}: ${e.phaseLabel}`}
                  style={{
                    display: "block",
                    fontSize: 11,
                    lineHeight: 1.3,
                    padding: "3px 6px",
                    borderRadius: 6,
                    background: isPast ? "rgba(242,99,95,0.12)" : "var(--surface-2)",
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {e.name}
                </Link>
              ))}
              {evs.length > 2 && (
                <span className="text-faint" style={{ fontSize: 10, textAlign: "center" }}>
                  +{evs.length - 2}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
