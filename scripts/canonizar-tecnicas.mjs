/**
 * Traduz o texto livre de `interactions.technique` para as 9 ESCOLAS
 * canônicas, preenchendo `interactions.schools` (migration 0045).
 *
 *   node scripts/canonizar-tecnicas.mjs <slug>             # simula
 *   node scripts/canonizar-tecnicas.mjs <slug> --executar  # grava
 *
 * POR QUE DETERMINÍSTICO, E NÃO UMA PASSADA DE IA.
 *
 * A tentação era mandar os 898 rótulos para um modelo classificar. Três
 * motivos para não:
 *   1. O rótulo QUASE SEMPRE NOMEIA O AUTOR — "(Belfort)", "(Tracy)",
 *      "(Hormozi)", "(Kahneman)". A informação que decide a classificação
 *      já está escrita; pedir a um modelo para adivinhar o que está dito é
 *      pagar token para ler.
 *   2. Classificação por modelo não é auditável. Daqui a seis meses
 *      ninguém sabe por que "Puppy Dog Close" virou fechamento clássico.
 *      Aqui está escrito, numa tabela que se lê e se corrige.
 *   3. O produto inteiro se vende por preferir verificação estrutural a
 *      prompt. Usar prompt onde a regra resolve seria incoerente.
 *
 * O QUE NÃO CASA FICA VAZIO, de propósito. Um rótulo que a regra não
 * reconhece não recebe um chute — ele aparece no relatório de não
 * classificados para alguém decidir. É a trava anti-invenção aplicada à
 * nossa própria análise.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
const executar = process.argv.includes("--executar");
if (!slug) { console.error("Uso: node scripts/canonizar-tecnicas.mjs <slug> [--executar]"); process.exit(1); }

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

// ---------------------------------------------------------------------
// O DICIONÁRIO. Cada linha é uma decisão de curadoria, e está aqui para
// ser lida e discutida — não escondida num prompt.
//
// A ordem importa: a primeira regra que casar vence. Autor vem antes de
// palavra solta, porque autor é o sinal mais forte.
// ---------------------------------------------------------------------
const REGRAS = [
  // — SPIN / venda consultiva: perguntar e qualificar antes de cotar.
  // "Intelligence Gathering" é do Belfort, e o ESTADO_DO_PROJETO já
  // registrou que esta é a parte dele que passa no crivo: qualificar
  // antes de cotar. O resto do arsenal dele não entra em lugar nenhum.
  [/intelligence gathering|belfort|spin|rackham|pergunta de (implica|impacto)|descoberta|diagn[oó]stico|qualifica|consultiv/i, "consultiva_spin"],

  // — Cialdini: prova social, autoridade, reciprocidade, escassez.
  [/cialdini|prova social|social proof|autoridade|authority|reciprocidade|reciprocity|escassez|scarcity|unidade|consistency|compromisso e coer/i, "persuasao_cialdini"],

  // — Voss: rotular emoção, isolar objeção, espelhar.
  // Jim Thomas ("Krunch") e negociacao de compra: entra com Voss.
  [/voss|jim thomas|krunch|rotula|labeling|espelham|mirror|isolar a objec|isolamento da objec|respeito (a|à) obje|pergunta calibrada|calibrated/i, "negociacao_voss"],

  // — Challenger: ensinar e desafiar a premissa.
  [/challenger|dixon(?!.*jolt)|ensinar o cliente|reframe|desafiar a premissa/i, "challenger"],

  // — JOLT: o cliente travou. Medo de errar, não falta de valor.
  [/jolt|indecis|medo de errar|reduzir risco|risco percebido|recomenda(r|ção) (um|de um) caminho/i, "indecisao_jolt"],

  // — Blount: cadência, follow-up, ângulo novo, constância.
  // "Pattern Interrupt" entra aqui: no piloto ele aparece sempre em
  // mensagem de retomada, que é exatamente o "ângulo diferente a cada
  // toque". Fora do follow-up seria outra coisa — aqui não é.
  [/blount|cad[eê]ncia|follow.?up|pattern interrupt|reengaj|retomada|paci[eê]ncia estrat|presun[çc][ãa]o de esquecimento|reativa/i, "cadencia_blount"],

  // — Carnegie: relacionamento, acolhimento, nunca humilhar.
  // Girard mora aqui: "Law of 250", "Customer Care" e "Sell Yourself
  // First" são todos sobre a relação, não sobre a técnica de fechar.
  [/carnegie|girard|law of 250|customer care|sell yourself|empatia|acolhimento|valida[çc][ãa]o|respeito ao limite|relacionamento|leave the door open|encerramento elegante|positive reinforcement/i, "relacionamento_carnegie"],

  // — Fechamento clássico: Tracy, Ziglar, Hopkins, Cardone.
  [/tracy|ziglar|hopkins|cardone|close\b|closing|fechamento|assumptive|takeaway|puppy dog|option close|alternativa|one more time|treat buyer|low friction|cta/i, "fechamento_classico"],

  // — Oferta e valor: Hormozi (montar oferta, transparência) e
  //   Kahneman (aversão à perda, ancoragem).
  [/hormozi|kahneman|loss aversion|avers[ãa]o (a|à) perda|ancoragem|anchor|grand slam|transpar[eê]ncia|oferta de valor|valor percebido|hot button|dilui[çc][ãa]o/i, "oferta_valor"],
];

/** Um rótulo composto → as escolas que ele contém, sem repetir. */
export function escolasDe(texto) {
  if (!texto) return [];
  const achadas = new Set();
  // O rótulo é uma LISTA: separar antes de classificar evita que uma
  // palavra de uma técnica contamine a leitura da vizinha.
  for (const parte of String(texto).split(/[,;]|\se\s|\+/)) {
    const t = parte.trim();
    if (t.length < 3) continue;
    for (const [re, escola] of REGRAS) {
      if (re.test(t)) { achadas.add(escola); break; }
    }
  }
  return [...achadas];
}

