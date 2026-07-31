import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { computeAlerts } from "@/lib/agenda";
import AgendaCalendar, { type CalItem } from "./AgendaCalendar";

function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function AgendaPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1>Agenda</h1>
        <p className="text-dim">Sem empresa vinculada.</p>
      </main>
    );
  }

  const { stages } = await getSkillFormConfig(tenant.skill_key);
  const phasedKeys = stages.filter((s) => s.phases?.length).map((s) => s.key);

  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("id, name, journey_stage, stage_entered_at")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null)
    .in("journey_stage", phasedKeys.length ? phasedKeys : ["__none__"]);

  const alerts = computeAlerts(
    (data as { id: string; name: string; journey_stage: string; stage_entered_at: string }[]) ?? [],
    stages,
  );

  const items: CalItem[] = alerts.map((a) => ({
    contactId: a.contactId,
    name: a.name,
    stageLabel: a.stageLabel,
    phaseLabel: a.phaseLabel,
    dateISO: localISO(a.date),
  }));

  const atrasados = alerts.filter((a) => a.days < 0);
  const hoje = alerts.filter((a) => a.days === 0);

  return (
    <main>
      <h1>Agenda</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Toques a fazer, calculados das fases da jornada de cada contato.
      </p>

      {(atrasados.length > 0 || hoje.length > 0) && (
        <div className="row wrap mt-16" style={{ gap: 10 }}>
          {atrasados.length > 0 && (
            <span className="badge badge-danger">{atrasados.length} atrasado{atrasados.length === 1 ? "" : "s"}</span>
          )}
          {hoje.length > 0 && (
            <span className="badge badge-warn">{hoje.length} para hoje</span>
          )}
          <span className="row wrap" style={{ gap: 8 }}>
            {[...atrasados, ...hoje].slice(0, 5).map((a, i) => (
              <Link key={`${a.contactId}-${i}`} href={`/painel/contatos/${a.contactId}`} className="badge">
                {a.name} · {a.phaseLabel}
              </Link>
            ))}
          </span>
        </div>
      )}

      {/* O calendário aparece sempre — mesmo vazio ele é a visão do mês. */}
      {alerts.length === 0 && (
        <p className="text-faint mt-16" style={{ fontSize: 13 }}>
          Nenhum toque pendente no momento. Ao mover um contato para uma etapa com
          fases, os lembretes aparecem aqui automaticamente.
        </p>
      )}

      <div className="mt-16">
        <AgendaCalendar items={items} />
      </div>
    </main>
  );
}
