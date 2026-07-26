import { createAnthropic } from "@ai-sdk/anthropic";

// Modelo configurável por ambiente. Padrão: Claude Sonnet (qualidade de escrita).
// Para baratear, defina AI_MODEL=claude-haiku-4-5-20251001 na Vercel.
export const AI_MODEL = process.env.AI_MODEL ?? "claude-sonnet-5";

export function hasAIKey(): boolean {
  return !!process.env.AI_API_KEY;
}

const anthropic = createAnthropic({ apiKey: process.env.AI_API_KEY });
export const aiModel = anthropic(AI_MODEL);

// Estimativa de custo em CENTAVOS de R$ (o painel do fabricante mostra em R$).
// Taxas em USD por 1M de tokens — ajuste aos preços vigentes por ambiente.
export function estimateCostCents(inTok: number, outTok: number): number {
  const IN_PER_M = Number(process.env.AI_IN_PER_M ?? 3);
  const OUT_PER_M = Number(process.env.AI_OUT_PER_M ?? 15);
  const USD_BRL = Number(process.env.USD_BRL ?? 5.5);
  const usd = (inTok / 1e6) * IN_PER_M + (outTok / 1e6) * OUT_PER_M;
  return Math.round(usd * USD_BRL * 100);
}

// Normaliza o objeto de uso entre versões do SDK.
export function tokensOf(usage: unknown): { in: number; out: number } {
  const u = (usage ?? {}) as Record<string, number | undefined>;
  return {
    in: u.inputTokens ?? u.promptTokens ?? 0,
    out: u.outputTokens ?? u.completionTokens ?? 0,
  };
}
