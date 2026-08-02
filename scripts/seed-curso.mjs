/**
 * Carrega o conteúdo do curso (módulos, lições e perguntas) do arquivo de
 * migration para o banco, usando a service_role.
 *
 *   node scripts/seed-curso.mjs packages/db/migrations/0033_curso_conteudo_m1.sql
 *
 * Mesma lógica do `seed-knowledge.mjs`: o arquivo .sql continua sendo a
 * verdade (dá para colar no SQL Editor), e o script evita o erro humano de
 * colar 20 KB de texto com acento à mão.
 *
 * Recarga é idempotente: apaga o que o arquivo declara antes de inserir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("Uso: node scripts/seed-curso.mjs <arquivo.sql>");
  process.exit(1);
}

function readEnv() {
  const env = {};
  for (const l of fs.readFileSync(path.join(ROOT, "apps/web/.env.local"), "utf8").split(/\r?\n/)) {
    const i = l.indexOf("=");
    if (i > 0 && !l.trim().startsWith("#")) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = readEnv();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const sql = fs.readFileSync(path.resolve(ROOT, arquivo), "utf8");

/** Tuplas de um bloco VALUES, parando no `;` de topo. */
function tuplas(bloco) {
  const out = [];
  let depth = 0, inStr = false, cur = "";
  for (let i = 0; i < bloco.length; i++) {
    const c = bloco[i];
    if (inStr) {
      cur += c;
      if (c === "'") { if (bloco[i + 1] === "'") cur += bloco[++i]; else inStr = false; }
      continue;
    }
    if (c === "'") { inStr = true; cur += c; continue; }
    if (c === ";" && depth === 0) break;
    if (c === "(") { depth++; if (depth === 1) { cur = ""; continue; } }
    if (c === ")") { depth--; if (depth === 0) { out.push(cur); continue; } }
    if (depth > 0) cur += c;
  }
  return out;
}

/**
 * Campos de uma tupla, respeitando aspas e colchetes de array[...].
 *
 * DENTRO de um array as aspas são PRESERVADAS, de propósito: o conteúdo volta
 * a passar por aqui numa segunda rodada, e sem as aspas uma opção que contém
 * vírgula ("comparar por um número, sem saber o que resolve") viraria duas
 * opções. Foi exatamente o que aconteceu na primeira carga.
 */
function campos(t) {
  const out = [];
  let inStr = false, cur = "", depth = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (c === "'") {
        if (t[i + 1] === "'") { cur += "'"; i++; }
        else { inStr = false; if (depth > 0) cur += "'"; }
      } else cur += c;
      continue;
    }
    if (c === "'") { inStr = true; if (depth > 0) cur += "'"; continue; }
    if (c === "[") depth++;
    if (c === "]") depth--;
    if (c === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

const nulo = (v) => (v === "null" ? null : v);
const depois = (marcador) => {
  const i = sql.indexOf(marcador);
  return i < 0 ? "" : sql.slice(i + marcador.length);
};

const mods = tuplas(depois("insert into public.course_modules (key, ord, title, subtitle, school_key) values"))
  .map((t) => { const f = campos(t); return { key: f[0], ord: Number(f[1]), title: f[2], subtitle: f[3], school_key: nulo(f[4]) }; });

const licoes = tuplas(depois("insert into public.course_lessons (key, module_key, ord, title, minutes, example_category, practice, body) values"))
  .map((t) => { const f = campos(t); return { key: f[0], module_key: f[1], ord: Number(f[2]), title: f[3], minutes: Number(f[4]), example_category: nulo(f[5]), practice: nulo(f[6]), body: f[7] }; });

const perguntas = tuplas(depois("insert into public.course_questions (lesson_key, ord, question, options, correct, explanation) values"))
  .map((t) => {
    const f = campos(t);
    const options = campos(f[3].replace(/^array\s*\[/i, "").replace(/\]\s*$/, ""));
    return { lesson_key: f[0], ord: Number(f[1]), question: f[2], options, correct: Number(f[4]), explanation: f[5] };
  });

console.log(`lidos: ${mods.length} módulos, ${licoes.length} lições, ${perguntas.length} perguntas`);
if (!licoes.length && !mods.length) {
  console.error("Nada encontrado no arquivo — confira os nomes das colunas nos INSERTs.");
  process.exit(1);
}

// Sanidade antes de gravar: pergunta sem opção suficiente ou com índice de
// resposta fora do intervalo é erro de conteúdo, não de banco.
const ruins = perguntas.filter((q) => q.options.length < 2 || q.correct < 0 || q.correct >= q.options.length);
if (ruins.length) {
  console.error(`✗ ${ruins.length} pergunta(s) com opções ou resposta inválida:`);
  for (const r of ruins) console.error(`   ${r.lesson_key} #${r.ord}: ${r.options.length} opções, correct=${r.correct}`);
  process.exit(1);
}

// Recarga: as perguntas e lições dos módulos declarados saem primeiro.
const chavesLicao = licoes.map((l) => l.key);
const chavesModulo = mods.map((m) => m.key);
if (chavesLicao.length) await db.from("course_questions").delete().in("lesson_key", chavesLicao);
if (chavesLicao.length) await db.from("course_lessons").delete().in("key", chavesLicao);
if (chavesModulo.length) await db.from("course_modules").delete().in("key", chavesModulo);

for (const [tabela, linhas] of [["course_modules", mods], ["course_lessons", licoes], ["course_questions", perguntas]]) {
  if (!linhas.length) continue;
  const { error } = await db.from(tabela).insert(linhas);
  if (error) { console.error(`✗ ${tabela}: ${error.message}`); process.exit(1); }
  console.log(`✓ ${tabela}: ${linhas.length}`);
}
