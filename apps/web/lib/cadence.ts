// Cadência de follow-up: qual toque está vencido para cada contato.
//
// A maior lacuna metodológica do mercado brasileiro é o follow-up: a maioria
// abandona após 1 ou 2 contatos, quando a prática pede uma sequência de toques.
// Em serviços técnicos, a maior parte dos orçamentos nunca recebe uma segunda
// mensagem — perde-se por silêncio, não por preço.
//
// O núcleo calcula; QUAIS toques existem e em que dia cada um cai vêm do
// manifesto do segmento (Lei 1).

import type { Stage } from "./skill";

const DAY = 86400000;

export type CadenceStep = { offset_days: number; intent: string };
export type Cadence = {
  key: string;
  applies_to?: string;
  steps?: CadenceStep[];
  stop_on?: string[];
  max_attempts?: number;
  /**
   * O passo expira quando o seguinte vence? **Padrão: sim.**
   *
   * Régua presa a um EVENTO REAL expira: *"primeira semana: como foi vir"* não
   * pode chegar para quem está há três anos na academia, e é isso que o padrão
   * protege.
   *
   * Régua que NÃO tem evento não deve expirar — reativação é o caso. O passo 1
   * dela é "abrir por um gancho do histórico dele", verdade hoje ou daqui a um
   * ano. Com expiração, importar 1.200 ex-alunos de uma vez faria a régua
   * vencer para a maioria antes de a ração diária alcançá-los, e a curadoria
   * seria jogada fora justamente na lista para a qual foi escrita.
   *
   * Quem sabe a diferença é o MANIFESTO, não o núcleo: é o segmento que
   * conhece o evento (Lei 1).
   */
  steps_expire?: boolean;
};

export type DueTouch = {
  contactId: string;
  name: string;
  phone: string | null;
  ownerId: string | null;
  stageLabel: string;
  /** Qual toque da cadência está vencido (1 = primeiro). */
  stepNumber: number;
  totalSteps: number;
  /** O que fazer neste toque, direto do manifesto. */
  intent: string;
  daysSince: number;
  overdueDays: number;
  cadenceKey: string | null;
  /** Contatos sem cadência declarada entram como silêncio simples. */
  semCadencia: boolean;
};

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * O histórico que a fila precisa, numa passada só: a última conversa e quantos
 * toques NOSSOS já saíram na etapa atual.
 *
 * ⚠ EXISTE PARA SER UM LUGAR SÓ. Três telas montam fila (Painel, Fila,
 * Follow-up) e as três derivavam o `ultimoContato` com o próprio laço. Somar
 * agora a contagem de toques em cada uma seria a terceira cópia de uma regra
 * que decide **quem aparece na lista de trabalho de alguém** — e a regra
 * "fila é lógica, não é tela" existe justamente porque duas listas erradas
 * parecem duas listas.
 *
 * A contagem é POR ETAPA: mudar de etapa reinicia a régua, porque a cadência é
 * declarada por etapa no manifesto. Quem voltou para descoberta recomeça a
 * descoberta.
 *
 * As interações podem vir em qualquer ordem — `ultimo` é o máximo, não o
 * primeiro que aparecer.
 */
export function historicoPorContato(
  interacoes: { contact_id: string | null; occurred_at: string; direction?: string | null }[],
  entradaNaEtapa: Record<string, string>,
): { ultimo: Record<string, string>; toques: Record<string, number> } {
  const ultimo: Record<string, string> = {};
  const toques: Record<string, number> = {};

  for (const i of interacoes) {
    const id = i.contact_id;
    if (!id || !i.occurred_at) continue;

    if (!ultimo[id] || i.occurred_at > ultimo[id]) ultimo[id] = i.occurred_at;

    // Só o que SAIU, e só depois de entrar na etapa. Resposta do cliente adia
    // o próximo toque (via `ultimo`) mas não executa nenhum passo da régua.
    if (i.direction !== "outbound") continue;
    const entrada = entradaNaEtapa[id];
    if (entrada && i.occurred_at < entrada) continue;
    toques[id] = (toques[id] ?? 0) + 1;
  }

  return { ultimo, toques };
}

