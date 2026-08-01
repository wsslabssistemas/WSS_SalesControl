"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { getEditalItens, type EditalItem } from "@/lib/licitacoes";
import { redirect } from "next/navigation";

// Salva o perfil de licitações: UFs monitoradas + palavras-chave do objeto.
export async function saveGovIcp(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  if (membership!.role !== "owner" && membership!.role !== "admin") {
    redirect("/painel/licitacoes?erro=Sem+permissao");
  }

  const parseLines = (v: FormDataEntryValue | null) =>
    String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

  const ufs = parseLines(formData.get("ufs")).map((u) => u.toUpperCase().slice(0, 2));
  const keywords = parseLines(formData.get("keywords"));

  const supabase = await createClient();
  const { data: t } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const settings = ((t?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;

  await supabase
    .from("tenants")
    .update({ settings: { ...settings, gov_icp: { ufs, keywords, updated_at: new Date().toISOString() } } })
    .eq("id", tenant.id);

  redirect("/painel/licitacoes?ok=1");
}

export type ItensResult =
  | { ok: true; itens: EditalItem[]; batem: number }
  | { ok: false; error: string };

/**
 * Itens de um edital, marcando os que batem com as palavras-chave da empresa.
 * É a resposta para "por que este edital apareceu": a busca do PNCP casa com o
 * texto completo, e o produto costuma estar na lista de itens, não no objeto.
 * Os termos vêm do perfil salvo, nunca do cliente.
 */
export async function carregarItens(input: {
  orgaoCnpj: string;
  ano: number;
  seq: number;
}): Promise<ItensResult> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("licitacoes")) return { ok: false, error: "Módulo não habilitado." };

  const cnpj = String(input.orgaoCnpj ?? "").replace(/\D/g, "");
  const ano = Number(input.ano);
  const seq = Number(input.seq);
  if (!cnpj || !Number.isFinite(ano) || !Number.isFinite(seq)) {
    return { ok: false, error: "Edital sem identificação no PNCP." };
  }

  const supabase = await createClient();
  const { data: t } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const gov = ((t?.settings as Record<string, unknown> | null)?.gov_icp as { keywords?: string[] } | undefined) ?? {};

  try {
    const itens = await getEditalItens(cnpj, ano, seq, gov.keywords ?? []);
    return { ok: true, itens, batem: itens.filter((i) => i.bate).length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao ler os itens no PNCP." };
  }
}
