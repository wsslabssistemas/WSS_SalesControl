/**
 * A RÉGUA DE FOLLOW-UP — qual passo vem agora, e quando. Sem banco e sem chave.
 *
 * ⚠ O DEFEITO QUE ESTE TESTE GUARDA, e ele nasceu de uma pergunta do fundador,
 * não de um relatório de erro.
 *
 * Ele descreveu o medo: *"se por um milagre em 1 dia eu consigo deixar o
 * sistema sem pendências, no outro dia não pode aparecer esses mil de novo,
 * pois é desanimador."* E o oposto também: *"se não foi concluído, também não
 * pode desaparecer e parar o contato."*
 *
 * Conferindo, o sistema errava para o lado que ele NÃO temia — e pior.
 * `computeDueTouches` escolhia o **último** passo já vencido e o quitava com
 * qualquer contato posterior. Para quem entrou na etapa ontem, certo. Para o
 * ACERVO — 245 combinados vencidos, 352 pessoas sem contato há mais de 30
 * dias, e os ex-alunos que pararam de pagar há anos — **todos os passos já
 * estavam vencidos**, então a régua começava no último e **uma mensagem
 * quitava a sequência inteira**.
 *
 * A régua de três toques virava UM toque, exatamente na base onde ela mais
 * vale: a maior perda medida do piloto é silêncio, 8 de cada 9. E, como
 * sempre nesta casa, não aparecia como erro — a fila só ficava menor do que
 * devia, e fila menor parece trabalho em dia.
 *
 * A REGRA NOVA, em três metades — e a terceira só apareceu ao conferir o
 * efeito da segunda na base real:
 *   • QUAL passo = quantos toques NOSSOS já saíram nesta etapa.
 *   • QUANDO ele vence = o mais TARDE entre a data da régua e um intervalo
 *     desde a última conversa.
 *   • PASSO CUJA JANELA PASSOU É PULADO. Contar só pelos toques mandava o
 *     toque 1 para quem está na etapa há 400 dias — *"como foi sua primeira
 *     semana?"* para quem treina há três anos. A janela de um passo fecha
 *     quando o seguinte vence; vencidas todas, vale o objetivo da etapa e o
 *     "ninguém fala com ele há N dias".
 * Toques dados >= passos da régua → cadência esgotada, some da fila.
 *
 * E a EXCEÇÃO da terceira, declarada no manifesto: régua sem evento real não
 * expira — `steps_expire: false`. Reativação é o caso: "abra por um gancho do
 * histórico dele" vale hoje ou daqui a um ano.
 *
 * ESPERADO: 19/19.
 *
 *   node packages/db/tests/cadencia_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { computeDueTouches, historicoPorContato } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/cadence.ts")).href
);

let ok = 0;
const falhas = [];

/**
 * ⚠ A ASSERÇÃO RECEBE UMA FUNÇÃO, e isso não é estilo — é conserto.
 *
 * A primeira versão passava o valor já calculado. Quando a régua foi quebrada
 * de propósito para conferir se o teste pegava, uma expressão virou
 * `undefined[0].intent`, o arquivo INTEIRO abortou na terceira asserção, e as
 * dez seguintes nunca rodaram — inclusive as que guardam o defeito do acervo,
 * que é o motivo de este arquivo existir.
 *
 * Teste que aborta na primeira falha reporta UM problema quando existem oito,
 * e quem lê conclui que quebrou pouco. Aqui cada asserção roda isolada: erro
 * dentro dela vira falha dela, não fim da execução.
 */
