import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/platform";
import { registerPayment } from "../actions";

type Tenant = { id: string; name: string };
type Payment = {
  id: string;
  tenant_id: string;
  period: string;
  amount_cents: number;
  status: string;
  paid_at: string | null;
};

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const field: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid rgba(128,128,128,0.4)",
  borderRadius: 8,
  background: "transparent",
  color: "inherit",
  font: "inherit",
};

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isPlatformAdmin(user?.email)) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Pagamentos</h1>
        <p style={{ opacity: 0.85 }}>Acesso restrito à WSS Labs.</p>
      </main>
    );
  }

  const admin = createAdminClient();
  const [{ data: tenants }, { data: payments }] = await Promise.all([
    admin.from("tenants").select("id, name").order("name"),
    admin
      .from("tenant_payments")
      .select("id, tenant_id, period, amount_cents, status, paid_at")
      .order("created_at", { ascending: false }),
  ]);

  const ts = (tenants as Tenant[] | null) ?? [];
  const ps = (payments as Payment[] | null) ?? [];
  const nome = (id: string) => ts.find((t) => t.id === id)?.name ?? id;

  return (
    <main style={{ maxWidth: 760 }}>
      <Link href="/painel/admin" style={{ fontSize: 13, opacity: 0.7 }}>
        ← Fabricante
      </Link>
      <h1 style={{ fontSize: 24, margin: "8px 0 0" }}>Pagamentos</h1>
      <p style={{ opacity: 0.7 }}>Registre quem pagou, quanto e quando.</p>

      <form
        action={registerPayment}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end", marginTop: 16 }}
      >
        <select name="tenant_id" required style={field} defaultValue="">
          <option value="" disabled>
            Empresa
          </option>
          {ts.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input name="period" placeholder="Período (2026-07)" required style={field} />
        <input name="amount" placeholder="Valor (169,00)" required style={{ ...field, width: 120 }} />
        <select name="status" defaultValue="paid" style={field}>
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
        </select>
        <button
          type="submit"
          style={{
            ...field,
            background: "#111",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Registrar
        </button>
      </form>
      {sp.ok && <p style={{ color: "#1e8449", fontSize: 13 }}>Pagamento registrado.</p>}
      {sp.erro && <p style={{ color: "#c0392b", fontSize: 13 }}>{sp.erro}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24, fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.6, fontSize: 12 }}>
            <th style={{ padding: "8px 0" }}>Empresa</th>
            <th>Período</th>
            <th style={{ textAlign: "right" }}>Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ps.map((p) => (
            <tr key={p.id} style={{ borderTop: "1px solid rgba(128,128,128,0.15)" }}>
              <td style={{ padding: "10px 0" }}>{nome(p.tenant_id)}</td>
              <td>{p.period}</td>
              <td style={{ textAlign: "right" }}>{brl(p.amount_cents)}</td>
              <td style={{ color: p.status === "paid" ? "#1e8449" : "#b9770e" }}>
                {p.status === "paid" ? "pago" : "pendente"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {ps.length === 0 && (
        <p style={{ opacity: 0.6, marginTop: 12 }}>Nenhum pagamento registrado ainda.</p>
      )}
    </main>
  );
}
