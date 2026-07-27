import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { searchEditais, type Edital } from "@/lib/licitacoes";
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
  searchParams: Promise<{ ok?: string; erro?: string; buscar?: string }>;
}) {
  const { ok, erro, buscar } = await searchParams;
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

  return (
    <main style={{ maxWidth: 720 }}>
      <h1>Licitações</h1>
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
          {hasConfig && <Link href="/painel/licitacoes?buscar=1" className="btn btn-sm btn-primary">Buscar editais</Link>}
        </div>
        {!hasConfig ? (
          <p className="text-dim" style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>Configure o Passo 1 (ao menos um estado) para buscar.</p>
        ) : (
          <p className="text-dim" style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>
            Estados: <strong>{(gov.ufs ?? []).join(", ")}</strong>{(gov.keywords?.length ?? 0) > 0 ? <> · Palavras: <strong>{(gov.keywords ?? []).length}</strong></> : <> · <span className="text-faint">sem filtro de palavra (mostra todos)</span></>}
          </p>
        )}
      </div>

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
