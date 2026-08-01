"use server";

import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Gera (ou troca) o endereço secreto do calendário.
 *
 * Trocar o endereço INVALIDA o anterior — é o que o dono usa se compartilhou
 * o link sem querer. Mesmo modelo do "endereço secreto" do Google Agenda.
 */
export async function gerarEnderecoCalendario() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return;
  if (membership!.role !== "owner" && membership!.role !== "admin") return;

  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const settings = ((data?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;

  // 32 bytes em base64url: impossível de adivinhar.
  const token = randomBytes(32).toString("base64url");

  await supabase
    .from("tenants")
    .update({ settings: { ...settings, calendar_token: token } })
    .eq("id", tenant.id);

  revalidatePath("/painel/agenda");
}

export async function removerEnderecoCalendario() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return;
  if (membership!.role !== "owner" && membership!.role !== "admin") return;

  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const settings = ((data?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  delete settings.calendar_token;

  await supabase.from("tenants").update({ settings }).eq("id", tenant.id);
  revalidatePath("/painel/agenda");
}
