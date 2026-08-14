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
 * ⚠ A LINHA DE BASE — hoje ZERO, e é bom entender como ela chegou aqui.
 *
 * Quando esta trava nasceu (14/ago/2026) ela apontou **44** consultas. Cinco
 * foram corrigidas na hora; as outras 39 viraram linha de base, porque CI
 * vermelho permanente é trava que alguém desliga.
 *
 * A triagem das 39 (14/ago, mesmo dia) devolveu um resultado incômodo: **26
 * não eram leitura nenhuma** — eram `insert`, `update` e `delete`, que não
 * devolvem linha para o PostgREST cortar. A trava media `.from("tabela")`,
 * não "leitura que pode voltar cortada", e a dívida parecia intratável por
 * causa disso. É o mesmo defeito que a trava do `seed-curso.mjs` já teve, e
 * a lição continua a mesma: *trava que nasce de um bug concreto tende a medir
 * aquele bug em vez da propriedade.*
 *
 * Fechado o que ela media, apareceram **oito leituras reais que estavam
 * escondidas** — inclusive o gasto global do mês no painel do fabricante, que
 * escapava porque a consulta VIZINHA usava `.maybeSingle()`. Todas corrigidas.
 *
 * **De hoje em diante o número é zero e a regra deixa de ser "dívida que não
 * cresce": é dívida que não existe.** Consulta nova de leitura numa tabela
 * que cresce usa `lerTudo`, ou escreve `paginacao-ok:` com o motivo — e o
 * motivo é o produto aqui, não o número. O que se quer é que **ninguém leia
 * uma tabela que cresce sem ter decidido o que acontece quando ela crescer.**
 */
const DIVIDA_CONHECIDA = 0;

/** Só o que a operação faz crescer. Catálogo pode ser lido inteiro. */
const TABELAS_QUE_CRESCEM = [
  "interactions", "contacts", "contact_stage_history",
  "services_rendered", "usage_ledger", "course_progress",
];

/**
 * ⚠ ABSOLVIÇÃO É POR CONSULTA, NUNCA POR VIZINHANÇA (achado em 14/ago/2026).
 *
 * A versão anterior procurava os escapes na JANELA inteira — 6 linhas para
 * trás e 14 para a frente. Dentro de um `Promise.all` isso quer dizer que
 * **uma consulta absolvia a outra**: em `/painel/admin` a leitura de
 * `usage_ledger` que soma o gasto global do mês passava batida porque uma
 * linha acima havia um `.maybeSingle()` de `ai_limits`.
 *
 * O número que ela calcula é justamente o que a barra do teto global mostra.
 * Cortado em 1.000, o painel do fabricante diria que se gastou menos do que
 * se gastou — o freio de custo lendo um número menor que o real, que é o
 * único erro daquela tela que não dá para corrigir depois.
 *
 * Estes quatro são propriedades da PRÓPRIA consulta, então são procurados só
 * dentro dela.
 */
const ESCAPES_DA_CONSULTA = [".maybeSingle()", ".single()", "head: true", 'count: "exact"'];

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
 *
 * ⚠ E ELA VOLTOU A ACUSAR, POR CAUSA DO `\r` (achado em 14/ago/2026).
 *
 * O repositório é editado no Windows e os arquivos estão em CRLF. A versão
 * anterior tirava comentário de linha com `/\/\/.*$/` — e `.` **não casa com
 * `\r`**, que o JavaScript trata como terminador de linha igual ao `\n`. Com
 * `\r` sobrando no fim, o `$` (sem flag `m`) nunca chegava, o `replace` não
 * casava nada e **nenhum comentário de linha era apagado**.
 *
 * O efeito era exatamente o que a v1 existia para evitar: em
 * `gestao/ia-actions.ts` a trava apontava `.limit(5000)` numa consulta que
 * está paginada há dias — o `5000` estava no COMENTÁRIO que conta a história
 * do defeito. Trava que aponta o lugar errado gasta o crédito que ela vai
 * precisar no dia em que apontar certo.
 *
 * Tirar o `$` resolve: `.*` para sozinho no `\r`, e o que sobra é só a quebra.
 */
function semComentarios(texto) {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .split(NL)
    .map((l) => l.replace(/\/\/.*/, ""))
    .join(NL);
}

