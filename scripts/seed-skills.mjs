/**
 * Carrega os manifestos de packages/skills/ para a tabela `skills`.
 *
 *   node scripts/seed-skills.mjs            # todos
 *   node scripts/seed-skills.mjs barbearia  # só um
 *
 * Uma Skill é DADO, nunca código: este script só transporta o YAML para o
 * banco. Exige SUPABASE_SERVICE_ROLE_KEY em apps/web/.env.local (a tabela
 * `skills` é escrita só pelo service_role).
 *
 * Em produção a carga é feita pela migration numerada correspondente — este
 * script serve para desenvolvimento e para recarregar após editar um manifesto.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "yaml";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, "packages", "skills");

function readEnv() {
  const file = path.join(ROOT, "apps", "web", ".env.local");
  if (!fs.existsSync(file)) throw new Error("apps/web/.env.local não encontrado.");
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
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

const filtro = process.argv.slice(2);
const chaves = fs
  .readdirSync(SKILLS_DIR)
  .filter((d) => fs.existsSync(path.join(SKILLS_DIR, d, "manifest.yaml")))
  .filter((d) => filtro.length === 0 || filtro.includes(d));

if (chaves.length === 0) {
  console.error("Nenhum manifesto encontrado para:", filtro.join(", ") || "(todos)");
  process.exit(1);
}

let erros = 0;
for (const k of chaves) {
  const m = yaml.parse(fs.readFileSync(path.join(SKILLS_DIR, k, "manifest.yaml"), "utf8"));
  const row = {
    key: m.key,
    name: m.name,
    version: m.version,
    manifest: m,
    status: "published",
    published_at: new Date().toISOString(),
  };
  // A restrição única é (key, version) — uma Skill pode ter várias versões.
  const { data: existe } = await db
    .from("skills")
    .select("id")
    .eq("key", m.key)
    .eq("version", m.version)
    .maybeSingle();
  const { error } = existe
    ? await db.from("skills").update(row).eq("key", m.key).eq("version", m.version)
    : await db.from("skills").insert(row);

  if (error) {
    erros++;
    console.error(`✗ ${k}: ${error.message}`);
  } else {
    const caps = Array.isArray(m.capabilities) ? m.capabilities : [];
    console.log(`✓ ${k} ${m.version} ${existe ? "atualizada" : "criada"} — módulos: [${caps.join(", ")}]`);
  }
}

process.exit(erros ? 1 : 0);
