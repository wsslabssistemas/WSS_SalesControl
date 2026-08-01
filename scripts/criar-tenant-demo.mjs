/**
 * Cria uma empresa de DEMONSTRAÇÃO e vincula um usuário como dono.
 *
 *   node scripts/criar-tenant-demo.mjs <skill_key> "<Nome>" <email-do-dono>
 *   node scripts/criar-tenant-demo.mjs barbearia "Barbearia Demo" eu@exemplo.com
 *
 * Convenção do projeto: todo tenant de demonstração usa slug com prefixo
 * `demo-`, para que um delete jamais alcance um tenant real.
 * Nunca rodar em produção com dado de cliente.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readEnv() {
  const file = path.join(ROOT, "apps", "web", ".env.local");
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const [skillKey, nome, email] = process.argv.slice(2);
if (!skillKey || !nome || !email) {
  console.error('Uso: node scripts/criar-tenant-demo.mjs <skill_key> "<Nome>" <email>');
  process.exit(1);
}

const env = readEnv();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const slug = "demo-" + skillKey.replace(/_/g, "-");

// A Skill precisa existir e estar publicada.
const { data: skill } = await db.from("skills").select("key").eq("key", skillKey).eq("status", "published").maybeSingle();
if (!skill) {
  console.error(`Skill "${skillKey}" não está publicada. Rode: node scripts/seed-skills.mjs ${skillKey}`);
  process.exit(1);
}

// Usuário dono (precisa já ter conta).
const { data: perfil } = await db.from("profiles").select("id, email").eq("email", email).maybeSingle();
if (!perfil) {
  console.error(`Nenhum usuário com o e-mail ${email}. Faça login uma vez antes.`);
  process.exit(1);
}

let { data: tenant } = await db.from("tenants").select("id, name, skill_key").eq("slug", slug).maybeSingle();
if (tenant) {
  await db.from("tenants").update({ name: nome }).eq("id", tenant.id);
  console.log(`✓ empresa demo já existia — atualizada: ${nome} (${slug})`);
} else {
  const { data, error } = await db
    .from("tenants")
    .insert({ name: nome, slug, skill_key: skillKey, plan: "trial", status: "trial" })
    .select("id")
    .single();
  if (error) {
    console.error("Erro ao criar empresa:", error.message);
    process.exit(1);
  }
  tenant = data;
  console.log(`✓ empresa demo criada: ${nome} (${slug})`);
}

// Instala a Skill pela porta única: grava tenants.skill_key E o vínculo em
// tenant_skills. Sem o vínculo a RLS impede LER o manifesto e o painel abre
// sem etapas e sem origens (bug real já corrigido na migration 0016).
{
  const { error } = await db.rpc("install_skill", { p_tenant: tenant.id, p_skill_key: skillKey });
  if (error) {
    console.error("Erro ao instalar a Skill:", error.message);
    process.exit(1);
  }
  console.log(`✓ Skill "${skillKey}" instalada (com vínculo)`);
}

const { data: vinculo } = await db
  .from("memberships")
  .select("id, role")
  .eq("tenant_id", tenant.id)
  .eq("user_id", perfil.id)
  .maybeSingle();

if (vinculo) {
  console.log(`✓ vínculo já existe (${vinculo.role})`);
} else {
  const { error } = await db
    .from("memberships")
    .insert({ tenant_id: tenant.id, user_id: perfil.id, role: "owner", status: "active" });
  if (error) {
    console.error("Erro ao vincular usuário:", error.message);
    process.exit(1);
  }
  console.log(`✓ ${email} vinculado como owner`);
}

console.log(`\nPronto. Use o seletor de empresa no topo do painel para entrar em "${nome}".`);
