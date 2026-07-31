"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listMemberships, TENANT_COOKIE } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(TENANT_COOKIE);
  redirect("/login");
}

/** Troca a empresa ativa. Só aceita empresa onde o usuário tem vínculo ativo. */
export async function trocarEmpresa(tenantId: string): Promise<{ ok: boolean }> {
  const permitidas = await listMemberships();
  if (!permitidas.some((m) => m.tenant?.id === tenantId)) return { ok: false };

  (await cookies()).set(TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/painel", "layout");
  return { ok: true };
}
