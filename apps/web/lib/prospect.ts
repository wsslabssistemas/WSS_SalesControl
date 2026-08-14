// Prospecção B2B por dados públicos. Fonte trocável (hoje: busca pública da Casa
// dos Dados; enriquecimento pela minhareceita.org). Nada é baixado/armazenado —
// consulta sob demanda. Trocar por dump da Receita depois não muda a UI.

import { mapLimit } from "./concorrencia";

const SEARCH_URL = "https://api.casadosdados.com.br/v5/public/cnpj/pesquisa";
const ENRICH_URL = (cnpj: string) => `https://minhareceita.org/${cnpj}`;

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

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

export type SearchResult = { total: number; companies: Company[]; capped: boolean };

type City = { municipio: string; uf?: string };

async function queryOne(cnaes: string[], cities: City[], page = 1): Promise<{ total: number; companies: Company[] }> {
  const body = {
    codigo_atividade_principal: cnaes,
    situacao_cadastral: ["ATIVA"],
    uf: [...new Set(cities.map((c) => c.uf).filter(Boolean))] as string[],
    municipio: cities.map((c) => c.municipio).filter(Boolean),
    limite: 20,
    pagina: page,
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
    companies: (json.cnpjs ?? []).map((c) => ({
      cnpj: c.cnpj,
      razao: c.razao_social,
      fantasia: c.nome_fantasia,
      situacao: c.situacao_cadastral?.situacao_atual ?? null,
    })),
  };
}

// A busca pública devolve ~20 e ignora paginação. Para trazer mais variedade sem
// custo, disparamos uma consulta por (CNAE × cidade) e juntamos sem repetir.
const MAX_COMBOS = 8;
const MAX_RESULTS = 120;

export async function searchCompanies(input: { cnaes: string[]; cities: string[] }): Promise<SearchResult> {
  const cnaeCodes = input.cnaes.map(parseCnae).filter(Boolean) as string[];
  const cities = input.cities.map(parseCity).filter((c) => c.municipio);
  if (!cnaeCodes.length || !cities.length) return { total: 0, companies: [], capped: false };

  const broad = await queryOne(cnaeCodes, cities);
  const map = new Map<string, Company>();
  for (const c of broad.companies) map.set(c.cnpj, c);

  const combos: { cnae: string; city: City }[] = [];
  for (const cn of cnaeCodes) for (const ct of cities) combos.push({ cnae: cn, city: ct });

  if (combos.length > 1) {
    const slice = combos.slice(0, MAX_COMBOS);
    const results = await Promise.all(
      slice.map((c) => queryOne([c.cnae], [c.city]).catch(() => ({ total: 0, companies: [] as Company[] }))),
    );
    for (const r of results) for (const c of r.companies) if (!map.has(c.cnpj)) map.set(c.cnpj, c);
  }

  const companies = [...map.values()].slice(0, MAX_RESULTS);
  return { total: broad.total, companies, capped: broad.total > companies.length };
}

export type CompanyDetail = {
  cnpj: string;
  razao: string;
  fantasia: string | null;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  endereco: string | null;
  municipio: string | null;
  uf: string | null;
  cnae: string | null;
  porte: string | null;
  capital: number | null;
  abertura: string | null;
  situacao: string | null;
};

