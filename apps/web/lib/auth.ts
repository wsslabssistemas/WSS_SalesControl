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
 *
 * ⚠ O FILTRO POR `user_id` É OBRIGATÓRIO, e faltava.
 *
 * O comentário antigo dizia "RLS garante que só vêm os vínculos ativos dela" —
 * e isso é FALSO. A policy `memberships_select` é `is_member_of(tenant_id)`:
 * ela deixa ver TODOS os vínculos de qualquer empresa da qual você participa,
 * não só o seu. É o que a tela de Equipe precisa para listar os colegas.
 *
 * Sem o filtro, esta função devolvia UMA LINHA POR MEMBRO. O seletor de
 * empresa do fundador mostrava "Be Fitness" CINCO VEZES — uma para cada
 * pessoa da equipe dele.
 *
 * A lição, e o motivo de o filtro ficar aqui mesmo com RLS ligada: RLS
 * responde "o que você PODE ver", nunca "o que esta tela QUER ver". Confiar
 * nela como filtro de negócio é confiar numa resposta para outra pergunta.
 */
export async function listMemberships(): Promise<ActiveTenant[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("memberships")
    .select("id, role, tenant:tenants(id, name, slug, skill_key)")
    .eq("user_id", user.id)
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
