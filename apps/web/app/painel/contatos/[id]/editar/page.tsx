import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { updateContact } from "../../actions";
import { ContactForm, type ContactValues } from "../../ContactForm";

export default async function EditarContatoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;

  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Editar contato</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("name, phone, source, journey_stage, custom, next_action_at, next_action_note")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();

  const cfg = await getSkillFormConfig(tenant.skill_key);
  const action = updateContact.bind(null, id);
  const contact = data as unknown as ContactValues;

  return (
    <main style={{ maxWidth: 460 }}>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Editar contato</h1>
      <ContactForm
        action={action}
        fields={cfg.fields}
        sources={cfg.sources}
        stages={cfg.stages}
        contact={contact}
        erro={erro}
        submitLabel="Salvar alterações"
      />
    </main>
  );
}
