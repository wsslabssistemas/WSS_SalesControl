"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import {
  calcularVagas, escolherOpcoes, descreverVaga,
  type RegraJornada, type Bloqueio, type Compromisso, type Vaga,
} from "@/lib/scheduling";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Vagas livres da empresa (ou de um profissional). É o que permite o motor
 * oferecer horário concreto em vez de escalar para um humano.
 */
export async function buscarVagas(input: {
  membershipId?: string | null;
  duracaoMin?: number;
  dias?: number;
  limite?: number;
}): Promise<Vaga[]> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return [];

  const { scheduling } = await getSkillFormConfig(tenant.skill_key);
  if (!scheduling?.enabled) return [];

  const supabase = await createClient();
  const agora = new Date();
  const fim = new Date(agora.getTime() + (input.dias ?? 14) * 24 * 3600 * 1000);

  const [{ data: regras }, { data: blocos }, { data: compromissos }] = await Promise.all([
    supabase.from("availability_rules").select("membership_id, weekday, starts_at, ends_at").eq("tenant_id", tenant.id).eq("active", true),
    supabase.from("availability_blocks").select("membership_id, starts_at, ends_at").eq("tenant_id", tenant.id).lt("starts_at", fim.toISOString()).gt("ends_at", agora.toISOString()),
    supabase.from("appointments").select("membership_id, starts_at, duration_min").eq("tenant_id", tenant.id).in("status", ["agendado", "confirmado"]).gte("starts_at", agora.toISOString()).lt("starts_at", fim.toISOString()),
  ]);

  return calcularVagas({
    regras: (regras as RegraJornada[] | null) ?? [],
    bloqueios: (blocos as Bloqueio[] | null) ?? [],
    compromissos: (compromissos as Compromisso[] | null) ?? [],
    duracaoMin: input.duracaoMin ?? scheduling.default_duration_min ?? 30,
    cfg: scheduling,
    dias: input.dias ?? 14,
    membershipId: input.membershipId ?? null,
    limite: input.limite ?? 60,
  });
}

/** As 2 ou 3 melhores opções, já em texto — para o motor oferecer. */
export async function opcoesDeHorario(quantas = 3, membershipId?: string | null): Promise<string[]> {
  const vagas = await buscarVagas({ membershipId, limite: 40 });
  return escolherOpcoes(vagas, quantas).map(descreverVaga);
}

/** Marca o compromisso, recusando se o horário já tiver sido tomado. */
export async function marcarCompromisso(input: {
  contactId: string;
  quandoISO: string;
  duracaoMin?: number;
  membershipId?: string | null;
  servico?: string;
  origem?: "manual" | "motor" | "cliente";
}): Promise<{ ok: boolean; error?: string }> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };

  const { scheduling } = await getSkillFormConfig(tenant.skill_key);
  const duracao = input.duracaoMin ?? scheduling?.default_duration_min ?? 30;
  const inicio = new Date(input.quandoISO);
  if (Number.isNaN(inicio.getTime())) return { ok: false, error: "Horário inválido." };
  const fim = new Date(inicio.getTime() + duracao * 60000);

  const supabase = await createClient();
  const executor = input.membershipId ?? null;

  // Confere se ainda está livre — dois atendentes podem marcar ao mesmo tempo.
  const { data: existentes } = await supabase
    .from("appointments")
    .select("starts_at, duration_min, membership_id")
    .eq("tenant_id", tenant.id)
    .in("status", ["agendado", "confirmado"])
    .gte("starts_at", new Date(inicio.getTime() - 4 * 3600000).toISOString())
    .lte("starts_at", fim.toISOString());

  const conflito = ((existentes as { starts_at: string; duration_min: number; membership_id: string | null }[] | null) ?? [])
    .filter((a) => !executor || !a.membership_id || a.membership_id === executor)
    .some((a) => {
      const aIni = new Date(a.starts_at);
      const aFim = new Date(aIni.getTime() + (a.duration_min || 30) * 60000);
      return inicio < aFim && aIni < fim;
    });

  if (conflito) return { ok: false, error: "Esse horário acabou de ser ocupado. Escolha outro." };

  const { error } = await supabase.from("appointments").insert({
    tenant_id: tenant.id,
    contact_id: input.contactId || null,
    membership_id: executor,
    service: input.servico ?? null,
    starts_at: inicio.toISOString(),
    duration_min: duracao,
    origem: input.origem ?? "manual",
    created_by: membership!.membershipId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/painel/agenda");
  revalidatePath(`/painel/contatos/${input.contactId}`);
  return { ok: true };
}

/** Define a jornada de trabalho (substitui a anterior). */
export async function salvarJornada(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  if (membership!.role !== "owner" && membership!.role !== "admin") {
    redirect("/painel/agenda?erro=Sem+permissao");
  }

  const supabase = await createClient();
  await supabase.from("availability_rules").delete().eq("tenant_id", tenant.id).is("membership_id", null);

  const linhas: Record<string, unknown>[] = [];
  for (let d = 0; d <= 6; d++) {
    if (formData.get(`ativo_${d}`) !== "on") continue;
    const inicio = String(formData.get(`inicio_${d}`) ?? "").trim();
    const fim = String(formData.get(`fim_${d}`) ?? "").trim();
    if (!inicio || !fim || fim <= inicio) continue;
    linhas.push({ tenant_id: tenant.id, membership_id: null, weekday: d, starts_at: inicio, ends_at: fim, active: true });
  }

  if (linhas.length) await supabase.from("availability_rules").insert(linhas);

  revalidatePath("/painel/agenda");
  redirect("/painel/agenda?ok=jornada");
}

export async function cancelarCompromisso(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  const id = String(formData.get("id") ?? "");
  const voltar = String(formData.get("back") ?? "/painel/agenda");
  if (id) {
    const supabase = await createClient();
    await supabase.from("appointments").update({ status: "cancelado", updated_at: new Date().toISOString() }).eq("id", id).eq("tenant_id", tenant.id);
  }
  revalidatePath(voltar);
  redirect(voltar);
}
