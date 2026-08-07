import { semAmostra, type Placar } from "@/lib/placar";

const tempo = (min: number | null) =>
  min === null ? "—" : min < 60 ? `${min} min` : `${Math.round((min / 60) * 10) / 10} h`;

/**
 * O PLACAR NA TELA.
 *
 * O TIME VEM PRIMEIRO e ocupa o espaço maior — onde a comissão é coletiva, o
 * número que cobra é o do time; o individual serve para a pessoa se situar
 * dentro dele, não para ranquear gente.
 *
 * E a conversão só aparece como percentual quando a amostra sustenta. Abaixo
 * do piso a tela diz "amostra pequena" em vez de mostrar 0% — porque
 * percentual, uma vez mostrado, é lido como verdade, e ninguém volta para
 * conferir o denominador.
 */
export function PlacarDaEquipe({ placar, periodo }: { placar: Placar; periodo: string }) {
  const { time, pessoas } = placar;

  return (
    <section style={{ marginTop: 32 }}>
      <div className="between" style={{ alignItems: "baseline" }}>
        <h2 style={{ fontSize: 15, margin: 0 }}>Placar</h2>
        <span className="text-faint" style={{ fontSize: 13 }}>{periodo}</span>
      </div>

      {/* O TIME */}
      <div className="card mt-16" style={{ borderColor: "var(--border-brand)", background: "var(--brand-gradient-soft)" }}>
        <div className="row wrap" style={{ gap: 24 }}>
          <div>
            <div className="stat-num">{time.atendimentos}</div>
            <div className="stat-label">Atendimentos do time</div>
          </div>
          <div>
            <div className="stat-num">{time.fechamentos}</div>
            <div className="stat-label">Fechamentos</div>
          </div>
          <div>
            <div className="stat-num">{tempo(time.respostaMediana)}</div>
            <div className="stat-label">Resposta (mediana)</div>
          </div>
          <div>
            <div className="stat-num" style={{ color: time.combinadosAtrasados ? "var(--warn)" : undefined }}>
              {time.combinadosAtrasados}
            </div>
            <div className="stat-label">Combinados vencidos</div>
          </div>
          <div>
            <div className="stat-num">
              {time.conversao !== null ? `${time.conversao}%` : "—"}
            </div>
            <div className="stat-label">
              {time.conversao !== null ? `Conversão (n=${time.nConversao})` : semAmostra(time.nConversao)}
            </div>
          </div>
        </div>
      </div>

      {/* CADA UM */}
      <div className="card mt-16" style={{ padding: 0, overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Quem</th>
              <th>Atendimentos</th>
              <th>Resposta</th>
              <th>Combinados vencidos</th>
              <th>Fechamentos</th>
              <th>Conversão</th>
            </tr>
          </thead>
          <tbody>
            {pessoas.map((p) => (
              <tr key={p.ownerId}>
                <td>{p.nome}</td>
                <td><strong>{p.atendimentos}</strong></td>
                <td>{tempo(p.respostaMediana)}</td>
                <td className={p.combinadosAtrasados ? "text-dim" : "text-faint"}>{p.combinadosAtrasados}</td>
                <td>{p.fechamentos}</td>
                <td className="text-dim" style={{ fontSize: 13 }}>
                  {p.conversao !== null ? `${p.conversao}% (n=${p.nConversao})` : semAmostra(p.nConversao)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-faint" style={{ fontSize: 12, marginTop: 10 }}>
        A lista é ordenada por <strong>atendimento</strong>, não por resultado. Conversão
        depende de origem do lead, ticket e sorte; atendimento, tempo de resposta e
        combinado cumprido dependem de quem atende — e por isso são esses que aparecem
        primeiro. Percentual só é mostrado quando a amostra sustenta.
      </p>
    </section>
  );
}
