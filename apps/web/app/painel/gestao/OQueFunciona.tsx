import { medir, porOrigem, N_MINIMO_ESCOLA, type Evento, type Leitura } from "@/lib/aprendizado";

/**
 * O QUE FUNCIONA AQUI — a leitura do que a casa já sabe, com o n na tela.
 *
 * ⚠ A TELA FOI DESENHADA PARA NÃO VIRAR PÓDIO.
 *
 * A pergunta do fundador foi "o sistema deveria entender qual técnica funciona
 * e usar sempre ela" — e ele mesmo trouxe a objeção: *"teria que ter dado
 * suficiente para decidir"*. Está certo, e o banco prova: contando fechamento
 * puro, `challenger` lidera com 7,1% em **um** fechamento de 14 usos, e
 * `negociacao_voss` some com 0% em 55.
 *
 * Três decisões de desenho que impedem essa leitura:
 *
 *   1. **A ordem é por VOLUME, nunca por taxa.** A primeira linha de uma
 *      lista é lida como recomendação, esteja escrito o que estiver ao lado.
 *   2. **"Acima" e "abaixo" só aparecem quando os intervalos não se tocam.**
 *      58% e 52% com margem de 7 pontos são o mesmo número dito duas vezes.
 *   3. **Abaixo do piso não existe percentual** — existe "ainda não sei",
 *      escrito com todas as letras. Percentual, uma vez mostrado, é lido como
 *      verdade.
 *
 * E o que a tela mede é RESPOSTA, não fechamento — porque é o que sustenta
 * hoje (centenas de eventos contra 14) e porque é o que a tese do produto
 * pede: perde-se 3,5× mais gente por silêncio do que por objeção.
 */
export function OQueFunciona({
  eventos,
  rotuloEscola,
}: {
  eventos: Evento[];
  rotuloEscola: (k: string) => string;
}) {
  if (!eventos.length) {
    return (
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15, margin: 0 }}>O que funciona aqui</h2>
        <p className="text-dim" style={{ fontSize: 14, marginTop: 8 }}>
          Nenhum desfecho registrado ainda. Esta leitura nasce do feedback que a
          equipe marca no Responder — sem ele, o sistema aplica a técnica da
          biblioteca e nunca descobre se ela funcionou nesta casa.
        </p>
      </section>
    );
  }

  const geral = medir(eventos, "resposta", "todas as origens");
  const fechamento = medir(eventos, "fechamento", "todas as origens");
  const origens = [...porOrigem(eventos)]
    .filter(([, evs]) => evs.length >= N_MINIMO_ESCOLA)
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <section style={{ marginTop: 32 }}>
      <div className="between" style={{ alignItems: "baseline" }}>
        <h2 style={{ fontSize: 15, margin: 0 }}>O que funciona aqui</h2>
        <span className="text-faint" style={{ fontSize: 13 }}>
          {eventos.length} desfechos · piso de {N_MINIMO_ESCOLA} usos
        </span>
      </div>
      <p className="text-dim" style={{ fontSize: 13, margin: "6px 0 0" }}>
        Mede se a mensagem <strong>tirou a pessoa do silêncio</strong> — que é a
        perda real do funil e a única com amostra suficiente hoje. A biblioteca
        continua decidindo a técnica; isto é observação da casa, não instrução.
      </p>

      <Tabela leitura={geral} rotulo={rotuloEscola} />

      {/* O FECHAMENTO APARECE, E APARECE PARA MOSTRAR QUE NÃO DÁ PARA LER.
          Esconder faria a pergunta voltar toda semana; mostrar com "não sei"
          responde de uma vez e ensina por quê. */}
      <details style={{ marginTop: 14 }}>
        <summary className="text-faint" style={{ fontSize: 13, cursor: "pointer" }}>
          E por fechamento? (quase nada sustenta — veja por quê)
        </summary>
        <p className="text-faint" style={{ fontSize: 12, margin: "8px 0 0" }}>
          Fechamento é raro por construção: {fechamento.base.sucessos} em{" "}
          {fechamento.base.usos} desfechos. Com esse volume, quase toda
          diferença cabe dentro da margem de erro — e uma escola com 1
          fechamento em 14 usos apareceria em primeiro lugar.
        </p>
        <Tabela leitura={fechamento} rotulo={rotuloEscola} />
      </details>

      {origens.length > 1 && (
        <div style={{ marginTop: 20 }}>
          <p className="eyebrow" style={{ marginBottom: 2 }}>Por origem</p>
          <p className="text-faint" style={{ fontSize: 12, margin: "0 0 10px" }}>
            Origens não se somam. Quem vem de convênio não está comprando — está
            usando um benefício que a empresa dele já paga. Somar numa taxa só
            mede duas coisas diferentes e chama de uma.
          </p>
          {origens.map(([origem, evs]) => (
            <Tabela key={origem} leitura={medir(evs, "resposta", `origem: ${origem}`)} rotulo={rotuloEscola} />
          ))}
        </div>
      )}
    </section>
  );
}

function Tabela({ leitura, rotulo }: { leitura: Leitura; rotulo: (k: string) => string }) {
  const pct = (t: number | null, m: number | null) =>
    t === null || m === null ? null : `${Math.round(t * 100)}% ±${Math.round(m * 100)}`;
  const base = pct(leitura.base.taxa, leitura.base.margem);

  return (
    <div className="card mt-16" style={{ padding: 0, overflowX: "auto" }}>
      <div className="between" style={{ padding: "10px 14px 0", alignItems: "baseline" }}>
        <strong style={{ fontSize: 13 }}>{leitura.recorte}</strong>
        <span className="text-faint" style={{ fontSize: 12 }}>
          média da casa: {base ?? "—"} (n={leitura.base.usos})
        </span>
      </div>
      {leitura.aviso && (
        <p className="text-faint" style={{ fontSize: 12, padding: "6px 14px 0", margin: 0 }}>
          ⚠ {leitura.aviso}
        </p>
      )}
      <table className="table" style={{ marginTop: 8 }}>
        <thead>
          <tr>
            <th>Escola</th>
            <th style={{ textAlign: "right" }}>Usos</th>
            <th style={{ textAlign: "right" }}>Taxa</th>
            <th style={{ textAlign: "right" }}>Contra a média</th>
          </tr>
        </thead>
        <tbody>
          {leitura.escolas.map((e) => {
            const t = pct(e.taxa, e.margem);
            return (
              <tr key={e.escola}>
                <td>{rotulo(e.escola)}</td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{e.usos}</td>
                <td
                  style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                  className={t ? undefined : "text-faint"}
                >
                  {t ?? "amostra pequena"}
                </td>
                <td style={{ textAlign: "right" }}>
                  {e.contraBase === "acima" && <span className="badge badge-success">acima</span>}
                  {e.contraBase === "abaixo" && <span className="badge badge-danger">abaixo</span>}
                  {e.contraBase === "indistinto" && (
                    <span className="text-faint" style={{ fontSize: 12 }}>igual à média</span>
                  )}
                  {e.contraBase === "nao_sei" && (
                    <span className="text-faint" style={{ fontSize: 12 }}>ainda não sei</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
