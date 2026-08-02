"use client";

import { useState } from "react";
import { responderRepescagem } from "./actions";

type PerguntaVisivel = { id: string; question: string; options: string[]; licao: string; modulo: string };

/**
 * A repescagem — a segunda metade do método.
 *
 * O quiz do fim da lição é prática de teste. Isto é prática DISTRIBUÍDA: as
 * mesmas perguntas voltando dias depois, quando recuperar já custa esforço.
 * As duas juntas são o achado central de Hattie & Donoghue.
 *
 * Três diferenças em relação ao `Quiz`, todas de propósito:
 *   • cada resposta reagenda a questão na hora — não existe "terminar", a
 *     sessão é uma fila que pode ser abandonada sem perder nada;
 *   • a lição de origem aparece, porque a pessoa precisa saber onde reler;
 *   • não mexe na nota da lição. Nota é da prova; isto é revisão.
 */
export default function Repescagem({ perguntas }: { perguntas: PerguntaVisivel[] }) {
  const [i, setI] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ certa: boolean; explicacao: string } | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fim, setFim] = useState(false);

  const q = perguntas[i];
  const ultima = i === perguntas.length - 1;

  const responder = async () => {
    if (selecionada == null || feedback) return;
    setOcupado(true);
    setErro(null);
    try {
      const r = await responderRepescagem(q.id, selecionada);
      if (!r.ok) { setErro(r.error); return; }
      setFeedback({ certa: r.certa, explicacao: r.explicacao });
      if (r.certa) setAcertos((n) => n + 1);
    } catch (e) {
      setErro("Falha: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setOcupado(false);
    }
  };

  const avancar = () => {
    if (ultima) { setFim(true); return; }
    setFeedback(null);
    setSelecionada(null);
    setI(i + 1);
  };

  if (fim) {
    return (
      <div className="card mt-16" style={{ borderColor: "var(--border-brand)" }}>
        <div className="badge badge-success">Repescagem feita</div>
        <p style={{ marginTop: 10, marginBottom: 6, fontSize: 18 }}>
          <strong>{acertos} de {perguntas.length}</strong>
        </p>
        <p className="text-dim" style={{ marginTop: 0, fontSize: 14 }}>
          O que você acertou volta mais espaçado; o que errou volta amanhã. É o espaçamento
          fazendo o trabalho — não é preciso decidir nada.
        </p>
        <div className="row wrap mt-16" style={{ gap: 10 }}>
          <a href="/painel/curso" className="btn btn-sm btn-primary">Voltar ao curso</a>
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-16">
      <div className="between" style={{ alignItems: "baseline", marginBottom: 4 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Repescagem</p>
        <span className="text-faint" style={{ fontSize: 12 }}>{i + 1} de {perguntas.length}</span>
      </div>
      <p className="text-faint" style={{ fontSize: 12, margin: "0 0 10px" }}>
        {q.modulo} · {q.licao}
      </p>

      <p style={{ fontSize: 16, lineHeight: 1.5, margin: "8px 0 14px" }}>{q.question}</p>

      <div className="stack" style={{ gap: 8 }}>
        {q.options.map((opt, k) => {
          const escolhida = selecionada === k;
          const travado = feedback != null;
          // Mesma regra do quiz: só a opção escolhida ganha cor. Revelar a
          // certa de bandeja desliga o esforço de recuperação, que é o que ensina.
          const cor = travado && escolhida
            ? feedback.certa
              ? { border: "1px solid var(--success)", background: "rgba(123,212,90,0.10)" }
              : { border: "1px solid var(--danger)", background: "rgba(242,99,95,0.10)" }
            : escolhida
              ? { border: "1px solid var(--border-brand)", background: "var(--brand-gradient-soft)" }
              : { border: "1px solid var(--border)", background: "var(--surface)" };
          return (
            <button
              key={k}
              type="button"
              disabled={travado}
              onClick={() => setSelecionada(k)}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 10,
                cursor: travado ? "default" : "pointer",
                fontSize: 14,
                lineHeight: 1.45,
                color: "var(--text)",
                ...cor,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className="mt-16"
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: "var(--surface-2)",
            borderLeft: `3px solid var(--${feedback.certa ? "success" : "warn"})`,
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 14 }}>
            {feedback.certa ? "Certo." : "Não é essa."}
          </p>
          <p className="text-dim" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
            {feedback.explicacao}
          </p>
        </div>
      )}

      {erro && <p className="badge badge-danger mt-16">{erro}</p>}

      <div className="row mt-16" style={{ gap: 10, alignItems: "center" }}>
        {!feedback ? (
          <>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={selecionada == null || ocupado}
              onClick={responder}
            >
              {ocupado ? "Conferindo…" : "Responder"}
            </button>
            {selecionada == null && (
              <span className="text-faint" style={{ fontSize: 12 }}>escolha uma opção</span>
            )}
          </>
        ) : (
          <button type="button" className="btn btn-sm btn-primary" onClick={avancar}>
            {ultima ? "Terminar" : "Próxima →"}
          </button>
        )}
      </div>
    </div>
  );
}
