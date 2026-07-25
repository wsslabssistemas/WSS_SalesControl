import { createClient } from "@supabase/supabase-js";

/**
 * Cliente admin (service_role). IGNORA a RLS — use SÓ no servidor, em operações
 * que exigem privilégio (ex.: convidar usuário). Nunca no browser, nunca com a
 * chave em variável NEXT_PUBLIC.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
