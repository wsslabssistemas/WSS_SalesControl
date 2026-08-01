"use client";

import { useState } from "react";
import { carregarItens } from "./actions";
import type { EditalItem } from "@/lib/licitacoes";

/**
 * "Por que este edital apareceu?" — a busca do PNCP casa com o texto completo
 * do edital, e o que você vende quase sempre está na LISTA DE ITENS, não no
 * objeto. Aqui o vendedor vê o item que bateu antes de abrir o portal.
 */
export default function ItensDoEdital({
  orgaoCnpj,
  ano,
  seq,
  destaque,
}: {
  orgaoCnpj: string;
  ano: number;
  seq: number;
  destaque: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itens, setItens] = useState<EditalItem[] | null>(null);
  const [todos, setTodos] = useState(false);

  const run = async () => {
    if (itens) {
      setItens(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await carregarItens({ orgaoCnpj, ano, seq });
      if (res.ok) setItens(res.itens);
      else setError(res.error);
    } catch (e) {
      setError("Falha ao ler os itens: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  const batem = itens?.filter((i) => i.bate) ?? [];
  const mostrar = itens ? (todos || batem.length === 0 ? itens : batem) : [];

  return (
    <div>
      <button
        type="button"
        className={destaque ? "btn btn-sm btn-primary" : "btn btn-sm btn-ghost"}
        onClick={run}
        disabled={loading}
      >
        {loading ? "Lendo itens…" : itens ? "Ocultar itens" : destaque ? "Por que apareceu?" : "Ver itens"}
      </button>

      {error && <p className="badge badge-danger mt-8">{error}</p>}

      {itens && (
        <div className="mt-8" style={{ width: "100%" }}>
          {itens.length === 0 ? (
            <p className="text-faint" style={{ fontSize: 12, margin: 0 }}>
              O PNCP não devolveu itens para este edital. Abra o portal para ver o anexo.
            </p>
          ) : (
            <>
              <p className="text-faint" style={{ fontSize: 12, margin: "0 0 8px" }}>
                {batem.length > 0 ? (
                  <>
                    <strong style={{ color: "var(--brand-cyan)" }}>{batem.length}</strong> de {itens.length}{" "}
                    {itens.length === 1 ? "item bate" : "itens batem"} com as suas palavras-chave.
                  </>
                ) : (
                  <>
                    Nenhum dos {itens.length} itens bate com as suas palavras — o PNCP achou o termo em outra
                    parte do edital (anexo, justificativa). Vale revisar a palavra-chave.
                  </>
                )}
              </p>

              <div className="stack" style={{ gap: 6 }}>
                {mostrar.map((it) => (
                  <div
                    key={it.numero}
                    style={{
                      padding: "7px 10px",
                      borderRadius: 6,
                      fontSize: 13,
                      lineHeight: 1.45,
                      border: "1px solid var(--border)",
                      borderLeft: it.bate ? "3px solid var(--brand-cyan)" : "1px solid var(--border)",
                    }}
                  >
                    <span className="text-faint" style={{ fontSize: 11 }}>#{it.numero}</span> {it.descricao}
                    {(it.quantidade != null || it.valorUnitario != null) && (
                      <span className="text-faint" style={{ fontSize: 11, display: "block", marginTop: 3 }}>
                        {it.quantidade != null && (
                          <>
                            {it.quantidade.toLocaleString("pt-BR")} {it.unidade ?? ""}
                          </>
                        )}
                        {it.quantidade != null && it.valorUnitario != null && " · "}
                        {it.valorUnitario != null && (
                          <>
                            {it.valorUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} un.
                          </>
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {batem.length > 0 && itens.length > batem.length && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost mt-8"
                  onClick={() => setTodos((v) => !v)}
                >
                  {todos ? "Mostrar só os que batem" : `Ver todos os ${itens.length} itens`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
