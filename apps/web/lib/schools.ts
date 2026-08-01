// Escola de venda: a dimensão que diz COM QUE TÉCNICA a situação foi resolvida.
//
// Antes disto, `technique` era texto livre — 134 rótulos distintos para 134
// entradas, impossível de medir e de aprender. A escola é enum canônico e a
// resolução tem duas camadas:
//
//   entrada.school  ??  manifesto.strategy_map[categoria]
//
// O mapa é POR SEGMENTO de propósito: Rackham mostrou que fechamento por
// pressão sobe conversão em ticket baixo e a derruba em ticket alto. O núcleo
// não sabe o que é barbearia nem indústria — só lê o mapa que o manifesto
// declarou (Lei 1).
//
// Ver docs/blueprint/COS_Escolas_de_Venda.md

import { createAdminClient } from "@/lib/supabase/admin";

export type School = {
  key: string;
  name: string;
  author: string;
  principle: string;
  when_to_use: string;
  when_to_avoid: string;
  evidence: string;
  evidence_note: string;
};

export type StrategyMap = Record<string, string>;

/** Qual escola governa esta entrada. NULL na entrada = padrão da categoria. */
export function resolveSchool(
  entry: { category?: string | null; school?: string | null },
  strategyMap: StrategyMap | null | undefined,
): string | null {
  if (entry.school) return entry.school;
  const cat = entry.category ?? "";
  return strategyMap?.[cat] ?? null;
}

/**
 * O dicionário das escolas. É dado de produto (métodos publicados), não a
 * curadoria — por isso pode ser lido; a estratégia continua server-side.
 */
export async function loadSchools(): Promise<Map<string, School>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("sales_schools")
    .select("key, name, author, principle, when_to_use, when_to_avoid, evidence, evidence_note");
  return new Map(((data as School[] | null) ?? []).map((s) => [s.key, s]));
}

/**
 * Bloco compacto para o prompt: só as escolas realmente em jogo, uma vez cada.
 * Enviar o dicionário inteiro por entrada seria repetir texto e pagar por isso.
 * `when_to_avoid` vai junto porque é o que impede o motor de fechar com pressão
 * numa venda de ciclo longo.
 */
export function schoolsBlock(keys: (string | null)[], dict: Map<string, School>): string {
  const unicas = [...new Set(keys.filter((k): k is string => !!k))];
  const linhas = unicas
    .map((k) => dict.get(k))
    .filter((s): s is School => !!s)
    .map((s) => `- ${s.name} (${s.author}): ${s.principle}\n  Usar quando: ${s.when_to_use}\n  NÃO usar quando: ${s.when_to_avoid}`);
  return linhas.length ? linhas.join("\n") : "(nenhuma escola declarada para esta situação)";
}
