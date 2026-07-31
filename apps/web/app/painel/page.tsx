import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { computeAlerts, computeCooling } from "@/lib/agenda";
import { computeDue, labelDia } from "@/lib/recurrence";
import { whatsappNumber } from "@/lib/phone";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  journey_stage: string;
  stage_entered_at: string;
  owner_id: string | null;
  custom: Record<string, unknown> | null;
};
type Ix = { contact_id: string | null; occurred_at: string; outcome: string | null };

const OUTCOMES: { key: string; label: string; color: string }[] = [
  { key: "matriculou", label: "Fecharam", color: "var(--success)" },
  { key: "marcou_visita", label: "Marcaram visita", color: "var(--brand-cyan)" },
  { key: "respondeu", label: "Responderam", color: "var(--brand-blue)" },
  { key: "sumiu", label: "Sumiram", color: "var(--danger)" },
];

export default async function PainelHome() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;

  if (!tenant) {
    return (
      <main>
        <h1>Início</h1>
        <p className="text-dim">Seu usuário ainda não está vinculado a uma empresa.</p>
      </main>
    );
  }

  const { stages, recurrence } = await getSkillFormConfig(tenant.skill_key);
  const supabase = await createClient();

  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const [{ data: contactsData }, { count: membersCount }, { data: ixData }, { data: skill }, { data: dnaRow }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, phone, journey_stage, stage_entered_at, owner_id, custom")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("status", "active"),
    supabase
      .from("interactions")
      .select("contact_id, occurred_at, outcome")
      .eq("tenant_id", tenant.id)
      .order("occurred_at", { ascending: false })
      .limit(2000),
    supabase.from("skills").select("manifest").eq("key", tenant.skill_key).maybeSingle(),
    supabase.from("commercial_dna").select("sections").eq("tenant_id", tenant.id).eq("is_current", true).maybeSingle(),
  ]);

  // Cobertura de DNA (para sugerir o onboarding).
  const dnaSections = (skill?.manifest as { dna_sections?: { key: string }[] } | null)?.dna_sections ?? [];
  const dnaFilledObj = (dnaRow?.sections as Record<string, unknown> | null) ?? {};
  const dnaFilled = dnaSections.filter((s) => {
    const v = dnaFilledObj[s.key];
    if (v == null) return false;
    if (typeof v === "object") return Object.keys(v as object).length > 0;
    return String(v).length > 0;
  }).length;
  const dnaIncompleto = dnaSections.length > 0 && dnaFilled < dnaSections.length;
  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const contacts = (contactsData as Contact[] | null) ?? [];
  const ix = (ixData as Ix[] | null) ?? [];

  const terminalKeys = new Set(stages.filter((s) => s.terminal).map((s) => s.key));
  const emAberto = contacts.filter((c) => !terminalKeys.has(c.journey_stage)).length;

  // Última interação por contato (para "esfriando").
  const lastByContact: Record<string, string> = {};
  for (const i of ix) {
    if (!i.contact_id) continue;
    if (!lastByContact[i.contact_id]) lastByContact[i.contact_id] = i.occurred_at;
  }

  const alerts = computeAlerts(contacts, stages);
  const hoje = alerts.filter((a) => a.days <= 0);
  const cooling = computeCooling(contacts, lastByContact, stages);
  // Segmentos de recompra: quem já está no ponto de voltar.
  const terminalSet = new Set(stages.filter((s) => s.terminal).map((s) => s.key));
  const retornos = computeDue(contacts, lastByContact, recurrence, terminalSet);

  // Resultados dos últimos 30 dias (do feedback registrado).
  const recentOutcomes = ix.filter((i) => i.outcome && i.occurred_at >= monthAgo);
  const outcomeCount = (k: string) => recentOutcomes.filter((i) => i.outcome === k).length;

  const stageLabel = (k: string) => stages.find((s) => s.key === k)?.label ?? k;
  const perStage = stages
    .filter((s) => !s.terminal)
    .map((s) => ({ label: s.label, key: s.key, n: contacts.filter((c) => c.journey_stage === s.key).length }));

  const waLink = (phone: string | null) => {
    const wa = whatsappNumber(phone);
    return wa ? `https://wa.me/${wa}` : null;
  };

  return (
    <main>
      <div className="between">
        <h1>{tenant.name}</h1>
        <Link href="/painel/contatos/novo" className="btn btn-primary btn-sm">
          + Novo contato
        </Link>
      </div>

      {/* Onboarding: calibrar o DNA */}
      {isAdmin && dnaIncompleto && (
        <Link href="/painel/onboarding" className="card card-hover mt-16" style={{ display: "block", borderColor: "var(--border-brand)", background: "var(--brand-gradient-soft)" }}>
          <div className="between" style={{ alignItems: "center", gap: 12 }}>
            <div>
              <strong>Termine de calibrar seu Kairós</strong>
              <p className="text-dim" style={{ margin: "4px 0 0", fontSize: 14 }}>
                {dnaFilled}/{dnaSections.length} seções do DNA preenchidas. Complete o onboarding para o sistema responder com os seus fatos.
              </p>
            </div>
            <span className="btn btn-sm btn-primary" style={{ whiteSpace: "nowrap" }}>Continuar →</span>
          </div>
        </Link>
      )}

      {/* Números-chave */}
      <div className="stat-grid mt-24">
        <div className="card">
          <div className="stat-num">{contacts.length}</div>
          <div className="stat-label">Contatos</div>
        </div>
        <div className="card">
          <div className="stat-num">{emAberto}</div>
          <div className="stat-label">Em aberto</div>
        </div>
        <Link href="/painel/agenda" className="card card-hover" style={{ display: "block" }}>
          <div className="stat-num" style={{ color: hoje.length ? "var(--warn)" : undefined }}>{hoje.length}</div>
          <div className="stat-label">Toques hoje</div>
        </Link>
        <div className="card">
          <div className="stat-num" style={{ color: cooling.length ? "var(--danger)" : undefined }}>{cooling.length}</div>
          <div className="stat-label">Esfriando</div>
        </div>
      </div>

      {/* Resultados dos últimos 30 dias — o feedback do que aconteceu */}
      {recentOutcomes.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Resultados (últimos 30 dias)</h2>
          <div className="row wrap" style={{ gap: 8 }}>
            {OUTCOMES.map((o) => (
              <span key={o.key} className="badge" style={{ padding: "8px 13px", fontSize: 13 }}>
                {o.label}: <strong style={{ color: o.color }}>{outcomeCount(o.key)}</strong>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recompra: quem já está no ponto de voltar (segmentos com ciclo) */}
      {retornos.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div className="between" style={{ alignItems: "baseline" }}>
            <h2 style={{ fontSize: 15, margin: 0 }}>Hora de chamar de volta</h2>
            <span className="text-faint" style={{ fontSize: 13 }}>pelo ciclo de cada cliente</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 10 }}>
            {retornos.slice(0, 8).map((r) => {
              const wa = waLink(r.phone);
              const atrasado = r.overdueDays > 0;
              return (
                <li
                  key={r.contactId}
                  className="row wrap"
                  style={{ gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}
                >
                  <span className={atrasado ? "badge badge-danger" : "badge badge-success"} style={{ minWidth: 62, justifyContent: "center" }}>
                    {atrasado ? `+${r.overdueDays}d` : "no ponto"}
                  </span>
                  <Link href={`/painel/contatos/${r.contactId}`} className="grow" style={{ minWidth: 120 }}>
                    {r.name}
                  </Link>
                  <span className="text-faint" style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                    {r.daysSince}d desde a última · ciclo {r.intervalDays}d
                  </span>
                  <span className="badge badge-brand" style={{ whiteSpace: "nowrap" }}>
                    sugerir {r.suggested.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    {r.preferredDay ? ` (${labelDia(r.preferredDay)})` : ""}
                  </span>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: "#25D366", color: "#0b2e13", border: "none", padding: "3px 10px" }}>
                      WhatsApp
                    </a>
                  )}
                  <Link href={`/painel/responder?customer=${r.contactId}`} className="btn btn-sm btn-ghost">
                    Chamar
                  </Link>
                </li>
              );
            })}
            {retornos.length > 8 && (
              <li className="text-faint" style={{ fontSize: 13, paddingTop: 10, textAlign: "center" }}>
                +{retornos.length - 8} outros no ponto de voltar
              </li>
            )}
          </ul>
        </section>
      )}

      {/* Leads esfriando — a fila de ação: quem você está prestes a perder */}
      <section style={{ marginTop: 32 }}>
        <div className="between" style={{ alignItems: "baseline" }}>
          <h2 style={{ fontSize: 15, margin: 0 }}>Leads esfriando</h2>
          <span className="text-faint" style={{ fontSize: 13 }}>sem contato há 3 dias ou mais</span>
        </div>
        {cooling.length === 0 ? (
          <p className="text-dim" style={{ fontSize: 14, marginTop: 10 }}>
            Ninguém esfriando. Sua base está aquecida. 🔥
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 10 }}>
            {cooling.slice(0, 8).map((c) => {
              const wa = waLink(c.phone);
              return (
                <li
                  key={c.contactId}
                  className="row"
                  style={{ gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}
                >
                  <span className={c.days >= 7 ? "badge badge-danger" : "badge badge-warn"} style={{ minWidth: 44, justifyContent: "center" }}>
                    {c.days}d
                  </span>
                  <Link href={`/painel/contatos/${c.contactId}`} className="grow">{c.name}</Link>
                  <span className="text-faint" style={{ whiteSpace: "nowrap" }}>{c.stageLabel}</span>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: "#25D366", color: "#0b2e13", border: "none", padding: "3px 10px" }}>
                      WhatsApp
                    </a>
                  )}
                  <Link href={`/painel/responder?customer=${c.contactId}`} className="btn btn-sm btn-ghost">
                    Responder
                  </Link>
                </li>
              );
            })}
            {cooling.length > 8 && (
              <li className="text-faint" style={{ fontSize: 13, paddingTop: 10, textAlign: "center" }}>
                +{cooling.length - 8} outros esfriando
              </li>
            )}
          </ul>
        )}
      </section>

      {/* Toques de hoje */}
      <section style={{ marginTop: 32 }}>
        <div className="between" style={{ alignItems: "baseline" }}>
          <h2 style={{ fontSize: 15, margin: 0 }}>Para hoje</h2>
          <Link href="/painel/agenda" style={{ fontSize: 13, opacity: 0.7 }}>ver agenda</Link>
        </div>
        {hoje.length === 0 ? (
          <p className="text-dim" style={{ fontSize: 14, marginTop: 10 }}>Nenhum toque pendente para hoje.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 10 }}>
            {hoje.slice(0, 6).map((a, i) => (
              <li key={`${a.contactId}-${i}`} className="row" style={{ gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
                <span className={a.days < 0 ? "badge badge-danger" : "badge badge-warn"}>
                  {a.days < 0 ? "atrasado" : "hoje"}
                </span>
                <Link href={`/painel/contatos/${a.contactId}`} className="grow">{a.name}</Link>
                <span className="text-faint">{a.phaseLabel}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Funil resumido */}
      <section style={{ marginTop: 32 }}>
        <div className="between" style={{ alignItems: "baseline" }}>
          <h2 style={{ fontSize: 15, margin: 0 }}>Funil</h2>
          <Link href="/painel/funil" style={{ fontSize: 13, opacity: 0.7 }}>ver funil</Link>
        </div>
        <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
          {perStage.map((s) => (
            <Link key={s.key} href={`/painel/contatos?etapa=${s.key}`} className="badge" style={{ padding: "7px 12px", fontSize: 13 }}>
              {s.label}: <strong style={{ color: "var(--text)" }}>{s.n}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
