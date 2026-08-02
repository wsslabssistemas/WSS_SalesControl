/**
 * Carrega uma biblioteca de segmento (arquivo .sql de seed) para
 * `knowledge_entries`, usando a service_role.
 *
 *   node scripts/seed-knowledge.mjs packages/db/migrations/0017_seed_knowledge_barbearia.sql
 *
 * Em produção a carga é pela migration numerada; este script serve para
 * desenvolvimento e para recarregar após editar a curadoria.
 *
 * Lê o formato usado nos seeds do projeto: um `insert ... values (...),(...);`
 * com tuplas na ordem declarada em COLUMNS abaixo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { stripComments } from "./lib/sql-seed.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// `school` é a 17ª e ÚLTIMA de propósito: o mapeamento é posicional, então
// acrescentar no fim mantém os seeds antigos (16 colunas) lendo certo. Sem
// escola declarada, vale o strategy_map do manifesto para a categoria.
const COLUMNS = [
  "tenant_id", "skill_key", "category", "entry_type", "trigger_questions",
  "opportunity_type", "strategy", "required_facts", "optional_facts", "hard_rules",
  "on_missing_facts", "technique", "common_errors", "next_objective", "source", "status",
  "school",
];

function readEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(ROOT, "apps/web/.env.local"), "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

/** Divide a lista de VALUES em tuplas, respeitando aspas e parênteses. */
function splitTuples(values) {
  const tuples = [];
  let depth = 0, inStr = false, cur = "";
  for (let i = 0; i < values.length; i++) {
    const c = values[i];
    if (inStr) {
      cur += c;
      if (c === "'") { if (values[i + 1] === "'") cur += values[++i]; else inStr = false; }
      continue;
    }
    if (c === "'") { inStr = true; cur += c; continue; }
    // Fim da instrução: o que vem depois do `;` é outra coisa (as queries de
    // verificação no rodapé do seed, por exemplo). Sem isto, os parênteses
    // delas viravam tuplas fantasma — a academia lia 28 onde há 22.
    if (c === ";" && depth === 0) break;
    if (c === "(") { depth++; if (depth === 1) { cur = ""; continue; } }
    if (c === ")") { depth--; if (depth === 0) { tuples.push(cur); continue; } }
    if (depth > 0) cur += c;
  }
  return tuples;
}

/** Divide uma tupla em campos pelo vírgula de topo. */
function splitFields(tuple) {
  const out = [];
  let inStr = false, cur = "";
  for (let i = 0; i < tuple.length; i++) {
    const c = tuple[i];
    if (inStr) {
      if (c === "'") {
        if (tuple[i + 1] === "'") { cur += "'"; i++; } else inStr = false;
      } else cur += c;
      continue;
    }
    if (c === "'") { inStr = true; continue; }
    if (c === ",") { out.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

/** '{"a","b"}' → ["a","b"] */
function pgArray(v) {
  const s = v.trim();
  if (!s.startsWith("{")) return [];
  const inner = s.slice(1, -1).trim();
  if (!inner) return [];
  const out = [];
  let inStr = false, cur = "";
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '"') { inStr = !inStr; continue; }
    if (c === "," && !inStr) { out.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const ARRAY_COLS = new Set(["trigger_questions", "required_facts", "optional_facts", "hard_rules", "common_errors"]);

const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/seed-knowledge.mjs <arquivo.sql>");
  process.exit(1);
}

const raw = stripComments(fs.readFileSync(path.resolve(ROOT, file), "utf8"));

// Os seeds têm duas formas: um INSERT com N tuplas (os novos) ou N INSERTs de
// uma tupla cada (a academia, herdada do Base44). Ler só o último `values`
// carregaria UMA entrada e apagaria as outras 21 — o DELETE roda antes.
const blocos = [...raw.matchAll(/\bvalues\b/gi)].map((m) => m.index + m[0].length);
if (blocos.length === 0) { console.error("Nao encontrei VALUES no arquivo."); process.exit(1); }

const tuplas = [];
for (let i = 0; i < blocos.length; i++) {
  // Cada bloco vai até o próximo `insert`, para não invadir a instrução seguinte.
  const proximoInsert = raw.toLowerCase().indexOf("insert into", blocos[i]);
  const fim = proximoInsert < 0 ? raw.length : proximoInsert;
  tuplas.push(...splitTuples(raw.slice(blocos[i], fim)));
}

const rows = tuplas.map((t) => {
  const f = splitFields(t);
  const row = {};
  COLUMNS.forEach((col, i) => {
    const v = f[i];
    if (v === undefined) return;
    if (v === "null") row[col] = null;
    else if (ARRAY_COLS.has(col)) row[col] = pgArray(v);
    else row[col] = v;
  });
  return row;
});

if (rows.length === 0) { console.error("Nenhuma entrada encontrada."); process.exit(1); }
const skill = rows[0].skill_key;
if (!skill || rows.some((r) => r.skill_key !== skill)) {
  console.error("As entradas devem ser todas do mesmo skill_key.");
  process.exit(1);
}

const env = readEnv();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Recarga idempotente: substitui a biblioteca do segmento, sem tocar no tenant.
const { error: delErr } = await db
  .from("knowledge_entries")
  .delete()
  .eq("skill_key", skill)
  .is("tenant_id", null)
  .eq("source", "skill_seed");
if (delErr) { console.error("Erro ao limpar:", delErr.message); process.exit(1); }

const { error } = await db.from("knowledge_entries").insert(rows);
if (error) { console.error("Erro ao inserir:", error.message); process.exit(1); }

const porCategoria = rows.reduce((a, r) => ((a[r.category] = (a[r.category] ?? 0) + 1), a), {});
console.log(`✓ ${rows.length} entradas carregadas para "${skill}"`);
for (const [c, n] of Object.entries(porCategoria).sort()) console.log(`   ${c}: ${n}`);
