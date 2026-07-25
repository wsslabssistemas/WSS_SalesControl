/**
 * Normaliza telefone para só dígitos — o controle de duplicidade.
 * Colapsa variações de formatação: "(51) 98251-2270" e "51 98251 2270"
 * viram o mesmo valor, e o índice único (tenant_id, phone) do banco pega o dup.
 *
 * v1 pragmático. E.164 completo (código de país, 9º dígito) fica para depois,
 * com biblioteca de telefonia — normalizar errado corromperia dado.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length ? digits : null;
}

/** Exibição simples: agrupa para leitura sem prometer formato oficial. */
export function displayPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  return phone;
}

/**
 * Número no formato que o wa.me espera (com código de país).
 * Heurística BR: 10–11 dígitos = local (DDD + número) → prefixa 55.
 * 12–13 dígitos = assume que já traz o código de país.
 */
export function whatsappNumber(phone: string | null | undefined): string | null {
  const d = normalizePhone(phone);
  if (!d) return null;
  if (d.length === 10 || d.length === 11) return "55" + d;
  return d;
}