async function fetchReceita(cnpj: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(ENRICH_URL(cnpj.replace(/\D/g, "")), { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Retrato da empresa a partir dos dados públicos, para o motor abordar com
 * contexto real em vez de mensagem genérica. Ex.: "Comércio varejista de
 * material de construção · média empresa · desde 2011 · Canoas/RS".
 * É FATO público — nada aqui é inventado.
 */
export async function resumirEmpresa(cnpj: string): Promise<string | null> {
  const j = await fetchReceita(cnpj);
  if (!j) return null;

  const partes: string[] = [];
  const atividade = j.cnae_fiscal_descricao ? String(j.cnae_fiscal_descricao) : null;
  if (atividade) partes.push(atividade);

  // Atividades secundárias revelam o que mais a empresa faz — ouro para a
  // abordagem ("vocês também trabalham com X").
  const sec = Array.isArray(j.cnaes_secundarios) ? (j.cnaes_secundarios as { descricao?: string }[]) : [];
  const outras = sec.map((c) => c.descricao).filter(Boolean).slice(0, 3);
  if (outras.length) partes.push(`também atua com: ${outras.join("; ")}`);

  if (j.porte) partes.push(String(j.porte).toLowerCase());
  if (j.data_inicio_atividade) {
    const ano = String(j.data_inicio_atividade).slice(0, 4);
    if (ano) partes.push(`no mercado desde ${ano}`);
  }
  const cidade = [j.municipio, j.uf].filter(Boolean).join("/");
  if (cidade) partes.push(String(cidade));

  return partes.length ? partes.join(" · ") : null;
}

// Telefone (só) — usado ao adicionar ao funil.
export async function enrichCompany(cnpj: string): Promise<{ phone: string | null } | null> {
  const j = await fetchReceita(cnpj);
  if (!j) return null;
  return { phone: String(j.ddd_telefone_1 ?? "").replace(/\D/g, "") || null };
}

// Detalhe completo — usado na ficha da empresa.
export async function getCompanyDetail(cnpj: string): Promise<CompanyDetail | null> {
  const j = await fetchReceita(cnpj);
  if (!j) return null;
  const str = (k: string) => (j[k] ? String(j[k]) : null);
  const endereco = [str("logradouro"), str("numero"), str("bairro")].filter(Boolean).join(", ") || null;
  return {
    cnpj: String(j.cnpj ?? cnpj),
    razao: str("razao_social") ?? "",
    fantasia: str("nome_fantasia"),
    phone: String(j.ddd_telefone_1 ?? "").replace(/\D/g, "") || null,
    phone2: String(j.ddd_telefone_2 ?? "").replace(/\D/g, "") || null,
    email: str("email"),
    endereco,
    municipio: str("municipio"),
    uf: str("uf"),
    cnae: str("cnae_fiscal_descricao"),
    porte: str("porte"),
    capital: typeof j.capital_social === "number" ? (j.capital_social as number) : null,
    abertura: str("data_inicio_atividade"),
    situacao: str("descricao_situacao_cadastral") ?? str("situacao_cadastral"),
  };
}


// Concorrência limitada — rajada derruba API pública (a lição do PNCP).
// A implementação saiu daqui para `lib/concorrencia.ts` quando a
// sincronização passou a precisar da mesma coisa; o comportamento é o mesmo.

export type EnderecoDaEmpresa = {
  cnpj: string;
  bairro: string | null;
  cep: string | null;
  municipio: string | null;
};

/**
 * Busca endereço de várias empresas de uma vez.
 *
 * POR QUE ISTO É UMA SEGUNDA ETAPA E NÃO PARTE DA BUSCA: a busca pública NÃO
 * devolve endereço — só cnpj, razão social e situação (verificado em ago/2026).
 * O endereço só existe no enriquecimento, uma chamada por CNPJ.
 *
 * `teto` existe para o custo de tempo não virar tela travada: 120 chamadas com
 * concorrência 5 já são dezenas de segundos, e ninguém espera isso olhando uma
 * lista. Falha de uma empresa NÃO derruba o lote — volta sem endereço, e a
 * tela mostra "—" em vez de sumir com a empresa.
 */
export async function enderecosDe(cnpjs: string[], teto = 40): Promise<Map<string, EnderecoDaEmpresa>> {
  const alvos = cnpjs.slice(0, teto);
  const linhas = await mapLimit(alvos, 5, async (cnpj) => {
    const j = await fetchReceita(cnpj);
    return {
      cnpj,
      bairro: j?.bairro ? String(j.bairro) : null,
      cep: j?.cep ? String(j.cep) : null,
      municipio: j?.municipio ? String(j.municipio) : null,
    } as EnderecoDaEmpresa;
  });
  return new Map(linhas.map((l) => [l.cnpj, l]));
}
