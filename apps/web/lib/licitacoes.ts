// Monitor de licitações via PNCP. Usa a BUSCA TEXTUAL oficial do portal
// (api/search) — procura no texto todo do edital (objeto + itens), não só no
// objeto. Pública, sem login, nada armazenado.

const SEARCH = "https://pncp.gov.br/api/search/";

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export type Edital = {
  id: string;
  objeto: string;
  orgao: string;
  municipio: string;
  uf: string;
  modalidade: string;
  encerramento: string | null;
  publicacao: string | null;
  link: string;
};

type Item = {
  numero_controle_pncp: string;
  description: string | null;
  orgao_nome: string | null;
  orgao_cnpj: string | null;
  municipio_nome: string | null;
  uf: string | null;
  modalidade_licitacao_nome: string | null;
  data_fim_vigencia: string | null;
  data_publicacao_pncp: string | null;
  ano: number | null;
  numero_sequencial: number | null;
};

async function queryOne(q: string, ufs: string): Promise<Item[]> {
  const params = new URLSearchParams({
    tipos_documento: "edital",
    status: "recebendo_proposta",
    ordenacao: "-data",
    pagina: "1",
    tam_pagina: "30",
  });
  if (q) params.set("q", q);
  if (ufs) params.set("ufs", ufs);
  const res = await fetch(`${SEARCH}?${params.toString()}`, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: Item[] };
  return json.items ?? [];
}

function toEdital(it: Item): Edital {
  const link =
    it.orgao_cnpj && it.ano && it.numero_sequencial != null
      ? `https://pncp.gov.br/app/editais/${it.orgao_cnpj}/${it.ano}/${it.numero_sequencial}`
      : "https://pncp.gov.br/app/editais";
  return {
    id: it.numero_controle_pncp,
    objeto: it.description ?? "",
    orgao: it.orgao_nome ?? "—",
    municipio: it.municipio_nome ?? "",
    uf: it.uf ?? "",
    modalidade: it.modalidade_licitacao_nome ?? "",
    encerramento: it.data_fim_vigencia,
    publicacao: it.data_publicacao_pncp,
    link,
  };
}

export async function searchEditais(input: { ufs: string[]; keywords: string[] }): Promise<Edital[]> {
  const ufList = input.ufs.map((u) => u.trim().toUpperCase().slice(0, 2)).filter(Boolean).slice(0, 4);
  if (!ufList.length) return [];
  const ufsParam = ufList.join(",");
  const ufSet = new Set(ufList);

  const kws = input.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 6);
  const queries = kws.length ? kws : [""]; // sem palavra-chave = todos os abertos na UF

  const results = await Promise.all(queries.map((q) => queryOne(q, ufsParam).catch(() => [] as Item[])));

  const nowMs = Date.now();
  const seen = new Set<string>();
  const editais: Edital[] = [];
  for (const list of results) {
    for (const it of list) {
      if (!it.numero_controle_pncp || seen.has(it.numero_controle_pncp)) continue;
      if (it.uf && !ufSet.has(it.uf)) continue; // segurança: só as UFs pedidas
      if (it.data_fim_vigencia && new Date(it.data_fim_vigencia).getTime() < nowMs) continue;
      seen.add(it.numero_controle_pncp);
      editais.push(toEdital(it));
    }
  }

  editais.sort((a, b) => (a.encerramento ?? "").localeCompare(b.encerramento ?? ""));
  return editais.slice(0, 100);
}
