/**
 * Importa o piloto do Base44 (BeFitness Sales Mentor) para o COS.
 *
 *   node scripts/importar-base44.mjs <slug-do-tenant> [--executar]
 *   node scripts/importar-base44.mjs be-fitness            # simula
 *   node scripts/importar-base44.mjs be-fitness --executar # grava
 *
 * ENTRADA: `.base44/customers.json` e `.base44/interactions.json`, extraídos
 * do Base44 pelo MCP. Ficam fora do Git — são dados de cliente real.
 *
 * POR QUE ESTE SCRIPT EXISTE, e por que ele simula por padrão:
 * é a única carga do projeto que traz DADO REAL DE PESSOA para dentro do
 * banco. Rodar por engano com o mapeamento errado polui a base do fundador
 * com 274 contatos e 2.100 interações que ninguém quer apagar à mão. Então
 * o padrão é imprimir o que faria; gravar exige dizer que quer.
 *
 * O QUE ELE FAZ DE ESTRUTURAL:
 *
 * 1. UM ATENDIMENTO DO PILOTO VIRA DUAS INTERAÇÕES NO COS. No Base44 a
 *    conversa do cliente e a resposta sugerida moram no mesmo registro; no
 *    COS são eventos separados com direção. Separar não é capricho: é o que
 *    permite medir TEMPO DE RESPOSTA, que é a métrica com melhor relação
 *    evidência/esforço do projeto inteiro.
 *
 * 2. O DESFECHO É TRADUZIDO PARA A ENUM CANÔNICA (0044), e a tradução
 *    preserva a distinção que interessa: `nao_respondeu` vira
 *    `perdeu_silencio` e `desistiu` vira `perdeu_decisao`. São perdas com
 *    remédios opostos, e colapsar as duas cegaria o M2.
 *
 * 3. IDEMPOTENTE POR ORIGEM. Cada registro carrega o id do Base44 em
 *    `custom.base44_id`, então rodar duas vezes atualiza em vez de duplicar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
const executar = process.argv.includes("--executar");
if (!slug) {
  console.error("Uso: node scripts/importar-base44.mjs <slug> [--executar]");
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

const ler = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, ".base44", f), "utf8"));
const customers = ler("customers.json");
const interactions = ler("interactions.json");

// ---------------------------------------------------------------------
// MAPEAMENTOS. Cada um declarado por extenso, porque um mapeamento errado
// aqui não dá erro — dá um dado plausível e falso, que é pior.
// ---------------------------------------------------------------------

/** Etapa do piloto → etapa da jornada do manifesto `academia`. */
const ETAPA = {
  novo_contato: "contato",
  descobrindo_necessidade: "descoberta",
  proposta_enviada: "proposta",
  semana_experimental: "experimentacao",
  negociacao: "negociacao",
  matriculado: "convertido",
  renovado: "convertido",
  perdido: "perdido",
};

/** Origem do piloto → `lead_sources` do manifesto. Texto livre lá, enum aqui. */
function origem(v) {
  const t = String(v ?? "").trim().toLowerCase();
  if (!t) return "outro";
  if (t.includes("whats")) return "whatsapp";
  if (t.includes("insta")) return "instagram";
  if (t.includes("face")) return "facebook";
  if (t.includes("presencial")) return "presencial";
  if (t.includes("indica")) return "indicacao";
  // TotalPass e Gympass são convênio — e é assim que a receita aparece no
  // financeiro da academia, então a nomenclatura fecha dos dois lados.
  if (t.includes("totalpass") || t.includes("gympass") || t.includes("wellhub")) return "convenio";
  // "Contato ex aluno", "Lista enviada pelo William", "Nosso cadastro":
  // são listas trabalhadas ativamente, não origem espontânea.
  if (t.includes("ex aluno") || t.includes("lista") || t.includes("cadastro")) return "campanha";
  return "outro";
}

/**
 * Resultado do piloto → desfecho canônico (0044).
 *
 * As duas perdas ficam SEPARADAS de propósito. É a única razão de a enum
 * ter sido trocada, e é a pergunta que o M2 existe para responder.
 */
const DESFECHO = {
  respondeu: "respondeu",
  marcou_visita: "avancou",
  semana_experimental: "avancou",
  matriculou: "ganhou",
  desistiu: "perdeu_decisao",
  nao_respondeu: "perdeu_silencio",
  pendente: null, // ainda em aberto: ausência de desfecho é informação, não zero
};

