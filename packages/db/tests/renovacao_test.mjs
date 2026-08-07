/**
 * AS JANELAS DE RENOVAÇÃO — sem banco e sem chave.
 *
 * Por que existe: renovação errada não quebra tela. O contato acontece, o
 * cliente responde, e o defeito só aparece na taxa de renovação três meses
 * depois — quando ninguém mais lembra que a régua estava trocada.
 *
 * O caso que mais importa é o da JANELA APERTADA: um contrato a 25 dias de
 * vencer não pode cair na conversa de 60 dias. Se cair, o vendedor chega
 * perguntando "e aí, como está indo?" faltando três semanas — e depois não
 * sobra tempo para a condição concreta. A régua certa é a mais apertada que
 * ainda cabe.
 *
 * ESPERADO: 11/11.
 *
 *   node packages/db/tests/renovacao_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { computeRenovacoes, JANELAS } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/renovacao.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}

const HOJE = new Date("2026-08-07T12:00:00Z");
const daqui = (d) => new Date(Date.parse("2026-08-07") + d * 86400000).toISOString().slice(0, 10);
const c = (id, dias, stage = "convertido") => ({
  id, name: id, phone: null, journey_stage: stage, contract_end: daqui(dias),
});
const rodar = (lista, fora = new Set()) => computeRenovacoes(lista, fora, HOJE);
const janelaDe = (dias) => rodar([c("x", dias)])[0]?.janela ?? null;

// ------------------------------------------------------------ as três janelas
verifica("60 dias → falar do resultado", janelaDe(60), "resultado");
verifica("30 dias → abrir continuidade", janelaDe(30), "continuidade");
verifica("7 dias → condição concreta", janelaDe(7), "condicao");

// A JANELA MAIS APERTADA QUE CABE. Este é o caso que originou o teste: 25
// dias está dentro de 60 e dentro de 30 — tem que dar a de 30, não a de 60.
verifica("25 dias cai na janela de 30, não na de 60", janelaDe(25), "continuidade");
verifica("5 dias cai na de 7, não na de 30", janelaDe(5), "condicao");

// Fora de qualquer janela: silêncio. Alertar cedo demais gasta o toque.
verifica("90 dias ainda não entra em nenhuma janela", rodar([c("x", 90)]).length, 0);

// ------------------------------------------------------------------- vencido
const vencido = rodar([c("x", -12)])[0];
verifica("vencido entra na lista", vencido?.vencido, true);
// A intenção do vencido NÃO cita quantos dias passaram: "venceu há 40 dias"
// dito ao cliente é constrangimento, não argumento.
verifica("a intenção do vencido não expõe o atraso", /\d+\s*dias/.test(vencido?.intencao ?? ""), false);

// ------------------------------------------------------------------ a ordem
// Vencido primeiro (perda mais barata de evitar), depois o mais próximo.
verifica(
  "vencido vem antes, depois o mais próximo de vencer",
  rodar([c("a", 55), c("b", -3), c("c", 10)]).map((r) => r.contactId),
  ["b", "c", "a"],
);

// -------------------------------------------------------------- fora de jogo
// Quem já saiu não recebe conversa de renovação — seria oferecer continuidade
// a quem disse não.
verifica("etapa de perda não recebe renovação", rodar([c("x", 20, "perdido")], new Set(["perdido"])).length, 0);

// A REGRA QUE MAIS IMPORTA, e por isso ela é teste e não comentário: o
// primeiro toque NÃO fala de renovação. Fala do resultado.
verifica(
  "a janela de 60 dias proíbe mencionar renovação",
  /não mencione renovação/i.test(JANELAS.find((j) => j.key === "resultado").intencao),
  true,
);

console.log(falhas ? `\n✗ FALHOU — ${falhas} caso(s)` : "\n✓ PASSOU — 11/11");
process.exit(falhas ? 1 : 0);
