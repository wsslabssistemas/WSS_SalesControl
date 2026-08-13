// A RENOVAÇÃO — quem está perto de vencer, e o que dizer em cada janela.
//
// Sem banco e sem imports, para ser testável em Node puro.
//
// O PEDIDO DO FUNDADOR, e ele já trouxe a parte difícil junto: *"tentar
// interagir com o cliente no mês ou x tempo antes de vencer, para não fazer o
// contato apenas quando está por vencer."* É exatamente a diferença entre
// renovar e cobrar.
//
// POR QUE TRÊS JANELAS E NÃO UM ALERTA. Contato único no vencimento chega no
// pior momento possível: a pessoa já decidiu, e a conversa vira negociação de
// preço sob pressão de prazo — o terreno onde o cliente ganha e a margem
// perde. Três toques com ÂNGULOS DIFERENTES é a mesma estrutura de cadência
// que o produto já usa em todo lugar (Blount), aplicada ao fim do contrato.
//
// A REGRA QUE MAIS IMPORTA, e que quase todo sistema erra: **o primeiro toque
// não fala de renovação.** Ele fala do RESULTADO. Renovação vendida em cima de
// um ganho que o cliente acabou de reconhecer é outra conversa — e quem só
// aparece para cobrar assinatura ensina o cliente a lembrar do produto como
// despesa.
//
// O QUE ESTA PEÇA NÃO FAZ: prever se ele vai renovar. Não existe conversão
// observada de renovação no banco — zero contratos com vencimento registrado
// até hoje. Um score aqui sairia inventado, e a casa já decidiu que número
// inventado com cara de número é pior que campo vazio.

/**
 * ⚠ O TEXTO DE CADA JANELA VEM DO MANIFESTO. Isto aqui é o PISO.
 *
 * Estas frases nasceram com a academia e ficaram sendo lidas por todo mundo:
 * *"pergunte o que ele já conseguiu que não conseguia"* é excelente para um
 * aluno e é constrangedor num contrato de fornecimento de feltro. Prosa de
 * venda escrita no núcleo é a Lei 1 vazando — e vazando no lugar mais caro,
 * porque é o texto que a IA recebe como instrução.
 *
 * Hoje cada segmento com `contract.enabled` declara `contract.renewal` no
 * manifesto, e `renovacao_check.mjs` exige isso. O que sobra aqui é o padrão
 * NEUTRO: ele não fala de plano, aluno nem resultado pessoal — fala de
 * contrato, que é vocabulário do núcleo. Se um segmento novo esquecer de
 * declarar, o motor continua funcionando e dizendo algo verdadeiro, em vez de
 * dizer algo de outro ramo.
 *
 * A ESTRUTURA continua sendo do núcleo, e é ela que carrega a técnica: três
 * janelas com ângulos diferentes (Blount), e **o primeiro toque não fala de
 * renovação** — fala do resultado. Isso não é opinião de segmento, é o que
 * separa renovar de cobrar.
 */
export const JANELAS = [
  {
    key: "resultado",
    diasAntes: 60,
    titulo: "Falar do resultado",
    intencao:
      "NÃO mencione renovação. Pergunte o que o contrato já entregou na prática — e registre a resposta. É esse texto que vai sustentar a conversa daqui a um mês.",
  },
  {
    key: "continuidade",
    diasAntes: 30,
    titulo: "Abrir a continuidade",
    intencao:
      "Retome o ganho que ele mesmo disse e projete o próximo ciclo. Aqui a renovação entra como continuação, não como cobrança.",
  },
  {
    key: "condicao",
    diasAntes: 7,
    titulo: "Fechar com condição concreta",
    intencao:
      "Data, valor e forma de pagamento, com o que existir de verdade no DNA. Sem condição concreta, o vencimento passa e vira cancelamento por inércia.",
  },
] as const;

export type Janela = (typeof JANELAS)[number]["key"];

/**
 * O que o SEGMENTO diz em cada janela — declarado em `contract.renewal`.
 *
 * `dias_antes` também é do segmento: academia renova mês a mês e 60 dias é
 * cedo demais; contrato de fornecimento tem aviso prévio e 60 dias é em cima
 * da hora. O núcleo decide QUANDO comparar; o manifesto decide o quê e a que
 * distância.
 */
export type RenewalConfig = {
  vencido?: { titulo?: string; intencao?: string };
  janelas?: { key: Janela; dias_antes?: number; titulo?: string; intencao?: string }[];
};

