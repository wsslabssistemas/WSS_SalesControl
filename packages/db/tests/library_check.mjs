/**
 * Valida a BIBLIOTECA (os seeds de conhecimento), não o manifesto.
 *
 * Por que existe: o validador de Skill exige as 12 categorias canônicas no
 * MANIFESTO — e ninguém nunca olhou as entradas. Foi por essa fresta que a
 * barbearia ganhou 2 entradas na categoria `policies`, que não existe em
 * lugar nenhum, e sobreviveu desde o 0017.
 *
 * Verifica, em todo `*_seed_knowledge_*.sql`:
 *   1. categoria ∈ 12 canônicas
 *   2. escola (quando declarada) ∈ 9 canônicas
 *   3. on_missing_facts ∈ {escalate, omit}
 *   4. required_facts existe nas dna_sections do manifesto do segmento
 *   5. o manifesto do segmento tem strategy_map cobrindo as 12 categorias
 *   6. o CARREGADOR lê todas as entradas do arquivo
 *
 * A verificação 6 existe porque um `;` perdido no meio do arquivo encerra o
 * INSERT e deixa as entradas seguintes órfãs — SQL inválido que passa
 * despercebido, porque o carregador simplesmente lê menos e não reclama. Foi
 * o caso da barbearia: 19 entradas no arquivo, 16 carregadas, 3 sumindo do
 * banco a cada recarga.
 *
 * ESPERADO: tudo PASSOU, 0 problemas.
 *
 *   node packages/db/tests/library_check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const MIGRATIONS = path.join(ROOT, "packages/db/migrations");
const SKILLS = path.join(ROOT, "packages/skills");

const CATEGORIAS = [
  "pricing", "risk_free_entry", "availability", "expertise_proof", "catalog",
  "goal_matching", "objections", "commitment_offer", "reciprocity",
  "limits_and_ethics", "retention", "ecosystem",
];
const ESCOLAS = [
  "consultiva_spin", "persuasao_cialdini", "negociacao_voss", "challenger",
  "indecisao_jolt", "cadencia_blount", "relacionamento_carnegie",
  "fechamento_classico", "oferta_valor",
];

/** Caminhos `secao.campo` que o manifesto do segmento oferece. */
function fatosDoManifesto(skill) {
  const arquivo = path.join(SKILLS, skill, "manifest.yaml");
  if (!fs.existsSync(arquivo)) return null;
  const linhas = fs.readFileSync(arquivo, "utf8").split(/\r?\n/);
  const fatos = new Set();
  const mapa = {};
  let secao = null;
  let bloco = null;
  for (const linha of linhas) {
    if (/^[a-z_]+:/.test(linha)) bloco = linha.split(":")[0];
    if (bloco === "dna_sections") {
      const s = linha.match(/^\s{2}- key:\s*([a-z0-9_]+)/);
      if (s) { secao = s[1]; continue; }
      const f = linha.match(/^\s+- \{\s*key:\s*([a-z0-9_]+)/);
      if (f && secao) fatos.add(`${secao}.${f[1]}`);
    }
    if (bloco === "strategy_map") {
      const m = linha.match(/^\s{2}([a-z_]+):\s*([a-z_]+)\s*$/);
      if (m) mapa[m[1]] = m[2];
    }
  }
  return { fatos, mapa };
}

const problemas = [];
const resumo = [];

for (const arquivo of fs.readdirSync(MIGRATIONS).filter((f) => f.includes("seed_knowledge"))) {
  const sql = fs.readFileSync(path.join(MIGRATIONS, arquivo), "utf8");
  // `[a-z0-9_]` e não `[a-z_]`: `software_b2b` tem um DÍGITO no meio, e com a
  // classe antiga o arquivo inteiro não casava — a biblioteca era pulada em
  // SILÊNCIO, sem validar categoria, escola nem fato. Um verificador que pula
  // o que não entende é pior que não ter verificador: ele dá o ✓ verde.
  const skill = sql.match(/\(null, '([a-z0-9_]+)',/)?.[1];
  if (!skill) {
    problemas.push(`${arquivo}: não consegui identificar o segmento — arquivo NÃO verificado`);
    continue;
  }

  const manifesto = fatosDoManifesto(skill);
  if (!manifesto) { problemas.push(`${arquivo}: sem manifesto para "${skill}"`); continue; }

  // Categoria e tipo de cada entrada.
  const entradas = [...sql.matchAll(/\(null, '[a-z0-9_]+', '([a-z_]+)', '([a-z_]+)'/g)];
  for (const [, categoria] of entradas) {
    if (!CATEGORIAS.includes(categoria)) {
      problemas.push(`${arquivo}: categoria fora das 12 canônicas → "${categoria}"`);
    }
  }

  // Escola, quando declarada no seed.
  for (const [, escola] of sql.matchAll(/'(?:skill_seed)',\s*'active',\s*'([a-z_]+)'/g)) {
    if (!ESCOLAS.includes(escola)) {
      problemas.push(`${arquivo}: escola inexistente → "${escola}"`);
    }
  }

  // on_missing_facts.
  for (const [, v] of sql.matchAll(/'\{[^}]*\}',\s*'\{[^}]*\}',\s*'([a-z]+)',/g)) {
    if (v !== "escalate" && v !== "omit") {
      problemas.push(`${arquivo}: on_missing_facts inválido → "${v}"`);
    }
  }

  // Fatos citados existem no manifesto.
  const citados = new Set();
  for (const m of sql.matchAll(/'\{("[a-z0-9_.]+"(?:,"[a-z0-9_.]+")*)\}'/g)) {
    for (const bruto of m[1].split(",")) {
      const c = bruto.replace(/"/g, "");
      if (c.includes(".")) citados.add(c);
    }
  }
  for (const c of citados) {
    if (!manifesto.fatos.has(c)) problemas.push(`${arquivo}: fato órfão → "${c}"`);
  }

  // O carregador enxerga todas? Reproduz o corte dele: cada bloco `values` vai
  // até o próximo INSERT, e as tuplas terminam no primeiro `;` de topo.
  const semComentarios = sql.replace(/^\s*--.*$/gm, "");
  let lidas = 0;
  for (const m of semComentarios.matchAll(/\bvalues\b/gi)) {
    const inicio = m.index + m[0].length;
    const proximo = semComentarios.toLowerCase().indexOf("insert into", inicio);
    const trecho = semComentarios.slice(inicio, proximo < 0 ? semComentarios.length : proximo);
    let depth = 0, inStr = false;
    for (let i = 0; i < trecho.length; i++) {
      const c = trecho[i];
      if (inStr) { if (c === "'") { if (trecho[i + 1] === "'") i++; else inStr = false; } continue; }
      if (c === "'") { inStr = true; continue; }
      if (c === ";" && depth === 0) break;
      if (c === "(") depth++;
      else if (c === ")") { depth--; if (depth === 0) lidas++; }
    }
  }
  if (lidas !== entradas.length) {
    problemas.push(
      `${arquivo}: o carregador leria ${lidas} de ${entradas.length} entradas — ` +
      `procure um ';' perdido no meio do INSERT`,
    );
  }

  // strategy_map cobre as 12.
  const semMapa = CATEGORIAS.filter((c) => !manifesto.mapa[c]);
  const escolaInvalida = Object.entries(manifesto.mapa).filter(([, e]) => !ESCOLAS.includes(e));
  if (semMapa.length) problemas.push(`${skill}: strategy_map não cobre [${semMapa.join(", ")}]`);
  for (const [c, e] of escolaInvalida) problemas.push(`${skill}: strategy_map com escola inexistente → ${c}=${e}`);

  resumo.push(`  ${skill.padEnd(18)} ${String(entradas.length).padStart(3)} entradas · ${citados.size} fatos citados · strategy_map ok`);
}

console.log("Bibliotecas verificadas:");
for (const l of resumo) console.log(l);

if (problemas.length) {
  console.log(`\n✗ FALHOU — ${problemas.length} problema(s):`);
  for (const p of problemas) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log("\n✓ PASSOU — categorias, escolas, fatos e mapas de estratégia consistentes");
