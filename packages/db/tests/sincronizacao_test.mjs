/**
 * A SINCRONIZAÇÃO COM A FONTE EXTERNA — sem banco e sem chave.
 *
 * ⚠ ESTE TESTE GUARDA DUAS COISAS: que a ausência vire histórico, e que ela
 * NÃO vire histórico quando a fonte não é confiável.
 *
 * O fundador viu o problema sozinho: *"toda vez que eu atualizar a aba
 * Matriculas, quem virou ex-cliente vai ser apagado, e o sistema perde o
 * histórico."* A saída não foi o sistema manter uma aba — foi ele COMPARAR a
 * foto de hoje com o que já sabia. Ausência é informação, e só o sistema
 * enxerga, porque só ele lembra do que havia antes.
 *
 * E a metade perigosa: se a planilha vier PARCIAL — filtro aplicado, aba
 * baixada pela metade — a mesma regra daria baixa em massa em quem continua
 * pagando. É a classe de defeito que já custou o curso inteiro aqui: o
 * `seed-curso.mjs` derrubou oito módulos ao lado **saindo com três ✓ verdes**,
 * porque o relatório só mostrava o que ele mesmo escrevera.
 *
 * ESPERADO: 20/20.
 *
 *   node packages/db/tests/sincronizacao_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { comparar, marcarPorCruzamento, LIMITE_DESAPARECIDOS } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/sincronizacao.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}
const tipoDe = (r, chave) => r.eventos.find((e) => e.chave === chave)?.tipo;

// Uma base de 20 ativos, para a proporção da trava ter sentido.
const ativos = (n, ate = "2026-12-31") =>
  Array.from({ length: n }, (_, i) => ({ chave: `c${i}`, nome: `Pessoa ${i}`, vigencia_ate: ate }));
const fonteDe = (b) => b.map(({ chave, nome, vigencia_ate }) => ({ chave, nome, vigencia_ate }));

// ------------------------------------------------------ O CASO MARIA ISABEL

// Vigência que ANDA PARA FRENTE é renovação OBSERVADA — fato, não dedução
// sobre dado velho. Sem isto ela seguiria como "venceu" para sempre.
const banco = [{ chave: "7386", nome: "Maria Isabel", vigencia_ate: "2026-08-10" }, ...ativos(19)];
const comRenovacao = [{ chave: "7386", nome: "Maria Isabel", vigencia_ate: "2027-02-10" }, ...fonteDe(ativos(19))];
const r1 = comparar(comRenovacao, banco);
verifica("vigência que anda para frente é renovação", tipoDe(r1, "7386"), "renovou");
verifica("e a renovação não bloqueia nada", r1.bloqueio, null);
verifica("quem não mudou não vira evento de mudança", tipoDe(r1, "c0"), "sem_mudanca");

// ⚠ VIGÊNCIA QUE ANDA PARA TRÁS NÃO É CANCELAMENTO. Quase sempre é erro de
// digitação ou exportação. Encurtar em silêncio colocaria gente na fila de
// renovação sem motivo — então vira evento para alguém olhar.
const r2 = comparar(
  [{ chave: "7386", vigencia_ate: "2026-06-01" }, ...fonteDe(ativos(19))],
  banco,
);
verifica("vigência encurtada vira aviso, não baixa", tipoDe(r2, "7386"), "vigencia_recuou");

// ------------------------------------ RENOVAÇÃO × AJUSTE DE DATA
//
// ⚠ ACHADO NA PRIMEIRA EXECUÇÃO CONTRA A PLANILHA REAL (13/ago).
//
// Das 7 vigências que andaram para frente na base da Be Fitness, **4 eram
// ajuste de data** — 6, 13, 20 e 21 dias: mudança de dia de cobrança, crédito
// de dias parados, correção de digitação. Só 3 eram renovação (183, 365 e 92
// dias, batendo com semestral, anual e trimestral).
//
// Tratar ajuste como renovação erra dos dois lados, e o segundo é o caro:
// mandaria "obrigado por renovar" a quem não renovou **e tiraria da fila de
// renovação alguém cujo contrato continua vencendo logo** — perdendo
// exatamente a receita que a fila existe para proteger.
const mudou = (de, para, ciclo) => comparar(
  [{ chave: "k", nome: "P", vigencia_ate: para, ciclo_dias: ciclo }],
  [{ chave: "k", nome: "P", vigencia_ate: de }],
).eventos[0].tipo;

// O caso Maria Isabel: semestral, +183 dias.
verifica("meio ciclo à frente é renovação", mudou("2026-08-10", "2027-02-09", 180), "renovou");
// O caso Michélle: +6 dias num plano anual.
verifica("seis dias num plano anual é ajuste", mudou("2027-05-03", "2027-05-09", 365), "ajuste_de_data");
// Mensal que anda 30 dias É renovação — por isso a régua é proporcional ao
// ciclo, e não um número fixo que trataria mensal e anual igual.
verifica("mensal que anda um mês é renovação", mudou("2026-08-01", "2026-08-31", 30), "renovou");
verifica("anual que anda um mês é ajuste", mudou("2026-08-01", "2026-08-31", 365), "ajuste_de_data");
// Sem ciclo declarado, vale o piso absoluto de 28 dias — abaixo do menor
// ciclo real que existe nos planos.
verifica("sem ciclo, o piso absoluto decide",
  [mudou("2026-08-01", "2026-08-20", null), mudou("2026-08-01", "2026-09-15", null)],
  ["ajuste_de_data", "renovou"]);

// --------------------------------------------------- AUSÊNCIA VIRA HISTÓRICO

// Um sumido em 20 ativos = 5%, abaixo do limite: aplica.
const r3 = comparar(fonteDe(ativos(20)).slice(0, 19), ativos(20));
verifica("quem sumiu da fonte encerrou", tipoDe(r3, "c19"), "encerrou");
verifica("um sumido não bloqueia", r3.bloqueio, null);
verifica("o resumo conta o encerramento", r3.resumo.encerraram, 1);

// Quem estava baixado e voltou não é gente nova — é retorno, e a diferença é
// o histórico que o fundador quer manter.
const r4 = comparar(
  [{ chave: "x", nome: "Voltou", vigencia_ate: "2027-01-01" }],
  [{ chave: "x", nome: "Voltou", vigencia_ate: "2026-01-01", encerrado: true }],
);
verifica("quem estava baixado e voltou é reaparecimento", tipoDe(r4, "x"), "reapareceu");

// Quem nunca existiu é entrada.
verifica("quem não existia entrou",
  tipoDe(comparar([{ chave: "novo" }], []), "novo"), "entrou");

// ------------------------------------------------------- A TRAVA DA PARCIAL

// ⚠ O CASO QUE ESTA TRAVA EXISTE PARA IMPEDIR: planilha com filtro aplicado.
// 5 de 20 sumidos = 25%, acima dos 15%. Nada pode ser aplicado.
const parcial = comparar(fonteDe(ativos(20)).slice(0, 15), ativos(20));
verifica("planilha parcial BLOQUEIA", parcial.bloqueio !== null, true);
verifica("e a mensagem diz que nada foi gravado",
  parcial.bloqueio.includes("nada foi gravado"), true);
// Os eventos continuam sendo devolvidos — para o humano VER o que teria
// acontecido. Bloquear e esconder seria pedir para alguém desligar a trava.
verifica("mas os eventos continuam visíveis para conferência",
  parcial.eventos.filter((e) => e.tipo === "encerrou").length, 5);

// Fonte VAZIA é o caso extremo e tem mensagem própria: 100% sumiriam.
const vazia = comparar([], ativos(20));
verifica("fonte vazia bloqueia com aviso próprio",
  vazia.bloqueio.includes("veio VAZIA"), true);

// E a trava é por PROPORÇÃO: 5 sumidos em 200 ativos é 2,5% e passa. O mesmo
// número absoluto que bloqueia numa base pequena é rotina numa base grande.
verifica("a trava é proporcional, não absoluta",
  comparar(fonteDe(ativos(200)).slice(0, 195), ativos(200)).bloqueio, null);
verifica("o limite é 15%", LIMITE_DESAPARECIDOS, 0.15);

// ------------------------------------------- CRUZAMENTO DAS ABAS DE CONVÊNIO

// O fundador recusou manter uma coluna à mão — "vai ter que ser manual, então
// sem chances" — e estava certo: trabalho manual recorrente para de acontecer,
// e aí o dado fica errado em silêncio. O sistema deriva.
const cruz = marcarPorCruzamento(
  [{ chave: "a" }, { chave: "b" }, { chave: "c" }],
  [{ marcacao: "wellhub", linhas: [{ chave: "a" }, { chave: "zzz" }] },
   { marcacao: "totalpass", linhas: [{ chave: "b" }] }],
);
verifica("a marcação é derivada do cruzamento",
  cruz.linhas.map((l) => [l.chave, l.marcacoes ?? []]),
  [["a", ["wellhub"]], ["b", ["totalpass"]], ["c", []]]);
// Órfão é informação: quem está na aba do convênio e não na base significa que
// as abas divergiram — e é exatamente isso que se quer ver.
verifica("quem está no convênio e não na base vira órfão, não some",
  cruz.orfaos, [{ marcacao: "wellhub", chaves: ["zzz"] }]);

console.log(falhas === 0 ? "\nOK — 20/20" : `\nFALHOU — ${falhas} de 20`);
process.exit(falhas === 0 ? 0 : 1);
