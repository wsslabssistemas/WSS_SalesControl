// SUGESTÃO EM TODO CAMPO ABERTO DO DNA.
//
// POR QUE ESTE TESTE EXISTE
// O fundador, olhando o cadastro de DNA pela primeira vez como cliente:
// *"é questão de preguiça de ter que responder diversas perguntas sem saber se
// está certo de fato. cada pergunta tem que vir com alternativas para
// selecionar e uma opção para escrever caso nenhuma atenda"*.
//
// Ele estava certo, e o problema tinha tamanho: dos 380 campos de DNA dos 15
// manifestos, 268 eram CAIXA DE TEXTO ABERTA e nenhum tinha alternativa.
//
// Caixa vazia não é só trabalho — é uma decisão em branco. Vinte decisões em
// branco seguidas, sem saber se acertou, é o que faz alguém fechar a aba no
// meio do cadastro. E o cadastro de DNA é o gargalo declarado do produto: sem
// ele o motor escala em tudo, e a empresa conclui que a IA não sabe nada.
//
// O QUE ESTE TESTE GUARDA
// Que segmento novo (ou campo novo em segmento existente) não nasça sendo uma
// caixa vazia. Falha aqui é barata; falha na tela do cliente que está
// avaliando o produto custa o cliente.
//
// O QUE ELE NÃO EXIGE
// Sugestão em campo que é IDENTIFICADOR ÚNICO da empresa — endereço, WhatsApp,
// Instagram. Sugerir ali seria absurdo, e a lista abaixo diz isso por escrito
// em vez de deixar a exceção implícita.
//
// Roda sem banco: lê os manifestos do disco.

import { readdirSync, readFileSync } from "node:fs";

const DIR = new URL("../../skills/", import.meta.url);

/** Campos que são dado único da empresa — sugestão não faz sentido. */
const SEM_SUGESTAO = new Set(["address", "whatsapp", "instagram", "site", "email", "endereco"]);

let passou = 0;
const falhas = [];
let abertos = 0, comSugestao = 0;

for (const seg of readdirSync(DIR)) {
  let txt;
  try {
    txt = readFileSync(new URL(`${seg}/manifest.yaml`, DIR), "utf8");
  } catch {
    continue;
  }

  const bloco = txt.match(/\ndna_sections:\n([\s\S]*?)(?=\n[a-z_]+:\n)/);
  if (!bloco) continue;

  const semSugestao = [];
  for (const linha of bloco[1].split("\n")) {
    // Os manifestos alinham as colunas com VÁRIOS espaços depois da vírgula.
    // A primeira versão deste padrão exigia um só e deixou 4 campos de fora,
    // em silêncio — o tipo de falha que só aparece na tela de alguém.
    const m = linha.match(/\{\s*key:\s*([a-z_]+),\s+type:\s*(text|rich_text)\b/);
    if (!m) continue;
    const chave = m[1];
    if (SEM_SUGESTAO.has(chave)) continue;
    abertos++;
    if (/\boptions:\s*\[/.test(linha)) comSugestao++;
    else semSugestao.push(chave);
  }

  if (semSugestao.length) {
    falhas.push(
      `${seg}: ${semSugestao.length} campo(s) de texto sem sugestão —\n` +
        `        ${semSugestao.join(", ")}\n` +
        "        Acrescente `options: [...]` no manifesto. São FORMATOS comuns do ramo,\n" +
        "        nunca fatos desta empresa: quem clica reconhece a própria realidade.",
    );
  } else passou++;
}

if (abertos === 0) {
  falhas.push("nenhum campo de texto encontrado — o teste não está lendo os manifestos");
}

console.log(`  ${comSugestao}/${abertos} campos abertos de DNA têm sugestão.`);

const total = passou + falhas.length;
if (falhas.length) {
  console.error(`\n✗ FALHOU — ${passou}/${total}\n`);
  for (const f of falhas) console.error(`  ✗ ${f}\n`);
  process.exit(1);
}
console.log(`\n✓ PASSOU — ${passou}/${total} segmentos com todos os campos abertos sugeridos.`);
