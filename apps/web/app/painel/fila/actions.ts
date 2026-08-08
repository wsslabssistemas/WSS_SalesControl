"use server";

import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { matchEntries } from "@/lib/match";
import { checkRequiredFacts } from "@/lib/facts";
import { aiModel, AI_MODEL, hasAIKey, keyHint, estimateCostCents, tokensOf } from "@/lib/ai";
import { verificarCota } from "@/lib/cota-db";
import { ROTULO, type MotivoDaFila } from "@/lib/fila";
import { revalidatePath } from "next/cache";

export type ToqueResult =
  | { ok: true; texto: string; escalar: boolean; faltam: string[] }
  | { ok: false; error: string }
  | { ok: false; limite: true; mensagem: string };

const schema = z.object({
  mensagem: z.string().describe("A mensagem pronta para enviar no WhatsApp, em PT-BR. Vazia se for para escalar."),
  escalar: z.boolean().describe("true se falta fato essencial e não dá para escrever com segurança."),
  faltam_fatos: z.array(z.string()).describe("Fatos exigidos pela biblioteca que não existem no DNA."),
});

const fatos = (sections: Record<string, unknown>) => {
  const out: string[] = [];
  for (const [k, v] of Object.entries(sections ?? {})) {
    if (v == null || (typeof v === "object" && Object.keys(v).length === 0)) continue;
    out.push(`### ${k}\n${typeof v === "string" ? v : JSON.stringify(v, null, 2)}`);
  }
  return out.length ? out.join("\n\n") : "(DNA vazio — nenhum fato cadastrado)";
};

/**
 * PREPARA O TOQUE DA FILA.
 *
 * NÃO é a primeira abordagem — e a diferença não é detalhe. Aqui a pessoa JÁ
 * nos conhece: ela pediu orçamento, fez a experimental, é aluna, ou combinou de
 * voltar. Usar o prompt de abordagem fria produziria "vi que vocês trabalham
 * com X" para quem já é cliente, que é o tipo de erro que faz o vendedor parar
 * de confiar na ferramenta na primeira semana.
 *
 * A TRAVA ANTI-INVENÇÃO VALE IGUAL. Toque proativo é onde a invenção é mais
 * tentadora — não há pergunta do cliente para ancorar a resposta, e o modelo
 * preenche o vazio com o que soa bem. Por isso `checkRequiredFacts` roda aqui
 * do mesmo jeito, e a palavra final é dela.
 *
 * COTA: conta como ATENDIMENTO (`resposta`), não como prospecção. Falar com
 * quem já é cliente é o produto principal, e sai do bolso que a empresa paga.
 */
