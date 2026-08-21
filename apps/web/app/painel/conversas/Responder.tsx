"use client";

import { useState } from "react";
import { responderPeloCanal } from "./actions";

/**
 * A CAIXA DE RESPOSTA — e o relógio da janela ao lado dela.
 *
 * ⚠ O RELÓGIO NÃO É ENFEITE. Passadas 24h desde a última mensagem do cliente,
 * a Meta simplesmente não entrega texto livre. Quem está escrevendo precisa
 * saber disso ANTES de escrever, não depois de perder a mensagem — o aviso de
 * "menos de 2h" existe porque esse é o intervalo em que a pessoa monta a
 * resposta, sai para o café e volta com a janela fechada.
 *
 * E o campo não guarda rascunho entre recargas de propósito: rascunho salvo é
 * o começo da aba antiga que regrava valor velho por cima do novo.
 */
export function Responder({
  contactId,
  podeResponder,
  motivoDoBloqueio,
  aviso,
}: {
  contactId: string;
  podeResponder: boolean;
  motivoDoBloqueio: string | null;
  aviso: string | null;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);


  const enviar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      const r = await responderPeloCanal(contactId, texto);
      if (r.ok) {
        setEnviado(true);
        setTexto("");
      } else setErro(r.motivo);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="card" style={{ background: "var(--bg-elev)" }}>
      {/* ⚠ A CAIXA APARECE SEMPRE, MESMO BLOQUEADA — e isso não é enfeite.
          O fundador abriu esta aba e disse "não consigo escrever, só serve
          para olhar". O campo existia; ele nunca apareceu porque a única
          conversa do sistema era o teste dele de três dias antes, com a janela
          de 24h fechada. O componente trocava a caixa por um aviso, e campo
          AUSENTE é indistinguível de campo que NÃO FOI FEITO.
          É a quarta vez que um comportamento correto chega como defeito por
          causa disso. A regra vale para telas também: **campo cinza com o
          motivo escrito ganha de campo que some.** */}
      {!podeResponder && (
        <p className="badge badge-warn" style={{ whiteSpace: "normal", textAlign: "left" }}>
          {motivoDoBloqueio ?? "Não dá para responder por aqui agora."}
        </p>
      )}
      {aviso && (
        <p className="badge badge-warn" style={{ whiteSpace: "normal", textAlign: "left" }}>
          {aviso}
        </p>
      )}
      <textarea
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setEnviado(false); }}
        placeholder={
          podeResponder
            ? "Escreva a resposta — ela sai pelo mesmo número em que ele escreveu."
            : "A janela de 24h fechou. O campo volta a funcionar assim que ele escrever de novo."
        }
        rows={3}
        style={{ width: "100%", marginTop: 8, opacity: podeResponder ? 1 : 0.55 }}
        disabled={enviando || !podeResponder}
      />
      <div className="row wrap" style={{ gap: 8, alignItems: "center", marginTop: 8 }}>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={enviar}
          disabled={enviando || !texto.trim() || !podeResponder}
        >
          {enviando ? "enviando…" : "Responder pelo número da empresa"}
        </button>
        {enviado && <span className="badge badge-success">enviada</span>}
      </div>
      {erro && (
        <p className="badge badge-danger" style={{ marginTop: 8, whiteSpace: "normal", textAlign: "left" }}>
          {erro}
        </p>
      )}
      <p className="text-faint" style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
        Sai do número do sistema, no mesmo fio da conversa. Dentro da janela de 24h é
        texto livre e hoje não custa nada.
      </p>
    </div>
  );
}
