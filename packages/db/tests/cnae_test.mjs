/**
 * O CATÁLOGO DE ALVOS DA PROSPECÇÃO — sem banco e sem chave.
 *
 * Por que existe: código CNAE errado não dá erro. A busca simplesmente volta
 * vazia, e "não achei empresa nenhuma em Porto Alegre" é indistinguível de "o
 * código está errado". O usuário conclui que a base é ruim e para de usar o
 * módulo — o defeito some junto com a funcionalidade.
 *
 * Este teste não sabe se `9313-1/00` é academia; isso é curadoria. Ele garante
 * o que dá para garantir mecanicamente: formato, unicidade e a ida e volta
 * entre a chave marcada na tela e a linha gravada no `settings`.
 *
 * ESPERADO: 9/9.
 *
 *   node packages/db/tests/cnae_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { ALVOS, alvosPorFamilia, cnaesDosAlvos, alvosDasLinhas } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/cnae.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}

// --------------------------------------------------------------- formato
// `9313-1/00`. Um dígito a mais ou a menos e a busca volta vazia sem erro.
const FORMATO = /^\d{4}-\d\/\d{2}$/;
verifica(
  "todo CNAE está no formato 0000-0/00",
  ALVOS.flatMap((a) => a.cnaes).filter((c) => !FORMATO.test(c)),
  [],
);

// --------------------------------------------------------------- chaves
verifica(
  "nenhuma chave de alvo repetida",
  ALVOS.map((a) => a.key).filter((k, i, xs) => xs.indexOf(k) !== i),
  [],
);
verifica(
  "todo alvo tem rótulo e ao menos um CNAE",
  ALVOS.filter((a) => !a.rotulo?.trim() || !a.cnaes?.length).map((a) => a.key),
  [],
);
verifica("as duas famílias existem", [alvosPorFamilia("ramo").length > 0, alvosPorFamilia("convenio").length > 0], [true, true]);

// A família `convenio` é a resposta para quem atende PESSOA e não pode
// prospectar pessoa. Nota explicando o uso é obrigatória: sem ela a pessoa
// marca sem saber por que aquilo está ali.
verifica(
  "todo alvo de convênio explica para que serve",
  alvosPorFamilia("convenio").filter((a) => !a.nota?.trim()).map((a) => a.key),
  [],
);

// -------------------------------------------------- ida e volta da tela
// A tela manda CHAVE; o servidor grava LINHA; ao reabrir, a linha tem que
// remarcar a mesma chave. Se essa volta quebrar, os checkboxes aparecem
// desmarcados e a pessoa salva por cima achando que o perfil estava vazio —
// apagando o próprio ICP sem nenhum aviso.
const linhas = cnaesDosAlvos(["academia"]);
verifica("a chave vira linha com código e rótulo", linhas, ["9313-1/00 academias e estúdios"]);
verifica("a linha remarca a chave", alvosDasLinhas(linhas), ["academia"]);
verifica(
  "alvo de vários CNAEs só remarca se TODOS estiverem lá",
  alvosDasLinhas(["4520-0/01 oficina"]).includes("oficina"),
  false,
);
verifica(
  "e remarca quando todos estão",
  alvosDasLinhas(cnaesDosAlvos(["oficina"])).includes("oficina"),
  true,
);

console.log(falhas ? `\n✗ FALHOU — ${falhas} caso(s)` : "\n✓ PASSOU — 9/9");
process.exit(falhas ? 1 : 0);
