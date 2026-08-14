import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/platform";
import { computeEntitlements } from "@/lib/entitlements";
import { lerTudo } from "@/lib/paginado";
import {
  limitesEfetivos, avaliarCota, alertaDePerfil, custoProjetadoCents,
  CENTAVOS_POR_RESPOSTA, PERFIS, type Limites, type PerfilKey,
} from "@/lib/cota";
import { salvarLimiteGlobal, salvarLimiteDaEmpresa, aplicarPerfil, seguirPadrao } from "./actions";

export const metadata = { title: "Cota de IA" };

type Tenant = { id: string; name: string; slug: string; skill_key: string; settings: Record<string, unknown> | null };
type Linha = { tenant_id: string | null } & Limites;
type Uso = { tenant_id: string; feature: string; cost_cents: number | null; occurred_at: string };

const reais = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const campo = (v: number | null) => (v === null ? "" : String(v));
const campoReais = (v: number | null) => (v === null ? "" : (v / 100).toFixed(2).replace(".", ","));

export default async function CotasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isPlatformAdmin(user?.email)) {
    return (<main><h1>Cota de IA</h1><p className="text-dim">Restrito à WSS Labs.</p></main>);
  }

  const admin = createAdminClient();
  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const [{ data: tenantsData }, { data: limitesData }, uso] = await Promise.all([
    admin.from("tenants").select("id, name, slug, skill_key, settings").order("name"),
    admin.from("ai_limits").select("tenant_id, respostas_mes, teto_mes_cents, prospeccao_dia, teto_global_mes_cents"),
    // ⚠ PAGINADO. Esta é a tela que decide QUANDO A IA PARA. `respostasDe` e
    // `custoDe` contam linha por linha deste array; cortado em 1.000, a cota
    // consumida aparece menor do que é e uma empresa passa do teto sem que a
    // tela mostre isso. O erro anda na direção de gastar, não de bloquear.
    lerTudo<Uso>((de, ate) => admin
      .from("usage_ledger").select("tenant_id, feature, cost_cents, occurred_at")
      .gte("occurred_at", inicioDoMes.toISOString())
      .order("id").range(de, ate), { rotulo: "uso de IA do mes" }),
  ]);

  const tenants = (tenantsData as Tenant[] | null) ?? [];
  const linhas = (limitesData as Linha[] | null) ?? [];

  const global = linhas.find((l) => l.tenant_id === null) ?? null;
  const doTenant = (id: string) => linhas.find((l) => l.tenant_id === id) ?? null;

  const respostasDe = (id: string) => uso.filter((u) => u.tenant_id === id && u.feature === "responder_ai").length;
  const custoDe = (id: string) => uso.filter((u) => u.tenant_id === id).reduce((s, u) => s + (u.cost_cents ?? 0), 0);
  const custoGlobal = uso.reduce((s, u) => s + (u.cost_cents ?? 0), 0);
  const tetoGlobal = global?.teto_global_mes_cents ?? null;
  const usoGlobalPct = tetoGlobal ? Math.min(100, Math.round((custoGlobal / tetoGlobal) * 100)) : null;

  return (
    <main>
      <div className="between">
        <h1>Cota de IA</h1>
        <Link href="/painel/admin" className="btn btn-sm btn-ghost">← Fabricante</Link>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        O teto que age sozinho. Custo medido: R$ 0,20 a R$ 0,26 por resposta com IA —
        trinta empresas testando de graça custam cerca de R$ 690 por mês, antes da
        primeira mensalidade. Quando o teto é atingido, a IA para e o{" "}
        <strong>cockpit manual continua ilimitado e sem custo</strong>: nenhuma empresa
        fica sem produto.
      </p>

      {/* -------------------------------------------------- TETO DO FABRICANTE */}
      <div className="card mt-24">
        <div className="between" style={{ alignItems: "baseline" }}>
          <strong>Teto do fabricante e padrão para toda empresa</strong>
          {usoGlobalPct !== null && (
            <span className={usoGlobalPct >= 100 ? "badge badge-danger" : usoGlobalPct >= 80 ? "badge badge-warn" : "badge"}>
              {reais(custoGlobal)} de {reais(tetoGlobal!)} · {usoGlobalPct}%
            </span>
          )}
        </div>
        <p className="text-dim" style={{ fontSize: 13, marginTop: 6 }}>
          A soma é o que quebra o caixa, não a empresa individual: trinta empresas
          dentro da própria cota estouram o bolso sem nenhuma delas ter feito nada
          errado. O teto global não pode ser sobrescrito por empresa.
        </p>
        <form action={salvarLimiteGlobal} className="row wrap mt-16" style={{ gap: 12, alignItems: "flex-end" }}>
          <label className="stack" style={{ gap: 4 }}>
            <span className="text-faint" style={{ fontSize: 12 }}>Respostas com IA / mês</span>
            <input name="respostas_mes" defaultValue={campo(global?.respostas_mes ?? null)} className="input" style={{ width: 120 }} inputMode="numeric" />
          </label>
          <label className="stack" style={{ gap: 4 }}>
            <span className="text-faint" style={{ fontSize: 12 }}>Teto por empresa (R$/mês)</span>
            <input name="teto_mes" defaultValue={campoReais(global?.teto_mes_cents ?? null)} className="input" style={{ width: 140 }} inputMode="decimal" />
          </label>
          <label className="stack" style={{ gap: 4 }}>
            <span className="text-faint" style={{ fontSize: 12 }}>Abordagens / dia</span>
            <input name="prospeccao_dia" defaultValue={campo(global?.prospeccao_dia ?? null)} className="input" style={{ width: 120 }} inputMode="numeric" />
          </label>
          <label className="stack" style={{ gap: 4 }}>
            <span className="text-faint" style={{ fontSize: 12 }}>Teto GLOBAL (R$/mês)</span>
            <input name="teto_global_mes" defaultValue={campoReais(global?.teto_global_mes_cents ?? null)} className="input" style={{ width: 140 }} inputMode="decimal" />
          </label>
          <button className="btn btn-primary btn-sm" type="submit">Salvar</button>
        </form>
        <p className="text-faint" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
          A conta, para decidir com número: cada resposta com IA custa até{" "}
          {reais(CENTAVOS_POR_RESPOSTA)} (o TETO medido, não a média).{" "}
          {global?.respostas_mes
            ? `${global.respostas_mes} respostas/mês = ${reais(custoProjetadoCents(global.respostas_mes))} por empresa.`
            : "Sem cota de respostas, o único freio é o teto de dinheiro."}
        </p>
      </div>

      {/* ------------------------------------------------------- POR EMPRESA */}
      <h2 className="mt-24">Por empresa, no mês corrente</h2>
      <p className="text-dim" style={{ fontSize: 13, marginTop: 4 }}>
        Campo vazio = segue o padrão do fabricante. <strong>Zero bloqueia</strong> —
        não é o mesmo que vazio.
      </p>

      <div className="stack mt-16" style={{ gap: 12 }}>
        {tenants.map((t) => {
          const propria = doTenant(t.id);
          const efetivo = limitesEfetivos(global, propria);
          const consumo = {
            respostasNoMes: respostasDe(t.id),
            custoNoMesCents: custoDe(t.id),
            prospeccaoHoje: 0,
            custoGlobalNoMesCents: custoGlobal,
          };
          const veredito = avaliarCota("resposta", efetivo, consumo);
          const ent = computeEntitlements([], t.settings);
          const alerta = alertaDePerfil({
            emTeste: ent.trialActive,
            temRegraPropria: !!propria,
            padraoRespostas: global?.respostas_mes ?? null,
          });
          const pctResp = efetivo.respostas_mes
            ? Math.min(100, Math.round((consumo.respostasNoMes / efetivo.respostas_mes) * 100))
            : null;

          return (
            <div key={t.id} className="card">
              <div className="between" style={{ alignItems: "baseline" }}>
                <div>
                  <strong>{t.name}</strong>
                  <span className="text-faint" style={{ fontSize: 12 }}> · {t.slug} · {t.skill_key}</span>
                </div>
                {veredito.permitido ? (
                  <span className={pctResp !== null && pctResp >= 80 ? "badge badge-warn" : "badge badge-success"}>
                    IA liberada
                  </span>
                ) : (
                  <span className="badge badge-danger">IA suspensa · {veredito.motivo}</span>
                )}
              </div>

              <div className="row wrap mt-8" style={{ gap: 16, fontSize: 13 }}>
                <span className="text-dim">
                  Respostas: <strong>{consumo.respostasNoMes}</strong>
                  {efetivo.respostas_mes !== null ? ` de ${efetivo.respostas_mes}` : " (sem cota)"}
                </span>
                <span className="text-dim">
                  Custo: <strong>{reais(consumo.custoNoMesCents)}</strong>
                  {efetivo.teto_mes_cents !== null ? ` de ${reais(efetivo.teto_mes_cents)}` : " (sem teto)"}
                </span>
                {!propria && <span className="text-faint">segue o padrão do fabricante</span>}
              </div>

              {alerta && (
                <div className="mt-8" style={{ fontSize: 13 }}>
                  <span className="badge badge-warn">Perfil provavelmente errado</span>
                  <p className="text-dim" style={{ marginTop: 6, marginBottom: 0 }}>{alerta}</p>
                </div>
              )}

              <div className="row wrap mt-16" style={{ gap: 6, alignItems: "center" }}>
                <span className="text-faint" style={{ fontSize: 12 }}>Perfil:</span>
                {(Object.keys(PERFIS) as PerfilKey[]).map((k) => (
                  <form key={k} action={aplicarPerfil}>
                    <input type="hidden" name="tenant_id" value={t.id} />
                    <input type="hidden" name="perfil" value={k} />
                    <button className="btn btn-sm btn-ghost" type="submit">
                      {PERFIS[k].rotulo}
                      {PERFIS[k].respostas_mes !== null && (
                        <span className="text-faint"> · {reais(PERFIS[k].teto_mes_cents!)}</span>
                      )}
                    </button>
                  </form>
                ))}
                {propria && (
                  <form action={seguirPadrao}>
                    <input type="hidden" name="tenant_id" value={t.id} />
                    <button className="btn btn-sm btn-ghost" type="submit">Voltar ao padrão</button>
                  </form>
                )}
              </div>

              <form action={salvarLimiteDaEmpresa} className="row wrap mt-16" style={{ gap: 10, alignItems: "flex-end" }}>
                <input type="hidden" name="tenant_id" value={t.id} />
                <label className="stack" style={{ gap: 4 }}>
                  <span className="text-faint" style={{ fontSize: 12 }}>Respostas / mês</span>
                  <input name="respostas_mes" defaultValue={campo(propria?.respostas_mes ?? null)} placeholder="padrão" className="input" style={{ width: 110 }} inputMode="numeric" />
                </label>
                <label className="stack" style={{ gap: 4 }}>
                  <span className="text-faint" style={{ fontSize: 12 }}>Teto (R$/mês)</span>
                  <input name="teto_mes" defaultValue={campoReais(propria?.teto_mes_cents ?? null)} placeholder="padrão" className="input" style={{ width: 120 }} inputMode="decimal" />
                </label>
                <label className="stack" style={{ gap: 4 }}>
                  <span className="text-faint" style={{ fontSize: 12 }}>Abordagens / dia</span>
                  <input name="prospeccao_dia" defaultValue={campo(propria?.prospeccao_dia ?? null)} placeholder="padrão" className="input" style={{ width: 110 }} inputMode="numeric" />
                </label>
                <button className="btn btn-sm" type="submit">Salvar</button>
              </form>
            </div>
          );
        })}
      </div>
    </main>
  );
}
