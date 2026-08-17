/**
 * AS VARIÁVEIS DO MODELO — o que a Meta recusa antes de entregar.
 *
 * ⚠ POR QUE ESTE TESTE EXISTE.
 *
 * Modelo aprovado é texto fixo; só as variáveis mudam. E a Meta tem uma regra
 * sobre o VALOR delas que não aparece em lugar nenhum até a mensagem ser
 * recusada: **não pode ter quebra de linha, tabulação nem mais de 4 espaços
 * seguidos.**
 *
 * Isso não é caso de borda nesta base. Os nomes vieram da planilha do sistema
 * da academia — espaço duplo, nome inteiro em caixa alta, sobrenome colado.
 * Uma regra de plataforma que se apresenta como "não enviou" é exatamente a
 * classe que mais custou aqui, então ela morre antes de virar chamada de rede.
 *
 * E a regra do `paraE164BR` vale igual: **derivar não pode virar corromper.**
 * O primeiro nome é derivado na hora do envio e nunca gravado. Derivação
 * errada faz a mensagem não sair, em vez de destruir o cadastro.
 *
 * Valor esperado escrito no arquivo.
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { higienizarParametro, primeiroNome } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/modelo.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "  ok" : "FALHA"}  ${nome}`);
  if (!ok) console.log(`        esperado: ${JSON.stringify(esperado)}\n        obtido:   ${JSON.stringify(obtido)}`);
}

// ---------------------------------------------------------------------
// 1. O QUE A META RECUSA
// ---------------------------------------------------------------------

// Esperado: um espaço só. Quebra de linha recusa a mensagem INTEIRA.
verifica("quebra de linha vira espaço", higienizarParametro("Ana\nCarolina"), { ok: true, valor: "Ana Carolina" });

// Esperado: um espaço só. Tabulação idem.
verifica("tabulação vira espaço", higienizarParametro("Ana\tCarolina"), { ok: true, valor: "Ana Carolina" });

// ⚠ O CASO REAL DESTA BASE. Esperado: "Ana Carolina" — mais de 4 espaços
// seguidos é recusa, e a planilha da academia tem exatamente isso.
verifica(
  "mais de 4 espaços seguidos colapsam",
  higienizarParametro("Ana      Carolina"),
  { ok: true, valor: "Ana Carolina" },
);

// Esperado: recusa. Não existe valor padrão aceitável para uma variável de
// modelo — mandar "Oi, !" é pior que não mandar.
verifica("valor vazio é recusa, não valor padrão", higienizarParametro("   \n  ").ok, false);
verifica("nulo é recusa", higienizarParametro(null).ok, false);

// ---------------------------------------------------------------------
// 2. O PRIMEIRO NOME — deriva e nunca grava
// ---------------------------------------------------------------------

// Esperado: "Ana". Nome completo numa abertura de WhatsApp denuncia disparo.
verifica("nome completo vira o primeiro", primeiroNome("Ana Carolina Alves de Oliveira"), { ok: true, valor: "Ana" });

// ⚠ Esperado: "Maria". Caixa alta se lê como grito, e o modelo sai no nome da
// academia. A planilha do sistema entrega assim.
verifica("caixa alta é normalizada", primeiroNome("MARIA DA SILVA"), { ok: true, valor: "Maria" });

// Esperado: "João" — acento preservado na normalização de caixa.
verifica("acento sobrevive à normalização", primeiroNome("JOÃO PEDRO"), { ok: true, valor: "João" });

// Esperado: "Volmar". Espaço nas pontas e no meio não pode vazar para a Meta.
verifica("espaço nas pontas e duplicado no meio", primeiroNome("  volmar   rosa da costa "), { ok: true, valor: "Volmar" });

// Esperado: recusa. Sem nome não dá para abrir o modelo — e recusar é o lado
// certo para errar: a mensagem não sai, ninguém recebe "Oi, !".
verifica("contato sem nome não recebe modelo", primeiroNome("").ok, false);
verifica("contato com nome só de espaço não recebe modelo", primeiroNome("   ").ok, false);

// Esperado: "Catarina". Nome de uma pessoa só continua funcionando.
verifica("nome único", primeiroNome("Catarina"), { ok: true, valor: "Catarina" });

console.log(falhas === 0 ? "\nmodelo: tudo certo." : `\nmodelo: ${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
