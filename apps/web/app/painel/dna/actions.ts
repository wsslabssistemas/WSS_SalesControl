"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveDna(
  sections: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_dna", {
    p_tenant: tenant.id,
    p_sections: sections,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/painel/dna");
  return { ok: true };
}
