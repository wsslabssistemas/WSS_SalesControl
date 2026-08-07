/**
 * A COTA DE IA, medida sem banco e sem chave.
 *
 * Por que existe teste aqui: esta é a única peça do sistema cujo defeito
 * aparece como CONTA no fim do mês, não como tela quebrada. Cota que não
 * bloqueia se parece exatamente com cota que bloqueia — os dois casos mostram a
 * resposta na tela — e a diferença só é visível no extrato do fundador.
 *
 * A regra do documento, em uma frase: nenhuma empresa pode gastar mais token do
 * que o fundador decidiu, e o produto NUNCA para de funcionar quando o teto é
 * atingido.
 *
 * ESPERADO: 23/23.
 *
 *   node packages/db/tests/cota_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { avaliarCota, limitesEfetivos, avisoDeCota, alertaDePerfil, custoProjetadoCents, PERFIS } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/cota.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}

const GLOBAL = { respostas_mes: 50, teto_mes_cents: 1300, prospeccao_dia: 20, teto_global_mes_cents: 13000 };
const zerado = { respostasNoMes: 0, custoNoMesCents: 0, prospeccaoHoje: 0, custoGlobalNoMesCents: 0 };
const c = (p) => ({ ...zerado, ...p });

// ---------------------------------------------------------------------------
// O CAMINHO NORMAL
// ---------------------------------------------------------------------------
verifica(
  "dentro da cota, libera",
  avaliarCota("resposta", GLOBAL, c({ respostasNoMes: 10, custoNoMesCents: 260 })).permitido,
  true,
);

// ---------------------------------------------------------------------------
// OS QUATRO BLOQUEIOS
// ---------------------------------------------------------------------------
verifica(
  "cota de respostas estourada bloqueia",
  avaliarCota("resposta", GLOBAL, c({ respostasNoMes: 50 })).motivo,
  "cota_respostas",
);

// O teto de dinheiro existe SEPARADO da contagem de respostas porque uma
// resposta com histórico gigante custa muito acima da média. Aqui a empresa fez
// só 12 respostas e já gastou o mês inteiro — a contagem sozinha deixaria passar.
verifica(
  "teto de dinheiro bloqueia mesmo com poucas respostas",
  avaliarCota("resposta", GLOBAL, c({ respostasNoMes: 12, custoNoMesCents: 1300 })).motivo,
  "teto_empresa",
);

verifica(
  "teto do fabricante bloqueia mesmo com a empresa dentro da cota",
  avaliarCota("resposta", GLOBAL, c({ respostasNoMes: 1, custoNoMesCents: 26, custoGlobalNoMesCents: 13000 })).motivo,
  "teto_fabricante",
);

verifica(
  "prospeccao tem cota propria e diaria",
  avaliarCota("prospeccao", GLOBAL, c({ prospeccaoHoje: 20 })).motivo,
  "cota_prospeccao",
);

// ---------------------------------------------------------------------------
// AS SEPARAÇÕES QUE IMPORTAM
// ---------------------------------------------------------------------------
// Estourar a cota de RESPOSTAS não pode derrubar a prospecção junto: são
// bolsos diferentes e o vendedor perderia uma função que ainda tinha saldo.
verifica(
  "cota de respostas estourada não bloqueia prospecção",
  avaliarCota("prospeccao", GLOBAL, c({ respostasNoMes: 999, prospeccaoHoje: 3 })).permitido,
  true,
);

// E o inverso: rajada de prospecção não pode calar o Responder, que é o
// produto principal.
verifica(
  "cota de prospecção estourada não bloqueia resposta",
  avaliarCota("resposta", GLOBAL, c({ prospeccaoHoje: 999, respostasNoMes: 2 })).permitido,
  true,
);

// Dinheiro vale para TODO uso. Um teto que só olhasse o Responder deixaria o
// Analista de Gestão e o assistente de Licitações furarem a mesma conta.
verifica(
  "teto de dinheiro bloqueia a análise, que não tem cota de contagem",
  avaliarCota("analise", GLOBAL, c({ custoNoMesCents: 1300 })).motivo,
  "teto_empresa",
);
verifica(
  "análise não consome a cota de atendimentos",
  avaliarCota("analise", GLOBAL, c({ respostasNoMes: 999, custoNoMesCents: 10 })).permitido,
  true,
);
verifica(
  "teto de dinheiro também bloqueia prospecção",
  avaliarCota("prospeccao", GLOBAL, c({ custoNoMesCents: 1300 })).motivo,
  "teto_empresa",
);

// ---------------------------------------------------------------------------
// SEM POLÍTICA, LIBERA — e o motivo está escrito no `lib/cota.ts`: a linha
// global nasce com a migration, então "sem política" só acontece em banco
// desatualizado, e bloquear ali derrubaria a IA de todo mundo.
// ---------------------------------------------------------------------------
verifica("sem limites configurados, libera", avaliarCota("resposta", null, c({ respostasNoMes: 9999 })).permitido, true);

// ---------------------------------------------------------------------------
// A JUNÇÃO DE LIMITES — campo a campo, não objeto inteiro.
// Uma empresa com cota própria de respostas continua sujeita ao teto de
// dinheiro do fabricante; sobrescrever o objeto todo abriria esse buraco.
// ---------------------------------------------------------------------------
verifica(
  "regra da empresa sobrescreve campo a campo",
  limitesEfetivos(GLOBAL, { respostas_mes: 500, teto_mes_cents: null, prospeccao_dia: null, teto_global_mes_cents: null }),
  { respostas_mes: 500, teto_mes_cents: 1300, prospeccao_dia: 20, teto_global_mes_cents: 13000 },
);

// O teto GLOBAL não é sobrescrevível por empresa: deixar uma empresa levantar
// o teto de todos seria desligar a trava pelo lado de dentro.
verifica(
  "empresa não consegue levantar o teto global",
  limitesEfetivos(GLOBAL, { respostas_mes: null, teto_mes_cents: null, prospeccao_dia: null, teto_global_mes_cents: 999999 }).teto_global_mes_cents,
  13000,
);

// ---------------------------------------------------------------------------
// A MENSAGEM É DE LIMITE, NUNCA DE ERRO — e sempre diz que o manual segue.
// ---------------------------------------------------------------------------
verifica(
  "a mensagem de bloqueio cita o modo manual",
  /manual/i.test(avaliarCota("resposta", GLOBAL, c({ respostasNoMes: 50 })).mensagem ?? ""),
  true,
);

// ---------------------------------------------------------------------------
// O AVISO ANTES DE ACABAR. Cota que só avisa quando acaba é indistinguível de
// defeito: o botão para de responder e o vendedor conclui que quebrou.
// ---------------------------------------------------------------------------
verifica("aviso não aparece cedo demais", avisoDeCota(GLOBAL, c({ respostasNoMes: 39 })), null);
verifica("aviso aparece a partir de 80%", typeof avisoDeCota(GLOBAL, c({ respostasNoMes: 40 })), "string");
verifica("aviso some quando vira bloqueio", avisoDeCota(GLOBAL, c({ respostasNoMes: 50 })), null);

// ---------------------------------------------------------------------------
// O ALARME DO PERFIL ERRADO. Empresa fora do teste herdando o padrão de teste é
// a combinação que falha CALADA: nada quebra, nada avisa, e um dia o botão para
// de responder. Mesma classe da trava de DNA desarmada — falha na direção que
// PARECE segura, e por isso ninguém procura.
// ---------------------------------------------------------------------------
verifica(
  "empresa fora do teste herdando padrão de teste dispara alarme",
  typeof alertaDePerfil({ emTeste: false, temRegraPropria: false, padraoRespostas: 50 }),
  "string",
);
verifica(
  "empresa em teste não dispara alarme",
  alertaDePerfil({ emTeste: true, temRegraPropria: false, padraoRespostas: 50 }),
  null,
);
verifica(
  "empresa com regra própria não dispara alarme",
  alertaDePerfil({ emTeste: false, temRegraPropria: true, padraoRespostas: 50 }),
  null,
);

// A projeção usa o TETO medido (26 centavos), nunca a média: projeção com média
// subestima justo no mês de consumo alto, que é o único em que ela importa.
verifica("projeção usa o teto medido do custo por resposta", custoProjetadoCents(600), 15600);
verifica(
  "o perfil de operação bate com a própria projeção",
  PERFIS.operacao.teto_mes_cents,
  custoProjetadoCents(PERFIS.operacao.respostas_mes),
);
verifica(
  "o perfil de teste bate com a própria projeção",
  PERFIS.teste.teto_mes_cents,
  custoProjetadoCents(PERFIS.teste.respostas_mes),
);

console.log(falhas ? `\n✗ FALHOU — ${falhas} caso(s)` : "\n✓ PASSOU — 23/23");
process.exit(falhas ? 1 : 0);
