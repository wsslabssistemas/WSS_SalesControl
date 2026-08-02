/**
 * Qualificação de compra (MEDDIC-lite) — a lacuna e o bloco de prompt.
 *
 * O teste mais importante daqui é o PRIMEIRO: as quatro chaves canônicas
 * existem em dois arquivos — no `skill-loader` (que valida os manifestos) e em
 * `lib/qualificacao.ts` (que o app usa). O app não depende do pacote, então a
 * lista é copiada; e cópia que ninguém confere é cópia que diverge. Aqui ela é
 * conferida. Se um dia o app puder importar o pacote, este caso some junto com
 * a cópia.
 *
 * Não precisa de banco.
 *
 *   node packages/db/tests/qualificacao_test.mjs
 *
 * ESPERADO: 12/12.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { lerQualificacao, blocoParaPrompt, QUALIFICATION_KEYS } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/qualificacao.ts")).href
);

let ok = 0, falhou = 0;
const verifica = (nome, obtido, esperado) => {
  const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
  if (a === b) { ok++; console.log(`✓ ${nome}`); }
  else { falhou++; console.log(`✗ ${nome}\n    esperado: ${b}\n    obtido:   ${a}`); }
};

// ---------------------------------------------------------------------
// 1. AS DUAS CÓPIAS DA LISTA CANÔNICA PRECISAM SER IGUAIS.
// ---------------------------------------------------------------------
const schema = fs.readFileSync(path.join(ROOT, "packages/skill-loader/src/schema.ts"), "utf8");
const bloco = schema.slice(schema.indexOf("QUALIFICATION_FIELDS = {"), schema.indexOf("} as const;", schema.indexOf("QUALIFICATION_FIELDS = {")));
const doPacote = [...bloco.matchAll(/^\s{2}([a-z_]+):\s*\{/gm)].map((m) => m[1]);
verifica("as chaves do app são as mesmas do skill-loader", [...QUALIFICATION_KEYS], doPacote);

// ---------------------------------------------------------------------
// 2. A LACUNA — o que interessa.
// ---------------------------------------------------------------------
const campos = [
  { key: "verba", label: "Verba do comprador" },
  { key: "processo_decisao", label: "Como decidem a compra" },
  { key: "criterio_decisao", label: "O que vai pesar na escolha" },
  { key: "defensor_interno", label: "Quem defende por dentro" },
  // Campo do segmento que NÃO é de qualificação: não pode entrar na conta.
  { key: "ciclo_reposicao", label: "Ciclo de reposição" },
];

const nada = lerQualificacao(campos, {});
verifica("contato novo: nada conhecido", nada.conhecido.length, 0);
verifica("e os quatro faltando", nada.faltando.map((f) => f.key), [...QUALIFICATION_KEYS]);
verifica("campo do segmento não entra na conta", nada.cobertura.total, 4);

const parcial = lerQualificacao(campos, {
  verba: "verba_aprovada",
  processo_decisao: "comite_ou_diretoria",
  ciclo_reposicao: "mensal",
});
verifica("o que foi descoberto aparece com o rótulo do ramo", parcial.conhecido, [
  { label: "Verba do comprador", valor: "verba aprovada" },
  { label: "Como decidem a compra", valor: "comite ou diretoria" },
]);
verifica("e falta o resto", parcial.faltando.map((f) => f.key), ["criterio_decisao", "defensor_interno"]);

// "indefinido" é NÃO SABIDO. A diferença entre "perguntei e ele não sabe" e
// "ninguém perguntou" não muda o que fazer agora: descobrir. Se contasse como
// preenchido, o motor pararia de puxar justamente o campo que alguém abriu,
// olhou e deixou em branco.
const indef = lerQualificacao(campos, { verba: "indefinido", criterio_decisao: "" });
verifica("indefinido conta como não sabido", indef.faltando.length, 4);

// ---------------------------------------------------------------------
// 3. O BLOCO DE PROMPT
// ---------------------------------------------------------------------
// Segmento sem qualificação (barbearia): bloco VAZIO. Bloco vazio com título é
// ruído que o modelo tenta preencher.
verifica("segmento sem qualificação → bloco vazio", blocoParaPrompt(lerQualificacao([], {})), "");

const texto = blocoParaPrompt(parcial);
verifica("o bloco traz o que já se sabe", texto.includes("Verba do comprador: verba aprovada"), true);
verifica("o bloco nomeia a lacuna", texto.includes("AINDA NÃO SE SABE"), true);
// A contenção é parte do contrato: uma pergunta, nunca questionário. Um motor
// que responde preço com interrogatório perde a venda que ia fechar.
verifica("e limita a UMA pergunta", texto.includes("UMA pergunta") && texto.includes("Nunca faça duas"), true);

// Tudo descoberto: não sobra instrução de perguntar.
const cheio = lerQualificacao(campos, {
  verba: "verba_aprovada", processo_decisao: "decide_sozinho",
  criterio_decisao: "prazo", defensor_interno: "sim_identificado",
});
verifica("tudo descoberto → não pede mais pergunta", blocoParaPrompt(cheio).includes("AINDA NÃO SE SABE"), false);

console.log(falhou ? `\n✗ FALHOU — ${ok}/${ok + falhou}` : `\n✓ PASSOU — ${ok}/${ok}`);
process.exitCode = falhou ? 1 : 0;
