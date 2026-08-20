/**
 * O GEMEO ATIVO — quem ja e cliente e tem um cadastro velho solto.
 *
 * ⚠ POR QUE ESTE TESTE EXISTE: o caso Lilian, 20/ago/2026.
 *
 * O fundador viu "Lilian Cabral Leao" na simulacao da reativacao, sendo que
 * ela tinha acabado de renovar, e nomeou o problema: "nao daria para
 * automatizar e oferecer algo para alguem ja matriculado".
 *
 * A causa nao foi a fila. Quando ela renovou, alguem cadastrou um contato NOVO
 * em vez de achar o existente — e digitou o telefone com um digito a menos
 * (5194473319 contra 51994473319). Ficaram duas linhas: uma matriculada, outra
 * parada em `ex_aluno`.
 *
 * ⚠ E O SINAL E O TELEFONE, NUNCA O NOME. A base tem um contato chamado so
 * "Leticia" que, por prefixo de nome, casa com Leticia Frantz, Leticia Lopes,
 * Leticia Nunes e Leticia Plada — QUATRO pessoas diferentes silenciadas de uma
 * vez. Metade deste teste guarda isso.
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { idsComGemeoAtivo } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/gemeo.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "  ok" : "FALHA"}  ${nome}`);
  if (!ok) console.log(`        esperado: ${JSON.stringify(esperado)}\n        obtido:   ${JSON.stringify(obtido)}`);
}
const lista = (s) => [...s].sort();
const HOJE = "2026-08-20";

// ⚠ O CASO REAL. Mesmo telefone normalizado, dois cadastros: um com plano
// anual vigente, outro parado como ex-aluno. Esperado: o ex-aluno sai.
verifica(
  "o cadastro velho sai quando a mesma pessoa ja e cliente",
  lista(idsComGemeoAtivo([
    { id: "ex-lilian",    digitos: "5551994473319", contract_end: null },
    { id: "ativa-lilian", digitos: "5551994473319", contract_end: "2027-08-09" },
  ], HOJE)),
  ["ex-lilian"],
);

// Esperado: vazio. O ativo NAO se exclui — ele segue na fila pelos motivos
// dele (renovacao, recompra). O que sai e o cadastro velho.
verifica(
  "quem e o proprio ativo continua na fila",
  lista(idsComGemeoAtivo([
    { id: "ativa-lilian", digitos: "5551994473319", contract_end: "2027-08-09" },
  ], HOJE)),
  [],
);

// Esperado: vazio. Contrato VENCIDO nao e gemeo ativo — quem venceu de fato
// deve receber reativacao, que e o proposito da lista.
verifica(
  "contrato vencido nao protege ninguem",
  lista(idsComGemeoAtivo([
    { id: "ex",    digitos: "5551999999999", contract_end: null },
    { id: "velho", digitos: "5551999999999", contract_end: "2026-01-10" },
  ], HOJE)),
  [],
);

// Esperado: o ex sai. Vigencia que termina HOJE ainda e vigente.
verifica(
  "vigencia que termina hoje ainda vale",
  lista(idsComGemeoAtivo([
    { id: "ex",    digitos: "5551988888888", contract_end: null },
    { id: "ativo", digitos: "5551988888888", contract_end: HOJE },
  ], HOJE)),
  ["ex"],
);

// ⚠ Esperado: vazio. Telefones DIFERENTES sao pessoas diferentes, por mais
// parecido que o nome seja. E o caso das quatro Leticias.
verifica(
  "telefones diferentes nao se contaminam",
  lista(idsComGemeoAtivo([
    { id: "leticia-frantz", digitos: "5551981489968", contract_end: null },
    { id: "leticia-lopes",  digitos: "5551989570997", contract_end: null },
    { id: "leticia-ativa",  digitos: "5551999017745", contract_end: "2027-07-28" },
  ], HOJE)),
  [],
);

// Esperado: vazio. Sem telefone nao ha como afirmar que e a mesma pessoa — e
// afirmar sem base e o que este arquivo existe para nao fazer.
verifica(
  "contato sem telefone nunca e excluido por gemeo",
  lista(idsComGemeoAtivo([
    { id: "ex",    digitos: null, contract_end: null },
    { id: "ativo", digitos: null, contract_end: "2027-08-09" },
  ], HOJE)),
  [],
);

// Tres cadastros velhos da mesma pessoa saem todos.
verifica(
  "varios cadastros velhos do mesmo telefone saem juntos",
  lista(idsComGemeoAtivo([
    { id: "v1",    digitos: "5551977777777", contract_end: null },
    { id: "v2",    digitos: "5551977777777", contract_end: null },
    { id: "ativo", digitos: "5551977777777", contract_end: "2027-01-01" },
  ], HOJE)),
  ["v1", "v2"],
);

console.log(falhas === 0 ? "\ngemeo: tudo certo." : `\ngemeo: ${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
