import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";

type DnaSection = {
  key: string;
  label: string;
  required?: boolean;
};

export default async function DnaPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;

  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>DNA</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }

  const supabase = await createClient();

  // Manifesto da Skill instalada (RLS: só quem instalou lê).
  const { data: skill } = await supabase
    .from("skills")
    .select("manifest")
    .eq("key", tenant.skill_key)
    .limit(1)
    .maybeSingle();

  // DNA corrente da empresa (RLS: só a própria empresa).
  const { data: dna } = await supabase
    .from("commercial_dna")
    .select("sections")
    .eq("tenant_id", tenant.id)
    .eq("is_current", true)
    .maybeSingle();

  const sections =
    (skill?.manifest as { dna_sections?: DnaSection[] } | null)?.dna_sections ??
    [];
  const filled = (dna?.sections as Record<string, unknown> | null) ?? {};

  const isFilled = (key: string) => {
    const v = filled[key];
    if (v == null) return false;
    if (typeof v === "object") return Object.keys(v as object).length > 0;
    return String(v).length > 0;
  };

  const prontas = sections.filter((s) => isFilled(s.key)).length;

  return (
    <main>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 24, marginTop: 0 }}>DNA da empresa</h1>
        <Link
          href="/painel/dna/editar"
          style={{
            fontSize: 14,
            padding: "8px 14px",
            borderRadius: 8,
            background: "var(--brand-blue)",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          Editar DNA
        </Link>
      </div>
      <p style={{ opacity: 0.7 }}>
        Os fatos que a IA pode afirmar. O que não estiver aqui, ela não inventa —
        escala para um humano. <strong>{prontas}</strong>/{sections.length} seções
        preenchidas.
      </p>

      <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
        {sections.map((s) => {
          const ok = isFilled(s.key);
          return (
            <li
              key={s.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
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
                  background: ok ? "rgba(39,174,96,0.15)" : "rgba(192,57,43,0.12)",
                  color: ok ? "var(--success)" : "var(--danger)",
                }}
              >
                {ok ? "preenchido" : "falta"}
              </span>
              <span>{s.label}</span>
              {s.required && (
                <span style={{ fontSize: 11, opacity: 0.5 }}>obrigatória</span>
              )}
            </li>
          );
        })}
      </ul>

    </main>
  );
}
