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

// ---------------------------------------------------------------------------
// AS PERGUNTAS TAMBÉM SÃO TEXTO QUE O ALUNO LÊ.
//
// Este bloco existe por um defeito real: o texto de um comentário `--` do
// arquivo de seed foi parar na EXPLICAÇÃO de uma pergunta do Módulo 1, e ficou
// lá até o fundador ler na tela — no lugar do ensino. O carregador não
// reclamou, o número de perguntas continuou certo, e este teste só olhava as
// lições. Contar não é conferir.
// ---------------------------------------------------------------------------
const { data: perguntas } = await db
  .from("course_questions")
  .select("lesson_key, ord, question, options, correct, explanation")
  .order("lesson_key");

let ruins = 0;
for (const q of perguntas ?? []) {
  const problemas = [];
  const onde = `${q.lesson_key} #${q.ord}`;

  // Restos de SQL em qualquer campo significam que o parser leu o arquivo
  // errado — e o sintoma aparece como texto plausível, não como erro.
  for (const [campo, valor] of [
    ["pergunta", q.question],
    ["explicação", q.explanation],
    ...q.options.map((o, i) => [`opção ${i + 1}`, o]),
  ]) {
    if (/^\s*--/.test(valor) || /\barray\s*\[/i.test(valor) || /^\s*'/.test(valor)) {
      problemas.push(`${campo} tem resto de SQL: ${JSON.stringify(String(valor).slice(0, 60))}`);
    }
  }

  if ((q.explanation ?? "").trim().length < 40) problemas.push("explicação curta demais para ensinar algo");
  if ((q.question ?? "").trim().length < 15) problemas.push("pergunta curta demais");
  if (new Set(q.options).size !== q.options.length) problemas.push("alternativas repetidas");
  if (q.options.some((o) => !String(o).trim())) problemas.push("alternativa vazia");

  // Explicação NUNCA se refere a posição: a ordem das alternativas muda
  // (e mudou), e a explicação passa a mentir sem ninguém perceber.
  if (/\b(a primeira|a segunda|a terceira|a quarta|a última|as outras três)\b/i.test(q.explanation ?? "")) {
    problemas.push("explicação se refere a POSIÇÃO — referencie o conteúdo da alternativa");
  }

  if (problemas.length) {
    ruins++;
    console.log(`✗ ${onde}`);
    for (const p of problemas) console.log(`     ${p}`);
  }
}
console.log(
  ruins
    ? `\n✗ ${ruins} pergunta(s) com problema de ${perguntas?.length ?? 0}`
    : `\n✓ ${perguntas?.length ?? 0} perguntas íntegras (sem resto de SQL, sem referência a posição)`,
);
falhas += ruins;

console.log(falhas ? `\n✗ FALHOU — ${falhas} problema(s)` : "\n✓ PASSOU — lições e perguntas íntegras");
// `exitCode` em vez de `process.exit()`: encerrar à força com a conexão HTTP do
// Supabase ainda aberta faz o Node abortar no Windows, e um teste que passou
// mas aborta ao sair parece um teste que falhou.
process.exitCode = falhas ? 1 : 0;
