"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { normalizePhone } from "@/lib/phone";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Parsed = {
  name: string;
  phone: string | null;
  source: string | null;
  journey_stage: string;
  stageStart: string | null;
  /** A data que o CLIENTE marcou, e o que foi combinado nas palavras de quem atendeu. */
  nextActionAt: string | null;
  nextActionNote: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  ownerId: string | null;
  custom: Record<string, string>;
};

function parse(formData: FormData): Parsed {
  const custom: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("custom.") && String(v).trim()) {
      custom[k.slice("custom.".length)] = String(v);
    }
  }
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: normalizePhone(String(formData.get("phone") ?? "")),
    source: String(formData.get("source") ?? "").trim() || null,
    // Vazio aqui; quem salva preenche com a 1ª etapa do manifesto. O núcleo
    // não conhece etapa de mercado (Lei 1).
    journey_stage: String(formData.get("journey_stage") ?? "").trim(),
    stageStart: String(formData.get("stage_start") ?? "").trim() || null,
    nextActionAt: String(formData.get("next_action_at") ?? "").trim() || null,
    nextActionNote: String(formData.get("next_action_note") ?? "").trim() || null,
    contractStart: String(formData.get("contract_start") ?? "").trim() || null,
    contractEnd: String(formData.get("contract_end") ?? "").trim() || null,
    ownerId: String(formData.get("owner_id") ?? "").trim() || null,
    custom,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findPhoneDup(
  supabase: any,
  tenantId: string,
  phone: string,
  exceptId?: string,
): Promise<{ id: string; name: string } | null> {
  let q = supabase
    .from("contacts")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .is("deleted_at", null);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q.limit(1).maybeSingle();
  return (data as { id: string; name: string } | null) ?? null;
}

function rowFrom(p: Parsed): Record<string, unknown> {
  const row: Record<string, unknown> = {
    name: p.name,
    phone: p.phone,
    source: p.source,
    journey_stage: p.journey_stage,
    custom: p.custom,
  };
  if (p.stageStart) row.stage_entered_at = new Date(p.stageStart).toISOString();
  // Sempre gravado, inclusive quando volta vazio: limpar a data é como se
  // desmarca um combinado que não vale mais. Se só gravasse quando preenchido,
  // um lembrete cancelado ficaria cobrando para sempre.
  row.next_action_at = p.nextActionAt;
  row.next_action_note = p.nextActionNote;
  row.contract_start = p.contractStart;
  row.contract_end = p.contractEnd;
  // `undefined` não vai para o banco: em empresa de uma pessoa só o campo nem
  // existe no formulário, e gravar `null` ali apagaria o dono a cada edição.
  if (p.ownerId !== null) row.owner_id = p.ownerId;
  return row;
}

const DUP = "23505"; // unique_violation

