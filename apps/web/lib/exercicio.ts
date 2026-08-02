// O exercício de fim de módulo — a montagem, sem banco e sem imports do app.
//
// A ARQUITETURA QUE O CURSO PROMETE: a teoria é uma só, o exemplo é do ramo, o
// exercício é da empresa. As lições não sabem o que é barbearia; esta função
// monta, para o módulo que a pessoa acabou de terminar, uma situação REAL do
// segmento dela — tirada da biblioteca curada — e junta os fatos que a empresa
// dela cadastrou no DNA.
//
// A escolha da entrada é DETERMINÍSTICA (nada de aleatório): o mesmo aluno, no
// mesmo módulo, reencontra a mesma situação ao voltar. Exercício que troca
// sozinho impede comparar o que ele escreveu antes com o que escreve agora — e
// essa comparação é metade do valor de refazer.

export type EntradaDaBiblioteca = {
  category: string;
  school: string | null;
  trigger_questions: string[] | null;
  strategy: string | null;
  technique: string | null;
  common_errors: string[] | null;
  next_objective: string | null;
  required_facts: string[] | null;
};

export type Exercicio = {
  /** A mensagem do cliente, com o vocabulário do ramo. */
  situacao: string;
  /** Identifica a entrada escolhida, para o registro do que foi feito. */
  entryRef: string;
  categoria: string;
  escola: string | null;
  /** O que a biblioteca recomenda — só aparece DEPOIS de o aluno escrever. */
  recomendacao: {
    estrategia: string;
    tecnica: string;
    erros: string[];
    proximoPasso: string;
  };
  /** Fatos que esta situação exige, cruzados com o DNA da empresa. */
  fatos: { caminho: string; tem: boolean }[];
  /** Os pontos que o aluno marca em si mesmo. Derivados da entrada, não genéricos. */
  autoavaliacao: string[];
};

/**
 * Escolhe a entrada que melhor representa o módulo para este segmento.
 *
 * Ordem de preferência, e cada degrau tem motivo:
 *   1. entrada cuja ESCOLA é a do módulo — é o que o módulo acabou de ensinar;
 *   2. entrada da categoria que o módulo mais trabalha;
 *   3. qualquer uma com gatilho escrito, para nunca cair em tela vazia.
 *
 * O desempate é pelo texto, não pela ordem do banco: a mesma pessoa tem que
 * reencontrar a mesma situação.
 */
export function escolherEntrada(
  entradas: EntradaDaBiblioteca[],
  moduloSchool: string | null,
  categoriasDoModulo: string[],
  evitar: string[] = [],
): EntradaDaBiblioteca | null {
  const comGatilho = entradas.filter((e) => (e.trigger_questions ?? []).some((t) => t && t.trim()));
  if (!comGatilho.length) return null;

  const ordenar = (lista: EntradaDaBiblioteca[]) =>
    [...lista].sort((a, b) => (a.technique ?? "").localeCompare(b.technique ?? "", "pt-BR"));

  // NÃO REPETIR A MESMA SITUAÇÃO EM DOIS MÓDULOS.
  //
  // Com 20 entradas para 9 módulos, o encaixe por categoria colide: na
  // indústria os módulos 5, 7 e 9 caíam todos em "Quando pedir de novo?".
  // Um curso que faz a mesma pergunta três vezes ensina que o exercício é
  // enfeite. `evitar` traz o que os módulos anteriores já usaram — e cede
  // quando a biblioteca acaba, porque repetir é ruim e tela vazia é pior.
  const usada = new Set(evitar);
  const preferir = (lista: EntradaDaBiblioteca[]) => {
    const novas = lista.filter((e) => !usada.has(refDaEntrada(e)));
    return ordenar(novas.length ? novas : lista);
  };

  const porEscola = moduloSchool ? comGatilho.filter((e) => e.school === moduloSchool) : [];
  if (porEscola.length) return preferir(porEscola)[0];

  // A ordem das categorias importa: ela vem da frequência com que as lições do
  // módulo puxam cada uma. A categoria que o módulo mais trabalha ganha.
  for (const cat of categoriasDoModulo) {
    const daCategoria = comGatilho.filter((e) => e.category === cat);
    if (daCategoria.length) {
      const escolhida = preferir(daCategoria)[0];
      if (!usada.has(refDaEntrada(escolhida))) return escolhida;
    }
  }
  const porCategoria = comGatilho.filter((e) => categoriasDoModulo.includes(e.category));
  if (porCategoria.length) return preferir(porCategoria)[0];

  return preferir(comGatilho)[0];
}

