import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { computeAlerts } from "@/lib/agenda";

export default async function AgendaPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Agenda</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
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
    (data as {
      id: string;
      name: string;
      journey_stage: string;
      stage_entered_at: string;
    }[]) ?? [],
    stages,
  );

  const badge = (days: number) => {
    if (days < 0) return { txt: `${-days}d atrás`, bg: "rgba(192,57,43,0.12)", fg: "#c0392b" };
    if (days === 0) return { txt: "hoje", bg: "rgba(230,126,34,0.15)", fg: "#b9770e" };
    return { txt: `em ${days}d`, bg: "rgba(128,128,128,0.12)", fg: "inherit" };
  };

  return (
    <main>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Agenda</h1>
      <p style={{ opacity: 0.7 }}>
        Toques a fazer, calculados da jornada de cada contato.
      </p>

      {alerts.length === 0 ? (
        <p style={{ opacity: 0.6, marginTop: 16 }}>
          Nenhum toque pendente. Ao mover um contato para uma etapa com fases
          (ex.: semana experimental), os lembretes aparecem aqui.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
          {alerts.map((a, i) => {
            const b = badge(a.days);
            return (
              <li
                key={`${a.contactId}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 0",
                  borderBottom: "1px solid rgba(128,128,128,0.15)",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    padding: "2px 9px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                    background: b.bg,
                    color: b.fg,
                  }}
                >
                  {b.txt}
                </span>
                <span style={{ flex: 1 }}>
                  <Link href={`/painel/contatos/${a.contactId}`}>{a.name}</Link>
                  <span style={{ opacity: 0.6, fontSize: 13 }}>
                    {" "}
                    · {a.stageLabel}: {a.phaseLabel}
                  </span>
                </span>
                <span style={{ fontSize: 13, opacity: 0.6, whiteSpace: "nowrap" }}>
                  {a.date.toLocaleDateString("pt-BR")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
