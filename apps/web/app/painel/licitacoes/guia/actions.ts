"use server";

import { generateText } from "ai";
import { getActiveTenant } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { aiModel, AI_MODEL, hasAIKey, keyHint, estimateCostCents, tokensOf } from "@/lib/ai";
import { GOV_GUIDE } from "@/lib/govGuide";
import { verificarCota } from "@/lib/cota-db";

export type QaResult =
  | { ok: true; answer: string }
  | { ok: false; error: string }
  | { ok: false; limite: true; mensagem: string };

export async function perguntarLicitacoes(question: string): Promise<QaResult> {
  if (!hasAIKey()) return { ok: false, error: "Chave de IA não configurada." };
  const q = (question ?? "").trim();
  if (!q) return { ok: false, error: "Escreva sua pergunta." };

  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };

  // Assistente de licitações: sem cota de contagem própria, mas dentro dos
  // tetos de dinheiro — da empresa e do fabricante.
  const cota = await verificarCota(tenant.id, "analise");
  if (!cota.permitido) return { ok: false, limite: true, mensagem: cota.mensagem! };

  const playbook = GOV_GUIDE.map((x) => `P: ${x.p}\nR: ${x.r}`).join("\n\n");
  const system = `Você é um especialista em vendas ao setor público (licitações) que orienta o vendedor de forma prática, direta e amigável, em português do Brasil.
Responda USANDO o material do PLAYBOOK abaixo. Se a pergunta fugir do material, dê o princípio geral e recomende ler o edital específico ou buscar assessoria — NUNCA invente regra, prazo, valor ou artigo de lei. Seja conciso.

PLAYBOOK:
${playbook}`;

  try {
    const res = await generateText({ model: aiModel, system, prompt: q });
    const t = tokensOf(res.usage);
    try {
      const admin = createAdminClient();
      await admin.from("usage_ledger").insert({
        tenant_id: tenant.id,
        feature: "licitacoes_qa",
        model: AI_MODEL,
        tokens_in: t.in,
        tokens_out: t.out,
        cost_cents: estimateCostCents(t.in, t.out),
      });
    } catch {
      // medição best-effort
    }
    return { ok: true, answer: res.text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Erro no motor de IA: ${msg} — [${keyHint()}]` };
  }
}
