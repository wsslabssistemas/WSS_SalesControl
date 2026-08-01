"use client";

import { useState } from "react";

export default function AssinarCalendario({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);
  const [aberto, setAberto] = useState(false);

  return (
    <div className="mt-16">
      <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="grow"
          style={{ fontSize: 12, minWidth: 220 }}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopiado(true);
            } catch {
              setCopiado(false);
            }
          }}
        >
          {copiado ? "Copiado ✓" : "Copiar endereço"}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAberto((v) => !v)}>
          {aberto ? "Ocultar passo a passo" : "Como adicionar"}
        </button>
      </div>

      {aberto && (
        <div className="card mt-16" style={{ background: "var(--bg-elev)" }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}>No Google Agenda (pelo computador)</p>
          <ol className="text-dim" style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
            <li>Abra <strong>calendar.google.com</strong></li>
            <li>Na coluna da esquerda, ao lado de <strong>Outras agendas</strong>, clique no <strong>+</strong></li>
            <li>Escolha <strong>De URL</strong></li>
            <li>Cole o endereço copiado e clique em <strong>Adicionar agenda</strong></li>
          </ol>
          <p className="text-faint" style={{ marginTop: 12, marginBottom: 0, fontSize: 12, lineHeight: 1.6 }}>
            Pronto: os toques aparecem no seu celular junto com seus outros
            compromissos, e atualizam sozinhos. O Google costuma sincronizar
            algumas vezes por dia — não é instantâneo.
            <br />
            Funciona igual no Apple Calendário (Arquivo → Nova assinatura de
            calendário) e no Outlook (Adicionar calendário → Da Internet).
          </p>
        </div>
      )}
    </div>
  );
}
