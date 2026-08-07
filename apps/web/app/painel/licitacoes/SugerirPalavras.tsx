"use client";

import { useState } from "react";
import { AvisoDeCota } from "@/app/painel/AvisoDeCota";
import { sugerirPalavras } from "./ia-actions";
import type { Sugestao } from "@/lib/licitacoes";

export default function SugerirPalavras({ atuais }: { atuais: string[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limite, setLimite] = useState<string | null>(null);
  const [termos, setTermos] = useState<Sugestao[] | null>(null);
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [copiado, setCopiado] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setLimite(null);
    setTermos(null);
    setEscolhidos([]);
    setCopiado(false);
    try {
      const res = await sugerirPalavras();
      if (res.ok) setTermos(res.termos);
      else if ("limite" in res) setLimite(res.mensagem);
      else setError(res.error);
    } catch (e) {
      setError("Falha: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (t: string) =>
    setEscolhidos((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const listaFinal = [...new Set([...atuais.map((a) => a.trim()).filter(Boolean), ...escolhidos])];

  return (
    <div className="card mt-16">
      <div className="between wrap" style={{ gap: 10, alignItems: "center" }}>
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Descobrir as palavras certas</p>
          <p className="text-dim" style={{ margin: "4px 0 0", fontSize: 13 }}>
            Órgãos escrevem com o termo deles. A IA sugere como eles chamam o que
            você vende, e cada termo mostra quantos editais encontra de verdade.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? "Analisando…" : "✨ Sugerir palavras"}
        </button>
      </div>

      {limite && <AvisoDeCota mensagem={limite} />}
      {error && <p className="badge badge-danger mt-16">{error}</p>}

      {termos && (
        <div className="mt-16">
          <p className="text-faint" style={{ fontSize: 12, marginBottom: 10 }}>
            Clique nos termos que fazem sentido para montar sua lista.
          </p>
          <div className="row wrap" style={{ gap: 8 }}>
            {termos.map((t) => {
              const on = escolhidos.includes(t.termo);
              return (
                <button
                  key={t.termo}
                  type="button"
                  onClick={() => toggle(t.termo)}
                  className={on ? "badge badge-success" : t.n === 0 ? "badge badge-danger" : "badge"}
                  style={{ cursor: "pointer", padding: "7px 12px", fontSize: 13 }}
                  title={t.n === 0 ? "Nenhum edital encontrado com este termo" : `${t.n} editais no histórico`}
                >
                  {on ? "✓ " : ""}{t.termo} <span className="text-faint">· {t.n.toLocaleString("pt-BR")}</span>
                </button>
              );
            })}
          </div>

          {escolhidos.length > 0 && (
            <div className="mt-16">
              <p className="eyebrow" style={{ marginBottom: 6 }}>Sua nova lista ({listaFinal.length} palavras)</p>
              <textarea readOnly className="input" rows={Math.min(8, listaFinal.length + 1)} value={listaFinal.join("\n")} />
              <button
                type="button"
                className="btn btn-sm btn-primary mt-8"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(listaFinal.join("\n"));
                    setCopiado(true);
                  } catch {
                    setCopiado(false);
                  }
                }}
              >
                {copiado ? "Copiado ✓" : "Copiar lista"}
              </button>
              <span className="text-faint" style={{ fontSize: 12, marginLeft: 10 }}>
                cole no campo de palavras-chave acima e salve
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
