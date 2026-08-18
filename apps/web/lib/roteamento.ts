// O ROTEAMENTO — por qual número cada motivo da fila sai.
//
// Sem banco, sem rede e sem imports de valor, para ser testável em Node puro.
//
// ⚠ POR QUE ISTO NÃO MORA EM `lib/envio.ts`.
//
// `canalDe` responde "por onde SAI" a partir de UMA chave por empresa. Isso já
// separava duas decisões que o código tratava como uma (por onde sai × quem
// dispara), e foi o que impediu salvar um token de trocar o número de saída da
// empresa inteira em silêncio. Mas uma chave só ainda é grossa demais: ela
// obriga a empresa a escolher entre "tudo pelo número novo" e "nada".
//
// **A escolha certa é POR PÚBLICO, e a operação já tinha decidido isso:** o
// número novo cuida dos EX-ALUNOS; a recepção segue no número antigo. Não é
// preferência estética — é o defeito que o fundador nomeou em 16/ago. Um
// cliente que recebe a mensagem do sistema por um número e a resposta da
// recepcionista por outro não vê dois canais da academia: vê dois
// desconhecidos.
//
// E `reativacao` é o ÚNICO motivo que fala com quem não é cliente — está
// escrito no `PESO` de `lib/fila.ts` desde que a reativação existe. Os outros
// cinco são negócio corrente: gente que espera resposta, contrato saindo pela
// porta, lead esfriando. Todos já têm uma conversa aberta com uma PESSOA, e
// mudar o número no meio dela quebra a única coisa que fazia aquilo funcionar.
//
// O EFEITO NO CUSTO cai do mesmo lado, o que é um bom sinal do desenho: o
// `wa.me` sai do WhatsApp do próprio vendedor e a Meta não cobra nada, porque
// não é a API dela. A operação corrente — que é a de todo dia — segue de
// graça. O número oficial é gasto só onde ele resolve algo que o número
// pessoal não resolve: disparar mil reativações sem queimar o celular de
// ninguém.

import type { MotivoDaFila } from "./fila";

/** `true` = este motivo sai pelo número do sistema (Cloud API). */
export type RoteamentoPorMotivo = Record<MotivoDaFila, boolean>;

/**
 * O PADRÃO É QUASE TUDO NO LINK HUMANO, e isso é decisão, não timidez.
 *
 * Ligar um motivo no número oficial é uma escolha com consequência para o
 * cliente final (ele passa a receber de outro número) e com custo por
 * mensagem. Nenhuma das duas pode acontecer porque alguém salvou uma
 * credencial — é a mesma regra de `canalDe`, um nível abaixo.
 */
export const ROTEAMENTO_PADRAO: RoteamentoPorMotivo = {
  combinado: false,
  renovacao: false,
  followup: false,
  recompra: false,
  lembrete: false,
  reativacao: true,
};

const MOTIVOS: MotivoDaFila[] = [
  "combinado",
  "renovacao",
  "followup",
  "recompra",
  "lembrete",
  "reativacao",
];

/**
 * Qual modelo aprovado atende cada motivo, por empresa.
 *
 * ⚠ NOME DE MODELO NÃO É SEGREDO — e eu escrevi o contrário em
 * `MODELOS_WHATSAPP.md` antes de conferir. Credencial mora em `tenant_secrets`
 * porque um token da Meta manda mensagem em nome da empresa; o nome de um
 * modelo não faz nada nas mãos de quem o leia. Ele é POLÍTICA, e política mora
 * junto da política, em `tenants.settings.automation` — ao lado do modo, da
 * janela de horário e do teto diário.
 */
export type ModelosPorMotivo = Partial<Record<MotivoDaFila, string>>;

