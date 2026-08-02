/**
 * A regra da repescagem espaçada, testada com relógio de mentira.
 *
 * POR QUE EXISTE: o erro típico de espaçamento é o intervalo que nunca vence
 * — e ele se parece exatamente com "ainda não chegou a hora". A tela continua
 * funcionando, ninguém vê nada errado, e a segunda metade do método
 * (prática distribuída) simplesmente não acontece. Só teste com data
 * controlada pega isso.
 *
 * Não precisa de banco: `lib/repescagem.ts` é lógica pura, sem imports.
 * O Node 22+ lê TypeScript direto, então o teste importa o arquivo do app —
 * nada de cópia que pode divergir.
 *
 *   node packages/db/tests/repescagem_test.mjs
 *
 * ESPERADO: 13/13.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { agendar, escolherRepescagem, INTERVALOS_DIAS, TAMANHO_SESSAO } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/repescagem.ts")).href
);

const DIA = 86_400_000;
const AGORA = new Date("2026-08-10T09:00:00.000Z");
const dias = (n) => new Date(AGORA.getTime() + n * DIA).toISOString();

let ok = 0;
let falhou = 0;
function verifica(nome, obtido, esperado) {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a === b) {
    ok++;
    console.log(`✓ ${nome}`);
  } else {
    falhou++;
    console.log(`✗ ${nome}\n    esperado: ${b}\n    obtido:   ${a}`);
  }
}

// ---------------------------------------------------------------------
// 1. AGENDAMENTO — o intervalo cresce a cada acerto e zera no erro.
// ---------------------------------------------------------------------

// Primeiro acerto: streak 1, volta em 2 dias.
verifica("acerto do zero → streak 1, +2 dias", agendar(0, true, AGORA), {
  streak: 1,
  due_at: dias(2),
});

// Segundo acerto seguido: streak 2, volta em 5 dias.
verifica("segundo acerto → streak 2, +5 dias", agendar(1, true, AGORA), {
  streak: 2,
  due_at: dias(5),
});

// Quarto acerto: chega no último degrau, 30 dias.
verifica("quarto acerto → streak 4, +30 dias", agendar(3, true, AGORA), {
  streak: 4,
  due_at: dias(30),
});

// Acima do último degrau o intervalo NÃO cresce mais: fica em 30 dias.
// Sem esse teto, a nona repescagem cairia fora da vida útil do curso.
verifica("acerto acima do teto → continua 30 dias", agendar(8, true, AGORA), {
  streak: 9,
  due_at: dias(30),
});

// Errar zera o streak e traz de volta amanhã.
verifica("erro com streak alto → zera e volta em 1 dia", agendar(4, false, AGORA), {
  streak: 0,
  due_at: dias(1),
});

verifica("degraus declarados", INTERVALOS_DIAS, [2, 5, 12, 30]);

// ---------------------------------------------------------------------
// 2. SELEÇÃO — o que entra na sessão de hoje.
// ---------------------------------------------------------------------
const c = (over) => ({
  question_id: "q",
  lesson_key: "m1_l1",
  ordem: 1,
  errou_na_licao: false,
  concluida_em: dias(-30),
  due_at: null,
  streak: 0,
  ...over,
});

const chaves = (lista) => lista.map((x) => x.question_id);

// Lição concluída HOJE não é repescada: repescar no mesmo dia é repetir, não
// espaçar. É o teste que garante que a carência existe.
verifica(
  "lição concluída hoje não entra",
  chaves(escolherRepescagem([c({ question_id: "recem", concluida_em: dias(0) })], AGORA)),
  [],
);

// Concluída há 3 dias entra (carência é 2).
verifica(
  "concluída há 3 dias entra",
  chaves(escolherRepescagem([c({ question_id: "madura", concluida_em: dias(-3) })], AGORA)),
  ["madura"],
);

// Agendada para o futuro NÃO entra, mesmo tendo sido errada na lição.
verifica(
  "agendada para o futuro fica fora",
  chaves(
    escolherRepescagem(
      [c({ question_id: "futura", due_at: dias(3), errou_na_licao: true })],
      AGORA,
    ),
  ),
  [],
);

// Prioridade: vencidas primeiro (a mais atrasada na frente), depois as nunca
// revisadas com erro, depois as nunca revisadas com acerto.
verifica(
  "ordem de prioridade",
  chaves(
    escolherRepescagem(
      [
        c({ question_id: "nunca_acertou", lesson_key: "a", ordem: 1 }),
        c({ question_id: "nunca_errou", lesson_key: "b", ordem: 2, errou_na_licao: true }),
        c({ question_id: "vencida_ontem", lesson_key: "c", ordem: 3, due_at: dias(-1) }),
        c({ question_id: "vencida_ha_10", lesson_key: "d", ordem: 4, due_at: dias(-10) }),
      ],
      AGORA,
    ),
  ),
  ["vencida_ha_10", "vencida_ontem", "nunca_errou", "nunca_acertou"],
);

// Sessão curta: no máximo 5. E no máximo 2 por lição enquanto houver material
// de outras — ler três perguntas seguidas da mesma aula vira reconhecimento de
// contexto, não recuperação.
const muitas = [];
for (let i = 0; i < 4; i++) muitas.push(c({ question_id: `x${i}`, lesson_key: "mesma", ordem: i }));
for (let i = 0; i < 4; i++) muitas.push(c({ question_id: `y${i}`, lesson_key: `outra${i}`, ordem: 10 + i }));
const sessao = escolherRepescagem(muitas, AGORA);
verifica("sessão tem no máximo 5", sessao.length, TAMANHO_SESSAO);
verifica(
  "no máximo 2 da mesma lição quando há alternativa",
  sessao.filter((x) => x.lesson_key === "mesma").length,
  2,
);

// Mas a trava por lição CEDE quando não há alternativa: sessão de duas
// perguntas porque só existe uma lição feita não é prática, é frustração.
verifica(
  "trava cede quando só existe uma lição",
  escolherRepescagem(
    [0, 1, 2, 3, 4, 5].map((i) => c({ question_id: `z${i}`, lesson_key: "unica", ordem: i })),
    AGORA,
  ).length,
  TAMANHO_SESSAO,
);

console.log(falhou ? `\n✗ FALHOU — ${ok}/${ok + falhou}` : `\n✓ PASSOU — ${ok}/${ok}`);
process.exitCode = falhou ? 1 : 0;
