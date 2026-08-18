"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { credencialDoCanal } from "@/lib/credenciais";
import { rotaDaResposta } from "@/lib/roteamento";
import { janelaDeAtendimento } from "@/lib/whatsapp-webhook";
import { enviarPelaCloudAPI } from "@/lib/envio";
import { paraE164BR } from "@/lib/phone";
import { registrarEnvio } from "@/lib/custo_mensagem-db";
import { revalidatePath } from "next/cache";

// A chamada à Meta é rede. Tela que fala com serviço externo declara o tempo —
// o padrão da Vercel mata a função no meio e devolve silêncio.
export const maxDuration = 30;

export type RespostaResult =
  | { ok: true; id: string }
  | { ok: false; motivo: string };

/**
 * RESPONDER PELO NÚMERO OFICIAL — a metade que faltava do canal.
 *
 * ⚠ POR QUE ISTO É O ITEM MAIS IMPORTANTE DA AUTOMAÇÃO, e não um detalhe de
 * conveniência.
 *
 * Até aqui o produto sabia MANDAR pelo número da empresa e não sabia
 * RESPONDER por ele. Quem escrevesse para o número do sistema só podia ser
 * atendido pelo WhatsApp pessoal de um vendedor — outro número, do lado do
 * cliente outra pessoa. E o caso que expõe isso é o que o fundador levantou:
 * **o cliente que pede para falar com um humano.** Ele pede socorro e o
 * socorro chega de um desconhecido.
 *
 * Automatizar a saída sem ter a volta é construir uma máquina de gerar
 * conversas que ninguém consegue continuar. Por isso esta ação vem ANTES do
 * motor proativo.
 *
 * ⚠ E ELA NÃO ESCOLHE CANAL. `rotaDaResposta` não tem configuração: a resposta
 * sai por onde a conversa está. Uma chave para desligar isso seria uma chave
 * para quebrar conversa pela metade.
 */
export async function responderPeloCanal(
  contactId: string,
  texto: string,
): Promise<RespostaResult> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, motivo: "Sem empresa vinculada." };
  if (!contactId) return { ok: false, motivo: "Contato não informado." };

  const limpo = (texto ?? "").trim();
  if (!limpo) return { ok: false, motivo: "Mensagem vazia." };

  const supabase = await createClient();

  const [{ data: c }, credencial] = await Promise.all([
    supabase.from("contacts").select("phone").eq("id", contactId).eq("tenant_id", tenant.id).maybeSingle(),
    credencialDoCanal(tenant.id),
  ]);
  const contact = c as { phone: string | null } | null;
  if (!contact) return { ok: false, motivo: "Contato não encontrado." };

  // ⚠ A JANELA VEM DA ÚLTIMA MENSAGEM **DELE PELO CANAL OFICIAL**, e as duas
  // condições importam. `direction=inbound` porque a nossa própria mensagem
  // não reabre janela nenhuma — a Meta recusaria o texto livre seguinte com um
  // erro que se lê como credencial errada. E `external_id not null` porque
  // mensagem colada no Responder à mão também é inbound, e ela NÃO passou pela
  // Meta: contar como janela aberta faria o sistema tentar responder por um
  // canal onde a conversa nunca esteve.
  //
  // paginacao-ok: uma linha, a mais recente, endereçada por índice.
  const { data: entrada } = await supabase
    .from("interactions")
    .select("occurred_at")
    .eq("tenant_id", tenant.id)
    .eq("contact_id", contactId)
    .eq("direction", "inbound")
    .not("external_id", "is", null)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const quando = (entrada as { occurred_at: string } | null)?.occurred_at ?? null;
  const janela = janelaDeAtendimento(quando);

  const rota = rotaDaResposta({
    temCredencial: !!credencial,
    conversaNoCanalOficial: !!quando,
    janelaAberta: janela.aberta,
  });

  if (rota.via !== "cloud_api_texto") return { ok: false, motivo: rota.porque };

  const num = paraE164BR(contact.phone);
  if (!num.ok) return { ok: false, motivo: num.motivo };

  const envio = await enviarPelaCloudAPI(num.digitos, limpo, credencial!);
  if (!envio.ok) return { ok: false, motivo: envio.motivo };

  // A mensagem JÁ SAIU. Falhar em registrar não a desfaz, então o erro sobe
  // para a tela em vez de sumir: sem registro, a conversa fica com um buraco e
  // a cadência não quita.
  const { error } = await supabase.from("interactions").insert({
    tenant_id: tenant.id,
    contact_id: contactId,
    direction: "outbound",
    // É RESPOSTA A UMA PESSOA, não iniciativa do sistema. O `input_kind` é o
    // que separa tempo de resposta de toque proativo na Gestão — trocar um
    // pelo outro estragaria a métrica que o produto vende.
    input_kind: "agent_briefing",
    channel: "whatsapp",
    external_id: envio.id,
    content: limpo,
    occurred_at: new Date().toISOString(),
    created_by: membership!.membershipId,
  });
  if (error) {
    console.error(`[conversas] resposta ${envio.id} SAIU mas não registrou: ${error.message}`);
    return {
      ok: false,
      motivo: `A mensagem foi enviada, mas eu não consegui registrar: ${error.message}`,
    };
  }

  // Resposta em texto livre é `servico`: grátis até 1º/out/2026, cobrada
  // depois. Medir desde já é o que faz a virada não ser surpresa.
  await registrarEnvio(tenant.id, { temModelo: false });

  revalidatePath("/painel/conversas");
  revalidatePath(`/painel/contatos/${contactId}`);
  return { ok: true, id: envio.id };
}
