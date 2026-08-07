/**
 * O RECONHECIMENTO DE COLUNA DA IMPORTAÇÃO — sem banco e sem chave.
 *
 * Por que existe: importar contato errado não dá erro. A tela diz "3.000
 * importados", o número está certo, e o conteúdo está todo trocado — descoberto
 * dias depois, quando alguém abre um contato e vê um código no lugar do nome.
 * É a falha na direção que PARECE segura, e desfazer três mil linhas à mão não
 * é uma opção.
 *
 * O defeito real que originou este teste: `nome` casava por igualdade EXATA,
 * então `Nome Completo` não era reconhecido e o índice caía para a coluna 0.
 *
 * ESPERADO: 12/12.
 *
 *   node packages/db/tests/importacao_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { detectColumns, parseCsv, detectDelimiter } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/csv.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}
const idx = (h) => { const d = detectColumns(h); return [d.nameIdx, d.phoneIdx]; };

// --------------------------------------------------------------- o básico
verifica("cabeçalho simples", idx(["nome", "telefone"]), [0, 1]);
verifica("ordem invertida", idx(["telefone", "nome"]), [1, 0]);
verifica("maiúscula e acento", idx(["Nome", "Telefone"]), [0, 1]);

// ------------------------------------------------- O DEFEITO QUE ORIGINOU
// Planilha de verdade quase nunca escreve só "nome". Antes da correção,
// nenhum destes era reconhecido e o nome caía na coluna 0 — que aqui é o ID.
verifica("nome composto: 'Nome Completo'", idx(["ID", "Nome Completo", "Celular"]), [1, 2]);
verifica("nome composto: 'Nome do cliente'", idx(["Data", "Nome do cliente", "WhatsApp"]), [1, 2]);
verifica("vocabulário de academia: 'Nome do aluno'", idx(["Matrícula", "Nome do aluno", "Telefone"]), [1, 2]);

// ------------------------------------------------------- telefone variado
verifica("'Número de WhatsApp'", idx(["nome", "Número de WhatsApp"]), [0, 1]);
verifica("'Tel. celular'", idx(["nome", "Tel. celular"]), [0, 1]);

// ------------------------------------------------------------ o fallback
// Sem cabeçalho reconhecível, a ordem manda — mas o resultado precisa DIZER
// que foi chute, senão o erro fica invisível.
const semCabecalho = detectColumns(["João Silva", "51999999999"]);
verifica("sem cabeçalho, assume ordem", [semCabecalho.nameIdx, semCabecalho.phoneIdx], [0, 1]);
verifica("sem cabeçalho, avisa que chutou", semCabecalho.adivinhou, { nome: true, telefone: true });
verifica(
  "cabeçalho parcial marca só o campo chutado",
  detectColumns(["Identificador", "Telefone"]).adivinhou,
  { nome: true, telefone: false },
);

// ------------------------------------------------- planilha do Excel-BR
// Excel brasileiro exporta com ponto-e-vírgula. Se o separador fosse chutado
// como vírgula, a planilha inteira viraria UMA coluna e todo contato entraria
// sem telefone — de novo, sem erro nenhum.
const csvBR = "nome;telefone\r\nJoão Silva;51 99999-9999\r\nMaria;(51) 98888-8888\r\n";
verifica("Excel-BR: separador ponto-e-vírgula + linhas", (() => {
  const linhas = parseCsv(csvBR, detectDelimiter(csvBR));
  return [linhas.length, linhas[1][0], linhas[1][1]];
})(), [3, "João Silva", "51 99999-9999"]);

console.log(falhas ? `\n✗ FALHOU — ${falhas} caso(s)` : "\n✓ PASSOU — 12/12");
process.exit(falhas ? 1 : 0);