export async function prepararToque(
  contactId: string,
  motivo: MotivoDaFila,
  intencao: string,
): Promise<ToqueResult> {
  if (!hasAIKey()) return { ok: false, error: "Chave de IA não configurada." };
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };
  if (!contactId) return { ok: false, error: "Contato não informado." };

  const cota = await verificarCota(tenant.id, "resposta");
  if (!cota.permitido) return { ok: false, limite: true, mensagem: cota.mensagem! };

  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { stages } = await getSkillFormConfig(tenant.skill_key);

    const [{ data: skill }, { data: dna }, { data: c }, { data: h }, { data: lib }] = await Promise.all([
      supabase.from("skills").select("manifest").eq("key", tenant.skill_key).maybeSingle(),
      supabase.from("commercial_dna").select("sections").eq("tenant_id", tenant.id).eq("is_current", true).maybeSingle(),
      supabase.from("contacts").select("name, journey_stage, source, custom, next_action_note").eq("id", contactId).eq("tenant_id", tenant.id).maybeSingle(),
      supabase.from("interactions").select("direction, content").eq("tenant_id", tenant.id).eq("contact_id", contactId)
        .order("occurred_at", { ascending: false }).limit(6),
      // A biblioteca GLOBAL do segmento só é legível pelo service_role (0006).
      // Com o client do usuário isto voltaria vazio — e o toque sairia sem
      // técnica nenhuma, que é o produto inteiro.
      admin.from("knowledge_entries")
        .select("category, technique, strategy, trigger_questions, common_errors, next_objective, required_facts, on_missing_facts")
        .eq("skill_key", tenant.skill_key).is("tenant_id", null).eq("status", "active"),
    ]);

    const contact = c as { name: string; journey_stage: string; source: string | null; custom: Record<string, unknown> | null; next_action_note: string | null } | null;
    if (!contact) return { ok: false, error: "Contato não encontrado." };

    const manifest = (skill?.manifest as Record<string, unknown> | null) ?? {};
    const sections = (dna?.sections as Record<string, unknown> | null) ?? {};
    const hist = (h as { direction: string; content: string }[] | null) ?? [];
    const histText = hist.length
      ? [...hist].reverse().map((i) => `${i.direction === "inbound" ? "Ele" : "Nós"}: ${i.content}`).join("\n")
      : "(sem histórico registrado)";

    // A biblioteca entra pela INTENÇÃO do toque — é ela que descreve a
    // situação quando não existe mensagem do cliente para casar.
    type Entry = Parameters<typeof matchEntries>[1][number] & { required_facts?: string[] | null; on_missing_facts?: string | null; common_errors?: string[] | null; next_objective?: string | null };
    const entradas = ((lib as Entry[] | null) ?? []);
    const escolhidas = matchEntries(`${ROTULO[motivo]} ${intencao}`, entradas, 3);
    const trava = checkRequiredFacts(sections, escolhidas);

    const libText = escolhidas
      .map((e) => `• ${e.category} — ${e.technique ?? ""}\n  ${e.strategy ?? ""}\n  Evitar: ${(e.common_errors ?? []).join("; ")}`)
      .join("\n\n") || "(biblioteca vazia)";

    const hardRules = Array.isArray(manifest.hard_rules) ? (manifest.hard_rules as string[]).join("\n- ") : "";

    const system = `Você escreve UMA mensagem proativa de WhatsApp para um contato que JÁ conhece a empresa.
REGRAS INEGOCIÁVEIS:
- Use SOMENTE os FATOS do DNA. NUNCA invente preço, horário, condição, prazo ou promoção.
- Se faltar fato essencial, marque "escalar": true, liste em "faltam_fatos" e NÃO escreva a mensagem.
- NÃO abra cobrando ausência ("sumiu", "não te vejo faz tempo"): cobrança gera culpa e culpa gera silêncio.
- NÃO trate quem já é cliente como desconhecido, e não se apresente de novo.
- Curta: 2 a 4 linhas, tom humano, português do Brasil, pronta para copiar.
- UMA pergunta só, e fácil de responder. Nada de "qualquer coisa me chama".
${hardRules ? `\nREGRAS PERMANENTES DO SEGMENTO:\n- ${hardRules}` : ""}`;

    const prompt = `SEGMENTO: ${manifest.name ?? tenant.skill_key}

MOTIVO DO TOQUE: ${ROTULO[motivo]}
O QUE ESTE TOQUE DEVE FAZER: ${intencao}
${contact.next_action_note ? `O QUE FICOU COMBINADO COM ELE (use, é a melhor abertura possível): ${contact.next_action_note}` : ""}

FATOS DA EMPRESA (a única verdade que você pode afirmar):
${fatos(sections)}

FATOS QUE A BIBLIOTECA EXIGE E NÃO EXISTEM NO DNA (verificado no banco):
${trava.faltando.length ? trava.faltando.map((f) => `- ${f}`).join("\n") : "(nenhum)"}
${trava.travou ? "→ Falta fato EXIGIDO. Marque \"escalar\": true e não escreva a mensagem." : ""}

TÉCNICA A APLICAR (biblioteca curada do ramo):
${libText}

CONTATO: ${contact.name} · etapa: ${stages.find((s) => s.key === contact.journey_stage)?.label ?? contact.journey_stage} · origem: ${contact.source ?? "—"}

ÚLTIMAS INTERAÇÕES:
${histText}

Escreva a mensagem.`;

    const res = await generateObject({ model: aiModel, schema, system, prompt });
    const obj = res.object as { mensagem: string; escalar: boolean; faltam_fatos: string[] };
    if (trava.travou) obj.escalar = true;

    const t = tokensOf(res.usage);
    try {
      await admin.from("usage_ledger").insert({
        tenant_id: tenant.id, feature: "responder_ai", model: AI_MODEL,
        tokens_in: t.in, tokens_out: t.out, cost_cents: estimateCostCents(t.in, t.out),
      });
    } catch {
      // medição best-effort
    }

    return {
      ok: true,
      texto: obj.mensagem ?? "",
      escalar: !!obj.escalar,
      faltam: [...new Set([...trava.faltando, ...(obj.faltam_fatos ?? [])])],
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Erro no motor de IA: ${msg} — [${keyHint()}]` };
  }
}

/**
 * MARCA COMO ENVIADO.
 *
 * Registra a saída em `interactions`. Isso não é burocracia: é o que faz a
 * cadência avançar, o "esfriando" zerar e o tempo de resposta ser medido. Sem
 * o registro, a mesma pessoa volta para a fila amanhã — e o vendedor conclui
 * que a fila não funciona.
 *
 * O texto vai junto porque a fila não guarda rascunho: a mensagem é gerada,
 * enviada e vira histórico. Guardar rascunho criaria uma terceira cópia da
 * conversa para ninguém conferir.
 */
export async function marcarEnviado(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return;
  const contactId = String(formData.get("contact_id") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  if (!contactId) return;

  const supabase = await createClient();
  // `input_kind` é o PAPEL da interação e tem lista fechada no banco
  // (`customer_message | agent_briefing | system_initiated`). O toque da fila
  // é iniciado por nós, sem o cliente ter escrito: é `system_initiated`.
  //
  // Aqui estava um bug ao vivo: gravava `input_kind: "fila"`, que o CHECK
  // recusa — e como o erro não era conferido, a tela dizia "enviado" e NADA
  // era gravado. Justamente o que o comentário acima existe para evitar: sem
  // registro a cadência não anda, o "esfriando" não zera, a pessoa volta para
  // a fila amanhã e o vendedor conclui que a fila não funciona.
  //
  // O MEIO tem coluna própria (`channel`) — confundir papel com meio foi o
  // que criou o valor inválido. Kind é o que a interação É; channel é por onde
  // ela passou.
  const { error } = await supabase.from("interactions").insert({
    tenant_id: tenant.id,
    contact_id: contactId,
    direction: "outbound",
    input_kind: "system_initiated",
    channel: "whatsapp",
    content: texto || "(toque da fila, sem texto registrado)",
    occurred_at: new Date().toISOString(),
  });
  if (error) {
    // Falha aqui NÃO pode ser silenciosa. É a diferença entre "a fila repetiu
    // o contato" e "a fila está quebrada", e só a segunda alguém conserta.
    console.error(`[fila] falha ao registrar envio de ${contactId}: ${error.message}`);
    throw new Error(`Não consegui registrar o envio: ${error.message}`);
  }
  revalidatePath("/painel/fila");
  revalidatePath("/painel");
}
