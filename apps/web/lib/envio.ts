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
 * O canal ativo.
 *
 * Sai de variável de ambiente e não de banco porque é decisão de
 * INFRAESTRUTURA, não de cliente: nenhuma empresa deve poder se colocar num
 * canal que a plataforma não opera. Quando houver mais de um canal em
 * produção ao mesmo tempo, isto vira coluna em `tenants` — e só então.
 */
export function canalAtivo(): Canal {
  return process.env.WHATSAPP_CANAL === "cloud_api" ? "cloud_api" : "link_humano";
}

/**
 * Prepara (ou faz) o envio de uma mensagem.
 *
 * Devolve SEMPRE um resultado, nunca lança: esta função é chamada no meio de
 * telas de lista, e uma exceção por telefone mal cadastrado derrubaria a fila
 * inteira por causa de uma linha.
 */
export async function enviarMensagem(destino: Destino): Promise<ResultadoEnvio> {
  const texto = (destino.texto ?? "").trim();
  if (!texto) return { ok: false, motivo: "Mensagem vazia." };

  const num = paraE164BR(destino.telefone);
  if (!num.ok) return { ok: false, motivo: num.motivo };

  const canal = canalAtivo();

  if (canal === "cloud_api") {
    const r = await enviarPelaCloudAPI(num.digitos, texto);
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

async function enviarPelaCloudAPI(digitos: string, texto: string): Promise<EnvioProvedor> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const versao = process.env.WHATSAPP_API_VERSION ?? "v21.0";

  if (!token || !phoneId) {
    return {
      ok: false,
      motivo:
        "Canal oficial ligado mas sem credencial: faltam WHATSAPP_TOKEN e WHATSAPP_PHONE_ID.",
    };
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
