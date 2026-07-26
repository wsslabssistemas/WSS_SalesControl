// Casamento por palavra-chave (sem IA): pontua a sobreposição de palavras
// entre a mensagem colada e a pergunta/categoria de cada entrada da biblioteca.
const STOP = new Set(
  "a o e de da do das dos em no na nos nas um uma uns umas que qual quais quanto quanta quantos custa custam e eh sao para pra por com sem me te se ao aos das isso esse essa este esta vou quero queria gostaria saber ter tem tenho voce voces vcs oi ola bom boa dia tarde noite sobre mais menos meu minha teu tua nossa seu sua the".split(
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

export function matchEntries<
  T extends { pergunta: string; category?: string | null },
>(query: string, entries: T[], limit = 4): T[] {
  const q = new Set(toks(query));
  if (q.size === 0) return [];
  return entries
    .map((e) => {
      const et = toks(`${e.pergunta} ${e.category ?? ""}`);
      let score = 0;
      for (const w of et) if (q.has(w)) score++;
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}
