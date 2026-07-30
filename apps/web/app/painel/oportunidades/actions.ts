"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { normalizePhone } from "@/lib/phone";
import { enrichCompany } from "@/lib/prospect";
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

  const cnaes = parseLines(formData.get("cnaes"));
  const municipios = parseLines(formData.get("municipios"));

  const supabase = await createClient();
  const { data: t } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const settings = ((t?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;

  await supabase
    .from("tenants")
    .update({ settings: { ...settings, icp: { cnaes, municipios, updated_at: new Date().toISOString() } } })
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
  if (!phone) {
    const enriched = await enrichCompany(cnpj);
    phone = enriched?.phone ? normalizePhone(enriched.phone) : null;
  }

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
    })
    .select("id")
    .single();

  revalidatePath("/painel/contatos");
  const novoId = (created as { id: string } | null)?.id ?? "";
  // Leva direto para a primeira abordagem — é o passo seguinte natural.
  redirect(`${back}&added=${encodeURIComponent(name)}&novo=${novoId}`);
}