const digitos = (v) => String(v ?? "").replace(/\D/g, "") || null;
const dataISO = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString();
};

// ---------------------------------------------------------------------
const { data: tenant } = await db.from("tenants").select("id, name, skill_key").eq("slug", slug).maybeSingle();
if (!tenant) { console.error(`Empresa "${slug}" não encontrada.`); process.exit(1); }
console.log(`Empresa: ${tenant.name} (${tenant.skill_key})\n`);

// CONTATOS ------------------------------------------------------------
const contatos = customers.map((c) => ({
  tenant_id: tenant.id,
  name: String(c.name ?? "").trim() || "(sem nome)",
  phone: digitos(c.phone),
  source: origem(c.lead_source),
  journey_stage: ETAPA[c.status] ?? "contato",
  stage_entered_at: dataISO(c.last_interaction_date) ?? dataISO(c.created_date),
  next_action: c.next_action ?? null,
  next_action_at: dataISO(c.next_action_date),
  created_at: dataISO(c.created_date),
  custom: {
    base44_id: c.id,
    perfil: c.profile ?? null,
    objetivo: c.objective ?? null,
    observacoes: c.notes ?? null,
    plano: c.plan_type ?? null,
    inicio_experimental: c.trial_start_date ?? null,
    data_matricula: c.enrollment_date ?? null,
    data_perda: c.lost_date ?? null,
    atendente_base44: c.assigned_to ?? null,
  },
}));

// DEDUPE POR TELEFONE. Duas fichas com o mesmo número são a mesma pessoa —
// no piloto há um caso, a mesma cliente cadastrada duas vezes. Consolidar é
// obrigatório (o banco tem índice único) e é o comportamento certo: os
// atendimentos das duas fichas passam a pertencer ao mesmo contato, que é
// como a conversa aconteceu na vida real.
// A ficha que fica é a MAIS AVANÇADA na jornada; empate vai para a mais
// recente. Perder o histórico da ficha antiga seria pior que a duplicata.
const ORDEM = ["contato", "descoberta", "proposta", "experimentacao", "negociacao", "convertido", "perdido"];
const alias = new Map(); // base44_id descartado → base44_id que ficou
{
  const porTelefone = new Map();
  for (const c of contatos) {
    if (!c.phone) continue;
    const atual = porTelefone.get(c.phone);
    if (!atual) { porTelefone.set(c.phone, c); continue; }
    const melhor =
      ORDEM.indexOf(c.journey_stage) > ORDEM.indexOf(atual.journey_stage) ||
      (c.journey_stage === atual.journey_stage && String(c.stage_entered_at) > String(atual.stage_entered_at))
        ? c : atual;
    const pior = melhor === c ? atual : c;
    alias.set(pior.custom.base44_id, melhor.custom.base44_id);
    porTelefone.set(c.phone, melhor);
  }
  if (alias.size) {
    const descartados = new Set(alias.keys());
    for (let i = contatos.length - 1; i >= 0; i--) {
      if (descartados.has(contatos[i].custom.base44_id)) contatos.splice(i, 1);
    }
    console.log(`  ${alias.size} ficha(s) duplicada(s) por telefone consolidada(s)`);
  }
}

const porEtapa = {};
for (const c of contatos) porEtapa[c.journey_stage] = (porEtapa[c.journey_stage] ?? 0) + 1;
const porOrigem = {};
for (const c of contatos) porOrigem[c.source] = (porOrigem[c.source] ?? 0) + 1;

console.log(`CONTATOS: ${contatos.length}`);
console.log(`  por etapa:  ${Object.entries(porEtapa).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join("  ")}`);
console.log(`  por origem: ${Object.entries(porOrigem).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join("  ")}`);
console.log(`  sem telefone: ${contatos.filter((c) => !c.phone).length}`);

