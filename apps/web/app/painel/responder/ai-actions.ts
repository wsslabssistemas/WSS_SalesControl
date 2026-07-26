"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { matchEntries } from "@/lib/match";
import { aiModel, AI_MODEL, hasAIKey, estimateCostCents, tokensOf } from "@/lib/ai";
import { revalidatePath } from "next/cache";

export type GerarResult =
  | { ok: true; data: AiAnswer }
  | { ok: false; error: string };

export type AiAnswer = {
  resposta_sugerida: string;
  objetivo: string;
  explicacao: string;
  tecnica: string;
  proximo_passo: string;
  etapa_jornada: string;
  emocao: string;
  status_sugerido: string;
  motivo_status: string;
  faltam_fatos: string[];
  escalar: boolean;
};

const schema = z.object({
  resposta_sugerida: z.string().describe("A resposta pronta para o vendedor copiar e enviar ao cliente, em PT-BR, natural e concisa. Vazia se for para escalar."),
  objetivo: z.string().describe("O objetivo desta resposta em uma frase."),
  explicacao: z.string().describe("Por que esta resposta funciona — ensina o vendedor."),
  tecnica: z.string().describe("A técnica de venda escolhida e o mestre de referência (ex.: Puppy Dog Close — Tracy)."),
  proximo_passo: z.string().describe("O próximo passo recomendado após esta resposta."),
  etapa_jornada: z.string().describe("A etapa da jornada em que o cliente parece estar."),
  emocao: z.string().describe("A emoção dominante identificada no cliente."),
  status_sugerido: z.string().describe("A CHAVE de uma etapa da jornada para avançar o cliente, ou string vazia se não houver avanço claro."),
  motivo_status: z.string().describe("Por que sugeriu esse avanço de etapa, ou string vazia."),
  faltam_fatos: z.array(z.string()).describe("Fatos necessários que NÃO estão no DNA e seriam precisos para responder com segurança."),
  escalar: z.boolean().describe("true se faltam fatos essenciais e a resposta deve ser escalada a um humano em vez de inventada."),
});

function fatos(sections: Record<string, unknown>): string {
  const out: string[] = [];
  for (const [k, v] of Object.entries(sections ?? {})) {
    if (v == null || (typeof v === "object" && Object.keys(v).length === 0)) continue;
    out.push(`### ${k}\n${typeof v === "string" ? v : JSON.stringify(v, null, 2)}`);
  }
  return out.length ? out.join("\n\n") : "(DNA vazio — nenhum fato cadastrado)";
}

