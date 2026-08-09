"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveTenant } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type SegmentOption = {
  key: string;
  name: string;
  lead: string;
  conversion: string;
  stages: string[];
  capabilities: string[];
};

/**
 * Segmentos publicados. O catálogo é dado (manifestos), não código.
 *
 * ⚠ COM `service_role`, PELO MESMO MOTIVO DA TELA DE CRIAR EMPRESA.
 * A policy `skills_read_installed` só deixa o usuário ver a Skill JÁ instalada
 * na empresa dele. Lida com o cliente do usuário, esta função devolvia UMA
 * linha — a própria — e a tela de trocar de segmento mostrava só a opção que a
 * pessoa já tem. Um seletor com uma opção não parece defeito; parece decisão.
 */
export async function listSegments(): Promise<SegmentOption[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("skills")
    .select("key, name, manifest")
    .eq("status", "published")
    .order("name");

  return ((data as { key: string; name: string; manifest: Record<string, unknown> }[] | null) ?? []).map((s) => {
    const m = s.manifest ?? {};
    const vocab = (m.vocabulary as Record<string, string> | undefined) ?? {};
    const journey = (m.journey as { stages?: { label: string }[] } | undefined) ?? {};
    return {
      key: s.key,
      name: s.name,
      lead: vocab.lead ?? "lead",
      conversion: vocab.conversion ?? "conversão",
      stages: (journey.stages ?? []).map((st) => st.label),
      capabilities: Array.isArray(m.capabilities) ? (m.capabilities as string[]) : [],
    };
  });
}

/**
 * Instala a Skill do segmento no tenant (RF-03). Troca o vocabulário, a jornada,
 * os campos, as seções de DNA e as abas — tudo vem do manifesto. Nenhuma linha
 * do núcleo muda entre um segmento e outro.
 */
export async function installSkill(skillKey: string): Promise<{ ok: boolean; error?: string }> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };
  if (membership!.role !== "owner" && membership!.role !== "admin") {
    return { ok: false, error: "Só um administrador escolhe o segmento." };
  }

  // ⚠ A CONFERÊNCIA DO SEGMENTO USA `service_role`, e o motivo é o mesmo que
  // já quebrou esta tela duas vezes: a policy `skills_read_installed` só deixa
  // o usuário ver a Skill JÁ INSTALADA na empresa dele.
  //
  // Ou seja: com o cliente do usuário, perguntar "o segmento X existe?" volta
  // NULO para todo segmento que não é o atual — que são exatamente os únicos
  // que alguém tentaria instalar. A tela listava os 15 ramos (isso foi
  // corrigido antes) e recusava TODOS com "Segmento não disponível".
  //
  // O que autoriza a troca continua sendo o papel, conferido acima com o
  // cliente do usuário. O `service_role` aqui só responde se o segmento
  // existe no catálogo — que é dado de PRODUTO, igual em toda empresa.
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: skill } = await admin
    .from("skills")
    .select("key")
    .eq("key", skillKey)
    .eq("status", "published")
    .maybeSingle();
  if (!skill) return { ok: false, error: "Segmento não disponível." };

  // Porta única: grava tenants.skill_key E o vínculo em tenant_skills — a RLS
  // de `skills` depende do vínculo. Gravar só um dos dois quebra a leitura do
  // manifesto (formulário sem etapas e sem origens).
  const { error } = await supabase.rpc("install_skill", {
    p_tenant: tenant.id,
    p_skill_key: skillKey,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/painel", "layout");
  return { ok: true };
}

/** Quantos contatos já existem — trocar de segmento muda as etapas da jornada. */
export async function countContacts(): Promise<number> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null);
  return count ?? 0;
}
