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
 * A REGRA NOVA, em duas metades que só funcionam juntas:
 *   • QUAL passo = quantos toques NOSSOS já saíram nesta etapa.
 *   • QUANDO ele vence = o mais TARDE entre a data da régua e um intervalo
 *     desde a última conversa.
 * Toques dados >= passos da régua → cadência esgotada, some da fila.
 *
 * ESPERADO: 13/13.
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
  { key: "contato", label: "Primeiro contato", cadence: "primeiro_contato" },
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

// ------------------------------------------------- O ACERVO: O DEFEITO REAL
// Alguém parado há 400 dias na etapa. Antes, a régua começava no ÚLTIMO passo
// e uma mensagem quitava tudo.

eq("no acervo, a régua começa no PRIMEIRO passo, não no último",
  () => passos([pessoa("velho", 400)], {}, {}), [1]);

eq("e ele aparece como muito atrasado, não como novo",
  () => devido([pessoa("velho", 400)], {}, {})[0].overdueDays, 399);

// Falei com ele HOJE. O toque 1 foi dado.
eq("depois de falar hoje, a pessoa SAI da lista de hoje",
  () => devido([pessoa("velho", 400)], { velho: diasAtras(0) }, { velho: 1 }).length, 0);

// ⚠ O MEDO DO FUNDADOR, e a resposta a ele: os mil NÃO voltam no dia seguinte.
eq("um dia depois de ser tocada, a pessoa não reaparece",
  () => devido([pessoa("velho", 401)], { velho: diasAtras(1) }, { velho: 1 }).length, 0);

eq("dois dias depois ainda não voltou — o intervalo do passo 2 é 3",
  () => devido([pessoa("velho", 402)], { velho: diasAtras(2) }, { velho: 1 }).length, 0);

// E o outro lado do medo dele: também não pode sumir para sempre.
eq("no terceiro dia ela VOLTA, no passo 2",
  () => passos([pessoa("velho", 403)], { velho: diasAtras(3) }, { velho: 1 }), [2]);

// ----------------------------------------------------- A RÉGUA SE ESGOTA
// `max_attempts` do manifesto: três toques e para. Insistir além disso em
// ticket de mensalidade queima o contato para a reativação.
eq("dados os três toques, a cadência se esgota e a pessoa some da fila",
  () => devido([pessoa("velho", 500)], { velho: diasAtras(30) }, { velho: 3 }).length, 0);

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
