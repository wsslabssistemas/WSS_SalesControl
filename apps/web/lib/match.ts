// Casamento por palavra-chave (sem IA): escolhe QUAIS entradas da biblioteca
// entram no contexto do motor. Não é busca acessória — desde que a trava
// anti-invenção virou estrutural, **a 1ª entrada é quem veta**: ela decide o
// que o motor pode e não pode afirmar. Errar o 1º lugar não deixa a resposta
// só pior, deixa a resposta bloqueada pelo contrato da entrada errada.
//
// `custa` e `custam` NÃO entram no STOP: são o sinal mais forte de uma pergunta
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

/** Pesos por campo: um gatilho vale mais que uma menção solta na resposta. */
const PESO = { gatilho: 3, categoria: 2, tecnica: 1.5, estrategia: 1, resposta: 0.6 };

/**
 * TETO DA PROSA — o achado que fechou o ruído de ranking.
 *
 * `strategy` e `answer` são textos longos. Cada palavra da mensagem que
 * encostava neles somava sem limite, então uma entrada que **fala do assunto**
 * passava na frente da entrada que **responde a pergunta**: bastavam seis
 * palavras banais espalhadas por seis linhas de prosa contra três palavras
 * certas num gatilho. Medido: zerando a prosa, os 23 casos do
 * `retrieval_check` iam para o 1º lugar; com ela solta, três caíam para 2º.
 *
 * Zerar seria pior — é a prosa que segura o recall quando ninguém escreveu
 * gatilho para aquela pergunta, e recall alto é o que o casamento promete.
 * Então ela satura: cresce, nunca passa do teto, e mantém a ordem entre
 * entradas que só casaram por prosa. Prosa desempata; não decide.
 */
const TETO_PROSA = 2;
const satura = (x: number) => (TETO_PROSA * x) / (TETO_PROSA + x);

type Documento = {
  /** Um saco de palavras POR GATILHO, não um saco só. Ver `melhorGatilho`. */
  gatilhos: string[][];
  categoria: string[];
  tecnica: string[];
  estrategia: string[];
  resposta: string[];
  /** Tudo junto — só para contar em quantas entradas um termo aparece. */
  tudo: string[];
};

function documento(e: MatchInput): Documento {
  const gatilhos = (e.trigger_questions ?? []).map((g) => toks(g));
  const categoria = toks(e.category ?? "");
  const tecnica = toks(e.technique ?? "");
  const estrategia = toks(e.strategy ?? "");
  const resposta = toks(e.answer ?? "");
  return {
    gatilhos,
    categoria,
    tecnica,
    estrategia,
    resposta,
    tudo: [...gatilhos.flat(), ...categoria, ...tecnica, ...estrategia, ...resposta],
  };
}

/** Casamento de um termo com um campo: exato vale 1, parcial vale 0,5. */
function fieldScore(qtok: string, campo: string[]): number {
  for (const w of campo) if (w === qtok) return 1;
  if (qtok.length >= 4) {
    for (const w of campo) {
      if (w.startsWith(qtok) || qtok.startsWith(w) || w.includes(qtok)) return 0.5;
    }
  }
  return 0;
}

/**
 * O PESO DE CADA TERMO — termo raro decide, termo comum não.
 *
 * Sem isto, "como" valia o mesmo que "importado". É a frequência inversa
 * clássica, calculada sobre as entradas daquela consulta: quanto menos
 * entradas contêm o termo, mais ele pesa. Nunca zera — palavra comum continua
 * contando, só para de decidir sozinha.
 */
function pesosDeTermo(docs: Documento[]): (w: string) => number {
  const n = docs.length || 1;
  const df = new Map<string, number>();
  for (const d of docs) {
    for (const w of new Set(d.tudo)) df.set(w, (df.get(w) ?? 0) + 1);
  }
  const cache = new Map<string, number>();
  return (w: string) => {
    let v = cache.get(w);
    if (v === undefined) {
      v = Math.log(1 + n / (1 + (df.get(w) ?? 0)));
      cache.set(w, v);
    }
    return v;
  };
}