/**
 * ⚠ ESCREVER NÃO É LER — e só a leitura pode ser cortada em silêncio.
 *
 * `insert`, `upsert`, `update` e `delete` sem `.select()` não devolvem
 * linha nenhuma: não existe conjunto para o PostgREST cortar, e o UPDATE
 * alcança todas as linhas do filtro independentemente de qualquer teto. A
 * versão anterior acusava os 26 pontos de escrita do app junto com as
 * leituras, e é isso que fazia a dívida parecer intratável.
 *
 * **A exigência do `.select()` é o que impede a brecha:** `update().select()`
 * e `insert().select()` DEVOLVEM linhas, e aí o corte volta a existir — um
 * `update` em massa que conta `data.length` para dizer "N atualizados"
 * reportaria 1.000 com 3.000 alterados, que é a mesma mentira plausível de
 * sempre. Esses continuam sendo acusados.
 *
 * A lição está escrita no `ESTADO_DO_PROJETO.md`, na trava do curso: *quando
 * uma trava nasce de um bug concreto, ela tende a medir aquele bug em vez da
 * propriedade.* A propriedade aqui é **leitura que pode voltar cortada**.
 */
const VERBOS_DE_ESCRITA = [".insert(", ".upsert(", ".update(", ".delete("];

/**
 * A CONSULTA, e só ela: da linha do `.from(...)` enquanto durar o
 * encadeamento.
 *
 * O critério é a linha seguinte começar com `.` — que é como este
 * repositório escreve consulta quebrada em várias linhas. Fechar no primeiro
 * `;` não serve: dentro de um `Promise.all([...])` não existe `;` entre um
 * elemento e o outro, e o trecho engolia a consulta vizinha. Foi assim que
 * a segunda leitura de `contacts` do Placar da Equipe passou batida —
 * herdando o `.range(de, ate)` do `lerTudo` do elemento de baixo.
 */
/**
 * O bloco de comentário colado na consulta — o que um humano escreveu SOBRE
 * ELA.
 *
 * Sobe da linha do `.from(...)` pulando no máximo três linhas de código (o
 * cabeçalho da consulta: `const x = await supabase`, `lerTudo<T>(`,
 * `(de, ate) => supabase`) e, ao achar comentário, absorve o bloco inteiro.
 * A primeira linha de código depois disso fecha — então o bloco pertence a
 * esta consulta e não pode ser o de outra.
 */
function comentarioColado(linhasBrutas, i) {
  const ehComentario = (l) => /^\s*(\/\/|\*|\/\*)/.test(l);
  let k = i - 1;
  let pulos = 0;
  while (k >= 0 && !ehComentario(linhasBrutas[k]) && pulos < 3) { k--; pulos++; }
  const bloco = [];
  while (k >= 0 && ehComentario(linhasBrutas[k])) { bloco.unshift(linhasBrutas[k]); k--; }
  return bloco.join(NL);
}

function instrucao(linhas, i, ate) {
  const trecho = [linhas[i]];
  for (let k = i + 1; k < ate; k++) {
    if (!linhas[k].trim().startsWith(".")) break;
    trecho.push(linhas[k]);
  }
  return trecho.join(NL);
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
    // nos dois sentidos, mas serve só para achar o que é escrito EM VOLTA da
    // consulta (o nome do `lerTudo` e o comentário de liberação). Tudo que é
    // propriedade da consulta em si é procurado dentro dela.
    const de = Math.max(0, i - 6);
    const ate = Math.min(linhas.length, i + 14);
    const janela = linhas.slice(de, ate).join(NL);
    const stmt = instrucao(linhas, i, ate);

    // ESCRITA sem `.select()` não devolve linhas — não há o que cortar.
    // Olhada só para a FRENTE, a partir do `.from(...)`: o verbo vem logo
    // depois dele, e olhar para trás faria uma escrita vizinha absolver a
    // leitura da linha de cima.
    if (VERBOS_DE_ESCRITA.some((v) => stmt.includes(v)) && !stmt.includes(".select(")) continue;

    if (ESCAPES_DA_CONSULTA.some((e) => stmt.includes(e))) continue;

    // ⚠ PAGINAÇÃO DE VERDADE DEIXA DUAS MARCAS, e as duas são exigidas: o
    // nome do helper em volta e o `.range(de, ate)` DENTRO da consulta. Só o
    // nome não basta — foi assim que um `lerTudo` de uma linha vizinha
    // absolveu a consulta ao lado.
    if (stmt.includes(".range(") && janela.includes("lerTudo")) continue;

    // A liberação escrita à mão vale no COMENTÁRIO GRUDADO NA CONSULTA — o
    // bloco imediatamente acima dela, inteiro, por mais longo que seja.
    //
    // Nem janela fixa larga (que faz uma consulta perdoar a vizinha) nem
    // janela fixa curta (que não cabe um motivo escrito de verdade, e motivo
    // que não cabe vira motivo que ninguém escreve).
    if (comentarioColado(linhasBrutas, i).includes("paginacao-ok:")) continue;

    const lim = stmt.match(/\.limit\(\s*(\d+)\s*\)/);
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
