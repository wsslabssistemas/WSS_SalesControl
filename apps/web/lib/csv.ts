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

const NAME_H = ["nome", "name", "contato", "cliente", "lead"];
const PHONE_H = ["telefone", "fone", "celular", "phone", "whatsapp", "wpp", "tel", "cel", "numero"];

// Descobre as colunas de nome e telefone pelo cabeçalho. Sem cabeçalho
// reconhecível, assume coluna 0 = nome, coluna 1 = telefone.
export function detectColumns(header: string[]): {
  nameIdx: number;
  phoneIdx: number;
  hasHeader: boolean;
} {
  const h = header.map(strip);
  const nameIdx = h.findIndex((c) => NAME_H.includes(c));
  const phoneIdx = h.findIndex((c) => PHONE_H.some((p) => c.includes(p)));
  if (nameIdx >= 0 || phoneIdx >= 0) {
    return { nameIdx: nameIdx >= 0 ? nameIdx : 0, phoneIdx: phoneIdx >= 0 ? phoneIdx : 1, hasHeader: true };
  }
  return { nameIdx: 0, phoneIdx: 1, hasHeader: false };
}
