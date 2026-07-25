import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";

type Member = {
  id: string;
  role: string;
  user: { full_name: string | null; email: string | null } | null;
};

export default async function EquipePage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;

  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Equipe</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }

  const supabase = await createClient();

  const { data: members } = await supabase
    .from("memberships")
    .select("id, role, user:profiles(full_name, email)")
    .eq("tenant_id", tenant.id)
    .eq("status", "active");

  const { data: contacts } = await supabase
    .from("contacts")
    .select("owner_id")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null);

  const team = (members as Member[] | null) ?? [];
  const owned = (contacts as { owner_id: string | null }[] | null) ?? [];
  const countOwned = (memberId: string) =>
    owned.filter((c) => c.owner_id === memberId).length;

  return (
    <main>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Equipe</h1>
      <p style={{ opacity: 0.7 }}>
        Desempenho por vendedor. Vendedor não é tabela — é um vínculo com papel.
      </p>

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
            <th style={{ padding: "8px 0" }}>Pessoa</th>
            <th>Papel</th>
            <th style={{ textAlign: "right" }}>Contatos</th>
          </tr>
        </thead>
        <tbody>
          {team.map((m) => (
            <tr
              key={m.id}
              style={{ borderTop: "1px solid rgba(128,128,128,0.15)" }}
            >
              <td style={{ padding: "10px 0" }}>
                {m.user?.full_name ?? m.user?.email ?? "—"}
              </td>
              <td>{m.role}</td>
              <td style={{ textAlign: "right" }}>{countOwned(m.id)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {team.length === 0 && (
        <p style={{ opacity: 0.6, marginTop: 12 }}>Sem membros ativos ainda.</p>
      )}

      <p style={{ marginTop: 24, fontSize: 13, opacity: 0.6 }}>
        Métricas canônicas (conversão, tempo de resposta em mediana e p90) entram
        quando houver atendimentos registrados.
      </p>
    </main>
  );
}
