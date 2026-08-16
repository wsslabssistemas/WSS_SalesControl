// CAMADA DE ENVIO — uma porta só para a mensagem sair.
//
// POR QUE ELA EXISTE
// Até aqui o produto montava `https://wa.me/...` em SEIS telas, cada uma com
// a própria ideia de como normalizar o número — e uma delas corrompia números
// de DDD 55. Quando o envio deixar de ser só link, seriam seis lugares para
// mudar e seis chances de esquecer um.
//
// A decisão do fundador (ago/2026) é que o canal ainda não está escolhido: a
// API oficial da Meta é o caminho recomendado, mas a verificação sairia no
// CNPJ da Be Fitness, e isso resolve o piloto sem resolver o produto. Enquanto
// a escolha não fecha, o código precisa poder trocar de canal sem reescrever
// tela nenhuma. É exatamente para isso que esta camada serve.
//
// O QUE ELA **NÃO** FAZ, de propósito
// Ela não finge que os dois modos são iguais. Mandar por API e abrir o
// WhatsApp para um humano clicar são coisas diferentes, e achatar as duas num
// `enviar()` que devolve `true` esconderia a diferença que mais importa neste
// produto: hoje **quem aperta enviar é uma pessoa**. Por isso o resultado diz
// o MODO, e a tela é obrigada a lidar com os dois.

import { paraE164BR } from "./phone";

export type Canal = "link_humano" | "cloud_api";

export type Destino = {
  telefone: string | null | undefined;
  texto: string;
};

export type ResultadoEnvio =
  /**
   * O texto está pronto e o número é válido: falta uma PESSOA clicar.
   * `link` abre o WhatsApp com a mensagem escrita.
   */
  | { ok: true; modo: "humano"; canal: Canal; link: string; e164: string; ajuste?: string }
  /** A mensagem saiu sozinha pela API. `id` é o identificador do provedor. */
  | { ok: true; modo: "automatico"; canal: Canal; id: string; e164: string; ajuste?: string }
  /** Não dá para enviar, e o motivo é legível por quem está na tela. */
  | { ok: false; motivo: string };

/**
 * ⚠ TER CREDENCIAL NÃO PODE LIGAR O CANAL SOZINHO — e a primeira versão disto
 * ligava (achado em 16/ago/2026, a partir de uma pergunta do fundador).
 *
 * Ele perguntou se, com a Be Fitness no automático, os vendedores poderiam
 * continuar usando o sistema normalmente — eles atendem pelo número ANTIGO da
 * academia, o do aplicativo. A pergunta expôs o defeito: `canalDe` devolvia
 * `cloud_api` assim que existisse credencial. Ou seja, **salvar o token trocaria
 * o número de saída da empresa inteira**, em silêncio, no mesmo instante.
 *
 * O efeito no cliente é o pior possível: ele receberia a mensagem do sistema
 * por um número novo e a resposta da recepcionista por outro. Do lado dele não
 * são dois canais da academia — são dois desconhecidos.
 *
 * São DUAS decisões diferentes e o código tratava como uma:
 *   • **por onde SAI** (link que abre o WhatsApp da pessoa × número do sistema);
 *   • **quem DISPARA** (uma pessoa clicando × o motor sozinho).
 *
 * A segunda é `automation.mode`. Esta função responde só a primeira, e o padrão
 * é o link humano mesmo com credencial salva: ligar exige alguém escolher.
 *
 * E A CREDENCIAL É POR EMPRESA desde 15/ago. Era `WHATSAPP_CANAL` no ambiente,
 * uma chave global: o comentário antigo dizia que canal é decisão de
 * infraestrutura e não de cliente, e isso continua verdade para o PROVEDOR —
 * mas não para o NÚMERO. Cada empresa tem o seu, verificado no CNPJ dela, e a
 * entrada já era assim (o webhook acha o tenant pelo `phone_number_id`).
 *
 * Sem credencial, o canal é o link humano — que não é degradação, é o modo
 * padrão do produto: *a inteligência é nossa, o envio é humano.*
 */
export function canalDe(
  credencial: CredencialDoCanal | null | undefined,
  usarNumeroDoSistema = false,
): Canal {
  return usarNumeroDoSistema && credencial?.token && credencial?.phoneId
    ? "cloud_api"
    : "link_humano";
}

/** O mínimo que o envio precisa saber. Vem de `lib/credenciais.ts`. */
export type CredencialDoCanal = { token: string; phoneId: string; versao?: string };

