import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Usuário logado ou redireciona para /login. Use em rotas protegidas. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export type ActiveTenant = {
  membershipId: string;
  role: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    skill_key: string;
  } | null;
};

/**
 * A empresa ativa do usuário. É um `membership` com papel — vendedor não é
 * tabela. RLS garante que só vêm as empresas onde o usuário tem vínculo ativo.
 *
 * Asserção de tipo na fronteira: sem tipos gerados do banco, o supabase-js
 * devolve `any` aqui. Assumimos a forma exata do `select`.
 */
export async function getActiveTenant(): Promise<ActiveTenant | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("id, role, tenant:tenants(id, name, slug, skill_key)")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  // to-one no runtime; o supabase-js infere array sem tipos gerados → unknown.
  const row = data as unknown as {
    id: string;
    role: string;
    tenant: ActiveTenant["tenant"];
  };
  return { membershipId: row.id, role: row.role, tenant: row.tenant };
}
