/**
 * O QUE A CASA JÁ SABE — a leitura honesta do que funciona, contra o banco.
 *
 *   node scripts/diagnostico-aprendizado.mjs be-fitness
 *
 * Não escreve nada. Importa `lib/aprendizado.ts` DIRETO — sem reimplementar a
 * regra aqui, porque teste e diagnóstico que guardam cópia do algoritmo
 * divergem do código na primeira mudança (foi o que aconteceu com o
 * `retrieval_check`, e está escrito no `ESTADO_DO_PROJETO.md`).
 *
 * LEITURA PAGINADA: o PostgREST corta em 1.000 linhas sem avisar, e a
 * canonização das técnicas já perdeu 53 interações assim. Aqui o corte
 * silencioso não quebraria nada — só faria a amostra encolher e o veredito
 * virar "não sei" sem motivo. Silêncio errado é pior que erro.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { medir, porOrigem, N_MINIMO_ESCOLA } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/aprendizado.ts")).href
);

const env = {};
for (const l of fs.readFileSync(path.join(ROOT, "apps/web/.env.local"), "utf8").split(/\r?\n/)) {
  const i = l.indexOf("=");
  if (i > 0 && !l.trim().startsWith("#")) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const slug = process.argv[2] ?? "be-fitness";
const { data: tenant } = await db.from("tenants").select("id, name").eq("slug", slug).maybeSingle();
if (!tenant) { console.error(`empresa "${slug}" não encontrada`); process.exit(1); }

async function tudo(tabela, select, filtro) {
  const out = [];
  for (let de = 0; ; de += 1000) {
    let q = db.from(tabela).select(select).range(de, de + 999);
    q = filtro(q);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return out;
}

const contatos = await tudo("contacts", "id, source, journey_stage", (q) =>
  q.eq("tenant_id", tenant.id).is("deleted_at", null));
const ix = await tudo("interactions", "contact_id, schools, outcome", (q) =>
  q.eq("tenant_id", tenant.id).not("outcome", "is", null));

const porId = new Map(contatos.map((c) => [c.id, c]));
const eventos = ix
  .filter((i) => Array.isArray(i.schools) && i.schools.length)
  .map((i) => ({
    escolas: i.schools,
    desfecho: i.outcome,
    origem: porId.get(i.contact_id)?.source ?? null,
    etapa: porId.get(i.contact_id)?.journey_stage ?? null,
  }));

const pct = (t, m) => (t === null ? "—" : `${(t * 100).toFixed(0)}% ±${(m * 100).toFixed(0)}`);
const seta = { acima: "▲ acima", abaixo: "▼ abaixo", indistinto: "= indistinto", nao_sei: "? não sei" };

function imprimir(l) {
  console.log(`\n${"=".repeat(74)}`);
  console.log(`${l.recorte}  ·  métrica: ${l.metrica}  ·  base: ${pct(l.base.taxa, l.base.margem)} (n=${l.base.usos})`);
  console.log("-".repeat(74));
  if (l.aviso) console.log(`  ⚠ ${l.aviso}`);
  for (const e of l.escolas) {
    console.log(
      `  ${e.escola.padEnd(26)} n=${String(e.usos).padStart(4)}  ` +
      `${pct(e.taxa, e.margem).padEnd(12)} ${seta[e.contraBase]}`,
    );
  }
}

console.log(`\n${tenant.name} — ${eventos.length} desfechos com escola registrada`);
console.log(`Piso de amostra: ${N_MINIMO_ESCOLA} usos. Abaixo dele, não vira número.`);

imprimir(medir(eventos, "resposta", "todas as origens"));
imprimir(medir(eventos, "fechamento", "todas as origens"));

console.log(`\n\n${"#".repeat(74)}\n# POR ORIGEM — a regra do fundador (ago/2026): convênio e WhatsApp\n# não se somam. São coisas diferentes numa taxa só.\n${"#".repeat(74)}`);
for (const [origem, evs] of [...porOrigem(eventos)].sort((a, b) => b[1].length - a[1].length)) {
  imprimir(medir(evs, "resposta", `origem: ${origem}`));
}
