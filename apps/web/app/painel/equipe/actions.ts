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

/**
 * Divide uma carteira entre vários responsáveis, em fatias iguais.
 *
 * POR QUE NÃO BASTA "PASSAR TUDO PARA UM": em academia o rodízio de recepção é
 * alto, e quem sai costuma levar a maior carteira da casa. Despejar trezentos
 * alunos num vendedor só não transfere a carteira — transfere o problema, e o
 * resultado é ninguém sendo acompanhado por ninguém.
 *
 * A divisão é por RODÍZIO sobre a lista já ordenada, não aleatória: rodar duas
 * vezes com a mesma entrada dá o mesmo resultado, e dá para conferir.
 */
function fatiar<T>(itens: T[], destinos: string[]): Map<string, T[]> {
  const out = new Map<string, T[]>(destinos.map((d) => [d, []]));
  itens.forEach((item, i) => out.get(destinos[i % destinos.length])!.push(item));
  return out;
}

export async function removeMember(membershipId: string, formData: FormData) {
  const m = await requireAdmin();
  const modo = String(formData.get("modo") ?? "um");
  const newOwner = String(formData.get("new_owner") ?? "").trim() || null;
  const supabase = await createClient();

  if (modo === "dividir") {
    // Entre TODOS os outros ativos. Quem fica com a carteira é quem continua
    // na casa — e cada um recebe a mesma quantidade.
    const { data: ativos } = await supabase
      .from("memberships")
      .select("id")
      .eq("tenant_id", m.tenant!.id)
      .eq("status", "active")
      .neq("id", membershipId)
      .order("id");
    const destinos = ((ativos as { id: string }[] | null) ?? []).map((x) => x.id);

    const { data: doSaindo } = await supabase
      .from("contacts")
      .select("id")
      .eq("tenant_id", m.tenant!.id)
      .eq("owner_id", membershipId)
      .is("deleted_at", null)
      .order("id");
    const ids = ((doSaindo as { id: string }[] | null) ?? []).map((x) => x.id);

    if (destinos.length && ids.length) {
      for (const [destino, fatia] of fatiar(ids, destinos)) {
        // Em lotes: `in()` com milhares de ids estoura o tamanho da URL.
        for (let i = 0; i < fatia.length; i += 200) {
          await supabase
            .from("contacts")
            .update({ owner_id: destino })
            .eq("tenant_id", m.tenant!.id)
            .in("id", fatia.slice(i, i + 200));
        }
      }
    }
  } else {
    // SEM DESTINO, NÃO REMOVE. Gravar `owner_id = null` deixaria a carteira
    // órfã — que é exatamente a dor que este fluxo existe para evitar, e a
    // pior forma dela: silenciosa, porque a remoção "deu certo".
    if (!newOwner) {
      const { count } = await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", m.tenant!.id)
        .eq("owner_id", membershipId)
        .is("deleted_at", null);
      if ((count ?? 0) > 0) {
        redirect(`/painel/equipe/${membershipId}/remover?erro=${encodeURIComponent("Escolha quem recebe os contatos, ou marque para dividir entre a equipe.")}`);
      }
    }
    // Transfere os contatos para não deixar ninguém sem supervisão.
    await supabase
      .from("contacts")
      .update({ owner_id: newOwner })
      .eq("tenant_id", m.tenant!.id)
      .eq("owner_id", membershipId);
  }

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
