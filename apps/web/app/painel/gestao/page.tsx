import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { median, percentile, responseMinutes, fmtDuration } from "@/lib/metrics";
import { hasAIKey } from "@/lib/ai";
import { brl } from "@/lib/money";
import Analista from "./Analista";
import { stagesForaDeJogo } from "@/lib/recurrence";

export const metadata = { title: "Gestão" };

type Contact = { id: string; name: string; journey_stage: string; source: string | null; owner_id: string | null; created_at: string };
type Ix = { contact_id: string | null; direction: string; input_kind: string | null; occurred_at: string };
type Hist = { contact_id: string; to_stage: string; occurred_at: string };
type Member = { id: string; user: { full_name: string | null; email: string | null } | null };

const PERIODS = [
  { dias: 30, label: "30 dias" },
  { dias: 90, label: "90 dias" },
  { dias: 365, label: "12 meses" },
];

function pct(num: number, den: number): string {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

export default async function GestaoPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const { dias: diasRaw } = await searchParams;
  const dias = [30, 90, 365].includes(Number(diasRaw)) ? Number(diasRaw) : 30;

  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Gestão</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }
  const canManage = ["owner", "admin", "manager"].includes(membership.role);
  if (!canManage) {
    return (
      <main>
        <h1>Gestão</h1>
        <p className="text-dim">Esta área é do dono e dos gestores da empresa.</p>
      </main>
    );
  }

  const { stages } = await getSkillFormConfig(tenant.skill_key);
  const wonKeys = new Set(stages.filter((s) => s.won).map((s) => s.key));
  const terminalKeys = stagesForaDeJogo(stages);
  const stageLabel = (k: string) => stages.find((s) => s.key === k)?.label ?? k;

  const startISO = new Date(Date.now() - dias * 86400000).toISOString();
  const supabase = await createClient();

  const [{ data: cData }, { data: ixData }, { data: hData }, { data: mData }, { data: srData }] = await Promise.all([
    supabase.from("contacts").select("id, name, journey_stage, source, owner_id, created_at").eq("tenant_id", tenant.id).is("deleted_at", null),
    supabase.from("interactions").select("contact_id, direction, input_kind, occurred_at").eq("tenant_id", tenant.id).gte("occurred_at", startISO).limit(5000),
    supabase.from("contact_stage_history").select("contact_id, to_stage, occurred_at").eq("tenant_id", tenant.id).gte("occurred_at", startISO).limit(5000),
    supabase.from("memberships").select("id, user:profiles(full_name, email)").eq("tenant_id", tenant.id).eq("status", "active"),
    supabase
      .from("services_rendered")
      .select("performed_by, service, value_cents, occurred_at")
      .eq("tenant_id", tenant.id)
      .gte("occurred_at", startISO)
      .limit(5000),
  ]);

  const contacts = (cData as Contact[] | null) ?? [];
  const ix = (ixData as Ix[] | null) ?? [];
  const hist = (hData as Hist[] | null) ?? [];
  const members = (mData as Member[] | null) ?? [];
  const servicos = (srData as { performed_by: string | null; service: string; value_cents: number; occurred_at: string }[] | null) ?? [];

  // Faturamento: total, por profissional e por serviço.
  const receitaTotal = servicos.reduce((s, x) => s + (x.value_cents ?? 0), 0);
  const receitaDe = (id: string) =>
    servicos.filter((x) => x.performed_by === id).reduce((s, x) => s + (x.value_cents ?? 0), 0);
  const atendidosDe = (id: string) => servicos.filter((x) => x.performed_by === id).length;
  const ticketMedio = servicos.length ? Math.round(receitaTotal / servicos.length) : 0;

  const porServico = new Map<string, { n: number; total: number }>();
  for (const s of servicos) {
    const k = s.service?.trim() || "—";
    const cur = porServico.get(k) ?? { n: 0, total: 0 };
    cur.n++;
    cur.total += s.value_cents ?? 0;
    porServico.set(k, cur);
  }
  const topServicos = [...porServico.entries()]
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const ownerName = (id: string | null) => {
    const m = members.find((x) => x.id === id);
    return m?.user?.full_name ?? m?.user?.email ?? "Sem responsável";
  };

  // Leads e conversão do período (pessoas distintas).
  const leadsPeriodo = contacts.filter((c) => c.created_at >= startISO);
  const ownerOf: Record<string, string | null> = {};
  for (const c of contacts) ownerOf[c.id] = c.owner_id;

  const fechadosSet = new Set<string>();
  for (const h of hist) if (wonKeys.has(h.to_stage)) fechadosSet.add(h.contact_id);
  const fechamentos = fechadosSet.size;

  // Atendimentos no período + tempo de resposta (só mensagem de cliente conta).
  const atendimentos = ix.length;
  const distintosAtendidos = new Set(ix.map((i) => i.contact_id).filter(Boolean)).size;
  const respEvents = ix.filter((i) => i.direction === "outbound" || (i.direction === "inbound" && i.input_kind === "customer_message"));
  const rmins = responseMinutes(respEvents);

  // Distribuição atual por etapa (não-terminais) — os "indecisos" no meio.
  const perStage = stages.filter((s) => !s.terminal).map((s) => ({
    label: s.label, key: s.key, n: contacts.filter((c) => c.journey_stage === s.key).length,
  }));
  const maxStage = Math.max(1, ...perStage.map((s) => s.n));

  // Ranking de vendedores (leads do período × fechamentos no período).
  const ranking = members.map((m) => {
    const owned = leadsPeriodo.filter((c) => c.owner_id === m.id);
    const fechados = [...fechadosSet].filter((cid) => ownerOf[cid] === m.id).length;
    return { id: m.id, name: m.user?.full_name ?? m.user?.email ?? "—", leads: owned.length, fechados };
  }).sort((a, b) => b.fechados - a.fechados || b.leads - a.leads);

  // Origem dos leads do período.
  const bySource = new Map<string, { total: number; fechados: number }>();
  for (const c of leadsPeriodo) {
    const key = c.source?.trim() || "Sem origem";
    const cur = bySource.get(key) ?? { total: 0, fechados: 0 };
    cur.total++;
    if (fechadosSet.has(c.id)) cur.fechados++;
    bySource.set(key, cur);
  }
  const sources = [...bySource.entries()].map(([k, v]) => ({ source: k, ...v })).sort((a, b) => b.total - a.total).slice(0, 8);

  return (
    <main>
      <div className="between">
        <h1>Gestão</h1>
        <div className="seg">
          {PERIODS.map((p) => (
            <Link key={p.dias} href={`/painel/gestao?dias=${p.dias}`} className={dias === p.dias ? "active" : ""}>
              {p.label}
            </Link>
          ))}
        </div>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Visão do dono. Números do período selecionado. Conversão conta pessoas
        distintas; tempo de resposta em mediana e p90.
      </p>

      {hasAIKey() && <Analista dias={dias} />}

      {/* Números-chave */}
      <div className="stat-grid mt-24">
        <div className="card"><div className="stat-num">{atendimentos}</div><div className="stat-label">Atendimentos</div></div>
        <div className="card"><div className="stat-num">{leadsPeriodo.length}</div><div className="stat-label">Leads novos</div></div>
        <div className="card"><div className="stat-num" style={{ color: "var(--success)" }}>{fechamentos}</div><div className="stat-label">Fechamentos</div></div>
        <div className="card"><div className="stat-num" style={{ color: "var(--brand-cyan)" }}>{pct(fechamentos, leadsPeriodo.length)}</div><div className="stat-label">Conversão</div></div>
      </div>

      {/* Faturamento — só aparece quando há atendimento registrado com valor */}
      {servicos.length > 0 && (
        <>
          <div className="stat-grid mt-24">
            <div className="card">
              <div className="stat-num" style={{ color: "var(--success)" }}>{brl(receitaTotal)}</div>
              <div className="stat-label">Faturamento no período</div>
            </div>
            <div className="card">
              <div className="stat-num">{servicos.length}</div>
              <div className="stat-label">Atendimentos realizados</div>
            </div>
            <div className="card">
              <div className="stat-num">{brl(ticketMedio)}</div>
              <div className="stat-label">Ticket médio</div>
            </div>
          </div>

          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Faturamento por profissional</h2>
            <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Profissional</th>
                    <th style={{ textAlign: "right" }}>Atendimentos</th>
                    <th style={{ textAlign: "right" }}>Faturamento</th>
                    <th style={{ textAlign: "right" }}>Ticket médio</th>
                    <th style={{ textAlign: "right" }}>Participação</th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .map((m) => ({ id: m.id, nome: ownerName(m.id), n: atendidosDe(m.id), total: receitaDe(m.id) }))
                    .sort((a, b) => b.total - a.total)
                    .map((r) => (
                      <tr key={r.id}>
                        <td>{r.nome}</td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.n}</td>
                        <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{brl(r.total)}</td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.n ? brl(Math.round(r.total / r.n)) : "—"}</td>
                        <td style={{ textAlign: "right", color: "var(--brand-cyan)", fontVariantNumeric: "tabular-nums" }}>
                          {receitaTotal ? `${Math.round((r.total / receitaTotal) * 100)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>O que mais fatura</h2>
            <div className="card">
              {topServicos.map((s, i) => {
                const max = topServicos[0]?.total || 1;
                return (
                  <div key={s.nome} style={{ padding: "8px 0", borderBottom: i < topServicos.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="between" style={{ marginBottom: 5, fontSize: 14 }}>
                      <span>{s.nome} <span className="text-faint" style={{ fontSize: 12 }}>· {s.n}x</span></span>
                      <strong style={{ fontVariantNumeric: "tabular-nums" }}>{brl(s.total)}</strong>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${(s.total / max) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Tempo de resposta */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Tempo de resposta ao cliente</h2>
        <div className="row wrap" style={{ gap: 8 }}>
          <span className="badge" style={{ padding: "8px 13px", fontSize: 13 }}>Mediana: <strong style={{ color: "var(--text)" }}>{fmtDuration(median(rmins))}</strong></span>
          <span className="badge" style={{ padding: "8px 13px", fontSize: 13 }}>p90: <strong style={{ color: "var(--text)" }}>{fmtDuration(percentile(rmins, 90))}</strong></span>
          <span className="text-faint" style={{ fontSize: 13, alignSelf: "center" }}>({rmins.length} medições · {distintosAtendidos} clientes atendidos)</span>
        </div>
      </section>

      {/* Distribuição por etapa */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Onde estão os contatos agora</h2>
        <div className="card">
          {perStage.map((s, i) => (
            <div key={s.key} style={{ padding: "9px 0", borderBottom: i < perStage.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="between" style={{ marginBottom: 6, fontSize: 14 }}>
                <span>{s.label}</span>
                <strong style={{ fontVariantNumeric: "tabular-nums" }}>{s.n}</strong>
              </div>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(s.n / maxStage) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      {/* Ranking de vendedores */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Desempenho da equipe</h2>
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th style={{ textAlign: "right" }}>Leads</th>
                <th style={{ textAlign: "right" }}>Fechamentos</th>
                <th style={{ textAlign: "right" }}>Conversão</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.leads}</td>
                  <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{r.fechados}</td>
                  <td style={{ textAlign: "right", color: "var(--brand-cyan)", fontVariantNumeric: "tabular-nums" }}>{pct(r.fechados, r.leads)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Origem dos leads */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 15, margin: "0 0 12px" }}>Origem dos leads (e o que converte)</h2>
        {sources.length === 0 ? (
          <p className="text-dim" style={{ fontSize: 14 }}>Sem leads no período.</p>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Origem</th>
                  <th style={{ textAlign: "right" }}>Leads</th>
                  <th style={{ textAlign: "right" }}>Fechados</th>
                  <th style={{ textAlign: "right" }}>Conversão</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source}>
                    <td>{s.source}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{s.total}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{s.fechados}</td>
                    <td style={{ textAlign: "right", color: "var(--brand-cyan)", fontVariantNumeric: "tabular-nums" }}>{pct(s.fechados, s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
