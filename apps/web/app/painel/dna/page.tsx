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
  const pct = sections.length ? Math.round((prontas / sections.length) * 100) : 0;

  return (
    <main style={{ maxWidth: 640 }}>
      <div className="between">
        <h1>DNA da empresa</h1>
        <Link href="/painel/dna/editar" className="btn btn-sm btn-primary">
          Editar DNA
        </Link>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Os fatos que o sistema pode afirmar. O que não estiver aqui, ele não inventa —
        escala para um humano.
      </p>

      <div className="card mt-16">
        <div className="between" style={{ marginBottom: 10 }}>
          <strong>{prontas}/{sections.length} seções preenchidas</strong>
          <span className="brand-text" style={{ fontWeight: 700 }}>{pct}%</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${pct}%`, transition: "width .4s ease" }} />
        </div>
      </div>

      <div className="card mt-16">
        {sections.map((s, i) => {
          const ok = isFilled(s.key);
          return (
            <div
              key={s.key}
              className="row"
              style={{ gap: 10, padding: "11px 0", borderBottom: i < sections.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <span className={ok ? "badge badge-success" : "badge badge-danger"}>
                {ok ? "preenchido" : "falta"}
              </span>
              <span className="grow">{s.label}</span>
              {s.required && <span className="text-faint" style={{ fontSize: 11 }}>obrigatória</span>}
            </div>
          );
        })}
      </div>
    </main>
  );
}
