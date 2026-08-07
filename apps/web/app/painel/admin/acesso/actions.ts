"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/platform";
import { revalidatePath } from "next/cache";

async function assertPlatformAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isPlatformAdmin(user?.email)) throw new Error("Acesso restrito à WSS Labs.");
}

async function readSettings(admin: ReturnType<typeof createAdminClient>, tenantId: string) {
  const { data } = await admin.from("tenants").select("settings").eq("id", tenantId).maybeSingle();
  return ((data?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
}

export async function startTrial(formData: FormData) {
  await assertPlatformAdmin();
  const tenantId = String(formData.get("tenant_id"));
  const days = Number(formData.get("days") ?? 14) || 14;
  const admin = createAdminClient();
  const settings = await readSettings(admin, tenantId);
  const ends = new Date(Date.now() + days * 86400000).toISOString();
  await admin.from("tenants").update({ settings: { ...settings, trial_ends_at: ends } }).eq("id", tenantId);
  revalidatePath("/painel/admin/acesso");
}

export async function endTrial(formData: FormData) {
  await assertPlatformAdmin();
  const tenantId = String(formData.get("tenant_id"));
  const admin = createAdminClient();
  const settings = await readSettings(admin, tenantId);
  await admin.from("tenants").update({ settings: { ...settings, trial_ends_at: null } }).eq("id", tenantId);
  revalidatePath("/painel/admin/acesso");
}

export async function toggleModule(formData: FormData) {
  await assertPlatformAdmin();
  const tenantId = String(formData.get("tenant_id"));
  const mod = String(formData.get("module"));
  const enable = formData.get("enable") === "1";
  const admin = createAdminClient();
  const settings = await readSettings(admin, tenantId);

  const caps = new Set(Array.isArray(settings.capabilities) ? (settings.capabilities as string[]) : []);
  const ent = settings.entitlements && typeof settings.entitlements === "object"
    ? { ...(settings.entitlements as Record<string, boolean>) }
    : {};
  if (enable) {
    caps.add(mod); // passa a ser oferecido a este tenant
    ent[mod] = true; // e comprado (liberado fora do teste)
  } else {
    // DESLIGAR TEM QUE DESFAZER O OVERRIDE, não só zerar a compra.
    // Antes daqui só saía `ent[mod] = false`, e a capability ficava para
    // trás: o módulo sumia do menu (o menu lê `unlocked`) mas continuava
    // OFERECIDO para aquela empresa. Resíduo silencioso — a Be Fitness,
    // que é academia e não prospecta, carregou `prospeccao` e `licitacoes`
    // em `capabilities` desde um teste de julho.
    // A capability do MANIFESTO não é tocada: ela não mora aqui, e um
    // `delete` no override devolve o segmento ao padrão do ramo.
    caps.delete(mod);
    delete ent[mod];
  }
  await admin.from("tenants").update({ settings: { ...settings, capabilities: [...caps], entitlements: ent } }).eq("id", tenantId);
  revalidatePath("/painel/admin/acesso");
}
