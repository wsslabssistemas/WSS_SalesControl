"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * AS DUAS SAÍDAS DE UMA CONTRADIÇÃO — e nenhuma delas é automática.
 *
 * Ou a pessoa saiu de verdade (vai para a etapa de saída, com o histórico
 * registrado), ou o sistema é que estava errado e o gestor confirma que está
 * tudo bem (a linha some da lista).
 *
 * ⚠ O "ESTÁ CERTO" PRECISA SER GRAVADO, e é o que faz a tela funcionar. Sem
 * ele a lista mostraria os mesmos nomes toda semana, viraria ruído, e ruído é
 * o que faz alguém parar de abrir a tela — o mesmo motivo pelo qual a fila do
 * vendedor não mostra o acervo inteiro.
 */

async function admin() {
  const m = await getActiveTenant();
  if (!m?.tenant || (m.role !== "owner" && m.role !== "admin")) return null;
  return m;
}

/** Move para a etapa de saída declarada no manifesto e registra no histórico. */
export async function moverParaSaida(formData: FormData) {
  const m = await admin();
  if (!m) redirect("/painel/contradicoes?erro=Sem+permissao");
  const id = String(formData.get("contact_id") ?? "");
  if (!id) redirect("/painel/contradicoes");

  const { contract } = await getSkillFormConfig(m.tenant!.skill_key);
  const destino = contract?.ended_stage;
  if (!destino) {
    redirect(`/painel/contradicoes?erro=${encodeURIComponent("Este ramo não declara para onde vai quem sai.")}`);
  }

  const supabase = await createClient();
  // paginacao-ok: uma linha, endereçada por id.
  const { data: atual } = await supabase
    .from("contacts").select("journey_stage, custom")
    .eq("id", id).eq("tenant_id", m.tenant!.id).maybeSingle();
  if (!atual) redirect("/painel/contradicoes");

  const hoje = new Date().toISOString();
  // paginacao-ok: UPDATE de uma linha, endereçado por id.
  const { error } = await supabase
    .from("contacts")
    .update({
      journey_stage: destino,
      stage_entered_at: hoje,
      custom: { ...((atual.custom as Record<string, unknown>) ?? {}), contrato_encerrado_em: hoje.slice(0, 10) },
    })
    .eq("id", id)
    .eq("tenant_id", m.tenant!.id);
  if (error) redirect(`/painel/contradicoes?erro=${encodeURIComponent(error.message)}`);

  // O histórico é append-only e é o que permite responder "quando ele saiu?".
  await supabase.from("contact_stage_history").insert({
    tenant_id: m.tenant!.id,
    contact_id: id,
    from_stage: atual.journey_stage,
    to_stage: destino,
    reason: "Contradição conferida pelo gestor: a fonte não confirma que ainda é cliente.",
    triggered_by: "agent",
  });

  revalidatePath("/painel/contradicoes");
  revalidatePath("/painel/fila");
  redirect("/painel/contradicoes?ok=movido");
}

/**
 * "Conferi, está certo" — a pessoa continua cliente e o sistema é que não
 * sabia. Carimba a ficha para a linha não voltar.
 *
 * O carimbo tem DATA de propósito: se a situação mudar de novo, dá para saber
 * quando alguém olhou pela última vez. Um booleano diria "já conferi" para
 * sempre, inclusive dois anos depois — que é a mesma doença do `contract_end`
 * que envelhece em silêncio.
 */
export async function marcarConferido(formData: FormData) {
  const m = await admin();
  if (!m) redirect("/painel/contradicoes?erro=Sem+permissao");
  const id = String(formData.get("contact_id") ?? "");
  if (!id) redirect("/painel/contradicoes");

  const supabase = await createClient();
  // paginacao-ok: uma linha, endereçada por id.
  const { data: atual } = await supabase
    .from("contacts").select("custom").eq("id", id).eq("tenant_id", m.tenant!.id).maybeSingle();

  // paginacao-ok: UPDATE de uma linha, endereçado por id.
  const { error } = await supabase
    .from("contacts")
    .update({
      custom: {
        ...((atual?.custom as Record<string, unknown>) ?? {}),
        conferido_em: new Date().toISOString().slice(0, 10),
      },
    })
    .eq("id", id)
    .eq("tenant_id", m.tenant!.id);

  if (error) redirect(`/painel/contradicoes?erro=${encodeURIComponent(error.message)}`);
  revalidatePath("/painel/contradicoes");
  redirect("/painel/contradicoes?ok=conferido");
}
