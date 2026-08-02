"use client";

import { useState } from "react";
import { concluirLicao, responderPergunta } from "./actions";

type PerguntaVisivel = { id: string; question: string; options: string[] };

/**
 * A prática. Não é verificação do que a pessoa leu: é o método.
 *
 * A meta-análise de Hattie & Donoghue (242 estudos) aponta prática de teste e
 * prática distribuída como as duas técnicas mais eficazes que existem. Três
 * decisões vêm daí:
 *   • uma pergunta por vez, respondida antes de ver a próxima — recuperar da
 *     memória é o que ensina; rolar uma lista não é;
 *   • a explicação aparece logo DEPOIS de responder, inclusive quando erra;
 *   • a correção é no servidor. O gabarito nunca chega ao browser — senão
 *     bastaria abrir o inspetor e a prática viraria adivinhação.
 */
export default function Quiz({
  lessonKey,
  perguntas,
  proxima,
  jaFeita,
}: {
  lessonKey: string;
  perguntas: PerguntaVisivel[];
  proxima: { key: string; title: string } | null;
  jaFeita: boolean;
}) {
  const [i, setI] = useState(0);
  const [escolhas, setEscolhas] = useState<Record<string, number>>({});
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ certa: boolean; explicacao: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fim, setFim] = useState<{ acertos: number; total: number; score: number } | null>(null);

  const q = perguntas[i];
  const ultima = i === perguntas.length - 1;

  const responder = async () => {
    if (selecionada == null || feedback) return;
    setOcupado(true);
    setErro(null);
    try {
      const r = await responderPergunta(q.id, selecionada);
      if (!r.ok) { setErro(r.error); return; }
      setFeedback({ certa: r.certa, explicacao: r.explicacao });
      setEscolhas((prev) => ({ ...prev, [q.id]: selecionada }));
    } catch (e) {
      setErro("Falha: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setOcupado(false);
    }
  };

  const avancar = async () => {
    if (!ultima) {
      setFeedback(null);
      setSelecionada(null);
      setI(i + 1);
      return;
    }
    setOcupado(true);
    setErro(null);
    try {
      const r = await concluirLicao(lessonKey, escolhas);
      if (r.ok) setFim({ acertos: r.acertos, total: r.total, score: r.score });
      else setErro(r.error);
    } catch (e) {
      setErro("Falha ao salvar: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setOcupado(false);
    }
  };

  if (fim) {
    const bom = fim.score >= 75;
    return (
      <div
        className="card mt-16"
        style={{ borderColor: bom ? "var(--border-brand)" : "rgba(234,181,77,0.35)" }}
      >
        <div className={bom ? "badge badge-success" : "badge badge-warn"}>
          {bom ? "Lição concluída" : "Concluída — vale reler"}
        </div>
        <p style={{ marginTop: 10, marginBottom: 6, fontSize: 18 }}>
          <strong>{fim.acertos} de {fim.total}</strong> · {fim.score}%
        </p>
        <p className="text-dim" style={{ marginTop: 0, fontSize: 14 }}>
          {bom
            ? "O que você errou volta mais para a frente, espaçado. É assim que fixa."
            : "Sem drama: reler agora, sabendo onde errou, é onde o aprendizado acontece."}
        </p>
        <div className="row wrap mt-16" style={{ gap: 10 }}>
          {proxima ? (
            <a href={`/painel/curso/${proxima.key}`} className="btn btn-sm btn-primary">
              Próxima: {proxima.title} →
            </a>
          ) : (
            <a href="/painel/curso" className="btn btn-sm btn-primary">Voltar ao curso</a>
          )}
          <a href="/painel/curso" className="btn btn-sm btn-ghost">Ver o progresso</a>
        </div>
      </div>
    );
  }

  return (
    <div className="card mt-16">
      <div className="between" style={{ alignItems: "baseline", marginBottom: 4 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Prática</p>
        <span className="text-faint" style={{ fontSize: 12 }}>{i + 1} de {perguntas.length}</span>
      </div>
      {jaFeita && i === 0 && !feedback && (
        <p className="text-faint" style={{ fontSize: 12, margin: "0 0 10px" }}>
          Você já fez esta lição. Refazer atualiza a nota — e responder de novo é o que fixa.
        </p>
      )}

      <p style={{ fontSize: 16, lineHeight: 1.5, margin: "8px 0 14px" }}>{q.question}</p>

      <div className="stack" style={{ gap: 8 }}>
        {q.options.map((opt, k) => {
          const escolhida = selecionada === k;
          const travado = feedback != null;
          // Depois de responder, a opção escolhida ganha a cor do resultado.
          // As outras não são reveladas: quem errou continua sem saber qual
          // era a certa até ler a explicação — que é onde está o ensino.
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
          <button type="button" className="btn btn-sm btn-primary" disabled={ocupado} onClick={avancar}>
            {ocupado ? "Salvando…" : ultima ? "Terminar a lição" : "Próxima pergunta →"}
          </button>
        )}
      </div>
    </div>
  );
}
