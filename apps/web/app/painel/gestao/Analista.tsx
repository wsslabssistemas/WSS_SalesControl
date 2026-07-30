"use client";

import { useState } from "react";
import { perguntarGestao } from "./ia-actions";

const ATALHOS = [
  "Relatório de desempenho dos vendedores",
  "Quais clientes estão parados e o que fazer",
  "De onde vêm meus melhores leads?",
  "Onde estou perdendo venda no funil?",
  "Resumo do mês para eu apresentar",
];

export default function Analista({ dias }: { dias: number }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const ask = async (texto: string) => {
    const t = texto.trim();
    if (!t) {
      setError("Escreva sua pergunta.");
      return;
    }
    setLoading(true);
    setError(null);
    setAnswer(null);
    setCopiado(false);
    try {
      const res = await perguntarGestao(t, dias);
      if (res.ok) setAnswer(res.answer);
      else setError(res.error);
    } catch (e) {
      setError("Falha ao chamar o motor: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-24" style={{ borderColor: "var(--border-brand)", background: "var(--brand-gradient-soft)" }}>
      <p className="eyebrow" style={{ marginBottom: 4 }}>Pergunte aos seus dados</p>
      <p className="text-dim" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>
        Peça um relatório ou faça uma pergunta sobre vendedores, clientes e funil.
        A resposta usa só os números da sua empresa no período selecionado.
      </p>

      <textarea
        className="input"
        rows={2}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ex.: me faça um relatório dos vendedores e diga quem precisa de ajuda"
      />

      <div className="row wrap" style={{ gap: 8, marginTop: 10, alignItems: "center" }}>
        <button type="button" className="btn btn-primary" onClick={() => ask(q)} disabled={loading}>
          {loading ? "Analisando…" : "Perguntar"}
        </button>
        {ATALHOS.map((a) => (
          <button
            key={a}
            type="button"
            className="badge"
            style={{ cursor: "pointer", padding: "5px 10px" }}
            onClick={() => { setQ(a); ask(a); }}
          >
            {a}
          </button>
        ))}
      </div>

      {error && <p className="badge badge-danger mt-16">{error}</p>}

      {answer && (
        <div className="card mt-16" style={{ background: "var(--bg-elev)" }}>
          <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: 1.6, fontSize: 14 }}>{answer}</p>
          <button
            type="button"
            className="btn btn-sm btn-ghost mt-16"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(answer);
                setCopiado(true);
              } catch {
                setCopiado(false);
              }
            }}
          >
            {copiado ? "Copiado ✓" : "Copiar relatório"}
          </button>
        </div>
      )}
    </div>
  );
}
