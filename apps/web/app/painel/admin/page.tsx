import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/platform";
import { salvarTetoGlobal } from "./actions";

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

/**
 * OS PERÍODOS DO CUSTO.
 *
 * O painel só mostrava o acumulado desde sempre, e acumulado desde sempre não
 * responde a pergunta que se faz olhando ele: *"quanto isso está me custando
 * por mês?"*. Com meses de operação, o total vira um número que só cresce e
 * que não serve para decidir teto nem preço — e o teto é mensal.
 *
 * O total continua existindo, porque é ele que responde a outra pergunta:
 * *"quanto já saiu do meu bolso até hoje?"*. São perguntas diferentes e as
 * duas importam; o defeito era ter só uma delas.
 */
const PERIODOS = [
  { key: "mes", label: "Este mês" },
  { key: "anterior", label: "Mês passado" },
  { key: "total", label: "Total desde sempre" },
] as const;
type PeriodoKey = (typeof PERIODOS)[number]["key"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const sp = await searchParams;
  const periodo: PeriodoKey = PERIODOS.some((p) => p.key === sp.periodo)
    ? (sp.periodo as PeriodoKey)
    : "mes";
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

  const agora = new Date();
  const inicioDoMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1).toISOString();

  // A JANELA DO PERÍODO ESCOLHIDO. `total` não filtra nada — é o acumulado.
  const janela = periodo === "mes"
    ? { de: inicioDoMes, ate: null as string | null }
    : periodo === "anterior"
      ? { de: inicioMesAnterior, ate: inicioDoMes }
      : { de: null as string | null, ate: null as string | null };

  // Leitura cross-tenant (acima da RLS) — só para o fabricante.
  const [
    { data: tenants },
    { data: contacts },
    { data: members },
    { data: usage },
    { data: payments },
    { data: limiteGlobal },
    { data: usoDoMes },
  ] = await Promise.all([
    admin.from("tenants").select("id, name, slug, plan, status"),
    admin.from("contacts").select("tenant_id").is("deleted_at", null),
    admin.from("memberships").select("tenant_id").eq("status", "active"),
    // O CUSTO POR EMPRESA RESPEITA O PERÍODO ESCOLHIDO. Antes era sempre o
    // acumulado desde sempre, o que fazia a coluna "Custo IA" não bater com a
    // barra do teto logo acima — a barra é mensal. Dois números de custo na
    // mesma tela, um mensal e outro eterno, sem nada dizendo qual era qual.
    (() => {
      let q = admin.from("usage_ledger").select("tenant_id, cost_cents, tokens_in, tokens_out");
      if (janela.de) q = q.gte("occurred_at", janela.de);
      if (janela.ate) q = q.lt("occurred_at", janela.ate);
      return q;
    })(),
    admin.from("tenant_payments").select("tenant_id, amount_cents, status"),
    // O FREIO DE GASTO, na primeira tela. Ele morava só em /painel/admin/cotas
    // e o fundador nao achava — "que painel? painel do que?". Configuracao de
    // seguranca que exige lembrar de um caminho e configuracao que ninguem
    // revisa, e um freio que ninguem revisa e um freio que ninguem conferiu.
    admin.from("ai_limits").select("teto_global_mes_cents").is("tenant_id", null).maybeSingle(),
    admin.from("usage_ledger").select("cost_cents").gte("occurred_at", inicioDoMes),
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

  // O FREIO: quanto ja se gastou no mes contra o teto que o fabricante mesmo
  // definiu. Nao e o saldo da Anthropic — esse a API deles nao expoe, e
  // inventar um numero de saldo seria pior que nao mostrar nenhum.
  const tetoGlobalCents = (limiteGlobal as { teto_global_mes_cents: number | null } | null)?.teto_global_mes_cents ?? null;
  const gastoNoMes = ((usoDoMes as { cost_cents: number | null }[] | null) ?? [])
    .reduce((s2, u) => s2 + (u.cost_cents ?? 0), 0);
  const folga = tetoGlobalCents === null ? null : Math.max(0, tetoGlobalCents - gastoNoMes);
  const pctUsado = tetoGlobalCents ? Math.min(100, Math.round((gastoNoMes / tetoGlobalCents) * 100)) : 0;
  const apertado = tetoGlobalCents !== null && pctUsado >= 80;

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

      {/* O PERÍODO GOVERNA CUSTO E TOKENS, não o recebido — pagamento não tem
          a mesma data do consumo, e fingir que tem produziria uma "margem"
          que não é margem de nada. Por isso o rótulo da coluna muda junto. */}
      <div className="row wrap mt-16" style={{ gap: 6, alignItems: "center" }}>
        <span className="text-faint" style={{ fontSize: 12 }}>Custo de IA em:</span>
        {PERIODOS.map((p) => (
          <Link
            key={p.key}
            href={`/painel/admin?periodo=${p.key}`}
            className={periodo === p.key ? "btn btn-sm btn-primary" : "btn btn-sm btn-ghost"}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* FREIO DE GASTO — o que o fundador precisava e nao achava. */}
      <div className="card mt-24" style={{ borderColor: apertado ? "var(--danger)" : undefined }}>
        <div className="between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 6 }}>Freio de gasto com IA</p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 600 }}>
              {brl(gastoNoMes)}
              <span className="text-faint" style={{ fontSize: 15, fontWeight: 400 }}>
                {" "}gastos este mês{tetoGlobalCents !== null ? ` de ${brl(tetoGlobalCents)}` : ""}
              </span>
            </p>
            {tetoGlobalCents === null ? (
              <p className="badge badge-warn" style={{ marginTop: 10 }}>
                Sem teto definido — a IA não para sozinha se o gasto disparar.
              </p>
            ) : (
              <p className="text-dim" style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                Folga de <strong>{brl(folga ?? 0)}</strong>. Ao bater o teto, a geração com IA
                é suspensa até virar o mês — <strong>o cockpit manual continua funcionando e
                não custa nada</strong>, então nenhuma empresa fica sem produto.
              </p>
            )}
          </div>

          <form action={salvarTetoGlobal} className="row" style={{ gap: 8, alignItems: "flex-end" }}>
            <label className="stack" style={{ gap: 4 }}>
              <span className="text-faint" style={{ fontSize: 12 }}>Teto do mês (R$)</span>
              <input
                name="teto_global_mes"
                defaultValue={tetoGlobalCents === null ? "" : (tetoGlobalCents / 100).toFixed(2).replace(".", ",")}
                className="input" style={{ width: 120 }} inputMode="decimal" placeholder="sem teto"
              />
            </label>
            <button type="submit" className="btn btn-sm btn-primary">Salvar</button>
          </form>
        </div>

        {tetoGlobalCents !== null && (
          <div style={{ height: 6, background: "var(--border)", borderRadius: 3, marginTop: 14, overflow: "hidden" }}>
            <div style={{ width: `${pctUsado}%`, height: "100%", background: apertado ? "var(--danger)" : "var(--brand-cyan)" }} />
          </div>
        )}

        <p className="text-faint" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
          Este é o <strong>seu</strong> freio, não o saldo da Anthropic — ele conta o que o
          Kairós gastou. O saldo de créditos da conta que gera as respostas fica no
          console da Anthropic, e a API deles não o expõe para mostrarmos aqui.
          Se aquele saldo acabar, a IA para pelo outro motivo.
        </p>
      </div>

      <div className="stat-grid mt-24">
        <div className="card"><div className="stat-num">{ts.length}</div><div className="stat-label">Empresas</div></div>
        <div className="card"><div className="stat-num">{brl(totalRecebido)}</div><div className="stat-label">Recebido</div></div>
        <div className="card"><div className="stat-num">{brl(totalCost)}</div><div className="stat-label">Custo de IA · {PERIODOS.find((p) => p.key === periodo)!.label.toLowerCase()}</div></div>
        <div className="card"><div className="stat-num">{fmt(totalTokens)}</div><div className="stat-label">Tokens</div></div>
        {/* ⚠ MARGEM SÓ EXISTE NO TOTAL, e isto não é preciosismo.
            Recebido e consumo não caem no mesmo mês: o cliente paga a
            mensalidade num dia e gasta IA o mês inteiro. Subtrair o custo de
            AGOSTO do recebido DE SEMPRE dá um número que parece margem, tem
            cara de margem e não é margem de nada — exatamente o tipo de
            número plausível que este projeto existe para não produzir. */}
        <div className="card">
          <div className="stat-num" style={{ color: periodo === "total" ? "var(--brand-cyan)" : undefined }}>
            {periodo === "total" ? brl(totalRecebido - totalCost) : "—"}
          </div>
          <div className="stat-label">
            {periodo === "total" ? "Margem" : "Margem (só no total)"}
          </div>
        </div>
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
              <th style={{ textAlign: "right" }}>Custo IA<br /><span className="text-faint" style={{ fontSize: 10, fontWeight: 400 }}>{PERIODOS.find((p) => p.key === periodo)!.label.toLowerCase()}</span></th>
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
                <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{periodo === "total" ? brl(margem(t.id)) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
