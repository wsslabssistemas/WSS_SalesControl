import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { displayPhone } from "@/lib/phone";
import { deleteContact } from "../actions";

type ContactRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  journey_stage: string;
  created_at: string;
  custom: Record<string, string> | null;
};

export default async function ContatoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("id, name, phone, email, source, journey_stage, created_at, custom")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();
  const c = data as unknown as ContactRow;

  const { fields, stages } = await getSkillFormConfig(tenant.skill_key);
  const custom = c.custom ?? {};
  const stageLabel =
    stages.find((s) => s.key === c.journey_stage)?.label ?? c.journey_stage;
  const del = deleteContact.bind(null, id);

  const rows: { label: string; value: string }[] = [
    { label: "Telefone", value: displayPhone(c.phone) },
    { label: "E-mail", value: c.email ?? "—" },
    { label: "Origem", value: c.source ?? "—" },
    { label: "Etapa", value: stageLabel },
    { label: "Criado em", value: new Date(c.created_at).toLocaleString("pt-BR") },
    ...fields.map((f) => ({
      label: f.label,
      value: custom[f.key] ?? "—",
    })),
  ];

  return (
    <main style={{ maxWidth: 560 }}>
      <Link href="/painel/contatos" style={{ fontSize: 13, opacity: 0.7 }}>
        ← Contatos
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>{c.name}</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href={`/painel/contatos/${c.id}/editar`} style={{ fontSize: 14 }}>
            Editar
          </Link>
          <form action={del}>
            <button
              type="submit"
              style={{
                font: "inherit",
                fontSize: 14,
                background: "none",
                border: "none",
                color: "#c0392b",
                cursor: "pointer",
                opacity: 0.8,
              }}
            >
              Excluir
            </button>
          </form>
        </div>
      </div>

      <dl style={{ marginTop: 24 }}>
        {rows.map((r) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              gap: 16,
              padding: "9px 0",
              borderBottom: "1px solid rgba(128,128,128,0.15)",
              fontSize: 14,
            }}
          >
            <dt style={{ width: 140, opacity: 0.6 }}>{r.label}</dt>
            <dd style={{ margin: 0 }}>{r.value}</dd>
          </div>
        ))}
      </dl>

      <p style={{ marginTop: 20, fontSize: 12, opacity: 0.45 }}>
        Histórico de conversas e mudanças de etapa aparecem aqui quando o
        atendimento começar.
      </p>
    </main>
  );
}
