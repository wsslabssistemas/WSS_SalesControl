type ContactField = {
  key: string;
  label: string;
  type: string;
  options?: string[];
};
type Stage = { key: string; label: string };

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
  background: "transparent",
  color: "inherit",
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
          defaultValue={contact?.journey_stage ?? "contato"}
          style={field}
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

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
          background: "#111",
          color: "#fff",
          font: "inherit",
          cursor: "pointer",
        }}
      >
        {submitLabel}
      </button>

      {erro && <p style={{ color: "#c0392b", fontSize: 13 }}>{erro}</p>}
    </form>
  );
}
