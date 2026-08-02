/**
 * O exercício de fim de módulo — a montagem, testada sem banco.
 *
 * O que se protege aqui:
 *  • a ESCOLHA é determinística. Exercício que troca sozinho impede a pessoa
 *    de comparar o que escreveu antes com o que escreve agora — e comparar é
 *    metade do valor de refazer.
 *  • a situação não ganha PONTUAÇÃO INVENTADA. A primeira versão colava "?" em
 *    tudo e produziu "Vou pensar?", que não é pergunta. Invenção pequena é
 *    invenção.
 *  • chave de máquina não vaza para a tela (`reduzir_risco`).
 *
 *   node packages/db/tests/exercicio_test.mjs
 *
 * ESPERADO: 13/13.
 */
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { montarExercicio, escolherEntrada } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/exercicio.ts")).href
);

let ok = 0, falhou = 0;
const verifica = (nome, obtido, esperado) => {
  const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
  if (a === b) { ok++; console.log(`✓ ${nome}`); }
  else { falhou++; console.log(`✗ ${nome}\n    esperado: ${b}\n    obtido:   ${a}`); }
};

const temFato = (dna, caminho) => {
  const [s, c] = caminho.split(".");
  const v = dna?.[s]?.[c];
  return v != null && v !== "";
};

const E = (over) => ({
  category: "objections", school: null, trigger_questions: ["ta caro"],
  strategy: "estrategia", technique: "tecnica", common_errors: [], next_objective: null,
  required_facts: [], ...over,
});

const jolt = E({
  category: "commitment_offer", school: "indecisao_jolt",
  trigger_questions: ["vou pensar", "e se o lote nao sair como a amostra", "depois eu falo"],
  technique: "Diminuir o compromisso", next_objective: "reduzir_risco",
  common_errors: ["Insistir na qualidade", "Dar desconto", "Mandar mais amostra", "Um quarto erro"],
  required_facts: ["producao.lote_minimo", "producao.prazo"],
});
const preco = E({ category: "pricing", technique: "Faixa antes de cotar", trigger_questions: ["quanto custa o metro"] });
const outra = E({ category: "retention", technique: "Antecipar reposicao", trigger_questions: ["sumiu faz tempo"] });

// 1. A escola do módulo vence a categoria.
verifica("escolhe pela escola do módulo", escolherEntrada([preco, jolt, outra], "indecisao_jolt", ["pricing"]).technique, "Diminuir o compromisso");
// 2. Sem escola casando, vale a categoria das lições.
verifica("sem escola, vale a categoria", escolherEntrada([preco, jolt, outra], "challenger", ["pricing"]).technique, "Faixa antes de cotar");
// 3. Sem nada casando, nunca devolve tela vazia.
verifica("sem casar nada, ainda monta", escolherEntrada([preco, outra], "challenger", ["ecosystem"]) != null, true);
// 4. Entrada sem gatilho não serve de situação.
verifica("entrada sem gatilho é ignorada", escolherEntrada([E({ trigger_questions: [] })], null, []), null);

// 5. Determinismo: a ordem em que o BANCO devolveu não pode mudar a escolha.
//    (A ordem das CATEGORIAS muda, e isso é de propósito: ela vem da
//    frequência com que as lições do módulo puxam cada uma.)
const a = escolherEntrada([preco, jolt, outra], null, ["pricing", "retention"]);
const b = escolherEntrada([outra, preco, jolt], null, ["pricing", "retention"]);
verifica("mesma escolha independente da ordem do banco", a.technique, b.technique);

// 5b. A categoria mais trabalhada pelo módulo ganha.
verifica(
  "a primeira categoria do módulo tem precedência",
  escolherEntrada([preco, outra], null, ["retention", "pricing"]).technique,
  "Antecipar reposicao",
);

// 5c. Não repete o que outro módulo já usou — e cede quando a biblioteca acaba.
verifica(
  "evita a entrada já usada por outro módulo",
  escolherEntrada([preco, outra], null, ["pricing", "retention"], ["pricing:Faixa antes de cotar"]).technique,
  "Antecipar reposicao",
);
verifica(
  "com a biblioteca esgotada, repete em vez de deixar vazio",
  escolherEntrada([preco], null, ["pricing"], ["pricing:Faixa antes de cotar"]).technique,
  "Faixa antes de cotar",
);

const ex = montarExercicio([jolt], "indecisao_jolt", ["commitment_offer"], { producao: { lote_minimo: "500 m" } }, temFato);

// 6. O gatilho mais longo vira a situação — é o que parece uma mensagem real.
verifica("usa o gatilho mais longo", ex.situacao, "E se o lote nao sair como a amostra?");
// 7. Frase que não pergunta não ganha "?".
verifica(
  "afirmação não vira pergunta",
  montarExercicio([E({ trigger_questions: ["vou pensar com calma"] })], null, [], null, temFato).situacao,
  "Vou pensar com calma",
);
// 8. Chave de máquina não chega à tela.
verifica("next_objective vira texto legível", ex.recomendacao.proximoPasso, "reduzir risco");
// 9. O DNA entra como fato, e a ausência também é informação.
verifica("cruza os fatos exigidos com o DNA", ex.fatos, [
  { caminho: "producao.lote_minimo", tem: true },
  { caminho: "producao.prazo", tem: false },
]);
// 10. A autoavaliação sai da entrada, e não vira lista interminável.
verifica("autoavaliação limitada e específica", ex.autoavaliacao.length, 5);

console.log(falhou ? `\n✗ FALHOU — ${ok}/${ok + falhou}` : `\n✓ PASSOU — ${ok}/${ok}`);
process.exitCode = falhou ? 1 : 0;
