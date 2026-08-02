// Preço sugerido por empresa — o cálculo, sem banco e sem imports.
//
// O QUE ESTA PEÇA NÃO FAZ, e por quê.
//
// O pedido original era um "score de potencial": ler uso, porte e **conversão
// observada no trial** e prever quanto a empresa suporta pagar. A conversão
// observada não existe — são 0 desfechos registrados no banco, o mesmo bloqueio
// que congelou o M2. Um score alimentado por esse buraco não sairia impreciso:
// sairia **inventado**, com cara de número, decidindo preço de cliente real.
// Dashboard errado atrapalha; preço errado cobra.
//
// Então aqui não existe previsão. Existem três coisas, todas medidas:
//
//   1. um PISO, que é aritmética pura sobre o custo de IA já gasto;
//   2. uma SUGESTÃO, que é a política de preço do fundador aplicada ao porte
//      observado — a política é dele, a conta é nossa;
//   3. uma RECUSA, quando a janela observada não sustenta nem uma coisa nem
//      outra. É a mesma doutrina da trava anti-invenção: falta fato, não
//      redige.
//
// A unidade é atendimento/mês porque essa decisão já está fechada no CLAUDE.md
// ("cobrança por atendimentos/mês, nunca por tokens").

/** O que a plataforma mediu da empresa. Tudo observável hoje. */
export type Observado = {
  /** Membros ativos (o `membership` com papel de vendedor é o proxy de porte). */
  membros: number;
  contatos: number;
  /** Atendimentos registrados na janela — a unidade de cobrança. */
  atendimentos: number;
  /** Custo de IA na janela, em centavos. */
  custoIaCents: number;
  /** Dias entre o primeiro sinal de uso e hoje. */
  diasObservados: number;
};

/**
 * A POLÍTICA DE PREÇO — do fundador, não do sistema.
 *
 * Estes números são decisão comercial e ficam visíveis e editáveis na tela.
 * O sistema não tem opinião sobre quanto vale o produto; ele garante que a
 * conta feche e que ninguém venda abaixo do custo sem perceber.
 */
export type Politica = {
  /** Fração da receita que precisa sobrar depois do custo de IA. 0,8 = 80%. */
  margemAlvo: number;
  /** Quanto se cobra por atendimento/mês, em centavos. */
  centsPorAtendimento: number;
  /** Nenhum contrato sai abaixo disto, por menor que seja a empresa. */
  minimoContratoCents: number;
};

export const POLITICA_PADRAO: Politica = {
  margemAlvo: 0.8,
  // Ancorado no número medido em ago/2026: ~R$ 0,25 de custo por resposta.
  // A 80% de margem, R$ 1,25 por atendimento fecha a conta com folga.
  centsPorAtendimento: 125,
  minimoContratoCents: 19900,
};

/**
 * O MÍNIMO PARA FALAR EM PREÇO.
 *
 * Menos que três semanas não tem forma mensal — um pico de segunda-feira vira
 * projeção de mês inteiro. E menos de 30 atendimentos é anedota: a média de um
 * punhado de eventos não descreve empresa nenhuma.
 */
export const MIN_DIAS = 21;
export const MIN_ATENDIMENTOS = 30;
/** Acima disto a janela já tem forma de mês e a projeção para de ser chute. */
export const DIAS_CONFIANTE = 60;
export const ATENDIMENTOS_CONFIANTE = 200;

export type Sugestao =
  | {
      tipo: "insuficiente";
      /** O que impede — em português, para aparecer na tela. */
      motivos: string[];
      /** O piso sai mesmo assim quando já houve custo: custo é fato, não projeção. */
      pisoCents: number | null;
    }
  | {
      tipo: "faixa";
      confianca: "media" | "alta";
      /** Abaixo disto a empresa dá prejuízo na margem alvo. */
      pisoCents: number;
      sugeridoCents: number;
      /** Onde o preço encosta no que o porte observado justifica. */
      tetoCents: number;
      atendimentosMes: number;
      custoIaMesCents: number;
      /** Qual dos três termos ditou o preço: `piso`, `porte` ou `mínimo`. */
      governadoPor: string;
      /** Cada linha explica de onde saiu um número. Sem isto é palpite com CSS. */
      base: string[];
    };

const porMes = (valor: number, dias: number) => (dias > 0 ? (valor * 30) / dias : 0);

/**
 * ARREDONDAMENTO — duas regras, porque um piso não é um preço.
 *
 * `aproximar` serve para o que é derivado de conta: R$ 247,30 vira R$ 250 e
 * ninguém se ofende. `paraCima` é para o PISO, que só arredonda numa direção —
 * piso arredondado para baixo deixa de ser piso, e a diferença some no meio de
 * um número que continua parecendo certo.
 *
 * E o que o fundador ESCREVEU não se arredonda de jeito nenhum: R$ 199 é um
 * ponto de preço escolhido, não o resultado de uma divisão. Arredondar para
 * R$ 200 é o sistema editando a política de quem manda nela.
 */
