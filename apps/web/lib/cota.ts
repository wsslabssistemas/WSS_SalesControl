// A cota de IA — a decisão, sem banco e sem imports.
//
// POR QUE ISTO É CÓDIGO E NÃO POLÍTICA ESCRITA. O custo medido é de R$ 0,20 a
// R$ 0,26 por resposta com IA. Trinta empresas testando de graça custam ~R$ 690
// por mês, do bolso do fundador, antes de existir a primeira mensalidade — e o
// prejuízo chega pelo caminho que parece vitória: mais gente testando. O
// `COS_Kairos_Vende_Kairos.md` é explícito: intenção não segura isso.
//
// AS TRÊS REGRAS QUE ESTA FUNÇÃO IMPLEMENTA:
//
// 1. **Bloqueio não é erro.** O modo manual — o cockpit que casa a mensagem com
//    a biblioteca por palavra-chave — custa ZERO e é a origem do produto.
//    Quando o teto é atingido, a IA para e o produto continua. Se o bloqueio
//    virasse erro de tela, a empresa em teste concluiria que o sistema quebrou
//    e sumiria, que é o oposto do que o teto existe para fazer.
//
// 2. **Quem estourar primeiro bloqueia.** Cota de respostas e teto de dinheiro
//    falham de jeitos diferentes: uma resposta com histórico gigante custa
//    muito acima da média, e a contagem de respostas não enxerga isso. Contar
//    só dinheiro também não serve — é a contagem de atendimentos que a empresa
//    entende e que ela vai pagar depois.
//
// 3. **O teto do fabricante é global.** A soma é o que quebra o caixa, não a
//    empresa individual: trinta empresas dentro da própria cota estouram o
//    bolso sem que nenhuma delas tenha feito nada de errado.
//
// SEM POLÍTICA CONFIGURADA, LIBERA. Parece contraditório e não é: a linha
// global nasce com a migration `0047`, então "sem política" só acontece em
// banco desatualizado. Bloquear nesse caso derrubaria a IA de todo mundo por
// causa de uma migration não aplicada — falha na direção errada.

export type Limites = {
  respostas_mes: number | null;
  teto_mes_cents: number | null;
  prospeccao_dia: number | null;
  teto_global_mes_cents: number | null;
};

export type Consumo = {
  /** Respostas com IA já geradas por ESTA empresa no mês corrente. */
  respostasNoMes: number;
  /** Centavos já gastos por ESTA empresa no mês corrente. */
  custoNoMesCents: number;
  /** Abordagens de prospecção geradas por ESTA empresa HOJE. */
  prospeccaoHoje: number;
  /** Centavos gastos por TODAS as empresas no mês corrente. */
  custoGlobalNoMesCents: number;
};

/**
 * O que está sendo pedido.
 *
 * `resposta` é o Responder — o atendimento, que é a unidade que a empresa
 * entende e que ela vai pagar depois. `prospeccao` é a primeira abordagem, que
 * tem cota PRÓPRIA e DIÁRIA porque o risco ali é outro: lote. `analise` é o
 * Analista de Gestão e o assistente de Licitações — gastam token e por isso
 * respondem aos tetos de DINHEIRO, mas não consomem a cota de atendimentos:
 * bloquear o relatório de gestão porque o vendedor usou o Responder seria
 * cobrar de uma função o consumo de outra.
 */
export type Uso = "resposta" | "prospeccao" | "analise";

export type Motivo =
  | "cota_respostas"
  | "teto_empresa"
  | "teto_fabricante"
  | "cota_prospeccao";

export type Veredito = {
  permitido: boolean;
  motivo: Motivo | null;
  /** Frase pronta para a tela. Fala de limite, nunca de erro. */
  mensagem: string | null;
  /** Quanto ainda cabe, para a tela avisar ANTES de acabar. */
  restante: {
    respostas: number | null;
    centavos: number | null;
    prospeccao: number | null;
  };
};

