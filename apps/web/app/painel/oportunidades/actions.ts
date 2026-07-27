"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { redirect } from "next/navigation";

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
