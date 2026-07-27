"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { finishOnboarding } from "./actions";

type FieldDef = { key: string; type: string; columns?: string[]; options?: string[]; required?: boolean };
type SectionDef = { key: string; label: string; required?: boolean; type?: string; fields?: FieldDef[] };
type Data = Record<string, unknown>;

const POSTURES = [
  { key: "espera", title: "Recebo contatos", desc: "O cliente me procura (indicação, redes, balcão). Foco em converter quem chega." },
  { key: "ativo", title: "Vou atrás", desc: "Capto ativamente — prospecto e abordo clientes novos." },
  { key: "ambos", title: "Os dois", desc: "Tenho carteira e também capto ativamente." },
];

export default function OnboardingWizard({
  sections,
  initial,
  tenantName,
  initialPosture,
}: {
  sections: SectionDef[];
  initial: Data;
  tenantName: string;
  initialPosture: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initial ?? {});
  const [posture, setPosture] = useState(initialPosture || "espera");
  const [step, setStep] = useState(0); // 0 = postura; 1..N = seções
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const total = sections.length + 1; // postura + seções
  const pct = Math.round((step / total) * 100);

  const sectionObj = (key: string) => (data[key] as Record<string, unknown>) ?? {};
  const setField = (sec: string, field: string, value: unknown) =>
    setData((p) => ({ ...p, [sec]: { ...((p[sec] as object) ?? {}), [field]: value } }));
  const setSection = (sec: string, value: unknown) => setData((p) => ({ ...p, [sec]: value }));

  function renderField(sec: string, f: FieldDef) {
    const val = sectionObj(sec)[f.key];
    if (f.type === "boolean") {
      return (
        <label className="row" style={{ gap: 8 }}>
          <input type="checkbox" checked={Boolean(val)} onChange={(e) => setField(sec, f.key, e.target.checked)} style={{ width: "auto" }} />
          <span className="text-dim">Sim</span>
        </label>
      );
    }
    if (f.type === "list") {
      const arr = Array.isArray(val) ? (val as string[]) : [];
      return (
        <div className="stack" style={{ gap: 6 }}>
          {arr.map((item, i) => (
            <div key={i} className="row" style={{ gap: 6 }}>
              <input className="input grow" value={item} onChange={(e) => setField(sec, f.key, arr.map((x, idx) => (idx === i ? e.target.value : x)))} />
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setField(sec, f.key, arr.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-ghost" style={{ justifySelf: "start" }} onClick={() => setField(sec, f.key, [...arr, ""])}>+ item</button>
        </div>
      );
    }
    if (f.type === "table") {
      const cols = f.columns ?? [];
      const rows = Array.isArray(val) ? (val as Record<string, string>[]) : [];
      return (
        <div className="stack" style={{ gap: 6 }}>
          {rows.length > 0 && (
            <div className="row text-faint" style={{ gap: 6, fontSize: 11 }}>
              {cols.map((c) => <span key={c} style={{ flex: 1 }}>{c}</span>)}
              <span style={{ width: 30 }} />
            </div>
          )}
          {rows.map((row, i) => (
            <div key={i} className="row" style={{ gap: 6 }}>
              {cols.map((c) => (
                <input key={c} className="input" style={{ flex: 1 }} value={row[c] ?? ""} onChange={(e) => setField(sec, f.key, rows.map((r, idx) => (idx === i ? { ...r, [c]: e.target.value } : r)))} />
              ))}
              <button type="button" className="btn btn-sm btn-ghost" style={{ width: 30 }} onClick={() => setField(sec, f.key, rows.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-ghost" style={{ justifySelf: "start" }} onClick={() => setField(sec, f.key, [...rows, Object.fromEntries(cols.map((c) => [c, ""]))])}>+ linha</button>
        </div>
      );
    }
    if (f.type === "schedule") {
      return <textarea className="input" rows={3} value={typeof val === "string" ? val : ""} onChange={(e) => setField(sec, f.key, e.target.value)} placeholder="Ex.: Seg a Sex 6h–22h; Sáb 8h–12h" />;
    }
    return <input className="input" value={typeof val === "string" ? val : ""} onChange={(e) => setField(sec, f.key, e.target.value)} />;
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      const res = await finishOnboarding(data, posture);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Erro ao concluir.");
    });
  }

  if (done) {
    return (
      <div className="card mt-24" style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ fontSize: 40 }}>✅</div>
        <h2 style={{ margin: "12px 0 6px" }}>Kairós calibrado para a {tenantName}</h2>
        <p className="text-dim" style={{ maxWidth: 420, margin: "0 auto 20px" }}>
          Seu DNA está salvo — o sistema agora responde com os seus fatos e não inventa.
          Você pode ajustar tudo depois em DNA.
        </p>
        <div className="row" style={{ gap: 10, justifyContent: "center" }}>
          <Link href="/painel/contatos/novo" className="btn btn-primary">Adicionar primeiro contato</Link>
          <Link href="/painel/responder" className="btn btn-ghost" onClick={() => router.refresh()}>Ir para o Responder</Link>
        </div>
      </div>
    );
  }

  const isPosture = step === 0;
  const section = isPosture ? null : sections[step - 1];

  return (
    <div className="mt-24">
      {/* Progresso */}
      <div className="between" style={{ marginBottom: 8 }}>
        <span className="eyebrow">Passo {step + 1} de {total}</span>
        <span className="text-faint" style={{ fontSize: 12 }}>{pct}%</span>
      </div>
      <div className="bar-track" style={{ marginBottom: 20 }}>
        <div className="bar-fill" style={{ width: `${pct}%`, transition: "width .3s ease" }} />
      </div>

      <div className="card">
        {isPosture ? (
          <>
            <h2 style={{ margin: "0 0 4px" }}>Como a {tenantName} trabalha?</h2>
            <p className="text-dim" style={{ marginTop: 0 }}>Isso ajusta como o sistema sugere as abordagens.</p>
            <div className="stack mt-16" style={{ gap: 10 }}>
              {POSTURES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPosture(p.key)}
                  className="card"
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    borderColor: posture === p.key ? "var(--border-brand)" : "var(--border)",
                    background: posture === p.key ? "var(--brand-gradient-soft)" : "transparent",
                  }}
                >
                  <strong>{p.title}</strong>
                  <p className="text-dim" style={{ margin: "4px 0 0", fontSize: 13 }}>{p.desc}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ margin: "0 0 4px" }}>
              {section!.label}
              {section!.required && <span className="text-faint" style={{ fontSize: 12, fontWeight: 400 }}> · importante</span>}
            </h2>
            <p className="text-dim" style={{ marginTop: 0 }}>
              Preencha com os fatos reais da empresa. O que não estiver aqui, o sistema não afirma.
            </p>
            <div className="stack mt-16" style={{ gap: 14 }}>
              {section!.fields && section!.fields.length > 0 ? (
                section!.fields.map((f) => (
                  <label key={f.key} className="text-dim" style={{ fontSize: 13 }}>
                    <span style={{ display: "block", marginBottom: 5 }}>{f.key}</span>
                    {renderField(section!.key, f)}
                  </label>
                ))
              ) : (
                <textarea className="input" rows={4} value={typeof data[section!.key] === "string" ? (data[section!.key] as string) : ""} onChange={(e) => setSection(section!.key, e.target.value)} />
              )}
            </div>
          </>
        )}
      </div>

      {error && <p className="badge badge-danger mt-16">{error}</p>}

      {/* Navegação */}
      <div className="between mt-24">
        <div>
          {step > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>← Voltar</button>
          )}
        </div>
        <div className="row" style={{ gap: 10 }}>
          {!isPosture && !section!.required && (
            <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s + 1)}>Pular</button>
          )}
          {step < total - 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Continuar</button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={finish} disabled={pending}>
              {pending ? "Salvando…" : "Concluir"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
