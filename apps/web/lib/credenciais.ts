import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// A CREDENCIAL DO CANAL, POR EMPRESA — e ela nunca chega ao browser.
//
// ⚠ POR QUE ESTE ARQUIVO EXISTE, e por que ele é `server-only`.
//
// O envio pelo WhatsApp era configurado por variável de ambiente: **um número
// para o sistema inteiro**. A entrada já era por empresa (o webhook acha o
// tenant pelo `phone_number_id` do pacote), então saída global e entrada por
// empresa estavam inconsistentes — com dois clientes, as mensagens dos dois
// sairiam do mesmo número.
//
// E o lugar óbvio para guardar, `tenants.settings`, é o lugar errado: a policy
// `tenants_select` libera a linha inteira para QUALQUER membro. Um token da
// Meta manda mensagem em nome da academia, para qualquer número, sem passar
// pelo produto — os três recepcionistas leriam o segredo com uma chamada do
// próprio navegador.
//
// Mora em `tenant_secrets` (0056), com RLS ligada e NENHUMA policy: em Postgres
// isso nega para todo papel que sofre RLS. Só o `service_role` alcança, daqui,
// do servidor. É a mesma regra da biblioteca curada no `0006`, pelo mesmo
// motivo: **o que não precisa chegar ao browser não chega.**
//
// O `server-only` no topo é a trava mecânica disso: se alguém importar este
// arquivo num componente de cliente, o build QUEBRA em vez de vazar o token
// para o bundle.

export type CredencialCanal = {
  token: string;
  phoneId: string;
  /** A versão da Graph API. Muda de tempos em tempos e não vale migration. */
  versao: string;
};

/**
 * A credencial da empresa, ou `null` quando ela não configurou o canal.
 *
 * `null` não é erro: é o estado normal de quem ainda envia pelo link humano.
 * Quem chama decide o que fazer com a ausência — e o que ele deve fazer é
 * continuar no `wa.me`, nunca falhar.
 */
export async function credencialDoCanal(tenantId: string): Promise<CredencialCanal | null> {
  const admin = createAdminClient();
  // paginacao-ok: uma linha, chave primária.
  const { data, error } = await admin
    .from("tenant_secrets")
    .select("whatsapp_token, whatsapp_phone_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    // Falha de leitura NÃO pode virar "canal desligado" em silêncio: isso
    // mandaria a empresa de volta para o link humano sem ninguém saber por quê.
    console.error(`[credenciais] falha ao ler o canal de ${tenantId}: ${error.message}`);
    return null;
  }
  const token = data?.whatsapp_token?.trim();
  const phoneId = data?.whatsapp_phone_id?.trim();
  if (!token || !phoneId) return null;

  return { token, phoneId, versao: process.env.WHATSAPP_API_VERSION ?? "v21.0" };
}

/** O token de verificação do webhook, escolhido por quem configurou. */
export async function verifyTokenDoCanal(tenantId: string): Promise<string | null> {
  const admin = createAdminClient();
  // paginacao-ok: uma linha, chave primária.
  const { data } = await admin
    .from("tenant_secrets").select("whatsapp_verify_token")
    .eq("tenant_id", tenantId).maybeSingle();
  return data?.whatsapp_verify_token?.trim() || null;
}

/**
 * O que a TELA pode saber — e note o que não está aqui: o token.
 *
 * A tela precisa mostrar "configurado ✓" e ajudar a conferir se é a credencial
 * certa. Os quatro últimos dígitos do `phone_id` bastam para isso, e o token
 * nunca volta, nem mascarado: token mascarado na tela é token que alguém tenta
 * copiar e cola errado em outro lugar.
 */
export async function statusDoCanal(tenantId: string): Promise<{
  configurado: boolean;
  phoneIdFinal: string | null;
  temVerifyToken: boolean;
  atualizadoEm: string | null;
}> {
  const admin = createAdminClient();
  // paginacao-ok: uma linha, chave primária.
  const { data } = await admin
    .from("tenant_secrets")
    .select("whatsapp_token, whatsapp_phone_id, whatsapp_verify_token, updated_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const phoneId = data?.whatsapp_phone_id?.trim() ?? null;
  return {
    configurado: !!data?.whatsapp_token?.trim() && !!phoneId,
    phoneIdFinal: phoneId ? phoneId.slice(-4) : null,
    temVerifyToken: !!data?.whatsapp_verify_token?.trim(),
    atualizadoEm: data?.updated_at ?? null,
  };
}

/**
 * Grava a credencial.
 *
 * Campo em branco NÃO apaga o que já existe — quem abre a tela para trocar só
 * o `phone_id` não pode perder o token por deixar o campo vazio. Para
 * desligar o canal existe `desligarCanal`, que é explícito.
 */
export async function salvarCredencial(
  tenantId: string,
  membershipId: string,
  campos: { token?: string; phoneId?: string; verifyToken?: string },
): Promise<{ ok: boolean; erro?: string }> {
  const admin = createAdminClient();
  const patch: Record<string, unknown> = {
    tenant_id: tenantId,
    updated_at: new Date().toISOString(),
    updated_by: membershipId,
  };
  if (campos.token?.trim()) patch.whatsapp_token = campos.token.trim();
  if (campos.phoneId?.trim()) patch.whatsapp_phone_id = campos.phoneId.trim();
  if (campos.verifyToken?.trim()) patch.whatsapp_verify_token = campos.verifyToken.trim();

  const { error } = await admin.from("tenant_secrets").upsert(patch, { onConflict: "tenant_id" });
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

/** Desliga o canal desta empresa. Explícito, e volta todo mundo para o `wa.me`. */
export async function desligarCanal(tenantId: string): Promise<{ ok: boolean; erro?: string }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("tenant_secrets")
    .update({ whatsapp_token: null, whatsapp_phone_id: null, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId);
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