const aproximar = (cents: number) => Math.round(cents / 1000) * 1000;
const paraCima = (cents: number) => Math.ceil(cents / 1000) * 1000;

export function sugerirPreco(o: Observado, p: Politica = POLITICA_PADRAO): Sugestao {
  const custoMes = porMes(o.custoIaCents, o.diasObservados);

  // Piso: a receita mínima para o custo de IA caber dentro de (1 − margem).
  //
  // Em pontos-base, e não com `1 - margemAlvo`, por um motivo concreto: em
  // ponto flutuante `1 - 0.8` é `0.19999999999999996`, e a divisão devolvia
  // R$ 500,00000000001 — que, arredondado para cima, virava R$ 510. Dez reais
  // por empresa por mês, saídos do nada, num número que continua parecendo
  // certo. Percentual de política é decimal exato; a conta é inteira.
  const restanteBp = 10000 - Math.round(p.margemAlvo * 10000);
  const piso = restanteBp > 0 ? Math.ceil((custoMes * 10000) / restanteBp) : Infinity;
  const temCusto = o.custoIaCents > 0 && o.diasObservados > 0;

  const motivos: string[] = [];
  if (o.diasObservados < MIN_DIAS) {
    motivos.push(
      `só ${o.diasObservados} ${o.diasObservados === 1 ? "dia" : "dias"} de uso observado ` +
        `(o mínimo para ter forma de mês é ${MIN_DIAS})`,
    );
  }
  if (o.atendimentos < MIN_ATENDIMENTOS) {
    motivos.push(
      `${o.atendimentos} ${o.atendimentos === 1 ? "atendimento registrado" : "atendimentos registrados"} ` +
        `(o mínimo para a média significar algo é ${MIN_ATENDIMENTOS})`,
    );
  }
  if (motivos.length) {
    return { tipo: "insuficiente", motivos, pisoCents: temCusto ? paraCima(piso) : null };
  }

  const atendimentosMes = porMes(o.atendimentos, o.diasObservados);
  const porPorte = atendimentosMes * p.centsPorAtendimento;
  const real = (c: number) => (c / 100).toFixed(2).replace(".", ",");

  // TRÊS TERMOS DISPUTAM O PREÇO, e qual deles venceu é informação — não
  // detalhe de implementação. "R$ 500" não diz nada; "R$ 500 porque o custo de
  // IA desta empresa é alto para o porte dela" muda a conversa de venda.
  const termos = [
    {
      origem: "piso",
      exato: piso,
      arredondado: paraCima(piso),
      explica: `o custo de IA (${real(custoMes)}/mês) não cabe em ${Math.round((1 - p.margemAlvo) * 100)}% da receita abaixo disso`,
    },
    {
      origem: "porte",
      exato: porPorte,
      arredondado: aproximar(porPorte),
      explica: `${Math.round(atendimentosMes)} atendimentos/mês × ${real(p.centsPorAtendimento)} por atendimento`,
    },
    {
      origem: "mínimo",
      exato: p.minimoContratoCents,
      // Número escrito pelo fundador entra inteiro: R$ 199 não vira R$ 200.
      arredondado: p.minimoContratoCents,
      explica: `o porte observado justificaria ${real(porPorte)} — quem manda é o mínimo de contrato`,
    },
  ];
  const vencedor = termos.reduce((a, b) => (b.exato > a.exato ? b : a));
  // Rede de segurança: nada sai abaixo do piso, nem por arredondamento.
  const sugerido = Math.max(vencedor.arredondado, paraCima(piso));

  // O teto não é "o quanto dá para espremer": é até onde o porte OBSERVADO
  // justifica. Passar disso é cobrar por uso que ainda não aconteceu.
  const teto = Math.max(sugerido, aproximar(porPorte * 1.3));

  const confianca =
    o.diasObservados >= DIAS_CONFIANTE && o.atendimentos >= ATENDIMENTOS_CONFIANTE ? "alta" : "media";

  return {
    tipo: "faixa",
    confianca,
    pisoCents: paraCima(piso),
    sugeridoCents: sugerido,
    tetoCents: teto,
    atendimentosMes: Math.round(atendimentosMes),
    custoIaMesCents: Math.round(custoMes),
    governadoPor: vencedor.origem,
    base: [
      `${o.atendimentos} atendimentos em ${o.diasObservados} dias → ${Math.round(atendimentosMes)}/mês`,
      `quem governa este preço: ${vencedor.origem} — ${vencedor.explica}`,
      ...termos.filter((t) => t !== vencedor).map((t) => `${t.origem}: ${real(t.exato)}`),
    ],
  };
}

/**
 * A margem que um preço realmente entrega, dado o custo observado.
 * Serve para conferir um preço já praticado, não só para sugerir um novo.
 */
export function margemDe(precoCents: number, custoIaMesCents: number): number | null {
  if (precoCents <= 0) return null;
  return (precoCents - custoIaMesCents) / precoCents;
}
