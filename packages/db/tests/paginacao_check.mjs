/**
 * O CORTE SILENCIOSO DO POSTGREST — a trava. Sem banco e sem chave.
 *
 * ⚠ ESTA CLASSE DE DEFEITO JÁ APARECEU TRÊS VEZES NESTE REPOSITÓRIO.
 *
 * O PostgREST devolve no máximo **1.000 linhas** e **não avisa**: não vem
 * erro, não vem flag, vem um número plausível e menor. Pior, `.limit(5000)`
 * **não protege** — o teto é do servidor, e o `.limit()` maior só dá a
 * impressão de que alguém pensou no assunto.
 *
 * As três vezes:
 *   1. Canonização das técnicas — 53 interações sumiram em silêncio.
 *   2. Fila e Painel — corrigidos preventivamente com `lerTudo`.
 *   3. **14/ago/2026, AO VIVO e achado pelo fundador.** Ele perguntou "o que
 *      os vendedores fizeram hoje" e o Analista respondeu que o último
 *      movimento fora 20 dias antes. Ele desconfiou — *"não pode, eles devem
 *      ter usado o sistema sim"* — e estava certo: havia 32 interações no dia
 *      anterior. A consulta tinha `.limit(5000)`, existiam 1.955 linhas no
 *      período, e chegaram **1.000, escolhidas arbitrariamente** (sem
 *      `ORDER BY` a ordem não é nem estável entre chamadas). A IA então
 *      raciocinou com honestidade sobre um recorte que ninguém sabia existir.
 *
 * É o pior tipo de defeito deste produto: **ninguém tem como desconfiar de um
 * dado que não apareceu.** Só apareceu porque o dono conhecia a operação.
 *
 * ⚠ E O CASO MAIS PERIGOSO NÃO TEM `.limit()` NENHUM.
 *
 * A primeira versão desta trava só procurava `.limit()` grande — e deixou
 * passar uma leitura de `contacts` sem limite algum, **no mesmo arquivo do
 * defeito que ela existe para guardar**. Consulta sem limite parece inocente e
 * é a mais exposta: com 614 contatos vem tudo; com os 9 mil que vão entrar,
 * vêm 1.000 e ninguém percebe.
 *
 * A REGRA: leitura de tabela que cresce usa `lerTudo`. `.limit(n)` pequeno
 * continua legítimo — é "os 6 da tela", decisão de produto. E
 * `// paginacao-ok: <motivo>` libera com o motivo escrito, mesma disciplina do
 * `skills_client_check`: ponto novo falha até ser classificado.
 *
 * ESPERADO: 0 consultas suspeitas.
 *
 *   node packages/db/tests/paginacao_check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const RAIZ = path.join(ROOT, "apps/web");

/** Abaixo disto, `.limit()` é decisão de produto, não tentativa de pegar tudo. */
const TETO_HONESTO = 200;

/**
 * ⚠ A LINHA DE BASE — e por que ela existe em vez de um CI vermelho.
 *
 * Quando esta trava nasceu (14/ago/2026) ela apontou **44** consultas. Cinco
 * foram corrigidas na hora — as que causavam o defeito ao vivo. As outras 39
 * são leituras espalhadas por 20 arquivos, boa parte delas de linha única,
 * que precisam de triagem uma a uma e não de substituição em massa.
 *
 * Deixar o CI vermelho enquanto isso seria pior que não ter trava: build
 * quebrado por padrão é build que ninguém olha, e a próxima quebra de
 * verdade entra sem ninguém ver. **A regra aqui é dívida que não cresce.**
 *
 * A trava falha quando o número SOBE. Quando alguém consertar um trecho,
 * abaixa este número junto — e aí ele nunca mais volta a subir.
 *
 * Chegar a zero é o objetivo, e cada `paginacao-ok:` escrito com motivo conta
 * como conserto: o que se quer não é o número, é que **ninguém leia uma
 * tabela que cresce sem ter decidido o que acontece quando ela crescer.**
 */
