"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMoneyToCents } from "@/lib/money";

export async function registrarAtendimento(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const contactId = String(formData.get("contact_id") ?? "");
  const voltar = String(formData.get("back") ?? `/painel/contatos/${contactId}`);
  const service = String(formData.get("service") ?? "").trim();
  const cents = parseMoneyToCents(String(formData.get("value") ?? ""));
  const quando = String(formData.get("occurred_at") ?? "").trim();
  const executou = String(formData.get("performed_by") ?? "").trim();
  const comissao = String(formData.get("commission_pct") ?? "").trim();

  if (!service) redirect(`${voltar}?erro=${encodeURIComponent("Informe o serviço.")}`);
  if (cents === null) redirect(`${voltar}?erro=${encodeURIComponent("Valor inválido.")}`);

  const supabase = await createClient();
  const { error } = await supabase.from("services_rendered").insert({
    tenant_id: tenant.id,
    contact_id: contactId || null,
    performed_by: executou || membership!.membershipId,
    service,
    value_cents: cents,
    commission_pct: comissao ? Number(comissao.replace(",", ".")) : null,
    occurred_at: quando ? new Date(quando).toISOString() : new Date().toISOString(),
    created_by: membership!.membershipId,
  });

  if (error) redirect(`${voltar}?erro=${encodeURIComponent(error.message)}`);

  revalidatePath(voltar);
  revalidatePath("/painel/gestao");
  redirect(`${voltar}?ok=atendimento`);
}

export async function excluirAtendimento(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  const id = String(formData.get("id") ?? "");
  const voltar = String(formData.get("back") ?? "/painel");
  if (!id) redirect(voltar);

  const supabase = await createClient();
  await supabase.from("services_rendered").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath(voltar);
  revalidatePath("/painel/gestao");
  redirect(voltar);
}
