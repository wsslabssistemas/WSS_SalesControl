// Monitor de licitações via PNCP. Usa a BUSCA TEXTUAL oficial do portal
// (api/search) — procura no texto todo do edital (objeto + itens), não só no
// objeto. Pública, sem login, nada armazenado.

const SEARCH = "https://pncp.gov.br/api/search/";
const CONSULTA = "https://pncp.gov.br/api/consulta/v1";
const PNCP_API = "https://pncp.gov.br/api/pncp/v1";

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// O PNCP derruba rajadas: 28 chamadas simultâneas -> 24 falham. Buscamos com
// concorrência baixa e tentamos de novo antes de desistir.
async function getJson<T>(url: string, tentativas = 3): Promise<T | null> {
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (res.ok) return (await res.json()) as T;
    } catch {
      // rede instável; tenta de novo
    }
    if (i < tentativas - 1) await sleep(400 * (i + 1));
  }
  return null;
}

// Executa em lotes pequenos, em vez de tudo de uma vez.
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    out.push(...(await Promise.all(batch.map(fn))));
    if (i + limit < items.length) await sleep(250);
  }
  return out;
}

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

// tam_pagina=100 funciona (o que falhava antes era a rajada, não o tamanho).
// Uma chamada por palavra traz tudo: rápido, completo e sem bloqueio.
async function queryOne(q: string, ufs: string, opts: { abertos?: boolean; tam?: number } = {}): Promise<{ items: Item[]; total: number }> {
  const params = new URLSearchParams({
    tipos_documento: "edital",
    ordenacao: "-data",
    pagina: "1",
    tam_pagina: String(opts.tam ?? 100),
  });
  if (opts.abertos !== false) params.set("status", "recebendo_proposta");
  if (q) params.set("q", q);
  if (ufs) params.set("ufs", ufs);
  const json = await getJson<{ items?: Item[]; total?: number }>(`${SEARCH}?${params.toString()}`);
  return { items: json?.items ?? [], total: json?.total ?? 0 };
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

  const results = await mapLimit(queries, 2, (q) =>
    queryOne(q, ufsParam).catch(() => ({ items: [] as Item[], total: 0 })),
  );

  const nowMs = Date.now();
  const seen = new Set<string>();
  const editais: Edital[] = [];
  for (const { items: list } of results) {
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
    tam_pagina: "50",
  });
  if (q) params.set("q", q);
  if (ufs) params.set("ufs", ufs);
  const json = await getJson<{ items?: Item[] }>(`${SEARCH}?${params.toString()}`);
  return json?.items ?? [];
}

async function contractDetail(orgaoCnpj: string, ano: number, seq: number): Promise<{ cnpj: string; razao: string; valor: number | null } | null> {
  const d = await getJson<{ niFornecedor?: string; nomeRazaoSocialFornecedor?: string; valorGlobal?: number }>(
    `${PNCP_API}/orgaos/${orgaoCnpj}/contratos/${ano}/${seq}`,
  );
  if (!d?.niFornecedor) return null;
  return { cnpj: d.niFornecedor, razao: d.nomeRazaoSocialFornecedor ?? "—", valor: d.valorGlobal ?? null };
}

export async function searchWinners(input: { ufs: string[]; keywords: string[] }): Promise<Winner[]> {
  const ufList = input.ufs.map((u) => u.trim().toUpperCase().slice(0, 2)).filter(Boolean).slice(0, 4);
  if (!ufList.length) return [];
  const ufsParam = ufList.join(",");
  const ufSet = new Set(ufList);
  const kws = input.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 6);
  const queries = kws.length ? kws : [""];

  const lists = await mapLimit(queries, 2, (q) => queryContracts(q, ufsParam).catch(() => [] as Item[]));

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

  const details = await mapLimit(top, 3, (it) =>
    contractDetail(it.orgao_cnpj as string, it.ano as number, it.numero_sequencial as number),
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
  analisados: number; // editais do ramo analisados (histórico)
  totalHistorico: number; // quantos existem no total (tamanho do mercado)
  abertosAgora: number;
  byOrgao: Rank[];
  byCidade: Rank[];
  byModalidade: Rank[];
  sazonalidade: Rank[]; // em que MÊS DO ANO o seu ramo costuma abrir edital
  periodo: string;
};

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

/**
 * Inteligência do ramo. Usa o HISTÓRICO (não só os editais abertos agora) —
 * é o que revela compradores recorrentes e em que época do ano eles compram.
 * Uma chamada por palavra-chave (tam_pagina=100) + uma para contar os abertos.
 */
export async function analyzeEditais(input: { ufs: string[]; keywords: string[] }): Promise<Intel> {
  const vazio: Intel = { analisados: 0, totalHistorico: 0, abertosAgora: 0, byOrgao: [], byCidade: [], byModalidade: [], sazonalidade: [], periodo: "" };
  const ufList = input.ufs.map((u) => u.trim().toUpperCase().slice(0, 2)).filter(Boolean).slice(0, 4);
  if (!ufList.length) return vazio;
  const ufsParam = ufList.join(",");
  const ufSet = new Set(ufList);
  const kws = input.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 4);
  const queries = kws.length ? kws : [""];

  // Histórico do ramo (sem filtro de status) — base ampla para os padrões.
  const hist = await mapLimit(queries, 2, (q) =>
    queryOne(q, ufsParam, { abertos: false, tam: 100 }).catch(() => ({ items: [] as Item[], total: 0 })),
  );
  // Quantos estão abertos agora (uma chamada leve).
  const abertos = await mapLimit(queries, 2, (q) =>
    queryOne(q, ufsParam, { tam: 1 }).catch(() => ({ items: [] as Item[], total: 0 })),
  );

  const seen = new Set<string>();
  const rows: Item[] = [];
  let totalHistorico = 0;
  for (const r of hist) {
    totalHistorico += r.total;
    for (const it of r.items) {
      if (!it.numero_controle_pncp || seen.has(it.numero_controle_pncp)) continue;
      if (it.uf && !ufSet.has(it.uf)) continue;
      seen.add(it.numero_controle_pncp);
      rows.push(it);
    }
  }

  // Sazonalidade REAL do ramo: em que mês do ano estes editais foram publicados.
  const porMes = new Array(12).fill(0) as number[];
  const datas: number[] = [];
  for (const r of rows) {
    const d = r.data_publicacao_pncp;
    if (!d) continue;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) continue;
    porMes[dt.getMonth()]++;
    datas.push(dt.getTime());
  }
  const sazonalidade = porMes.map((n, m) => ({ nome: MESES[m], n }));

  let periodo = "";
  if (datas.length) {
    const min = new Date(Math.min(...datas));
    const max = new Date(Math.max(...datas));
    const f = (d: Date) => `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
    periodo = `${f(min)} a ${f(max)}`;
  }

  return {
    analisados: rows.length,
    totalHistorico,
    abertosAgora: abertos.reduce((s, a) => s + a.total, 0),
    byOrgao: topN(rows.map((r) => r.orgao_nome ?? ""), 8),
    byCidade: topN(rows.map((r) => r.municipio_nome ?? ""), 6),
    byModalidade: topN(rows.map((r) => r.modalidade_licitacao_nome ?? ""), 5),
    sazonalidade,
    periodo,
  };
}
