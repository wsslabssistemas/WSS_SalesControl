/**
 * A FILA DE ENVIO — quitação e dedução. Sem banco e sem chave.
 *
 * ⚠ POR QUE ESTE TESTE EXISTE, e o defeito exato que ele guarda.
 *
 * O fundador conferiu a Be Fitness em 10/ago/2026 e viu uma aluna já
 * MATRICULADA — Ana Alicie Carati — no tópico "Você combinou de voltar",
 * depois de já ter respondido. Ela também aparecia em "leads esfriando" e nos
 * toques da cadência. Três listas, a mesma pessoa, e nada na tela dizendo que
 * era a mesma.
 *
 * A causa não foi a régua de 30/60/90 que ele suspeitou (essa era a terceira
 * causa, não a primeira). Foram três somadas:
 *
 *   1. `combinado` NUNCA QUITAVA. `next_action_at` é data fixa e nada a
 *      limpava; uma vez vencida, a pessoa ficava na fila para sempre — e no
 *      motivo de prioridade 1, que mascara os outros três. Medido na base
 *      real: 233 de 251 combinados vencidos, 74 com a pessoa já tendo
 *      respondido DEPOIS da data.
 *   2. A dedução "uma pessoa, um motivo" só valia dentro de `/painel/fila`.
 *      O Painel inicial montava cinco listas próprias, sem dedução nenhuma.
 *   3. `phases` e `cadence` são a mesma régua declarada duas vezes no
 *      manifesto, e o `computeAlerts` da agenda emitia UMA LINHA POR FASE
 *      VENCIDA, sem quitação: 313 matriculadas × 2 fases passadas.
 *
 * O padrão da casa outra vez: **nenhuma das três apareceu como erro.** A
 * lista simplesmente não encolhia, e lista que não encolhe parece trabalho
 * acumulado, não defeito.
 *
 * ESPERADO: 14/14.
 *
 *   node packages/db/tests/fila_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { quitado, montarFila, construirFila, PESO } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/fila.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}

// ---------------------------------------------------------------- QUITAÇÃO

// Sem interação nenhuma o toque é devido: é o caso do contato importado que
// ninguém tocou. Devolver "quitado" aqui esconderia a pessoa para sempre —
// falha na direção que PARECE certa, que é a classe que mais custou aqui.
verifica("sem histórico, continua devido", quitado(undefined, "2026-07-12"), false);

// O caso Ana Alicie: combinado em 12/jul, conversa em 10/ago.
verifica("falou depois da data, quita", quitado("2026-08-10T14:57:11Z", "2026-07-12"), true);

// Falou ANTES do combinado não vale: a conversa de 10/jul é o que gerou o
// compromisso do dia 12, não o cumprimento dele.
verifica("falou antes da data, continua devido", quitado("2026-07-10T16:37:00Z", "2026-07-12"), false);

// ⚠ MESMO DIA QUITA — e é o único caso em que a comparação de string crua
// erra. `"2026-07-12T14:00:00Z" >= "2026-07-12"` é verdadeiro por sorte, mas
// o instante precisa ser cortado no dia para o caso oposto não vazar. Sem o
// `slice(0,10)`, quem foi contatado às 14h do próprio dia voltaria à fila no
// dia seguinte com "+1d", e o vendedor mandaria a segunda mensagem.
verifica("falou no mesmo dia, quita", quitado("2026-07-12T14:00:00Z", "2026-07-12"), true);

// O vencimento também pode chegar como instante (o banco devolve timestamptz).
verifica("vencimento com hora também compara por dia", quitado("2026-07-12T09:00:00Z", "2026-07-12T00:00:00+00"), true);

// ------------------------------------------------------- UMA PESSOA, UM MOTIVO

const item = (id, motivo, atraso = 0) => ({
  contactId: id, name: `Pessoa ${id}`, phone: "51999999999", ownerId: null,
  motivo, intencao: "-", atraso,
});

// O caso que o fundador descreveu: a mesma pessoa devida por quatro motivos.
// Ela sai UMA vez, pelo mais caro de furar — o combinado, porque o cliente
// lembra que marcou.
const quatro = montarFila([
  item("x", "recompra", 30), item("x", "followup", 20),
  item("x", "renovacao", 10), item("x", "combinado", 5),
]);
verifica("quatro motivos viram uma linha", quatro.length, 1);
verifica("vence o motivo mais caro de furar", quatro[0].motivo, "combinado");

// A ordem entre pessoas é por MOTIVO primeiro, atraso depois. Um follow-up
// de 90 dias não passa na frente de um combinado de hoje: furar o que foi
// prometido custa a confiança inteira; a régua é palpite do sistema.
const ordem = montarFila([
  item("a", "followup", 90), item("b", "combinado", 0), item("c", "recompra", 200),
]);
verifica("motivo manda na ordem, não o atraso", ordem.map((i) => i.motivo), ["combinado", "followup", "recompra"]);
verifica("peso do combinado é o menor", PESO.combinado < PESO.renovacao, true);

// ---------------------------------------------- A FILA INTEIRA, COM QUITAÇÃO

const STAGES = [
  { key: "convertido", label: "Matriculado", won: true },
  { key: "recusou", label: "Disse não", terminal: true, lost: true },
];
const DEPS_VAZIAS = {
  stagesForaDeJogo: (s) => new Set(s.filter((x) => x.terminal || x.lost).map((x) => x.key)),
  stagesWithoutRecurrence: (s) => new Set(s.filter((x) => (x.terminal && !x.won) || x.lost).map((x) => x.key)),
  computeRenovacoes: () => [],
  computeDueTouches: () => [],
  computeDue: () => [],
};
const pessoa = (over) => ({
  id: "p1", name: "Ana Alicie", phone: "51999999999", owner_id: "m1",
  journey_stage: "convertido", stage_entered_at: "2026-07-10",
  next_action_at: "2026-07-12", next_action_note: "Acompanhar primeiros treinos",
  contract_end: "2027-01-09", ...over,
});
const fila = (contato, ultimo) => construirFila({
  contatos: [contato], ultimoContato: ultimo, stages: STAGES, cadences: [],
  recurrence: null, hojeISO: "2026-08-10", deps: DEPS_VAZIAS,
});

// O bug ao vivo: sem histórico posterior, ela fica na fila 29 dias depois.
// Isso é o comportamento CERTO — o combinado realmente não foi cumprido.
verifica("combinado vencido sem conversa continua na fila", fila(pessoa(), {}).length, 1);
verifica("o motivo vem escrito, com a nota do vendedor", fila(pessoa(), {})[0].intencao,
  "Retomar o que ficou combinado: Acompanhar primeiros treinos");

// E o bug de verdade: com a conversa registrada, ela SAI. Antes desta regra,
// esta linha devolvia 1 — para sempre.
verifica("combinado quitado pela conversa some da fila",
  fila(pessoa(), { p1: "2026-08-10T14:57:11Z" }).length, 0);

// Etapa de perda não entra: quem disse não não recebe cobrança de combinado.
verifica("etapa terminal de perda não entra na fila",
  fila(pessoa({ journey_stage: "recusou" }), {}).length, 0);

// Combinado no futuro não é pendência — é agenda.
verifica("combinado no futuro não aparece hoje",
  fila(pessoa({ next_action_at: "2026-09-01" }), {}).length, 0);

console.log(falhas === 0 ? "\nOK — 14/14" : `\nFALHOU — ${falhas} de 14`);
process.exit(falhas === 0 ? 0 : 1);
