"use client";

import { useState } from "react";
import { applyStage } from "./ai-actions";

/**
 * MOVER A ETAPA SEM SAIR DA CONVERSA.
 *
 * Antes, para avançar o cliente na jornada o vendedor precisava abrir o
 * cadastro, mudar o campo e voltar. Isso acontece na tela em que ele passa o
 * dia, com o cliente esperando do outro lado — e cada ida e volta custa
 * atenção na pior hora possível.
 *
 * POR QUE ISTO NÃO DUPLICA O BOTÃO DA IA. Aquele aplica a etapa que o MODELO
 * sugeriu, e só aparece quando ele sugeriu alguma. Este é para quando ele não
 * sugeriu, ou sugeriu diferente do que o vendedor sabe — porque a pessoa
 * acabou de dizer algo no telefone que não está escrito em lugar nenhum. O
 * julgamento de quem está na conversa vence o do modelo, sempre.
 *
 * O registro é o mesmo dos dois lados: `applyStage` grava em
 * `contact_stage_history`, que é append-only. Mudança de etapa sem histórico
 * apagaria a única série temporal que o produto tem da jornada.
 */
export function MoverEtapa({
  contactId,
  atual,
  stages,
}: {
  contactId: string;
  atual: string;
  stages: { key: string; label: string }[];
}) {
  const [stage, setStage] = useState(atual);
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mudar = async (novo: string) => {
    setStage(novo);
    if (novo === atual) return;
    setSalvando(true);
    setErro(null);
    setOk(false);
    try {
      const r = await applyStage(contactId, novo, "Movido pelo vendedor na conversa");
      if (r.ok) setOk(true);
      else setErro("Não consegui mover.");
    } catch {
      setErro("Não consegui mover.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="row wrap" style={{ gap: 8, alignItems: "center", marginTop: 12 }}>
      <span className="text-faint" style={{ fontSize: 12 }}>Etapa:</span>
      <select
        value={stage}
        onChange={(e) => mudar(e.target.value)}
        disabled={salvando}
        style={{ width: "auto" }}
        aria-label="Mover para outra etapa"
      >
        {stages.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
      {salvando && <span className="text-faint" style={{ fontSize: 12 }}>movendo…</span>}
      {ok && <span className="badge badge-success">movido</span>}
      {erro && <span className="badge badge-danger">{erro}</span>}
    </div>
  );
}
