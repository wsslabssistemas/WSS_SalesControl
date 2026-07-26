import type { Stage } from "@/lib/skill";

// Barra de jornada segmentada. Mostra por onde o contato passou, onde está e o
// que falta. Reutilizável (Responder, detalhe do contato, funil). Puro: sem
// estado, sem hooks — recebe as etapas do manifesto e a etapa atual.
export default function JourneyBar({
  stages,
  current,
  compact = false,
}: {
  stages: Stage[];
  current: string;
  compact?: boolean;
}) {
  // Etapas terminais de perda ficam fora da trilha linear de progresso.
  const track = stages.filter((s) => !(s.terminal && !s.won));
  const idx = track.findIndex((s) => s.key === current);
  const isLost = stages.find((s) => s.key === current)?.terminal && !stages.find((s) => s.key === current)?.won;

  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>
        {track.map((s, i) => {
          const done = idx >= 0 && i < idx;
          const active = i === idx;
          return (
            <div key={s.key} style={{ flex: 1 }} title={s.label}>
              <div
                className="bar-track"
                style={{ height: compact ? 5 : 7 }}
              >
                <div
                  className="bar-fill"
                  style={{
                    width: done || active ? "100%" : "0%",
                    opacity: done ? 0.55 : 1,
                    background: active && s.won ? "var(--success)" : undefined,
                    transition: "width .4s ease",
                  }}
                />
              </div>
              {!compact && (
                <div
                  style={{
                    fontSize: 11,
                    marginTop: 6,
                    textAlign: "center",
                    color: active ? "var(--text)" : "var(--text-faint)",
                    fontWeight: active ? 600 : 400,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isLost && (
        <div className="badge badge-danger" style={{ marginTop: 8 }}>
          {stages.find((s) => s.key === current)?.label ?? "Perdido"}
        </div>
      )}
    </div>
  );
}
