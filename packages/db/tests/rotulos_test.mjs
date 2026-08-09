// RÓTULO DE COLUNA DO DNA — nenhuma chave de máquina chega à tela do cliente.
//
// POR QUE ESTE TESTE EXISTE
// O formulário de DNA imprimia as colunas de tabela CRUAS: quem estava
// cadastrando via `o_que_faz` e `incluso` acima das caixas de texto. O
// fundador pegou isso abrindo a tela pela primeira vez, no meio do teste de
// entrada de um cliente novo.
//
// É a mesma classe do `next_objective`, que virava *"Minha resposta leva ao
// próximo passo: isolate objection"* no exercício do curso. Campo que PARECE
// chave de máquina e não é, porque alguém lê.
//
// O que este teste guarda não é a tradução em si — é a COBERTURA: toda coluna
// declarada em qualquer manifesto precisa ter rótulo escrito à mão. Sem isso,
// um segmento novo entra com `prazo_medio` e a regra mecânica devolve "Prazo
// medio", sem acento, na tela de quem está avaliando o produto.
//
// Roda sem banco: lê os manifestos do disco.

import { readdirSync, readFileSync } from "node:fs";
import { rotuloDaColuna, colunasConhecidas } from "../../../apps/web/lib/rotulos.ts";

let passou = 0;
const falhas = [];
const eq = (nome, obtido, esperado) => {
  if (obtido === esperado) passou++;
  else falhas.push(`${nome}\n    esperado: ${esperado}\n    obtido:   ${obtido}`);
};

// ---------------------------------------------------------------------
// 1. As traduções que mais importam — as que a regra mecânica erraria
// ---------------------------------------------------------------------
eq("o_que_faz", rotuloDaColuna("o_que_faz"), "O que faz");
eq("o_que_inclui", rotuloDaColuna("o_que_inclui"), "O que inclui");
eq("tempo_medio", rotuloDaColuna("tempo_medio"), "Tempo médio");

// ACENTO. Trocar `_` por espaço devolveria "Condicao", "Duracao", "Servico",
// "Observacao", "Publico", "Nivel", "Modulo" — legível e errado, numa tela que
// o cliente lê. É por isso que existe dicionário e não só regra.
eq("condicao", rotuloDaColuna("condicao"), "Condição");
eq("duracao", rotuloDaColuna("duracao"), "Duração");
eq("servico", rotuloDaColuna("servico"), "Serviço");
eq("observacao", rotuloDaColuna("observacao"), "Observação");
eq("publico", rotuloDaColuna("publico"), "Público");
eq("nivel", rotuloDaColuna("nivel"), "Nível");
eq("modulo", rotuloDaColuna("modulo"), "Módulo");

// `incluso` vira PERGUNTA: sozinha, a palavra não diz o que se espera na
// caixa. "Incluso?" pede sim ou não.
eq("incluso vira pergunta", rotuloDaColuna("incluso"), "Incluso?");

// ---------------------------------------------------------------------
// 2. A regra mecânica, para chave desconhecida
// ---------------------------------------------------------------------
eq("chave nova cai na regra", rotuloDaColuna("prazo_entrega"), "Prazo entrega");
eq("chave de uma palavra", rotuloDaColuna("cor"), "Cor");
eq("vazio não explode", rotuloDaColuna(""), "");
eq("nulo não explode", rotuloDaColuna(null), "");

// ---------------------------------------------------------------------
// 3. COBERTURA — o que este teste existe para guardar
//
// Toda coluna declarada em manifesto tem que estar no dicionário. Chave que
// cai na regra mecânica pode aparecer sem acento, e é o cliente novo quem lê.
// ---------------------------------------------------------------------
const DIR = new URL("../../skills/", import.meta.url);
const usadas = new Set();
for (const seg of readdirSync(DIR)) {
  let txt;
  try {
    txt = readFileSync(new URL(`${seg}/manifest.yaml`, DIR), "utf8");
  } catch {
    continue; // não é pasta de segmento
  }
  for (const m of txt.matchAll(/columns:\s*\[([^\]]*)\]/g)) {
    for (const c of m[1].split(",")) {
      const k = c.trim();
      if (k) usadas.add(k);
    }
  }
}

const conhecidas = new Set(colunasConhecidas());
const semRotulo = [...usadas].filter((c) => !conhecidas.has(c)).sort();

if (usadas.size === 0) {
  falhas.push("nenhuma coluna encontrada nos manifestos — o teste não está lendo os arquivos");
} else if (semRotulo.length) {
  falhas.push(
    `${semRotulo.length} coluna(s) de manifesto sem rótulo escrito em lib/rotulos.ts:\n` +
      semRotulo.map((c) => `      ${c}  →  cairia como "${rotuloDaColuna(c)}"`).join("\n"),
  );
} else {
  passou++;
  console.log(`  cobertura: ${usadas.size} colunas usadas nos manifestos, todas com rótulo.`);
}

// ---------------------------------------------------------------------
const total = passou + falhas.length;
if (falhas.length) {
  console.error(`\n✗ FALHOU — ${passou}/${total}\n`);
  for (const f of falhas) console.error(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`\n✓ PASSOU — ${passou}/${total}`);
