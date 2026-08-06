/**
 * Exporta a biblioteca PRÓPRIA de uma empresa (as entradas `source='tenant'`)
 * para um arquivo .sql, no mesmo dialeto dos seeds de segmento.
 *
 *   node scripts/exportar-biblioteca-tenant.mjs be-fitness
 *   → private/biblioteca-be-fitness.sql
 *
 * POR QUE ISSO PRECISA EXISTIR.
 *
 * A biblioteca da Be Fitness (95 entradas, vinda do PDF do fundador) vive
 * SÓ NO BANCO. Isso tem duas consequências ruins que ninguém tinha notado:
 *   • qualquer correção nela é uma edição sem rastro — não dá para saber o
 *     que mudou, quando, nem voltar atrás;
 *   • um ambiente novo nasce sem ela, e o Responder da empresa fica com a
 *     curadoria genérica do segmento apenas.
 * O `CLAUDE.md` é explícito: o repositório é a verdade, o Supabase é só
 * onde ela é executada. Para esta biblioteca isso ainda não valia.
 *
 * POR QUE O ARQUIVO VAI PARA `private/`, E NÃO PARA `packages/db`.
 *
 * O repositório é PÚBLICO. Esta biblioteca é o ativo do projeto — o que o
 * CLAUDE.md diz que "código se copia em duas semanas; a curadoria, não".
 * Commitar num repo público entrega de graça a única coisa difícil de
 * copiar. `private/` está no .gitignore.
 *
 * Se um dia o repositório virar privado, basta mover o arquivo para
 * `packages/db/migrations/` — o formato já é o mesmo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) { console.error("Uso: node scripts/exportar-biblioteca-tenant.mjs <slug>"); process.exit(1); }

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

const { data: tenant } = await db.from("tenants").select("id, name, skill_key").eq("slug", slug).maybeSingle();
if (!tenant) { console.error(`Empresa "${slug}" não encontrada.`); process.exit(1); }

// Paginado: o PostgREST corta em 1.000 sem avisar (armadilha registrada).
const linhas = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await db
    .from("knowledge_entries")
    .select("category, entry_type, trigger_questions, opportunity_type, strategy, required_facts, optional_facts, hard_rules, on_missing_facts, technique, common_errors, next_objective, answer, status, school")
    .eq("tenant_id", tenant.id)
    .eq("source", "tenant")
    .order("category")
    .range(de, de + 999);
  if (error) { console.error(`✗ ${error.message}`); process.exit(1); }
  linhas.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}

const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (v) =>
  !v || !v.length ? "'{}'" : `'{${v.map((x) => `"${String(x).replace(/"/g, '\\"').replace(/'/g, "''")}"`).join(",")}}'`;

const cabecalho = `-- =====================================================================
-- BIBLIOTECA PRÓPRIA — ${tenant.name} (${slug})
-- Gerado por scripts/exportar-biblioteca-tenant.mjs em ${new Date().toISOString().slice(0, 10)}
--
-- ARQUIVO PRIVADO. Não vai para o Git enquanto o repositório for público:
-- esta é a curadoria da empresa, o ativo que o CLAUDE.md manda proteger.
--
-- Recarregar:
--   node scripts/seed-knowledge.mjs private/biblioteca-${slug}.sql --tenant ${slug}
--
-- O carregador resolve o tenant pelo slug e substitui TODAS as entradas
-- \`source='tenant'\` da empresa. A coluna tenant_id vai como null aqui de
-- propósito — quem preenche é o carregador, para o arquivo funcionar em
-- qualquer ambiente.
-- =====================================================================

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
`;

const tuplas = linhas.map(
  (e) =>
    `(null, ${q(tenant.skill_key)}, ${q(e.category)}, ${q(e.entry_type ?? "reactive")}, ${arr(e.trigger_questions)},\n` +
    ` ${q(e.opportunity_type)}, ${q(e.strategy)}, ${arr(e.required_facts)},\n` +
    ` ${arr(e.optional_facts)}, ${arr(e.hard_rules)}, ${q(e.on_missing_facts ?? "escalate")},\n` +
    ` ${q(e.technique)}, ${arr(e.common_errors)}, ${q(e.next_objective)},\n` +
    ` 'tenant', ${q(e.status ?? "active")}, ${q(e.school)})`,
);

fs.mkdirSync(path.join(ROOT, "private"), { recursive: true });
const destino = path.join(ROOT, "private", `biblioteca-${slug}.sql`);
fs.writeFileSync(destino, cabecalho + tuplas.join(",\n\n") + ";\n", "utf8");

console.log(`✓ ${linhas.length} entradas de "${tenant.name}" → private/biblioteca-${slug}.sql`);
const semTecnica = linhas.filter((e) => !e.technique).length;
const ingles = linhas.filter((e) =>
  /\b(Close|Closing|Gathering|Button|Aversion|First|Interrupt|Reinforcement|Care)\b|Belfort|Tracy|Girard|Cardone|Hormozi|Kahneman/.test(e.technique ?? ""),
).length;
console.log(`  sem técnica: ${semTecnica} · com rótulo em inglês: ${ingles} (técnica é user-facing)`);
