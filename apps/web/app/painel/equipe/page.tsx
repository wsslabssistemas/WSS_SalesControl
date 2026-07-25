import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { changeRole } from "./actions";

type Member = {
  id: string;
  role: string;
  user: { full_name: string | null; email: string | null } | null;
};

const ROLES = ["owner", "admin", "manager", "agent"];

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ convite?: string; ok?: string }>;
}) {
  const sp = await searchParams;
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
  const isAdmin = membership.role === "owner" || membership.role === "admin";

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
  const count = (id: string) => owned.filter((c) => c.owner_id === id).length;

  const inviteLink = sp.convite ? decodeURIComponent(sp.convite) : null;

  return (
    <main>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Equipe</h1>
        {isAdmin && (
          <Link
            href="/painel/equipe/adicionar"
            style={{
              fontSize: 14,
              padding: "8px 14px",
              borderRadius: 8,
              background: "#111",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            + Adicionar
          </Link>
        )}
      </div>

      {inviteLink && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 8,
            border: "1px solid rgba(39,174,96,0.4)",
            background: "rgba(39,174,96,0.08)",
          }}
        >
          <p style={{ margin: "0 0 6px", fontSize: 13 }}>
            Convite gerado. Envie este link para a pessoa (WhatsApp, e-mail) — ela
            define a própria senha:
          </p>
          <input
            readOnly
            value={inviteLink}
            onFocus={(e) => e.currentTarget.select()}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 7,
              border: "1px solid rgba(128,128,128,0.4)",
              background: "transparent",
              color: "inherit",
              font: "inherit",
              fontSize: 12,
            }}
          />
        </div>
      )}
      {sp.ok && (
        <p style={{ marginTop: 12, color: "#1e8449", fontSize: 13 }}>
          Membro vinculado.
        </p>
      )}

      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: 20, fontSize: 14 }}
      >
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.6, fontSize: 12 }}>
            <th style={{ padding: "8px 0" }}>Pessoa</th>
            <th>Papel</th>
            <th style={{ textAlign: "right" }}>Contatos</th>
            {isAdmin && <th style={{ textAlign: "right" }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {team.map((mem) => (
            <tr key={mem.id} style={{ borderTop: "1px solid rgba(128,128,128,0.15)" }}>
              <td style={{ padding: "10px 0" }}>
                {mem.user?.full_name ?? mem.user?.email ?? "—"}
                {mem.user?.full_name && (
                  <span style={{ opacity: 0.5, fontSize: 12 }}> · {mem.user?.email}</span>
                )}
              </td>
              <td>
                {isAdmin && mem.id !== membership.membershipId ? (
                  <form action={changeRole.bind(null, mem.id)} style={{ display: "flex", gap: 6 }}>
                    <select
                      name="role"
                      defaultValue={mem.role}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(128,128,128,0.4)",
                        background: "transparent",
                        color: "inherit",
                        font: "inherit",
                        fontSize: 13,
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      style={{
                        font: "inherit",
                        fontSize: 12,
                        background: "none",
                        border: "1px solid rgba(128,128,128,0.4)",
                        borderRadius: 6,
                        padding: "3px 8px",
                        cursor: "pointer",
                      }}
                    >
                      Salvar
                    </button>
                  </form>
                ) : (
                  mem.role
                )}
              </td>
              <td style={{ textAlign: "right" }}>{count(mem.id)}</td>
              {isAdmin && (
                <td style={{ textAlign: "right" }}>
                  {mem.id !== membership.membershipId ? (
                    <Link
                      href={`/painel/equipe/${mem.id}/remover`}
                      style={{ color: "#c0392b", fontSize: 13 }}
                    >
                      Remover
                    </Link>
                  ) : (
                    <span style={{ opacity: 0.4, fontSize: 13 }}>você</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 24, fontSize: 13, opacity: 0.6 }}>
        Métricas por vendedor (conversão, tempo de resposta) entram quando houver
        atendimentos registrados.
      </p>
    </main>
  );
}
