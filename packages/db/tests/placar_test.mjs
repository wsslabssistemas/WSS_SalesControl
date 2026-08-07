/**
 * O PLACAR DA EQUIPE — sem banco e sem chave.
 *
 * Por que existe: este é o único lugar do produto que mostra o desempenho de
 * UMA PESSOA para os colegas dela. Errar aqui não quebra tela — desmotiva
 * gente, e a pessoa não tem como contestar um número que o sistema afirma.
 *
 * O caso que originou o teste veio da captura do piloto que o fundador mandou:
 * uma vendedora com "27 atendimentos · 0% conversão" em vermelho. Percentual
 * sobre amostra pequena é o mesmo folclore que derrubou o ranking de escolas
 * em ago/2026, quando Cialdini "liderou" com 1 fechamento em 53 pessoas.
 *
 * ESPERADO: 12/12.
 *
 *   node packages/db/tests/placar_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { computePlacar, N_MINIMO_CONVERSAO, semAmostra } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/placar.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}

const MEMBROS = [{ id: "a", nome: "Ana" }, { id: "b", nome: "Bruno" }];
const at = (dono, minutos) => ({
  ownerId: dono,
  entradaISO: "2026-08-01T10:00:00Z",
  respostaISO: minutos === null ? null : new Date(Date.parse("2026-08-01T10:00:00Z") + minutos * 60000).toISOString(),
});
const ct = (dono, ganho = false, atrasado = false) => ({
  ownerId: dono, ganho, combinadoAtrasado: atrasado, novoNoPeriodo: true,
});

// ------------------------------------- A REGRA QUE MAIS IMPORTA: o n pequeno
const poucos = computePlacar(MEMBROS, [], Array.from({ length: 27 }, () => ct("a")));
verifica(
  "27 leads e 0 fechamentos NÃO viram 0%",
  poucos.pessoas.find((p) => p.ownerId === "a").conversao,
  null,
);
verifica(
  "e o n aparece para a tela poder dizer por quê",
  poucos.pessoas.find((p) => p.ownerId === "a").nConversao,
  27,
);
verifica("o texto do lugar do percentual cita o piso", /30/.test(semAmostra(27)), true);

// Com amostra suficiente, o percentual aparece.
const muitos = computePlacar(
  MEMBROS, [],
  [...Array.from({ length: 36 }, () => ct("a")), ...Array.from({ length: 4 }, () => ct("a", true))],
);
verifica("40 leads com 4 fechamentos vira 10%", muitos.pessoas.find((p) => p.ownerId === "a").conversao, 10);

// ------------------------------------------------- a conta canônica do repo
// Conversão é convertidos ÷ LEADS, nunca ÷ atendimentos: dois atendimentos da
// mesma pessoa não são duas chances.
const muitosAtendimentos = computePlacar(
  MEMBROS,
  Array.from({ length: 500 }, () => at("a", 10)),
  [...Array.from({ length: 30 }, () => ct("a")), ...Array.from({ length: 10 }, () => ct("a", true))],
);
verifica(
  "conversão usa leads, não atendimentos",
  muitosAtendimentos.pessoas.find((p) => p.ownerId === "a").conversao,
  25,
);

// ------------------------------------------------------------- o time antes
const time = computePlacar(MEMBROS, [at("a", 5), at("b", 15)], [ct("a", true), ct("b")]);
verifica("o time soma todo mundo", time.time.atendimentos, 2);
verifica("o time tem os fechamentos de todos", time.time.fechamentos, 1);

// -------------------------------------------------------------- a mediana
// Mediana, nunca média — a métrica canônica. Com [5, 10, 300] a média é 105 e
// a mediana é 10: um atendimento esquecido no fim de semana não pode fazer a
// equipe inteira parecer lenta.
const resp = computePlacar([{ id: "a", nome: "Ana" }], [at("a", 5), at("a", 10), at("a", 300)], []);
verifica("tempo de resposta é mediana, não média", resp.pessoas[0].respostaMediana, 10);
verifica("sem resposta medida, fica null e não zero", computePlacar([{ id: "a", nome: "Ana" }], [at("a", null)], []).pessoas[0].respostaMediana, null);

// --------------------------------------------------------------- a ordem
// Ordena por ATENDIMENTO. Ordenar por conversão com amostra pequena inventaria
// um pódio, e o primeiro lugar de hoje seria ruído.
const ordem = computePlacar(MEMBROS, [at("b", 5), at("b", 5), at("a", 5)], []);
verifica("ordena por atendimento, não por resultado", ordem.pessoas.map((p) => p.ownerId), ["b", "a"]);

// ------------------------------------------------------------- os atrasados
verifica(
  "combinado atrasado conta, mas é número neutro",
  computePlacar(MEMBROS, [], [ct("a", false, true), ct("a", false, true)]).pessoas.find((p) => p.ownerId === "a").combinadosAtrasados,
  2,
);
verifica("o piso é 30", N_MINIMO_CONVERSAO, 30);

console.log(falhas ? `\n✗ FALHOU — ${falhas} caso(s)` : "\n✓ PASSOU — 12/12");
process.exit(falhas ? 1 : 0);
