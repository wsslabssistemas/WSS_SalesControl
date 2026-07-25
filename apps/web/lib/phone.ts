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
