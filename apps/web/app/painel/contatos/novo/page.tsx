import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { createContact } from "../actions";

type ContactField = {
  key: string;
  label: string;
  type: string;
  options?: string[];
};
type Stage = { key: string; label: string };

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "9px 11px",
  marginTop: 5,
  border: "1px solid rgba(128,128,128,0.4)",
  borderRadius: 8,
  background: "transparent",
  color: "inherit",
  font: "inherit",
};

export default async function NovoContatoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;

  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Novo contato</h1>
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

  const manifest =
    (skill?.manifest as {
      contact_fields?: ContactField[];
      lead_sources?: string[];
      journey?: { stages?: Stage[] };
    } | null) ?? {};
  const fields = manifest.contact_fields ?? [];
  const sources = manifest.lead_sources ?? [];
  const stages = manifest.journey?.stages ?? [];

  return (
    <main style={{ maxWidth: 460 }}>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Novo contato</h1>
      <p style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>
        Os campos abaixo vêm do módulo <code>{tenant.skill_key}</code>.
      </p>

      <form action={createContact} style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <label style={{ fontSize: 13, opacity: 0.85 }}>
          Nome *
          <input name="name" required style={field} />
        </label>

        <label style={{ fontSize: 13, opacity: 0.85 }}>
          Telefone
          <input name="phone" style={field} />
        </label>

        <label style={{ fontSize: 13, opacity: 0.85 }}>
          Origem
          <select name="source" style={field} defaultValue="">
            <option value="">—</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label style={{ fontSize: 13, opacity: 0.85 }}>
          Etapa
          <select name="journey_stage" style={field} defaultValue="contato">
            {stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {fields.map((f) => (
          <label key={f.key} style={{ fontSize: 13, opacity: 0.85 }}>
            {f.label}
            {f.type === "enum" ? (
              <select name={`custom.${f.key}`} style={field} defaultValue="">
                <option value="">—</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input name={`custom.${f.key}`} style={field} />
            )}
          </label>
        ))}

        <button
          type="submit"
          style={{
            marginTop: 6,
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: "#111",
            color: "#fff",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Salvar contato
        </button>

        {erro && <p style={{ color: "#c0392b", fontSize: 13 }}>{erro}</p>}
      </form>
    </main>
  );
}
