"use client";

import { useState } from "react";
import { gerarAbordagem, saveInteraction, type AiAnswer } from "./ai-actions";
import { CopyButton } from "./CopyButton";

export default function Abordar({
  contactId,
  contactName,
}: {
  contactId: string;
  contactName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AiAnswer | null>(null);
  const [saved, setSaved] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setSaved(false);
    try {
      const res = await gerarAbordagem(contactId);
      if (res.ok) setData(res.data);
      else setError(res.error);
    } catch (e) {
      setError("Falha ao chamar o motor: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-16" style={{ borderColor: "var(--border-brand)", background: "var(--brand-gradient-soft)" }}>
      <div className="between wrap" style={{ gap: 10, alignItems: "center" }}>
        <div>
          <strong>Primeiro contato com {contactName}</strong>
          <p className="text-dim" style={{ margin: "4px 0 0", fontSize: 13 }}>
            Ele ainda não falou com você. Aqui a IA escreve a abordagem de abertura —
            você não precisa colar mensagem nenhuma.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? "Escrevendo…" : "✨ Gerar primeira abordagem"}
        </button>
      </div>

      {error && <p className="badge badge-danger mt-16">{error}</p>}

      {data && (
        <div className="mt-16 stack" style={{ gap: 12 }}>
          {data.escalar ? (
            <div className="card" style={{ borderColor: "rgba(234,181,77,0.35)", background: "rgba(234,181,77,0.06)" }}>
              <div className="badge badge-warn">Faltam fatos no seu DNA</div>
              <p style={{ marginTop: 10, marginBottom: 6, fontSize: 14 }}>
                Para abordar alguém que não te conhece, o sistema precisa saber o que você vende e qual seu diferencial.
              </p>
              {data.faltam_fatos.length > 0 && (
                <ul className="text-dim" style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                  {data.faltam_fatos.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
            </div>
          ) : (
            <div className="card" style={{ background: "var(--bg-elev)" }}>
              <div className="eyebrow">Mensagem de abertura</div>
              <p style={{ whiteSpace: "pre-line", marginTop: 10, lineHeight: 1.55 }}>{data.resposta_sugerida}</p>
              <div className="row wrap" style={{ gap: 10, marginTop: 8 }}>
                <CopyButton text={data.resposta_sugerida} />
                {saved ? (
                  <span className="badge badge-success">Registrado ✓</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={async () => {
                      const r = await saveInteraction(contactId, "", data.resposta_sugerida, data.tecnica);
                      setSaved(r.ok);
                    }}
                  >
                    Registrar envio
                  </button>
                )}
              </div>
            </div>
          )}

          {data.explicacao && (
            <div className="card" style={{ background: "var(--bg-elev)" }}>
              <div className="eyebrow">Por que abordar assim</div>
              <p className="text-dim" style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>{data.explicacao}</p>
              {data.tecnica && <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}><strong>Técnica:</strong> {data.tecnica}</p>}
            </div>
          )}

          {data.proximo_passo && (
            <p className="badge badge-brand" style={{ whiteSpace: "normal", lineHeight: 1.5, padding: "8px 12px" }}>
              Próximo passo: {data.proximo_passo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
