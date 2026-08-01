import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { computeAlerts } from "@/lib/agenda";
import AgendaCalendar, { type CalItem } from "./AgendaCalendar";
import AssinarCalendario from "./AssinarCalendario";
import { gerarEnderecoCalendario, removerEnderecoCalendario } from "./actions";
import { cancelarCompromisso } from "./horarios-actions";
import Jornada from "./Jornada";

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

  const { stages, scheduling } = await getSkillFormConfig(tenant.skill_key);
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

  // Jornada de trabalho e compromissos marcados (segmentos com hora marcada).
  let regras: { weekday: number; starts_at: string; ends_at: string }[] = [];
  let compromissos: {
    id: string; starts_at: string; service: string | null; origem: string;
    contact_id: string | null; contato: { name: string } | null;
  }[] = [];
  if (scheduling?.enabled) {
    const [{ data: r }, { data: ap }] = await Promise.all([
      supabase
        .from("availability_rules")
        .select("weekday, starts_at, ends_at")
        .eq("tenant_id", tenant.id)
        .is("membership_id", null)
        .eq("active", true)
        .order("weekday"),
      supabase
        .from("appointments")
        .select("id, starts_at, service, origem, contact_id, contato:contacts(name)")
        .eq("tenant_id", tenant.id)
        .in("status", ["agendado", "confirmado"])
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(20),
    ]);
    regras = (r as typeof regras | null) ?? [];
    compromissos = (ap as unknown as typeof compromissos | null) ?? [];
  }

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

      {/* Jornada de trabalho: é o que permite o motor oferecer horário */}
      {scheduling?.enabled && isAdmin && <Jornada regras={regras} />}

      {/* Compromissos marcados */}
      {scheduling?.enabled && compromissos.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Próximos compromissos</h2>
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr><th>Quando</th><th>Cliente</th><th>Serviço</th><th>Origem</th><th></th></tr>
              </thead>
              <tbody>
                {compromissos.map((a) => (
                  <tr key={a.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(a.starts_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>
                      {a.contact_id ? (
                        <Link href={`/painel/contatos/${a.contact_id}`}>{a.contato?.name ?? "—"}</Link>
                      ) : "—"}
                    </td>
                    <td className="text-dim">{a.service ?? "—"}</td>
                    <td>
                      <span className={a.origem === "motor" ? "badge badge-brand" : "badge"}>
                        {a.origem === "motor" ? "fechado pela IA" : a.origem}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <form action={cancelarCompromisso}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="back" value="/painel/agenda" />
                        <button type="submit" className="linklike text-faint" style={{ fontSize: 12 }}>cancelar</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
