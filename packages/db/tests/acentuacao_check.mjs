/**
 * ACENTO NA BIBLIOTECA — a trava que impede a dívida de voltar.
 *
 * As nove primeiras bibliotecas nasceram em ASCII, quando `technique`,
 * `strategy` e `trigger_questions` eram anotação interna do motor. Deixaram de
 * ser: o Responder mostra a técnica ao vendedor e o exercício do curso mostra o
 * gatilho ao aluno **como mensagem de cliente**. Em ago/2026 as nove foram
 * acentuadas (~4.500 palavras). Este teste existe porque a dívida é fácil de
 * recriar: escrever `preco` numa entrada nova não quebra nada, não aparece em
 * revisão e só é visto pelo cliente pagante — que é o pior lugar para descobrir.
 *
 * O QUE ELE MEDE: palavra de PROSA que aparece sem acento quando o repositório
 * inteiro só a escreve com acento. O léxico é DADO VERSIONADO
 * (`acentuacao_lexico.json`), não algo recalculado do próprio arquivo — senão a
 * regra se enfraquece sozinha: quanto mais alguém escrevesse `preco`, menos o
 * `preco` seria erro.
 *
 * O QUE ELE NÃO MEDE: homógrafo. `analise`/`análise`, `fabrica`/`fábrica`,
 * `esta`/`está`, `e`/`é` dependem de contexto, e um verificador que chuta
 * contexto erra na direção que mais custa — reprovando texto certo até alguém
 * desligar a trava. Esses estão em `homografos` e ficam de fora, de propósito.
 *
 * IDENTIFICADOR NÃO É PROSA. `'clinica'` é `skill_key`, `pos_venda` é chave de
 * cadência, `pricing.range` é caminho de fato. Nada disso leva acento, e
 * acentuar quebraria contrato — por isso literal SQL de token único e palavra
 * encostada em `_` ou `.` ficam fora.
 *
 * ESPERADO: 0 palavras sem acento.
 *
 *   node packages/db/tests/acentuacao_check.mjs
 *   node packages/db/tests/acentuacao_check.mjs --gerar   # regera o léxico
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, "../../..");
const LEXICO = path.join(AQUI, "acentuacao_lexico.json");

const des = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Os arquivos que o cliente lê: biblioteca curada e manifesto de segmento. */
function arquivos() {
  const out = [];
  const mig = path.join(ROOT, "packages/db/migrations");
  for (const f of fs.readdirSync(mig)) {
    if (/seed_knowledge/.test(f)) out.push(path.join(mig, f));
  }
  const skills = path.join(ROOT, "packages/skills");
  for (const d of fs.readdirSync(skills)) {
    const m = path.join(skills, d, "manifest.yaml");
    if (fs.existsSync(m)) out.push(m);
  }
  return out;
}

/**
 * As ocorrências de palavra que são PROSA.
 *
 * O ponto só liga identificador quando tem letra dos DOIS lados
 * (`pricing.range`). Ponto final de frase não pode blindar a última palavra do
 * parágrafo — foi assim que `um horario.` escapou da primeira passada de
 * acentuação, e a trava herdaria o mesmo buraco.
 */
export function ocorrenciasDeProsa(t) {
  const chaves = new Set();
  for (const m of t.matchAll(/'([A-Za-z][A-Za-z0-9_]*)'/g)) chaves.add(m.index + 1);
  const out = [];
  for (const m of t.matchAll(/[A-Za-zÀ-ÿ]{2,}/g)) {
    const i = m.index, fim = i + m[0].length;
    if (chaves.has(i)) continue;
    const antes = t[i - 1] ?? " ", dep = t[fim] ?? " ";
    if (antes === "_" || dep === "_") continue;
    if (antes === "." && /[A-Za-z0-9]/.test(t[i - 2] ?? " ")) continue;
    if (dep === "." && /[A-Za-z]/.test(t[fim + 1] ?? " ")) continue;
    // `e-mail`, `on-grid`, `pos-venda`: composto com hífen é termo, não prosa.
    if (antes === "-" || dep === "-") continue;
    out.push({ w: m[0], i });
  }
  return out;
}