// INTERAÇÕES ----------------------------------------------------------
// Cada atendimento do piloto vira duas: a mensagem do cliente e a nossa
// resposta. É o que permite medir tempo de resposta depois.
function eventos(idPorBase44) {
  const out = [];
  let semContato = 0;
  for (const i of interactions) {
    const contact_id = idPorBase44.get(alias.get(i.customer_id) ?? i.customer_id);
    if (!contact_id) { semContato++; continue; }
    const t = dataISO(i.created_date);
    if (i.conversation) {
      out.push({
        tenant_id: tenant.id, contact_id, direction: "inbound",
        input_kind: "customer_message", channel: "whatsapp",
        content: i.conversation, occurred_at: t,
      });
    }
    if (i.suggested_response) {
      out.push({
        tenant_id: tenant.id, contact_id, direction: "outbound",
        // A resposta partiu de nos, entao e `system_initiated` — os tres
        // valores aceitos separam quem originou o evento, e `customer_message`
        // aqui seria mentira sobre a origem.
        input_kind: "system_initiated", channel: "whatsapp",
        content: i.suggested_response,
        // Um minuto depois: o piloto não guarda a hora do envio, e sem
        // ordem a leitura do histórico fica embaralhada. É a única
        // informação inventada aqui, e ela é declarada.
        occurred_at: t ? new Date(new Date(t).getTime() + 60000).toISOString() : null,
        technique: i.techniques ?? null,
        outcome: DESFECHO[i.result] ?? null,
      });
    }
  }
  return { out, semContato };
}

const contDesfecho = {};
for (const i of interactions) {
  const d = DESFECHO[i.result] ?? "(em aberto)";
  contDesfecho[d] = (contDesfecho[d] ?? 0) + 1;
}
console.log(`\nATENDIMENTOS: ${interactions.length} → ~${interactions.length * 2} eventos`);
console.log(`  desfecho canônico: ${Object.entries(contDesfecho).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join("  ")}`);

if (!executar) {
  console.log(`\n(simulação — nada foi gravado. Rode com --executar para valer.)`);
  process.exit(0);
}

// GRAVAÇÃO ------------------------------------------------------------
// Idempotente: apaga o que veio do Base44 antes (identificado por
// `custom.base44_id`) e regrava. Nunca toca no que foi criado no COS.
console.log(`\nGravando...`);
const { data: antigos } = await db
  .from("contacts").select("id").eq("tenant_id", tenant.id).not("custom->>base44_id", "is", null);
if (antigos?.length) {
  await db.from("interactions").delete().in("contact_id", antigos.map((a) => a.id));
  await db.from("contacts").delete().in("id", antigos.map((a) => a.id));
  console.log(`  ${antigos.length} contatos da importação anterior removidos`);
}

const idPorBase44 = new Map();
{
  const { data: existentes } = await db
    .from("contacts").select("id, phone").eq("tenant_id", tenant.id).is("deleted_at", null);
  const porTel = new Map((existentes ?? []).filter((e) => e.phone).map((e) => [e.phone, e.id]));
  let reaproveitados = 0;
  for (let i = contatos.length - 1; i >= 0; i--) {
    const c = contatos[i];
    const jaExiste = c.phone && porTel.get(c.phone);
    if (jaExiste) {
      idPorBase44.set(c.custom.base44_id, jaExiste);
      contatos.splice(i, 1);
      reaproveitados++;
    }
  }
  if (reaproveitados) console.log(`  ${reaproveitados} contato(s) já existiam no COS — histórico anexado à ficha existente`);
}
for (let i = 0; i < contatos.length; i += 200) {
  const lote = contatos.slice(i, i + 200);
  const { data, error } = await db.from("contacts").insert(lote).select("id, custom");
  if (error) { console.error(`✗ contatos: ${error.message}`); process.exit(1); }
  for (const c of data) idPorBase44.set(c.custom?.base44_id, c.id);
}
console.log(`✓ contatos: ${idPorBase44.size}`);

const { out: evs, semContato } = eventos(idPorBase44);
for (let i = 0; i < evs.length; i += 500) {
  const { error } = await db.from("interactions").insert(evs.slice(i, i + 500));
  if (error) { console.error(`✗ interações: ${error.message}`); process.exit(1); }
}
console.log(`✓ interações: ${evs.length}${semContato ? ` (${semContato} atendimentos sem contato correspondente, ignorados)` : ""}`);

// CONFERÊNCIA com select independente, como manda a convenção.
const { count: nc } = await db.from("contacts").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id);
const { count: ni } = await db.from("interactions").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id);
const { count: nd } = await db.from("interactions").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).not("outcome", "is", null);
console.log(`\nno banco agora: ${nc} contatos · ${ni} interações · ${nd} com desfecho`);
