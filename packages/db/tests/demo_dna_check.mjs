/**
 * Valida o DNA de demonstração (`packages/db/seeds/demo_dna.sql`) contra os
 * manifestos — sem tocar no banco, para poder rodar no CI.
 *
 * Por que existe: DNA de demonstração com chave errada é pior que DNA vazio.
 * A chave é contrato com `required_facts`; escrever `producao.prazo` em vez de
 * `producao.prazo_producao` faz a entrada escalar para sempre, e a falha
 * acontece na direção que PARECE segura — o motor simplesmente não redige e
 * ninguém entende por quê.
 *
 * Verifica, para cada empresa demo:
 *   1. o bloco é JSON válido;
 *   2. toda chave `secao.campo` existe nas `dna_sections` do manifesto;
 *   3. todo campo `required: true` do manifesto está preenchido.
 *
 * ESPERADO: 5 empresas, 0 erros.
 *
 *   node packages/db/tests/demo_dna_check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SEED = path.join(ROOT, "packages/db/seeds/demo_dna.sql");
const SKILLS = path.join(ROOT, "packages/skills");

// O slug carrega o segmento: `demo-escola-esportiva` → `escola_esportiva`.
const skillDoSlug = (slug) => slug.replace(/^demo-/, "").replace(/-/g, "_");

const sql = fs.readFileSync(SEED, "utf8");
const blocos = [...sql.matchAll(/\('(demo-[a-z-]+)',\s*\$json\$([\s\S]*?)\$json\$/g)];

console.log(`Empresas demo no seed: ${blocos.length}`);
let erros = 0;

for (const [, slug, corpo] of blocos) {
  let dna;
  try {
    dna = JSON.parse(corpo);
  } catch (e) {
    erros++;
    console.log(`✗ ${slug}: JSON inválido — ${e.message}`);
    continue;
  }

  const skill = skillDoSlug(slug);
  const arquivo = path.join(SKILLS, skill, "manifest.yaml");
  if (!fs.existsSync(arquivo)) {
    erros++;
    console.log(`✗ ${slug}: não achei o manifesto de "${skill}"`);
    continue;
  }

  const manifesto = yaml.parse(fs.readFileSync(arquivo, "utf8"));
  const validos = new Set();
  const obrigatorios = [];
  for (const s of manifesto.dna_sections ?? []) {
    for (const f of s.fields ?? []) {
      validos.add(`${s.key}.${f.key}`);
      if (f.required) obrigatorios.push(`${s.key}.${f.key}`);
    }
  }

  // `free_notes` é seção livre do manifesto (texto solto), não tem campos.
  const escritos = [];
  for (const [sec, campos] of Object.entries(dna)) {
    if (typeof campos !== "object" || campos === null || Array.isArray(campos)) {
      escritos.push(sec);
      continue;
    }
    for (const c of Object.keys(campos)) escritos.push(`${sec}.${c}`);
  }

  const secoesLivres = new Set(
    (manifesto.dna_sections ?? []).filter((s) => !s.fields?.length).map((s) => s.key),
  );
  const invalidos = escritos.filter((c) => !validos.has(c) && !secoesLivres.has(c));

  const vazio = (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0);
  const faltando = obrigatorios.filter((o) => {
    const [s, c] = o.split(".");
    return vazio(dna[s]?.[c]);
  });

  if (invalidos.length || faltando.length) {
    erros++;
    console.log(`✗ ${slug} (${skill})`);
    if (invalidos.length) console.log(`   chave inexistente no manifesto: ${invalidos.join(", ")}`);
    if (faltando.length) console.log(`   obrigatório vazio: ${faltando.join(", ")}`);
  } else {
    console.log(
      `✓ ${slug} (${skill}) — ${escritos.length} campos, ${obrigatorios.length} obrigatórios preenchidos`,
    );
  }
}

console.log(erros ? "\n✗ FALHOU" : "\n✓ PASSOU — DNA de demonstração coerente com os manifestos");
process.exit(erros ? 1 : 0);