/**
 * NO MANIFESTO, PROSA É O QUE ESTÁ ENTRE ASPAS — e só.
 *
 * O resto do YAML é contrato: `options: [preco, prazo]` são as opções canônicas
 * que o validador compara entre segmentos, `columns: [servico, valor]` são
 * nomes de coluna, `- key: decisao` é chave. Acentuar qualquer um deles quebra
 * o `skill-loader` — e a primeira versão desta trava pediu exatamente isso,
 * porque tratava lista de enum como frase. `label` e `help`, que o cliente lê,
 * são sempre strings entre aspas.
 */
function prosaDoManifesto(t) {
  const out = [];
  for (const s of t.matchAll(/"([^"\n]*)"/g)) {
    const base = s.index + 1;
    for (const o of ocorrenciasDeProsa(s[1])) out.push({ w: o.w, i: base + o.i });
  }
  return out;
}

const prosa = (arquivo, t) =>
  arquivo.endsWith(".yaml") ? prosaDoManifesto(t) : ocorrenciasDeProsa(t);

const linhaDe = (t, i) => t.slice(0, i).split("\n").length;

// ---------------------------------------------------------------------------
// GERAÇÃO DO LÉXICO — roda a mão, quando um segmento novo traz vocabulário novo.
// Entra a palavra que o repositório escreve SEMPRE com acento (>= 2 vezes) e
// NUNCA sem. Uma única aparição sem acento já a desqualifica: ou é homógrafo,
// ou é dívida a pagar antes de virar regra.
// ---------------------------------------------------------------------------
function gerar() {
  const formas = new Map();
  for (const f of arquivos()) {
    const t = fs.readFileSync(f, "utf8");
    for (const { w } of prosa(f, t)) {
      const lw = w.toLowerCase(), k = des(lw);
      if (!formas.has(k)) formas.set(k, new Map());
      const c = formas.get(k);
      c.set(lw, (c.get(lw) ?? 0) + 1);
    }
  }
  const anterior = fs.existsSync(LEXICO) ? JSON.parse(fs.readFileSync(LEXICO, "utf8")) : { homografos: [] };
  const homografos = new Set(anterior.homografos);
  const palavras = {};
  for (const [k, c] of [...formas].sort()) {
    if (homografos.has(k)) continue;
    const comAcento = [...c].filter(([w]) => w !== k);
    if (comAcento.length !== 1) continue;      // duas formas acentuadas: contexto
    if ((c.get(k) ?? 0) > 0) continue;         // aparece sem acento: não é regra
    if (comAcento[0][1] < 2) continue;         // evidência de uma só vez não faz lei
    palavras[k] = comAcento[0][0];
  }
  fs.writeFileSync(LEXICO, JSON.stringify({ homografos: anterior.homografos, palavras }, null, 1) + "\n");
  console.log(`léxico regerado: ${Object.keys(palavras).length} palavras, ${anterior.homografos.length} homógrafos fora`);
}

function verificar() {
  const { palavras, homografos } = JSON.parse(fs.readFileSync(LEXICO, "utf8"));
  const fora = new Set(homografos);
  const achados = [];
  for (const f of arquivos()) {
    const t = fs.readFileSync(f, "utf8");
    for (const { w, i } of prosa(f, t)) {
      const k = w.toLowerCase();
      if (des(k) !== k) continue;              // já tem acento
      if (fora.has(k) || !palavras[k]) continue;
      achados.push({ arquivo: path.relative(ROOT, f), linha: linhaDe(t, i), w, certo: palavras[k] });
    }
  }
  const porArquivo = new Map();
  for (const a of achados) {
    if (!porArquivo.has(a.arquivo)) porArquivo.set(a.arquivo, []);
    porArquivo.get(a.arquivo).push(a);
  }
  console.log(`Léxico: ${Object.keys(palavras).length} palavras que só existem com acento neste repositório.`);
  console.log(`Arquivos verificados: ${arquivos().length}\n`);
  for (const [arq, lista] of porArquivo) {
    console.log(`✗ ${arq}`);
    for (const a of lista.slice(0, 20)) console.log(`    linha ${a.linha}: "${a.w}" → "${a.certo}"`);
    if (lista.length > 20) console.log(`    … e mais ${lista.length - 20}`);
  }
  if (achados.length) {
    console.log(`\n✗ FALHOU — ${achados.length} palavra(s) de prosa sem acento.`);
    console.log("   Se a palavra é homógrafo (analise/análise), acrescente em `homografos`.");
    process.exit(1);
  }
  console.log("✓ PASSOU — nenhuma palavra de prosa sem acento nas bibliotecas e manifestos");
}

if (process.argv.includes("--gerar")) gerar();
else verificar();
