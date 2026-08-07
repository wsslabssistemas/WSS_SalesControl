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
  const tokens = (id: string) =>
    us
      .filter((u) => u.tenant_id === id)
      .reduce((s, u) => s + (u.tokens_in ?? 0) + (u.tokens_out ?? 0), 0);

  const recebido = (id: string) =>
    ps
      .filter((p) => p.tenant_id === id && p.status === "paid")
      .reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const margem = (id: string) => recebido(id) - cost(id);

  const totalCost = us.reduce((s, u) => s + (u.cost_cents ?? 0), 0);
  const totalTokens = us.reduce((s, u) => s + (u.tokens_in ?? 0) + (u.tokens_out ?? 0), 0);
  const totalRecebido = ps
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const fmt = (n: number) => n.toLocaleString("pt-BR");

  return (
    <main>
      <div className="between">
        <h1>Painel do fabricante</h1>
        <div className="row" style={{ gap: 8 }}>
          <Link href="/painel/admin/acesso" className="btn btn-sm btn-ghost">Acesso e planos →</Link>
          <Link href="/painel/admin/cotas" className="btn btn-sm btn-ghost">Cota de IA →</Link>
          <Link href="/painel/admin/precos" className="btn btn-sm btn-ghost">Preço sugerido →</Link>
          <Link href="/painel/admin/pagamentos" className="btn btn-sm btn-ghost">Pagamentos →</Link>
        </div>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Todas as empresas do WSS Kairós. Receita − custo de IA = sua margem. Consumo
        de IA por empresa em tokens e em R$. Cobrança do cliente é por atendimento.
      </p>

      <div className="stat-grid mt-24">
        <div className="card"><div className="stat-num">{ts.length}</div><div className="stat-label">Empresas</div></div>
        <div className="card"><div className="stat-num">{brl(totalRecebido)}</div><div className="stat-label">Recebido</div></div>
        <div className="card"><div className="stat-num">{brl(totalCost)}</div><div className="stat-label">Custo de IA</div></div>
        <div className="card"><div className="stat-num">{fmt(totalTokens)}</div><div className="stat-label">Tokens</div></div>
        <div className="card"><div className="stat-num" style={{ color: "var(--brand-cyan)" }}>{brl(totalRecebido - totalCost)}</div><div className="stat-label">Margem</div></div>
      </div>

      <div className="card mt-24" style={{ padding: 0, overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Plano</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Membros</th>
              <th style={{ textAlign: "right" }}>Contatos</th>
              <th style={{ textAlign: "right" }}>Tokens</th>
              <th style={{ textAlign: "right" }}>Custo IA</th>
              <th style={{ textAlign: "right" }}>Recebido</th>
              <th style={{ textAlign: "right" }}>Margem</th>
            </tr>
          </thead>
          <tbody>
            {ts.map((t) => (
              <tr key={t.id}>
                <td>
                  {t.name}
                  <span className="text-faint" style={{ fontSize: 12 }}> · {t.slug}</span>
                </td>
                <td><span className="badge">{t.plan}</span></td>
                <td>{t.status}</td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{count(ms, t.id)}</td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{count(cs, t.id)}</td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(tokens(t.id))}</td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{brl(cost(t.id))}</td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{brl(recebido(t.id))}</td>
                <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{brl(margem(t.id))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
