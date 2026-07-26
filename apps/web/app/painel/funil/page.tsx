import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";

type Stage = { key: string; label: string; terminal?: boolean; won?: boolean };

export default async function FunilPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;

  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Funil</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }

  const supabase = await createClient();

  const { data: skill } = await supabase
    .from("skills")
    .select("manifest")
    .eq("key", tenant.skill_key)
    .limit(1)
    .maybeSingle();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("journey_stage")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null);

  const stages =
    (skill?.manifest as { journey?: { stages?: Stage[] } } | null)?.journey
      ?.stages ?? [];
  const rows = (contacts as { journey_stage: string }[] | null) ?? [];
  const total = rows.length;
  const countOf = (key: string) =>
    rows.filter((r) => r.journey_stage === key).length;
  const max = Math.max(1, ...stages.map((s) => countOf(s.key)));

  const wonKeys = stages.filter((s) => s.won).map((s) => s.key);
  const won = rows.filter((r) => wonKeys.includes(r.journey_stage)).length;
  const conv = total > 0 ? Math.round((won / total) * 1000) / 10 : 0;

  return (
    <main>
      <h1>Funil de vendas</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        A jornada de cada contato, da entrada ao fechamento.
      </p>

      <div className="stat-grid mt-24">
        <div className="card"><div className="stat-num">{total}</div><div className="stat-label">No funil</div></div>
        {wonKeys.length > 0 && (
          <>
            <div className="card"><div className="stat-num" style={{ color: "var(--success)" }}>{won}</div><div className="stat-label">Ganhos</div></div>
            <div className="card"><div className="stat-num brand-text">{conv}%</div><div className="stat-label">Conversão</div></div>
          </>
        )}
      </div>

      {total === 0 ? (
        <div className="card mt-24">
          <p className="text-dim" style={{ margin: 0 }}>
            Nenhum contato ainda. Quando as conversas entrarem, o funil se preenche.
          </p>
        </div>
      ) : (
        <div className="card mt-24">
          {stages.map((s) => {
            const n = countOf(s.key);
            const pct = Math.round((n / max) * 100);
            return (
              <Link
                key={s.key}
                href={`/painel/contatos?etapa=${s.key}`}
                style={{ display: "block", padding: "10px 0" }}
              >
                <div className="between" style={{ fontSize: 14, marginBottom: 6 }}>
                  <span>
                    {s.label}
                    {s.won && <span className="badge badge-success" style={{ marginLeft: 8 }}>ganho</span>}
                    {s.terminal && !s.won && <span className="text-faint" style={{ fontSize: 11 }}> · final</span>}
                  </span>
                  <strong style={{ fontVariantNumeric: "tabular-nums" }}>{n}</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: s.won ? "var(--success)" : undefined,
                      transition: "width .4s ease",
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-faint" style={{ marginTop: 20, fontSize: 13 }}>
        Conversão = contatos na etapa ganha ÷ total de leads. Clique numa etapa
        para ver as pessoas.
      </p>
    </main>
  );
}
