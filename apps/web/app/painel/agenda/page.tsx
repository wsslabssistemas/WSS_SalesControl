import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { computeAlerts } from "@/lib/agenda";
import AgendaCalendar, { type CalItem } from "./AgendaCalendar";
import AssinarCalendario from "./AssinarCalendario";
import { gerarEnderecoCalendario, removerEnderecoCalendario } from "./actions";

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

  // Endereço secreto do calendário (assinatura no Google/Apple/Outlook).
  const { data: tRow } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenant.id)
    .maybeSingle();
  const calToken =
    ((tRow?.settings as { calendar_token?: string } | null)?.calendar_token) ?? "";
  const isAdmin = membership.role === "owner" || membership.role === "admin";
  // O endereço do calendário precisa ser absoluto. Deriva do domínio em que o
  // app está sendo servido — funciona em produção e no desenvolvimento.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (host ? `${proto}://${host}` : "");

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

      {/* Assinatura no calendário do celular (Google, Apple, Outlook) */}
      {isAdmin && (
        <div className="card mt-24">
          <div className="between wrap" style={{ gap: 10, alignItems: "baseline" }}>
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>Ver no seu Google Agenda</p>
              <p className="text-dim" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Os toques e retornos aparecem no calendário que você já usa no
                celular, atualizando sozinhos.
              </p>
            </div>
            <form action={calToken ? removerEnderecoCalendario : gerarEnderecoCalendario}>
              <button type="submit" className={calToken ? "linklike" : "btn btn-sm btn-primary"} style={calToken ? { fontSize: 12, color: "var(--danger)" } : undefined}>
                {calToken ? "desativar" : "Gerar endereço"}
              </button>
            </form>
          </div>

          {calToken ? (
            <>
              <AssinarCalendario url={`${siteUrl}/calendario/${calToken}`} />
              <p className="text-faint" style={{ marginTop: 14, marginBottom: 0, fontSize: 12 }}>
                Este endereço é secreto — quem tiver o link vê sua agenda. Não
                publique. Se vazar, clique em <strong>desativar</strong> e gere outro.
              </p>
            </>
          ) : (
            <p className="text-faint mt-8" style={{ fontSize: 12 }}>
              Gera um endereço privado que você adiciona uma vez no seu calendário.
            </p>
          )}
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
