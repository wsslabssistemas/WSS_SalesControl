"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { installSkill, type SegmentOption } from "./segmento-actions";

const MODULO_LABEL: Record<string, string> = {
  prospeccao: "Prospecção B2B",
  licitacoes: "Licitações",
};

export default function EscolherSegmento({
  segments,
  atual,
  contatos,
}: {
  segments: SegmentOption[];
  atual: string;
  contatos: number;
}) {
  const router = useRouter();
  const [sel, setSel] = useState(atual);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const mudou = sel !== atual;

  const salvar = () =>
    startTransition(async () => {
      setError(null);
      const res = await installSkill(sel);
      if (res.ok) {
        setOk(true);
        router.refresh();
      } else {
        setError(res.error ?? "Erro ao instalar o segmento.");
      }
    });

  return (
    <div>
      <div className="stack" style={{ gap: 10 }}>
        {segments.map((s) => {
          const on = sel === s.key;
          const eAtual = atual === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => { setSel(s.key); setOk(false); }}
              className="card"
              style={{
                textAlign: "left",
                cursor: "pointer",
                borderColor: on ? "var(--border-brand)" : "var(--border)",
                background: on ? "var(--brand-gradient-soft)" : "transparent",
              }}
            >
              <div className="between wrap" style={{ gap: 8, alignItems: "baseline" }}>
                <strong>{s.name}</strong>
                <div className="row wrap" style={{ gap: 6 }}>
                  {eAtual && <span className="badge badge-success">em uso</span>}
                  {s.capabilities.map((c) => (
                    <span key={c} className="badge badge-brand">{MODULO_LABEL[c] ?? c}</span>
                  ))}
                </div>
              </div>
              <p className="text-dim" style={{ margin: "6px 0 0", fontSize: 13 }}>
                Chama o cliente de <strong>{s.lead}</strong> · fechar é <strong>{s.conversion}</strong>
              </p>
              {s.stages.length > 0 && (
                <p className="text-faint" style={{ margin: "6px 0 0", fontSize: 12 }}>
                  Jornada: {s.stages.join(" → ")}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {mudou && contatos > 0 && (
        <p className="badge badge-warn mt-16" style={{ whiteSpace: "normal", lineHeight: 1.5, padding: "8px 12px" }}>
          Atenção: você já tem {contatos} contato{contatos === 1 ? "" : "s"}. Cada segmento tem
          etapas próprias — os contatos vão precisar ser reencaixados na nova jornada.
        </p>
      )}

      {error && <p className="badge badge-danger mt-16">{error}</p>}
      {ok && <p className="badge badge-success mt-16">Segmento instalado. O painel já está adaptado.</p>}

      <div className="row mt-16" style={{ gap: 10, alignItems: "center" }}>
        <button type="button" className="btn btn-primary" onClick={salvar} disabled={pending || (!mudou && !!atual)}>
          {pending ? "Instalando…" : mudou ? "Usar este segmento" : "Segmento em uso"}
        </button>
        {mudou && <span className="text-faint" style={{ fontSize: 13 }}>troca vocabulário, jornada, campos, DNA e abas</span>}
      </div>
    </div>
  );
}
