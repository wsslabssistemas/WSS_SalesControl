"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { TENANT_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DIAS_DE_TESTE } from "@/lib/teste";

// `: never` explícito. Sem ele o TypeScript não sabe que esta função nunca
// retorna (o `redirect` do Next lança), e passa a achar que o código depois de
// `if (!tenant) erro(...)` roda com `tenant` nulo.
const erro: (m: string) => never = (m) =>
  redirect(`/painel/nova-empresa?erro=${encodeURIComponent(m)}`);

/** "Solar do Vale" → "solar-do-vale". Sem acento, sem símbolo, sem espaço. */
function paraSlug(nome: string): string {
  return nome
    // Escapes explícitos em vez do intervalo literal de diacríticos: o
    // literal é invisível no editor e some numa cópia descuidada.
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 40);
}

/**
 * CRIA A EMPRESA DE QUEM ACABOU DE CHEGAR.
 *
 * POR QUE COM `service_role` E NÃO PELA RLS
 * A RLS de `tenants` só tem SELECT (para membro) e UPDATE (para admin) —
 * INSERT não existe, de propósito. Ela é uma regra sobre quem já pertence a
 * uma empresa, e não sabe expressar "qualquer pessoa autenticada pode criar a
 * PRÓPRIA". Abrir INSERT para `authenticated` seria abrir para criar empresa
 * em nome de qualquer um.
 *
 * Então a criação passa por aqui, onde três coisas são garantidas em código:
 * o usuário está autenticado, o `owner` é ele mesmo, e o `tenant_id` é o que
 * acabou de nascer. Nenhum dos três vem do formulário.
 */
export async function criarEmpresa(formData: FormData) {
  const user = await requireUser();

  const nome = String(formData.get("nome") ?? "").trim();
  const skillKey = String(formData.get("skill_key") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();

  if (!nome) erro("Diga o nome da empresa.");
  if (!skillKey) erro("Escolha o ramo.");

  const admin = createAdminClient();

  // O ramo tem que existir e estar publicado. Sem esta conferência, um POST
  // direto instalaria uma Skill em rascunho — e o painel abriria sem etapas,
  // que é o sintoma mais confuso possível para quem acabou de entrar.
  const { data: skill } = await admin
    .from("skills").select("key").eq("key", skillKey).eq("status", "published").maybeSingle();
  if (!skill) erro("Esse ramo não está disponível.");

  // Slug único: nome repetido é comum ("Barbearia do João" existe em toda
  // cidade). Sufixo numérico em vez de recusar — recusar faria a pessoa
  // inventar um nome errado para conseguir entrar.
  const base = paraSlug(nome) || "empresa";
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const { data: existe } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
    if (!existe) break;
    slug = `${base}-${i}`;
  }

  const fimDoTeste = new Date(Date.now() + DIAS_DE_TESTE * 86400000).toISOString();

  const { data: tenant, error: eT } = await admin
    .from("tenants")
    .insert({
      name: nome,
      slug,
      skill_key: skillKey,
      plan: "trial",
      status: "trial",
      settings: {
        cidade: cidade || null,
        trial_ends_at: fimDoTeste,
        // MÓDULO 1 DO CURSO NO TESTE, decisão do fundador: a pessoa conhece o
        // produto e tem motivo para comprar o resto. Os add-ons pagos
        // (prospecção, licitações) ficam FORA da entrada de propósito — pedir
        // decisão sobre eles a quem ainda não entendeu o núcleo é ruído.
        capabilities: ["curso"],
        entitlements: { curso: true },
        curso_demo: true,
      },
    })
    .select("id")
    .maybeSingle();

  if (eT || !tenant) erro(`Não consegui criar a empresa: ${eT?.message ?? "erro desconhecido"}`);

  // O criador é o DONO. Papel vem daqui, nunca do formulário.
  const { error: eM } = await admin.from("memberships").insert({
    user_id: user.id,
    tenant_id: tenant.id,
    role: "owner",
    status: "active",
  });
  if (eM) erro(`Empresa criada, mas não consegui te vincular: ${eM.message}`);

  await admin.from("profiles").upsert(
    { id: user.id, email: user.email, full_name: user.user_metadata?.full_name ?? null },
    { onConflict: "id" },
  );

  // PORTA ÚNICA para instalar a Skill: grava `tenants.skill_key` E o vínculo
  // em `tenant_skills`. A RLS de `skills` depende do vínculo — gravar só a
  // coluna abre o painel sem etapas e sem origens. Já derrubou 6 empresas.
  const { error: eS } = await admin.rpc("install_skill", {
    p_tenant: tenant.id,
    p_skill_key: skillKey,
  });
  if (eS) erro(`Empresa criada, mas o ramo não foi instalado: ${eS.message}`);

  // Deixa a empresa nova como a ativa — quem tem mais de uma cairia na antiga.
  (await cookies()).set(TENANT_COOKIE, tenant.id, { path: "/", httpOnly: false, sameSite: "lax" });

  redirect("/painel/onboarding?bem-vindo=1");
}

/** Os ramos disponíveis, para a tela de criação. */
export async function listarRamos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skills")
    .select("key, name, manifest")
    .eq("status", "published")
    .order("name");

  return ((data as { key: string; name: string; manifest: Record<string, unknown> }[] | null) ?? []).map((s) => {
    const m = s.manifest ?? {};
    const vocab = (m.vocabulary as Record<string, string> | undefined) ?? {};
    // O `name` do manifesto já traz a cobertura entre parênteses — "Oficina
    // Mecânica (automotiva, elétrica, funilaria e pneus)". É o que faz a
    // pessoa se reconhecer: ninguém procura "sob medida", procura
    // "marcenaria". Aqui ele é partido em título e cobertura para a tela
    // poder dar peso diferente aos dois.
    const [, titulo, cobertura] = s.name.match(/^([^(]+)(?:\((.+)\))?$/) ?? [];
    return {
      key: s.key,
      name: (titulo ?? s.name).trim(),
      cobertura: (cobertura ?? "").trim(),
      conversion: vocab.conversion ?? "",
    };
  });
}
