// O WEBHOOK DO WHATSAPP — a metade que RECEBE.
//
// Envio e recebimento não são simétricos, e a diferença decide a segurança.
// Enviar é uma chamada nossa para a Meta, autenticada por token: se o token
// estiver errado, não sai. Receber é a Meta (ou QUALQUER UM) chamando um
// endereço público nosso — e um endereço público que grava no banco sem
// conferir quem chamou é uma porta para escrever conversa falsa no histórico
// de um cliente pagante.
//
// Por isso este arquivo é quase todo verificação, e por isso ele é PURO:
// assinatura e desmontagem do pacote são funções sem rede e sem banco, para
// poderem ser testadas com um pacote de mentira. O que sobra na rota é só
// "isto é válido? então grave".
//
// A LEI 1 VALE AQUI. Nada neste arquivo sabe o que é aluno, matrícula ou
// plano — ele fala de mensagem, contato e empresa.

import { createHmac, timingSafeEqual } from "node:crypto";

// ---------------------------------------------------------------------
// 1. A ASSINATURA
// ---------------------------------------------------------------------

/**
 * Confere o `X-Hub-Signature-256` que a Meta manda.
 *
 * É HMAC-SHA256 do CORPO CRU com o App Secret. "Corpo cru" não é preciosismo:
 * se a rota fizer `JSON.parse` e depois `JSON.stringify` para conferir, a
 * ordem das chaves e os espaços mudam, o hash muda, e a verificação passa a
 * rejeitar pacote legítimo — o tipo de defeito que se conserta desligando a
 * verificação, que é o pior desfecho possível.
 *
 * A comparação é `timingSafeEqual` porque comparar hash com `===` vaza, pelo
 * TEMPO da resposta, quantos caracteres iniciais estavam certos. É um ataque
 * lento e chato, e é exatamente por isso que ninguém percebe que está
 * acontecendo.
 */
export function assinaturaConfere(
  corpoCru: string,
  cabecalho: string | null | undefined,
  appSecret: string | null | undefined,
): { ok: true } | { ok: false; motivo: string } {
  if (!appSecret) return { ok: false, motivo: "WHATSAPP_APP_SECRET não configurado." };
  if (!cabecalho) return { ok: false, motivo: "Pedido sem assinatura." };
  if (!cabecalho.startsWith("sha256=")) {
    return { ok: false, motivo: "Assinatura em formato desconhecido." };
  }

  const recebida = cabecalho.slice("sha256=".length).trim();
  const esperada = createHmac("sha256", appSecret).update(corpoCru, "utf8").digest("hex");

  // `timingSafeEqual` exige o mesmo comprimento e explode se diferir; com
  // hexadecimal de tamanho fixo, comprimento diferente já é assinatura
  // inválida — então a checagem vem antes e devolve o mesmo "não confere".
  if (recebida.length !== esperada.length) return { ok: false, motivo: "Assinatura não confere." };

  const iguais = timingSafeEqual(Buffer.from(recebida, "utf8"), Buffer.from(esperada, "utf8"));
  return iguais ? { ok: true } : { ok: false, motivo: "Assinatura não confere." };
}

/**
 * A verificação de posse do endereço, que a Meta faz UMA vez ao cadastrar.
 * Ela chama com `hub.mode=subscribe` e um token combinado; devolvemos o
 * desafio em texto puro para provar que o endereço é nosso.
 */
export function respostaDoDesafio(
  params: URLSearchParams,
  tokenEsperado: string | null | undefined,
): { ok: true; desafio: string } | { ok: false; motivo: string } {
  if (!tokenEsperado) return { ok: false, motivo: "WHATSAPP_VERIFY_TOKEN não configurado." };
  if (params.get("hub.mode") !== "subscribe") return { ok: false, motivo: "Modo inesperado." };
  if (params.get("hub.verify_token") !== tokenEsperado) return { ok: false, motivo: "Token de verificação errado." };
  const desafio = params.get("hub.challenge");
  if (!desafio) return { ok: false, motivo: "Sem desafio." };
  return { ok: true, desafio };
}

// ---------------------------------------------------------------------
// 2. O PACOTE
// ---------------------------------------------------------------------

export type MensagemRecebida = {
  /** Identificador da Meta (`wamid...`). É a chave contra duplicata. */
  wamid: string;
  /** Quem mandou, em dígitos E.164 (a Meta já entrega assim). */
  de: string;
  /** Nome do perfil do WhatsApp, quando vem. Útil para cadastrar quem é novo. */
  nome: string | null;
  texto: string;
  quando: Date;
  /** O número DA EMPRESA que recebeu — é o que diz de qual tenant é. */
  phoneNumberId: string;
};

export type StatusDeEnvio = {
  wamid: string;
  status: "sent" | "delivered" | "read" | "failed";
  quando: Date;
  erro: string | null;
  phoneNumberId: string;
};

export type PacoteDoWebhook = {
  mensagens: MensagemRecebida[];
  status: StatusDeEnvio[];
  /** O que veio e não sabemos tratar. Contado, não ignorado — ver nota abaixo. */
  ignorados: string[];
};

/**
 * Desmonta o pacote da Meta.
 *
 * NUNCA LANÇA. Um webhook que devolve erro faz a Meta reenviar, e reenviar um
 * pacote que sempre quebra vira laço infinito — com a Meta desativando a
 * assinatura depois de tantas falhas. Pacote estranho é registrado em
 * `ignorados` e a rota responde 200: aceitar e não entender é melhor que
 * recusar e ser desligado.
 *
 * `ignorados` existe para que "áudio, imagem e figurinha chegaram e ninguém
 * viu" seja um NÚMERO em algum lugar, e não um silêncio. Hoje só texto é
 * tratado — o cliente que responde com áudio é caso real e frequente, e essa
 * lacuna precisa ser visível antes de alguém reclamar.
 */
