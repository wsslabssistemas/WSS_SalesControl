"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveTenant } from "@/lib/auth";
import { aiModel, AI_MODEL, hasAIKey, keyHint, estimateCostCents, tokensOf } from "@/lib/ai";
import { measureTerms, type Sugestao } from "@/lib/licitacoes";

export type SugestaoResult = { ok: true; termos: Sugestao[] } | { ok: false; error: string };

const schema = z.object({
  termos: z
    .array(z.string())
    .describe("8 a 12 termos de busca, minúsculos, sem acento, 1 a 3 palavras cada, como aparecem em editais públicos brasileiros."),
});

async function logUso(tenantId: string, usage: unknown, feature: string) {
  const t = tokensOf(usage);
  try {
    const admin = createAdminClient();
    await admin.from("usage_ledger").insert({
      tenant_id: tenantId,
      feature,
      model: AI_MODEL,
      tokens_in: t.in,
      tokens_out: t.out,
      cost_cents: estimateCostCents(t.in, t.out),
    });
  } catch {
    // medição best-effort
  }
}

/**
 * A IA propõe os termos que ÓRGÃOS PÚBLICOS usam para o que a empresa vende
 * (ancorada no DNA), e cada termo é validado contra o PNCP com a contagem real.
 */
export async function sugerirPalavras(): Promise<SugestaoResult> {
  if (!hasAIKey()) return { ok: false, error: "Chave de IA não configurada." };
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };

  try {
    const supabase = await createClient();
    const [{ data: dna }, { data: t }] = await Promise.all([
      supabase.from("commercial_dna").select("sections").eq("tenant_id", tenant.id).eq("is_current", true).maybeSingle(),
      supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle(),
    ]);

    const settings = (t?.settings as Record<string, unknown> | null) ?? {};
    const gov = (settings.gov_icp as { ufs?: string[]; keywords?: string[] } | undefined) ?? {};
    const ufs = gov.ufs ?? [];
    if (!ufs.length) return { ok: false, error: "Defina ao menos um estado no perfil." };

    const sections = (dna?.sections as Record<string, unknown> | null) ?? {};
    const dnaTexto = Object.entries(sections)
      .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join("\n")
      .slice(0, 4000);

    const system = `Você conhece o vocabulário de compras públicas brasileiras. Órgãos escrevem o objeto e os itens do edital com termos próprios, muitas vezes diferentes do nome comercial do produto (ex.: quem vende "termostato" deve buscar por "climatizador", "ar condicionado", "condicionador de ar", "camara fria").
Sua tarefa: dado o que a empresa vende, liste os termos de busca que MAIS PROVAVELMENTE aparecem em editais para esses produtos.
Regras: minúsculas, SEM acento, 1 a 3 palavras por termo, nada de nomes de marca, nada de termos genéricos de licitação (aquisicao, contratacao, material, equipamento). Prefira o nome do produto/serviço como o órgão escreveria.`;

    const prompt = `EMPRESA (segmento ${tenant.skill_key})
O que ela vende (DNA):
${dnaTexto || "(DNA vazio)"}

Palavras que ela já usa hoje: ${(gov.keywords ?? []).join(", ") || "(nenhuma)"}

Liste os termos de busca para encontrar editais destes produtos.`;

    const res = await generateObject({ model: aiModel, schema, system, prompt });
    await logUso(tenant.id, res.usage, "sugestao_palavras");

    const propostos = (res.object as { termos: string[] }).termos ?? [];
    const atuais = new Set((gov.keywords ?? []).map((k) => k.trim().toLowerCase()));
    const medidos = await measureTerms(propostos, ufs);

    return {
      ok: true,
      termos: medidos.map((m) => ({ ...m, atual: atuais.has(m.termo.toLowerCase()) })),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Erro no motor de IA: ${msg} — [${keyHint()}]` };
  }
}
