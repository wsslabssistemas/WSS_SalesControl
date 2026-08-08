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

/**
 * Muda SÓ o teto global de gasto com IA, do bloco da primeira tela.
 *
 * POR QUE NÃO REUSAR `salvarLimiteGlobal` DA TELA DE COTAS: aquela grava os
 * quatro limites de uma vez, e campo ausente vira `null`. Como este formulário
 * tem um campo só, reusá-la apagaria em silêncio a cota de respostas, o teto
 * por empresa e a cota de prospecção — três travas desligadas por um botão que
 * dizia "Salvar" o teto. Formulário parcial exige gravação parcial.
 */
export async function salvarTetoGlobal(formData: FormData) {
  await requirePlatformAdmin();

  const bruto = String(formData.get("teto_global_mes") ?? "").trim();
  // Campo vazio = SEM TETO (null), não zero. Zero bloquearia a IA de todas as
  // empresas na hora, porque qualquer gasto já é maior ou igual a zero.
  const cents = bruto
    ? (() => {
        const n = Number(bruto.replace(/\./g, "").replace(",", "."));
        return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
      })()
    : null;

  const admin = createAdminClient();
  await admin
    .from("ai_limits")
    .update({ teto_global_mes_cents: cents, updated_at: new Date().toISOString() })
    .is("tenant_id", null);

  revalidatePath("/painel/admin");
  revalidatePath("/painel/admin/cotas");
}