/**
 * O GATILHO É UMA FRASE — e o que importa é QUANTO DELE a mensagem contém.
 *
 * Esta é a correção de fundo. Antes, todos os gatilhos viravam um saco único de
 * palavras e a pontuação só olhava numa direção: quantas palavras da mensagem
 * encostavam em algum lugar da entrada. Com isso, uma entrada com 7 gatilhos
 * acumulava palavras espalhadas por gatilhos sem relação entre si e vencia
 * quem tinha a frase certa.
 *
 * O caso real: *"recebi a amostra e o desenvolvimento aprovou, mas o importado
 * sai bem mais barato"*. A entrada de INDECISÃO tem o gatilho "e se o lote nao
 * sair como a amostra" — a mensagem cobre 2 das 5 palavras dele. A entrada
 * certa tem "o importado e mais barato" — a mensagem cobre **todas**.
 * Olhando só a direção mensagem→entrada, as duas empatam em quantidade. Olhando
 * a cobertura do gatilho, uma é paráfrase quase literal e a outra é
 * coincidência de vocabulário.
 *
 * Por isso a nota do gatilho é `massa casada × cobertura`: recompensa o gatilho
 * inteiro reconhecido, não o pedaço. E escrever mais gatilhos continua
 * melhorando o recall sem inflar nota nenhuma — cada um é avaliado sozinho.
 */
function notaDoGatilho(
  gatilhos: string[][],
  q: string[],
  idf: (w: string) => number,
): number {
  let melhor = 0;
  for (const g of gatilhos) {
    if (!g.length) continue;
    let casada = 0;
    let total = 0;
    for (const w of g) {
      const peso = idf(w);
      total += peso;
      // Bidirecional: a palavra DO GATILHO é procurada na mensagem.
      casada += fieldScore(w, q) * peso;
    }
    if (!total) continue;
    melhor = Math.max(melhor, casada * (casada / total));
  }
  return melhor;
}

export type Ranqueada<T> = { entry: T; score: number };

/**
 * Todas as entradas que casaram, da melhor para a pior.
 *
 * Exportada para o teste determinístico (`retrieval_check.mjs`) usar ESTA
 * implementação em vez de manter uma cópia — cópia diverge em silêncio e o
 * teste passa a medir um algoritmo que não está no ar.
 */
export function rankEntries<T extends MatchInput>(query: string, entries: T[]): Ranqueada<T>[] {
  const q = [...new Set(toks(query))];
  if (q.length === 0) return [];

  const docs = entries.map(documento);
  const idf = pesosDeTermo(docs);

  return entries
    .map((entry, i) => {
      const d = docs[i];
      // Rótulos e prosa pontuam na direção mensagem→entrada: ali não existe
      // frase a cobrir. A diferença é que rótulo é curto e específico
      // (`category`, `technique`), então soma direto; prosa é longa e satura.
      const rotulos: [string[], number][] = [
        [d.categoria, PESO.categoria],
        [d.tecnica, PESO.tecnica],
      ];
      const prosa: [string[], number][] = [
        [d.estrategia, PESO.estrategia],
        [d.resposta, PESO.resposta],
      ];

      let score = PESO.gatilho * notaDoGatilho(d.gatilhos, q, idf);
      let somaProsa = 0;
      for (const t of q) {
        let rotulo = 0;
        for (const [campo, peso] of rotulos) rotulo = Math.max(rotulo, fieldScore(t, campo) * peso);
        let texto = 0;
        for (const [campo, peso] of prosa) texto = Math.max(texto, fieldScore(t, campo) * peso);
        score += rotulo * idf(t);
        somaProsa += texto * idf(t);
      }
      return { entry, score: score + satura(somaProsa) };
    })
    .filter((x) => x.score > 0)
    // Desempate pelo texto da própria entrada, não pela ordem em que o banco
    // devolveu: empate resolvido por acaso faz o 1º lugar — que é quem veta —
    // mudar entre duas execuções iguais.
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.entry.category ?? "").localeCompare(b.entry.category ?? "", "pt-BR") ||
        (a.entry.technique ?? "").localeCompare(b.entry.technique ?? "", "pt-BR"),
    );
}

export function matchEntries<T extends MatchInput>(query: string, entries: T[], limit = 4): T[] {
  return rankEntries(query, entries)
    .slice(0, limit)
    .map((x) => x.entry);
}

// Lista de categorias distintas (para navegação quando o casamento vem vazio).
export function distinctCategories(entries: MatchInput[]): string[] {
  return [...new Set(entries.map((e) => (e.category ?? "").trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );
}
