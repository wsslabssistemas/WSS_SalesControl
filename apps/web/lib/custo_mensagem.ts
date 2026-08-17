// O CUSTO DAS MENSAGENS DA META — a decisão, sem banco e sem imports de valor.
//
// ⚠ POR QUE ISTO NÃO ENTRA NA COTA DE IA, e a resposta não é organização.
//
// O teto de IA freia bloqueando a IA, e isso só funciona por causa de uma
// premissa escrita em `lib/cota.ts`: *"o modo manual custa ZERO e é a origem
// do produto"*. Bloquear a IA é um degrau seguro porque o que sobra é gratuito.
//
// Mensagem da Meta quebra a premissa. Se o custo de mensagem entrasse no mesmo
// teto, atingi-lo desligaria a IA — **e as mensagens continuariam saindo**,
// porque quem gasta ali não é a IA. Seria o freio errado puxado com força: o
// produto para de pensar e continua gastando.
//
// São dois bolsos com dois freios:
//   • IA  → freio: parar de gerar. Sobra o manual, de graça.
//   • Meta → freio: parar de DISPARAR. Sobra o `wa.me`, de graça.
// O que os dois têm em comum é a saída gratuita, e é ela que torna cada teto
// aceitável. Somá-los destruiria justamente isso.
//
// ⚠ E A TARIFA AQUI É ESTIMATIVA DECLARADA, não fato.
//
// R$ 0,3125 e R$ 0,0340 são as tarifas em dólar do Brasil (US$ 0,0625 e
// US$ 0,0068) convertidas a R$ 5,00 redondos. NÃO saíram do rate card em
// reais, que passou a existir em 1º/jul/2026 (faturamento em BRL pela Facebook
// Brasil) e só quem tem acesso à conta baixa. Se a WABA for em dólar, o custo
// real ainda oscila com o câmbio.
//
// Por isso a tarifa é PARÂMETRO e o custo é calculado NA LEITURA, nunca gravado
// por mensagem. Duas consequências, as duas de propósito:
//   1. Corrigir a tarifa corrige o histórico inteiro. Número gravado congelaria
//      o chute — e a casa já decidiu que número inventado com aparência de
//      número é pior que campo vazio.
//   2. Não existe arredondamento. Uma mensagem de utilidade custa 3,4 centavos;
//      `cost_cents` é inteiro, e gravar 3 (ou 0) por linha erraria de 12% a
//      100% num volume de milhares.

/** As categorias que a Meta cobra. `servico` é a resposta em texto livre. */
export type CategoriaMensagem = "marketing" | "utilidade" | "autenticacao" | "servico";

/**
 * Tarifa em MICRO-REAIS (milionésimos de real), para caber em inteiro exato.
 * R$ 0,3125 = 312.500 · R$ 0,0340 = 34.000.
 */
export type Tarifa = Record<CategoriaMensagem, number>;

/**
 * ⚠ A DATA QUE MUDA A CONTA — 1º de outubro de 2026.
 *
 * *"Any non-template message is charged as of October 1, 2026."* Nessa data a
 * resposta em texto livre (serviço) passa a ser cobrada à tarifa de utilidade,
 * e a mensagem de utilidade DENTRO da janela — gratuita desde jul/2025 —
 * também.
 *
 * Está aqui como data e não como comentário para que a estimativa **deixe de
 * estar errada sozinha**. Uma tabela com "serviço = grátis" escrita à mão
 * continuaria dizendo isso em novembro, e ninguém releria.
 */
export const COBRANCA_DE_SERVICO_A_PARTIR_DE = Date.UTC(2026, 9, 1);

export const TARIFA_BR: Tarifa = {
  marketing: 312_500,
  utilidade: 34_000,
  autenticacao: 34_000,
  // Grátis até 1º/out/2026. `tarifaVigente` aplica a data — este valor é o de
  // DEPOIS, porque é o que passa a valer e o que ninguém lembraria de trocar.
  servico: 34_000,
};

