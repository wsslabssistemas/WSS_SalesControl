"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDna } from "./actions";

type FieldDef = {
  key: string;
  label?: string;
  help?: string;
  type: string;
  columns?: string[];
  options?: string[];
  required?: boolean;
};
type SectionDef = {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
  fields?: FieldDef[];
};

type Data = Record<string, unknown>;

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid rgba(128,128,128,0.4)",
  borderRadius: 7,
  background: "var(--bg-elev)",
  color: "var(--text)",
  font: "inherit",
};
const small: React.CSSProperties = {
  font: "inherit",
  fontSize: 13,
  padding: "5px 10px",
  borderRadius: 7,
  border: "1px solid rgba(128,128,128,0.4)",
  background: "var(--bg-elev)",
  color: "var(--text)",
  cursor: "pointer",
};

export function DnaEditor({
  sections,
  initial,
}: {
  sections: SectionDef[];
  initial: Data;
}) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initial ?? {});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sectionObj = (key: string): Record<string, unknown> =>
    (data[key] as Record<string, unknown>) ?? {};

  const setField = (sec: string, field: string, value: unknown) =>
    setData((p) => ({ ...p, [sec]: { ...((p[sec] as object) ?? {}), [field]: value } }));

  const setSection = (sec: string, value: unknown) =>
    setData((p) => ({ ...p, [sec]: value }));

  function renderField(sec: string, f: FieldDef) {
    const val = sectionObj(sec)[f.key];

    if (f.type === "boolean") {
      return (
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={Boolean(val)}
            onChange={(e) => setField(sec, f.key, e.target.checked)}
          />
          <span style={{ opacity: 0.7 }}>Sim</span>
        </label>
      );
    }

    if (f.type === "list") {
      const arr = Array.isArray(val) ? (val as string[]) : [];
      return (
        <div style={{ display: "grid", gap: 6 }}>
          {arr.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <input
                value={item}
                onChange={(e) =>
                  setField(sec, f.key, arr.map((x, idx) => (idx === i ? e.target.value : x)))
                }
                style={input}
              />
              <button
                type="button"
                style={small}
                onClick={() => setField(sec, f.key, arr.filter((_, idx) => idx !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            style={{ ...small, justifySelf: "start" }}
            onClick={() => setField(sec, f.key, [...arr, ""])}
          >
            + item
          </button>
        </div>
      );
    }

    if (f.type === "table") {
      const cols = f.columns ?? [];
      const rows = Array.isArray(val) ? (val as Record<string, string>[]) : [];
      return (
        <div style={{ display: "grid", gap: 6 }}>
          {rows.length > 0 && (
            <div style={{ display: "flex", gap: 6, fontSize: 11, opacity: 0.5 }}>
              {cols.map((c) => (
                <span key={c} style={{ flex: 1 }}>
                  {c}
                </span>
              ))}
              <span style={{ width: 30 }} />
            </div>
          )}
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              {cols.map((c) => (
                <input
                  key={c}
                  value={row[c] ?? ""}
                  onChange={(e) =>
                    setField(
                      sec,
                      f.key,
                      rows.map((r, idx) => (idx === i ? { ...r, [c]: e.target.value } : r)),
                    )
                  }
                  style={{ ...input, flex: 1 }}
                />
              ))}
              <button
                type="button"
                style={{ ...small, width: 30 }}
                onClick={() => setField(sec, f.key, rows.filter((_, idx) => idx !== i))}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            style={{ ...small, justifySelf: "start" }}
            onClick={() =>
              setField(sec, f.key, [
                ...rows,
                Object.fromEntries(cols.map((c) => [c, ""])),
              ])
            }
          >
            + linha
          </button>
        </div>
      );
    }

    if (f.type === "schedule") {
      return (
        <textarea
          value={typeof val === "string" ? val : ""}
          onChange={(e) => setField(sec, f.key, e.target.value)}
          rows={3}
          style={input}
          placeholder="Ex.: Seg a Sex 6h–22h; Sáb 8h–12h"
        />
      );
    }

    // text, money_range e afins
    return (
      <input
        value={typeof val === "string" ? val : ""}
        onChange={(e) => setField(sec, f.key, e.target.value)}
        style={input}
      />
    );
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveDna(data);
      if (res.ok) {
        router.push("/painel/dna");
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao salvar.");
      }
    });
  }

  return (
    <div style={{ display: "grid", gap: 28, marginTop: 20 }}>
      {sections.map((s) => (
        <section key={s.key}>
          <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>
            {s.label}
            {s.required && (
              <span style={{ fontSize: 11, opacity: 0.5 }}> · obrigatória</span>
            )}
          </h2>

          {s.fields && s.fields.length > 0 ? (
            <div style={{ display: "grid", gap: 14 }}>
              {s.fields.map((f) => (
                <label key={f.key} style={{ fontSize: 13, opacity: 0.85 }}>
                  <span style={{ display: "block", marginBottom: 5 }}>{f.label ?? f.key}</span>
                  {f.help && (
                    <span className="text-faint" style={{ display: "block", fontSize: 12, fontWeight: 400, marginBottom: 6, lineHeight: 1.45 }}>{f.help}</span>
                  )}
                  {renderField(s.key, f)}
                </label>
              ))}
            </div>
          ) : (
            // Seção sem campos (ex.: free_notes / rich_text): valor único.
            <textarea
              value={typeof data[s.key] === "string" ? (data[s.key] as string) : ""}
              onChange={(e) => setSection(s.key, e.target.value)}
              rows={4}
              style={input}
            />
          )}
        </section>
      ))}

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "var(--brand-blue)",
            color: "#fff",
            font: "inherit",
            cursor: pending ? "default" : "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Salvando…" : "Salvar DNA"}
        </button>
        {error && <span style={{ color: "var(--danger)", fontSize: 13 }}>{error}</span>}
      </div>
    </div>
  );
}