/**
 * Prepara (ou faz) o envio de uma mensagem.
 *
 * Devolve SEMPRE um resultado, nunca lança: esta função é chamada no meio de
 * telas de lista, e uma exceção por telefone mal cadastrado derrubaria a fila
 * inteira por causa de uma linha.
 */
export async function enviarMensagem(
  destino: Destino,
  credencial?: CredencialDoCanal | null,
): Promise<ResultadoEnvio> {
  const texto = (destino.texto ?? "").trim();
  if (!texto) return { ok: false, motivo: "Mensagem vazia." };

  const num = paraE164BR(destino.telefone);
  if (!num.ok) return { ok: false, motivo: num.motivo };

  const canal = canalDe(credencial);

  if (canal === "cloud_api") {
    const r = await enviarPelaCloudAPI(num.digitos, texto, credencial!);
    return r.ok
      ? { ok: true, modo: "automatico", canal, id: r.id, e164: num.e164, ajuste: num.ajuste }
      : { ok: false, motivo: r.motivo };
  }

  return {
    ok: true,
    modo: "humano",
    canal,
    link: `https://wa.me/${num.digitos}?text=${encodeURIComponent(texto)}`,
    e164: num.e164,
    ajuste: num.ajuste,
  };
}

/**
 * Só o link, para as telas que hoje mostram um botão e não registram envio.
 * Devolve `null` quando o número não serve — link de WhatsApp com número
 * inválido abre uma tela de erro, e tela de erro no meio de uma lista faz a
 * pessoa abandonar a lista.
 */
export function linkDeWhatsApp(telefone: string | null | undefined, texto?: string): string | null {
  const num = paraE164BR(telefone);
  if (!num.ok) return null;
  return texto
    ? `https://wa.me/${num.digitos}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/${num.digitos}`;
}

// ---------------------------------------------------------------------
// PROVEDOR: WhatsApp Cloud API (Meta)
//
// ⚠ ESCRITO CONTRA A DOCUMENTAÇÃO, NUNCA EXECUTADO CONTRA A API REAL.
// Não há conta Meta configurada até agora, então este caminho não tem prova
// de campo — só o formato do pedido. Ele fica DESLIGADO por padrão
// (`canalAtivo()` só o escolhe com `WHATSAPP_CANAL=cloud_api`), e a primeira
// coisa a fazer quando houver credencial é mandar UMA mensagem para o próprio
// número antes de ligar para qualquer contato real.
//
// A JANELA DE 24 HORAS é a regra que decide o custo e o que pode ser dito:
// responder quem escreveu nas últimas 24h é texto livre; iniciar conversa
// fora disso exige MODELO aprovado pela Meta e é cobrado. Esta função manda
// texto livre — ou seja, serve para RESPONDER. O toque proativo da fila
// (follow-up, recompra, renovação) vai precisar de modelo aprovado, e isso é
// trabalho de cadastro, não de código.
// ---------------------------------------------------------------------

type EnvioProvedor = { ok: true; id: string } | { ok: false; motivo: string };

export async function enviarPelaCloudAPI(
  digitos: string,
  texto: string,
  credencial: CredencialDoCanal,
): Promise<EnvioProvedor> {
  const { token, phoneId } = credencial;
  const versao = credencial.versao ?? "v21.0";

  if (!token || !phoneId) {
    return { ok: false, motivo: "Canal oficial ligado mas sem credencial desta empresa." };
  }

  try {
    const resp = await fetch(`https://graph.facebook.com/${versao}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: digitos,
        type: "text",
        text: { preview_url: false, body: texto },
      }),
    });

    const corpo = (await resp.json().catch(() => null)) as
      | { messages?: { id: string }[]; error?: { message?: string; code?: number } }
      | null;

    if (!resp.ok) {
      // O erro da Meta vai INTEIRO para quem está na tela. Trocar por "erro ao
      // enviar" economizaria uma linha e custaria a única informação que
      // resolve o problema — o código dela diz se é token vencido, número não
      // registrado ou janela de 24h fechada, e cada um tem conserto diferente.
      const detalhe = corpo?.error?.message ?? `HTTP ${resp.status}`;
      return { ok: false, motivo: `A Meta recusou: ${detalhe}` };
    }

    const id = corpo?.messages?.[0]?.id;
    if (!id) return { ok: false, motivo: "A Meta aceitou mas não devolveu identificador da mensagem." };
    return { ok: true, id };
  } catch (e) {
    return { ok: false, motivo: `Falha de rede ao falar com a Meta: ${e instanceof Error ? e.message : String(e)}` };
  }
}
