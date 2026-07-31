import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Cookie que guarda a empresa escolhida por quem tem mais de um vínculo. */
export const TENANT_COOKIE = "cos_tenant";

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
  const all = await listMemberships();
  if (all.length === 0) return null;

  // Respeita a empresa escolhida, se o vínculo ainda existir.
  const escolhida = (await cookies()).get(TENANT_COOKIE)?.value;
  const alvo = escolhida ? all.find((m) => m.tenant?.id === escolhida) : undefined;
  return alvo ?? all[0];
}

/**
 * Todas as empresas do usuário. Uma pessoa pode ter vínculo com mais de uma
 * (rede de unidades, consultor, o próprio fabricante demonstrando segmentos).
 * RLS garante que só vêm os vínculos ativos dela.
 */
export async function listMemberships(): Promise<ActiveTenant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("id, role, tenant:tenants(id, name, slug, skill_key)")
    .eq("status", "active");

  // to-one no runtime; o supabase-js infere array sem tipos gerados → unknown.
  const rows = (data ?? []) as unknown as {
    id: string;
    role: string;
    tenant: ActiveTenant["tenant"];
  }[];

  return rows
    .filter((r) => r.tenant)
    .map((r) => ({ membershipId: r.id, role: r.role, tenant: r.tenant }))
    .sort((a, b) => (a.tenant?.name ?? "").localeCompare(b.tenant?.name ?? ""));
}