// ---------------------------------------------------------------------
const { data: tenant } = await db.from("tenants").select("id, name").eq("slug", slug).maybeSingle();
if (!tenant) { console.error(`Empresa "${slug}" não encontrada.`); process.exit(1); }

// PAGINADO de propósito: o PostgREST corta em 1.000 linhas sem avisar, e
// na primeira rodada isso engoliu 53 interações em silêncio. Limite que não
// reclama é o pior tipo — o número volta plausível e menor.
const linhas = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await db
    .from("interactions")
    .select("id, technique, outcome")
    .eq("tenant_id", tenant.id)
    .not("technique", "is", null)
    .range(de, de + 999);
  if (error) { console.error(`✗ ${error.message}`); process.exit(1); }
  linhas.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}

console.log(`${tenant.name}: ${linhas.length} interações com técnica registrada\n`);

const naoClassificados = new Map();
const porEscola = {};
let comEscola = 0;
const atualizacoes = [];

for (const l of linhas) {
  const es = escolasDe(l.technique);
  if (es.length) {
    comEscola++;
    for (const e of es) porEscola[e] = (porEscola[e] ?? 0) + 1;
  } else {
    naoClassificados.set(l.technique, (naoClassificados.get(l.technique) ?? 0) + 1);
  }
  atualizacoes.push({ id: l.id, schools: es });
}

const pct = (n) => `${((n / linhas.length) * 100).toFixed(1)}%`;
console.log(`classificadas: ${comEscola} (${pct(comEscola)})`);
console.log(`sem classificação: ${linhas.length - comEscola} (${pct(linhas.length - comEscola)})\n`);
console.log("ESCOLAS ENCONTRADAS (uma interação pode ter várias):");
for (const [e, n] of Object.entries(porEscola).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${e.padEnd(24)} ${String(n).padStart(4)}  ${pct(n)}`);
}

if (naoClassificados.size) {
  console.log(`\nNÃO CLASSIFICADOS — ${naoClassificados.size} rótulos distintos. Os 10 mais comuns:`);
  for (const [t, n] of [...naoClassificados.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${String(n).padStart(3)}×  ${t.slice(0, 90)}`);
  }
}

if (!executar) {
  console.log(`\n(simulação — nada foi gravado. Rode com --executar para valer.)`);
  process.exitCode = 0;
} else {
  for (let i = 0; i < atualizacoes.length; i += 200) {
    await Promise.all(
      atualizacoes.slice(i, i + 200).map((a) =>
        db.from("interactions").update({ schools: a.schools }).eq("id", a.id),
      ),
    );
  }
  console.log(`\n✓ ${atualizacoes.length} interações atualizadas`);
}
