import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { searchEditais, analyzeEditais, type Edital, type Intel } from "@/lib/licitacoes";
import { saveGovIcp } from "./actions";

export const metadata = { title: "Licitações" };

function diasAte(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

export default async function LicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; buscar?: string; intel?: string }>;
}) {
  const { ok, erro, buscar, intel } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return (<main><h1>Licitações</h1><p className="text-dim">Sem empresa vinculada.</p></main>);

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("licitacoes")) {
    return (
      <main style={{ maxWidth: 560 }}>
        <h1>Licitações</h1>
        <div className="card mt-16">
          <p style={{ marginTop: 0 }}>O monitor de licitações não está no plano do seu segmento.</p>
          <p className="text-dim" style={{ marginBottom: 0, fontSize: 14 }}>
            É um módulo à parte para quem vende ao poder público. Fale com a WSS Labs para habilitar.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: t } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const gov = ((t?.settings as Record<string, unknown> | null)?.gov_icp as { ufs?: string[]; keywords?: string[] } | undefined) ?? {};
  const isAdmin = membership!.role === "owner" || membership!.role === "admin";
  const hasConfig = (gov.ufs?.length ?? 0) > 0;

  let editais: Edital[] | null = null;
  let searchError: string | null = null;
  if (buscar && hasConfig) {
    try {
      editais = await searchEditais({ ufs: gov.ufs ?? [], keywords: gov.keywords ?? [] });
    } catch (e) {
      searchError = e instanceof Error ? e.message : "Falha na busca";
    }
  }

  let inteligencia: Intel | null = null;
  if (intel && hasConfig) {
    try {
      inteligencia = await analyzeEditais({ ufs: gov.ufs ?? [], keywords: gov.keywords ?? [] });
    } catch {
      inteligencia = null;
    }
  }

  return (
    <main style={{ maxWidth: 720 }}>
      <div className="between">
        <h1>Licitações</h1>
        <div className="row" style={{ gap: 8 }}>
          <Link href="/painel/licitacoes/vencedores" className="btn btn-sm btn-ghost">Quem ganhou</Link>
          <Link href="/painel/licitacoes/guia" className="btn btn-sm btn-ghost">Guia</Link>
        </div>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Editais públicos abertos do seu ramo e região, via PNCP (Portal Nacional
        de Contratações Públicas). Fonte oficial e gratuita.
      </p>

      {ok && <p className="badge badge-success mt-16">Perfil salvo.</p>}
      {erro && <p className="badge badge-danger mt-16">{erro}</p>}

      {/* Passo 1: perfil */}
      <div className="card mt-16">
        <p className="eyebrow" style={{ marginBottom: 4 }}>Passo 1 · O que monitorar</p>
        <p className="text-dim" style={{ marginTop: 0, fontSize: 14 }}>
          Informe os estados e as palavras-chave do que você fornece. Filtramos os
          editais abertos por isso.
        </p>
        {isAdmin ? (
          <form action={saveGovIcp} className="stack mt-16" style={{ gap: 14 }}>
            <label className="text-dim" style={{ fontSize: 13 }}>
              <span style={{ display: "block", marginBottom: 5 }}>Estados/UF (um por linha — ex.: RS)</span>
              <textarea name="ufs" className="input" rows={3} defaultValue={(gov.ufs ?? []).join("\n")} placeholder={"RS\nSC"} />
            </label>
            <label className="text-dim" style={{ fontSize: 13 }}>
              <span style={{ display: "block", marginBottom: 5 }}>Palavras-chave no objeto (uma por linha — ex.: informática, material elétrico)</span>
              <textarea name="keywords" className="input" rows={4} defaultValue={(gov.keywords ?? []).join("\n")} placeholder={"informática\nmaterial elétrico"} />
            </label>
            <button type="submit" className="btn btn-primary" style={{ justifySelf: "start" }}>Salvar perfil</button>
          </form>
        ) : (
          <p className="text-faint mt-8" style={{ fontSize: 13 }}>Só um administrador configura o perfil.</p>
        )}
      </div>

      {/* Passo 2: busca */}
      <div className="card mt-16">
        <div className="between" style={{ alignItems: "baseline" }}>
          <p className="eyebrow" style={{ margin: 0 }}>Passo 2 · Editais abertos</p>
          {hasConfig && (
            <div className="row" style={{ gap: 8 }}>
              <Link href="/painel/licitacoes?intel=1" className="btn btn-sm btn-ghost">Inteligência</Link>
              <Link href="/painel/licitacoes?buscar=1" className="btn btn-sm btn-primary">Buscar editais</Link>
            </div>
          )}
        </div>
        {!hasConfig ? (
          <p className="text-dim" style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>Configure o Passo 1 (ao menos um estado) para buscar.</p>
        ) : (
          <p className="text-dim" style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>
            Estados: <strong>{(gov.ufs ?? []).join(", ")}</strong>{(gov.keywords?.length ?? 0) > 0 ? <> · Palavras: <strong>{(gov.keywords ?? []).length}</strong></> : <> · <span className="text-faint">sem filtro de palavra (mostra todos)</span></>}
          </p>
        )}
      </div>

      {inteligencia && (
        <div className="mt-16">
          {inteligencia.amostra === 0 ? (
            <div className="card"><p className="text-dim" style={{ margin: 0 }}>Sem editais abertos no perfil para analisar agora.</p></div>
          ) : (
            <>
              <p className="text-dim" style={{ fontSize: 13, marginBottom: 10 }}>
                Análise de <strong style={{ color: "var(--text)" }}>{inteligencia.amostra}</strong> editais abertos do seu perfil.
              </p>

              <div className="card">
                <p className="eyebrow" style={{ marginBottom: 12 }}>Órgãos que mais abrem (seus alvos)</p>
                {inteligencia.byOrgao.map((o, i) => {
                  const max = inteligencia!.byOrgao[0]?.n || 1;
                  return (
                    <div key={o.nome} style={{ padding: "7px 0", borderBottom: i < inteligencia!.byOrgao.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div className="between" style={{ marginBottom: 5, fontSize: 13 }}>
                        <span className="grow" style={{ paddingRight: 10 }}>{o.nome}</span>
                        <strong style={{ fontVariantNumeric: "tabular-nums" }}>{o.n}</strong>
                      </div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(o.n / max) * 100}%` }} /></div>
                    </div>
                  );
                })}
              </div>

              <div className="card mt-16">
                <p className="eyebrow" style={{ marginBottom: 12 }}>Prazos pela frente (editais que encerram por mês)</p>
                {inteligencia.byMes.map((m, i) => {
                  const max = Math.max(...inteligencia!.byMes.map((x) => x.n), 1);
                  return (
                    <div key={m.nome} style={{ padding: "6px 0", borderBottom: i < inteligencia!.byMes.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div className="between" style={{ marginBottom: 5, fontSize: 13 }}>
                        <span>{m.nome}</span>
                        <strong style={{ fontVariantNumeric: "tabular-nums" }}>{m.n}</strong>
                      </div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${(m.n / max) * 100}%` }} /></div>
                    </div>
                  );
                })}
              </div>

              {inteligencia.ritmoEstado.some((r) => r.n > 0) && (
                <div className="card mt-16">
                  <p className="eyebrow" style={{ marginBottom: 4 }}>Ritmo de editais no estado ({inteligencia.ritmoUf}, 12 meses)</p>
                  <p className="text-faint" style={{ margin: "0 0 12px", fontSize: 12 }}>Quando o governo abre mais editais (Pregão Eletrônico, todos os ramos).</p>
                  {inteligencia.ritmoEstado.map((m) => {
                    const max = Math.max(...inteligencia!.ritmoEstado.map((x) => x.n), 1);
                    return (
                      <div key={m.nome} className="row" style={{ gap: 10, padding: "4px 0", fontSize: 12, alignItems: "center" }}>
                        <span className="text-faint" style={{ width: 44 }}>{m.nome}</span>
                        <div className="bar-track grow"><div className="bar-fill" style={{ width: `${(m.n / max) * 100}%` }} /></div>
                        <span style={{ width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{m.n}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="row wrap mt-16" style={{ gap: 16, alignItems: "flex-start" }}>
                <div className="card grow" style={{ minWidth: 220 }}>
                  <p className="eyebrow" style={{ marginBottom: 10 }}>Cidades</p>
                  <div className="row wrap" style={{ gap: 8 }}>
                    {inteligencia.byCidade.map((c) => (
                      <span key={c.nome} className="badge" style={{ padding: "6px 10px", fontSize: 12 }}>{c.nome}: <strong style={{ color: "var(--text)" }}>{c.n}</strong></span>
                    ))}
                  </div>
                </div>
                <div className="card grow" style={{ minWidth: 220 }}>
                  <p className="eyebrow" style={{ marginBottom: 10 }}>Modalidades</p>
                  <div className="row wrap" style={{ gap: 8 }}>
                    {inteligencia.byModalidade.map((c) => (
                      <span key={c.nome} className="badge" style={{ padding: "6px 10px", fontSize: 12 }}>{c.nome}: <strong style={{ color: "var(--text)" }}>{c.n}</strong></span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-faint mt-16" style={{ fontSize: 12 }}>
                Baseado nos editais abertos agora. Sazonalidade histórica (em que meses cada órgão costuma abrir) é o próximo passo.
              </p>
            </>
          )}
        </div>
      )}

      {searchError && <p className="badge badge-danger mt-16">Busca indisponível: {searchError}</p>}

      {editais && (
        <div className="mt-16">
          <p className="text-dim" style={{ fontSize: 13, marginBottom: 10 }}>
            <strong style={{ color: "var(--text)" }}>{editais.length}</strong> edital(is) aberto(s) no seu perfil
          </p>
          {editais.length === 0 ? (
            <div className="card"><p className="text-dim" style={{ margin: 0 }}>Nada aberto agora com esse filtro. Tente menos palavras-chave ou outro estado.</p></div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {editais.map((e) => {
                const dias = diasAte(e.encerramento);
                return (
                  <div key={e.id} className="card">
                    <div className="between" style={{ gap: 10, alignItems: "flex-start" }}>
                      <div className="grow">
                        <p style={{ margin: "0 0 6px", fontSize: 14, lineHeight: 1.5 }}>{e.objeto}</p>
                        <p className="text-faint" style={{ margin: 0, fontSize: 12 }}>
                          {e.orgao} · {e.municipio}/{e.uf} · {e.modalidade}
                        </p>
                      </div>
                      {dias != null && (
                        <span className={dias <= 2 ? "badge badge-danger" : dias <= 7 ? "badge badge-warn" : "badge"} style={{ whiteSpace: "nowrap" }}>
                          {dias < 0 ? "encerrado" : dias === 0 ? "hoje" : `${dias}d`}
                        </span>
                      )}
                    </div>
                    <div className="between mt-16" style={{ alignItems: "center" }}>
                      <span className="text-faint" style={{ fontSize: 12 }}>
                        {e.encerramento ? `encerra ${new Date(e.encerramento).toLocaleDateString("pt-BR")}` : ""}
                      </span>
                      <a href={e.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">Ver no PNCP →</a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="text-faint mt-16" style={{ fontSize: 12 }}>
        <Link href="/painel">← Início</Link>
      </p>
    </main>
  );
}
