import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { createContact } from "../actions";
import { ContactForm } from "../ContactForm";
import { createClient } from "@/lib/supabase/server";

export default async function NovoContatoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;

  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Novo contato</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }

  const cfg = await getSkillFormConfig(tenant.skill_key);
  const { data: mData } = await (await createClient())
    .from("memberships").select("id, user:profiles(full_name, email)")
    .eq("tenant_id", tenant.id).eq("status", "active");
  const membros = ((mData as { id: string; user: { full_name: string | null; email: string | null } | null }[] | null) ?? [])
    .map((m) => ({ id: m.id, nome: m.user?.full_name ?? m.user?.email ?? "—" }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <main style={{ maxWidth: 460 }}>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Novo contato</h1>
      <p style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>
        Os campos vêm do módulo <code>{tenant.skill_key}</code>.
      </p>
      <ContactForm
        action={createContact}
        fields={cfg.fields}
        sources={cfg.sources}
        stages={cfg.stages}
        contract={cfg.contract}
        membros={membros}
        euId={membership!.membershipId}
        erro={erro}
        submitLabel="Salvar contato"
      />
    </main>
  );
}
