"use client";

import { useState } from "react";

type ContactField = {
  key: string;
  label: string;
  type: string;
  options?: string[];
};
type Phase = { key: string; label: string; offset_days: number };
type Stage = { key: string; label: string; phases?: Phase[] };

export type ContactValues = {
  name?: string;
  phone?: string | null;
  source?: string | null;
  journey_stage?: string | null;
  custom?: Record<string, string> | null;
};

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "9px 11px",
  marginTop: 5,
  border: "1px solid rgba(128,128,128,0.4)",
  borderRadius: 8,
  background: "var(--bg-elev)",
  color: "var(--text)",
  font: "inherit",
};
const lbl: React.CSSProperties = { fontSize: 13, opacity: 0.85 };

export function ContactForm({
  action,
  fields,
  sources,
  stages,
  contact,
  erro,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  fields: ContactField[];
  sources: string[];
  stages: Stage[];
  contact?: ContactValues;
  erro?: string;
  submitLabel: string;
}) {
  const custom = contact?.custom ?? {};
  // A etapa inicial vem do manifesto do segmento — o núcleo não conhece
  // "contato" nem qualquer etapa de mercado (Lei 1).
  const [stage, setStage] = useState<string>(
    contact?.journey_stage ?? stages[0]?.key ?? "",
  );
  const stageDef = stages.find((s) => s.key === stage);
  const hasPhases = !!stageDef?.phases && stageDef.phases.length > 0;

  return (
    <form action={action} style={{ display: "grid", gap: 14, marginTop: 20 }}>
      <label style={lbl}>
        Nome *
        <input name="name" required defaultValue={contact?.name ?? ""} style={field} />
      </label>

      <label style={lbl}>
        Telefone
        <input name="phone" defaultValue={contact?.phone ?? ""} style={field} />
      </label>

      <label style={lbl}>
        Origem
        <select name="source" defaultValue={contact?.source ?? ""} style={field}>
          <option value="">—</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label style={lbl}>
        Etapa
        <select
          name="journey_stage"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          style={field}
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {hasPhases && (
        <label style={lbl}>
          Data de início ({stageDef!.label})
          <input type="date" name="stage_start" style={field} />
          <span style={{ fontSize: 12, opacity: 0.55 }}>
            Os toques (ex.: dia {stageDef!.phases!.map((p) => p.offset_days).join(", ")})
            são calculados a partir dessa data.
          </span>
        </label>
      )}

      {fields.map((f) => (
        <label key={f.key} style={lbl}>
          {f.label}
          {f.type === "enum" ? (
            <select
              name={`custom.${f.key}`}
              defaultValue={custom[f.key] ?? ""}
              style={field}
            >
              <option value="">—</option>
              {(f.options ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={`custom.${f.key}`}
              defaultValue={custom[f.key] ?? ""}
              style={field}
            />
          )}
        </label>
      ))}

      <button
        type="submit"
        style={{
          marginTop: 6,
          padding: "10px 12px",
          borderRadius: 8,
          border: "none",
          background: "var(--brand-blue)",
          color: "#fff",
          font: "inherit",
          cursor: "pointer",
        }}
      >
        {submitLabel}
      </button>

      {erro && (
        <p
          style={{
            color: "var(--danger)",
            fontSize: 13,
            padding: "8px 10px",
            border: "1px solid rgba(192,57,43,0.4)",
            borderRadius: 8,
            background: "rgba(192,57,43,0.08)",
          }}
        >
          {erro}
        </p>
      )}
    </form>
  );
}