/**
 * Toques vencidos. Para cada contato em etapa não-terminal:
 *  - se a etapa declara `cadence`, aponta o PRÓXIMO passo ainda não dado;
 *  - se não declara, sinaliza silêncio a partir de `silenceDays`.
 *
 * ⚠ A RÉGUA COLAPSAVA NO ACERVO, E ISSO ERA O DEFEITO MAIS CARO DAQUI.
 *
 * A versão anterior escolhia o **último** passo já vencido e o quitava com
 * qualquer contato posterior ao vencimento dele. Para quem entrou na etapa
 * ontem, isso funciona. Para o ACERVO — os 245 combinados vencidos da Be
 * Fitness, os 352 sem contato há 30 dias, os ex-alunos que pararam há anos —
 * **todos os passos já venceram**, então a régua começava no último e **uma
 * única mensagem quitava a sequência inteira**. A pessoa saía da fila e nunca
 * mais voltava.
 *
 * Ou seja: a régua de três toques, que existe porque a maior perda medida do
 * piloto é silêncio (8 de cada 9), virava um toque só exatamente na base onde
 * ela mais valia. E como sempre nesta casa, não aparecia como erro nenhum — a
 * fila só ficava menor do que deveria.
 *
 * ⚠ O DESENHO NOVO, e ele responde à pergunta do fundador de como uma pessoa
 * "sai da lista sem sumir da lista":
 *
 *   • QUAL passo vem agora é decidido por **quantos toques já demos** naquela
 *     etapa, não pela data. Passo 1 é para quem não recebeu nenhum.
 *   • QUANDO ele vence é o **mais tarde** entre a data da régua e um intervalo
 *     desde a última conversa. O intervalo é o declarado no manifesto (a
 *     distância entre um passo e o anterior).
 *   • Toques dados >= passos da régua → **cadência esgotada**, some da fila. É
 *     o `max_attempts` do manifesto finalmente valendo.
 *
 * O efeito prático: falar com alguém hoje tira a pessoa da lista de hoje e a
 * traz de volta no intervalo do passo seguinte — não amanhã (desanimador) e
 * não nunca (a régua colapsada). Para contato novo o resultado é idêntico ao
 * de antes; o que muda é só o acervo.
 *
 * ⚠ RESPOSTA DO CLIENTE NÃO CONTA COMO TOQUE NOSSO, mas ADIA o próximo. Ela
 * entra em `lastTouchByContact` (que é qualquer direção) e por isso empurra o
 * vencimento; ela não entra em `toquesNossos`, porque quem responde não
 * executou o passo da régua. Contar a resposta como toque faria três mensagens
 * seguidas de um cliente ansioso esgotarem a cadência dele.
 */