export function desmontarPacote(corpo: unknown): PacoteDoWebhook {
  const out: PacoteDoWebhook = { mensagens: [], status: [], ignorados: [] };
  const raiz = corpo as { object?: string; entry?: unknown[] } | null;
  if (!raiz || raiz.object !== "whatsapp_business_account" || !Array.isArray(raiz.entry)) {
    out.ignorados.push("pacote fora do formato do WhatsApp Business");
    return out;
  }

  for (const entrada of raiz.entry) {
    const changes = (entrada as { changes?: unknown[] })?.changes;
    if (!Array.isArray(changes)) continue;

    for (const mudanca of changes) {
      const m = mudanca as { field?: string; value?: Record<string, unknown> };
      if (m.field !== "messages" || !m.value) {
        if (m.field) out.ignorados.push(`campo "${m.field}"`);
        continue;
      }

      const v = m.value;
      const phoneNumberId =
        ((v.metadata as { phone_number_id?: string } | undefined)?.phone_number_id) ?? "";

      // Nome do perfil: a Meta manda numa lista separada, casada por `wa_id`.
      const perfis = new Map<string, string>();
      for (const c of (v.contacts as unknown[] | undefined) ?? []) {
        const ct = c as { wa_id?: string; profile?: { name?: string } };
        if (ct.wa_id && ct.profile?.name) perfis.set(ct.wa_id, ct.profile.name);
      }

      for (const msg of (v.messages as unknown[] | undefined) ?? []) {
        const mm = msg as {
          id?: string; from?: string; timestamp?: string; type?: string;
          text?: { body?: string };
        };
        if (!mm.id || !mm.from) continue;

        if (mm.type !== "text" || !mm.text?.body) {
          // Áudio, imagem, figurinha, localização, botão. Chegou e não vira
          // interação — mas fica contado.
          out.ignorados.push(`mensagem do tipo "${mm.type ?? "desconhecido"}"`);
          continue;
        }

        out.mensagens.push({
          wamid: mm.id,
          de: mm.from,
          nome: perfis.get(mm.from) ?? null,
          texto: mm.text.body,
          quando: paraData(mm.timestamp),
          phoneNumberId,
        });
      }

      for (const st of (v.statuses as unknown[] | undefined) ?? []) {
        const s = st as {
          id?: string; status?: string; timestamp?: string;
          errors?: { title?: string; message?: string }[];
        };
        if (!s.id || !s.status) continue;
        if (!["sent", "delivered", "read", "failed"].includes(s.status)) {
          out.ignorados.push(`status "${s.status}"`);
          continue;
        }
        out.status.push({
          wamid: s.id,
          status: s.status as StatusDeEnvio["status"],
          quando: paraData(s.timestamp),
          erro: s.errors?.[0]?.message ?? s.errors?.[0]?.title ?? null,
          phoneNumberId,
        });
      }
    }
  }

  return out;
}

/** A Meta manda epoch em SEGUNDOS, como string. Multiplicar por 1000 ou a data cai em 1970. */
function paraData(ts: string | undefined): Date {
  const n = Number(ts);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000) : new Date();
}

// ---------------------------------------------------------------------
// 3. A JANELA DE 24 HORAS
//
// A regra da Meta que decide o que pode ser dito e quanto custa: respondendo
// alguém que escreveu nas últimas 24h, texto livre e sem cobrança. Fora
// disso, só MODELO aprovado, e cobrado.
//
// Isto não é detalhe de faturamento — é o que separa o produto em dois. O
// Responder (reagir a quem escreveu) cabe na janela quase sempre. A fila
// (follow-up, recompra, renovação) vive FORA dela por definição: ela existe
// justamente para falar com quem parou de falar. Ou seja: o coração do
// produto é o caso que precisa de modelo aprovado.
//
// Descobrir isso na hora de ligar seria descobrir tarde. Fica escrito aqui.
// ---------------------------------------------------------------------

export type Janela = {
  aberta: boolean;
  /** Minutos restantes, ou `null` se já fechou (ou nunca abriu). */
  minutosRestantes: number | null;
  /** O que a tela deve dizer a quem vai enviar. */
  aviso: string | null;
};

export const JANELA_HORAS = 24;

export function janelaDeAtendimento(
  ultimaEntrada: Date | string | null | undefined,
  agora: Date = new Date(),
): Janela {
  if (!ultimaEntrada) {
    return {
      aberta: false,
      minutosRestantes: null,
      aviso: "Este contato nunca escreveu por aqui — só dá para iniciar com modelo aprovado pela Meta.",
    };
  }

  const t = ultimaEntrada instanceof Date ? ultimaEntrada : new Date(ultimaEntrada);
  if (Number.isNaN(t.getTime())) {
    return { aberta: false, minutosRestantes: null, aviso: "Data da última mensagem inválida." };
  }

  const limite = t.getTime() + JANELA_HORAS * 3600_000;
  const faltam = Math.floor((limite - agora.getTime()) / 60_000);

  if (faltam <= 0) {
    return {
      aberta: false,
      minutosRestantes: null,
      aviso: "Faz mais de 24h que ele escreveu: texto livre não sai, só modelo aprovado.",
    };
  }

  // Menos de duas horas é o intervalo em que a pessoa monta a mensagem, sai
  // para o café e volta com a janela fechada. Avisar antes custa uma linha.
  const aviso =
    faltam <= 120
      ? `A janela de 24h fecha em ${faltam < 60 ? `${faltam} min` : `${Math.floor(faltam / 60)}h`}.`
      : null;

  return { aberta: true, minutosRestantes: faltam, aviso };
}
