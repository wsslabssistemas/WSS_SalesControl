import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { median, percentile, responseMinutes, fmtDuration } from "@/lib/metrics";
import { hasAIKey } from "@/lib/ai";
import Analista from "./Analista";

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
  const terminalKeys = new Set(stages.filter((s) => s.terminal).map((s) => s.key));
  const stageLabel = (k: string) => stages.find((s) => s.key === k)?.label ?? k;

  const startISO = new Date(Date.now() - dias * 86400000).toISOString();
  const supabase = await createClient();

  const [{ data: cData }, { data: ixData }, { data: hData }, { data: mData }] = await Promise.all([
    supabase.from("contacts").select("id, name, journey_stage, source, owner_id, created_at").eq("tenant_id", tenant.id).is("deleted_at", null),
    supabase.from("interactions").select("contact_id, direction, input_kind, occurred_at").eq("tenant_id", tenant.id).gte("occurred_at", startISO).limit(5000),
    supabase.from("contact_stage_history").select("contact_id, to_stage, occurred_at").eq("tenant_id", tenant.id).gte("occurred_at", startISO).limit(5000),
    supabase.from("memberships").select("id, user:profiles(full_name, email)").eq("tenant_id", tenant.id).eq("status", "active"),
  ]);

  const contacts = (cData as Contact[] | null) ?? [];
  const ix = (ixData as Ix[] | null) ?? [];
  const hist = (hData as Hist[] | null) ?? [];
  const members = (mData as Member[] | null) ?? [];

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
