"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { readAutomation, type AutomationSettings } from "@/lib/automation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveAutomation(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  // Só owner/admin muda a política da empresa (a RLS de tenants exige isso também).
  if (!["owner", "admin"].includes(membership!.role)) {
    redirect("/painel/automacao?erro=Sem+permissao");
  }

  const supabase = await createClient();
  const { data: cur } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenant.id)
    .maybeSingle();

  const num = (k: string) => Number(formData.get(k));
  const incoming: AutomationSettings = readAutomation({
    automation: {
      mode: String(formData.get("mode") ?? "off"),
      max_per_day: num("max_per_day"),
      min_hours_between: num("min_hours_between"),
      max_no_reply: num("max_no_reply"),
      cooldown_hours: num("cooldown_hours"),
      window_start: num("window_start"),
      window_end: num("window_end"),
      stop_after_days: num("stop_after_days"),
      monthly_budget_credits: num("monthly_budget_credits"),
    },
  });

  const settings = {
    ...((cur?.settings as Record<string, unknown> | null) ?? {}),
    automation: incoming,
  };

  const { error } = await supabase
    .from("tenants")
    .update({ settings })
    .eq("id", tenant.id);

  if (error) redirect(`/painel/automacao?erro=${encodeURIComponent(error.message)}`);
  revalidatePath("/painel/automacao");
  redirect("/painel/automacao?salvo=1");
}