/** Junta o padrão do fabricante com a regra própria da empresa, campo a campo. */
export function limitesEfetivos(global: Limites | null, doTenant: Limites | null): Limites {
  const pick = (a: number | null | undefined, b: number | null | undefined) =>
    a ?? b ?? null;
  return {
    respostas_mes: pick(doTenant?.respostas_mes, global?.respostas_mes),
    teto_mes_cents: pick(doTenant?.teto_mes_cents, global?.teto_mes_cents),
    prospeccao_dia: pick(doTenant?.prospeccao_dia, global?.prospeccao_dia),
    // O teto global é do fabricante e não se sobrescreve por empresa —
    // deixar uma empresa levantar o teto de todos seria desligar a trava
    // pelo lado de dentro.
    teto_global_mes_cents: global?.teto_global_mes_cents ?? null,
  };
}

const restanteDe = (limite: number | null, usado: number) =>
  limite === null ? null : Math.max(0, limite - usado);

export function avaliarCota(
  uso: Uso,
  limites: Limites | null,
  consumo: Consumo,
): Veredito {
  const l = limites ?? {
    respostas_mes: null, teto_mes_cents: null, prospeccao_dia: null, teto_global_mes_cents: null,
  };
  const restante = {
    respostas: restanteDe(l.respostas_mes, consumo.respostasNoMes),
    centavos: restanteDe(l.teto_mes_cents, consumo.custoNoMesCents),
    prospeccao: restanteDe(l.prospeccao_dia, consumo.prospeccaoHoje),
  };

  const nega = (motivo: Motivo, mensagem: string): Veredito => ({
    permitido: false, motivo, mensagem, restante,
  });

  // O teto do FABRICANTE vem primeiro, de propósito: ele protege o caixa de
  // quem paga a conta, e nenhuma empresa pode passar por cima dele.
  if (l.teto_global_mes_cents !== null && consumo.custoGlobalNoMesCents >= l.teto_global_mes_cents) {
    return nega(
      "teto_fabricante",
      "A geração com IA está suspensa até virar o mês: o teto de custo da plataforma foi atingido. O modo manual continua funcionando normalmente.",
    );
  }

  // DINHEIRO VALE PARA TODO USO. Um teto de gasto que só olhasse o Responder
  // deixaria o Analista e o assistente de Licitações furarem a mesma conta.
  if (l.teto_mes_cents !== null && consumo.custoNoMesCents >= l.teto_mes_cents) {
    return nega(
      "teto_empresa",
      "O teto de custo de IA desta empresa no mês foi atingido. O cockpit manual segue ilimitado e sem custo.",
    );
  }

  // A CONTAGEM é por uso, e os bolsos não se misturam: rajada de prospecção
  // não pode calar o Responder, que é o produto principal, e cota de
  // atendimento esgotada não pode derrubar a prospecção, que ainda tem saldo.
  if (uso === "prospeccao") {
    if (l.prospeccao_dia !== null && consumo.prospeccaoHoje >= l.prospeccao_dia) {
      return nega(
        "cota_prospeccao",
        `Você já gerou ${consumo.prospeccaoHoje} abordagens hoje, que é o limite diário. Amanhã zera. A busca e a lista de empresas continuam disponíveis.`,
      );
    }
    return { permitido: true, motivo: null, mensagem: null, restante };
  }

  if (uso === "resposta" && l.respostas_mes !== null && consumo.respostasNoMes >= l.respostas_mes) {
    return nega(
      "cota_respostas",
      `Sua cota de ${l.respostas_mes} respostas com IA neste mês acabou. O cockpit manual — busca na biblioteca por palavra-chave — segue ilimitado e sem custo.`,
    );
  }

  return { permitido: true, motivo: null, mensagem: null, restante };
}

/**
 * Aviso de fim de cota — para a tela falar ANTES de acabar.
 *
 * Cota que só avisa quando acaba é indistinguível de defeito: o vendedor
 * aperta o botão, nada acontece de novo, e ele conclui que o produto falhou.
 * Avisar aos 80% transforma o teto em informação, e informação é o que faz a
 * empresa entender pelo que vai pagar — que é metade da razão de a cota existir.
 */
export function avisoDeCota(limites: Limites | null, consumo: Consumo): string | null {
  const l = limites;
  if (!l || l.respostas_mes === null) return null;
  const usadas = consumo.respostasNoMes;
  if (usadas >= l.respostas_mes) return null; // aí já é bloqueio, não aviso
  if (usadas / l.respostas_mes < 0.8) return null;
  return `Restam ${l.respostas_mes - usadas} de ${l.respostas_mes} respostas com IA neste mês. Depois disso o modo manual segue funcionando.`;
}
