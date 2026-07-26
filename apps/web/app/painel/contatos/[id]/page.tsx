import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { displayPhone, whatsappNumber } from "@/lib/phone";
import JourneyBar from "@/components/JourneyBar";
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
        <p className="text-dim">Sem empresa vinculada.</p>
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
  const stageLabel = stages.find((s) => s.key === c.journey_stage)?.label ?? c.journey_stage;
  const del = deleteContact.bind(null, id);
  const move = moveStage.bind(null, id);
  const wa = whatsappNumber(c.phone);

  const rows: { label: string; value: string }[] = [
    { label: "Telefone", value: displayPhone(c.phone) },
    { label: "E-mail", value: c.email ?? "—" },
    { label: "Origem", value: c.source ?? "—" },
    { label: "Criado em", value: new Date(c.created_at).toLocaleDateString("pt-BR") },
    ...fields.map((f) => ({ label: f.label, value: custom[f.key] ?? "—" })),
  ];

  return (
    <main style={{ maxWidth: 620 }}>
      <Link href="/painel/contatos" className="text-dim" style={{ fontSize: 13 }}>
        ← Contatos
      </Link>

      <div className="between mt-8">
        <div className="row" style={{ gap: 10 }}>
          <h1>{c.name}</h1>
          <span className="badge">{stageLabel}</span>
        </div>
        <div className="row" style={{ gap: 12 }}>
          {wa && (
            <a className="btn btn-sm" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" style={{ background: "#25D366", color: "#0b2e13", border: "none" }}>
              WhatsApp
            </a>
          )}
          <Link href={`/painel/responder?customer=${c.id}`} className="btn btn-sm btn-primary">
            Responder
          </Link>
          <Link href={`/painel/contatos/${c.id}/editar`} className="text-dim" style={{ fontSize: 14 }}>
            Editar
          </Link>
          <form action={del}>
            <button type="submit" className="linklike" style={{ fontSize: 14, color: "var(--danger)" }}>
              Excluir
            </button>
          </form>
        </div>
      </div>

      {/* Jornada */}
      <div className="card mt-24">
        <JourneyBar stages={stages} current={c.journey_stage} />
        <form action={move} className="row wrap mt-16" style={{ gap: 8 }}>
          <span className="text-dim" style={{ fontSize: 13 }}>Mover para</span>
          <select name="to_stage" defaultValue={c.journey_stage} style={{ width: "auto", flex: "0 1 auto" }}>
            {stages.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <input name="reason" placeholder="Motivo (opcional)" className="grow" style={{ minWidth: 140 }} />
          <button type="submit" className="btn btn-sm">Mover</button>
        </form>
      </div>

      {/* Dados */}
      <dl className="card mt-16" style={{ margin: "16px 0 0" }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            className="between"
            style={{ padding: "9px 0", borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none", fontSize: 14 }}
          >
            <dt className="text-dim" style={{ width: 140 }}>{r.label}</dt>
            <dd className="grow" style={{ margin: 0, textAlign: "right" }}>{r.value}</dd>
          </div>
        ))}
      </dl>

      {/* Linha do tempo da fase */}
      {(() => {
        const stageDef = stages.find((s) => s.key === c.journey_stage);
        if (!stageDef?.phases || stageDef.phases.length === 0) return null;
        const startEditor = updateStageStart.bind(null, id);
        const start = c.stage_entered_at ? new Date(c.stage_entered_at) : null;
        const DAY = 86400000;
        return (
          <section className="card mt-16">
            <div className="between" style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 15 }}>{stageDef.label} — linha do tempo</h2>
            </div>
            <form action={startEditor} className="row" style={{ gap: 8, marginBottom: 14 }}>
              <span className="text-dim" style={{ fontSize: 13 }}>Início</span>
              <input type="date" name="start" defaultValue={start ? start.toISOString().slice(0, 10) : ""} style={{ width: "auto" }} />
              <button type="submit" className="btn btn-sm btn-ghost">Salvar</button>
            </form>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {stageDef.phases.map((ph) => {
                const d = start ? new Date(start.getTime() + ph.offset_days * DAY) : null;
                const due = d ? Math.round((d.getTime() - Date.now()) / DAY) : null;
                return (
                  <li key={ph.key} className="between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                    <span>
                      {ph.label} <span className="text-faint" style={{ fontSize: 12 }}>(dia {ph.offset_days})</span>
                    </span>
                    <span className={due !== null && due < 0 ? "badge badge-danger" : due === 0 ? "badge badge-warn" : "text-dim"}>
                      {d ? d.toLocaleDateString("pt-BR") : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}

      <p className="text-faint" style={{ marginTop: 20, fontSize: 12 }}>
        Cada mudança de etapa é registrada no histórico da jornada. Os toques aparecem na Agenda.
      </p>
    </main>
  );
}
