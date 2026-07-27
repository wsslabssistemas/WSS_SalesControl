"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Conclui o onboarding: salva o DNA (versionado) e grava a postura comercial +
// carimbo de conclusão em tenants.settings. Só owner/admin (RLS de tenants).
export async function finishOnboarding(
  sections: Record<string, unknown>,
  posture: string,
): Promise<{ ok: boolean; error?: string }> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };
  if (membership.role !== "owner" && membership.role !== "admin") {
    return { ok: false, error: "Só um administrador pode concluir o onboarding." };
  }

  const supabase = await createClient();

  const { error: e1 } = await supabase.rpc("save_dna", {
    p_tenant: tenant.id,
    p_sections: sections,
  });
  if (e1) return { ok: false, error: e1.message };

  const { data: t } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenant.id)
    .maybeSingle();
  const settings = ((t?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;

  const { error: e2 } = await supabase
    .from("tenants")
    .update({ settings: { ...settings, posture, onboarded_at: new Date().toISOString() } })
    .eq("id", tenant.id);
  if (e2) return { ok: false, error: e2.message };

  revalidatePath("/painel/dna");
  revalidatePath("/painel");
  return { ok: true };
}
