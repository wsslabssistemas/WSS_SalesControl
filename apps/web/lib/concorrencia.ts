// CONCORRÊNCIA LIMITADA — nem uma de cada vez, nem todas de uma vez.
//
// Existe por causa de um caso concreto: a sincronização da Be Fitness aplica
// um UPDATE por pessoa e o arquivo real tem **1.548 pagantes**. Uma de cada
// vez, a ida e volta até o Supabase multiplicada por 1.548 passa do tempo
// máximo da função na Vercel — e função que estoura o tempo devolve erro de
// plataforma, não erro do produto: o usuário vê a tela parada e conclui, de
// novo, que "não está salvando".
//
// Todas de uma vez é o outro extremo, e o repositório já pagou por ele: 28
// chamadas simultâneas ao PNCP e 24 falharam.
//
// ⚠ O `mapLimit` do `lib/licitacoes.ts` NÃO foi substituído por este, e é de
// propósito: aquele tem um `sleep(250)` entre lotes porque o PNCP derruba
// rajada. Aqui é o nosso próprio banco, e a pausa só faria a operação demorar
// mais sem proteger ninguém. Duas coisas parecidas com motivos diferentes
// continuam sendo duas coisas.

/**
 * Roda `fn` sobre `itens` com no máximo `limite` em voo ao mesmo tempo.
 *
 * A ordem do resultado acompanha a da entrada — quem chama pode casar índice
 * com índice sem depender de quando cada uma terminou.
 */
export async function mapLimit<T, R>(
  itens: T[],
  limite: number,
  fn: (x: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(itens.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limite, itens.length) }, async () => {
      while (i < itens.length) {
        const k = i++;
        out[k] = await fn(itens[k]);
      }
    }),
  );
  return out;
}
