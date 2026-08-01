/**
 * Cruza os `required_facts` / `optional_facts` da biblioteca de indústria
 * contra as `dna_sections` do manifesto — sem precisar do banco.
 *
 * Por que existe: um typo em caminho de fato (ex.: `producao.prazo` em vez de
 * `producao.prazo_producao`) NÃO quebra nada visível. A entrada simplesmente
 * escala para sempre — falha na direção que parece segura. Foi assim que o
 * `reciprocity.gift` da academia passou despercebido até o 0008.
 *
 * ESPERADO: 0 fatos órfãos, 12/12 categorias canônicas cobertas.
 *
 *   node packages/db/tests/required_facts_industria.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const MANIFEST = path.join(ROOT, "packages/skills/industria/manifest.yaml");
const SEED = path.join(ROOT, "packages/db/migrations/0026_seed_knowledge_industria.sql");

const CANONICAL = [
  "pricing", "risk_free_entry", "availability", "expertise_proof", "catalog",
  "goal_matching", "objections", "commitment_offer", "reciprocity",
  "limits_and_ethics", "retention", "ecosystem",
];

// --- 1. Caminhos de fato que o manifesto oferece (secao.campo) -------------
// Leitura por indentação: dna_sections -> - key: X -> fields: -> - { key: Y ...
const yaml = fs.readFileSync(MANIFEST, "utf8");
const disponiveis = new Set();
let secao = null;
let dentroDeDna = false;
for (const linha of yaml.split(/\r?\n/)) {
  if (/^dna_sections:/.test(linha)) { dentroDeDna = true; continue; }
  if (dentroDeDna && /^[a-z_]+:/.test(linha)) break; // próximo bloco de topo
  if (!dentroDeDna) continue;
  const s = linha.match(/^\s{2}- key:\s*([a-z0-9_]+)/);
  if (s) { secao = s[1]; continue; }
  const f = linha.match(/^\s+- \{\s*key:\s*([a-z0-9_]+)/);
  if (f && secao) disponiveis.add(`${secao}.${f[1]}`);
}

// --- 2. Fatos citados pela biblioteca --------------------------------------
const sql = fs.readFileSync(SEED, "utf8");
const citados = new Map(); // caminho -> quantas vezes
for (const m of sql.matchAll(/'\{("[a-z0-9_.]+"(?:,"[a-z0-9_.]+")*)\}'/g)) {
  for (const bruto of m[1].split(",")) {
    const caminho = bruto.replace(/"/g, "");
    if (!caminho.includes(".")) continue; // gatilhos e erros comuns não são fatos
    citados.set(caminho, (citados.get(caminho) ?? 0) + 1);
  }
}

// --- 3. Categorias usadas --------------------------------------------------
const categorias = new Set(
  [...sql.matchAll(/\(null, 'industria', '([a-z_]+)'/g)].map((m) => m[1]),
);
const entradas = [...sql.matchAll(/\(null, 'industria', '/g)].length;

// --- 4. Veredito -----------------------------------------------------------
const orfaos = [...citados.keys()].filter((c) => !disponiveis.has(c));
const semUso = [...disponiveis].filter((d) => !citados.has(d));
const faltando = CANONICAL.filter((c) => !categorias.has(c));
const extras = [...categorias].filter((c) => !CANONICAL.includes(c));

console.log(`Campos de DNA no manifesto: ${disponiveis.size}`);
console.log(`Caminhos de fato citados:   ${citados.size}`);
console.log(`Entradas na biblioteca:     ${entradas}`);
console.log(`Categorias cobertas:        ${categorias.size}/12`);

let falhou = false;
if (orfaos.length) {
  falhou = true;
  console.log(`\nFALHOU — fato citado que não existe no manifesto (esperado: nenhum):`);
  for (const o of orfaos) console.log(`  ✗ ${o}`);
}
if (faltando.length || extras.length) {
  falhou = true;
  console.log(`\nFALHOU — categorias. Faltando: [${faltando}] Sobrando: [${extras}]`);
}
if (semUso.length) {
  // Não é erro: um campo de DNA pode existir sem entrada que o exija ainda.
  console.log(`\nAviso — campos de DNA que nenhuma entrada usa: ${semUso.join(", ")}`);
}

console.log(falhou ? "\n✗ FALHOU" : "\n✓ PASSOU — 0 fatos órfãos, 12/12 categorias");
process.exit(falhou ? 1 : 0);
