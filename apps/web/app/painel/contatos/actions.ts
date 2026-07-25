"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createContact(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/painel/contatos/novo?erro=Nome+e+obrigatorio");

  const phone = String(formData.get("phone") ?? "").trim() || null;
  const source = String(formData.get("source") ?? "").trim() || null;
  const journey_stage =
    String(formData.get("journey_stage") ?? "contato").trim() || "contato";

  // Campos próprios do segmento (contact_fields do manifesto) → custom (jsonb).
  const custom: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("custom.") && String(v).trim()) {
      custom[k.slice("custom.".length)] = String(v);
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    tenant_id: tenant!.id,
    owner_id: membership!.membershipId,
    name,
    phone,
    source,
    journey_stage,
    custom,
  });

  if (error) {
    redirect(`/painel/contatos/novo?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/painel/contatos");
  redirect("/painel/contatos");
}
