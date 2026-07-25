import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { displayPhone, whatsappNumber } from "@/lib/phone";
import { deleteContact, moveStage, updateStageStart } from "../actions";

type ContactRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  journey_stage: string;
  stage_entered_at: string;
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
    .select("id, name, phone, email, source, journey_stage, stage_entered_at, created_at, custom")
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
  const move = moveStage.bind(null, id);
  const wa = whatsappNumber(c.phone);

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
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 14,
                padding: "6px 12px",
                borderRadius: 8,
                background: "#25D366",
                color: "#0b2e13",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              WhatsApp
            </a>
          )}
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

      <form
        action={move}
        style={{
          marginTop: 24,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, opacity: 0.6 }}>Mover para</span>
        <select
          name="to_stage"
          defaultValue={c.journey_stage}
          style={{
            padding: "7px 10px",
            border: "1px solid rgba(128,128,128,0.4)",
            borderRadius: 7,
            background: "transparent",
            color: "inherit",
            font: "inherit",
          }}
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          name="reason"
          placeholder="Motivo (opcional)"
          style={{
            padding: "7px 10px",
            border: "1px solid rgba(128,128,128,0.4)",
            borderRadius: 7,
            background: "transparent",
            color: "inherit",
            font: "inherit",
            flex: 1,
            minWidth: 140,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "7px 14px",
            borderRadius: 7,
            border: "none",
            background: "#111",
            color: "#fff",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Mover
        </button>
      </form>

      {(() => {
        const stageDef = stages.find((s) => s.key === c.journey_stage);
        if (!stageDef?.phases || stageDef.phases.length === 0) return null;
        const startEditor = updateStageStart.bind(null, id);
        const start = c.stage_entered_at ? new Date(c.stage_entered_at) : null;
        const DAY = 86400000;
        const ctrl: React.CSSProperties = {
          padding: "7px 10px",
          border: "1px solid rgba(128,128,128,0.4)",
          borderRadius: 7,
          background: "transparent",
          color: "inherit",
          font: "inherit",
        };
        return (
          <section style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>
              {stageDef.label} — linha do tempo
            </h2>
            <form
              action={startEditor}
              style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}
            >
              <span style={{ fontSize: 13, opacity: 0.6 }}>Início</span>
              <input
                type="date"
                name="start"
                defaultValue={start ? start.toISOString().slice(0, 10) : ""}
                style={ctrl}
              />
              <button type="submit" style={{ ...ctrl, cursor: "pointer" }}>
                Salvar
              </button>
            </form>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {stageDef.phases.map((ph) => {
                const d = start
                  ? new Date(start.getTime() + ph.offset_days * DAY)
                  : null;
                return (
                  <li
                    key={ph.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "7px 0",
                      borderBottom: "1px solid rgba(128,128,128,0.12)",
                      fontSize: 14,
                    }}
                  >
                    <span>
                      {ph.label}{" "}
                      <span style={{ opacity: 0.5, fontSize: 12 }}>
                        (dia {ph.offset_days})
                      </span>
                    </span>
                    <span style={{ opacity: 0.7 }}>
                      {d ? d.toLocaleDateString("pt-BR") : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}

      <p style={{ marginTop: 20, fontSize: 12, opacity: 0.45 }}>
        Cada mudança de etapa é registrada no histórico da jornada. Os toques
        aparecem na Agenda.
      </p>
    </main>
  );
}
