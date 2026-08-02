/**
 * PROVA DO MOTOR — roda mensagens reais contra a IA, com o mesmo contexto que
 * o Responder monta, e imprime a resposta para leitura humana.
 *
 *   node scripts/provar-motor.mjs            # a bateria toda
 *   node scripts/provar-motor.mjs industria  # só um segmento
 *
 * ⚠ ESPELHO: o prompt aqui é uma cópia do de
 * `apps/web/app/painel/responder/ai-actions.ts`. Mudou lá, mude aqui — senão
 * este script passa a medir uma coisa que o produto não faz. O que ele NÃO
 * cobre: agenda, catálogo, histórico do contato e respostas que converteram
 * (ficam vazios de propósito, para isolar DNA + biblioteca + escola).
 *
 * Custa tokens de verdade. Cada caso imprime o custo estimado.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
const modelo = createAnthropic({ apiKey: (env.AI_API_KEY ?? "").trim() })(env.AI_MODEL ?? "claude-sonnet-5");

const custo = (i, o) => Math.round(((i / 1e6) * 3 + (o / 1e6) * 15) * 5.5 * 100);

// --- casamento (espelho de lib/match.ts) -----------------------------------
const STOP = new Set(
  "a o e de da do das dos em no na nos nas um uma uns umas que qual quais quanto quanta quantos eh sao para pra por com sem me te se ao aos isso esse essa este esta vou quero queria gostaria saber ter tem tenho voce voces vcs oi ola bom boa dia tarde noite sobre mais menos meu minha teu tua nossa seu sua the of".split(/\s+/),
);
const toks = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
const fieldScore = (q, campo) => {
  for (const w of campo) if (w === q) return 1;
  if (q.length >= 4) for (const w of campo) if (w.startsWith(q) || q.startsWith(w) || w.includes(q)) return 0.5;
  return 0;
};
function pontuar(query, e) {
  const campos = [
    { t: toks((e.trigger_questions ?? []).join(" ")), w: 3 },
    { t: toks(e.category ?? ""), w: 2 },
    { t: toks(e.technique ?? ""), w: 1.5 },
    { t: toks(e.strategy ?? ""), w: 1 },
    { t: toks(e.answer ?? ""), w: 0.6 },
  ];
  let total = 0;
  for (const q of [...new Set(toks(query))]) {
    let melhor = 0;
    for (const c of campos) melhor = Math.max(melhor, fieldScore(q, c.t) * c.w);
    total += melhor;
  }
  return total;
}

const schema = z.object({
  resposta_sugerida: z.string().describe("A resposta pronta para o vendedor copiar e enviar ao cliente, em PT-BR, natural e concisa. Vazia se for para escalar."),
  objetivo: z.string().describe("O objetivo desta resposta em uma frase."),
  explicacao: z.string().describe("Por que esta resposta funciona — ensina o vendedor."),
  tecnica: z.string().describe("A técnica de venda escolhida e o mestre de referência."),
  proximo_passo: z.string().describe("O próximo passo recomendado após esta resposta."),
  etapa_jornada: z.string().describe("A etapa da jornada em que o cliente parece estar."),
  emocao: z.string().describe("A emoção dominante identificada no cliente."),
  faltam_fatos: z.array(z.string()).describe("Fatos necessários que NÃO estão no DNA."),
  escalar: z.boolean().describe("true se faltam fatos essenciais e a resposta deve ser escalada."),
});

const fatos = (sections) => {
  const out = [];
  for (const [k, v] of Object.entries(sections ?? {})) {
    if (v == null || (typeof v === "object" && Object.keys(v).length === 0)) continue;
    out.push(`### ${k}\n${typeof v === "string" ? v : JSON.stringify(v, null, 2)}`);
  }
  return out.length ? out.join("\n\n") : "(DNA vazio — nenhum fato cadastrado)";
};

// --- a bateria -------------------------------------------------------------
const CASOS = [
  // Academia Nova tem DNA incompleto de propósito (só faixa de preço, horário e
  // endereço): é o caso que prova a trava anti-invenção estrutural.
  { slug: "academia-nova", msg: "Voces tem semana gratis para experimentar?" },
  { slug: "academia-nova", msg: "Qual a faixa de preco da mensalidade?" },
  { slug: "demo-industria", msg: "Bom dia. Recebi a amostra e o pessoal do desenvolvimento aprovou, mas o importado sai bem mais barato. Como fica?" },
  { slug: "demo-industria", msg: "Vou aguardar a proxima colecao para decidir." },
  { slug: "demo-industria", msg: "So me manda a ficha tecnica por escrito, nao precisa ligar." },
  { slug: "demo-sob-medida", msg: "Recebi o orcamento da cozinha. Vou pensar e depois te falo." },
  { slug: "demo-clinica", msg: "Quanto custa um implante?" },
  { slug: "demo-escola-esportiva", msg: "Gostei, mas vou ver com meu marido antes de matricular." },
  { slug: "demo-distribuidora", msg: "Ja tenho fornecedor e estou bem atendido." },
  { slug: "demo-industria", msg: "Voces conseguem entregar 3 mil metros ate sexta que vem?" },
];

const filtro = process.argv[2];
const alvos = filtro ? CASOS.filter((c) => c.slug.includes(filtro)) : CASOS;

let totalCusto = 0;
for (const [i, caso] of alvos.entries()) {
  const { data: tenant } = await db.from("tenants").select("id, name, skill_key").eq("slug", caso.slug).maybeSingle();
  const [{ data: skill }, { data: dna }, { data: seed }] = await Promise.all([
    db.from("skills").select("manifest").eq("key", tenant.skill_key).maybeSingle(),
    db.from("commercial_dna").select("sections").eq("tenant_id", tenant.id).eq("is_current", true).maybeSingle(),
    db.from("knowledge_entries").select("category, school, trigger_questions, strategy, technique, answer, common_errors, next_objective, required_facts, on_missing_facts, hard_rules").is("tenant_id", null).eq("skill_key", tenant.skill_key).eq("status", "active"),
  ]);
  const manifest = skill?.manifest ?? {};
  const sections = dna?.sections ?? {};
  const mapa = manifest.strategy_map ?? {};

  const ranked = (seed ?? []).map((e) => ({ e, s: pontuar(caso.msg, e) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  const usadas = (ranked.length ? ranked.slice(0, 8) : (seed ?? []).slice(0, 6).map((e) => ({ e, s: 0 }))).map((x) => x.e);
  const escolas = usadas.map((e) => e.school ?? mapa[e.category] ?? null);

  // Trava anti-invenção (espelho de lib/facts.ts).
  const vazio = (v) => v == null || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
  const temFato = (sec, caminho) => {
    const [s, c] = String(caminho ?? "").split(".");
    if (!s || !c) return false;
    const bloco = (sec ?? {})[s];
    return bloco != null && typeof bloco === "object" && !vazio(bloco[c]);
  };
  // Só a 1ª entrada VETA; as 3 primeiras avisam o que falta.
  const faltando = new Set();
  let travou = false;
  usadas.slice(0, 3).forEach((e, pos) => {
    for (const cam of e.required_facts ?? []) {
      if (temFato(sections, cam)) continue;
      faltando.add(cam);
      if ((e.on_missing_facts ?? "escalate") === "escalate" && pos < 1) travou = true;
    }
  });

  const { data: dic } = await db.from("sales_schools").select("key, name, author, principle, when_to_use, when_to_avoid");
  const porChave = new Map((dic ?? []).map((s) => [s.key, s]));
  const blocoEscolas = [...new Set(escolas.filter(Boolean))]
    .map((k) => porChave.get(k))
    .filter(Boolean)
    .map((s) => `- ${s.name} (${s.author}): ${s.principle}\n  Usar quando: ${s.when_to_use}\n  NÃO usar quando: ${s.when_to_avoid}`)
    .join("\n");

  const biblioteca = usadas
    .map((e, k) => `Categoria: ${e.category}\nEscola: ${escolas[k] ?? "—"}\nGatilho: ${(e.trigger_questions ?? []).join(" / ")}\nEstratégia: ${e.strategy ?? ""}\nTécnica: ${e.technique ?? ""}\nErros a evitar: ${(e.common_errors ?? []).join("; ")}\nPróximo passo: ${e.next_objective ?? ""}`)
    .join("\n---\n");

  const stageList = (manifest.journey?.stages ?? []).map((s) => `${s.key} (${s.label})`).join(", ");
  const hardRules = Array.isArray(manifest.hard_rules) ? manifest.hard_rules.join("; ") : "";

  const system = `Você é o assistente comercial do vendedor. Sua missão: sugerir a MELHOR resposta para enviar ao cliente agora e explicar a técnica.
REGRAS INEGOCIÁVEIS:
- Use SOMENTE os FATOS fornecidos (DNA). NUNCA invente preço, condição, horário, serviço, promoção ou política que não esteja neles.
- Se faltar um fato essencial para responder com segurança, liste em "faltam_fatos", marque "escalar": true e NÃO invente.
- Escreva em português do Brasil, natural, simpático e conciso — pronto para copiar e enviar no WhatsApp.
- Baseie a técnica e o tom na BIBLIOTECA.
- Cada situação tem uma ESCOLA DE VENDA declarada para ESTE segmento. Respeite o "NÃO usar quando" dela: fechamento por pressão levanta a conversão em ticket baixo e a DERRUBA em venda de ciclo longo. Em "tecnica", diga a escola aplicada e o movimento concreto.`;

  const prompt = `SEGMENTO: ${manifest.name ?? tenant.skill_key}
VOCABULÁRIO/EIXO: ${JSON.stringify(manifest.vocabulary ?? {})} | descoberta: ${manifest.discovery_axis ?? ""}
ETAPAS DA JORNADA: ${stageList}
REGRAS PERMANENTES DO SEGMENTO: ${hardRules}

FATOS DA EMPRESA (DNA — a única verdade que você pode afirmar):
${fatos(sections)}

ESCOLAS DE VENDA em jogo nesta situação (o "NÃO usar quando" vale como regra):
${blocoEscolas || "(nenhuma)"}

FATOS QUE A BIBLIOTECA EXIGE E NÃO EXISTEM NO DNA (verificado no banco, não é opinião):
${faltando.size ? [...faltando].map((f) => `- ${f}`).join("\n") : "(nenhum — todos os fatos exigidos estão preenchidos)"}
${travou ? "→ Falta fato EXIGIDO por uma entrada que manda escalar. Marque \"escalar\": true e escreva apenas uma mensagem curta e segura que encaminha para verificação humana. NÃO redija a resposta comercial." : ""}

BIBLIOTECA COMERCIAL (estratégia e técnicas — a base das respostas):
${biblioteca || "(biblioteca vazia)"}

CONTEXTO DO CLIENTE:
Nenhum cliente selecionado — trate como primeiro contato.

MENSAGEM DO CLIENTE (responda a isto):
"""${caso.msg}"""

Analise e gere a melhor resposta agora.`;

  const res = await generateObject({ model: modelo, schema, system, prompt });
  const u = res.usage ?? {};
  const tin = u.inputTokens ?? u.promptTokens ?? 0;
  const tout = u.outputTokens ?? u.completionTokens ?? 0;
  const c = custo(tin, tout);
  totalCusto += c;
  const r = res.object;
  // A trava tem a palavra final — espelho do que a action faz.
  if (travou) r.escalar = true;
  r.faltam_fatos = [...new Set([...faltando, ...(r.faltam_fatos ?? [])])];

  console.log(`\n${"=".repeat(78)}`);
  console.log(`[${i + 1}/${alvos.length}] ${tenant.name} (${tenant.skill_key})`);
  console.log(`CLIENTE: "${caso.msg}"`);
  console.log(`entradas usadas: ${usadas.map((e, k) => `${e.category}/${escolas[k]}`).join(", ")}`);
  console.log(`${"-".repeat(78)}`);
  console.log(`ESCALAR: ${r.escalar}${r.faltam_fatos.length ? `  (faltam: ${r.faltam_fatos.join("; ")})` : ""}`);
  console.log(`\nRESPOSTA:\n${r.resposta_sugerida}`);
  console.log(`\nTÉCNICA: ${r.tecnica}`);
  console.log(`EXPLICAÇÃO: ${r.explicacao}`);
  console.log(`OBJETIVO: ${r.objetivo} | PRÓXIMO: ${r.proximo_passo}`);
  console.log(`ETAPA: ${r.etapa_jornada} | EMOÇÃO: ${r.emocao}`);
  console.log(`tokens ${tin} in / ${tout} out — R$ ${(c / 100).toFixed(2)}`);
}
console.log(`\n${"=".repeat(78)}\nTOTAL: ${alvos.length} casos, R$ ${(totalCusto / 100).toFixed(2)}`);