export type ContatoComContrato = {
  id: string;
  name: string;
  phone: string | null;
  journey_stage: string;
  contract_end: string | null;
};

export type Renovacao = {
  contactId: string;
  name: string;
  phone: string | null;
  /** Dias até vencer. Negativo = já venceu. */
  diasParaVencer: number;
  janela: Janela;
  titulo: string;
  intencao: string;
  /** Já passou da data. É o caso mais caro e por isso vem primeiro. */
  vencido: boolean;
};

const diaISO = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Quem precisa de um toque de renovação hoje.
 *
 * `foraDeJogo` são as etapas de perda e as finais: quem já saiu não recebe
 * conversa de renovação. Vencido entra na lista mesmo assim — e no topo —
 * porque contrato que venceu sem ninguém falar é a perda mais barata de
 * evitar e a mais constrangedora de descobrir depois.
 */
export function computeRenovacoes(
  contatos: ContatoComContrato[],
  foraDeJogo: Set<string>,
  hoje: Date = new Date(),
  renewal?: RenewalConfig | null,
): Renovacao[] {
  const hojeStr = diaISO(hoje);
  const out: Renovacao[] = [];

  // O manifesto sobrepõe janela a janela, campo a campo. Sobreposição parcial
  // é de propósito: um segmento pode querer só mudar o texto do vencido e
  // manter o resto, e obrigá-lo a redeclarar tudo é o caminho para redeclarar
  // errado.
  const doSeg = new Map((renewal?.janelas ?? []).map((j) => [j.key, j]));
  const JAN = JANELAS.map((j) => {
    const o = doSeg.get(j.key);
    return {
      key: j.key,
      diasAntes: o?.dias_antes ?? j.diasAntes,
      titulo: o?.titulo ?? j.titulo,
      intencao: o?.intencao ?? j.intencao,
    };
  // ⚠ ORDEM CRESCENTE, e o `.find` abaixo depende disso.
  //
  // A constante `JANELAS` é escrita em ordem DECRESCENTE (60, 30, 7) porque é
  // a ordem em que a conversa acontece, e a busca original compensava com um
  // `.reverse()`. Quando o manifesto passou a poder mudar `dias_antes`, a
  // ordem escrita deixou de valer: um segmento pode declarar 90, 45 e 10 em
  // qualquer ordem no YAML. Ordenar aqui é o que mantém "a janela mais
  // apertada que ainda cabe" sendo verdade.
  //
  // Errei isto na primeira versão — ordenei crescente e mantive o `.reverse()`
  // herdado, o que fazia TODO contrato cair na janela mais larga e receber a
  // conversa de resultado a 5 dias do vencimento. `renovacao_test.mjs` pegou
  // nos quatro casos, imediatamente.
  }).sort((a, b) => a.diasAntes - b.diasAntes);

  for (const c of contatos) {
    if (!c.contract_end) continue;
    if (foraDeJogo.has(c.journey_stage)) continue;

    const dias = Math.round((Date.parse(c.contract_end) - Date.parse(hojeStr)) / 86400000);

    // Vencido: uma janela só, e sem número de dias na intenção — "venceu há 40
    // dias" dito ao cliente é constrangimento, não argumento.
    if (dias < 0) {
      out.push({
        contactId: c.id, name: c.name, phone: c.phone,
        diasParaVencer: dias, janela: "condicao",
        titulo: renewal?.vencido?.titulo ?? "Venceu sem contato",
        intencao: renewal?.vencido?.intencao ??
          "Retome sem cobrar o atraso. Pergunte se ele quer seguir e ofereça a condição concreta — quem venceu sem conversa quase sempre só não foi lembrado.",
        vencido: true,
      });
      continue;
    }

    // A janela mais APERTADA que ainda cabe. Sem isto, um contrato a 25 dias
    // cairia na janela de 60 e receberia a conversa errada — a de resultado,
    // quando já é hora da condição.
    const janela = JAN.find((j) => dias <= j.diasAntes);
    if (!janela) continue;

    out.push({
      contactId: c.id, name: c.name, phone: c.phone,
      diasParaVencer: dias, janela: janela.key,
      titulo: janela.titulo, intencao: janela.intencao,
      vencido: false,
    });
  }

  // Vencido primeiro, depois o mais próximo de vencer.
  return out.sort((a, b) => Number(b.vencido) - Number(a.vencido) || a.diasParaVencer - b.diasParaVencer);
}