const eq = (nome, calcular, esperado) => {
  let obtido;
  try {
    obtido = typeof calcular === "function" ? calcular() : calcular;
  } catch (e) {
    obtido = `ERRO: ${e.message}`;
  }
  if (JSON.stringify(obtido) === JSON.stringify(esperado)) {
    ok++;
    console.log(`✓ ${nome}`);
  } else {
    falhas.push(`${nome}\n    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
    console.log(`✗ ${nome}`);
  }
};

const DIA = 86400000;
const diasAtras = (n) => new Date(Date.now() - n * DIA).toISOString();

/** A régua real da academia para primeiro contato: 1, 4 e 9 dias. */
const STAGES = [
  {
    key: "contato",
    label: "Primeiro contato",
    cadence: "primeiro_contato",
    goal: "Quebrar o gelo e descobrir o objetivo. Nunca abrir com preço.",
  },
  { key: "recusou", label: "Disse não", terminal: true },
];
const CADENCES = [{
  key: "primeiro_contato",
  steps: [
    { offset_days: 1, intent: "Refazer a pergunta de um jeito mais fácil" },
    { offset_days: 4, intent: "Dar algo útil sem pedir nada em troca" },
    { offset_days: 9, intent: "Encerrar com porta aberta" },
  ],
}];

const pessoa = (id, diasNaEtapa) => ({
  id, name: id, phone: "51999999999", owner_id: "m1",
  journey_stage: "contato", stage_entered_at: diasAtras(diasNaEtapa),
});

const devido = (contatos, ultimo, toques) =>
  computeDueTouches(contatos, ultimo, STAGES, CADENCES, toques);

const passos = (...args) => devido(...args).map((t) => t.stepNumber);

// ---------------------------------------------------------------- O BÁSICO
// Contato novo tem que continuar se comportando EXATAMENTE como antes — a
// correção é do acervo, e correção que muda o caso comum é regressão.

eq("contato que entrou hoje ainda não deve nada",
  () => devido([pessoa("a", 0)], {}, {}).length, 0);

eq("no dia 1 o primeiro toque vence",
  () => passos([pessoa("a", 1)], {}, {}), [1]);

eq("e o texto do toque vem do manifesto, não do núcleo",
  () => devido([pessoa("a", 1)], {}, {})[0].intent, "Refazer a pergunta de um jeito mais fácil");

eq("etapa terminal não recebe toque",
  () => devido([{ ...pessoa("a", 30), journey_stage: "recusou" }], {}, {}).length, 0);

// -------------------------------- SAI DE HOJE, VOLTA NO INTERVALO DO PASSO
// O medo do fundador, e o oposto dele, no mesmo mecanismo. Pessoa entrou há 4
// dias, recebeu o toque 1, e falamos com ela HOJE.

eq("depois de falar hoje, a pessoa SAI da lista de hoje",
  () => devido([pessoa("x", 4)], { x: diasAtras(0) }, { x: 1 }).length, 0);

eq("um dia depois ela não reaparece — seria desanimador",
  () => devido([pessoa("x", 5)], { x: diasAtras(1) }, { x: 1 }).length, 0);

eq("dois dias depois ainda não — o intervalo do passo 2 é 3",
  () => devido([pessoa("x", 6)], { x: diasAtras(2) }, { x: 1 }).length, 0);

// E o outro lado: também não pode sumir para sempre.
eq("no terceiro dia ela VOLTA, no passo 2",
  () => passos([pessoa("x", 7)], { x: diasAtras(3) }, { x: 1 }), [2]);

// ----------------------------------------------------- A RÉGUA SE ESGOTA
// `max_attempts` do manifesto: três toques e para. Insistir além disso em
// ticket de mensalidade queima o contato para a reativação.
eq("dados os três toques, a cadência se esgota e a pessoa some da fila",
  () => devido([pessoa("x", 12)], { x: diasAtras(1) }, { x: 3 }).length, 0);

// ------------------------------------ ⚠ O ACERVO: PASSO PERDIDO NÃO É ATRASADO
//
// Alguém parado há 400 dias. A primeira versão desta correção escolhia o passo
// pela contagem de toques e mandava o toque 1 — que na academia é *"refazer a
// pergunta"* e, na régua de matrícula, *"primeira semana: como foi vir"*. Para
// quem está há três anos, isso é fluente e errado: o pior defeito possível
// numa mensagem que sai no nome da academia.
//
// A janela de um passo fecha quando o seguinte vence. Vencidas todas, a régua
// não tem mais o que dizer — e o sistema fala do OBJETIVO da etapa, dizendo há
// quantos dias ninguém conversa. Genérico e honesto ganha de específico e falso.

eq("no acervo, a régua não finge que é o toque do dia 1",
  () => passos([pessoa("velho", 400)], {}, {}), [0]);

eq("ele vira alarme de silêncio, não passo de cadência",
  () => devido([pessoa("velho", 400)], {}, {})[0].semCadencia, true);

eq("e o texto passa a ser o OBJETIVO da etapa, do manifesto",
  () => devido([pessoa("velho", 400)], {}, {})[0].intent,
  "Quebrar o gelo e descobrir o objetivo. Nunca abrir com preço.");

// O meio-termo, que é o caso mais comum do acervo real: entrou há 6 dias sem
// nenhum toque. O dia 1 já passou do prazo, o dia 4 ainda vale.
eq("passo cuja janela passou é PULADO, não repetido",
  () => passos([pessoa("meio", 6)], {}, {}), [2]);

// ------------------------- ⚠ RÉGUA SEM EVENTO NÃO EXPIRA (`steps_expire: false`)
//
// A expiração protege o passo preso a um EVENTO REAL: "primeira semana" não
// pode chegar para quem está há três anos. Reativação não tem evento nenhum —
// "abra por um gancho do histórico dele" é verdade hoje ou daqui a um ano.
//
// Sem esta exceção, importar 1.200 ex-alunos de uma vez faria a régua expirar
// para a maioria ANTES de a ração diária (10 por vendedor) alcançá-los: eles
// cairiam no aviso genérico de silêncio, jogando fora a curadoria justamente
// na lista para a qual ela foi escrita.
const REATIVACAO = [{
  key: "reativacao",
  steps_expire: false,
  steps: [
    { offset_days: 0, intent: "Gancho concreto do histórico dele" },
    { offset_days: 7, intent: "O que mudou desde que ele saiu" },
    { offset_days: 21, intent: "Retorno sem risco" },
  ],
}];
const ETAPA_EX = [{ key: "ex_aluno", label: "Ex-aluno", lost: true, cadence: "reativacao", goal: "Foi aluno e saiu." }];
const exAluno = (dias) => ({
  id: "ex", name: "ex", phone: "51999999999", owner_id: "m1",
  journey_stage: "ex_aluno", stage_entered_at: diasAtras(dias),
});

eq("ex-aluno importado há 90 dias ainda recebe o PRIMEIRO toque curado",
  () => computeDueTouches([exAluno(90)], {}, ETAPA_EX, REATIVACAO, {}).map((t) => t.stepNumber), [1]);

eq("e o texto é o da régua, não o aviso genérico de silêncio",
  () => computeDueTouches([exAluno(90)], {}, ETAPA_EX, REATIVACAO, {})[0].intent,
  "Gancho concreto do histórico dele");

// A régua não expirar não quer dizer que ela não avança: depois do toque 1,
// o toque 2 vence 7 dias depois da conversa, como em qualquer outra.
eq("depois do primeiro toque, o segundo respeita o intervalo",
  () => computeDueTouches([exAluno(97)], { ex: diasAtras(7) }, ETAPA_EX, REATIVACAO, { ex: 1 }).map((t) => t.stepNumber), [2]);

eq("e não reaparece no dia seguinte ao toque",
  () => computeDueTouches([exAluno(91)], { ex: diasAtras(1) }, ETAPA_EX, REATIVACAO, { ex: 1 }).length, 0);

// ------------------------------------------ RESPOSTA DO CLIENTE ADIA, NÃO EXECUTA
// Ela entra no `ultimo` (adia o próximo toque) mas não conta como toque nosso.
const historico = () => historicoPorContato(
  [
    { contact_id: "x", occurred_at: diasAtras(10), direction: "outbound" },
    { contact_id: "x", occurred_at: diasAtras(9), direction: "inbound" },
    { contact_id: "x", occurred_at: diasAtras(9), direction: "inbound" },
    // Anterior à entrada na etapa: é de outra fase da vida do contato.
    { contact_id: "x", occurred_at: diasAtras(400), direction: "outbound" },
  ],
  { x: diasAtras(30) },
);

eq("três respostas do cliente não esgotam a régua dele", () => historico().toques.x, 1);

eq("a última conversa é a mais recente, venha na ordem que vier",
  () => historico().ultimo.x.slice(0, 10), diasAtras(9).slice(0, 10));

console.log();
if (falhas.length) {
  console.log(`✗ FALHOU — ${ok}/${ok + falhas.length}`);
  for (const f of falhas) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`✓ PASSOU — ${ok}/${ok}`);
