import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { searchCompanies, enderecosDe, type Company } from "@/lib/prospect";
import { ordenarPorProximidade, bairrosEncontrados, cepDigits } from "@/lib/proximidade";
import { alvosPorFamilia, alvosDasLinhas } from "@/lib/cnae";
import { saveIcp, addOpportunity } from "./actions";

export const metadata = { title: "Oportunidades" };

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; buscar?: string; added?: string; dup?: string; novo?: string; perto?: string; bairro?: string }>;
}) {
  const { ok, erro, buscar, added, dup, novo, perto, bairro } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Oportunidades</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("prospeccao")) {
    return (
      <main style={{ maxWidth: 560 }}>
        <h1>Oportunidades</h1>
        <div className="card mt-16">
          <p style={{ marginTop: 0 }}>
            A prospecção B2B (empresas-alvo por segmento e região) não está no plano
            do seu segmento.
          </p>
          <p className="text-dim" style={{ marginBottom: 0, fontSize: 14 }}>
            É um módulo à parte, indicado para quem capta ativamente (distribuidoras,
            automação, fornecedores). Fale com a WSS Labs para habilitar.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: t } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  // `cnaes` é o que a busca usa (alvos marcados + extras digitados, já
  // resolvidos no salvamento). `extras` guarda só o que foi digitado à mão,
  // para a caixa de texto voltar com o que a pessoa escreveu e não com a lista
  // inteira expandida pelos checkboxes.
  const icp = ((t?.settings as Record<string, unknown> | null)?.icp as { cnaes?: string[]; municipios?: string[]; extras?: string[] } | undefined) ?? {};
  const isAdmin = membership!.role === "owner" || membership!.role === "admin";
  const hasIcp = (icp.cnaes?.length ?? 0) > 0 && (icp.municipios?.length ?? 0) > 0;
  const marcados = alvosDasLinhas(icp.cnaes ?? []);

  // Busca sob demanda (Passo 2).
  let result: { total: number; companies: Company[]; capped: boolean } | null = null;
  let searchError: string | null = null;
  if (buscar && hasIcp) {
    try {
      result = await searchCompanies({ cnaes: icp.cnaes ?? [], cities: icp.municipios ?? [] });
    } catch (e) {
      searchError = e instanceof Error ? e.message : "Falha na busca";
    }
  }

  // PROXIMIDADE — segunda etapa, e não parte da busca. A busca pública NÃO
  // devolve endereço (verificado em ago/2026: só cnpj, razão, fantasia e
  // situação). Bairro e CEP só existem no enriquecimento, uma chamada por
  // CNPJ, e por isso isto acontece sob demanda e com teto.
  const cepDaEmpresa = cepDigits((t?.settings as Record<string, unknown> | null)?.cep as string | undefined ?? null);
  let comEndereco: Awaited<ReturnType<typeof ordenarPorProximidade>> = [];
  let bairros: { bairro: string; n: number }[] = [];
  if (result && perto) {
    const mapa = await enderecosDe(result.companies.map((c) => c.cnpj));
    const enriquecidas = result.companies.map((c) => ({
      cnpj: c.cnpj, razao: c.razao, fantasia: c.fantasia,
      bairro: mapa.get(c.cnpj)?.bairro ?? null,
      cep: mapa.get(c.cnpj)?.cep ?? null,
      municipio: mapa.get(c.cnpj)?.municipio ?? null,
    }));
    bairros = bairrosEncontrados(enriquecidas);
    const filtradas = bairro ? enriquecidas.filter((e) => (e.bairro ?? "") === bairro) : enriquecidas;
    comEndereco = ordenarPorProximidade(filtradas, cepDaEmpresa);
  }

  return (
    <main style={{ maxWidth: 640 }}>
      <h1>Oportunidades</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Encontre empresas-alvo por segmento (CNAE) e região usando dados públicos.
        Elas entram como oportunidades no seu funil — você aborda no Responder.
      </p>

      {ok && <p className="badge badge-success mt-16">Perfil de cliente ideal salvo.</p>}
      {erro && <p className="badge badge-danger mt-16">{erro}</p>}
      {added && (
        <div className="card mt-16" style={{ borderColor: "var(--border-brand)", background: "var(--brand-gradient-soft)" }}>
          <div className="between wrap" style={{ gap: 10, alignItems: "center" }}>
            <div>
              <strong>{added} está no seu funil.</strong>
              <p className="text-dim" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Próximo passo: fazer o primeiro contato. A IA escreve a abordagem pra você.
              </p>
            </div>
            {novo && (
              <Link href={`/painel/responder?customer=${novo}`} className="btn btn-sm btn-primary" style={{ whiteSpace: "nowrap" }}>
                Abordar agora →
              </Link>
            )}
          </div>
        </div>
      )}
      {dup && <p className="badge badge-warn mt-16">{dup} já está na sua base.</p>}

      {/* Passo 1: Perfil de Cliente Ideal (sem custo) */}
      <div className="card mt-16">
        <p className="eyebrow" style={{ marginBottom: 4 }}>Passo 1 · Perfil de cliente ideal</p>
        <p className="text-dim" style={{ marginTop: 0, fontSize: 14 }}>
          Defina os segmentos (código CNAE) e as cidades que você quer atender.
          É de graça e orienta toda a busca.
        </p>
        {isAdmin ? (
          <form action={saveIcp} className="stack mt-16" style={{ gap: 14 }}>
            {/* ESCOLHER POR NOME, não por código. Exigir `9313-1/00` faz o
                filtro só servir para quem já sabe — e foi assim que o ICP de
                uma academia real acabou com CNAE de instalação elétrica. */}
            <fieldset className="stack" style={{ gap: 10, border: 0, padding: 0, margin: 0 }}>
              <legend className="text-dim" style={{ fontSize: 13, padding: 0 }}>
                Ramos-alvo — marque os que você quer atender
              </legend>
              <div className="row wrap" style={{ gap: 6 }}>
                {alvosPorFamilia("ramo").map((a) => (
                  <label key={a.key} className="badge" style={{ cursor: "pointer", fontWeight: 400 }}>
                    <input type="checkbox" name="alvos" value={a.key} defaultChecked={marcados.includes(a.key)} style={{ marginRight: 6 }} />
                    {a.rotulo}
                  </label>
                ))}
              </div>

              {/* A resposta para quem atende PESSOA no bairro: prospecção fria
                  B2C é proibida (LGPD, decisão fechada), mas prospectar o
                  EMPREGADOR dela para convênio é B2B com dado público. */}
              <legend className="text-dim" style={{ fontSize: 13, padding: 0, marginTop: 8 }}>
                Ou empresas para <strong>convênio corporativo</strong> — para quem atende pessoa e não pode prospectar pessoa
              </legend>
              <div className="row wrap" style={{ gap: 6 }}>
                {alvosPorFamilia("convenio").map((a) => (
                  <label key={a.key} className="badge" style={{ cursor: "pointer", fontWeight: 400 }} title={a.nota}>
                    <input type="checkbox" name="alvos" value={a.key} defaultChecked={marcados.includes(a.key)} style={{ marginRight: 6 }} />
                    {a.rotulo}
                  </label>
                ))}
              </div>
              <p className="text-faint" style={{ fontSize: 12, margin: 0 }}>
                A busca pública filtra por ramo e cidade — <strong>não</strong> por porte nem
                por distância. Quantos funcionários a empresa tem só aparece ao abrir cada CNPJ.
              </p>
            </fieldset>

            <label className="text-dim" style={{ fontSize: 13 }}>
              <span style={{ display: "block", marginBottom: 5 }}>CNAEs extras, se você já souber o código (um por linha)</span>
              <textarea name="cnaes" className="input" rows={2} defaultValue={(icp.extras ?? []).join("\n")} placeholder={"9313-1/00 academias"} />
            </label>
            <label className="text-dim" style={{ fontSize: 13 }}>
              <span style={{ display: "block", marginBottom: 5 }}>
                CEP da sua empresa (para ordenar por proximidade)
              </span>
              <input name="cep" defaultValue={cepDaEmpresa ?? ""} placeholder="90035190" inputMode="numeric" />
              <span className="text-faint" style={{ display: "block", fontSize: 12, marginTop: 4 }}>
                Sem ele a lista sai na ordem que a fonte devolveu. Não é raio em km —
                a fonte pública não tem coordenada.
              </span>
            </label>
            <label className="text-dim" style={{ fontSize: 13 }}>
              <span style={{ display: "block", marginBottom: 5 }}>Cidades/UF (uma por linha — ex.: Porto Alegre/RS)</span>
              <textarea name="municipios" className="input" rows={4} defaultValue={(icp.municipios ?? []).join("\n")} placeholder={"Porto Alegre/RS\nCanoas/RS"} />
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
          <p className="eyebrow" style={{ margin: 0 }}>Passo 2 · Buscar empresas</p>
          {hasIcp && (
            <Link href="/painel/oportunidades?buscar=1" className="btn btn-sm btn-primary">Buscar empresas</Link>
          )}
        </div>
        {!hasIcp ? (
          <p className="text-dim" style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>
            Configure o Passo 1 (pelo menos um CNAE e uma cidade) para buscar.
          </p>
        ) : (
          <p className="text-dim" style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>
            Base pública de CNPJ (grátis). Perfil: <strong>{(icp.cnaes ?? []).length}</strong> CNAE(s), <strong>{(icp.municipios ?? []).length}</strong> cidade(s).
            Ao adicionar, o telefone é buscado automaticamente.
          </p>
        )}
      </div>

      {searchError && <p className="badge badge-danger mt-16">Busca indisponível: {searchError}</p>}

      {result && (
        <div className="mt-16">
          <p className="text-dim" style={{ fontSize: 13, marginBottom: 4 }}>
            <strong style={{ color: "var(--text)" }}>{result.total.toLocaleString("pt-BR")}</strong> empresas no seu perfil · mostrando <strong style={{ color: "var(--text)" }}>{result.companies.length}</strong>
          </p>
          <p className="text-faint" style={{ fontSize: 12, marginTop: 0, marginBottom: 10 }}>
            Clique no <strong>nome</strong> para ver telefone, e-mail e endereço. <strong>Adicionar</strong> cria o contato no seu funil.
          </p>

          {/* PROXIMIDADE — a resposta ao "não serve para academia sem raio".
              A busca pública NÃO devolve endereço, então bairro e CEP só
              existem numa segunda etapa, uma chamada por CNPJ. É por isso que
              vem em botão e não automático: custa tempo. */}
          {!perto && result.companies.length > 0 && (
            <p style={{ marginBottom: 10 }}>
              <Link href="?buscar=1&perto=1" className="btn btn-sm btn-ghost">
                Ver bairro e ordenar por proximidade
              </Link>
              <span className="text-faint" style={{ fontSize: 12, marginLeft: 8 }}>
                busca o endereço de cada empresa — leva alguns segundos
              </span>
            </p>
          )}

          {perto && (
            <div className="card" style={{ marginBottom: 10 }}>
              <p className="text-dim" style={{ margin: 0, fontSize: 13 }}>
                <strong>Bairro é exato; a ordem é aproximada.</strong> Não existe raio em
                quilômetros aqui: a fonte pública não traz coordenada. A ordem usa a
                proximidade de <strong>CEP</strong>{cepDaEmpresa ? "" : " — e o CEP da sua empresa não está cadastrado, então ela ficou na ordem original"}.
                CEP correlaciona com distância dentro do mesmo município, mas não é
                distância: dois CEPs vizinhos podem estar em lados opostos de um rio.
              </p>
              {bairros.length > 0 && (
                <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
                  <Link href="?buscar=1&perto=1" className={bairro ? "badge" : "badge badge-brand"}>
                    Todos os bairros
                  </Link>
                  {bairros.slice(0, 12).map((b) => (
                    <Link
                      key={b.bairro}
                      href={`?buscar=1&perto=1&bairro=${encodeURIComponent(b.bairro)}`}
                      className={bairro === b.bairro ? "badge badge-brand" : "badge"}
                    >
                      {b.bairro} ({b.n})
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {result.companies.length === 0 ? (
            <div className="card"><p className="text-dim" style={{ margin: 0 }}>Nada encontrado. Revise os CNAEs (só números) e a cidade (ex.: Porto Alegre/RS).</p></div>
          ) : (
            <div className="card" style={{ padding: 0, overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr><th>Empresa</th>{perto && <th>Bairro</th>}<th>CNPJ</th><th></th></tr>
                </thead>
                <tbody>
                  {(perto ? comEndereco : result.companies).map((c) => (
                    <tr key={c.cnpj}>
                      <td>
                        <Link href={`/painel/oportunidades/${c.cnpj}`}>{c.fantasia || c.razao}</Link>
                        {c.fantasia && <span className="text-faint" style={{ fontSize: 12 }}> · {c.razao}</span>}
                      </td>
                      {perto && (
                        <td className="text-dim" style={{ fontSize: 13 }}>
                          {("bairro" in c ? c.bairro : null) ?? "—"}
                        </td>
                      )}
                      <td className="text-dim" style={{ fontVariantNumeric: "tabular-nums" }}>{c.cnpj}</td>
                      <td style={{ textAlign: "right" }}>
                        <form action={addOpportunity}>
                          <input type="hidden" name="cnpj" value={c.cnpj} />
                          <input type="hidden" name="name" value={c.fantasia || c.razao} />
                          <button type="submit" className="btn btn-sm btn-ghost">Adicionar</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.capped && (
            <p className="text-faint mt-16" style={{ fontSize: 12, lineHeight: 1.6 }}>
              A busca pública gratuita mostra uma <strong>amostra</strong> do total. Acesso à
              lista completa ({result.total.toLocaleString("pt-BR")} empresas) e exportação em
              lote entram no plano pago da Prospecção (base completa da Receita).
            </p>
          )}
        </div>
      )}

      <p className="text-faint mt-16" style={{ fontSize: 12 }}>
        <Link href="/painel">← Início</Link>
      </p>
    </main>
  );
}
