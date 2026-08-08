import { Hono } from "hono";
import { handle } from "hono/vercel";
import { createAdminClient } from "@/lib/supabase/admin";
import { variantesArmazenadas } from "@/lib/phone";
import {
  assinaturaConfere,
  respostaDoDesafio,
  desmontarPacote,
  type MensagemRecebida,
} from "@/lib/whatsapp-webhook";

// Rota catch-all única: a Vercel limita o número de funções, então toda a API
// vive aqui dentro (decisão de stack). O núcleo não sabe por qual canal a
// mensagem chegou — recebe contexto, devolve decisão.
export const runtime = "nodejs";

const app = new Hono().basePath("/api");

app.get("/health", (c) =>
  c.json({ ok: true, service: "cos", ts: new Date().toISOString() }),
);

// =====================================================================
// WEBHOOK DO WHATSAPP
//
// É o único endereço do produto que qualquer um na internet pode chamar. Tudo
// aqui parte do princípio de que quem chamou pode não ser a Meta.
//
// A regra que governa as respostas: **200 quase sempre.** A Meta reenvia o que
// falha e desativa a assinatura depois de muitas falhas seguidas. Então erro
// nosso ao gravar não pode virar 500 — vira 200 com o problema registrado no
// log. A ÚNICA coisa que recebe 403 é assinatura inválida, porque aí não é
// falha: é alguém que não deveria estar ali.
// =====================================================================

/** Verificação de posse do endereço — a Meta chama uma vez, no cadastro. */
app.get("/whatsapp/webhook", (c) => {
  const r = respostaDoDesafio(
    new URL(c.req.url).searchParams,
    process.env.WHATSAPP_VERIFY_TOKEN,
  );
  if (!r.ok) return c.text(r.motivo, 403);
  // Texto puro, não JSON: a Meta compara o corpo com o desafio que mandou.
  return c.text(r.desafio, 200);
});

app.post("/whatsapp/webhook", async (c) => {
  // CORPO CRU, antes de qualquer parse — a assinatura é sobre os bytes que
  // chegaram. Reserializar mudaria o hash e faria a verificação recusar
  // pacote legítimo.
  const cru = await c.req.text();

  const assin = assinaturaConfere(
    cru,
    c.req.header("x-hub-signature-256"),
    process.env.WHATSAPP_APP_SECRET,
  );
  if (!assin.ok) {
    console.warn(`[whatsapp] pacote recusado: ${assin.motivo}`);
    return c.text("assinatura invalida", 403);
  }

  let corpo: unknown;
  try {
    corpo = JSON.parse(cru);
  } catch {
    return c.text("ok", 200); // não é nosso problema resolver, e reenviar não conserta
  }

  const pacote = desmontarPacote(corpo);
  if (pacote.ignorados.length) {
    // Áudio e imagem caem aqui. Fica no log para "o cliente respondeu e
    // ninguém viu" ser um número, e não um silêncio.
    console.info(`[whatsapp] ignorados: ${pacote.ignorados.join(", ")}`);
  }

  try {
    await registrar(pacote.mensagens);
  } catch (e) {
    // 200 mesmo assim, de propósito: ver a nota no topo do bloco.
    console.error(`[whatsapp] falha ao gravar: ${e instanceof Error ? e.message : String(e)}`);
  }

  return c.text("ok", 200);
});

/**
 * Grava as mensagens recebidas como `interactions` inbound.
 *
 * Roda com `service_role` porque webhook não tem sessão de usuário — não há
 * `auth.uid()` para a RLS avaliar. É o uso legítimo do papel: entrada de
 * sistema, com o `tenant_id` decidido aqui e não pelo pacote.
 */
async function registrar(mensagens: MensagemRecebida[]) {
  if (!mensagens.length) return;
  const admin = createAdminClient();

  // O `phone_number_id` diz de qual EMPRESA é o número que recebeu. Ele vem
  // do pacote, mas não é o pacote que decide o tenant: procuramos o número
  // no nosso cadastro, e o que não estiver cadastrado é descartado. Sem isso,
  // um pacote forjado escolheria em qual empresa escrever.
  const ids = [...new Set(mensagens.map((m) => m.phoneNumberId).filter(Boolean))];
  if (!ids.length) return;

  const { data: tenants } = await admin
    .from("tenants")
    .select("id, settings")
    .in("settings->whatsapp->>phone_number_id", ids);

  const porNumero = new Map<string, string>();
  for (const t of (tenants as { id: string; settings: Record<string, unknown> }[] | null) ?? []) {
    const w = t.settings?.whatsapp as { phone_number_id?: string } | undefined;
    if (w?.phone_number_id) porNumero.set(w.phone_number_id, t.id);
  }

  for (const msg of mensagens) {
    const tenantId = porNumero.get(msg.phoneNumberId);
    if (!tenantId) {
      console.warn(`[whatsapp] numero ${msg.phoneNumberId} nao pertence a nenhuma empresa`);
      continue;
    }

    // Acha o contato em qualquer um dos formatos em que o telefone pode estar
    // gravado. Ver `variantesArmazenadas`: procurar só pelo E.164 acharia 56%
    // da base e duplicaria o resto.
    const { data: achados } = await admin
      .from("contacts")
      .select("id")
      .eq("tenant_id", tenantId)
      .in("phone", variantesArmazenadas(msg.de))
      .limit(1);

    let contactId = (achados as { id: string }[] | null)?.[0]?.id ?? null;

    if (!contactId) {
      // Quem escreve e não está cadastrado É UM LEAD. Descartar seria perder
      // exatamente o contato que o produto existe para não perder.
      const { data: novo } = await admin
        .from("contacts")
        .insert({
          tenant_id: tenantId,
          name: msg.nome ?? msg.de,
          phone: msg.de,
          source: "whatsapp",
        })
        .select("id")
        .maybeSingle();
      contactId = (novo as { id: string } | null)?.id ?? null;
      if (!contactId) continue;
    }

    // `external_id` é a chave contra duplicata: a Meta REENVIA o mesmo pacote
    // quando não recebe 200 a tempo, e sem isso a mesma frase do cliente
    // apareceria duas vezes no histórico — e contaria duas vezes na métrica.
    await admin.from("interactions").upsert(
      {
        tenant_id: tenantId,
        contact_id: contactId,
        direction: "inbound",
        // PAPEL, não meio. Mensagem que o cliente escreveu é
        // `customer_message` — e não é rótulo à toa: a Gestão calcula tempo de
        // resposta filtrando exatamente por este valor. Inventar um
        // `input_kind: "whatsapp"` faria as mensagens do canal novo sumirem
        // silenciosamente da métrica que mede o produto.
        input_kind: "customer_message",
        channel: "whatsapp",
        content: msg.texto,
        occurred_at: msg.quando.toISOString(),
        external_id: msg.wamid,
      },
      { onConflict: "tenant_id,external_id", ignoreDuplicates: true },
    );
  }
}

export const GET = handle(app);
export const POST = handle(app);
