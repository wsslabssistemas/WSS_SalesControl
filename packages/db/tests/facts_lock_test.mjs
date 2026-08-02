/**
 * A trava anti-invenção, testada contra o DNA real das empresas demo.
 *
 * Duas metades importam igual:
 *   • travar quando falta fato exigido (senão o motor inventa);
 *   • NÃO travar quando o fato existe (senão o produto vira inútil — escalada
 *     demais é tão ruim quanto invenção).
 *
 * ESPERADO: todos os casos abaixo, com o valor escrito em cada um.
 *
 *   node packages/db/tests/facts_lock_test.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// --- cópia de lib/facts.ts (o teste roda em Node puro, sem o bundler) ------
const vazio = (v) =>
  v == null ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

function temFato(sections, caminho) {
  const [secao, campo] = String(caminho ?? "").split(".");
  if (!secao || !campo) return false;
  const bloco = (sections ?? {})[secao];
  if (bloco == null || typeof bloco !== "object") return false;
  return !vazio(bloco[campo]);
}

// Duas janelas: só a 1ª entrada VETA; as 3 primeiras avisam o que falta.
const JANELA_VETO = 1;
function checkRequiredFacts(sections, entries, janelaAviso = 3) {
  const faltando = new Set();
  let travou = false;
  entries.slice(0, janelaAviso).forEach((e, pos) => {
    for (const c of e.required_facts ?? []) {
      if (temFato(sections, c)) continue;
      faltando.add(c);
      if ((e.on_missing_facts ?? "escalate") === "escalate" && pos < JANELA_VETO) travou = true;
    }
  });
  return { faltando: [...faltando], travou };
}

// --------------------------------------------------------------------------
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

const { data: dnas } = await db
  .from("commercial_dna")
  .select("sections, tenants!inner(slug, skill_key)")
  .eq("is_current", true);
const porSlug = Object.fromEntries((dnas ?? []).map((d) => [d.tenants.slug, d]));

const { data: entradas } = await db
  .from("knowledge_entries")
  .select("skill_key, category, required_facts, on_missing_facts")
  .is("tenant_id", null)
  .eq("source", "skill_seed")
  .eq("status", "active");

const pega = (skill, categoria) =>
  (entradas ?? []).filter((e) => e.skill_key === skill && e.category === categoria);

const CASOS = [
  // DNA da demo está completo → a trava tem que ficar QUIETA.
  { nome: "indústria, preço (DNA completo)", slug: "demo-industria", skill: "industria", cat: "pricing", travar: false },
  { nome: "indústria, prazo (DNA completo)", slug: "demo-industria", skill: "industria", cat: "availability", travar: false },
  { nome: "sob medida, preço (DNA completo)", slug: "demo-sob-medida", skill: "sob_medida", cat: "pricing", travar: false },
  { nome: "clínica, preço (DNA completo)", slug: "demo-clinica", skill: "clinica", cat: "pricing", travar: false },
  { nome: "distribuidora, preço (DNA completo)", slug: "demo-distribuidora", skill: "distribuidora", cat: "pricing", travar: false },

  // DNA vazio → tem que TRAVAR em tudo que exige fato.
  { nome: "indústria, preço (DNA vazio)", vazio: true, skill: "industria", cat: "pricing", travar: true },
  { nome: "sob medida, preço (DNA vazio)", vazio: true, skill: "sob_medida", cat: "pricing", travar: true },
  { nome: "clínica, preço (DNA vazio)", vazio: true, skill: "clinica", cat: "pricing", travar: true },
];

// --- casos sintéticos: a regra do veto -------------------------------------
// Cada um veio de um comportamento observado em campo, não de imaginação.
const SINTETICOS = [
  {
    nome: "cliente pede a FAIXA e o DNA tem a faixa (plans ausente em 2º lugar)",
    // Aconteceu na Academia Nova: o motor se recusou a dizer a faixa que tinha,
    // porque a 2ª entrada exigia `pricing.plans`. Escalada indevida.
    sections: { pricing: { range: "R$ 120 a R$ 190 por mes" } },
    entries: [
      { required_facts: ["pricing.range"], on_missing_facts: "escalate" },
      { required_facts: ["pricing.plans"], on_missing_facts: "escalate" },
    ],
    travar: false,
    contem: ["pricing.plans"], // avisa, mas não veta
  },
  {
    nome: "a entrada que governa exige fato ausente",
    sections: { pricing: { range: "R$ 120 a R$ 190 por mes" } },
    entries: [
      { required_facts: ["risk_free_entry.exists"], on_missing_facts: "escalate" },
      { required_facts: ["pricing.range"], on_missing_facts: "escalate" },
    ],
    travar: true,
    contem: ["risk_free_entry.exists"],
  },
  {
    nome: "`omit` nunca veta, mesmo governando",
    sections: {},
    entries: [{ required_facts: ["diferencial.tempo_de_fabrica"], on_missing_facts: "omit" }],
    travar: false,
    contem: ["diferencial.tempo_de_fabrica"],
  },
  {
    nome: "seção existe mas o campo está vazio conta como ausente",
    sections: { pricing: { range: "   " } },
    entries: [{ required_facts: ["pricing.range"], on_missing_facts: "escalate" }],
    travar: true,
    contem: ["pricing.range"],
  },
];

let falhas = 0;
for (const c of SINTETICOS) {
  const r = checkRequiredFacts(c.sections, c.entries);
  const okTrava = r.travou === c.travar;
  const okLista = (c.contem ?? []).every((f) => r.faltando.includes(f));
  const ok = okTrava && okLista;
  if (!ok) falhas++;
  console.log(
    `${ok ? "✓" : "✗"} ${c.nome} → travou=${r.travou} (esperado ${c.travar}), faltando=[${r.faltando.join(", ")}]`,
  );
}
console.log("");

for (const c of CASOS) {
  const sections = c.vazio ? {} : porSlug[c.slug]?.sections ?? {};
  const entries = pega(c.skill, c.cat);
  if (!entries.length) {
    console.log(`✗ ${c.nome}: nenhuma entrada em ${c.skill}/${c.cat}`);
    falhas++;
    continue;
  }
  const r = checkRequiredFacts(sections, entries);
  const ok = r.travou === c.travar;
  if (!ok) falhas++;
  console.log(
    `${ok ? "✓" : "✗"} ${c.nome} → travou=${r.travou} (esperado ${c.travar})` +
      (r.faltando.length ? `  faltando: ${r.faltando.join(", ")}` : ""),
  );
}

// Contagem geral: quantas entradas travariam com o DNA real de cada demo.
console.log("\nCobertura por empresa demo (quantas entradas travariam hoje):");
for (const slug of Object.keys(porSlug).filter((s) => s.startsWith("demo-"))) {
  const skill = porSlug[slug].tenants.skill_key;
  const doSkill = (entradas ?? []).filter((e) => e.skill_key === skill);
  const travam = doSkill.filter((e) => checkRequiredFacts(porSlug[slug].sections, [e]).travou);
  console.log(`  ${slug.padEnd(24)} ${travam.length}/${doSkill.length} entradas travariam`);
}

console.log(falhas ? "\n✗ FALHOU" : "\n✓ PASSOU — a trava dispara com fato ausente e fica quieta com DNA completo");
process.exit(falhas ? 1 : 0);
