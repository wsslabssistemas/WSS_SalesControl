"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveTenant } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const m = await getActiveTenant();
  if (!m?.tenant || (m.role !== "owner" && m.role !== "admin")) {
    redirect("/painel/equipe");
  }
  return m;
}

const ROLES = ["owner", "admin", "manager", "agent"];

export async function inviteMember(formData: FormData) {
  const m = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = ROLES.includes(String(formData.get("role"))) ? String(formData.get("role")) : "agent";
  if (!email) redirect("/painel/equipe/adicionar?erro=Informe+o+e-mail");

  const admin = createAdminClient();
  let userId: string | null = null;
  let link: string | null = null;

  // Convida: cria a conta (se nova) e gera o link para a pessoa definir a senha.
  const { data, error } = await admin.auth.admin.generateLink({ type: "invite", email });
  if (!error && data?.user) {
    userId = data.user.id;
    link = data.properties?.action_link ?? null;
  } else {
    // Já tem conta: só vincula.
    const { data: uid } = await admin.rpc("get_user_id_by_email", { p_email: email });
    userId = (uid as string | null) ?? null;
  }

  if (!userId) {
    redirect(
      `/painel/equipe/adicionar?erro=${encodeURIComponent(error?.message ?? "Falha ao convidar")}`,
    );
  }

  await admin.from("profiles").upsert({ id: userId, email }, { onConflict: "id" });
  await admin.from("memberships").upsert(
    { user_id: userId, tenant_id: m.tenant!.id, role, status: "active" },
    { onConflict: "user_id,tenant_id" },
  );

  revalidatePath("/painel/equipe");
  if (link) redirect(`/painel/equipe?convite=${encodeURIComponent(link)}`);
  redirect("/painel/equipe?ok=1");
}

export async function changeRole(membershipId: string, formData: FormData) {
  const m = await requireAdmin();
  const role = ROLES.includes(String(formData.get("role"))) ? String(formData.get("role")) : "agent";
  const supabase = await createClient();
  await supabase
    .from("memberships")
    .update({ role })
    .eq("id", membershipId)
    .eq("tenant_id", m.tenant!.id);
  revalidatePath("/painel/equipe");
  redirect("/painel/equipe");
}

export async function removeMember(membershipId: string, formData: FormData) {
  const m = await requireAdmin();
  const newOwner = String(formData.get("new_owner") ?? "").trim() || null;
  const supabase = await createClient();

  // Transfere os contatos para não deixar ninguém sem supervisão.
  await supabase
    .from("contacts")
    .update({ owner_id: newOwner })
    .eq("tenant_id", m.tenant!.id)
    .eq("owner_id", membershipId);

  // Desativa o vínculo (reversível, preserva histórico). is_member_of exige 'active'.
  await supabase
    .from("memberships")
    .update({ status: "disabled" })
    .eq("id", membershipId)
    .eq("tenant_id", m.tenant!.id);

  revalidatePath("/painel/equipe");
  revalidatePath("/painel/contatos");
  redirect("/painel/equipe");
}
