"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CAMPO DE TEXTO QUE ABRE SUGESTÕES AO SER CLICADO.
 *
 * O pedido do fundador, na palavra dele: *"eu poderia apertar na caixa e já
 * ter de uma a três opções pré-preenchidas; se nenhuma for a que atende o meu
 * negócio, aparece um 'outro' e a pessoa descreve"*.
 *
 * A primeira versão disto eram botões ACIMA da caixa. Funcionava para faixa
 * curta ("15 a 20 dias") e quebrava para o resto: uma sugestão como
 * *"Gramatura, composição e largura conforme a ficha técnica de cada item"*
 * vira um botão do tamanho da tela. Numa lista que abre, o tamanho do texto
 * deixa de importar — e por isso passa a valer a pena sugerir também nos
 * campos de texto longo, que são a maioria dos 268 campos abertos do DNA.
 *
 * POR QUE ISTO NÃO FURA A TRAVA ANTI-INVENÇÃO
 * O DNA é o que o motor AFIRMA ao cliente final. Sugestão que se aplica
 * sozinha seria fato inventado entrando por descuido. Então:
 *
 *  - a caixa começa VAZIA e nada é pré-selecionado;
 *  - a lista só aparece quando a pessoa clica — é ela quem pede;
 *  - escolher preenche o campo e deixa o texto EDITÁVEL, porque quase toda
 *    sugestão precisa de um ajuste ("20 dias" vira "20 dias úteis");
 *  - "nenhuma dessas" fecha a lista e deixa a pessoa escrever do zero;
 *  - "não sei ainda" ESVAZIA o campo de propósito. Sem essa saída, quem não
 *    sabe escolhe a opção mais próxima — e aproximação vira fato afirmado.
 *    Campo vazio faz o motor ESCALAR, que é o comportamento certo.
 */
export default function CampoComSugestoes({
  value,
  onChange,
  options,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  multiline?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  // Clicar fora fecha. Sem isto a lista de um campo fica aberta enquanto a
  // pessoa digita no de baixo, cobrindo o que ela está escrevendo.
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  // Já escolheu ou escreveu algo que não está na lista? Então a lista some do
  // caminho — ela é atalho para quem está começando, não enfeite permanente.
  const naLista = options.includes(value);
  const restantes = value.trim() === "" ? options : options.filter((o) => o !== value);

  const comum = {
    className: "input",
    value,
    placeholder: placeholder ?? "Clique para ver sugestões",
    onFocus: () => setAberto(true),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };

  return (
    <div ref={caixa} style={{ position: "relative" }}>
      {multiline ? <textarea {...comum} rows={2} /> : <input {...comum} />}

      {!aberto && (
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          style={{ marginTop: 6, fontSize: 12 }}
          onClick={() => setAberto(true)}
        >
          {value.trim() === "" ? "ver sugestões" : "trocar por uma sugestão"}
        </button>
      )}

      {aberto && (
        <div
          className="card"
          style={{
            position: "absolute", zIndex: 30, left: 0, right: 0, marginTop: 4,
            padding: 6, maxHeight: 260, overflowY: "auto",
            boxShadow: "0 12px 32px rgba(0,0,0,.35)",
          }}
        >
          <p className="text-faint" style={{ fontSize: 11, margin: "4px 8px 6px" }}>
            Escolha uma e ajuste se precisar — o texto continua editável.
          </p>

          {restantes.map((op) => (
            <button
              key={op}
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ display: "block", width: "100%", textAlign: "left", whiteSpace: "normal", padding: "8px 8px" }}
              // `onMouseDown` e não `onClick`: o clique tira o foco da caixa
              // antes de o clique registrar, e a seleção se perdia.
              onMouseDown={(e) => { e.preventDefault(); onChange(op); setAberto(false); }}
            >
              {op}
            </button>
          ))}

          <div className="row" style={{ gap: 6, borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6 }}>
            <button
              type="button"
              className="btn btn-sm btn-ghost grow"
              style={{ fontSize: 12 }}
              onMouseDown={(e) => { e.preventDefault(); setAberto(false); }}
            >
              nenhuma dessas — escrever
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ fontSize: 12 }}
              title="Deixa em branco. O sistema prefere não saber a afirmar errado."
              onMouseDown={(e) => { e.preventDefault(); onChange(""); setAberto(false); }}
            >
              não sei ainda
            </button>
          </div>
        </div>
      )}

      {naLista && (
        <span className="text-faint" style={{ display: "block", fontSize: 11, marginTop: 4 }}>
          Pode editar esse texto se a sua realidade for um pouco diferente.
        </span>
      )}
    </div>
  );
}
