// Qualificação de compra (MEDDIC-lite) — o que se sabe do negócio e,
// principalmente, **o que ainda falta saber**.
//
// Sem imports, para ser testável em Node puro.
//
// O VALOR ESTÁ NA LACUNA, não no preenchido. Um CRM comum mostra os campos
// que a pessoa preencheu; isso é arquivo. O que muda uma venda é o motor saber
// que ninguém descobriu quem assina — e puxar essa descoberta na hora certa,
// com UMA pergunta. Rackham: dez perguntas de situação seguidas viram
// interrogatório, e o cliente sente que está preenchendo formulário.
//
// AS OPÇÕES E OS RÓTULOS NÃO MORAM AQUI. Eles vêm do manifesto do segmento,
// que já chega à tela e ao motor. Aqui ficam só as quatro CHAVES canônicas —
// e `qualificacao_test.mjs` lê o `skill-loader` e o compara com esta lista,
// porque cópia que ninguém confere é cópia que diverge.

export const QUALIFICATION_KEYS = [
  "verba",
  "processo_decisao",
  "criterio_decisao",
  "defensor_interno",
] as const;

export type CampoDoManifesto = { key: string; label: string; options?: string[] };

export type Qualificacao = {
  /** O que já foi descoberto, com o rótulo do ramo. */
  conhecido: { label: string; valor: string }[];
  /** O que ninguém descobriu ainda — a parte que interessa. */
  faltando: { key: string; label: string }[];
  /** Quantos dos campos oferecidos por este segmento já têm resposta. */
  cobertura: { preenchidos: number; total: number };
};

/** `verba_prevista` → `verba prevista`. Enum é para medir; texto é para ler. */
const legivel = (v: string) => v.replace(/_/g, " ");

/**
 * `indefinido` conta como NÃO SABIDO, de propósito.
 *
 * É a diferença entre "perguntei e ele não sabe" e "ninguém perguntou" — e, do
 * ponto de vista do que fazer agora, as duas pedem a mesma coisa: descobrir.
 * Tratar `indefinido` como preenchido faria o motor parar de puxar justamente
 * o campo que alguém abriu, olhou e deixou em branco.
 */
const vazio = (v: unknown) =>
  v == null || v === "" || v === "indefinido" || v === "nao_sei";

export function lerQualificacao(
  camposDoManifesto: CampoDoManifesto[],
  custom: Record<string, unknown> | null | undefined,
): Qualificacao {
  const chaves = new Set<string>(QUALIFICATION_KEYS);
  const campos = camposDoManifesto.filter((f) => chaves.has(f.key));

  const conhecido: { label: string; valor: string }[] = [];
  const faltando: { key: string; label: string }[] = [];

  for (const f of campos) {
    const v = custom?.[f.key];
    if (vazio(v)) faltando.push({ key: f.key, label: f.label });
    else conhecido.push({ label: f.label, valor: legivel(String(v)) });
  }

  return { conhecido, faltando, cobertura: { preenchidos: conhecido.length, total: campos.length } };
}

/**
 * O bloco que entra no prompt. Vazio quando o segmento não usa qualificação —
 * barbearia não tem processo de aprovação, e um bloco vazio no prompt é ruído
 * que o modelo tenta preencher.
 *
 * A instrução de descobrir é deliberadamente contida: **uma** pergunta, e só
 * quando couber na conversa. O motor que responde preço com um questionário de
 * qualificação perde a venda que ia fechar.
 */
export function blocoParaPrompt(q: Qualificacao): string {
  if (!q.cobertura.total) return "";

  const linhas: string[] = [];
  if (q.conhecido.length) {
    linhas.push("QUALIFICAÇÃO DA COMPRA (já descoberto):");
    for (const c of q.conhecido) linhas.push(`- ${c.label}: ${c.valor}`);
  }
  if (q.faltando.length) {
    linhas.push(
      `AINDA NÃO SE SABE: ${q.faltando.map((f) => f.label.toLowerCase()).join("; ")}.`,
      "Se — e só se — couber naturalmente nesta conversa, faça UMA pergunta para descobrir UM desses pontos.",
      "Nunca faça duas. Nunca transforme a resposta em questionário: responder o que ele perguntou vem primeiro.",
    );
  }
  return linhas.join("\n");
}
