import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { searchWinners, type Winner } from "@/lib/licitacoes";
import { addOpportunity } from "../../oportunidades/actions";

export const metadata = { title: "Quem ganhou" };

const BACK = "/painel/licitacoes/vencedores?buscar=1";

function brl(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default async function VencedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ buscar?: string; added?: string; dup?: string }>;
}) {
  const { buscar, added, dup } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return (<main><h1>Quem ganhou</h1><p className="text-dim">Sem empresa vinculada.</p></main>);

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("licitacoes")) {
    return (<main><h1>Quem ganhou</h1><p className="text-dim">Disponível com o módulo de Licitações.</p></main>);
  }

  const supabase = await createClient();
  const { data: t } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const gov = ((t?.settings as Record<string, unknown> | null)?.gov_icp as { ufs?: string[]; keywords?: string[] } | undefined) ?? {};
  const hasConfig = (gov.ufs?.length ?? 0) > 0;

  let winners: Winner[] | null = null;
  let err: string | null = null;
  if (buscar && hasConfig) {
    try {
      winners = await searchWinners({ ufs: gov.ufs ?? [], keywords: gov.keywords ?? [] });
    } catch (e) {
      err = e instanceof Error ? e.message : "Falha na busca";
    }
  }

  return (
    <main style={{ maxWidth: 720 }}>
      <Link href="/painel/licitacoes" className="text-dim" style={{ fontSize: 13 }}>← Licitações</Link>
      <h1 className="mt-8">Quem ganhou (clientes potenciais)</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Empresas que <strong>venceram contratos públicos</strong> do seu ramo. Elas
        acabaram de fechar com o governo e podem precisar dos seus produtos para
        entregar. Use o mesmo perfil (UF + palavras) das Licitações.
      </p>

      {added && <p className="badge badge-success mt-16">{added} adicionada ao funil.</p>}
      {dup && <p className="badge badge-warn mt-16">{dup} já está na sua base.</p>}
      {err && <p className="badge badge-danger mt-16">Busca indisponível: {err}</p>}

      <div className="card mt-16">
        <div className="between" style={{ alignItems: "baseline" }}>
          <p className="eyebrow" style={{ margin: 0 }}>Contratos recentes do seu ramo</p>
          {hasConfig && <Link href="/painel/licitacoes/vencedores?buscar=1" className="btn btn-sm btn-primary">Buscar vencedores</Link>}
        </div>
        {!hasConfig ? (
          <p className="text-dim" style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>
            Configure o perfil em <Link href="/painel/licitacoes">Licitações</Link> (UF + palavras-chave) primeiro.
          </p>
        ) : (
          <p className="text-dim" style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>
            Perfil: <strong>{(gov.ufs ?? []).join(", ")}</strong>{(gov.keywords?.length ?? 0) > 0 ? <> · {(gov.keywords ?? []).length} palavra(s)</> : null}. Ao adicionar, buscamos o telefone.
          </p>
        )}
      </div>

      {winners && (
        <div className="mt-16">
          <p className="text-dim" style={{ fontSize: 13, marginBottom: 10 }}>
            <strong style={{ color: "var(--text)" }}>{winners.length}</strong> empresa(s) vencedora(s)
          </p>
          {winners.length === 0 ? (
            <div className="card"><p className="text-dim" style={{ margin: 0 }}>Nenhum contrato recente com esse filtro. Tente outra palavra-chave ou estado.</p></div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {winners.map((w) => (
                <div key={w.cnpj + w.link} className="card">
                  <div className="between" style={{ gap: 10, alignItems: "flex-start" }}>
                    <div className="grow">
                      <strong>{w.razao}</strong>
                      <p className="text-faint" style={{ margin: "4px 0 0", fontSize: 12 }}>
                        Ganhou de {w.orgao} · {w.municipio}/{w.uf}
                        {w.data ? ` · ${new Date(w.data).toLocaleDateString("pt-BR")}` : ""}
                      </p>
                      <p className="text-dim" style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.5 }}>{w.objeto}</p>
                    </div>
                    <span className="badge" style={{ whiteSpace: "nowrap" }}>{brl(w.valor)}</span>
                  </div>
                  <div className="row mt-16" style={{ gap: 10, alignItems: "center" }}>
                    <form action={addOpportunity}>
                      <input type="hidden" name="cnpj" value={w.cnpj} />
                      <input type="hidden" name="name" value={w.razao} />
                      <input type="hidden" name="source" value="Ganhou licitação" />
                      <input type="hidden" name="back" value={BACK} />
                      <button type="submit" className="btn btn-sm btn-primary">+ Funil</button>
                    </form>
                    <a href={w.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">Ver contrato →</a>
                    <span className="text-faint" style={{ fontSize: 12 }}>CNPJ {w.cnpj}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-faint mt-16" style={{ fontSize: 12 }}>
        Fonte: contratos públicos do PNCP. O vencedor vira um contato no seu funil.
      </p>
    </main>
  );
}
