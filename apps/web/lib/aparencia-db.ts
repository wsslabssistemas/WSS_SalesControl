import { createClient } from "@/lib/supabase/server";
import { lerAparencia, type Aparencia } from "@/lib/aparencia";

/**
 * Lê a aparência da empresa. Falha em silêncio para o padrão do produto — uma
 * cor mal cadastrada não pode derrubar o painel inteiro.
 */
export async function carregarAparencia(tenantId: string): Promise<Aparencia> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("tenants").select("settings").eq("id", tenantId).maybeSingle();
    return lerAparencia((data?.settings as Record<string, unknown> | null) ?? null);
  } catch {
    return { cor: null, logoUrl: null };
  }
}
