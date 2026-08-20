"use client";

import { useState } from "react";
import { simularMotor, type SimulacaoResult } from "./simular-actions";

/**
 * O BOTÃO QUE FALTAVA.
 *
 * ⚠ O fundador configurou 10 mensagens/dia, escolheu "Simulação" e foi
 * procurar onde apertar. Não havia nada: o modo era gravado e nada o lia. Este
 * componente é a dívida sendo paga.
 *
 * ⚠ E ELE MOSTRA OS BARRADOS COM O MOTIVO DE CADA UM. "Sairiam 7" sozinho não
 * deixa conferir nada — quem lê não sabe se os outros 30 foram poupados pela
 * regra certa ou sumiram por um defeito. Lista sem os excluídos é a mesma
 * armadilha da fila que só encolhe: parece trabalho em dia, é erro invisível.
 */
export function Simulacao({ modo }: { modo: "off" | "simulation" | "auto" }) {
  const [r, setR] = useState<SimulacaoResult | null>(null);
  const [rodando, setRodando] = useState(false);

  const rodar = async () => {
    setRodando(true);
    setR(null);
    try {
      setR(await simularMotor());
    } catch (e) {
      setR({ ok: false, erro: e instanceof Error ? e.message : String(e) });
    } finally {
      setRodando(false);
    }
  };

  return (
    <div className="card mt-16" style={{ borderColor: "var(--border-brand)" }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Ver quem sairia agora</p>

      <p className="text-dim" style={{ marginTop: 0, fontSize: 14 }}>
        Roda o motor <strong>sem enviar nada</strong> e mostra a lista de quem sairia
        pelo número da empresa neste momento — e, para cada pessoa que ficou de fora,
        o motivo. Nada é enviado nem registrado: dá para apertar quantas vezes quiser.
      </p>

      {modo === "off" && (
        <p className="badge badge-warn" style={{ whiteSpace: "normal", textAlign: "left" }}>
          O modo está <strong>Desligado</strong> — a simulação vai devolver "a automação
          está desligada" e mais nada. Escolha <strong>Simulação</strong> acima e salve
          as regras antes de rodar.
        </p>
      )}

      <button type="button" className="btn btn-primary" onClick={rodar} disabled={rodando}>
        {rodando ? "calculando…" : "▶ Rodar simulação"}
      </button>

      {r && !r.ok && (
        <p className="badge badge-danger" style={{ marginTop: 12, whiteSpace: "normal", textAlign: "left" }}>
          {r.erro}
        </p>
      )}

      {r && r.ok && (
        <div style={{ marginTop: 16 }}>
          <div className="row wrap" style={{ gap: 10, alignItems: "baseline" }}>
            <span className={r.sairiam > 0 ? "badge badge-success" : "badge"}>
              {r.sairiam} sairiam agora
            </span>
            <span className="text-faint" style={{ fontSize: 13 }}>
              de {r.avaliados} avaliados
            </span>
          </div>

          {/* O `porque` do plano explica o caso em que NADA sai — fora da janela
              de horário, teto do dia esgotado, modo desligado. Sem ele, uma
              lista vazia é indistinguível de um defeito. */}
          <p className="text-dim" style={{ fontSize: 13, marginTop: 8 }}>{r.porque}</p>

          {r.avaliados === 0 ? (
            <p className="text-dim" style={{ fontSize: 14, marginBottom: 0 }}>
              Nenhum contato da fila está marcado para sair pelo número da empresa. Isso
              é o esperado se só a <strong>reativação</strong> estiver ligada e ninguém
              estiver na etapa de ex-aluno com toque vencido — confira em{" "}
              <strong>Por onde cada motivo sai</strong>, logo acima.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
              {[...r.linhas].sort((a, b) => Number(b.sai) - Number(a.sai)).map((l, i) => (
                <li
                  key={`${l.nome}-${i}`}
                  style={{ padding: "8px 0", borderTop: "1px solid var(--border)" }}
                >
                  <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
                    <span
                      className={l.sai ? "badge badge-success" : "badge"}
                      style={{ minWidth: 64, justifyContent: "center" }}
                    >
                      {l.sai ? "sai" : "fica"}
                    </span>
                    <strong style={{ fontSize: 14 }}>{l.nome}</strong>
                    <span className="text-faint" style={{ fontSize: 12 }}>{l.motivo}</span>
                  </div>
                  {!l.sai && (
                    <p className="text-dim" style={{ fontSize: 12, margin: "4px 0 0 72px" }}>
                      {l.motivoDaRecusa}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