export async function gerarResposta(input: {
  contactId?: string;
  message: string;
}): Promise<GerarResult> {
  if (!hasAIKey()) return { ok: false, error: "Chave de IA não configurada (AI_API_KEY)." };
  const message = (input.message ?? "").trim();
  if (!message) return { ok: false, error: "Cole a mensagem do cliente." };

  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };

  const supabase = await createClient();
  const { stages } = await getSkillFormConfig(tenant.skill_key);

  const [{ data: skill }, { data: dna }, { data: entriesData }] = await Promise.all([
    supabase.from("skills").select("manifest").eq("key", tenant.skill_key).maybeSingle(),
    supabase.from("commercial_dna").select("sections").eq("tenant_id", tenant.id).eq("is_current", true).maybeSingle(),
    supabase
      .from("knowledge_entries")
      .select("category, trigger_questions, strategy, technique, answer, common_errors, next_objective, required_facts, hard_rules")
      .eq("tenant_id", tenant.id)
      .eq("source", "tenant")
      .eq("status", "active"),
  ]);

  const manifest = (skill?.manifest as Record<string, unknown> | null) ?? {};
  const sections = (dna?.sections as Record<string, unknown> | null) ?? {};

  // Recuperação: as entradas mais relevantes para a mensagem (controla custo).
  type Entry = {
    category: string;
    trigger_questions: string[] | null;
    strategy: string | null;
    technique: string | null;
    answer: string | null;
    common_errors: string[] | null;
    next_objective: string | null;
    required_facts: string[] | null;
    hard_rules: string[] | null;
  };
  const allEntries = (entriesData as Entry[] | null) ?? [];
  const picked = matchEntries(message, allEntries, 8);
  const library = (picked.length ? picked : allEntries.slice(0, 6))
    .map(
      (e) =>
        `Categoria: ${e.category}\nGatilho: ${(e.trigger_questions ?? []).join(" / ")}\nEstratégia: ${e.strategy ?? ""}\nTécnica: ${e.technique ?? ""}\nResposta modelo: ${e.answer ?? ""}\nErros a evitar: ${(e.common_errors ?? []).join("; ")}\nPróximo passo: ${e.next_objective ?? ""}`,
    )
    .join("\n---\n");

  // Contexto do cliente + histórico.
  let contactBlock = "Nenhum cliente selecionado — trate como primeiro contato.";
  if (input.contactId) {
    const [{ data: c }, { data: h }] = await Promise.all([
      supabase.from("contacts").select("name, journey_stage").eq("id", input.contactId).eq("tenant_id", tenant.id).maybeSingle(),
      supabase
        .from("interactions")
        .select("direction, content, occurred_at")
        .eq("tenant_id", tenant.id)
        .eq("contact_id", input.contactId)
        .order("occurred_at", { ascending: false })
        .limit(10),
    ]);
    const contact = c as { name: string; journey_stage: string } | null;
    const hist = (h as { direction: string; content: string; occurred_at: string }[] | null) ?? [];
    const stageLabel = stages.find((s) => s.key === contact?.journey_stage)?.label ?? contact?.journey_stage;
    const histText = hist.length
      ? hist
          .reverse()
          .map((i) => `${i.direction === "inbound" ? "Cliente" : "Nós"}: ${i.content}`)
          .join("\n")
      : "Sem histórico anterior.";
    contactBlock = `Cliente: ${contact?.name ?? "?"}\nEtapa atual: ${stageLabel}\nHISTÓRICO (não repita abordagens já usadas; evolua a conversa):\n${histText}`;
  }

  const stageList = stages.map((s) => `${s.key} = ${s.label}${s.won ? " (ganho)" : ""}${s.terminal ? " (final)" : ""}`).join("; ");
  const hardRules = Array.isArray(manifest.hard_rules) ? (manifest.hard_rules as string[]).join("; ") : "";

  const system = `Você é o assistente comercial do vendedor. Sua missão: sugerir a MELHOR resposta para enviar ao cliente agora e explicar a técnica.
REGRAS INEGOCIÁVEIS:
- Use SOMENTE os FATOS fornecidos (DNA). NUNCA invente preço, condição, horário, serviço, promoção ou política que não esteja nos FATOS.
- Se faltar um fato essencial para responder com segurança, liste em "faltam_fatos", marque "escalar": true e NÃO invente — deixe "resposta_sugerida" como uma mensagem breve e segura que encaminha para um humano/verificação.
- Escreva em português do Brasil, natural, simpático e conciso — pronto para copiar e enviar no WhatsApp. Evite CTA fraca como "o que acha?"; use fechamento por alternativa ou pressuposto.
- Baseie a técnica e o tom na BIBLIOTECA e no HISTÓRICO do cliente.`;

  const prompt = `SEGMENTO: ${manifest.name ?? tenant.skill_key}
VOCABULÁRIO/EIXO: ${JSON.stringify(manifest.vocabulary ?? {})} | descoberta: ${manifest.discovery_axis ?? ""}
ETAPAS DA JORNADA (use a CHAVE em status_sugerido): ${stageList}
REGRAS PERMANENTES DO SEGMENTO: ${hardRules}

FATOS DA EMPRESA (DNA — a única verdade que você pode afirmar):
${fatos(sections)}

BIBLIOTECA COMERCIAL (estratégia e técnicas — a base das respostas):
${library || "(biblioteca vazia)"}

CONTEXTO DO CLIENTE:
${contactBlock}

MENSAGEM DO CLIENTE (responda a isto):
"""${message}"""

Analise e gere a melhor resposta agora.`;

  let object: AiAnswer;
  let usage: unknown;
  try {
    const res = await generateObject({ model: aiModel, schema, system, prompt });
    object = res.object as AiAnswer;
    usage = res.usage;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao gerar";
    return { ok: false, error: `Erro no motor de IA: ${msg}` };
  }

  // Valida o status sugerido contra as etapas reais do manifesto.
  const validKeys = new Set(stages.map((s) => s.key));
  if (!validKeys.has(object.status_sugerido)) object.status_sugerido = "";

  // Registra custo/tokens no ledger (por empresa).
  const t = tokensOf(usage);
  await supabase.from("usage_ledger").insert({
    tenant_id: tenant.id,
    feature: "responder_ai",
    model: AI_MODEL,
    tokens_in: t.in,
    tokens_out: t.out,
    cost_cents: estimateCostCents(t.in, t.out),
  });

  return { ok: true, data: object };
}

// Aplica o avanço de etapa sugerido pela IA (registra no histórico da jornada).
export async function applyStage(
  contactId: string,
  toStage: string,
  reason: string,
): Promise<{ ok: boolean }> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant || !contactId || !toStage) return { ok: false };

  const supabase = await createClient();
  const { data: cur } = await supabase
    .from("contacts")
    .select("journey_stage")
    .eq("id", contactId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  const from = (cur as { journey_stage: string } | null)?.journey_stage ?? null;
  if (from === toStage) return { ok: true };

  await supabase
    .from("contacts")
    .update({ journey_stage: toStage, stage_entered_at: new Date().toISOString() })
    .eq("id", contactId)
    .eq("tenant_id", tenant.id);
  await supabase.from("contact_stage_history").insert({
    tenant_id: tenant.id,
    contact_id: contactId,
    from_stage: from,
    to_stage: toStage,
    reason: reason || "Avanço sugerido pela IA",
    triggered_by: "ai_detected",
  });

  revalidatePath(`/painel/contatos/${contactId}`);
  revalidatePath("/painel/funil");
  return { ok: true };
}
