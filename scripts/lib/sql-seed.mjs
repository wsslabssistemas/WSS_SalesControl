/**
 * Peças compartilhadas entre os carregadores de seed.
 *
 * POR QUE EXISTE: `seed-knowledge.mjs` tinha `stripComments` e
 * `seed-curso.mjs` não. Os dois leem o mesmo dialeto de arquivo, escrito pela
 * mesma pessoa, com os mesmos hábitos — inclusive o de comentar uma linha
 * dentro de uma tupla para explicar por que ela mudou.
 *
 * O resultado foi silencioso e feio: no curso, o TEXTO DO COMENTÁRIO virou a
 * explicação de uma pergunta. Quem viu foi o fundador, fazendo a lição, com o
 * comentário aparecendo na tela onde deveria estar o ensino. Nenhum teste
 * pegou, nenhum carregador reclamou, e o número de perguntas continuou certo.
 *
 * A regra que fica: quando dois carregadores leem o mesmo formato, a parte que
 * entende o formato mora em um lugar. Cópia não fica dessincronizada — fica
 * errada no arquivo que ninguém lembrou de atualizar.
 */

/**
 * Remove comentários de linha (`--`) respeitando aspas simples.
 *
 * O cuidado com aspas não é preciosismo: `'-- não é comentário aqui dentro'` é
 * conteúdo legítimo, e uma regex ingênua (`/--.*$/gm`) comeria metade de uma
 * estratégia curada sem avisar.
 */
export function stripComments(sql) {
  let out = "";
  let inStr = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (inStr) {
      out += c;
      if (c === "'") inStr = sql[i + 1] === "'" ? (out += sql[++i], true) : false;
      continue;
    }
    if (c === "'") { inStr = true; out += c; continue; }
    // Consome até o fim da linha e devolve a quebra, para não colar duas
    // linhas de SQL numa só.
    if (c === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    out += c;
  }
  return out;
}
