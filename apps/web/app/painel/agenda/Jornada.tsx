"use client";

import { useState } from "react";
import { salvarJornada } from "./horarios-actions";

const DIAS = [
  { n: 1, nome: "Segunda" }, { n: 2, nome: "Terça" }, { n: 3, nome: "Quarta" },
  { n: 4, nome: "Quinta" }, { n: 5, nome: "Sexta" }, { n: 6, nome: "Sábado" },
  { n: 0, nome: "Domingo" },
];

export type RegraAtual = { weekday: number; starts_at: string; ends_at: string };

export default function Jornada({ regras }: { regras: RegraAtual[] }) {
  const [aberto, setAberto] = useState(regras.length === 0);
  const doDia = (d: number) => regras.find((r) => r.weekday === d);
  const hhmm = (t?: string) => (t ? t.slice(0, 5) : "");

  return (
    <div className="card mt-16">
      <div className="between wrap" style={{ gap: 10, alignItems: "baseline" }}>
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Horário de atendimento</p>
          <p className="text-dim" style={{ margin: "4px 0 0", fontSize: 13 }}>
            {regras.length === 0
              ? "Sem isso o sistema não sabe o que está livre e não consegue marcar."
              : `${regras.length} dia(s) configurado(s). É daqui que saem os horários oferecidos ao cliente.`}
          </p>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAberto((v) => !v)}>
          {aberto ? "Fechar" : "Editar horários"}
        </button>
      </div>

      {!aberto && regras.length > 0 && (
        <div className="row wrap mt-16" style={{ gap: 8 }}>
          {DIAS.filter((d) => doDia(d.n)).map((d) => (
            <span key={d.n} className="badge">
              {d.nome}: {hhmm(doDia(d.n)!.starts_at)}–{hhmm(doDia(d.n)!.ends_at)}
            </span>
          ))}
        </div>
      )}

      {aberto && (
        <form action={salvarJornada} className="mt-16">
          <div className="stack" style={{ gap: 8 }}>
            {DIAS.map((d) => {
              const r = doDia(d.n);
              return (
                <div key={d.n} className="row wrap" style={{ gap: 10, alignItems: "center" }}>
                  <label className="row" style={{ gap: 7, width: 130 }}>
                    <input type="checkbox" name={`ativo_${d.n}`} defaultChecked={!!r} style={{ width: "auto" }} />
                    <span style={{ fontSize: 14 }}>{d.nome}</span>
                  </label>
                  <input type="time" name={`inicio_${d.n}`} defaultValue={hhmm(r?.starts_at) || "09:00"} style={{ width: 120 }} />
                  <span className="text-faint">até</span>
                  <input type="time" name={`fim_${d.n}`} defaultValue={hhmm(r?.ends_at) || "18:00"} style={{ width: 120 }} />
                </div>
              );
            })}
          </div>
          <button type="submit" className="btn btn-primary mt-16">Salvar horários</button>
          <p className="text-faint" style={{ marginTop: 10, marginBottom: 0, fontSize: 12 }}>
            Marque os dias em que atende. O sistema calcula os horários livres
            descontando o que já está marcado.
          </p>
        </form>
      )}
    </div>
  );
}
