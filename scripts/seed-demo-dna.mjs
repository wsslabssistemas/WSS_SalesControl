/**
 * Carrega o DNA de demonstração de `packages/db/seeds/demo_dna.sql` para o
 * banco, usando a service_role.
 *
 *   node scripts/seed-demo-dna.mjs
 *
 * ⚠ DEMO SEED: só toca tenants com slug `demo-%`. A trava está aqui no código,
 * além de estar no SQL — dado fictício jamais pode alcançar empresa real.
 *
 * O arquivo .sql continua sendo a verdade (dá para colar no SQL Editor). Este
 * script só evita o erro humano de colar 13 KB à mão.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED = path.join(ROOT, "packages/db/seeds/demo_dna.sql");

function readEnv() {
  const env = {};
  for (const linha of fs.readFileSync(path.join(ROOT, "apps/web/.env.local"), "utf8").split(/\r?\n/)) {
    const i = linha.indexOf("=");
    if (i > 0 && !linha.trim().startsWith("#")) {
      env[linha.slice(0, i).trim()] = linha.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = readEnv();
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Falta SUPABASE_SERVICE_ROLE_KEY em apps/web/.env.local.");
  process.exit(1);
}
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sql = fs.readFileSync(SEED, "utf8");
const blocos = [...sql.matchAll(/\('(demo-[a-z-]+)',\s*\$json\$([\s\S]*?)\$json\$/g)];
if (!blocos.length) {
  console.error("Nenhum bloco de DNA encontrado no seed.");
  process.exit(1);
}

let erros = 0;
for (const [, slug, corpo] of blocos) {
  if (!slug.startsWith("demo-")) {
    console.error(`✗ ${slug}: recusado — este script só escreve em tenant de demonstração.`);
    erros++;
    continue;
  }

  let sections;
  try {
    sections = JSON.parse(corpo);
  } catch (e) {
    console.error(`✗ ${slug}: JSON inválido — ${e.message}`);
    erros++;
    continue;
  }

  const { data: tenant } = await db.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (!tenant) {
    console.error(`✗ ${slug}: empresa não existe. Rode scripts/criar-tenant-demo.mjs antes.`);
    erros++;
    continue;
  }

  // Um único DNA corrente por tenant (índice único do 0007).
  const { error: delErr } = await db.from("commercial_dna").delete().eq("tenant_id", tenant.id);
  if (delErr) {
    console.error(`✗ ${slug}: erro ao limpar — ${delErr.message}`);
    erros++;
    continue;
  }

  const { error } = await db.from("commercial_dna").insert({
    tenant_id: tenant.id,
    version: 1,
    sections,
    source: "demo_seed",
    is_current: true,
  });
  if (error) {
    console.error(`✗ ${slug}: erro ao gravar — ${error.message}`);
    erros++;
    continue;
  }
  console.log(`✓ ${slug} — ${Object.keys(sections).length} seções`);
}

process.exit(erros ? 1 : 0);
