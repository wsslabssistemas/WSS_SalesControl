// TURNO EM VEZ DE HORA — o teste da regra que decide o que o motor oferece.
//
// POR QUE ISTO PRECISA DE TESTE
// O defeito que originou o turno não quebrava nada: com a janela da academia
// (06:30 às 22:00), `escolherOpcoes` devolvia a primeira vaga de cada dia —
// 06:30, 06:30, 06:30 — e o motor oferecia isso com toda a confiança. Não há
// erro em lugar nenhum, o sistema "funciona", e só um humano lendo a resposta
// percebe que ninguém quer começar academia às seis e meia da manhã.
//
// Defeito que não levanta exceção só é pego por valor esperado escrito.
//
// Roda sem banco: a regra é função pura, e o relógio é de mentira.

import { escolherOpcoes, descreverVaga, turnoDe } from "../../../apps/web/lib/scheduling.ts";

let passou = 0;
const falhas = [];

function eq(nome, obtido, esperado) {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a === b) passou++;
  else falhas.push(`${nome}\n    esperado: ${b}\n    obtido:   ${a}`);
}

/** Vagas de hora em hora dentro da janela, como `calcularVagas` produz. */
function vagasDoDia(ano, mes, dia, deHora, ateHora) {
  const v = [];
  for (let h = deHora; h < ateHora; h++) {
    const inicio = new Date(ano, mes - 1, dia, h, 0, 0, 0);
    v.push({ inicio, fim: new Date(inicio.getTime() + 3600000), membershipId: null });
  }
  return v;
}

// ---------------------------------------------------------------------
// 1. O corte dos turnos
// ---------------------------------------------------------------------
eq("06:30 é manhã", turnoDe(new Date(2026, 7, 13, 6, 30)).chave, "manha");
eq("11:59 ainda é manhã", turnoDe(new Date(2026, 7, 13, 11, 59)).chave, "manha");
eq("12:00 já é tarde", turnoDe(new Date(2026, 7, 13, 12, 0)).chave, "tarde");
eq("17:59 ainda é tarde", turnoDe(new Date(2026, 7, 13, 17, 59)).chave, "tarde");
eq("18:00 já é noite", turnoDe(new Date(2026, 7, 13, 18, 0)).chave, "noite");
eq("21:00 é noite", turnoDe(new Date(2026, 7, 13, 21, 0)).chave, "noite");

// ---------------------------------------------------------------------
// 2. O DEFEITO ORIGINAL, reproduzido
//
// Três dias da janela da Be Fitness. Sem turno, as três opções são 6h30 nos
// três dias — literalmente o que o fundador ia ver na tela.
// ---------------------------------------------------------------------
const jan = [
  ...vagasDoDia(2026, 8, 13, 6, 22), // quinta
  ...vagasDoDia(2026, 8, 14, 6, 22), // sexta
  ...vagasDoDia(2026, 8, 15, 9, 13), // sábado 09:00–13:00
];

eq(
  "sem turno: o defeito — a mesma hora nos três dias",
  escolherOpcoes(jan, 3, false).map((v) => descreverVaga(v, false)),
  ["quinta, 13/08 às 6h", "sexta, 14/08 às 6h", "sábado, 15/08 às 9h"],
);

eq(
  "com turno: três opções, três dias, sem prometer hora",
  escolherOpcoes(jan, 3, true).map((v) => descreverVaga(v, true)),
  ["quinta, 13/08 de manhã", "sexta, 14/08 de manhã", "sábado, 15/08 de manhã"],
);

