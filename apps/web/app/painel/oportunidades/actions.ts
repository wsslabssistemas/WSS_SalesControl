"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { normalizePhone } from "@/lib/phone";
import { enrichCompany, resumirEmpresa } from "@/lib/prospect";
import { cnaesDosAlvos } from "@/lib/cnae";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Salva o Perfil de Cliente Ideal (ICP): CNAEs-alvo + municípios. Passo 1 da
// prospecção — sem custo externo. Owner/admin.
export async function saveIcp(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  if (membership!.role !== "owner" && membership!.role !== "admin") {
    redirect("/painel/oportunidades?erro=Sem+permissao");
  }

  const parseLines = (v: FormDataEntryValue | null) =>
    String(v ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  // Os ramos marcados viram códigos aqui, no servidor. A tela nunca manda
  // código: manda a CHAVE do alvo, e a lista de CNAE mora em `lib/cnae.ts`.
  // Assim corrigir um código errado é editar uma linha de dado, e nenhuma
  // empresa fica com o código velho gravado no `settings`.
  const alvos = formData.getAll("alvos").map(String).filter(Boolean);
  const extras = parseLines(formData.get("cnaes"));
  const cnaes = [...new Set([...cnaesDosAlvos(alvos), ...extras])];
  const municipios = parseLines(formData.get("municipios"));

  const supabase = await createClient();
  const { data: t } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const settings = ((t?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;

  await supabase
    .from("tenants")
    .update({ settings: { ...settings, icp: { cnaes, municipios, extras, updated_at: new Date().toISOString() } } })
    .eq("id", tenant.id);

  redirect("/painel/oportunidades?ok=1");
}

// Traz uma empresa da busca para o funil como contato (enriquecendo o telefone).
export async function addOpportunity(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const cnpj = String(formData.get("cnpj") ?? "");
  const name = String(formData.get("name") ?? "").trim() || "Empresa";
  const back = String(formData.get("back") ?? "/painel/oportunidades?buscar=1");
  const source = String(formData.get("source") ?? "").trim() || "Prospecção";

  // Telefone informado à mão (quando a Receita não tem) tem prioridade.
  const manual = String(formData.get("phone") ?? "").trim();
  let phone: string | null = manual ? normalizePhone(manual) : null;
  // Retrato público da empresa: o que ela faz, porte, tempo de mercado e
  // cidade. É o que permite a primeira abordagem falar do NEGÓCIO dela em vez
  // de mandar mensagem genérica.
  const [enriched, resumo] = await Promise.all([
    phone ? Promise.resolve(null) : enrichCompany(cnpj),
    resumirEmpresa(cnpj),
  ]);
  if (!phone) phone = enriched?.phone ? normalizePhone(enriched.phone) : null;

  const supabase = await createClient();

  // Dedup por telefone já existente.
  if (phone) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("phone", phone)
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) redirect(`${back}&dup=${encodeURIComponent(name)}`);
  }

  const { stages } = await getSkillFormConfig(tenant.skill_key);
  const initialStage = stages.find((s) => !s.terminal)?.key ?? stages[0]?.key ?? "contato";

  const { data: created } = await supabase
    .from("contacts")
    .insert({
      tenant_id: tenant.id,
      owner_id: membership!.membershipId,
      name,
      phone,
      source,
      journey_stage: initialStage,
      custom: resumo ? { resumo_empresa: resumo, cnpj } : { cnpj },
    })
    .select("id")
    .single();

  revalidatePath("/painel/contatos");
  const novoId = (created as { id: string } | null)?.id ?? "";
  // Leva direto para a primeira abordagem — é o passo seguinte natural.
  redirect(`${back}&added=${encodeURIComponent(name)}&novo=${novoId}`);
}