export function computeDueTouches(
  contacts: {
    id: string;
    name: string;
    phone: string | null;
    owner_id: string | null;
    journey_stage: string;
    stage_entered_at: string;
  }[],
  lastTouchByContact: Record<string, string>,
  stages: Stage[],
  cadences: Cadence[],
  /** Quantas mensagens NOSSAS saíram para cada contato desde que ele entrou na etapa. */
  toquesNossos: Record<string, number> = {},
  silenceDays = 5,
): DueTouch[] {
  const hoje = startOfDay(Date.now());
  const byKey = new Map(cadences.map((c) => [c.key, c]));
  const out: DueTouch[] = [];

  for (const c of contacts) {
    const stage = stages.find((s) => s.key === c.journey_stage);
    if (!stage || stage.terminal) continue;

    const entrada = startOfDay(new Date(c.stage_entered_at).getTime());
    if (Number.isNaN(entrada)) continue;

    const ultimo = lastTouchByContact[c.id]
      ? startOfDay(new Date(lastTouchByContact[c.id]).getTime())
      : entrada;
    const daysSince = Math.floor((hoje - ultimo) / DAY);

    const cadKey = (stage as Stage & { cadence?: string }).cadence;
    const cad = cadKey ? byKey.get(cadKey) : undefined;
    const steps = (cad?.steps ?? []).slice().sort((a, b) => a.offset_days - b.offset_days);

    let expirou = false;
    if (steps.length > 0) {
      // QUAL passo: o próximo que ainda não foi dado.
      const dados = toquesNossos[c.id] ?? 0;
      // Régua cumprida. É o `max_attempts` do manifesto: insistir além disso
      // em ticket de mensalidade queima o contato para a reativação, que é
      // onde ele volta a valer.
      if (dados >= steps.length) continue;

      // ⚠ PASSO CUJA JANELA PASSOU NÃO ESTÁ ATRASADO — ESTÁ PERDIDO.
      //
      // Este é o outro lado da correção do acervo, e sem ele a correção
      // troca um defeito por um pior. Contar o passo pelos toques dados faz o
      // primeiro passo ser escolhido para quem nunca recebeu nenhum — e para
      // uma pessoa matriculada há três anos isso é o toque *"primeira semana:
      // como foi vir, e o que já mudou na rotina"*.
      //
      // **Fluente e errado é o pior defeito possível** numa mensagem que sai
      // no nome da academia, e é a mesma regra do pretexto de `lib/fila.ts`:
      // a trava anti-invenção impede inventar o preço; aqui, impede inventar
      // o momento.
      //
      // A janela de um passo termina quando o SEGUINTE vence — passado o dia
      // 30, o toque do dia 7 não é mais o assunto. O último passo ganha mais
      // um intervalo, senão ele nunca expiraria e o acervo inteiro cairia
      // sempre nele.
      const fimDaJanela = (i: number) => {
        const proximo = steps[i + 1];
        if (proximo) return entrada + proximo.offset_days * DAY;
        const anteriorDoUltimo = i > 0 ? steps[i - 1].offset_days : 0;
        const sobra = Math.max(1, steps[i].offset_days - anteriorDoUltimo);
        return entrada + (steps[i].offset_days + sobra) * DAY;
      };

      // `steps_expire: false` desliga a expiração para réguas sem evento —
      // ver a nota no tipo `Cadence`. O padrão continua sendo expirar.
      let idx = dados;
      if (cad?.steps_expire !== false) {
        while (idx < steps.length && hoje > fimDaJanela(idx)) idx++;
      }

      // Todos os passos venceram e passaram: a régua não tem mais o que
      // dizer sobre esta pessoa. Ela não some — cai no alarme de silêncio
      // abaixo, que fala do OBJETIVO da etapa e de há quantos dias ninguém
      // conversa. Genérico e honesto é melhor que específico e falso.
      expirou = idx >= steps.length;

      if (!expirou) {
        // QUANDO: o mais TARDE entre a data da régua e um intervalo desde a
        // última conversa.
        //
        // As duas metades resolvem casos opostos e nenhuma sozinha resolve os
        // dois. A data da régua é o que faz um contato novo ser tocado no dia
        // certo; o intervalo desde a última conversa é o que impede o acervo
        // de vencer tudo de uma vez — e é o que faz a pessoa voltar em N dias
        // depois de falarmos, em vez de voltar amanhã.
        const anterior = idx > 0 ? steps[idx - 1].offset_days : 0;
        const intervalo = Math.max(1, steps[idx].offset_days - anterior);
        const dataDaRegua = entrada + steps[idx].offset_days * DAY;
        const desdeAConversa = ultimo + intervalo * DAY;
        const vencimento = Math.max(dataDaRegua, desdeAConversa);
        if (hoje < vencimento) continue;

        out.push({
          contactId: c.id,
          name: c.name,
          phone: c.phone,
          ownerId: c.owner_id,
          stageLabel: stage.label,
          stepNumber: idx + 1,
          totalSteps: steps.length,
          intent: steps[idx].intent,
          daysSince,
          overdueDays: Math.floor((hoje - vencimento) / DAY),
          cadenceKey: cad?.key ?? null,
          semCadencia: false,
        });
        continue;
      }
    }

    // ----------------------- SEM CADÊNCIA (OU COM A RÉGUA VENCIDA): O OBJETIVO DA ETAPA
    //
    // Chega aqui quem nunca teve régua declarada **e** quem tinha uma cuja
    // janela inteira já passou. Os dois casos pedem a mesma coisa: falar do
    // OBJETIVO da etapa e de há quantos dias ninguém conversa, sem fingir que
    // é o toque do dia 7 de alguém que está há três anos na academia.
    //
    // ⚠ AQUI O NÚCLEO ESCREVIA PROSA DE VENDA, e isso é a Lei 1 vazando no
    // lugar mais caro possível.
    //
    // O texto era *"Retomar o contato — ninguém falou com ele desde então."*:
    // igual para academia e para indústria, para um lead de R$ 89/mês e para
    // um pedido de 3 mil metros de feltro. E não era caso de borda — são **39
    // das 80 etapas vivas** dos 15 segmentos, quase todas o MIOLO da venda
    // (primeiro contato, descoberta, proposta, negociação).
    //
    // O manifesto já sabia o que dizer. Toda etapa declara `goal` na voz do
    // ramo — *"Nunca abrir com preço"*, *"Mix, giro, público e quem assina"*,
    // *"Química não se cota por mensagem"* — e o núcleo jogava fora para
    // escrever a própria frase genérica.
    //
    // A regra que fica: **o núcleo diz QUANDO falar; o manifesto diz O QUÊ.**
    // Se um dia aparecer etapa sem `goal`, o texto de último recurso continua
    // existindo — mas agora ele é o que ele realmente é: um aviso de que falta
    // curadoria, não uma instrução de venda.
    if (daysSince >= silenceDays) {
      out.push({
        contactId: c.id,
        name: c.name,
        phone: c.phone,
        ownerId: c.owner_id,
        stageLabel: stage.label,
        stepNumber: 0,
        totalSteps: 0,
        intent: stage.goal
          ? stage.goal
          : `Etapa "${stage.label}" não declara objetivo nem cadência no manifesto — o sistema não sabe o que este toque deve fazer. Abra a ficha antes de escrever.`,
        daysSince,
        overdueDays: daysSince - silenceDays,
        cadenceKey: null,
        semCadencia: true,
      });
    }
  }

  out.sort((a, b) => b.overdueDays - a.overdueDays);
  return out;
}
