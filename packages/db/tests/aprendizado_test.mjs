/**
 * O QUE FUNCIONA AQUI — a medição que fecha o ciclo. Sem banco e sem chave.
 *
 * ⚠ ESTE TESTE EXISTE PARA GARANTIR QUE O SISTEMA CONTINUE DIZENDO "NÃO SEI".
 *
 * A maioria dos testes deste repositório guarda um comportamento. Este guarda
 * um SILÊNCIO, que é mais fácil de perder: basta alguém achar que uma tabela
 * bonita é melhor que um aviso de amostra pequena.
 *
 * O caso que originou tudo está nos 854 desfechos do piloto. Contando
 * fechamento puro:
 *
 *   challenger .............. 14 usos, 1 ganhou → 7,1%  ← "campeã"
 *   negociacao_voss ......... 55 usos, 0 ganhou → 0,0%  ← "inútil"
 *
 * Challenger lideraria com UM fechamento. Voss seria aposentada — sendo
 * escola de negociação, etapa que pouca gente alcança. É o mesmo erro que o
 * fundador derrubou em ago/2026, quando Cialdini "liderou" com 1 fechamento
 * em 53 pessoas, e a regra que ficou escrita foi: **segmentar por origem e
 * declarar o n antes de qualquer leitura.**
 *
 * ESPERADO: 16/16.
 *
 *   node packages/db/tests/aprendizado_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { medir, porOrigem, deveExplorar, notaParaOMotor, N_MINIMO_ESCOLA, EXPLORACAO_MINIMA } =
  await import(pathToFileURL(path.join(ROOT, "apps/web/lib/aprendizado.ts")).href);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}

/** n eventos de uma escola, `s` deles com sucesso na métrica de resposta. */
const ev = (escolas, n, s, origem = "whatsapp") =>
  Array.from({ length: n }, (_, i) => ({
    escolas,
    desfecho: i < s ? "respondeu" : "perdeu_silencio",
    origem,
    etapa: "contato",
  }));

// ------------------------------------------------- O SILÊNCIO ABAIXO DO PISO

// O caso Challenger: 14 usos, taxa altíssima. NÃO pode virar número.
const poucos = medir(ev(["challenger"], 14, 13), "resposta");
const ch = poucos.escolas.find((e) => e.escola === "challenger");
verifica("escola com 14 usos não sustenta", ch.sustenta, false);
verifica("e a taxa dela é null, não zero", ch.taxa, null);
verifica("e ela não se compara com a base", ch.contraBase, "nao_sei");
verifica("a leitura avisa que a amostra é pequena", poucos.aviso !== null, true);

// ⚠ null É DIFERENTE DE ZERO, e a distinção é a mais fácil de perder numa
// refatoração. O caso Voss (0 fechamentos em 55) mostra por quê: "0%" numa
// tela aposenta uma escola; "não sei" manda continuar usando.
const voss = medir(ev(["negociacao_voss"], 20, 0), "fechamento").escolas[0];
verifica("zero sucesso com amostra pequena também é null", voss.taxa, null);

// ------------------------------------------------ O QUE O PISO DEIXA DIZER

// Recorte com volume: consultiva responde muito, cadência responde pouco —
// que é o padrão real do piloto (58% contra 17%).
const muitos = medir(
  [...ev(["consultiva_spin"], 200, 116), ...ev(["cadencia_blount"], 300, 51)],
  "resposta",
);
const spin = muitos.escolas.find((e) => e.escola === "consultiva_spin");
const blount = muitos.escolas.find((e) => e.escola === "cadencia_blount");
verifica("com 200 usos, sustenta", spin.sustenta, true);
verifica("consultiva fica acima da base", spin.contraBase, "acima");
verifica("cadência fica abaixo da base", blount.contraBase, "abaixo");
verifica("sem aviso quando a amostra sustenta", muitos.aviso, null);

// ⚠ DIFERENÇA NÃO É DIFERENÇA SE OS INTERVALOS SE TOCAM.
// 52% e 55% com n=100 cada têm margem de ~10 pontos: é o mesmo número dito
// duas vezes. Chamar isso de pódio é o folclore que o produto existe para não
// repetir.
const empate = medir(
  [...ev(["a"], 100, 52), ...ev(["b"], 100, 55)],
  "resposta",
);
verifica("taxas parecidas ficam indistintas, não viram pódio",
  empate.escolas.map((e) => e.contraBase), ["indistinto", "indistinto"]);

// A ORDEM É POR USO, NÃO POR TAXA. A primeira linha de uma lista é lida como
// recomendação, esteja escrito o que estiver ao lado.
verifica("ordena por volume, não por desempenho",
  muitos.escolas.map((e) => e.escola), ["cadencia_blount", "consultiva_spin"]);

// ------------------------------------------------------ ORIGEM NÃO SE SOMA

// A regra do fundador (ago/2026): convênio tem 15% de perda contra 46% do
// WhatsApp — ele não está comprando, está usando um benefício já pago.
const mistura = [...ev(["x"], 40, 34, "convenio"), ...ev(["x"], 40, 18, "whatsapp")];
const grupos = porOrigem(mistura);
verifica("separa por origem", [...grupos.keys()].sort(), ["convenio", "whatsapp"]);
verifica("e as taxas separadas são MESMO diferentes",
  [
    Math.round(medir(grupos.get("convenio"), "resposta").base.taxa * 100),
    Math.round(medir(grupos.get("whatsapp"), "resposta").base.taxa * 100),
  ],
  [85, 45]);

// ------------------------------------------------------------- O CAÇA-NÍQUEIS

// Sem amostra, explora quase sempre — senão o dado sobre a alternativa nunca
// nasce.
verifica("alternativa nunca usada é quase sempre explorada", deveExplorar(0, 0.5), true);
// Com amostra suficiente, a exploração cai para o mínimo — mas NUNCA zera:
// mercado muda, e verdade medida em março pode ser mentira em novembro.
verifica("alternativa já medida explora só no mínimo",
  [deveExplorar(N_MINIMO_ESCOLA, EXPLORACAO_MINIMA - 0.01), deveExplorar(N_MINIMO_ESCOLA, 0.5)],
  [true, false]);

// ------------------------------------------------------- A NOTA PARA O MOTOR

// Nada dizível → nada vai para o prompt. `null` é a resposta certa na maior
// parte dos casos, e mandar "não sei" para dentro do prompt seria ruído.
verifica("sem sinal, não acrescenta nada ao prompt", notaParaOMotor(poucos), null);

// Com sinal, vai — e vai MARCADO como observação, nunca como instrução.
const nota = notaParaOMotor(muitos);
verifica("com sinal, a nota se declara observação e não instrução",
  nota.includes("observação, não instrução"), true);

console.log(falhas === 0 ? "\nOK — 16/16" : `\nFALHOU — ${falhas} de 16`);
process.exit(falhas === 0 ? 0 : 1);
