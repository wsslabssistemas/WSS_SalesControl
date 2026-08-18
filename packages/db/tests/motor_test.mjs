/**
 * O MOTOR PROATIVO — as regras anti-bloqueio finalmente sendo obedecidas.
 *
 * ⚠ POR QUE ESTE TESTE EXISTE.
 *
 * As seis regras da tela de Automação (`max_per_day`, `min_hours_between`,
 * `max_no_reply`, `cooldown_hours`, a janela de horário e `stop_after_days`)
 * eram gravadas desde que a tela nasceu e **nenhuma linha do sistema as lia**.
 * Um formulário que salva e ninguém cumpre promete um freio que não existe.
 *
 * E regra de horário testada "rodando e vendo" não vale nada: o defeito típico
 * é a janela que nunca abre, e ela se parece exatamente com "não havia nada
 * para enviar". Por isso o relógio é injetado.
 *
 * Valor esperado escrito no arquivo.
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { planejar, dentroDaJanela } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/motor.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "  ok" : "FALHA"}  ${nome}`);
  if (!ok) console.log(`        esperado: ${JSON.stringify(esperado)}\n        obtido:   ${JSON.stringify(obtido)}`);
}

const REGRAS = {
  mode: "auto", max_per_day: 30, min_hours_between: 24, max_no_reply: 3,
  cooldown_hours: 48, window_start: 9, window_end: 19, stop_after_days: 14,
};

const livre = (id) => ({
  contactId: id, motivo: "reativacao",
  horasDesdeUltimoContato: null, semResposta: 0,
  diasSemEngajamento: null, horasDesdeRespostaDele: null,
});

const plano = (over = {}, cands = [livre("a")], enviadosHoje = 0, horaLocal = 10) =>
  planejar({ candidatos: cands, regras: { ...REGRAS, ...over }, enviadosHoje, horaLocal });

// ---------------------------------------------------------------------
// 1. A JANELA DE HORÁRIO — e o caso que devolveria SEMPRE falso
// ---------------------------------------------------------------------

verifica("janela normal: 10h está dentro de 9–19", dentroDaJanela(10, 9, 19), true);
verifica("janela normal: 20h está fora", dentroDaJanela(20, 9, 19), false);
verifica("o fim é exclusivo: 19h já está fora", dentroDaJanela(19, 9, 19), false);

// ⚠ O CASO QUE UMA COMPARAÇÃO INGÊNUA QUEBRA. `h >= 22 && h < 6` é sempre
// falso — a automação nunca rodaria, e "não enviou nada" se parece com "não
// havia nada para enviar".
verifica("janela que vira a meia-noite: 23h está dentro de 22–6", dentroDaJanela(23, 22, 6), true);
verifica("janela que vira a meia-noite: 3h está dentro de 22–6", dentroDaJanela(3, 22, 6), true);
verifica("janela que vira a meia-noite: 12h está fora de 22–6", dentroDaJanela(12, 22, 6), false);

// Início igual ao fim = 24 horas. A leitura alternativa ("zero horas") é a
// errada: quem digita o mesmo número duas vezes quer "sempre", e "nunca" é
// silencioso.
verifica("início igual ao fim significa o dia inteiro", dentroDaJanela(3, 9, 9), true);

// Esperado: inativo, e o motivo diz a hora. Bloqueio sem motivo legível é o
// que faz alguém concluir que o sistema quebrou.
verifica("fora da janela o motor não envia", plano({}, [livre("a")], 0, 22).ativo, false);
verifica("e o motivo diz a hora", plano({}, [livre("a")], 0, 22).porque.includes("22h"), true);

// ---------------------------------------------------------------------
// 2. O MODO
// ---------------------------------------------------------------------

verifica("desligado não envia nada", plano({ mode: "off" }).enviar.length, 0);
verifica("e diz que está desligado", plano({ mode: "off" }).porque, "A automação está desligada.");

// Simulação PLANEJA igual e marca `simulado`. Quem não envia é o executor —
// se a decisão mudasse aqui, a simulação estaria calibrando outra coisa.
verifica("simulação planeja igual ao automático", plano({ mode: "simulation" }).enviar, ["a"]);
verifica("e vem marcada como simulada", plano({ mode: "simulation" }).simulado, true);

// ---------------------------------------------------------------------
// 3. O TETO DO DIA
// ---------------------------------------------------------------------

// Esperado: 2 enviados de 5 candidatos, porque já saíram 28 de 30.
verifica(
  "o teto do dia corta a lista",
  plano({}, ["a", "b", "c", "d", "e"].map(livre), 28).enviar,
  ["a", "b"],
);

// ⚠ Esperado: "amanhã" no motivo, não "bloqueado". São coisas diferentes para
// quem lê a tela.
verifica(
  "quem sobra do teto fica para amanhã, e o texto diz isso",
  plano({}, ["a", "b", "c"].map(livre), 29).vereditos.find((v) => v.contactId === "b")?.motivo.includes("amanhã"),
  true,
);

verifica("teto já estourado não envia ninguém", plano({}, [livre("a")], 30).enviar.length, 0);

// ---------------------------------------------------------------------
// 4. AS QUATRO REGRAS POR PESSOA
// ---------------------------------------------------------------------

// Esperado: barrado. Insistir com quem nunca dá sinal é o padrão que faz o
// WhatsApp marcar a conta.
verifica(
  "parou de engajar há mais que o limite: barrado",
  plano({}, [{ ...livre("a"), diasSemEngajamento: 20 }]).enviar.length,
  0,
);

// ⚠ Esperado: PASSA. "Nunca engajou" é diferente de "parou de engajar" — o
// ex-aluno importado nunca respondeu por aqui, e vetá-lo esvaziaria a
// reativação inteira, que é o motivo de o motor existir.
verifica(
  "quem NUNCA engajou não é barrado por stop_after_days",
  plano({}, [{ ...livre("a"), diasSemEngajamento: null }]).enviar,
  ["a"],
);

verifica(
  "mensagens demais sem resposta: barrado",
  plano({}, [{ ...livre("a"), semResposta: 3 }]).enviar.length,
  0,
);

// ⚠ Esperado: barrado. Quem acabou de responder está sendo atendido por uma
// PESSOA — toque proativo em cima disso é o sistema atropelando o vendedor no
// meio da conversa.
verifica(
  "respondeu há pouco: cooldown segura",
  plano({}, [{ ...livre("a"), horasDesdeRespostaDele: 2 }]).enviar.length,
  0,
);
verifica(
  "passado o cooldown, libera",
  plano({}, [{ ...livre("a"), horasDesdeRespostaDele: 50 }]).enviar,
  ["a"],
);

verifica(
  "falamos há menos que o intervalo mínimo: barrado",
  plano({}, [{ ...livre("a"), horasDesdeUltimoContato: 3 }]).enviar.length,
  0,
);

// Zero desliga a regra, em vez de barrar todo mundo. Regra que barra tudo
// quando está zerada é a que ninguém entende por que parou.
verifica(
  "limite zero desliga a regra em vez de barrar tudo",
  plano({ min_hours_between: 0, max_no_reply: 0, cooldown_hours: 0, stop_after_days: 0 },
    [{ contactId: "a", motivo: "reativacao", horasDesdeUltimoContato: 0, semResposta: 99, diasSemEngajamento: 999, horasDesdeRespostaDele: 0 }]).enviar,
  ["a"],
);

// ---------------------------------------------------------------------
// 5. TODO MUNDO TEM VEREDITO — nada sai da lista em silêncio
// ---------------------------------------------------------------------

// ⚠ Esperado: 3 vereditos para 3 candidatos. Sumir da lista sem explicação é
// o defeito da casa: a fila só fica menor e ninguém sabe por quê.
const p5 = plano({}, [
  livre("a"),
  { ...livre("b"), semResposta: 5 },
  { ...livre("c"), horasDesdeUltimoContato: 1 },
]);
verifica("cada candidato tem um veredito", p5.vereditos.length, 3);
verifica("só um sai", p5.enviar, ["a"]);
verifica("e os dois barrados têm motivo escrito",
  p5.vereditos.filter((v) => !v.enviar && v.motivo.length > 10).length, 2);

console.log(falhas === 0 ? "\nmotor: tudo certo." : `\nmotor: ${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
