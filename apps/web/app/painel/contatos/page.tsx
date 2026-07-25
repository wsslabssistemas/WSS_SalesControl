import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { displayPhone } from "@/lib/phone";

const PAGE_SIZE = 20;

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  journey_stage: string;
  source: string | null;
};

const control: React.CSSProperties = {
  padding: "8px 11px",
  border: "1px solid rgba(128,128,128,0.4)",
  borderRadius: 8,
  background: "transparent",
  color: "inherit",
  font: "inherit",
};

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; etapa?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const etapa = sp.etapa ?? "";
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Contatos</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }

  const { stages } = await getSkillFormConfig(tenant.skill_key);
  const from = (pageNum - 1) * PAGE_SIZE;

  const supabase = await createClient();
  let query = supabase
    .from("contacts")
    .select("id, name, phone, journey_stage, source", { count: "exact" })
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null);

  const term = q.replace(/[,()%*]/g, "").trim();
  if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  if (etapa) query = query.eq("journey_stage", etapa);

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const contacts = (data as Contact[] | null) ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const stageLabel = (key: string) =>
    stages.find((s) => s.key === key)?.label ?? key;

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (etapa) p.set("etapa", etapa);
    if (n > 1) p.set("page", String(n));
    const s = p.toString();
    return s ? `?${s}` : "?";
  };

  return (
    <main>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 24, marginTop: 0 }}>
          Contatos{" "}
          <span style={{ fontSize: 14, opacity: 0.5, fontWeight: 400 }}>
            ({total})
          </span>
        </h1>
        <Link
          href="/painel/contatos/novo"
          style={{
            fontSize: 14,
            padding: "8px 14px",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          + Novo contato
        </Link>
      </div>

      {/* Busca + filtro (GET: server-side, sem JS) */}
      <form
        method="get"
        style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou telefone"
          style={{ ...control, flex: 1, minWidth: 180 }}
        />
        <select name="etapa" defaultValue={etapa} style={control}>
          <option value="">Todas as etapas</option>
          {stages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="submit" style={{ ...control, cursor: "pointer" }}>
          Buscar
        </button>
      </form>

      {contacts.length === 0 ? (
        <p style={{ opacity: 0.6, marginTop: 20 }}>
          {term || etapa
            ? "Nenhum contato para esse filtro."
            : "Nenhum contato ainda. Comece adicionando um lead."}
        </p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 16,
            fontSize: 14,
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", opacity: 0.6, fontSize: 12 }}>
              <th style={{ padding: "8px 0" }}>Nome</th>
              <th>Telefone</th>
              <th>Etapa</th>
              <th>Origem</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr
                key={c.id}
                style={{ borderTop: "1px solid rgba(128,128,128,0.15)" }}
              >
                <td style={{ padding: "10px 0" }}>
                  <Link href={`/painel/contatos/${c.id}`}>{c.name}</Link>
                </td>
                <td>{displayPhone(c.phone)}</td>
                <td>{stageLabel(c.journey_stage)}</td>
                <td>{c.source ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 20,
            fontSize: 14,
          }}
        >
          {pageNum > 1 ? (
            <Link href={pageHref(pageNum - 1)}>← Anterior</Link>
          ) : (
            <span style={{ opacity: 0.3 }}>← Anterior</span>
          )}
          <span style={{ opacity: 0.6 }}>
            Página {pageNum} de {totalPages}
          </span>
          {pageNum < totalPages ? (
            <Link href={pageHref(pageNum + 1)}>Próxima →</Link>
          ) : (
            <span style={{ opacity: 0.3 }}>Próxima →</span>
          )}
        </div>
      )}
    </main>
  );
}
