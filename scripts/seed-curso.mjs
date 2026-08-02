/**
 * Carrega o conteúdo do curso (módulos, lições e perguntas) do arquivo de
 * migration para o banco, usando a service_role.
 *
 *   node scripts/seed-curso.mjs packages/db/migrations/0033_curso_conteudo_m1.sql
 *
 * Mesma lógica do `seed-knowledge.mjs`: o arquivo .sql continua sendo a
 * verdade (dá para colar no SQL Editor), e o script evita o erro humano de
 * colar 20 KB de texto com acento à mão.
 *
 * Recarga é idempotente: apaga o que o arquivo declara antes de inserir.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("Uso: node scripts/seed-curso.mjs <arquivo.sql>");
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

const sql = fs.readFileSync(path.resolve(ROOT, arquivo), "utf8");

/** Tuplas de um bloco VALUES, parando no `;` de topo. */
function tuplas(bloco) {
  const out = [];
  let depth = 0, inStr = false, cur = "";
  for (let i = 0; i < bloco.length; i++) {
    const c = bloco[i];
    if (inStr) {
      cur += c;
      if (c === "'") { if (bloco[i + 1] === "'") cur += bloco[++i]; else inStr = false; }
      continue;
    }
    if (c === "'") { inStr = true; cur += c; continue; }
    if (c === ";" && depth === 0) break;
    if (c === "(") { depth++; if (depth === 1) { cur = ""; continue; } }
    if (c === ")") { depth--; if (depth === 0) { out.push(cur); continue; } }
    if (depth > 0) cur += c;
  }
  return out;
}

/**
 * Campos de uma tupla, respeitando aspas e colchetes de array[...].
 *
 * DENTRO de um array as aspas são PRESERVADAS, de propósito: o conteúdo volta
 * a passar por aqui numa segunda rodada, e sem as aspas uma opção que contém
 * vírgula ("comparar por um número, sem saber o que resolve") viraria duas
 * opções. Foi exatamente o que aconteceu na primeira carga.
 */
