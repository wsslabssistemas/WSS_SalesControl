// LER TUDO, sem o corte silencioso.
//
// O PostgREST devolve no máximo 1.000 linhas por consulta e **não avisa**. Não
// vem erro, não vem flag: vem um número plausível e menor. Já custou 53
// interações sumidas na canonização das técnicas, e a lição está escrita no
// `ESTADO_DO_PROJETO.md` — "limite que não reclama é o pior tipo".
//
// Com a Be Fitness em 273 contatos nada disso aparecia. Com os 9 mil cadastros
// que vão entrar, a Fila passaria a calcular sobre 1.000 contatos ARBITRÁRIOS
// (não há ordenação declarada), e a lista do dia sairia errada com toda a cara
// de estar certa. É o pior tipo de defeito deste produto: o vendedor não tem
// como desconfiar de um nome que não apareceu.
//
// Esta função existe para que "ler a tabela inteira" seja uma decisão
// explícita, com o custo à vista, em vez de um `select` que parece completo.

/** Tamanho da página. O teto do PostgREST é 1.000; pedir exatamente isso evita ida e volta extra. */
const PAGINA = 1000;

/**
 * Puxa TODAS as linhas de uma consulta, em páginas.
 *
 * `montar(de, ate)` recebe a faixa e devolve a consulta já com `.range(de, ate)`
 * aplicado — quem chama continua dono dos filtros e das colunas.
 *
 * `teto` é uma trava de sanidade, não um limite de negócio: se uma consulta
 * passar dele, algo está errado no filtro (tenant faltando, por exemplo) e é
 * melhor parar e registrar do que puxar meio banco para dentro de uma página.
 */
export async function lerTudo<T>(
  montar: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  opcoes?: { teto?: number; rotulo?: string },
): Promise<T[]> {
  const teto = opcoes?.teto ?? 50_000;
  const out: T[] = [];

  for (let de = 0; de < teto; de += PAGINA) {
    const { data, error } = await montar(de, de + PAGINA - 1);
    if (error) {
      // Devolver o que veio até aqui seria repetir o defeito que esta função
      // existe para matar: resultado parcial com cara de completo.
      throw new Error(`${opcoes?.rotulo ?? "consulta"} falhou na faixa ${de}: ${error.message}`);
    }
    const lote = data ?? [];
    out.push(...lote);
    if (lote.length < PAGINA) return out;
  }

  console.warn(
    `[paginado] ${opcoes?.rotulo ?? "consulta"} bateu o teto de ${teto} linhas — ` +
      `provavelmente falta um filtro.`,
  );
  return out;
}
