"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/platform";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isPlatformAdmin(user?.email)) redirect("/painel");
}

export async function registerPayment(formData: FormData) {
  await requirePlatformAdmin();

  const tenant_id = String(formData.get("tenant_id") ?? "");
  const period = String(formData.get("period") ?? "").trim();
  const amount =
    Math.round(
      parseFloat(String(formData.get("amount") ?? "0").replace(",", ".")) * 100,
    ) || 0;
  const status = String(formData.get("status") ?? "paid") === "paid" ? "paid" : "pending";

  if (!tenant_id || !period) {
    redirect("/painel/admin/pagamentos?erro=Preencha+empresa+e+periodo");
  }

  const admin = createAdminClient();
  await admin.from("tenant_payments").insert({
    tenant_id,
    period,
    amount_cents: amount,
    status,
    paid_at: status === "paid" ? new Date().toISOString() : null,
  });

  revalidatePath("/painel/admin");
  revalidatePath("/painel/admin/pagamentos");
  redirect("/painel/admin/pagamentos?ok=1");
}
