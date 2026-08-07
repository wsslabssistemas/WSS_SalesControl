"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { normalizePhone } from "@/lib/phone";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Parsed = {
  name: string;
  phone: string | null;
  source: string | null;
  journey_stage: string;
  stageStart: string | null;
  /** A data que o CLIENTE marcou, e o que foi combinado nas palavras de quem atendeu. */
  nextActionAt: string | null;
  nextActionNote: string | null;
  custom: Record<string, string>;
};

function parse(formData: FormData): Parsed {
  const custom: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("custom.") && String(v).trim()) {
      custom[k.slice("custom.".length)] = String(v);
    }
  }
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: normalizePhone(String(formData.get("phone") ?? "")),
    source: String(formData.get("source") ?? "").trim() || null,
    // Vazio aqui; quem salva preenche com a 1ª etapa do manifesto. O núcleo
    // não conhece etapa de mercado (Lei 1).
    journey_stage: String(formData.get("journey_stage") ?? "").trim(),
    stageStart: String(formData.get("stage_start") ?? "").trim() || null,
    nextActionAt: String(formData.get("next_action_at") ?? "").trim() || null,
    nextActionNote: String(formData.get("next_action_note") ?? "").trim() || null,
    custom,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findPhoneDup(
  supabase: any,
  tenantId: string,
  phone: string,
  exceptId?: string,
): Promise<{ id: string; name: string } | null> {
  let q = supabase
    .from("contacts")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .is("deleted_at", null);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q.limit(1).maybeSingle();
  return (data as { id: string; name: string } | null) ?? null;
}

function rowFrom(p: Parsed): Record<string, unknown> {
  const row: Record<string, unknown> = {
    name: p.name,
    phone: p.phone,
    source: p.source,
    journey_stage: p.journey_stage,
    custom: p.custom,
  };
  if (p.stageStart) row.stage_entered_at = new Date(p.stageStart).toISOString();
  // Sempre gravado, inclusive quando volta vazio: limpar a data é como se
  // desmarca um combinado que não vale mais. Se só gravasse quando preenchido,
  // um lembrete cancelado ficaria cobrando para sempre.
  row.next_action_at = p.nextActionAt;
  row.next_action_note = p.nextActionNote;
  return row;
}

const DUP = "23505"; // unique_violation

export async function createContact(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const p = parse(formData);
  if (!p.name) redirect("/painel/contatos/novo?erro=Nome+e+obrigatorio");

  const supabase = await createClient();

  // Duplicidade por telefone: avisa ANTES de salvar (com o nome de quem já existe).
  if (p.phone) {
    const dup = await findPhoneDup(supabase, tenant!.id, p.phone);
    if (dup) {
      redirect(
        `/painel/contatos/novo?erro=${encodeURIComponent(
          `Já existe um contato com esse telefone: ${dup.name}`,
        )}`,
      );
    }
  }

  // Sem etapa escolhida, entra na primeira não-terminal do manifesto.
  if (!p.journey_stage) {
    const { stages } = await getSkillFormConfig(tenant!.skill_key);
    p.journey_stage = stages.find((s) => !s.terminal)?.key ?? stages[0]?.key ?? "";
  }
  if (!p.journey_stage) {
    redirect("/painel/contatos/novo?erro=Segmento+sem+etapas.+Refaca+o+onboarding.");
  }

  const { error } = await supabase.from("contacts").insert({
    tenant_id: tenant!.id,
    owner_id: membership!.membershipId,
    ...rowFrom(p),
  });

  if (error) {
    const msg =
      error.code === DUP
        ? "Já existe um contato com esse telefone."
        : error.message;
    redirect(`/painel/contatos/novo?erro=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/painel/contatos");
  redirect("/painel/contatos");
}

export async function updateContact(id: string, formData: FormData) {
  const membership = await getActiveTenant();
  if (!membership?.tenant) redirect("/painel");

  const p = parse(formData);
  if (!p.name) redirect(`/painel/contatos/${id}/editar?erro=Nome+e+obrigatorio`);

  const supabase = await createClient();

  if (p.phone) {
    const dup = await findPhoneDup(supabase, membership.tenant.id, p.phone, id);
    if (dup) {
      redirect(
        `/painel/contatos/${id}/editar?erro=${encodeURIComponent(
          `Já existe outro contato com esse telefone: ${dup.name}`,
        )}`,
      );
    }
  }

  const { error } = await supabase
    .from("contacts")
    .update(rowFrom(p))
    .eq("id", id)
    .eq("tenant_id", membership.tenant.id);

  if (error) {
    const msg =
      error.code === DUP
        ? "Já existe um contato com esse telefone."
        : error.message;
    redirect(`/painel/contatos/${id}/editar?erro=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/painel/contatos");
  revalidatePath(`/painel/contatos/${id}`);
  redirect(`/painel/contatos/${id}`);
}

export async function moveStage(id: string, formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const to = String(formData.get("to_stage") ?? "").trim();
  const reason =
    String(formData.get("reason") ?? "").trim() || "Movido manualmente";
  const start = String(formData.get("stage_start") ?? "").trim() || null;
  if (!to) redirect(`/painel/contatos/${id}`);

  const supabase = await createClient();
  const { data: cur } = await supabase
    .from("contacts")
    .select("journey_stage")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  const from = (cur as { journey_stage: string } | null)?.journey_stage ?? null;

  if (from !== to) {
    await supabase
      .from("contacts")
      .update({
        journey_stage: to,
        stage_entered_at: start
          ? new Date(start).toISOString()
          : new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    await supabase.from("contact_stage_history").insert({
      tenant_id: tenant.id,
      contact_id: id,
      from_stage: from,
      to_stage: to,
      reason,
      triggered_by: "agent",
    });
  }

  revalidatePath(`/painel/contatos/${id}`);
  revalidatePath("/painel/contatos");
  revalidatePath("/painel/funil");
  revalidatePath("/painel/agenda");
  redirect(`/painel/contatos/${id}`);
}

export async function updateStageStart(id: string, formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const dateStr = String(formData.get("start") ?? "").trim();
  if (!dateStr) redirect(`/painel/contatos/${id}`);

  const supabase = await createClient();
  await supabase
    .from("contacts")
    .update({ stage_entered_at: new Date(dateStr).toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  revalidatePath(`/painel/contatos/${id}`);
  revalidatePath("/painel/agenda");
  redirect(`/painel/contatos/${id}`);
}

export async function deleteContact(id: string) {
  const membership = await getActiveTenant();
  if (!membership?.tenant) redirect("/painel");

  const supabase = await createClient();
  await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", membership.tenant.id);

  revalidatePath("/painel/contatos");
  redirect("/painel/contatos");
}
