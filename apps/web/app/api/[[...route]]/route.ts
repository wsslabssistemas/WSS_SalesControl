import { Hono } from "hono";
import { handle } from "hono/vercel";
import { createAdminClient } from "@/lib/supabase/admin";
import { variantesArmazenadas } from "@/lib/phone";
import { escolherResponsavel } from "@/lib/carteira";
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

/**
 * Verificação de posse do endereço — a Meta chama uma vez, no cadastro.
 *
 * ⚠ O TOKEN É DE CADA EMPRESA, e tem que ser.
 *
 * O endereço do webhook é UM só para o produto inteiro, mas cada cliente tem o
 * app dele na Meta, verificado no CNPJ dele, com o token de verificação que ELE
 * escolheu. Um token de ambiente só serviria para a primeira empresa — a
 * segunda não conseguiria concluir o cadastro na Meta, e o sintoma seria um 403
 * sem explicação numa tela da Meta, longe daqui.
 *
 * Então o desafio é aceito se o token bater com o de QUALQUER empresa. Não é
 * afrouxamento: quem acerta um token que só existe no nosso banco e no Business
 * Manager daquele cliente já provou a posse que esta chamada verifica. Quem
 * decide o que fazer com as MENSAGENS continua sendo a assinatura do pacote,
 * abaixo — essa sim, por app.
 */
app.get("/whatsapp/webhook", async (c) => {
  const params = new URL(c.req.url).searchParams;
  const oferecido = params.get("hub.verify_token");
  const admin = createAdminClient();
  // paginacao-ok: procura exata pelo token oferecido — no máximo uma linha.
  const { data: dono } = oferecido
    ? await admin
        .from("tenant_secrets")
        .select("tenant_id")
        .eq("whatsapp_verify_token", oferecido)
        .maybeSingle()
    : { data: null };

  // ⚠ A RECUSA PRECISA DIZER QUAL DOS DOIS CASOS É, e a primeira versão dizia
  // sempre "nenhum token cadastrado". Com um token OFERECIDO que não bate,
  // essa frase manda a pessoa cadastrar o que ela acabou de cadastrar — e ela
  // está na tela da Meta, sem acesso ao servidor, sem como distinguir.
  //
  // São duas causas com conserto oposto: não salvou ainda × salvou diferente
  // (espaço no fim, letra trocada, colou o token errado).
  const esperado = dono ? oferecido : process.env.WHATSAPP_VERIFY_TOKEN;
  const r = respostaDoDesafio(params, esperado);
  if (!r.ok) {
    const motivo = !esperado && oferecido
      ? `O token "${oferecido}" não confere com nenhum cadastrado. Confira se é exatamente o mesmo salvo em Automação → Canal oficial, no Kairós — sem espaço sobrando no começo ou no fim.`
      : r.motivo;
    console.warn(`[whatsapp] verificacao recusada: ${motivo}`);
    return c.text(motivo, 403);
  }
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

  /**
   * Quem recebe um lead que chegou sozinho pelo canal.
   *
   * Cache por empresa dentro do lote: um pacote da Meta pode trazer várias
   * mensagens, e consultar a equipe inteira por mensagem seria caro à toa. O
   * desequilíbrio dentro de um lote é de poucas unidades e a próxima chamada
   * já corrige, porque a escolha é sempre a MENOR carteira.
   */
  const carteirasPorTenant = new Map<string, string | null>();
  async function donoParaContatoNovo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cliente: any,
    tenantId: string,
  ): Promise<string | null> {
    if (carteirasPorTenant.has(tenantId)) return carteirasPorTenant.get(tenantId)!;

    const { data: mems } = await cliente
      .from("memberships")
      .select("id, role")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .order("id");
    const ativos = ((mems as { id: string; role: string }[] | null) ?? []);
    // Agente é quem atende. Sem nenhum, o dono da empresa recebe — melhor com
    // quem responde pela empresa do que com ninguém.
    const alvos = ativos.filter((m) => m.role === "agent");
    const agentes = alvos.length ? alvos : ativos;

    // paginacao-ok: só o TAMANHO de cada carteira, sem trazer linha nenhuma —
    // é o `count` do PostgREST, que não sofre o corte de 1.000.
    const carga: Record<string, number> = {};
    for (const a of agentes) {
      const { count } = await cliente
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("owner_id", a.id)
        .is("deleted_at", null);
      carga[a.id] = count ?? 0;
    }

    const escolhido = escolherResponsavel(agentes, carga);
    carteirasPorTenant.set(tenantId, escolhido);
    return escolhido;
  }

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
      //
      // ⚠ E ELE PRECISA NASCER COM DONO. Este insert não tinha `owner_id`, e
      // desde que a Fila passou a abrir na carteira de quem está logado, um
      // contato órfão não aparece para NINGUÉM. O lead que acabou de escrever
      // é o mais quente que existe — sumir justo ele é o pior caso.
      //
      // Não dá erro, não dá aviso: a pessoa simplesmente não está em lista
      // nenhuma. Ver `lib/carteira.ts`.
      const responsavel = await donoParaContatoNovo(admin, tenantId);
      const { data: novo, error: erroNovo } = await admin
        .from("contacts")
        .insert({
          tenant_id: tenantId,
          name: msg.nome ?? msg.de,
          phone: msg.de,
          source: "whatsapp",
          owner_id: responsavel,
        })
        .select("id")
        .maybeSingle();
      // O erro era engolido junto com o resto: sem contato, a mensagem do
      // cliente era descartada em silêncio pelo `continue` abaixo.
      if (erroNovo) console.error(`[webhook] falha ao criar lead de ${msg.de}: ${erroNovo.message}`);
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
