import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/platform";
import {
  sugerirPreco,
  margemDe,
  POLITICA_PADRAO,
  MIN_DIAS,
  MIN_ATENDIMENTOS,
  type Politica,
} from "@/lib/precificacao";

export const metadata = { title: "Preço sugerido" };

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * A política vem da URL, não de tabela.
 *
 * São três números de decisão comercial de uma pessoa só. Criar tabela,
 * migration e tela de edição para isso seria construir infraestrutura para um
 * usuário — e o fundador precisa é de simular ("e se eu cobrar 1,50?"), o que a
 * URL faz melhor do que estado salvo. Quando existir mais de um vendedor de
 * plano, aí vira dado.
 */
function politicaDaUrl(q: Record<string, string | string[] | undefined>): Politica {
  const num = (k: string, padrao: number) => {
    const v = Array.isArray(q[k]) ? q[k]?.[0] : q[k];
    const n = Number(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : padrao;
  };
  return {
    margemAlvo: Math.min(0.95, num("margem", POLITICA_PADRAO.margemAlvo * 100) / 100),
    centsPorAtendimento: Math.round(num("atendimento", POLITICA_PADRAO.centsPorAtendimento / 100) * 100),
    minimoContratoCents: Math.round(num("minimo", POLITICA_PADRAO.minimoContratoCents / 100) * 100),
  };
}

const DIA = 86_400_000;

export default async function PrecosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isPlatformAdmin(user?.email)) {
    return (<main><h1>Preço sugerido</h1><p className="text-dim">Restrito à WSS Labs.</p></main>);
  }

  const politica = politicaDaUrl(await searchParams);
  const admin = createAdminClient();

  const [{ data: tenants }, { data: members }, { data: contacts }, { data: interactions }, { data: usage }, { data: payments }] =
    await Promise.all([
      admin.from("tenants").select("id, name, slug, skill_key, plan"),
      admin.from("memberships").select("tenant_id").eq("status", "active"),
      admin.from("contacts").select("tenant_id").is("deleted_at", null),
      admin.from("interactions").select("tenant_id, occurred_at"),
      admin.from("usage_ledger").select("tenant_id, cost_cents, occurred_at"),
      admin.from("tenant_payments").select("tenant_id, amount_cents, status, paid_at"),
    ]);

  type T = { id: string; name: string; slug: string; skill_key: string; plan: string };
  const ts = (tenants as T[] | null) ?? [];
  const ms = (members as { tenant_id: string }[] | null) ?? [];
  const cs = (contacts as { tenant_id: string }[] | null) ?? [];
  const is = (interactions as { tenant_id: string; occurred_at: string }[] | null) ?? [];
  const us = (usage as { tenant_id: string; cost_cents: number; occurred_at: string }[] | null) ?? [];
  const ps = (payments as { tenant_id: string; amount_cents: number; status: string; paid_at: string | null }[] | null) ?? [];

  const agora = Date.now();

  const linhas = ts
    .map((t) => {
      const sinais = [
        ...is.filter((x) => x.tenant_id === t.id).map((x) => new Date(x.occurred_at).getTime()),
        ...us.filter((x) => x.tenant_id === t.id).map((x) => new Date(x.occurred_at).getTime()),
      ].filter((n) => Number.isFinite(n));

      // A JANELA é do primeiro sinal até hoje — não desde a criação da empresa.
      // Empresa cadastrada há seis meses que usou por três dias não tem seis
      // meses de observação; tem três dias. E o "último sinal" fica visível ao
      // lado, senão a janela longa esconderia quem parou de usar.
      const primeiro = sinais.length ? Math.min(...sinais) : null;
      const ultimo = sinais.length ? Math.max(...sinais) : null;
      const diasObservados = primeiro ? Math.max(0, Math.floor((agora - primeiro) / DIA)) : 0;
      const diasParado = ultimo ? Math.floor((agora - ultimo) / DIA) : null;

      const observado = {
        membros: ms.filter((x) => x.tenant_id === t.id).length,
        contatos: cs.filter((x) => x.tenant_id === t.id).length,
        atendimentos: is.filter((x) => x.tenant_id === t.id).length,
        custoIaCents: us.filter((x) => x.tenant_id === t.id).reduce((s, x) => s + (x.cost_cents ?? 0), 0),
        diasObservados,
      };

      const pagos = ps.filter((x) => x.tenant_id === t.id && x.status === "paid");
      const praticado = pagos.length
        ? pagos.sort((a, b) => String(b.paid_at ?? "").localeCompare(String(a.paid_at ?? "")))[0].amount_cents
        : null;

      return { t, observado, diasParado, praticado, sugestao: sugerirPreco(observado, politica) };
    })
    .sort((a, b) => {
      // Quem já tem preço para conferir primeiro; depois os que dá para sugerir.
      const peso = (x: typeof a) => (x.praticado ? 0 : x.sugestao.tipo === "faixa" ? 1 : 2);
      return peso(a) - peso(b) || b.observado.atendimentos - a.observado.atendimentos;
    });

  const comSugestao = linhas.filter((l) => l.sugestao.tipo === "faixa").length;

  return (
    <main>
      <div className="between">
        <h1>Preço sugerido</h1>
        <Link href="/painel/admin" className="btn btn-sm btn-ghost">← Fabricante</Link>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        A conta que ancora o preço no que foi <strong>medido</strong>: custo de IA já gasto e
        atendimentos observados. A política de preço é sua — mexa nos três números abaixo e a
        tabela recalcula.
      </p>

      <div className="card mt-16" style={{ borderColor: "rgba(234,181,77,0.35)" }}>
        <p style={{ marginTop: 0, marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
          O que esta tela não faz
        </p>
        <p className="text-dim" style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
          Não prevê potencial. O pedido original era pontuar a empresa pela{" "}
          <strong>conversão observada no trial</strong> — e existem <strong>0 desfechos
          registrados</strong> no banco, o mesmo bloqueio que congelou o M2. Um score alimentado
          por esse buraco não sairia impreciso: sairia inventado, com cara de número, decidindo
          preço de cliente real. Quando houver desfecho registrado, ele entra aqui como fator —
          e vai ser um fator medido.
        </p>
      </div>

      <form className="card mt-16" method="get">
        <div className="row wrap" style={{ gap: 16, alignItems: "flex-end" }}>
          <label style={{ fontSize: 13 }}>
            <div className="text-faint" style={{ marginBottom: 4 }}>Margem alvo (%)</div>
            <input name="margem" defaultValue={Math.round(politica.margemAlvo * 100)} inputMode="decimal" style={{ width: 90 }} />
          </label>
          <label style={{ fontSize: 13 }}>
            <div className="text-faint" style={{ marginBottom: 4 }}>Por atendimento (R$)</div>
            <input name="atendimento" defaultValue={(politica.centsPorAtendimento / 100).toFixed(2)} inputMode="decimal" style={{ width: 110 }} />
          </label>
          <label style={{ fontSize: 13 }}>
            <div className="text-faint" style={{ marginBottom: 4 }}>Mínimo de contrato (R$)</div>
            <input name="minimo" defaultValue={(politica.minimoContratoCents / 100).toFixed(2)} inputMode="decimal" style={{ width: 130 }} />
          </label>
          <button type="submit" className="btn btn-sm btn-primary">Recalcular</button>
          <span className="text-faint" style={{ fontSize: 12 }}>
            {comSugestao} de {linhas.length} empresas com dado suficiente
          </span>
        </div>
      </form>

      <div className="stack mt-24" style={{ gap: 14 }}>
        {linhas.map(({ t, observado, diasParado, praticado, sugestao }) => {
          const margemPraticada =
            praticado && sugestao.tipo === "faixa" ? margemDe(praticado, sugestao.custoIaMesCents) : null;
          return (
            <div key={t.id} className="card">
              <div className="between" style={{ alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <strong>{t.name}</strong>
                  <span className="text-faint" style={{ fontSize: 12 }}> · {t.slug} · {t.skill_key}</span>
                </div>
                {sugestao.tipo === "faixa" ? (
                  <span className={sugestao.confianca === "alta" ? "badge badge-success" : "badge"}>
                    confiança {sugestao.confianca === "alta" ? "alta" : "média"}
                  </span>
                ) : (
                  <span className="badge badge-warn">sem dado suficiente</span>
                )}
              </div>

              <p className="text-faint" style={{ margin: "8px 0 0", fontSize: 12 }}>
                {observado.membros} membros · {observado.contatos} contatos ·{" "}
                {observado.atendimentos} atendimentos em {observado.diasObservados} dias ·{" "}
                custo de IA {brl(observado.custoIaCents)}
                {diasParado != null && diasParado > 14 && (
                  <span style={{ color: "var(--warn)" }}> · sem sinal há {diasParado} dias</span>
                )}
              </p>

              {sugestao.tipo === "insuficiente" ? (
                <div className="mt-16" style={{ padding: "10px 14px", borderRadius: 10, background: "var(--surface-2)" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600 }}>Não sugiro preço para esta empresa.</p>
                  <ul className="text-dim" style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>
                    {sugestao.motivos.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                  {sugestao.pisoCents != null && (
                    <p className="text-dim" style={{ margin: "8px 0 0", fontSize: 13 }}>
                      O que já dá para afirmar: <strong>{brl(sugestao.pisoCents)}/mês</strong> é o piso —
                      abaixo disso o custo de IA já gasto não cabe na margem alvo. Custo é fato; o resto seria projeção.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="row wrap mt-16" style={{ gap: 22, alignItems: "baseline" }}>
                    <div>
                      <div className="text-faint" style={{ fontSize: 11 }}>PISO</div>
                      <div style={{ fontSize: 16 }}>{brl(sugestao.pisoCents)}</div>
                    </div>
                    <div>
                      <div className="text-faint" style={{ fontSize: 11 }}>SUGERIDO</div>
                      <div className="brand-text" style={{ fontSize: 24, fontWeight: 700 }}>
                        {brl(sugestao.sugeridoCents)}
                      </div>
                    </div>
                    <div>
                      <div className="text-faint" style={{ fontSize: 11 }}>TETO PELO PORTE</div>
                      <div style={{ fontSize: 16 }}>{brl(sugestao.tetoCents)}</div>
                    </div>
                    {praticado != null && (
                      <div>
                        <div className="text-faint" style={{ fontSize: 11 }}>HOJE COBRA</div>
                        <div style={{ fontSize: 16, color: praticado < sugestao.pisoCents ? "var(--danger)" : "var(--text)" }}>
                          {brl(praticado)}
                          {margemPraticada != null && (
                            <span className="text-faint" style={{ fontSize: 12 }}>
                              {" "}· margem {Math.round(margemPraticada * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {praticado != null && praticado < sugestao.pisoCents && (
                    <p className="badge badge-danger mt-16">
                      Cobrando abaixo do piso: o custo de IA não cabe na margem alvo.
                    </p>
                  )}

                  <ul className="text-dim mt-16" style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}>
                    {sugestao.base.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-faint mt-24" style={{ fontSize: 12, lineHeight: 1.7 }}>
        Regras da recusa: mínimo de {MIN_DIAS} dias de uso observado e {MIN_ATENDIMENTOS} atendimentos.
        Menos que isso não tem forma de mês nem média que signifique alguma coisa — e um preço
        errado cobra, ao contrário de um relatório errado.
      </p>
    </main>
  );
}
