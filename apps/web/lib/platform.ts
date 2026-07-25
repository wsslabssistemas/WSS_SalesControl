/**
 * Admin de plataforma = a WSS Labs (fabricante), que enxerga TODAS as empresas.
 * É acesso acima da RLS, então fica atrás desta checagem + do cliente admin
 * (service_role) no servidor. A lista vem de env (nunca hardcoded no repo).
 */
export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
