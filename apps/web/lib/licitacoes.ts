// Monitor de licitações via PNCP (Portal Nacional de Contratações Públicas).
// API pública, sem login. Consulta sob demanda — nada armazenado.

const BASE = "https://pncp.gov.br/api/consulta/v1/contratacoes/proposta";

// Modalidades mais comuns (a API exige uma por consulta).
const MODALIDADES = [
  { id: 6, nome: "Pregão Eletrônico" },
  { id: 8, nome: "Dispensa" },
  { id: 4, nome: "Concorrência Eletrônica" },
];

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export type Edital = {
  id: string;
  objeto: string;
  orgao: string;
  municipio: string;
  uf: string;
  modalidade: string;
  valor: number | null;
  encerramento: string | null;
  link: string;
  linkOrigem: string | null;
};

function buildLink(numeroControle: string): string {
  // "87849923000109-1-000289/2026" -> app/editais/{cnpj}/{ano}/{seq}
  const m = numeroControle.match(/^(\d+)-\d+-(\d+)\/(\d+)$/);
  if (!m) return "https://pncp.gov.br/app/editais";
  return `https://pncp.gov.br/app/editais/${m[1]}/${m[3]}/${parseInt(m[2], 10)}`;
}

type Raw = {
  numeroControlePNCP: string;
  objetoCompra: string;
  modalidadeNome: string;
  valorTotalEstimado: number | null;
  dataEncerramentoProposta: string | null;
  linkSistemaOrigem: string | null;
  orgaoEntidade?: { razaoSocial?: string };
  unidadeOrgao?: { municipioNome?: string; ufSigla?: string };
};

async function queryOne(uf: string, modalidade: number, dataFinal: string): Promise<Raw[]> {
  const url = `${BASE}?dataFinal=${dataFinal}&codigoModalidadeContratacao=${modalidade}&uf=${uf}&pagina=1&tamanhoPagina=50`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: Raw[] };
  return json.data ?? [];
}

export async function searchEditais(input: { ufs: string[]; keywords: string[] }): Promise<Edital[]> {
  const ufs = input.ufs.map((u) => u.trim().toUpperCase().slice(0, 2)).filter(Boolean).slice(0, 4);
  if (!ufs.length) return [];

  const now = new Date();
  const dataFinal = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

  const combos: { uf: string; mod: number }[] = [];
  for (const uf of ufs) for (const m of MODALIDADES) combos.push({ uf, mod: m.id });

  const results = await Promise.all(
    combos.map((c) => queryOne(c.uf, c.mod, dataFinal).catch(() => [] as Raw[])),
  );

  const seen = new Set<string>();
  const editais: Edital[] = [];
  for (const list of results) {
    for (const r of list) {
      if (seen.has(r.numeroControlePNCP)) continue;
      seen.add(r.numeroControlePNCP);
      editais.push({
        id: r.numeroControlePNCP,
        objeto: r.objetoCompra ?? "",
        orgao: r.orgaoEntidade?.razaoSocial ?? "—",
        municipio: r.unidadeOrgao?.municipioNome ?? "",
        uf: r.unidadeOrgao?.ufSigla ?? "",
        modalidade: r.modalidadeNome ?? "",
        valor: r.valorTotalEstimado ?? null,
        encerramento: r.dataEncerramentoProposta ?? null,
        link: buildLink(r.numeroControlePNCP),
        linkOrigem: r.linkSistemaOrigem ?? null,
      });
    }
  }

  // Filtro por palavras-chave no objeto (qualquer uma).
  const kws = input.keywords.map(stripAccents).filter(Boolean);
  const filtered = kws.length
    ? editais.filter((e) => {
        const obj = stripAccents(e.objeto);
        return kws.some((k) => obj.includes(k));
      })
    : editais;

  // Fecha primeiro em cima.
  filtered.sort((a, b) => (a.encerramento ?? "").localeCompare(b.encerramento ?? ""));
  return filtered.slice(0, 100);
}
