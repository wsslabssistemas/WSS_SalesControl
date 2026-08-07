"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/platform";
import { revalidatePath } from "next/cache";

async function assertPlatformAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isPlatformAdmin(user?.email)) throw new Error("Acesso restrito à WSS Labs.");
}

/**
 * Campo vazio significa "sem regra própria" (`null`), não zero.
 *
 * A diferença é a coisa mais fácil de errar nesta tela e a mais cara: `null`
 * herda o padrão do fabricante; `0` BLOQUEIA a empresa na hora, porque
 * qualquer consumo já é maior ou igual a zero. Um campo limpo por engano
 * derrubaria a IA de um cliente pagante sem nenhuma mensagem de erro.
 */
function numeroOuNulo(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/** Reais na tela, centavos no banco — `lib/money.ts` já manda nisso. */
function centavosOuNulo(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export async function salvarLimiteGlobal(formData: FormData) {
  await assertPlatformAdmin();
  const admin = createAdminClient();
  await admin
    .from("ai_limits")
    .update({
      respostas_mes: numeroOuNulo(formData.get("respostas_mes")),
      teto_mes_cents: centavosOuNulo(formData.get("teto_mes")),
      prospeccao_dia: numeroOuNulo(formData.get("prospeccao_dia")),
      teto_global_mes_cents: centavosOuNulo(formData.get("teto_global_mes")),
      updated_at: new Date().toISOString(),
    })
    .is("tenant_id", null);
  revalidatePath("/painel/admin/cotas");
}

export async function salvarLimiteDaEmpresa(formData: FormData) {
  await assertPlatformAdmin();
  const tenantId = String(formData.get("tenant_id"));
  const admin = createAdminClient();

  const linha = {
    respostas_mes: numeroOuNulo(formData.get("respostas_mes")),
    teto_mes_cents: centavosOuNulo(formData.get("teto_mes")),
    prospeccao_dia: numeroOuNulo(formData.get("prospeccao_dia")),
    updated_at: new Date().toISOString(),
  };

  // Tudo vazio = a empresa volta a seguir o padrão do fabricante. Apagar a
  // linha é mais honesto que gravar três nulos: a tela mostra "segue o padrão"
  // porque não existe regra, e não porque a regra é vazia.
  if (linha.respostas_mes === null && linha.teto_mes_cents === null && linha.prospeccao_dia === null) {
    await admin.from("ai_limits").delete().eq("tenant_id", tenantId);
  } else {
    const { data: existe } = await admin
      .from("ai_limits").select("tenant_id").eq("tenant_id", tenantId).maybeSingle();
    if (existe) await admin.from("ai_limits").update(linha).eq("tenant_id", tenantId);
    else await admin.from("ai_limits").insert({ tenant_id: tenantId, ...linha });
  }
  revalidatePath("/painel/admin/cotas");
}