export async function createContact(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const p = parse(formData);
  if (!p.name) redirect("/painel/contatos/novo?erro=Nome+e+obrigatorio");

  const supabase = await createClient();

  // Duplicidade por telefone: avisa ANTES de salvar (com o nome de quem já existe).
  if (p.phone) {
    const dup = await findPhoneDup(supabase, tenant!.id, p.phone);
    if (dup) {
      redirect(
        `/painel/contatos/novo?erro=${encodeURIComponent(
          `Já existe um contato com esse telefone: ${dup.name}`,
        )}`,
      );
    }
  }

  // Sem etapa escolhida, entra na primeira não-terminal do manifesto.
  if (!p.journey_stage) {
    const { stages } = await getSkillFormConfig(tenant!.skill_key);
    p.journey_stage = stages.find((s) => !s.terminal)?.key ?? stages[0]?.key ?? "";
  }
  if (!p.journey_stage) {
    redirect("/painel/contatos/novo?erro=Segmento+sem+etapas.+Refaca+o+onboarding.");
  }

  const { error } = await supabase.from("contacts").insert({
    tenant_id: tenant!.id,
    // Quem cadastra é o padrão, mas o formulário pode dizer outro — numa
    // recepção com três pessoas, a carteira é de quem vai atender, não de
    // quem digitou.
    owner_id: p.ownerId ?? membership!.membershipId,
    ...rowFrom(p),
  });

  if (error) {
    const msg =
      error.code === DUP
        ? "Já existe um contato com esse telefone."
        : error.message;
    redirect(`/painel/contatos/novo?erro=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/painel/contatos");
  redirect("/painel/contatos");
}

export async function updateContact(id: string, formData: FormData) {
  const membership = await getActiveTenant();
  if (!membership?.tenant) redirect("/painel");

  const p = parse(formData);
  if (!p.name) redirect(`/painel/contatos/${id}/editar?erro=Nome+e+obrigatorio`);

  const supabase = await createClient();

  if (p.phone) {
    const dup = await findPhoneDup(supabase, membership.tenant.id, p.phone, id);
    if (dup) {
      redirect(
        `/painel/contatos/${id}/editar?erro=${encodeURIComponent(
          `Já existe outro contato com esse telefone: ${dup.name}`,
        )}`,
      );
    }
  }

  const { error } = await supabase
    .from("contacts")
    .update(rowFrom(p))
    .eq("id", id)
    .eq("tenant_id", membership.tenant.id);

  if (error) {
    const msg =
      error.code === DUP
        ? "Já existe um contato com esse telefone."
        : error.message;
    redirect(`/painel/contatos/${id}/editar?erro=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/painel/contatos");
  revalidatePath(`/painel/contatos/${id}`);
  redirect(`/painel/contatos/${id}`);
}

export async function moveStage(id: string, formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const to = String(formData.get("to_stage") ?? "").trim();
  const reason =
    String(formData.get("reason") ?? "").trim() || "Movido manualmente";
  const start = String(formData.get("stage_start") ?? "").trim() || null;
  if (!to) redirect(`/painel/contatos/${id}`);

  const supabase = await createClient();
  const { data: cur } = await supabase
    .from("contacts")
    .select("journey_stage")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  const from = (cur as { journey_stage: string } | null)?.journey_stage ?? null;

  if (from !== to) {
    await supabase
      .from("contacts")
      .update({
        journey_stage: to,
        stage_entered_at: start
          ? new Date(start).toISOString()
          : new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenant.id);

    await supabase.from("contact_stage_history").insert({
      tenant_id: tenant.id,
      contact_id: id,
      from_stage: from,
      to_stage: to,
      reason,
      triggered_by: "agent",
    });
  }

  revalidatePath(`/painel/contatos/${id}`);
  revalidatePath("/painel/contatos");
  revalidatePath("/painel/funil");
  revalidatePath("/painel/agenda");
  redirect(`/painel/contatos/${id}`);
}

export async function updateStageStart(id: string, formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const dateStr = String(formData.get("start") ?? "").trim();
  if (!dateStr) redirect(`/painel/contatos/${id}`);

  const supabase = await createClient();
  await supabase
    .from("contacts")
    .update({ stage_entered_at: new Date(dateStr).toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  revalidatePath(`/painel/contatos/${id}`);
  revalidatePath("/painel/agenda");
  redirect(`/painel/contatos/${id}`);
}

export async function deleteContact(id: string) {
  const membership = await getActiveTenant();
  if (!membership?.tenant) redirect("/painel");

  const supabase = await createClient();
  await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", membership.tenant.id);

  revalidatePath("/painel/contatos");
  redirect("/painel/contatos");
}

/**
 * ATRIBUIR RESPONSÁVEL EM LOTE.
 *
 * Nasceu de um caso concreto: três recepcionistas importando uma lista de 3.000
 * contatos. Cada importação grava um dono só — quem subiu o arquivo. Redistribuir
 * isso um a um é trabalho que ninguém faz, e carteira mal distribuída não dá
 * erro: ela simplesmente não é atendida.
 *
 * DUAS OPÇÕES, e a segunda é a que o rodízio de academia pede: passar tudo para
 * uma pessoa, ou DIVIDIR igualmente entre várias. A divisão é por rodízio sobre
 * a lista ordenada, determinística — rodar duas vezes dá o mesmo resultado.
 *
 * `owner_id` é a `membership`, não o usuário: um vendedor pode existir em duas
 * empresas, e a carteira é de uma delas.
 */
export async function atribuirEmLote(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  if (!["owner", "admin", "manager"].includes(membership!.role)) {
    redirect("/painel/contatos?erro=" + encodeURIComponent("Só o dono e os gestores redistribuem carteira."));
  }

  const ids = formData.getAll("sel").map(String).filter(Boolean);
  const volta = String(formData.get("volta") ?? "/painel/contatos");
  const dividir = String(formData.get("dividir") ?? "") === "1";

  const supabase0 = await createClient();
  // "Dividir entre todos" não manda a lista pela tela: ela é lida do banco na
  // hora. Se viesse do formulário, uma aba aberta há uma semana redistribuiria
  // a carteira para quem já saiu da equipe.
  const destinos = dividir
    ? (((await supabase0.from("memberships").select("id")
        .eq("tenant_id", tenant.id).eq("status", "active").order("id")).data as { id: string }[] | null) ?? [])
        .map((x) => x.id)
    : formData.getAll("destino").map(String).filter(Boolean);

  if (!ids.length) redirect(volta + (volta.includes("?") ? "&" : "?") + "erro=" + encodeURIComponent("Selecione ao menos um contato."));
  if (!destinos.length) redirect(volta + (volta.includes("?") ? "&" : "?") + "erro=" + encodeURIComponent("Escolha para quem vai."));

  const supabase = supabase0;

  // Confere que todo destino é membro ATIVO desta empresa. Sem isto, um id
  // colado à mão poria a carteira numa membership de outro tenant — e o
  // contato sumiria da tela sem ninguém entender por quê.
  const { data: validos } = await supabase
    .from("memberships").select("id")
    .eq("tenant_id", tenant.id).eq("status", "active").in("id", destinos);
  const alvos = ((validos as { id: string }[] | null) ?? []).map((x) => x.id).sort();
  if (!alvos.length) redirect(volta + (volta.includes("?") ? "&" : "?") + "erro=" + encodeURIComponent("Destino inválido."));

  const ordenados = [...ids].sort();
  const porDestino = new Map<string, string[]>(alvos.map((a) => [a, []]));
  ordenados.forEach((id, i) => porDestino.get(alvos[i % alvos.length])!.push(id));

  let n = 0;
  for (const [destino, fatia] of porDestino) {
    // Em lotes: `in()` com milhares de ids estoura o tamanho da requisição.
    for (let i = 0; i < fatia.length; i += 200) {
      const pedaco = fatia.slice(i, i + 200);
      const { error } = await supabase
        .from("contacts").update({ owner_id: destino })
        .eq("tenant_id", tenant.id).in("id", pedaco);
      if (!error) n += pedaco.length;
    }
  }

  revalidatePath("/painel/contatos");
  redirect(volta + (volta.includes("?") ? "&" : "?") + "atribuidos=" + n);
}
