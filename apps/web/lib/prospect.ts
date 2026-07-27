// Prospecção B2B por dados públicos. Fonte trocável (hoje: busca pública da Casa
// dos Dados; enriquecimento pela minhareceita.org). Nada é baixado/armazenado —
// consulta sob demanda. Trocar por dump da Receita depois não muda a UI.

const SEARCH_URL = "https://api.casadosdados.com.br/v5/public/cnpj/pesquisa";
const ENRICH_URL = (cnpj: string) => `https://minhareceita.org/${cnpj}`;

const stripAccents = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "");

// "9313-1/00 academias" -> "9313100"
export function parseCnae(line: string): string | null {
  const digits = line.replace(/\D/g, "").slice(0, 7);
  return digits.length >= 5 ? digits : null;
}

// "Porto Alegre/RS" -> { municipio: "PORTO ALEGRE", uf: "RS" }
export function parseCity(line: string): { municipio: string; uf?: string } {
  const [name, uf] = line.split("/");
  return {
    municipio: stripAccents((name ?? "").trim()).toUpperCase(),
    uf: uf ? uf.trim().toUpperCase().slice(0, 2) : undefined,
  };
}

export type Company = {
  cnpj: string;
  razao: string;
  fantasia: string | null;
  situacao: string | null;
};

export type SearchResult = { total: number; companies: Company[] };

export async function searchCompanies(input: {
  cnaes: string[];
  cities: string[];
  page?: number;
}): Promise<SearchResult> {
  const cnaes = input.cnaes.map(parseCnae).filter(Boolean) as string[];
  const parsed = input.cities.map(parseCity);
  const municipios = parsed.map((p) => p.municipio).filter(Boolean);
  const ufs = [...new Set(parsed.map((p) => p.uf).filter(Boolean))] as string[];

  const body = {
    codigo_atividade_principal: cnaes,
    situacao_cadastral: ["ATIVA"],
    uf: ufs,
    municipio: municipios,
    limite: 20,
    pagina: input.page ?? 1,
  };

  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Busca falhou (HTTP ${res.status})`);

  const json = (await res.json()) as {
    total?: number;
    cnpjs?: { cnpj: string; razao_social: string; nome_fantasia: string | null; situacao_cadastral?: { situacao_atual?: string } }[];
  };
  return {
    total: json.total ?? 0,
    companies: (json.cnpjs ?? []).slice(0, 20).map((c) => ({
      cnpj: c.cnpj,
      razao: c.razao_social,
      fantasia: c.nome_fantasia,
      situacao: c.situacao_cadastral?.situacao_atual ?? null,
    })),
  };
}

// Enriquecimento sob demanda: telefone/e-mail/endereço por CNPJ (grátis).
export async function enrichCompany(cnpj: string): Promise<{
  phone: string | null;
  email: string | null;
  municipio: string | null;
  uf: string | null;
} | null> {
  try {
    const res = await fetch(ENRICH_URL(cnpj.replace(/\D/g, "")), { cache: "no-store" });
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, unknown>;
    const phone = String(j.ddd_telefone_1 ?? "").replace(/\D/g, "") || null;
    return {
      phone,
      email: (j.email as string) || null,
      municipio: (j.municipio as string) || null,
      uf: (j.uf as string) || null,
    };
  } catch {
    return null;
  }
}
