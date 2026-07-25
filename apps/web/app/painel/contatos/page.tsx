import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  journey_stage: string;
  source: string | null;
};

export default async function ContatosPage() {
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

  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("id, name, phone, journey_stage, source")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const contacts = (data as Contact[] | null) ?? [];

  return (
    <main>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Contatos</h1>
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

      {contacts.length === 0 ? (
        <p style={{ opacity: 0.6, marginTop: 16 }}>
          Nenhum contato ainda. Comece adicionando um lead.
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
                <td style={{ padding: "10px 0" }}>{c.name}</td>
                <td>{c.phone ?? "—"}</td>
                <td>{c.journey_stage}</td>
                <td>{c.source ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