/** Identidade estável de uma entrada, para não repetir nem quebrar com recarga. */
export const refDaEntrada = (e: EntradaDaBiblioteca) =>
  `${e.category}:${e.technique ?? ""}`.slice(0, 200);

/**
 * O gatilho vira mensagem de cliente.
 *
 * A primeira versão pegava o PRIMEIRO gatilho e colava "?" no fim. Resultado
 * real: `"Vou pensar?"` — que não é pergunta, e é curto demais para dar o que
 * responder. Duas correções:
 *
 * • pega o gatilho MAIS LONGO, que é o mais próximo de uma frase que alguém
 *   digitaria de verdade ("e se o lote nao sair como a amostra" em vez de
 *   "vou pensar");
 * • só marca interrogação quando a frase realmente pergunta. Pontuação
 *   inventada é invenção pequena, e invenção pequena é o que esta casa não faz.
 */
const INTERROGATIVAS = /^(qual|quais|quanto|quanta|quantos|como|quando|onde|quem|por que|porque|e se|tem |da |voces|voce|posso|aceita|fazem|faz |consegue|conseguem|sera)/i;

function comoMensagem(gatilho: string): string {
  const t = gatilho.trim();
  if (!t) return "";
  const texto = t[0].toUpperCase() + t.slice(1);
  if (/[.?!]$/.test(texto)) return texto;
  return INTERROGATIVAS.test(t) ? `${texto}?` : texto;
}

/** `reduzir_risco` → `reduzir risco`. Chave é para o motor; texto é para gente. */
const legivel = (v: string) => v.replace(/_/g, " ");

/**
 * Os pontos de autoavaliação saem da PRÓPRIA entrada, nunca de uma lista
 * genérica. "Você foi cordial?" não ensina nada; "você deixou de repetir o
 * argumento do começo?" é a regra dura daquela situação, e o aluno consegue
 * responder olhando o que escreveu.
 */
function pontos(e: EntradaDaBiblioteca): string[] {
  const out: string[] = [];
  if (e.next_objective) out.push(`Minha resposta leva ao próximo passo: ${legivel(e.next_objective)}`);
  for (const erro of (e.common_errors ?? []).slice(0, 3)) out.push(`Evitei este erro: ${erro}`);
  if (e.technique) out.push(`Apliquei a técnica: ${e.technique}`);
  return out;
}

export function montarExercicio(
  entradas: EntradaDaBiblioteca[],
  moduloSchool: string | null,
  categoriasDoModulo: string[],
  dna: Record<string, unknown> | null | undefined,
  temFato: (dna: Record<string, unknown> | null | undefined, caminho: string) => boolean,
  evitar: string[] = [],
): Exercicio | null {
  const e = escolherEntrada(entradas, moduloSchool, categoriasDoModulo, evitar);
  if (!e) return null;

  // O mais longo: é o que mais se parece com uma mensagem de verdade.
  const gatilho = [...(e.trigger_questions ?? [])]
    .filter((t) => t && t.trim())
    .sort((a, b) => b.trim().length - a.trim().length || a.localeCompare(b, "pt-BR"))[0] ?? "";

  return {
    situacao: comoMensagem(gatilho),
    entryRef: refDaEntrada(e),
    categoria: e.category,
    escola: e.school,
    recomendacao: {
      estrategia: e.strategy ?? "",
      tecnica: e.technique ?? "",
      erros: e.common_errors ?? [],
      proximoPasso: e.next_objective ? legivel(e.next_objective) : "",
    },
    // O DNA entra aqui como FATO, não como enfeite: é o que separa este
    // exercício de um exercício de curso genérico. Quando o fato falta, a tela
    // diz que falta — o aluno descobre um buraco do próprio cadastro fazendo
    // uma aula, que é a melhor hora possível para descobrir.
    fatos: (e.required_facts ?? []).map((caminho) => ({ caminho, tem: temFato(dna, caminho) })),
    autoavaliacao: pontos(e),
  };
}