const DIVIDA_CONHECIDA = 39;

/** Só o que a operação faz crescer. Catálogo pode ser lido inteiro. */
const TABELAS_QUE_CRESCEM = [
  "interactions", "contacts", "contact_stage_history",
  "services_rendered", "usage_ledger", "course_progress",
];

const ESCAPES = [
  "lerTudo", "paginacao-ok:", ".maybeSingle()", ".single()",
  "head: true", 'count: "exact"',
];

function arquivos(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...arquivos(p));
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const NL = String.fromCharCode(10);

/**
 * Apaga o CONTEÚDO dos comentários preservando as quebras de linha — a v1
 * acusou o texto do próprio comentário que documenta o defeito, e trava que
 * acusa a própria documentação é trava que alguém desliga.
 */
function semComentarios(texto) {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .split(NL)
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join(NL);
}

let suspeitas = 0;

for (const arq of arquivos(RAIZ)) {
  const bruto = fs.readFileSync(arq, "utf8");
  const linhas = semComentarios(bruto).split(NL);
  const linhasBrutas = bruto.split(NL);
  const rel = path.relative(ROOT, arq).split(path.sep).join("/");

  for (const [i, linha] of linhas.entries()) {
    const tabela = TABELAS_QUE_CRESCEM.find((t) => linha.includes(`.from("${t}")`));
    if (!tabela) continue;

    // A consulta é encadeada em várias linhas: a janela cobre o encadeamento
    // nos dois sentidos. O `paginacao-ok:` é procurado no texto BRUTO, porque
    // é lá que o comentário existe.
    const de = Math.max(0, i - 6);
    const ate = Math.min(linhas.length, i + 14);
    const janela = linhas.slice(de, ate).join(NL);
    const janelaBruta = linhasBrutas.slice(de, ate).join(NL);
    if (ESCAPES.some((e) => janela.includes(e) || janelaBruta.includes(e))) continue;

    const lim = janela.match(/\.limit\(\s*(\d+)\s*\)/);
    if (lim && Number(lim[1]) < TETO_HONESTO) continue;

    suspeitas++;
    console.log(`✗ ${rel}:${i + 1}`);
    if (lim) {
      console.log(`    .limit(${lim[1]}) em "${tabela}" sem lerTudo.`);
      console.log(`    O PostgREST corta em 1.000 e não avisa — este limite não protege, só disfarça.`);
    } else {
      console.log(`    leitura de "${tabela}" sem limite e sem lerTudo.`);
      console.log(`    Parece inocente e é a mais exposta: hoje cabe, amanhã vem cortada em silêncio.`);
    }
    console.log(`    Use lerTudo, ou escreva "// paginacao-ok: <motivo>" se de fato não pode crescer.`);
  }
}

console.log(`${NL}${suspeitas} consulta(s) sem paginação · dívida conhecida: ${DIVIDA_CONHECIDA}`);

if (suspeitas > DIVIDA_CONHECIDA) {
  console.log(
    `${NL}✗ FALHOU — ${suspeitas - DIVIDA_CONHECIDA} leitura(s) NOVA(S) sem paginação.` +
    `${NL}  A dívida antiga é tolerada; dívida nova, não. Use lerTudo, ou escreva` +
    `${NL}  "// paginacao-ok: <motivo>" explicando por que aquela tabela não cresce.`,
  );
  process.exit(1);
}

if (suspeitas < DIVIDA_CONHECIDA) {
  console.log(
    `${NL}✗ FALHOU (do jeito bom) — a dívida caiu para ${suspeitas}.` +
    `${NL}  Abaixe DIVIDA_CONHECIDA neste arquivo para ${suspeitas}, senão o terreno` +
    `${NL}  conquistado volta a ser perdido em silêncio.`,
  );
  process.exit(1);
}

console.log(`${NL}✓ PASSOU — nenhuma leitura NOVA sem paginação (${suspeitas} pendentes de antes)`);
process.exit(0);
