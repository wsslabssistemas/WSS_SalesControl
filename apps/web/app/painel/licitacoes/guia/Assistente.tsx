"use client";

import { useState } from "react";
import { perguntarLicitacoes } from "./actions";

const SUGESTOES = [
  "Preciso do SICAF para participar?",
  "Quais documentos não podem estar vencidos?",
  "Como precificar para não ter prejuízo?",
  "Que vantagem eu tenho sendo ME/EPP?",
];

export default function Assistente() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text) {
      setError("Escreva sua pergunta.");
      return;
    }
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await perguntarLicitacoes(text);
      if (res.ok) setAnswer(res.answer);
      else setError(res.error);
    } catch (e) {
      setError("Falha ao chamar o motor: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ borderColor: "var(--border-brand)", background: "var(--brand-gradient-soft)" }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Pergunte ao assistente</p>
      <textarea
        className="input"
        rows={2}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ex.: quais documentos preciso pra participar de um pregão?"
      />
      <div className="row wrap" style={{ gap: 8, marginTop: 10, alignItems: "center" }}>
        <button type="button" className="btn btn-primary" onClick={() => ask(q)} disabled={loading}>
          {loading ? "Consultando…" : "Perguntar"}
        </button>
        {SUGESTOES.map((s) => (
          <button key={s} type="button" className="badge" style={{ cursor: "pointer", padding: "5px 10px" }} onClick={() => { setQ(s); ask(s); }}>
            {s}
          </button>
        ))}
      </div>

      {error && <p className="badge badge-danger mt-16">{error}</p>}
      {answer && (
        <div className="card mt-16" style={{ background: "var(--bg-elev)" }}>
          <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6, fontSize: 14 }}>{answer}</p>
        </div>
      )}
      <p className="text-faint" style={{ fontSize: 11, marginTop: 10, marginBottom: 0 }}>
        Responde com base no playbook — não substitui a leitura do edital.
      </p>
    </div>
  );
}
