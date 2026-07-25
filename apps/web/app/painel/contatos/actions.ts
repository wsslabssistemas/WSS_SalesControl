"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Parsed = {
  name: string;
  phone: string | null;
  source: string | null;
  journey_stage: string;
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
    journey_stage: String(formData.get("journey_stage") ?? "contato").trim() || "contato",
    custom,
  };
}

const DUP = "23505"; // unique_violation

export async function createContact(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const p = parse(formData);
  if (!p.name) redirect("/painel/contatos/novo?erro=Nome+e+obrigatorio");

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    tenant_id: tenant!.id,
    owner_id: membership!.membershipId,
    ...p,
  });

  if (error) {
    const msg =
      error.code === DUP
        ? "Ja existe um contato com esse telefone."
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
  const { error } = await supabase
    .from("contacts")
    .update(p)
    .eq("id", id)
    .eq("tenant_id", membership.tenant.id);

  if (error) {
    const msg =
      error.code === DUP
        ? "Ja existe um contato com esse telefone."
        : error.message;
    redirect(`/painel/contatos/${id}/editar?erro=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/painel/contatos");
  revalidatePath(`/painel/contatos/${id}`);
  redirect(`/painel/contatos/${id}`);
}

export async function deleteContact(id: string) {
  const membership = await getActiveTenant();
  if (!membership?.tenant) redirect("/painel");

  const supabase = await createClient();
  // Exclusão reversível (soft delete): não perde histórico.
  await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", membership.tenant.id);

  revalidatePath("/painel/contatos");
  redirect("/painel/contatos");
}