// ---------------------------------------------------------------------
// 3. Variar o DIA vem antes de variar o turno
//
// A propriedade é sobre O CONJUNTO escolhido, não sobre a ordem em que ele
// aparece: com dois dias disponíveis e três vagas a oferecer, os dois dias
// TÊM que estar representados. Oferecer manhã, tarde e noite da mesma quinta
// esconde que sexta existe, e quem não pode quinta acha que não tem opção.
//
// A ordem de exibição é cronológica de propósito — é como a pessoa lê uma
// lista de datas. A primeira versão deste teste confundiu as duas coisas e
// exigia que a 1ª e a 2ª opção fossem de dias diferentes; isso media a
// ordenação, não a cobertura, e teria travado uma apresentação correta.
// ---------------------------------------------------------------------
const doisDias = [...vagasDoDia(2026, 8, 13, 6, 22), ...vagasDoDia(2026, 8, 14, 6, 22)];
const tres = escolherOpcoes(doisDias, 3, true);
eq("os dois dias disponíveis aparecem", new Set(tres.map((v) => v.inicio.getDate())).size, 2);
eq(
  "e são três opções distintas, em ordem cronológica",
  tres.map((v) => descreverVaga(v, true)),
  ["quinta, 13/08 de manhã", "quinta, 13/08 à tarde", "sexta, 14/08 de manhã"],
);
eq(
  "pedindo só duas, cada uma é de um dia",
  escolherOpcoes(doisDias, 2, true).map((v) => descreverVaga(v, true)),
  ["quinta, 13/08 de manhã", "sexta, 14/08 de manhã"],
);

// ---------------------------------------------------------------------
// 4. Um dia só: aí sim os três turnos daquele dia
// ---------------------------------------------------------------------
eq(
  "um dia só devolve os três turnos dele",
  escolherOpcoes(vagasDoDia(2026, 8, 13, 6, 22), 3, true).map((v) => descreverVaga(v, true)),
  ["quinta, 13/08 de manhã", "quinta, 13/08 à tarde", "quinta, 13/08 à noite"],
);

// ---------------------------------------------------------------------
// 5. Não inventar opção que não existe
//
// Sábado fecha 13h: não há turno da noite. O motor não pode oferecer três
// opções quando só existem duas — oferecer horário que não existe é o mesmo
// defeito que a trava anti-invenção evita no preço.
// ---------------------------------------------------------------------
const sabado = vagasDoDia(2026, 8, 15, 9, 13);
eq(
  "sábado curto: só os turnos que cabem na janela",
  escolherOpcoes(sabado, 3, true).map((v) => descreverVaga(v, true)),
  ["sábado, 15/08 de manhã", "sábado, 15/08 à tarde"],
);
eq("nenhuma vaga devolve lista vazia", escolherOpcoes([], 3, true), []);

// ---------------------------------------------------------------------
// 6. Quem agenda de verdade não foi afetado
//
// Barbearia continua com hora exata: lá a cadeira É disputada e a hora é o
// produto. Este caso existe para que ligar turno num segmento não desligue
// a hora no outro sem ninguém perceber.
// ---------------------------------------------------------------------
const barbearia = [
  { inicio: new Date(2026, 7, 13, 9, 0), fim: new Date(2026, 7, 13, 9, 40), membershipId: null },
  { inicio: new Date(2026, 7, 13, 9, 30), fim: new Date(2026, 7, 13, 10, 10), membershipId: null },
  { inicio: new Date(2026, 7, 14, 14, 0), fim: new Date(2026, 7, 14, 14, 40), membershipId: null },
];
eq(
  "sem turno a hora exata continua saindo, com minuto",
  escolherOpcoes(barbearia, 2, false).map((v) => descreverVaga(v, false)),
  ["quinta, 13/08 às 9h", "sexta, 14/08 às 14h"],
);
eq("minuto quebrado aparece", descreverVaga(new Date(2026, 7, 13, 9, 30), false), "quinta, 13/08 às 9h30");

// ---------------------------------------------------------------------
const total = passou + falhas.length;
if (falhas.length) {
  console.error(`\n✗ FALHOU — ${passou}/${total}\n`);
  for (const f of falhas) console.error(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`\n✓ PASSOU — ${passou}/${total}`);
