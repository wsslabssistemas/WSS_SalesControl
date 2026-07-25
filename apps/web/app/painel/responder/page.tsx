import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveTenant } from "@/lib/auth";

type Entry = {
  category: string;
  strategy: string;
  technique: string | null;
  hard_rules: string[];
  common_errors: string[];
  next_objective: string | null;
  required_facts: string[];
  optional_facts: string[];
  entry_type: string;
};

// Resolve "secao.campo" contra o DNA. Retorna texto legível ou null (falta).
function factValue(
  sections: Record<string, unknown>,
  path: string,
): string | null {
  let cur: unknown = sections;
  for (const p of path.split(".")) {
    if (cur == null || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  if (cur == null) return null;
  if (Array.isArray(cur))
    return cur
      .map((x) => (x && typeof x === "object" ? Object.values(x).join(" · ") : String(x)))
      .join("; ");
  if (typeof cur === "object")
    return Object.entries(cur as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  const s = String(cur);
  return s.length ? s : null;
}

const box: React.CSSProperties = {
  border: "1px solid rgba(128,128,128,0.2)",
  borderRadius: 12,
  padding: "16px 18px",
  marginTop: 14,
};

export default async function ResponderPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat = "" } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Responder</h1>
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
  const categories =
    (skill?.manifest as { categories?: Record<string, string> } | null)
      ?.categories ?? {};

  const { data: dna } = await supabase
    .from("commercial_dna")
    .select("sections")
    .eq("tenant_id", tenant.id)
    .eq("is_current", true)
    .maybeSingle();
  const sections = (dna?.sections as Record<string, unknown> | null) ?? {};

  let entries: Entry[] = [];
  let libErro: string | null = null;
  if (cat) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("knowledge_entries")
        .select(
          "category, strategy, technique, hard_rules, common_errors, next_objective, required_facts, optional_facts, entry_type",
        )
        .eq("skill_key", tenant.skill_key)
        .eq("category", cat)
        .is("tenant_id", null)
        .eq("status", "active")
        .order("entry_type");
      entries = (data as Entry[] | null) ?? [];
    } catch {
      libErro = "Biblioteca indisponível (falta SUPABASE_SERVICE_ROLE_KEY).";
    }
  }

  return (
    <main style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Responder</h1>
      <p style={{ opacity: 0.7 }}>
        Escolha a situação do cliente. O sistema mostra a técnica, os fatos da sua
        empresa e o que não afirmar — você escreve e manda pelo WhatsApp.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {Object.entries(categories).map(([key, label]) => (
          <Link
            key={key}
            href={`/painel/responder?cat=${key}`}
            style={{
              textDecoration: "none",
              color: "inherit",
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(128,128,128,0.3)",
              background: key === cat ? "rgba(39,120,174,0.15)" : "transparent",
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {libErro && (
        <p style={{ color: "#c0392b", marginTop: 16 }}>{libErro}</p>
      )}

      {cat && !libErro && entries.length === 0 && (
        <p style={{ opacity: 0.6, marginTop: 16 }}>
          Nenhuma entrada de biblioteca para essa situação.
        </p>
      )}

      {entries.map((e, i) => {
        const missing = e.required_facts.filter((f) => !factValue(sections, f));
        return (
          <div key={i} style={box}>
            <div style={{ fontSize: 12, opacity: 0.55, textTransform: "uppercase", letterSpacing: 1 }}>
              {e.entry_type === "proactive" ? "Proativa" : "Resposta"}
              {e.technique ? ` · ${e.technique}` : ""}
            </div>

            {missing.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(192,57,43,0.4)",
                  background: "rgba(192,57,43,0.08)",
                  fontSize: 13,
                }}
              >
                <strong>Escale — não invente.</strong> Falta no DNA:{" "}
                {missing.join(", ")}. Complete o DNA ou passe para um humano.
              </div>
            )}

            <p style={{ marginTop: 12, whiteSpace: "pre-line" }}>{e.strategy}</p>

            {e.required_facts.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 4 }}>
                  Fatos da sua empresa
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                  {e.required_facts.map((f) => {
                    const v = factValue(sections, f);
                    return (
                      <li key={f} style={{ color: v ? "inherit" : "#c0392b" }}>
                        <span style={{ opacity: 0.6 }}>{f}:</span>{" "}
                        {v ?? "FALTA"}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {e.common_errors.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 13 }}>
                <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 4 }}>
                  Não faça
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.85 }}>
                  {e.common_errors.map((c, j) => (
                    <li key={j}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {e.next_objective && (
              <p style={{ marginTop: 12, fontSize: 13, opacity: 0.7 }}>
                Objetivo: {e.next_objective}
              </p>
            )}
          </div>
        );
      })}
    </main>
  );
}