/**
 * A rota de um toque. Quatro respostas, e a quarta é a que mais importa.
 *
 * ⚠ `bloqueado` NÃO CAI DE VOLTA NO LINK HUMANO, de propósito.
 *
 * Seria fácil, e seria o defeito da casa outra vez. Se a empresa escolheu o
 * número oficial para a reativação e não há modelo aprovado, cair no `wa.me`
 * despejaria mil conversas frias no celular pessoal de um vendedor — em
 * silêncio, e com aparência de sucesso. Falha visível é o lado certo para
 * errar: a tela diz o que falta, e o caminho manual continua existindo ali do
 * lado para quem quiser fazer à mão, uma a uma.
 */
export type Rota =
  /** Sai pelo WhatsApp de quem está na tela. Não passa pela Meta e não custa. */
  | { via: "link_humano"; porque: string }
  /** Janela de 24h aberta: texto livre pela Cloud API. */
  | { via: "cloud_api_texto"; porque: string }
  /** Fora da janela: só modelo aprovado, e este é o dele. */
  | { via: "cloud_api_modelo"; modelo: string; porque: string }
  /** Escolheram o número oficial e falta o que torna o envio possível. */
  | { via: "bloqueado"; porque: string };

export function rotaDoToque(entrada: {
  motivo: MotivoDaFila;
  roteamento: RoteamentoPorMotivo;
  /** A empresa tem token e Phone Number ID salvos. */
  temCredencial: boolean;
  /** O contato escreveu nas últimas 24h — ver `janelaDeAtendimento`. */
  janelaAberta: boolean;
  modelos: ModelosPorMotivo;
}): Rota {
  const { motivo, roteamento, temCredencial, janelaAberta, modelos } = entrada;

  if (!roteamento[motivo]) {
    return {
      via: "link_humano",
      porque: "Este motivo sai pelo WhatsApp de quem atende — é onde a conversa já acontece.",
    };
  }

  // Sem credencial o padrão continua sendo o link, como em `canalDe`. Não é
  // degradação: é o modo padrão do produto, e a empresa que nunca configurou
  // canal nenhum não pode ver a fila travar por uma escolha que ela não fez.
  if (!temCredencial) {
    return {
      via: "link_humano",
      porque: "O canal oficial desta empresa não está configurado.",
    };
  }

  return pelaJanela(janelaAberta, modelos[motivo] ?? null, semModelo(motivo));
}

/**
 * A CAUDA COMPARTILHADA — a parte que não depende de POR QUE estamos falando.
 *
 * Toque proativo e resposta são perguntas diferentes (uma escolhe por motivo,
 * a outra não escolhe nada), mas as duas terminam na mesma regra da Meta:
 * dentro da janela, texto livre; fora dela, só modelo aprovado. Escrever isso
 * duas vezes seria a receita de as duas divergirem em silêncio — que é
 * literalmente o defeito de `phases` × `cadence` que o manifesto já pagou.
 */
function pelaJanela(janelaAberta: boolean, modelo: string | null, motivoDoBloqueio: string): Rota {
  if (janelaAberta) {
    return {
      via: "cloud_api_texto",
      porque: "Ele escreveu nas últimas 24h: texto livre sai pelo número do sistema.",
    };
  }
  if (modelo) {
    return {
      via: "cloud_api_modelo",
      modelo,
      porque: "Fora da janela de 24h — sai pelo modelo aprovado.",
    };
  }
  return { via: "bloqueado", porque: motivoDoBloqueio };
}

function semModelo(motivo: MotivoDaFila): string {
  return (
    `O motivo "${motivo}" está configurado para sair pelo número oficial, mas faz mais de 24h que ` +
    "ele escreveu e não há modelo aprovado cadastrado para este motivo. Cadastre o modelo " +
    "na Meta e informe o nome dele em Automação — ou envie por aqui mesmo, à mão."
  );
}

