// Casamento por palavra-chave (sem IA): pontua a sobreposição entre a mensagem
// colada e VÁRIOS campos de cada entrada da biblioteca (gatilhos, categoria,
// técnica, estratégia, resposta). Casamento parcial (prefixo/inclusão) para não
// falhar por plural ou grafia. Objetivo: recall alto — raramente voltar vazio.
// `custa` e `custam` NÃO entram aqui: são o sinal mais forte de uma pergunta
// de preço. Com elas na lista, "quanto custa um implante?" virava só
// ["implante"] e casava com o catálogo em vez da entrada de preço — a pergunta
// mais comum do funil perdia justamente a palavra que a define.
// `quanto` continua ignorada por ser ambígua ("quanto tempo", "quanto pesa").
const STOP = new Set(
  "a o e de da do das dos em no na nos nas um uma uns umas que qual quais quanto quanta quantos eh sao para pra por com sem me te se ao aos isso esse essa este esta vou quero queria gostaria saber ter tem tenho voce voces vcs oi ola bom boa dia tarde noite sobre mais menos meu minha teu tua nossa seu sua the of".split(
    /\s+/,
  ),
);

function toks(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export type MatchInput = {
  trigger_questions?: string[] | null;
  category?: string | null;
  technique?: string | null;
  strategy?: string | null;
  answer?: string | null;
};

// Campos com pesos: um gatilho vale mais que uma menção solta na resposta.
function haystack(e: MatchInput): { toks: string[]; weight: number }[] {
  return [
    { toks: toks((e.trigger_questions ?? []).join(" ")), weight: 3 },
    { toks: toks(e.category ?? ""), weight: 2 },
    { toks: toks(e.technique ?? ""), weight: 1.5 },
    { toks: toks(e.strategy ?? ""), weight: 1 },
    { toks: toks(e.answer ?? ""), weight: 0.6 },
  ];
}

function fieldScore(qtok: string, field: string[]): number {
  for (const w of field) {
    if (w === qtok) return 1; // igual
  }
  if (qtok.length >= 4) {
    for (const w of field) {
      if (w.startsWith(qtok) || qtok.startsWith(w) || w.includes(qtok))
        return 0.5; // parcial
    }
  }
  return 0;
}

export function matchEntries<T extends MatchInput>(
  query: string,
  entries: T[],
  limit = 4,
): T[] {
  const q = [...new Set(toks(query))];
  if (q.length === 0) return [];
  return entries
    .map((e) => {
      const fields = haystack(e);
      let score = 0;
      for (const qtok of q) {
        let best = 0;
        for (const f of fields) best = Math.max(best, fieldScore(qtok, f.toks) * f.weight);
        score += best;
      }
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}

// Lista de categorias distintas (para navegação quando o casamento vem vazio).
export function distinctCategories(entries: MatchInput[]): string[] {
  return [...new Set(entries.map((e) => (e.category ?? "").trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );
}
