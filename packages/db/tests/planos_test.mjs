/**
 * O QUE A LINHA DA PLANILHA REPRESENTA — contrato, avulso ou cortesia.
 *
 * ⚠ POR QUE ESTE TESTE EXISTE: a primeira leitura da exportacao real, 20/ago.
 *
 * A coluna `Plano` era ignorada. Das 393 linhas da Be Fitness, 46 sao "Treino
 * Avulso" (gente de passagem, turista que treinou um dia) e 16 sao "Semana
 * FREE". Tratar os tres como contrato faz o avulso virar ex-aluno e entrar na
 * reativacao — oferecendo retorno a quem NUNCA foi cliente, muitas vezes em
 * outra cidade.
 *
 * ⚠ E a distincao entre avulso e experimental e de INTENCAO, nao de preco:
 * quem faz a semana experimental esta avaliando a academia, entao se nao
 * fechou e lead esfriado — publico da reativacao. Decisao do fundador.
 *
 * Valor esperado escrito no arquivo.
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { tipoDaLinha, contaComoContrato, podeVirarExAluno } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/planos.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "  ok" : "FALHA"}  ${nome}`);
  if (!ok) console.log(`        esperado: ${JSON.stringify(esperado)}\n        obtido:   ${JSON.stringify(obtido)}`);
}

// As regras como o manifesto da academia declara.
const R = {
  // ⚠ "avulso" E "avulsa": a variacao de genero e real ("aula avulsa",
  // "treino avulso") e uma lista com so uma das formas deixa metade passar.
  avulso: ["treino avulso", "avulso", "avulsa", "diaria", "day use"],
  experimental: ["semana free", "semana gratis", "experimental"],
};
const t = (nome) => tipoDaLinha(nome, R);

// ---------------------------------------------------------------------
// 1. OS NOMES REAIS DA PLANILHA DA BE FITNESS
// ---------------------------------------------------------------------
verifica("Anual e contrato", t("Anual"), "contrato");
verifica("Fitness 6 Meses 10% Promocional e contrato", t("Fitness 6 Meses 10% Promocional"), "contrato");
verifica("Anual Recorrente e contrato", t("Anual Recorrente"), "contrato");
verifica("Planos Fitness A VISTA Cartao/PIX e contrato", t("Planos Fitness A VISTA Cartao/PIX"), "contrato");

verifica("Treino Avulso e avulso", t("Treino Avulso"), "avulso");
verifica("Semana FREE e experimental", t("Semana FREE"), "experimental");
// ⚠ A planilha traz "Semana FREE2" — variacao criada pela recepcao. Exigir o
// nome exato faria ela passar despercebida.
verifica("Semana FREE2 tambem e experimental (variacao da recepcao)", t("Semana FREE2"), "experimental");

// Acento e caixa vem sujos da exportacao.
verifica("acento e caixa nao atrapalham", t("TREINO AVULSO"), "avulso");
verifica("Diaria com acento", t("Diária"), "avulso");

// ---------------------------------------------------------------------
// 2. ⚠ O PADRAO TEM LADO
//
// Plano desconhecido tratado como contrato entra na carteira e alguem percebe.
// Tratado como avulso, SOME DA RENOVACAO em silencio — e some justamente quem
// paga. Errar para o lado de incluir e recuperavel; excluir nao aparece.
// ---------------------------------------------------------------------
verifica("plano novo e desconhecido cai em contrato", t("Plano Verao 2027"), "contrato");
verifica("vazio cai em contrato", t(""), "contrato");
verifica("nulo cai em contrato", t(null), "contrato");
verifica("sem regras declaradas, tudo e contrato", tipoDaLinha("Treino Avulso", null), "contrato");

// ⚠ Nome que casa com os dois cai no MAIS RESTRITIVO: avulso nao vira
// ex-aluno, experimental vira. Na duvida, nao colocar alguem numa lista.
// ⚠ E o feminino tem que casar: "avulsa" e tao comum quanto "avulso" na
// planilha de uma academia ("aula avulsa"). Uma lista com so uma das formas
// deixaria metade dos de passagem entrarem na reativacao.
verifica("o feminino tambem e avulso", t("Aula avulsa"), "avulso");
verifica("casando com os dois, vence avulso", t("Aula avulsa experimental"), "avulso");

// ---------------------------------------------------------------------
// 3. AS DUAS CONSEQUENCIAS
// ---------------------------------------------------------------------
verifica("so contrato cria vigencia", [contaComoContrato("contrato"), contaComoContrato("avulso"), contaComoContrato("experimental")], [true, false, false]);
// ⚠ A linha que separa os dois casos parecidos: experimental vira ex-aluno
// (era lead avaliando), avulso nao (nunca foi cliente para voltar a ser).
verifica("experimental vira ex-aluno, avulso nao", [podeVirarExAluno("experimental"), podeVirarExAluno("avulso"), podeVirarExAluno("contrato")], [true, false, true]);

console.log(falhas === 0 ? "\nplanos: tudo certo." : `\nplanos: ${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