/** A tarifa que vale numa data. Antes de outubro, serviço é zero. */
export function tarifaVigente(base: Tarifa = TARIFA_BR, quando: Date = new Date()): Tarifa {
  if (quando.getTime() >= COBRANCA_DE_SERVICO_A_PARTIR_DE) return base;
  return { ...base, servico: 0 };
}

/**
 * A categoria de um envio, a partir do que já se sabe na hora de mandar.
 *
 * Nada aqui adivinha: `modelo` é o nome do template aprovado, e a categoria
 * dele foi escolhida no cadastro da Meta. Sem modelo, é texto livre — e texto
 * livre só sai dentro da janela, o que é a definição de serviço.
 *
 * ⚠ A META RECATEGORIZA POR CONTA PRÓPRIA. Um `UTILITY` com material de venda
 * vira `MARKETING` sem aviso, e passa a custar 9,2× mais. Ou seja: esta função
 * devolve o que NÓS acreditamos, e a fatura é a fonte da verdade. Por isso a
 * tela precisa dizer "estimativa" e não "custo".
 */
export function categoriaDoEnvio(entrada: {
  temModelo: boolean;
  categoriaDoModelo?: CategoriaMensagem | null;
}): CategoriaMensagem {
  if (!entrada.temModelo) return "servico";
  return entrada.categoriaDoModelo ?? "marketing";
}

/** Quantas mensagens de cada categoria saíram. */
export type Contagem = Partial<Record<CategoriaMensagem, number>>;

/** Custo total em micro-reais. Some tudo antes de arredondar, nunca depois. */
export function custoMicroReais(c: Contagem, tarifa: Tarifa): number {
  let total = 0;
  for (const k of Object.keys(tarifa) as CategoriaMensagem[]) {
    total += (c[k] ?? 0) * tarifa[k];
  }
  return total;
}

/** Micro-reais → centavos, arredondando UMA vez, no fim. */
export function paraCentavos(microReais: number): number {
  return Math.round(microReais / 10_000);
}

/**
 * O veredito do teto de mensagens.
 *
 * ⚠ BLOQUEIO NÃO É ERRO, igual à cota de IA — e pela mesma razão. Atingido o
 * teto, o disparo pelo número do sistema para e a fila volta ao `wa.me`, que
 * não custa nada. A operação continua; o que para é a máquina de gastar.
 *
 * `null` em `tetoMesCents` = sem teto. É o padrão, porque um teto inventado
 * que morde no meio de uma campanha é pior que teto nenhum: quem descobre é o
 * vendedor, no meio do trabalho, sem saber o porquê.
 */
export type VereditoDeCusto =
  | { ok: true; gastoCents: number; restanteCents: number | null }
  | { ok: false; gastoCents: number; motivo: string };

export function avaliarTetoDeMensagens(
  gastoCents: number,
  tetoMesCents: number | null,
  proximoEnvioCents = 0,
): VereditoDeCusto {
  if (tetoMesCents === null) return { ok: true, gastoCents, restanteCents: null };

  if (gastoCents + proximoEnvioCents > tetoMesCents) {
    return {
      ok: false,
      gastoCents,
      motivo:
        `O teto de mensagens do mês (${reais(tetoMesCents)}) foi alcançado — já foram ` +
        `${reais(gastoCents)}. O envio pelo número do sistema fica suspenso até virar o mês; ` +
        `enviar pelo WhatsApp de quem atende continua liberado e não custa nada.`,
    };
  }
  return { ok: true, gastoCents, restanteCents: tetoMesCents - gastoCents - proximoEnvioCents };
}

/** Centavos → "R$ 12,34". Formatação só na borda, como manda `lib/money.ts`. */
export function reais(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/**
 * O nome da linha no `usage_ledger`. Prefixo próprio para que a soma de
 * dinheiro da IA e a de mensagem NUNCA se confundam numa consulta futura.
 */
export function featureDaMensagem(c: CategoriaMensagem): string {
  return `whatsapp_${c}`;
}

export const FEATURES_DE_MENSAGEM: string[] = (
  ["marketing", "utilidade", "autenticacao", "servico"] as CategoriaMensagem[]
).map(featureDaMensagem);
