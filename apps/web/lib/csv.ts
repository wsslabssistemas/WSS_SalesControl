// CSV mínimo e robusto o suficiente para planilhas de Excel/Google Sheets:
// detecta separador (vírgula ou ponto-e-vírgula, comum no Excel-BR), respeita
// aspas e aspas escapadas ("").

export function detectDelimiter(text: string): "," | ";" {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  return semis > commas ? ";" : ",";
}

export function parseCsv(text: string, delim: "," | ";" = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;
  let i = 0;
  const t = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // remove BOM
  while (i < t.length) {
    const ch = t[i];
    if (inQ) {
      if (ch === '"') {
        if (t[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === delim) { row.push(field); field = ""; i++; continue; }
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    if (ch === "\r") { i++; continue; }
    field += ch; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function esc(v: string): string {
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function buildCsv(rows: (string | number | null | undefined)[][]): string {
  // ﻿ (BOM) para o Excel abrir UTF-8 com acentos corretos.
  return "﻿" + rows.map((r) => r.map((c) => esc(String(c ?? ""))).join(",")).join("\r\n");
}

const strip = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

const NAME_H = ["nome", "name", "contato", "cliente", "lead", "aluno", "paciente", "razao social"];
const PHONE_H = ["telefone", "fone", "celular", "phone", "whatsapp", "wpp", "tel", "cel", "numero"];
// Vigência do contrato. `fim` antes de `inicio` na busca não importa aqui
// porque as listas não se cruzam — mas "vencimento" e "validade" são as
// palavras que a planilha de academia usa de verdade, e sem elas a coluna
// existiria na planilha e seria descartada em silêncio.
const START_H = ["inicio", "data inicio", "matricula", "adesao", "comeco", "contratacao"];
const END_H = ["vencimento", "validade", "fim", "data fim", "termino", "expira", "renovacao"];

/** Índice da primeira coluna cujo cabeçalho contém uma das palavras. */
function acha(h: string[], palavras: string[]): number {
  return h.findIndex((c) => palavras.some((p) => c.includes(p)));
}

/**
 * DATA EM PT-BR, e o motivo de existir: `new Date("03/08/2026")` no JavaScript
 * é 8 de MARÇO, não 3 de agosto. Numa planilha brasileira inteira isso vira
 * vencimento errado em silêncio — e o alerta de renovação dispara no mês
 * errado, que é pior que não disparar.
 */
export function parseDataBR(v: string): string | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  const br = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (br) {
    const [, d, m, a] = br;
    const ano = a.length === 2 ? `20${a}` : a;
    return `${ano}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;
}

/**
 * Descobre as colunas de nome e telefone pelo cabeçalho.
 *
 * NOME CASA POR "CONTÉM", igual ao telefone — e isso é correção, não conforto.
 * Antes o nome exigia igualdade exata, então `Nome Completo`, `Nome do cliente`
 * e `Nome do aluno` NÃO eram reconhecidos: o índice caía para a coluna 0. Se a
 * coluna 0 fosse um ID, uma data ou um código, três mil contatos entravam com o
 * campo errado no lugar do nome — **sem erro, sem aviso e sem como desfazer**.
 * É a falha na direção que parece segura: a importação diz "3.000 importados" e
 * está toda errada.
 *
 * `adivinhou` diz quando o índice veio de CHUTE e não de cabeçalho reconhecido.
 * A tela usa isso para mostrar qual coluna foi usada em cada campo — quem
 * importa consegue conferir em cinco segundos com um arquivo de teste, que é a
 * única forma de descobrir isso antes e não depois.
 */
export function detectColumns(header: string[]): {
  nameIdx: number;
  phoneIdx: number;
  hasHeader: boolean;
  /** O rótulo da coluna usada em cada campo, para a tela mostrar. */
  nameLabel: string;
  phoneLabel: string;
  adivinhou: { nome: boolean; telefone: boolean };
  /** -1 quando a planilha não traz. Vigência é opcional. */
  startIdx: number;
  endIdx: number;
} {
  const h = header.map(strip);
  const nameIdx = h.findIndex((c) => NAME_H.some((n) => c.includes(n)));
  const phoneIdx = h.findIndex((c) => PHONE_H.some((p) => c.includes(p)));
  const achou = nameIdx >= 0 || phoneIdx >= 0;
  const ni = nameIdx >= 0 ? nameIdx : 0;
  const pi = phoneIdx >= 0 ? phoneIdx : 1;
  return {
    nameIdx: ni,
    phoneIdx: pi,
    hasHeader: achou,
    nameLabel: achou ? (header[ni] ?? "").trim() : "1ª coluna",
    phoneLabel: achou ? (header[pi] ?? "").trim() : "2ª coluna",
    adivinhou: { nome: nameIdx < 0, telefone: phoneIdx < 0 },
    startIdx: acha(h, START_H),
    endIdx: acha(h, END_H),
  };
}
