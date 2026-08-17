/**
 * O CUSTO DAS MENSAGENS DA META.
 *
 * ⚠ POR QUE ESTE TESTE EXISTE.
 *
 * Enquanto o envio era humano pelo `wa.me`, mandar mensagem era grátis e o
 * único custo do produto era a IA. Deixou de ser. O teto que existe hoje mede
 * IA e ignora a Meta — e o buraco tem prazo: em 1º/out/2026 até a RESPOSTA
 * passa a ser cobrada.
 *
 * As propriedades que este arquivo guarda:
 *
 *   1. **A soma acontece em micro-reais e arredonda UMA vez, no fim.** Uma
 *      mensagem de utilidade custa 3,4 centavos. Arredondar por linha erraria
 *      de 12% (3 centavos) a 100% (0 centavos) num volume de milhares, sempre
 *      para menos — o lado errado num freio de custo.
 *   2. **A data de 1º/out/2026 está no código, não num comentário.** Uma
 *      tabela com "serviço = grátis" escrita à mão continuaria dizendo isso em
 *      novembro, e ninguém releria.
 *   3. **Bloqueio não é erro.** O motivo precisa dizer que o `wa.me` continua
 *      liberado, senão a pessoa conclui que o sistema quebrou.
 *
 * Valor esperado escrito no arquivo.
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const {
  TARIFA_BR, tarifaVigente, custoMicroReais, paraCentavos,
  avaliarTetoDeMensagens, categoriaDoEnvio, featureDaMensagem, reais,
} = await import(pathToFileURL(path.join(ROOT, "apps/web/lib/custo_mensagem.ts")).href);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "  ok" : "FALHA"}  ${nome}`);
  if (!ok) console.log(`        esperado: ${JSON.stringify(esperado)}\n        obtido:   ${JSON.stringify(obtido)}`);
}

const ANTES = new Date(Date.UTC(2026, 8, 30)); // 30/set/2026
const DEPOIS = new Date(Date.UTC(2026, 9, 1)); // 1º/out/2026

// ---------------------------------------------------------------------
// 1. A CONTA DA REATIVAÇÃO — o número que decide a campanha
// ---------------------------------------------------------------------

// 1.089 ex-alunos × R$ 0,3125 = R$ 340,3125 → 34.031 centavos.
// Esperado: 34031. Se alguém arredondar por mensagem (31 centavos), dá 33.759
// — R$ 2,72 a menos, e o erro cresce com o volume.
verifica(
  "1.089 reativações em marketing custam R$ 340,31",
  paraCentavos(custoMicroReais({ marketing: 1089 }, TARIFA_BR)),
  34031,
);

// A operação corrente: ração 10 × 3 vendedores × 22 dias = 660.
// Como marketing: 660 × 312.500 = 206.250.000 micro → 20.625 centavos.
verifica("660 mensagens/mês como marketing = R$ 206,25", paraCentavos(custoMicroReais({ marketing: 660 }, TARIFA_BR)), 20625);

// Como utilidade: 660 × 34.000 = 22.440.000 micro → 2.244 centavos.
// ⚠ ESTE É O CASO QUE O ARREDONDAMENTO POR LINHA DESTRUIRIA: 3,4 centavos
// viram 3, e a conta cairia para R$ 19,80 — 12% a menos.
verifica("660 mensagens/mês como utilidade = R$ 22,44", paraCentavos(custoMicroReais({ utilidade: 660 }, TARIFA_BR)), 2244);

// A diferença que faz a escrita ser decisão de custo: 9,2×.
verifica(
  "marketing custa 9,19× a utilidade",
  Math.round((TARIFA_BR.marketing / TARIFA_BR.utilidade) * 100) / 100,
  9.19,
);

// ---------------------------------------------------------------------
// 2. A DATA DE 1º DE OUTUBRO
// ---------------------------------------------------------------------

// Esperado: 0. Hoje, responder dentro da janela não custa.
verifica("antes de outubro, serviço é grátis", tarifaVigente(TARIFA_BR, ANTES).servico, 0);

// Esperado: 34.000 — a tarifa de utilidade. É a mudança que derruba o
// argumento "o disparo custa, a conversa não".
verifica("a partir de 1º/out, serviço custa a tarifa de utilidade", tarifaVigente(TARIFA_BR, DEPOIS).servico, 34_000);

// 500 respostas num mês: zero hoje, R$ 17,00 depois. O mesmo trabalho.
verifica(
  "500 respostas: grátis hoje, R$ 17,00 em outubro",
  [
    paraCentavos(custoMicroReais({ servico: 500 }, tarifaVigente(TARIFA_BR, ANTES))),
    paraCentavos(custoMicroReais({ servico: 500 }, tarifaVigente(TARIFA_BR, DEPOIS))),
  ],
  [0, 1700],
);

// ---------------------------------------------------------------------
// 3. A CATEGORIA
// ---------------------------------------------------------------------

// Esperado: "servico". Sem modelo é texto livre, e texto livre só sai dentro
// da janela — que é a definição de serviço.
verifica("sem modelo, é serviço", categoriaDoEnvio({ temModelo: false }), "servico");

// Esperado: "marketing". Modelo sem categoria declarada assume o CARO. Assumir
// o barato faria a estimativa mentir para menos, sempre, e em silêncio.
verifica("modelo sem categoria declarada assume marketing", categoriaDoEnvio({ temModelo: true }), "marketing");

verifica("modelo de utilidade é utilidade", categoriaDoEnvio({ temModelo: true, categoriaDoModelo: "utilidade" }), "utilidade");

// Prefixo próprio para a soma de IA e a de mensagem nunca se confundirem.
verifica("a linha do ledger tem prefixo próprio", featureDaMensagem("marketing"), "whatsapp_marketing");

// ---------------------------------------------------------------------
// 4. O TETO
// ---------------------------------------------------------------------

// Esperado: liberado e sem restante. Sem teto é o padrão — teto inventado que
// morde no meio de uma campanha é pior que teto nenhum.
verifica("sem teto configurado, libera", avaliarTetoDeMensagens(50_000, null), {
  ok: true, gastoCents: 50_000, restanteCents: null,
});

// Esperado: liberado, restando 5.000 centavos (R$ 50,00).
verifica("dentro do teto, informa o restante", avaliarTetoDeMensagens(5_000, 10_000), {
  ok: true, gastoCents: 5_000, restanteCents: 5_000,
});

// Esperado: bloqueado. O próximo envio ESTOURA, e a verificação acontece antes
// da chamada — verificar depois é medir o prejuízo.
verifica(
  "o envio que estoura é barrado antes de sair",
  avaliarTetoDeMensagens(9_900, 10_000, 200).ok,
  false,
);

// ⚠ Esperado: o motivo cita o `wa.me`. Bloqueio sem saída se lê como "o
// sistema quebrou" — é a regra 1 da cota de IA valendo aqui.
verifica(
  "o bloqueio diz que o envio manual continua liberado",
  avaliarTetoDeMensagens(20_000, 10_000).motivo.includes("não custa nada"),
  true,
);

verifica("formatação de dinheiro", reais(34031), "R$ 340,31");

console.log(falhas === 0 ? "\ncusto de mensagem: tudo certo." : `\ncusto de mensagem: ${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
