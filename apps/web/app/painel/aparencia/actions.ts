"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { corValida, logoValida } from "@/lib/aparencia";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Salva cor e logo da empresa.
 *
 * VALIDA NO SERVIDOR, sempre. O `<input type="color">` do navegador já entrega
 * hex, mas nada impede um POST direto — e a cor vai para um `style` inline.
 * Validação que só existe no cliente é decoração.
 *
 * Valor inválido volta como ERRO, não como silêncio. Salvar em silêncio o que
 * foi recusado é a pior combinação: a pessoa acha que configurou, olha a tela
 * e não vê mudança nenhuma.
 */
export async function salvarAparencia(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  if (membership!.role !== "owner" && membership!.role !== "admin") {
    redirect("/painel/aparencia?erro=" + encodeURIComponent("Só o dono e o administrador mudam a aparência."));
  }

  const corBruta = String(formData.get("cor") ?? "").trim();
  const logoBruta = String(formData.get("logo_url") ?? "").trim();
  const cor = corValida(corBruta);
  const logo = logoValida(logoBruta);

  if (corBruta && !cor) {
    redirect("/painel/aparencia?erro=" + encodeURIComponent("Cor inválida. Use o formato #RRGGBB."));
  }
  if (logoBruta && !logo) {
    redirect("/painel/aparencia?erro=" + encodeURIComponent("Endereço da logo inválido. Precisa começar com https://"));
  }

  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const settings = ((data?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;

  await supabase
    .from("tenants")
    .update({ settings: { ...settings, aparencia: { cor, logo_url: logo } } })
    .eq("id", tenant.id);

  revalidatePath("/painel", "layout");
  redirect("/painel/aparencia?ok=1");
}
