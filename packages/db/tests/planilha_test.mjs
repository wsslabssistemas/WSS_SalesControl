/**
 * O LEITOR DA PLANILHA — sem banco e sem chave.
 *
 * ⚠ ESTE TESTE GUARDA A RECUSA DE ADIVINHAR A CHAVE.
 *
 * Nome e telefone o detector pode chutar pela posição: errar ali produz um
 * cadastro torto que alguém vê. Errar a CHAVE é outra classe — a comparação
 * casaria uma pessoa com o histórico de outra, em silêncio, e sem jeito de
 * descobrir depois. Por isso ou existe coluna de código, ou o telefone assume
 * o papel explicitamente, ou o leitor para.
 *
 * E guarda a regra do LOG: a planilha da academia tem uma linha por CONTRATO,
 * então a mesma pessoa aparece várias vezes. Ficar com a primeira linha daria
 * o contrato ANTIGO como verdade — que é o defeito da Maria Isabel
 * reintroduzido pela porta dos fundos.
 *
 * ESPERADO: 14/14.
 *
 *   node packages/db/tests/planilha_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { ler } = await import(pathToFileURL(path.join(ROOT, "apps/web/lib/planilha.ts")).href);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}

// ------------------------------------------------- A ABA MATRICULAS, NORMAL

const matriculas = [
  "Código;Nome;Telefone;Plano;Início;Vencimento",
  "7386;Maria Isabel Ferreira Garcia;51999990001;Fitness 6 Meses;11/02/2026;10/08/2026",
  "8120;Noeli da Silva;51999990002;Trimestral;20/07/2026;19/10/2026",
].join("\n");

const m = ler(matriculas, { exigeVigencia: true });
verifica("lê sem erro", m.erro, null);
verifica("usa a coluna Código como chave", m.entendeu.chave, "Código");
verifica("reconhece a coluna de vencimento", m.entendeu.vigencia, "Vencimento");
// ⚠ DATA pt-BR: 10/08/2026 é 10 de AGOSTO, não 8 de outubro. O importador já
// tinha essa trava (`importacao_test`) e ela vale igual aqui.
verifica("converte a data no padrão brasileiro",
  m.linhas.map((l) => [l.chave, l.vigencia_ate]),
  [["7386", "2026-08-10"], ["8120", "2026-10-19"]]);

// --------------------------------------------------- A PLANILHA É UM LOG

// A mesma pessoa com dois contratos: vale o de MAIOR data de fim. Ficar com o
// primeiro deixaria a Maria Isabel eternamente vencida — o defeito original.
const comRenovacao = [
  "Código;Nome;Vencimento",
  "7386;Maria Isabel;10/08/2026",
  "7386;Maria Isabel;10/02/2027",
].join("\n");
const r = ler(comRenovacao, { exigeVigencia: true });
verifica("chave repetida vira UMA linha", r.linhas.length, 1);
verifica("e fica a vigência mais LONGA", r.linhas[0].vigencia_ate, "2027-02-10");
// Descarte nunca é silencioso — a linha ignorada é relatada com o motivo.
verifica("a linha descartada é relatada", r.ignoradas.length, 1);

// Ordem inversa: o contrato longo vem primeiro e o curto depois. O resultado
// tem que ser o mesmo — senão a leitura dependeria da ordem da planilha.
const inversa = ler(["Código;Nome;Vencimento", "7386;M;10/02/2027", "7386;M;10/08/2026"].join("\n"), { exigeVigencia: true });
verifica("a ordem das linhas não muda o resultado", inversa.linhas[0].vigencia_ate, "2027-02-10");

// ------------------------------------------------ A RECUSA DE ADIVINHAR

// Sem código e sem cabeçalho de telefone reconhecível: PARA. Chutar a chave
// trocaria o histórico de uma pessoa pelo de outra, em silêncio.
const semChave = ler(["Coluna A;Coluna B;Coluna C", "x;y;z"].join("\n"));
verifica("sem chave reconhecível, recusa", semChave.erro !== null, true);
verifica("e a recusa explica o risco e o conserto",
  semChave.erro.includes("trocar o histórico") && semChave.erro.includes("Código"), true);

// Aba de cadastros (sem vigência) com telefone: o telefone assume a chave,
// e o leitor DECLARA que assumiu.
const cadastros = ler(["Nome;Telefone;Cidade", "Fulano;(51) 99999-0001;Porto Alegre"].join("\n"));
verifica("sem código, o telefone assume a chave", cadastros.linhas[0].chave, "51999990001");
verifica("e o leitor declara que assumiu",
  cadastros.entendeu.chave.includes("telefone"), true);

// ------------------------------------------- VIGÊNCIA EXIGIDA E AUSENTE

// A aba Matriculas SEM coluna de vencimento não pode ser usada para comparar
// contrato. Deduzir vigência seria inventar.
const semVigencia = ler(["Código;Nome", "1;Fulano"].join("\n"), { exigeVigencia: true });
verifica("aba de contrato sem vencimento é recusada", semVigencia.erro !== null, true);
// Mas a MESMA aba serve para cadastro, onde vigência não faz sentido.
verifica("e a mesma aba passa quando vigência não é exigida",
  ler(["Código;Nome", "1;Fulano"].join("\n")).erro, null);

// Linha sem chave é ignorada COM MOTIVO, nunca em silêncio.
const comBuraco = ler(["Código;Nome;Vencimento", ";Sem código;10/08/2026", "9;Ok;10/08/2026"].join("\n"), { exigeVigencia: true });
verifica("linha sem chave é ignorada com motivo",
  [comBuraco.linhas.length, comBuraco.ignoradas[0].motivo.includes("sem chave")], [1, true]);

console.log(falhas === 0 ? "\nOK — 14/14" : `\nFALHOU — ${falhas} de 14`);
process.exit(falhas === 0 ? 0 : 1);
