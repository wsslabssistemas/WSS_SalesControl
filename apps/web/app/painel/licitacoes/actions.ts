"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { redirect } from "next/navigation";

// Salva o perfil de licitações: UFs monitoradas + palavras-chave do objeto.
export async function saveGovIcp(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  if (membership!.role !== "owner" && membership!.role !== "admin") {
    redirect("/painel/licitacoes?erro=Sem+permissao");
  }

  const parseLines = (v: FormDataEntryValue | null) =>
    String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  const ufs = parseLines(formData.get("ufs")).map((u) => u.toUpperCase().slice(0, 2));
  const keywords = parseLines(formData.get("keywords"));

  const supabase = await createClient();
  const { data: t } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const settings = ((t?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;

  await supabase
    .from("tenants")
    .update({ settings: { ...settings, gov_icp: { ufs, keywords, updated_at: new Date().toISOString() } } })
    .eq("id", tenant.id);

  redirect("/painel/licitacoes?ok=1");
}
