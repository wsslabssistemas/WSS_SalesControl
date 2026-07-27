// Monitor de licitações via PNCP. Usa a BUSCA TEXTUAL oficial do portal
// (api/search) — procura no texto todo do edital (objeto + itens), não só no
// objeto. Pública, sem login, nada armazenado.

const SEARCH = "https://pncp.gov.br/api/search/";
const CONSULTA = "https://pncp.gov.br/api/consulta/v1";
const PNCP_API = "https://pncp.gov.br/api/pncp/v1";

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
  data_assinatura?: string | null;
  ano: number | null;
  numero_sequencial: number | null;
};

async function queryOne(q: string, ufs: string, pagina = 1): Promise<Item[]> {
  const params = new URLSearchParams({
    tipos_documento: "edital",
    status: "recebendo_proposta",
    ordenacao: "-data",
    pagina: String(pagina),
    tam_pagina: "20", // limite da API do PNCP
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

// ---- Vencedores de contratos (quem ganhou → cliente potencial) ----

export type Winner = {
  cnpj: string; // do fornecedor que ganhou
  razao: string;
  orgao: string;
  objeto: string;
  valor: number | null;
  municipio: string;
  uf: string;
  data: string | null;
  link: string;
};

async function queryContracts(q: string, ufs: string, pagina = 1): Promise<Item[]> {
  const params = new URLSearchParams({
    tipos_documento: "contrato",
    ordenacao: "-data",
    pagina: String(pagina),
    tam_pagina: "20",
  });
  if (q) params.set("q", q);
  if (ufs) params.set("ufs", ufs);
  const res = await fetch(`${SEARCH}?${params.toString()}`, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: Item[] };
  return json.items ?? [];
}

async function contractDetail(orgaoCnpj: string, ano: number, seq: number): Promise<{ cnpj: string; razao: string; valor: number | null } | null> {
  try {
    const res = await fetch(`${PNCP_API}/orgaos/${orgaoCnpj}/contratos/${ano}/${seq}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return null;
    const d = (await res.json()) as { niFornecedor?: string; nomeRazaoSocialFornecedor?: string; valorGlobal?: number };
    if (!d.niFornecedor) return null;
    return { cnpj: d.niFornecedor, razao: d.nomeRazaoSocialFornecedor ?? "—", valor: d.valorGlobal ?? null };
  } catch {
    return null;
  }
}

export async function searchWinners(input: { ufs: string[]; keywords: string[] }): Promise<Winner[]> {
  const ufList = input.ufs.map((u) => u.trim().toUpperCase().slice(0, 2)).filter(Boolean).slice(0, 4);
  if (!ufList.length) return [];
  const ufsParam = ufList.join(",");
  const ufSet = new Set(ufList);
  const kws = input.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 6);
  const queries = kws.length ? kws : [""];

  const lists = await Promise.all(queries.map((q) => queryContracts(q, ufsParam).catch(() => [] as Item[])));

  const seen = new Set<string>();
  const rows: Item[] = [];
  for (const list of lists) {
    for (const it of list) {
      if (!it.numero_controle_pncp || seen.has(it.numero_controle_pncp)) continue;
      if (it.uf && !ufSet.has(it.uf)) continue;
      if (it.orgao_cnpj == null || it.ano == null || it.numero_sequencial == null) continue;
      seen.add(it.numero_controle_pncp);
      rows.push(it);
    }
  }
  const top = rows.slice(0, 15);

  const details = await Promise.all(
    top.map((it) => contractDetail(it.orgao_cnpj as string, it.ano as number, it.numero_sequencial as number)),
  );

  const winners: Winner[] = [];
  const seenForn = new Set<string>();
  for (let i = 0; i < top.length; i++) {
    const det = details[i];
    if (!det || seenForn.has(det.cnpj)) continue; // um card por fornecedor
    seenForn.add(det.cnpj);
    const it = top[i];
    winners.push({
      cnpj: det.cnpj,
      razao: det.razao,
      orgao: it.orgao_nome ?? "—",
      objeto: it.description ?? "",
      valor: det.valor,
      municipio: it.municipio_nome ?? "",
      uf: it.uf ?? "",
      data: it.data_assinatura ?? it.data_publicacao_pncp ?? null,
      link: `https://pncp.gov.br/app/contratos/${it.orgao_cnpj}/${it.ano}/${it.numero_sequencial}`,
    });
  }
  return winners;
}

export type Rank = { nome: string; n: number };
export type Intel = {
  amostra: number;
  totalAbertos: number | null;
  byOrgao: Rank[];
  byCidade: Rank[];
  byModalidade: Rank[];
  byMes: Rank[]; // editais abertos por mês de encerramento (calendário à frente)
  ritmoUf: string;
  ritmoEstado: Rank[]; // editais publicados por mês no estado (últimos 12 meses)
};

// Ritmo de publicação de editais no estado (Pregão Eletrônico), últimos 12 meses.
// Sazonalidade geral do governo — barato: um total por mês.
export async function seasonality(uf: string): Promise<Rank[]> {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const tasks = months.map(async ({ y, m }) => {
    const ini = `${y}${String(m + 1).padStart(2, "0")}01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const fim = `${y}${String(m + 1).padStart(2, "0")}${String(lastDay).padStart(2, "0")}`;
    const url = `${CONSULTA}/contratacoes/publicacao?dataInicial=${ini}&dataFinal=${fim}&codigoModalidadeContratacao=6&uf=${uf}&pagina=1&tamanhoPagina=10`;
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!r.ok) return { nome: `${MESES[m]}/${String(y).slice(2)}`, n: 0 };
      const j = (await r.json()) as { totalRegistros?: number };
      return { nome: `${MESES[m]}/${String(y).slice(2)}`, n: j.totalRegistros ?? 0 };
    } catch {
      return { nome: `${MESES[m]}/${String(y).slice(2)}`, n: 0 };
    }
  });
  return Promise.all(tasks);
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function topN(items: string[], n: number): Rank[] {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = (it ?? "").trim();
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([nome, cnt]) => ({ nome, n: cnt })).sort((a, b) => b.n - a.n).slice(0, n);
}

// Inteligência: amostra maior de editais abertos do perfil, agregada por órgão,
// cidade, modalidade e mês de encerramento. Puro consumo da busca do PNCP.
export async function analyzeEditais(input: { ufs: string[]; keywords: string[] }): Promise<Intel> {
  const ufList = input.ufs.map((u) => u.trim().toUpperCase().slice(0, 2)).filter(Boolean).slice(0, 4);
  if (!ufList.length) return { amostra: 0, totalAbertos: null, byOrgao: [], byCidade: [], byModalidade: [], byMes: [], ritmoUf: "", ritmoEstado: [] };
  const ufsParam = ufList.join(",");
  const ufSet = new Set(ufList);
  const kws = input.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 6);
  const queries = kws.length ? kws : [""];

  // Orçamento de chamadas (tam_pagina=20). Mais páginas = amostra melhor.
  const pagesPer = Math.max(1, Math.min(8, Math.floor(16 / queries.length)));
  const tasks: Promise<Item[]>[] = [];
  for (const q of queries) for (let p = 1; p <= pagesPer; p++) tasks.push(queryOne(q, ufsParam, p).catch(() => [] as Item[]));
  const [results, ritmoEstado] = await Promise.all([Promise.all(tasks), seasonality(ufList[0])]);

  const nowMs = Date.now();
  const seen = new Set<string>();
  const rows: Item[] = [];
  for (const list of results) {
    for (const it of list) {
      if (!it.numero_controle_pncp || seen.has(it.numero_controle_pncp)) continue;
      if (it.uf && !ufSet.has(it.uf)) continue;
      if (it.data_fim_vigencia && new Date(it.data_fim_vigencia).getTime() < nowMs) continue;
      seen.add(it.numero_controle_pncp);
      rows.push(it);
    }
  }

  const meses = rows
    .map((r) => r.data_fim_vigencia)
    .filter(Boolean)
    .map((d) => {
      const dt = new Date(d as string);
      return `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, "0")}`;
    });
  const byMes = [...new Set(meses)]
    .sort()
    .map((ym) => {
      const [y, m] = ym.split("-");
      return { nome: `${MESES[Number(m)]}/${y.slice(2)}`, n: meses.filter((x) => x === ym).length };
    });

  return {
    amostra: rows.length,
    totalAbertos: null,
    byOrgao: topN(rows.map((r) => r.orgao_nome ?? ""), 8),
    byCidade: topN(rows.map((r) => r.municipio_nome ?? ""), 6),
    byModalidade: topN(rows.map((r) => r.modalidade_licitacao_nome ?? ""), 5),
    byMes,
    ritmoUf: ufList[0],
    ritmoEstado,
  };
}