function campos(t) {
  const out = [];
  let inStr = false, cur = "", depth = 0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (c === "'") {
        if (t[i + 1] === "'") { cur += "'"; i++; }
        else { inStr = false; if (depth > 0) cur += "'"; }
      } else cur += c;
      continue;
    }
    if (c === "'") { inStr = true; if (depth > 0) cur += "'"; continue; }
    if (c === "[") depth++;
    if (c === "]") depth--;
    if (c === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

const nulo = (v) => (v === "null" ? null : v);
const depois = (marcador) => {
  const i = sql.indexOf(marcador);
  return i < 0 ? "" : sql.slice(i + marcador.length);
};

const mods = tuplas(depois("insert into public.course_modules (key, ord, title, subtitle, school_key) values"))
  .map((t) => { const f = campos(t); return { key: f[0], ord: Number(f[1]), title: f[2], subtitle: f[3], school_key: nulo(f[4]) }; });

const licoes = tuplas(depois("insert into public.course_lessons (key, module_key, ord, title, minutes, example_category, practice, body) values"))
  .map((t) => { const f = campos(t); return { key: f[0], module_key: f[1], ord: Number(f[2]), title: f[3], minutes: Number(f[4]), example_category: nulo(f[5]), practice: nulo(f[6]), body: f[7] }; });

const perguntas = tuplas(depois("insert into public.course_questions (lesson_key, ord, question, options, correct, explanation) values"))
  .map((t) => {
    const f = campos(t);
    const options = campos(f[3].replace(/^array\s*\[/i, "").replace(/\]\s*$/, ""));
    return { lesson_key: f[0], ord: Number(f[1]), question: f[2], options, correct: Number(f[4]), explanation: f[5] };
  });

console.log(`lidos: ${mods.length} módulos, ${licoes.length} lições, ${perguntas.length} perguntas`);
if (!licoes.length && !mods.length) {
  console.error("Nada encontrado no arquivo — confira os nomes das colunas nos INSERTs.");
  process.exit(1);
}

// Sanidade antes de gravar: pergunta sem opção suficiente ou com índice de
// resposta fora do intervalo é erro de conteúdo, não de banco.
const ruins = perguntas.filter((q) => q.options.length < 2 || q.correct < 0 || q.correct >= q.options.length);
if (ruins.length) {
  console.error(`✗ ${ruins.length} pergunta(s) com opções ou resposta inválida:`);
  for (const r of ruins) console.error(`   ${r.lesson_key} #${r.ord}: ${r.options.length} opções, correct=${r.correct}`);
  process.exit(1);
}

// A POSIÇÃO DA ALTERNATIVA CERTA NÃO PODE SER PREVISÍVEL.
//
// Esta trava foi escrita duas vezes, e a primeira versão media a coisa errada.
//
// 1ª versão: o fundador pegou, fazendo a lição 1, que as 16 respostas certas
// estavam todas na 1ª opção. A trava passou a exigir distribuição — no máximo
// metade na mesma posição.
//
// 2ª versão: ele pegou de novo, e o padrão era outro — a certa ANDAVA uma casa
// a cada pergunta (1, 2, 3, 4, 1, 2, 3, 4...) pelo módulo inteiro. A trava de
// distribuição não só deixou passar: uma rotação perfeita dá 25% em cada
// posição, o número mais saudável que existe. Ela media o sintoma do primeiro
// erro, não a propriedade que importa.
//
// A propriedade que importa é uma só: **não dá para prever a próxima olhando a
// anterior**. Distribuição é necessária e não é suficiente. Por isso agora tem
// as duas medidas, e a segunda procura CICLO — a forma que o erro assume quando
// quem escreve tenta "variar" de cabeça, porque variar de cabeça vira ritmo.
function verificarSequencia(nome, seq) {
  if (seq.length < 4) return;

  const porPosicao = new Map();
  for (const c of seq) porPosicao.set(c, (porPosicao.get(c) ?? 0) + 1);
  const [posicao, quantas] = [...porPosicao.entries()].sort((a, b) => b[1] - a[1])[0];
  const limite = Math.ceil(seq.length * 0.5);
  if (quantas > limite) {
    console.error(
      `✗ ${nome}: ${quantas} de ${seq.length} respostas certas estão na posição ` +
        `${posicao + 1} (limite: ${limite}). Redistribua antes de carregar.`,
    );
    process.exit(1);
  }

  // Ciclo de período p: a certa de agora é igual à de p perguntas atrás.
  // Rotação de uma casa é o caso p = número de alternativas, e é o que passou.
  //
  // O TETO: com 4 alternativas o acaso bate ~25%. Num módulo de 15 perguntas
  // são ~11 comparações, onde o desvio padrão do acaso é ~13 pontos — então
  // 60% já está a quase três desvios e não se explica por sorte. A primeira
  // versão desta regra usou 70% e deixou passar um módulo com 64%, onde dava
  // para ler "3 1 4 2 · 3 1 4" no começo da lista. Falso positivo aqui custa
  // um reembaralhamento; falso negativo custa o método do curso.
  const TETO_CICLO = 0.6;
  for (let p = 2; p <= 5; p++) {
    const comparacoes = seq.length - p;
    if (comparacoes < 6) continue;
    let iguais = 0;
    for (let i = p; i < seq.length; i++) if (seq[i] === seq[i - p]) iguais++;
    const taxa = iguais / comparacoes;
    if (taxa >= TETO_CICLO) {
      console.error(
        `✗ ${nome}: a posição da certa se repete a cada ${p} perguntas em ${iguais} de ` +
          `${comparacoes} casos (${Math.round(taxa * 100)}%). Isso é um ciclo: ` +
          `quem percebe acerta sem ler.\n   sequência: ${seq.map((c) => c + 1).join(" ")}`,
      );
      process.exit(1);
    }
  }

  console.log(
    `   ${nome}: ${[...porPosicao.entries()].sort().map(([p, n]) => `${p + 1}ª:${n}`).join("  ")}`,
  );
}

// POR MÓDULO **E** NO ARQUIVO INTEIRO. Só o arquivo não basta: um arquivo com
// três módulos dilui o ciclo de um deles até ele sumir na média — foi assim que
// a rotação do módulo 7 sobreviveu à primeira versão desta verificação. O aluno
// vive um módulo por vez, então é nessa janela que o padrão aparece para ele.
const moduloDaLicao = new Map(licoes.map((l) => [l.key, l.module_key]));
const porModulo = new Map();
for (const q of perguntas) {
  const m = moduloDaLicao.get(q.lesson_key) ?? "(fora deste arquivo)";
  if (!porModulo.has(m)) porModulo.set(m, []);
  porModulo.get(m).push(q.correct);
}
for (const [m, seq] of porModulo) verificarSequencia(`módulo ${m}`, seq);
if (porModulo.size > 1) verificarSequencia("arquivo", perguntas.map((q) => q.correct));

// MÓDULO SE ATUALIZA, NUNCA SE APAGA.
//
// Esta linha já existiu como `delete().in("key", chavesModulo)` e destruiu o
// curso inteiro (ago/2026). O `0033` declara os NOVE módulos, porque a grade
// completa é o que o aluno vê desde o primeiro dia. E
// `course_lessons.module_key` tem `on delete cascade`. Resultado: recarregar só
// o `0033` apagava, em cascata, as 45 lições e as 122 perguntas de todos os
// módulos, e reinseria as 5 do módulo 1. O arquivo carregava "com sucesso" —
// três ✓ verdes — enquanto oito módulos viravam "em breve" na tela.
//
// A regra que vale para qualquer carregador daqui em diante: **o DELETE de
// recarga só pode alcançar o que o próprio arquivo reinsere.** Um módulo é
// registro de grade, compartilhado entre arquivos; ele se atualiza.
const chavesLicao = licoes.map((l) => l.key);
if (mods.length) {
  const { error } = await db.from("course_modules").upsert(mods, { onConflict: "key" });
  if (error) { console.error(`✗ course_modules: ${error.message}`); process.exit(1); }
  console.log(`✓ course_modules: ${mods.length} (atualizados, sem apagar)`);
}
if (chavesLicao.length) await db.from("course_questions").delete().in("lesson_key", chavesLicao);
if (chavesLicao.length) await db.from("course_lessons").delete().in("key", chavesLicao);

for (const [tabela, linhas] of [["course_lessons", licoes], ["course_questions", perguntas]]) {
  if (!linhas.length) continue;
  const { error } = await db.from(tabela).insert(linhas);
  if (error) { console.error(`✗ ${tabela}: ${error.message}`); process.exit(1); }
  console.log(`✓ ${tabela}: ${linhas.length}`);
}

// CONFERÊNCIA DO CURSO INTEIRO, sempre — não só do arquivo que acabou de rodar.
// O estrago acima passou despercebido porque o carregador só relatava o que
// tinha acabado de inserir, e esse número estava certo. Quem olha o próprio
// trabalho não vê o que ele derrubou ao lado.
{
  const { data: gm } = await db.from("course_modules").select("key, ord, title").order("ord");
  const { data: gl } = await db.from("course_lessons").select("key, module_key");
  const { data: gq } = await db.from("course_questions").select("lesson_key");
  const porLicao = new Map((gl ?? []).map((l) => [l.key, l.module_key]));
  const conta = new Map();
  for (const l of gl ?? []) conta.set(l.module_key, { l: (conta.get(l.module_key)?.l ?? 0) + 1, q: conta.get(l.module_key)?.q ?? 0 });
  for (const q of gq ?? []) {
    const m = porLicao.get(q.lesson_key);
    if (m) conta.set(m, { l: conta.get(m)?.l ?? 0, q: (conta.get(m)?.q ?? 0) + 1 });
  }
  console.log("\ncurso inteiro depois desta carga:");
  let vazios = 0;
  for (const m of gm ?? []) {
    const c = conta.get(m.key) ?? { l: 0, q: 0 };
    if (!c.l) vazios++;
    console.log(`  ${String(m.ord).padStart(2)}. ${m.title.padEnd(24)} ${String(c.l).padStart(2)} lições · ${String(c.q).padStart(3)} perguntas${c.l ? "" : "   ← VAZIO"}`);
  }
  console.log(`  total: ${gl?.length ?? 0} lições · ${gq?.length ?? 0} perguntas`);
  if (vazios) console.log(`\n⚠ ${vazios} módulo(s) sem lição. Se não era esperado, recarregue os arquivos que faltam.`);
}
