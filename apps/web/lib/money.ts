// Dinheiro em CENTAVOS (inteiro), nunca string de exibição — string impede
// qualquer análise por faixa de valor.

/** "45", "45,50", "R$ 1.234,56" → centavos. Devolve null se não for válido. */
export function parseMoneyToCents(input: string): number | null {
  const limpo = String(input ?? "").replace(/[^\d,.-]/g, "").trim();
  if (!limpo) return null;
  // Vírgula é decimal (padrão brasileiro); ponto é separador de milhar.
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const n = Number(normalizado);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
