import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/platform";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
};
type Usage = { tenant_id: string; cost_cents: number; tokens_in: number; tokens_out: number };
type Payment = { tenant_id: string; amount_cents: number; status: string };

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function AdminPage() {
  // Quem está logado?
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isPlatformAdmin(user?.email)) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Painel do fabricante</h1>
        <p style={{ opacity: 0.85 }}>
          Acesso restrito à WSS Labs. Se é você, adicione seu e-mail em
          <code> PLATFORM_ADMIN_EMAILS</code> nas variáveis da Vercel.
        </p>
      </main>
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Painel do fabricante</h1>
        <p style={{ opacity: 0.85 }}>
          Falta a <code>SUPABASE_SERVICE_ROLE_KEY</code> no ambiente.
        </p>
      </main>
    );
  }

  // Leitura cross-tenant (acima da RLS) — só para o fabricante.
  const [
    { data: tenants },
    { data: contacts },
    { data: members },
    { data: usage },
    { data: payments },
  ] = await Promise.all([
    admin.from("tenants").select("id, name, slug, plan, status"),
    admin.from("contacts").select("tenant_id").is("deleted_at", null),
    admin.from("memberships").select("tenant_id").eq("status", "active"),
    admin.from("usage_ledger").select("tenant_id, cost_cents, tokens_in, tokens_out"),
    admin.from("tenant_payments").select("tenant_id, amount_cents, status"),
  ]);

  const ts = (tenants as Tenant[] | null) ?? [];
  const cs = (contacts as { tenant_id: string }[] | null) ?? [];
  const ms = (members as { tenant_id: string }[] | null) ?? [];
  const us = (usage as Usage[] | null) ?? [];
  const ps = (payments as Payment[] | null) ?? [];

  const count = (arr: { tenant_id: string }[], id: string) =>
    arr.filter((x) => x.tenant_id === id).length;
  const cost = (id: string) =>
    us.filter((u) => u.tenant_id === id).reduce((s, u) => s + (u.cost_cents ?? 0), 0);

  const recebido = (id: string) =>
    ps
      .filter((p) => p.tenant_id === id && p.status === "paid")
      .reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const margem = (id: string) => recebido(id) - cost(id);

  const totalCost = us.reduce((s, u) => s + (u.cost_cents ?? 0), 0);
  const totalRecebido = ps
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + (p.amount_cents ?? 0), 0);

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Painel do fabricante</h1>
        <Link href="/painel/admin/pagamentos" style={{ fontSize: 14 }}>
          Pagamentos →
        </Link>
      </div>
      <p style={{ opacity: 0.7 }}>
        Todas as empresas do WSS Kairós. Receita − custo de IA = sua margem.
        Cobrança do cliente é por atendimento, nunca por token.
      </p>

      <div style={{ display: "flex", gap: 24, margin: "16px 0 8px", fontSize: 14, flexWrap: "wrap" }}>
        <span>
          <strong>{ts.length}</strong> empresas
        </span>
        <span>
          Recebido: <strong>{brl(totalRecebido)}</strong>
        </span>
        <span>
          Custo de IA: <strong>{brl(totalCost)}</strong>
        </span>
        <span>
          Margem: <strong>{brl(totalRecebido - totalCost)}</strong>
        </span>
      </div>

      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 14 }}
      >
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.6, fontSize: 12 }}>
            <th style={{ padding: "8px 0" }}>Empresa</th>
            <th>Plano</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Membros</th>
            <th style={{ textAlign: "right" }}>Contatos</th>
            <th style={{ textAlign: "right" }}>Recebido</th>
            <th style={{ textAlign: "right" }}>Custo IA</th>
            <th style={{ textAlign: "right" }}>Margem</th>
          </tr>
        </thead>
        <tbody>
          {ts.map((t) => (
            <tr key={t.id} style={{ borderTop: "1px solid rgba(128,128,128,0.15)" }}>
              <td style={{ padding: "10px 0" }}>
                {t.name}
                <span style={{ opacity: 0.5, fontSize: 12 }}> · {t.slug}</span>
              </td>
              <td>{t.plan}</td>
              <td>{t.status}</td>
              <td style={{ textAlign: "right" }}>{count(ms, t.id)}</td>
              <td style={{ textAlign: "right" }}>{count(cs, t.id)}</td>
              <td style={{ textAlign: "right" }}>{brl(recebido(t.id))}</td>
              <td style={{ textAlign: "right" }}>{brl(cost(t.id))}</td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{brl(margem(t.id))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
