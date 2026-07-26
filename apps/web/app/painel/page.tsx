import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { computeAlerts } from "@/lib/agenda";

type Contact = {
  id: string;
  name: string;
  journey_stage: string;
  stage_entered_at: string;
};

export default async function PainelHome() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;

  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Início</h1>
        <p style={{ opacity: 0.85 }}>
          Seu usuário ainda não está vinculado a uma empresa.
        </p>
      </main>
    );
  }

  const { stages } = await getSkillFormConfig(tenant.skill_key);
  const supabase = await createClient();

  const [{ data: contactsData }, { count: membersCount }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, journey_stage, stage_entered_at")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("status", "active"),
  ]);

  const contacts = (contactsData as Contact[] | null) ?? [];
  const terminalKeys = new Set(stages.filter((s) => s.terminal).map((s) => s.key));
  const emAberto = contacts.filter((c) => !terminalKeys.has(c.journey_stage)).length;

  const alerts = computeAlerts(contacts, stages);
  const hoje = alerts.filter((a) => a.days <= 0);

  const stageLabel = (k: string) => stages.find((s) => s.key === k)?.label ?? k;
  const perStage = stages
    .filter((s) => !s.terminal)
    .map((s) => ({
      label: s.label,
      key: s.key,
      n: contacts.filter((c) => c.journey_stage === s.key).length,
    }));

  return (
    <main>
      <div className="between">
        <h1>{tenant.name}</h1>
        <Link href="/painel/contatos/novo" className="btn btn-primary btn-sm">
          + Novo contato
        </Link>
      </div>

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
          <div className="stat-num" style={{ color: hoje.length ? "var(--warn)" : undefined }}>
            {hoje.length}
          </div>
          <div className="stat-label">Toques hoje</div>
        </Link>
        <Link href="/painel/equipe" className="card card-hover" style={{ display: "block" }}>
          <div className="stat-num">{membersCount ?? 0}</div>
          <div className="stat-label">Equipe</div>
        </Link>
      </div>

      {/* Toques de hoje */}
      <section style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ fontSize: 15, margin: 0 }}>Para hoje</h2>
          <Link href="/painel/agenda" style={{ fontSize: 13, opacity: 0.7 }}>
            ver agenda
          </Link>
        </div>
        {hoje.length === 0 ? (
          <p style={{ opacity: 0.6, fontSize: 14, marginTop: 10 }}>
            Nenhum toque pendente para hoje.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 10 }}>
            {hoje.slice(0, 6).map((a, i) => (
              <li
                key={`${a.contactId}-${i}`}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(128,128,128,0.12)",
                  fontSize: 14,
                }}
              >
                <span className={a.days < 0 ? "badge badge-danger" : "badge badge-warn"}>
                  {a.days < 0 ? "atrasado" : "hoje"}
                </span>
                <Link href={`/painel/contatos/${a.contactId}`} className="grow">
                  {a.name}
                </Link>
                <span className="text-faint">{a.phaseLabel}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Funil resumido */}
      <section style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ fontSize: 15, margin: 0 }}>Funil</h2>
          <Link href="/painel/funil" style={{ fontSize: 13, opacity: 0.7 }}>
            ver funil
          </Link>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {perStage.map((s) => (
            <Link
              key={s.key}
              href={`/painel/contatos?etapa=${s.key}`}
              className="badge"
              style={{ padding: "7px 12px", fontSize: 13 }}
            >
              {s.label}: <strong style={{ color: "var(--text)" }}>{s.n}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
