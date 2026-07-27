import { getActiveTenant } from "@/lib/auth";
import { inviteMember } from "../actions";

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "9px 11px",
  marginTop: 5,
  border: "1px solid rgba(128,128,128,0.4)",
  borderRadius: 8,
  background: "var(--bg-elev)",
  color: "var(--text)",
  font: "inherit",
};

export default async function AdicionarMembroPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const membership = await getActiveTenant();

  if (!membership?.tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Adicionar</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Adicionar</h1>
        <p style={{ opacity: 0.85 }}>Só um administrador pode adicionar membros.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Adicionar vendedor</h1>
      <p style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>
        A pessoa recebe um link para definir a própria senha e entrar.
      </p>

      <form action={inviteMember} style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <label style={{ fontSize: 13, opacity: 0.85 }}>
          E-mail
          <input name="email" type="email" required style={field} />
        </label>
        <label style={{ fontSize: 13, opacity: 0.85 }}>
          Papel
          <select name="role" defaultValue="agent" style={field}>
            <option value="agent">Vendedor (agent)</option>
            <option value="manager">Gerente (manager)</option>
            <option value="admin">Administrador (admin)</option>
          </select>
        </label>
        <button
          type="submit"
          style={{
            marginTop: 6,
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: "var(--brand-blue)",
            color: "#fff",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Gerar convite
        </button>
        {erro && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erro}</p>}
      </form>
    </main>
  );
}
