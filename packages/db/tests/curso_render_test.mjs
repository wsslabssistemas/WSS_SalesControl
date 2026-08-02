/**
 * O renderizador das lições, testado contra o CONTEÚDO REAL do banco.
 *
 * Por que existe: a tela do curso exige login, então não dá para clicar nela
 * daqui. O que dá para verificar de verdade é o que decide se a lição fica
 * legível — se todo bloco de markdown é reconhecido, e se nada do texto se
 * perde no caminho.
 *
 * O teste é feito contra as lições REAIS, não contra um exemplo inventado:
 * exemplo inventado passa sempre.
 *
 * ESPERADO: nenhum bloco desconhecido, nenhum `**` ou `###` sobrando no texto
 * renderizado, e toda lição com pelo menos um título e um parágrafo.
 *
 *   node packages/db/tests/curso_render_test.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// A implementação vem do arquivo do app — nada de cópia que pode divergir.
const src = fs.readFileSync(path.join(ROOT, "apps/web/lib/markdown.ts"), "utf8");
const js = src
  .replace(/export type [\s\S]*?;\n/g, "")
  .replace(/: Bloco\[\]/g, "")
  .replace(/: \{ texto: string; forte: boolean \}\[\]/g, "")
  .replace(/\(md: string\)/g, "(md)")
  .replace(/\(texto: string\)/g, "(texto)")
  .replace(/let (paragrafo|lista|citacao): string\[\] = \[\];/g, "let $1 = [];")
  .replace(/const blocos: Bloco\[\] = \[\];/g, "const blocos = [];");
// Importado como data URL: sem arquivo temporário no disco. Apagar um arquivo
// que o carregador de módulos ainda segura faz o Node abortar no encerramento
// no Windows — e teste que falha ao terminar parece teste que falhou.
const { paraBlocos, pedacos } = await import(
  "data:text/javascript;base64," + Buffer.from(js, "utf8").toString("base64")
);

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

const { data: licoes } = await db.from("course_lessons").select("key, title, body").order("ord");
if (!licoes?.length) {
  console.error("Nenhuma lição no banco. Rode scripts/seed-curso.mjs antes.");
  process.exit(1);
}

let falhas = 0;
for (const l of licoes) {
  const blocos = paraBlocos(l.body);
  const tipos = new Set(blocos.map((b) => b.tipo));

  // Todo o texto que sai do renderizador, já sem a marcação.
  const renderizado = blocos
    .map((b) =>
      b.tipo === "lista"
        ? b.itens.map((i) => pedacos(i).map((p) => p.texto).join("")).join(" ")
        : pedacos(b.texto).map((p) => p.texto).join(""),
    )
    .join(" ");

  const problemas = [];
  if (!blocos.length) problemas.push("nenhum bloco reconhecido");
  if (!tipos.has("titulo")) problemas.push("sem título (###)");
  if (!tipos.has("paragrafo")) problemas.push("sem parágrafo");
  if (/\*\*/.test(renderizado)) problemas.push("sobrou ** no texto renderizado");
  if (/^###\s|\s###\s/.test(renderizado)) problemas.push("sobrou ### no texto renderizado");

  // Nada pode sumir: comparo o número de palavras da origem com o do resultado,
  // ignorando a marcação. Diferença acima de 2% significa texto perdido.
  const palavras = (s) => (s.match(/[\p{L}\p{N}]+/gu) ?? []).length;
  const origem = palavras(l.body.replace(/[*#>-]/g, " "));
  const saida = palavras(renderizado);
  const perda = origem ? (origem - saida) / origem : 0;
  if (perda > 0.02) problemas.push(`perdeu ${Math.round(perda * 100)}% das palavras (${origem} → ${saida})`);

  if (problemas.length) {
    falhas++;
    console.log(`✗ ${l.key} — ${l.title}`);
    for (const p of problemas) console.log(`     ${p}`);
  } else {
    console.log(
      `✓ ${l.key.padEnd(6)} ${String(blocos.length).padStart(2)} blocos ` +
        `(${[...tipos].join(", ")}) · ${saida} palavras`,
    );
  }
}

console.log(falhas ? `\n✗ FALHOU — ${falhas} lição(ões)` : "\n✓ PASSOU — todas as lições renderizam sem perder texto");
// `exitCode` em vez de `process.exit()`: encerrar à força com a conexão HTTP do
// Supabase ainda aberta faz o Node abortar no Windows, e um teste que passou
// mas aborta ao sair parece um teste que falhou.
process.exitCode = falhas ? 1 : 0;
