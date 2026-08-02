// A trava anti-invenção, em código.
//
// Até ago/2026 ela era 100% prompt: pedíamos ao modelo que escalasse quando
// faltasse fato, e confiávamos no julgamento dele. Enquanto isso, cada entrada
// da biblioteca já declarava `required_facts` e `on_missing_facts` — o contrato
// curado há meses — e esse campo era buscado do banco e **nunca usado**.
//
// O CLAUDE.md é explícito: "prompt não resolve essa classe de erro; verificação
// estrutural resolve". Aqui está a verificação estrutural.
//
// Regra: se uma das entradas que governam a resposta exige um fato que NÃO
// existe no DNA e declara `escalate`, o motor escala — independente do que o
// modelo achar.

/** Entradas da biblioteca, no mínimo que esta checagem precisa. */
export type EntryFacts = {
  category?: string | null;
  required_facts?: string[] | null;
  on_missing_facts?: string | null;
};

export type FactCheck = {
  /** Caminhos `secao.campo` exigidos e ausentes do DNA. */
  faltando: string[];
  /** true = alguma entrada `escalate` ficou sem fato exigido. Não redigir. */
  travou: boolean;
};

/**
 * Duas janelas, de propósito:
 *
 * • VETO — só a entrada que GOVERNA a resposta (a que casou melhor) pode
 *   travar. Provado em campo: para "qual a faixa de preço?", o DNA tinha
 *   `pricing.range` (exatamente o que o cliente pediu), mas uma outra entrada
 *   do top 3 exigia `pricing.plans` — e o motor se recusou a responder o que
 *   sabia. Escalada indevida é tão ruim quanto invenção: mata o produto.
 *
 * • AVISO — as 3 primeiras contribuem a lista de fatos ausentes, para o motor
 *   saber o que NÃO pode afirmar, mesmo sem travar.
 */
const JANELA_VETO = 1;
const JANELA_AVISO = 3;

function vazio(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

/** O DNA tem este fato? Caminho é sempre `secao.campo`. */
export function temFato(sections: Record<string, unknown> | null | undefined, caminho: string): boolean {
  const [secao, campo] = String(caminho ?? "").split(".");
  if (!secao || !campo) return false;
  const bloco = (sections ?? {})[secao];
  if (bloco == null || typeof bloco !== "object") return false;
  return !vazio((bloco as Record<string, unknown>)[campo]);
}

/**
 * Cruza o que a biblioteca exige com o que o DNA tem.
 *
 * `omit` também reporta o fato ausente (para o motor não afirmar o que não
 * sabe), mas não trava: prova opcional que falta sai da resposta em silêncio.
 * `escalate` trava — é o caso de número e compromisso, onde inventar é caro.
 */
export function checkRequiredFacts(
  sections: Record<string, unknown> | null | undefined,
  entries: EntryFacts[],
  janelaAviso = JANELA_AVISO,
): FactCheck {
  const faltando = new Set<string>();
  let travou = false;

  entries.slice(0, janelaAviso).forEach((e, posicao) => {
    for (const caminho of e.required_facts ?? []) {
      if (temFato(sections, caminho)) continue;
      faltando.add(caminho);
      const manda = (e.on_missing_facts ?? "escalate") === "escalate";
      if (manda && posicao < JANELA_VETO) travou = true;
    }
  });

  return { faltando: [...faltando], travou };
}
