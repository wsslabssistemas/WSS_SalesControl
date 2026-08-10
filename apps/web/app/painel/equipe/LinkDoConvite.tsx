"use client";

import { useEffect, useState } from "react";

/**
 * O link do convite, com botão de copiar.
 *
 * Sem o botão, a pessoa tinha que selecionar o texto dentro da caixa e usar
 * Ctrl+C — e o link é longo, então metade das vezes a seleção sai pela metade
 * e o convite chega quebrado. No celular, onde o fundador manda os convites
 * por WhatsApp, selecionar texto dentro de um campo é pior ainda.
 *
 * O botão do WhatsApp vem junto porque é para lá que o link vai de fato: a
 * conversa em que ele avisa a pessoa e manda o acesso é a mesma.
 */
export default function LinkDoConvite({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);

  // A confirmação some sozinha. Sem isso ela fica "Copiado!" para sempre, e
  // na segunda vez a pessoa não sabe se o clique funcionou.
  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2500);
    return () => clearTimeout(t);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
    } catch {
      // `navigator.clipboard` exige contexto seguro e permissão. Quando não
      // dá, a saída honesta é selecionar o texto para a pessoa: um clique a
      // menos que fazer tudo à mão, e nenhuma promessa falsa de "copiado".
      const campo = document.getElementById("convite-link") as HTMLInputElement | null;
      campo?.select();
    }
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <input
          id="convite-link"
          readOnly
          value={link}
          className="grow"
          style={{ fontSize: 12 }}
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          className={copiado ? "btn btn-sm btn-primary" : "btn btn-sm"}
          onClick={copiar}
          style={{ whiteSpace: "nowrap" }}
        >
          {copiado ? "✓ Copiado" : "Copiar link"}
        </button>
        <a
          className="btn btn-sm"
          style={{ whiteSpace: "nowrap", background: "#25D366", color: "#0b2e13", border: "none" }}
          href={`https://wa.me/?text=${encodeURIComponent(
            `Seu acesso ao WSS Kairós — clique para criar sua senha:\n${link}`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Enviar no WhatsApp
        </a>
      </div>

      <p className="text-faint" style={{ fontSize: 11, margin: 0 }}>
        O link vale por tempo limitado e só pode ser usado uma vez. Se vencer,
        é só adicionar a pessoa de novo — o sistema gera outro.
      </p>
    </div>
  );
}
