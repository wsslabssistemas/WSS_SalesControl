/**
 * A escolha da técnica, medida sem IA.
 *
 * O motor faz duas coisas antes de qualquer token ser gasto: escolhe QUAIS
 * entradas da biblioteca entram no contexto (`lib/match`) e resolve QUAL
 * ESCOLA governa a situação (`entrada.school ?? strategy_map[categoria]`).
 * Se essa parte erra, nenhum prompt salva — e ela é determinística, então dá
 * para testar de graça e a cada push.
 *
 * Cada caso abaixo declara o VALOR ESPERADO: a mensagem que um cliente real
 * mandaria, a categoria que deveria vencer e a escola que deveria governar.
 * "Parece certo" não é critério.
 *
 *   node packages/db/tests/retrieval_check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// ---------------------------------------------------------------------------
// Cópia fiel do casamento de `apps/web/lib/match.ts`. Duplicar aqui é
// deliberado: o teste roda em Node puro, sem o bundler do Next. Se o algoritmo
// mudar lá e não aqui, este teste começa a mentir — por isso ele compara
// CATEGORIA e ESCOLA (contrato), não a pontuação.
// ---------------------------------------------------------------------------
// Espelha `lib/match.ts`: `custa`/`custam` NÃO são ignoradas (são o sinal de
// uma pergunta de preço); `quanto` continua ignorada por ser ambígua.
const STOP = new Set(
  "a o e de da do das dos em no na nos nas um uma uns umas que qual quais quanto quanta quantos eh sao para pra por com sem me te se ao aos isso esse essa este esta vou quero queria gostaria saber ter tem tenho voce voces vcs oi ola bom boa dia tarde noite sobre mais menos meu minha teu tua nossa seu sua the of".split(/\s+/),
);
const toks = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

function fieldScore(q, campo) {
  for (const w of campo) if (w === q) return 1;
  if (q.length >= 4) for (const w of campo) if (w.startsWith(q) || q.startsWith(w) || w.includes(q)) return 0.5;
  return 0;
}
function pontuar(query, e) {
  const campos = [
    { toks: toks((e.trigger_questions ?? []).join(" ")), weight: 3 },
    { toks: toks(e.category ?? ""), weight: 2 },
    { toks: toks(e.technique ?? ""), weight: 1.5 },
    { toks: toks(e.strategy ?? ""), weight: 1 },
    { toks: toks(e.answer ?? ""), weight: 0.6 },
  ];
  let total = 0;
  for (const q of [...new Set(toks(query))]) {
    let melhor = 0;
    for (const c of campos) melhor = Math.max(melhor, fieldScore(q, c.toks) * c.weight);
    total += melhor;
  }
  return total;
}

// ---------------------------------------------------------------------------
// OS CASOS. Mensagem real → o que o motor DEVE escolher.
// ---------------------------------------------------------------------------
const CASOS = [
  // Preço: em ticket baixo pode fechar; em ticket alto tem que descobrir antes.
  { skill: "barbearia", msg: "quanto ta o corte?", categoria: "pricing", escola: "oferta_valor" },
  { skill: "industria", msg: "me passa o preco do metro", categoria: "pricing", escola: "consultiva_spin" },
  { skill: "clinica", msg: "quanto custa um implante?", categoria: "pricing", escola: "consultiva_spin" },

  // Objeção de preço: negociação, nunca desconto reflexo.
  { skill: "sob_medida", msg: "achei caro esse orcamento", categoria: "objections", escola: "negociacao_voss" },
  { skill: "distribuidora", msg: "ta caro, o outro faz mais barato", categoria: "objections", escola: "negociacao_voss" },

  // A objeção nº1 da indústria brasileira.
  { skill: "industria", msg: "o importado sai mais barato que o seu", categoria: "objections", escola: "negociacao_voss" },

  // INDECISÃO — o cliente concordou e travou. Não é objeção.
  { skill: "sob_medida", msg: "vou pensar e depois te falo", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "clinica", msg: "preciso pensar, vou conversar em casa", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "industria", msg: "vou aguardar a proxima colecao", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "academia", msg: "vou pensar com calma", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "escola_esportiva", msg: "vou ver com meu marido", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "automacao", msg: "vou levar para a diretoria", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "barbearia", msg: "depois eu marco, qualquer coisa eu chamo", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "distribuidora", msg: "vou pensar, preciso ver com o socio", categoria: "commitment_offer", escola: "indecisao_jolt" },

  // AUTOSSERVIÇO — quem não quer conversar.
  { skill: "industria", msg: "so me manda a ficha tecnica, nao precisa ligar", categoria: "catalog", escola: "consultiva_spin" },
  { skill: "distribuidora", msg: "prefiro por escrito, sem visita por enquanto", categoria: "catalog", escola: "consultiva_spin" },

  // Retenção e recompra.
  { skill: "industria", msg: "esse cliente nao repoe ha meses", categoria: "retention", escola: "cadencia_blount" },
  { skill: "barbearia", msg: "faz tempo que ele nao aparece", categoria: "retention", escola: "cadencia_blount" },

  // Agenda e disponibilidade.
  { skill: "barbearia", msg: "tem horario hoje?", categoria: "availability", escola: "fechamento_classico" },
  { skill: "industria", msg: "para quando fica pronto?", categoria: "availability", escola: "negociacao_voss" },

  // Fornecedor atual: entrar pela fresta, não pedir substituição.
  { skill: "industria", msg: "ja tenho fornecedor, estou atendido", categoria: "objections", escola: "negociacao_voss" },
  { skill: "distribuidora", msg: "ja tenho fornecedor", categoria: "objections", escola: "negociacao_voss" },
];

// ---------------------------------------------------------------------------
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

const { data: skills } = await db.from("skills").select("key, manifest");
const mapas = Object.fromEntries((skills ?? []).map((s) => [s.key, s.manifest?.strategy_map ?? {}]));

const { data: entradas } = await db
  .from("knowledge_entries")
  .select("skill_key, category, school, trigger_questions, strategy, technique, answer")
  .is("tenant_id", null)
  .eq("source", "skill_seed")
  .eq("status", "active");

const porSkill = {};
for (const e of entradas ?? []) (porSkill[e.skill_key] ??= []).push(e);

// CONTRATO DO TESTE: o motor manda até 8 entradas para o modelo, então exigir
// que a certa seja sempre a 1ª mede algo que o produto não promete. O que
// importa é que a técnica certa CHEGUE com destaque — por isso o critério é
// estar entre as 3 primeiras. O 1º lugar é impresso sempre, para enxergar
// deriva antes de virar problema.
const POSICOES = 3;

let falhas = 0;
console.log(`mensagem → 1º lugar (esperado nas ${POSICOES} primeiras)\n`);
for (const caso of CASOS) {
  const lista = porSkill[caso.skill] ?? [];
  const ranked = lista
    .map((e) => ({ e, score: pontuar(caso.msg, e) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const escolaDe = (e) => (e ? e.school ?? mapas[caso.skill]?.[e.category] ?? null : null);
  const top = ranked[0]?.e;
  const topo = ranked.slice(0, POSICOES);
  const achou = topo.findIndex(
    (x) => x.e.category === caso.categoria && escolaDe(x.e) === caso.escola,
  );

  if (achou < 0) falhas++;
  const marca = achou < 0 ? "✗" : achou === 0 ? "✓" : "~";
  console.log(
    `${marca} [${caso.skill}] "${caso.msg}"  →  ${top?.category ?? "(nada casou)"} / ${escolaDe(top) ?? "—"}` +
      (achou > 0 ? `   (o esperado veio em ${achou + 1}º)` : ""),
  );
  if (achou < 0) {
    console.log(`     esperado: ${caso.categoria} / ${caso.escola}`);
    console.log(
      `     top ${POSICOES}: ${topo.map((x) => `${x.e.category}/${escolaDe(x.e)} (${x.score.toFixed(1)})`).join(" · ") || "(vazio)"}`,
    );
  }
}

console.log(`\n${CASOS.length - falhas}/${CASOS.length} casos corretos`);
console.log(falhas ? "✗ FALHOU" : "✓ PASSOU — a escolha de técnica está coerente");
process.exit(falhas ? 1 : 0);