/**
 * POR ONDE UMA **RESPOSTA** SAI — e aqui não há escolha a fazer.
 *
 * ⚠ A REGRA É OUTRA, E ISSO É O CERNE DESTE ARQUIVO.
 *
 * O toque proativo escolhe por MOTIVO, porque é uma decisão comercial: falar
 * com ex-aluno pelo número da empresa e com o lead do vendedor pelo número
 * dele. Resposta não é decisão nenhuma: **ela sai por onde a conversa está.**
 *
 * Responder de um número diferente daquele em que a pessoa escreveu é
 * exatamente o defeito que o fundador nomeou em 16/ago — do lado dela não são
 * dois canais da academia, são dois desconhecidos. E no caso que mais importa,
 * o cliente que pede para falar com um humano, é pior ainda: ela pediu ajuda e
 * o socorro chega de um número estranho.
 *
 * Por isso não existe configuração aqui. Se a conversa está no número oficial,
 * a resposta sai por ele; se nunca passou por ele, sai pelo WhatsApp de quem
 * atende. Uma chave para desligar isso seria uma chave para quebrar conversa.
 *
 * ⚠ E FORA DA JANELA A RESPOSTA É `bloqueado`, NÃO um modelo qualquer.
 * Passadas 24h, aquilo já não é resposta — é retomada, e retomada tem motivo,
 * que é trabalho da fila. Emendar um modelo aqui faria o sistema "responder"
 * com um texto fixo aprovado dias antes, sem relação com o que a pessoa
 * perguntou. Fluente e errado, de novo.
 */
export function rotaDaResposta(entrada: {
  temCredencial: boolean;
  /** A pessoa já escreveu para o número oficial alguma vez. */
  conversaNoCanalOficial: boolean;
  /** Ela escreveu nas últimas 24h — ver `janelaDeAtendimento`. */
  janelaAberta: boolean;
}): Rota {
  const { temCredencial, conversaNoCanalOficial, janelaAberta } = entrada;

  if (!temCredencial) {
    return { via: "link_humano", porque: "O canal oficial desta empresa não está configurado." };
  }
  if (!conversaNoCanalOficial) {
    return {
      via: "link_humano",
      porque:
        "Esta pessoa nunca escreveu para o número do sistema — a conversa dela é com quem " +
        "atende, e a resposta tem que sair do mesmo lugar.",
    };
  }

  return pelaJanela(
    janelaAberta,
    null,
    "Faz mais de 24h que ele escreveu, então a Meta não entrega texto livre. Isto deixou de " +
      "ser resposta e virou retomada: ela vai aparecer na fila, com um motivo e o modelo certo.",
  );
}

/**
 * Lê o roteamento de `tenants.settings.automation.canal_por_motivo`.
 *
 * Normaliza como `readAutomation`: valor estranho vira o padrão, nunca `false`
 * silencioso e nunca `true` silencioso. Os dois erram feio em direções opostas
 * — um cala a reativação, o outro manda a operação inteira pelo número novo.
 */
export function lerRoteamento(settings: unknown): RoteamentoPorMotivo {
  const bruto = (settings as { automation?: { canal_por_motivo?: unknown } } | null)
    ?.automation?.canal_por_motivo;
  const obj = (bruto ?? {}) as Record<string, unknown>;
  const out = { ...ROTEAMENTO_PADRAO };
  for (const m of MOTIVOS) {
    if (typeof obj[m] === "boolean") out[m] = obj[m] as boolean;
  }
  return out;
}

/**
 * Lê os nomes de modelo de `tenants.settings.automation.modelos`.
 *
 * String vazia ou espaço em branco NÃO vira modelo. Um nome em branco
 * cadastrado por engano faria `rotaDoToque` devolver `cloud_api_modelo` com
 * nome vazio, e a Meta recusaria a mensagem com um erro sobre template
 * inexistente — que é o tipo de erro que se lê como "o canal quebrou".
 */
export function lerModelos(settings: unknown): ModelosPorMotivo {
  const bruto = (settings as { automation?: { modelos?: unknown } } | null)?.automation?.modelos;
  const obj = (bruto ?? {}) as Record<string, unknown>;
  const out: ModelosPorMotivo = {};
  for (const m of MOTIVOS) {
    const v = obj[m];
    if (typeof v === "string" && v.trim()) out[m] = v.trim();
  }
  return out;
}

/** Os motivos, na ordem da fila. Para a tela não inventar a própria ordem. */
export { MOTIVOS };
