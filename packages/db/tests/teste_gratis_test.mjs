// O TESTE GRÁTIS — avisos em 7, 3 e 1 dia, e a trava no fim.
//
// POR QUE ISTO PRECISA DE TESTE
// Aviso que não aparece se parece exatamente com aviso que ainda não chegou a
// hora: a tela funciona, ninguém vê erro, e a pessoa só descobre que o teste
// acabou quando a IA para. Aí ela não negocia — some. A decisão do fundador
// foi travar no fim, e travar sem avisar é a pior combinação possível.
//
// Roda sem banco e com relógio de mentira.

import { estadoDoTeste, moduloLiberado, DIAS_DE_TESTE, AVISOS } from "../../../apps/web/lib/teste.ts";

let passou = 0;
const falhas = [];
const eq = (nome, obtido, esperado) => {
  const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
  if (a === b) passou++;
  else falhas.push(`${nome}\n    esperado: ${b}\n    obtido:   ${a}`);
};
const verdade = (nome, cond) => { if (cond) passou++; else falhas.push(nome); };

const AGORA = new Date("2026-08-08T12:00:00Z");
const emDias = (d) => new Date(AGORA.getTime() + d * 86400000);

// ---------------------------------------------------------------------
// 1. As fases
// ---------------------------------------------------------------------
eq("sem data de fim: não há teste", estadoDoTeste(null, AGORA).fase, "sem_teste");
eq("data inválida não explode", estadoDoTeste("banana", AGORA).fase, "sem_teste");

eq("faltando 30 dias: tranquilo", estadoDoTeste(emDias(30), AGORA).fase, "tranquilo");
eq("faltando 8 dias: ainda tranquilo", estadoDoTeste(emDias(8), AGORA).fase, "tranquilo");

// O primeiro aviso é em 7 — e "faltam 7" ainda NÃO avisa, porque a janela é
// "faltam menos de 7". Avisar em 7 e em 6 seria o mesmo aviso duas vezes.
eq("faltando 6,5 dias: começa a avisar", estadoDoTeste(emDias(6.5), AGORA).fase, "avisando");
eq("faltando 2 dias: avisando", estadoDoTeste(emDias(2), AGORA).fase, "avisando");
eq("faltando 12 horas: avisando", estadoDoTeste(emDias(0.5), AGORA).fase, "avisando");

eq("já passou: encerrado", estadoDoTeste(emDias(-1), AGORA).fase, "encerrado");
eq("passou agora mesmo: encerrado", estadoDoTeste(new Date(AGORA.getTime() - 1000), AGORA).fase, "encerrado");

// ---------------------------------------------------------------------
// 2. A CONTAGEM. Arredondar para cima faria o aviso de "último dia" aparecer
// no penúltimo, e o de "acabou" chegar com a IA ainda funcionando — o aviso
// perde a credibilidade e ninguém age no dia certo.
// ---------------------------------------------------------------------
eq("30 horas restantes = 1 dia", estadoDoTeste(emDias(1.25), AGORA).diasRestantes, 1);
eq("47 horas restantes = 1 dia", estadoDoTeste(emDias(1.95), AGORA).diasRestantes, 1);
eq("2 dias exatos = 2 dias", estadoDoTeste(emDias(2), AGORA).diasRestantes, 2);
eq("6 horas restantes = 0 dias", estadoDoTeste(emDias(0.25), AGORA).diasRestantes, 0);

// ---------------------------------------------------------------------
// 3. O texto e a urgência
// ---------------------------------------------------------------------
const ultimo = estadoDoTeste(emDias(0.25), AGORA);
verdade("último dia é urgente", ultimo.urgente === true);
verdade('último dia diz "Hoje é o último dia"', ultimo.texto.startsWith("Hoje é o último dia"));

const doisDias = estadoDoTeste(emDias(2), AGORA);
verdade("faltando 2 dias ainda não é urgente", doisDias.urgente === false);
verdade("plural correto com 2 dias", doisDias.texto.startsWith("Faltam 2 dias"));

const umDia = estadoDoTeste(emDias(1.5), AGORA);
verdade("singular correto com 1 dia", umDia.texto.startsWith("Falta 1 dia"));

// O TEXTO DO FIM PRECISA DIZER QUE O DADO FICA. É a diferença entre "perdi
// tudo" e "preciso contratar" na cabeça de quem lê — e a primeira faz a pessoa
// nunca mais voltar.
const fim = estadoDoTeste(emDias(-3), AGORA);
verdade("o aviso de fim promete que os dados continuam",
  /dados/i.test(fim.texto) && /continuam/i.test(fim.texto));
verdade("e diz o que parou (a IA)", /IA/.test(fim.texto));
eq("conta há quantos dias acabou", fim.diasAtras, 3);

// ---------------------------------------------------------------------
// 4. O CURSO NO TESTE — só o módulo 1 (decisão do fundador)
//
// A regra é por ORDEM, não por chave: amarrar em "modulo_1" faria a liberação
// depender do nome, e renomear um módulo mudaria em silêncio o que é grátis.
// ---------------------------------------------------------------------
const emTeste = { emTeste: true, cursoComprado: false };
const comprado = { emTeste: false, cursoComprado: true };
const nada = { emTeste: false, cursoComprado: false };

verdade("módulo 1 abre no teste", moduloLiberado(1, emTeste));
verdade("módulo 2 NÃO abre no teste", !moduloLiberado(2, emTeste));
verdade("módulo 9 NÃO abre no teste", !moduloLiberado(9, emTeste));

verdade("quem comprou vê o módulo 1", moduloLiberado(1, comprado));
verdade("quem comprou vê o módulo 9", moduloLiberado(9, comprado));

verdade("teste acabado e sem compra: módulo 1 fecha", !moduloLiberado(1, nada));
verdade("teste acabado e sem compra: módulo 9 fecha", !moduloLiberado(9, nada));

// Comprado vence teste — quem pagou não pode perder acesso porque o teste
// expirou no mesmo dia.
verdade("comprado vence o teste expirado",
  moduloLiberado(5, { emTeste: false, cursoComprado: true }));

// ---------------------------------------------------------------------
// 5. Os números combinados
// ---------------------------------------------------------------------
eq("o teste dura 30 dias", DIAS_DE_TESTE, 30);
eq("os avisos são 7, 3 e 1", [...AVISOS], [7, 3, 1]);

// ---------------------------------------------------------------------
const total = passou + falhas.length;
if (falhas.length) {
  console.error(`\n✗ FALHOU — ${passou}/${total}\n`);
  for (const f of falhas) console.error(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`\n✓ PASSOU — ${passou}/${total}`);
