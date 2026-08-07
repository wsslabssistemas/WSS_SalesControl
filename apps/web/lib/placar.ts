// O PLACAR DA EQUIPE — sem banco e sem imports.
//
// Pedido do fundador, com a referência do piloto no Base44: uma tela de
// "Performance por Vendedor" com atendimentos, visitas, trials, atrasados,
// clientes e um percentual de conversão.
//
// A IDEIA É BOA E O RECORTE DELA ESTAVA ERRADO — e o motivo não é opinião
// minha, é a régua que o próprio fundador impôs. Na captura que ele mandou,
// uma vendedora aparece com "27 atendimentos · 0% conversão" em vermelho.
// Isso não é evidência de nada: é o mesmo n pequeno que derrubou o ranking de
// escolas de venda em ago/2026, quando Cialdini "liderou" com 1 fechamento em
// 53 pessoas. Tabela bonita com n pequeno é o folclore que este produto existe
// para não repetir — e é mais perigosa vinda de nós, porque tem cara de dado.
//
// AS TRÊS REGRAS DESTA PEÇA:
//
// 1. **O TIME VEM PRIMEIRO.** Onde a comissão é coletiva — o caso da Be
//    Fitness —, o número que cobra é o do time. O individual existe para a
//    pessoa se situar dentro dele, não para ranquear gente.
//
// 2. **COMPORTAMENTO EM DESTAQUE, RESULTADO COM RESSALVA.** Atendimentos,
//    tempo de resposta e combinados cumpridos são coisas que o vendedor
//    CONTROLA — ele pode melhorar hoje. Conversão depende de origem do lead,
//    ticket e sorte. Cobrar resultado que a pessoa não controla produz
//    desânimo, não esforço.
//
// 3. **CONVERSÃO SÓ COM n QUE SUSTENTA, E SEMPRE COM O n AO LADO.** Abaixo do
//    piso, a tela diz "amostra pequena" em vez de mostrar um percentual —
//    porque um percentual, uma vez mostrado, é lido como verdade.
//
// O QUE NÃO ENTRA, de propósito: "atrasados" em vermelho para todo mundo. Na
// captura do piloto os três vendedores tinham atraso, o que transforma o
// alarme em paisagem. Atraso entra como número neutro, ao lado dos outros.

/** Abaixo disto, conversão não vira percentual. */
export const N_MINIMO_CONVERSAO = 30;

export type Atendimento = {
  ownerId: string | null;
  /** Momento da mensagem do cliente, para medir a resposta. */
  entradaISO: string;
  /** Momento da resposta, quando houve. */
  respostaISO: string | null;
};

export type ContatoDoPlacar = {
  ownerId: string | null;
  /** Está numa etapa `won`. */
  ganho: boolean;
  /** Combinado com data marcada que já venceu e não foi cumprido. */
  combinadoAtrasado: boolean;
  /** Entrou no período que está sendo medido. */
  novoNoPeriodo: boolean;
};

export type LinhaDoPlacar = {
  ownerId: string;
  nome: string;
  atendimentos: number;
  leads: number;
  fechamentos: number;
  combinadosAtrasados: number;
  /** Mediana em minutos. `null` quando não houve resposta medida. */
  respostaMediana: number | null;
  /** `null` quando a amostra não sustenta — e aí a tela diz isso. */
  conversao: number | null;
  /** O n em cima do qual a conversão foi (ou não foi) calculada. */
  nConversao: number;
};

export type Placar = {
  time: LinhaDoPlacar;
  pessoas: LinhaDoPlacar[];
};

/** Mediana, nunca média — é a métrica canônica do projeto. */
function mediana(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function montar(
  ownerId: string,
  nome: string,
  atendimentos: Atendimento[],
  contatos: ContatoDoPlacar[],
): LinhaDoPlacar {
  const minutos = atendimentos
    .filter((a) => a.respostaISO)
    .map((a) => Math.round((Date.parse(a.respostaISO!) - Date.parse(a.entradaISO)) / 60000))
    .filter((n) => n >= 0);

  const leads = contatos.filter((c) => c.novoNoPeriodo).length;
  const fechamentos = contatos.filter((c) => c.ganho).length;

  // A CONTA CANÔNICA: convertidos distintos ÷ LEADS do período. Nunca ÷
  // atendimentos — dois atendimentos da mesma pessoa não são duas chances.
  const sustenta = leads >= N_MINIMO_CONVERSAO;

  return {
    ownerId,
    nome,
    atendimentos: atendimentos.length,
    leads,
    fechamentos,
    combinadosAtrasados: contatos.filter((c) => c.combinadoAtrasado).length,
    respostaMediana: mediana(minutos),
    conversao: sustenta ? Math.round((fechamentos / leads) * 1000) / 10 : null,
    nConversao: leads,
  };
}

export function computePlacar(
  membros: { id: string; nome: string }[],
  atendimentos: Atendimento[],
  contatos: ContatoDoPlacar[],
): Placar {
  const time = montar("time", "A equipe", atendimentos, contatos);

  const pessoas = membros
    .map((m) =>
      montar(
        m.id,
        m.nome,
        atendimentos.filter((a) => a.ownerId === m.id),
        contatos.filter((c) => c.ownerId === m.id),
      ),
    )
    // Ordena por ATENDIMENTO, não por conversão. Ordenar por resultado com
    // amostra pequena inventa um pódio — e o primeiro lugar de hoje é ruído.
    .sort((a, b) => b.atendimentos - a.atendimentos || a.nome.localeCompare(b.nome, "pt-BR"));

  return { time, pessoas };
}

/** Texto pronto para o lugar do percentual quando a amostra não sustenta. */
export const semAmostra = (n: number) =>
  `${n} de ${N_MINIMO_CONVERSAO} — amostra pequena para %`;
