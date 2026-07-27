import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { saveIcp } from "./actions";

export const metadata = { title: "Oportunidades" };

export default async function OportunidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const { ok, erro } = await searchParams;
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
  const icp = ((t?.settings as Record<string, unknown> | null)?.icp as { cnaes?: string[]; municipios?: string[] } | undefined) ?? {};
  const isAdmin = membership!.role === "owner" || membership!.role === "admin";

  return (
    <main style={{ maxWidth: 640 }}>
      <h1>Oportunidades</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Encontre empresas-alvo por segmento (CNAE) e região usando dados públicos.
        Elas entram como oportunidades no seu funil — você aborda no Responder.
      </p>

      {ok && <p className="badge badge-success mt-16">Perfil de cliente ideal salvo.</p>}
      {erro && <p className="badge badge-danger mt-16">{erro}</p>}

      {/* Passo 1: Perfil de Cliente Ideal (sem custo) */}
      <div className="card mt-16">
        <p className="eyebrow" style={{ marginBottom: 4 }}>Passo 1 · Perfil de cliente ideal</p>
        <p className="text-dim" style={{ marginTop: 0, fontSize: 14 }}>
          Defina os segmentos (código CNAE) e as cidades que você quer atender.
          É de graça e orienta toda a busca.
        </p>
        {isAdmin ? (
          <form action={saveIcp} className="stack mt-16" style={{ gap: 14 }}>
            <label className="text-dim" style={{ fontSize: 13 }}>
              <span style={{ display: "block", marginBottom: 5 }}>CNAEs-alvo (um por linha — ex.: 9313-1/00 academias)</span>
              <textarea name="cnaes" className="input" rows={4} defaultValue={(icp.cnaes ?? []).join("\n")} placeholder={"9313-1/00\n4644-3/01"} />
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

      {/* Passo 2: busca (em construção) */}
      <div className="card mt-16">
        <p className="eyebrow" style={{ marginBottom: 4 }}>Passo 2 · Buscar empresas</p>
        <p className="text-dim" style={{ marginTop: 0, marginBottom: 0, fontSize: 14 }}>
          Em construção. Vai listar as empresas do seu perfil a partir da base
          pública de CNPJ (grátis), com opção de enriquecer contatos sob demanda.
          {(icp.cnaes?.length || icp.municipios?.length) ? (
            <> Perfil atual: <strong>{(icp.cnaes ?? []).length}</strong> CNAE(s), <strong>{(icp.municipios ?? []).length}</strong> cidade(s).</>
          ) : null}
        </p>
      </div>

      <p className="text-faint mt-16" style={{ fontSize: 12 }}>
        <Link href="/painel">← Início</Link>
      </p>
    </main>
  );
}
