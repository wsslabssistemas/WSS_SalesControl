"use client";

import { useState } from "react";
import { gerarResposta, applyStage, saveInteraction, type AiAnswer } from "./ai-actions";
import { CopyButton } from "./CopyButton";

type StageLite = { key: string; label: string };

export default function GerarIA({
  contactId,
  message,
  stages,
}: {
  contactId?: string;
  message: string;
  stages: StageLite[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AiAnswer | null>(null);
  const [applied, setApplied] = useState(false);
  const [usedMessage, setUsedMessage] = useState("");
  const [saved, setSaved] = useState(false);

  const run = async () => {
    // Lê a caixa de texto ao vivo (não depende de clicar em "Buscar" antes).
    const el = typeof document !== "undefined"
      ? (document.getElementById("msg") as HTMLTextAreaElement | null)
      : null;
    const msg = (el?.value ?? message ?? "").trim();
    if (!msg) {
      setError("Cole a mensagem do cliente na caixa acima.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    setApplied(false);
    setSaved(false);
    setUsedMessage(msg);
    try {
      const res = await gerarResposta({ contactId, message: msg });
      if (res.ok) setData(res.data);
      else setError(res.error);
    } catch (e) {
      setError("Falha ao chamar o motor: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const stageLabel = (k: string) => stages.find((s) => s.key === k)?.label ?? k;

  return (
    <div className="mt-16">
      <button
        type="button"
        className="btn btn-primary"
        onClick={run}
        disabled={loading}
      >
        {loading ? "Gerando resposta…" : "✨ Gerar com IA"}
      </button>

      {error && <p className="badge badge-danger mt-16">{error}</p>}

      {data && (
        <div className="mt-16 stack" style={{ gap: 12 }}>
          {data.escalar ? (
            <div className="card" style={{ borderColor: "rgba(234,181,77,0.35)", background: "rgba(234,181,77,0.06)" }}>
              <div className="badge badge-warn">Escalar para humano</div>
              <p style={{ marginTop: 10, marginBottom: 6 }}>
                O motor não redigiu porque faltam fatos no DNA — e não inventa (trava anti-invenção).
              </p>
              {data.faltam_fatos.length > 0 && (
                <ul className="text-dim" style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                  {data.faltam_fatos.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
              {data.resposta_sugerida && (
                <p className="text-dim" style={{ marginTop: 10, marginBottom: 0, whiteSpace: "pre-line" }}>
                  Mensagem segura: {data.resposta_sugerida}
                </p>
              )}
            </div>
          ) : (
            <div className="card" style={{ borderColor: "var(--border-brand)", background: "var(--brand-gradient-soft)" }}>
              <div className="eyebrow">Resposta sugerida (IA)</div>
              <p style={{ whiteSpace: "pre-line", marginTop: 10, lineHeight: 1.55 }}>{data.resposta_sugerida}</p>
              <div className="row wrap" style={{ gap: 10, marginTop: 8 }}>
                <CopyButton text={data.resposta_sugerida} />
                {contactId ? (
                  saved ? (
                    <span className="badge badge-success">Salvo no histórico ✓</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={async () => {
                        const r = await saveInteraction(contactId, usedMessage, data.resposta_sugerida);
                        setSaved(r.ok);
                      }}
                    >
                      Registrar no cliente
                    </button>
                  )
                ) : (
                  <span className="text-faint" style={{ fontSize: 13 }}>
                    selecione um cliente acima para salvar no histórico
                  </span>
                )}
              </div>
            </div>
          )}

          {data.explicacao && (
            <div className="card">
              <div className="eyebrow">Por que esta resposta</div>
              <p className="text-dim" style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>{data.explicacao}</p>
              {data.tecnica && <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}><strong>Técnica:</strong> {data.tecnica}</p>}
            </div>
          )}

          <div className="row wrap" style={{ gap: 8 }}>
            {data.etapa_jornada && <span className="badge">Etapa: {data.etapa_jornada}</span>}
            {data.emocao && <span className="badge">Emoção: {data.emocao}</span>}
            {data.proximo_passo && <span className="badge badge-brand">Próximo: {data.proximo_passo}</span>}
          </div>

          {contactId && data.status_sugerido && !applied && (
            <div className="card" style={{ borderColor: "rgba(123,212,90,0.35)", background: "rgba(123,212,90,0.06)" }}>
              <div className="between wrap" style={{ gap: 10 }}>
                <div>
                  <div className="badge badge-success">Avanço de jornada detectado</div>
                  <p style={{ margin: "8px 0 0", fontSize: 14 }}>
                    Avançar para <strong>{stageLabel(data.status_sugerido)}</strong>
                    {data.motivo_status ? ` — ${data.motivo_status}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={async () => {
                    const r = await applyStage(contactId, data.status_sugerido, data.motivo_status);
                    if (r.ok) setApplied(true);
                  }}
                >
                  Atualizar jornada
                </button>
              </div>
            </div>
          )}
          {applied && <p className="badge badge-success">Jornada atualizada.</p>}
        </div>
      )}
    </div>
  );
}
