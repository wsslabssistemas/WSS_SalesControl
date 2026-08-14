"use client";

import { useState } from "react";
import { prever, aplicar, type Previsao } from "./actions";

/**
 * A TELA DE SINCRONIZAÇÃO — ver antes de aplicar.
 *
 * ⚠ O FLUXO É DE DOIS PASSOS E ISSO É A SEGURANÇA, não a ergonomia.
 *
 * O primeiro botão não grava nada: mostra o que ACONTECERIA. Só depois de a
 * pessoa ler a lista é que o segundo aparece. Um botão só, "importar", é o
 * desenho que produz a classe de defeito mais cara deste repositório — o
 * `seed-curso.mjs` saiu **com três ✓ verdes** enquanto derrubava oito módulos
 * ao lado, porque relatava só o que ele mesmo escrevera.
 *
 * O arquivo é lido no NAVEGADOR e o texto vai para o servidor. Assim o
 * arquivo original nunca sobe inteiro e a mesma tela serve para o `.csv` das
 * matrículas e para o `.xls` dos recebimentos — que, apesar da extensão, é
 * HTML por dentro (o sistema da academia mente a extensão em pelo menos dois
 * relatórios; `linhasDe` decide pelo conteúdo).
 */
export function Sincronizador() {
  const [mat, setMat] = useState("");
  const [rec, setRec] = useState("");
  const [nomeMat, setNomeMat] = useState("");
  const [nomeRec, setNomeRec] = useState("");
  const [p, setP] = useState<Previsao | null>(null);
  const [carregando, setCarregando] = useState<null | "prever" | "aplicar">(null);
  const [feito, setFeito] = useState<string | null>(null);

  const escolher = async (f: File | undefined, qual: "mat" | "rec") => {
    if (!f) return;
    const t = await f.text();
    if (qual === "mat") { setMat(t); setNomeMat(`${f.name} · ${Math.round(f.size / 1024)} KB`); }
    else { setRec(t); setNomeRec(`${f.name} · ${Math.round(f.size / 1024)} KB`); }
    setP(null); setFeito(null);
  };

  const rodarPrevisao = async () => {
    setCarregando("prever"); setFeito(null);
    try { setP(await prever(mat, rec)); } finally { setCarregando(null); }
  };

  const rodarAplicacao = async () => {
    setCarregando("aplicar");
    try {
      const r = await aplicar(mat, rec);
      if (r.ok) { setFeito(`${r.gravados} contatos atualizados.`); setP(null); }
      else setP({ ok: false, erro: r.erro });
    } finally { setCarregando(null); }
  };

  const rotulo: Record<string, { txt: string; cor: string }> = {
    renovou: { txt: "renovou", cor: "badge-success" },
    entrou: { txt: "entrou", cor: "badge-brand" },
    reapareceu: { txt: "voltou", cor: "badge-brand" },
    encerrou: { txt: "encerrou", cor: "badge-danger" },
    ajuste_de_data: { txt: "ajuste de data", cor: "badge" },
    vigencia_recuou: { txt: "conferir", cor: "badge-warn" },
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card">
        <p className="eyebrow" style={{ marginBottom: 10 }}>1 · Os arquivos</p>
        <div className="row wrap" style={{ gap: 20 }}>
          <label className="text-dim" style={{ fontSize: 13 }}>
            <span style={{ display: "block", marginBottom: 4 }}>Matrículas (.csv)</span>
            <input type="file" accept=".csv,.txt,.xls,.html" onChange={(e) => escolher(e.target.files?.[0], "mat")} />
            {nomeMat && <span className="badge badge-success" style={{ marginLeft: 8 }}>{nomeMat}</span>}
          </label>
          <label className="text-dim" style={{ fontSize: 13 }}>
            <span style={{ display: "block", marginBottom: 4 }}>Recebimentos (.xls)</span>
            <input type="file" accept=".csv,.txt,.xls,.html" onChange={(e) => escolher(e.target.files?.[0], "rec")} />
            {nomeRec && <span className="badge badge-success" style={{ marginLeft: 8 }}>{nomeRec}</span>}
          </label>
        </div>
        <p className="text-faint" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
          Pode mandar um só ou os dois. <strong>Nada é gravado neste passo.</strong> CPF,
          endereço e complemento são descartados na leitura — o sistema não precisa deles.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-16"
          disabled={(!mat && !rec) || carregando !== null}
          onClick={rodarPrevisao}
        >
          {carregando === "prever" ? "lendo…" : "Ver o que vai mudar"}
        </button>
      </div>

      {feito && <p className="badge badge-success">{feito}</p>}

      {p && !p.ok && <p className="badge badge-danger" style={{ whiteSpace: "normal", textAlign: "left" }}>{p.erro}</p>}

      {p?.ok && (
        <div className="card">
          <p className="eyebrow" style={{ marginBottom: 10 }}>2 · O que eu entendi</p>
          {p.entendeu?.matriculas && <p className="text-dim" style={{ fontSize: 13, margin: "0 0 4px" }}>Matrículas: {p.entendeu.matriculas}</p>}
          {p.entendeu?.recebimentos && <p className="text-dim" style={{ fontSize: 13, margin: "0 0 4px" }}>Recebimentos: {p.entendeu.recebimentos}</p>}
          {p.pagantes && (
            <p className="text-faint" style={{ fontSize: 12, margin: "8px 0 0" }}>
              {p.pagantes.total} pagantes · {p.pagantes.comHabito} com histórico suficiente para o sistema
              saber o atraso habitual deles.
              {p.pagantes.descartadas.length > 0 && (
                <> Colunas descartadas por serem dado sensível sem uso: <strong>{p.pagantes.descartadas.join(", ")}</strong>.</>
              )}
            </p>
          )}

          {/* ⚠ O BLOQUEIO VEM ANTES DE TUDO E SUBSTITUI O BOTÃO. Mostrar o
              aviso e deixar o botão do lado é o mesmo que não ter aviso. */}
          {/* ⚠ O BOTÃO DE APLICAR NÃO PODE DEPENDER DE `resumo`.
              `resumo` só existe quando veio arquivo de MATRÍCULAS. Quem subisse
              só o de recebimentos via a leitura correta e **nenhum botão** —
              que é exatamente o "não está salvando" e o "parece que falta o
              botão de enviar" que o fundador relatou. O botão agora depende de
              haver ALGO a aplicar, não de um dos dois arquivos. */}
          {p.bloqueio ? (
            <div className="card mt-16" style={{ borderColor: "var(--danger)" }}>
              <p className="badge badge-danger">Não dá para aplicar</p>
              <p style={{ fontSize: 14, margin: "8px 0 0" }}>{p.bloqueio}</p>
              <p className="text-faint" style={{ fontSize: 12, marginBottom: 0 }}>
                A lista abaixo mostra o que teria acontecido, para você conferir a exportação.
              </p>
            </div>
          ) : (
            (p.resumo || p.pagantes) && (
              <>
                <div className="row wrap mt-16" style={{ gap: 8 }}>
                  {!!p.resumo && p.resumo.renovaram > 0 && <span className="badge badge-success">renovaram: <strong>{p.resumo.renovaram}</strong></span>}
                  {!!p.resumo && p.resumo.entraram > 0 && <span className="badge badge-brand">entraram: <strong>{p.resumo.entraram}</strong></span>}
                  {!!p.resumo && p.resumo.reapareceram > 0 && <span className="badge badge-brand">voltaram: <strong>{p.resumo.reapareceram}</strong></span>}
                  {!!p.resumo && p.resumo.encerraram > 0 && <span className="badge badge-danger">encerraram: <strong>{p.resumo.encerraram}</strong></span>}
                  {!!p.resumo && p.resumo.ajustaram > 0 && <span className="badge">ajuste de data: <strong>{p.resumo.ajustaram}</strong></span>}
                  {!!p.resumo && p.resumo.recuaram > 0 && <span className="badge badge-warn">conferir: <strong>{p.resumo.recuaram}</strong></span>}
                </div>
                <button type="button" className="btn btn-primary mt-16" disabled={carregando !== null} onClick={rodarAplicacao}>
                  {carregando === "aplicar" ? "gravando…" : "Aplicar essas mudanças"}
                </button>
              </>
            )
          )}

          {!!p.eventos?.length && (
            <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
              {p.eventos.slice(0, 60).map((e) => (
                <li key={`${e.chave}-${e.tipo}`} className="row wrap" style={{ gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span className={`badge ${rotulo[e.tipo]?.cor ?? ""}`} style={{ minWidth: 100, justifyContent: "center" }}>
                    {rotulo[e.tipo]?.txt ?? e.tipo}
                  </span>
                  <span className="grow">{e.descricao}</span>
                </li>
              ))}
              {p.eventos.length > 60 && (
                <li className="text-faint" style={{ fontSize: 12, paddingTop: 10 }}>
                  … e mais {p.eventos.length - 60}. Todas serão aplicadas.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
