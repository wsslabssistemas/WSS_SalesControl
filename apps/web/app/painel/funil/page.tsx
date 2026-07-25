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
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Funil de vendas</h1>
      <p style={{ opacity: 0.7 }}>
        {total} contatos no funil
        {wonKeys.length > 0 && (
          <>
            {" · "}conversão <strong>{conv}%</strong> ({won} de {total})
          </>
        )}
      </p>

      {total === 0 && (
        <p style={{ opacity: 0.6 }}>
          Nenhum contato ainda. Quando as conversas entrarem, o funil se preenche.
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
        {stages.map((s) => {
          const n = countOf(s.key);
          const pct = Math.round((n / max) * 100);
          return (
            <li key={s.key} style={{ margin: "10px 0" }}>
              <Link
                href={`/painel/contatos?etapa=${s.key}`}
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                    marginBottom: 4,
                  }}
                >
                  <span>
                    {s.label}
                    {s.terminal && (
                      <span style={{ opacity: 0.4, fontSize: 11 }}> · final</span>
                    )}
                  </span>
                  <strong>{n}</strong>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: "rgba(128,128,128,0.15)",
                  }}
                >
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      width: `${pct}%`,
                      background: "rgba(39,120,174,0.6)",
                    }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <p style={{ marginTop: 24, fontSize: 13, opacity: 0.6 }}>
        Conversão = contatos na etapa ganha ÷ total de leads. Clique numa etapa
        para ver as pessoas.
      </p>
    </main>
  );
}
