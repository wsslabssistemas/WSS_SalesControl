/**
 * QUEM RECEBE O CONTATO QUE O SISTEMA CRIOU SOZINHO. Sem banco e sem chave.
 *
 * ⚠ O BURACO QUE ISTO FECHA, e ele foi apontado pelo fundador na hora certa.
 *
 * A Fila passou a abrir na carteira de quem está logado — antes mostrava a
 * lista dos três recepcionistas juntos, e lista que não é de alguém não é de
 * ninguém. Ele viu a consequência imediatamente: *"e os cadastros que não têm
 * responsável? Ninguém vê?"*
 *
 * Não era hipótese. O webhook do WhatsApp criava contato **sem `owner_id`**:
 * quem escrevia para a academia e não estava cadastrado virava lead — e
 * nascia órfão, fora da carteira de todo mundo. Hoje não aparece porque o
 * canal está desligado; no dia em que ligar, é o lead NOVO, o mais quente que
 * existe, que some da lista de todos. Sem erro e sem aviso: a pessoa
 * simplesmente não está em lista nenhuma.
 *
 * A REGRA: quem entra ganha dono na porta, e o dono é quem tem a MENOR
 * carteira aberta. Não é sorteio (desequilibra em amostra pequena) nem rodízio
 * (precisaria lembrar de quem foi a vez) — é função dos dados que já existem,
 * e se autocorrige, porque quem acabou de receber passa a ter mais.
 *
 * ESPERADO: 6/6.
 *
 *   node packages/db/tests/carteira_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { escolherResponsavel } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/carteira.ts")).href
);

let ok = 0;
const falhas = [];
const eq = (nome, calcular, esperado) => {
  let obtido;
  try { obtido = typeof calcular === "function" ? calcular() : calcular; }
  catch (e) { obtido = `ERRO: ${e.message}`; }
  if (JSON.stringify(obtido) === JSON.stringify(esperado)) { ok++; console.log(`✓ ${nome}`); }
  else { falhas.push(`${nome}\n    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`); console.log(`✗ ${nome}`); }
};

const TIME = [{ id: "a" }, { id: "b" }, { id: "c" }];

eq("vai para quem tem a menor carteira",
  () => escolherResponsavel(TIME, { a: 40, b: 12, c: 33 }), "b");

eq("quem ainda não tem ninguém conta como zero, não como ausente",
  () => escolherResponsavel(TIME, { a: 40, c: 33 }), "b");

// ⚠ EMPATE PRECISA SER ESTÁVEL. Duas chamadas iguais têm que dar a mesma
// resposta, senão o mesmo lead cairia em pessoas diferentes em duas
// tentativas — e o pacote da Meta é reenviado quando não recebe 200 a tempo.
eq("empate sempre resolve para o mesmo, na ordem recebida",
  () => [
    escolherResponsavel(TIME, { a: 10, b: 10, c: 10 }),
    escolherResponsavel(TIME, { a: 10, b: 10, c: 10 }),
  ], ["a", "a"]);

eq("com uma pessoa só, é ela", () => escolherResponsavel([{ id: "z" }], {}), "z");

// ⚠ SEM NINGUÉM PARA RECEBER, É MELHOR FICAR ÓRFÃO DO QUE IR PARA UM VÍNCULO
// QUE NÃO ATENDE: órfão aparece no aviso da fila; atribuído errado, não.
eq("time vazio devolve null, não um id inventado",
  () => escolherResponsavel([], { a: 1 }), null);

eq("carteira desconhecida não quebra a escolha",
  () => escolherResponsavel(TIME, {}), "a");

console.log();
if (falhas.length) {
  console.log(`✗ FALHOU — ${ok}/${ok + falhas.length}`);
  for (const f of falhas) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`✓ PASSOU — ${ok}/${ok}`);
