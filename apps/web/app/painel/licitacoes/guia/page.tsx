import Link from "next/link";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { hasAIKey } from "@/lib/ai";
import { GOV_GUIDE as QA } from "@/lib/govGuide";
import Assistente from "./Assistente";

export const metadata = { title: "Guia de vendas ao governo" };

// Assistente de IA nesta tela. Ver a nota em `fila/page.tsx`.
export const maxDuration = 60;

export default async function GuiaPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return (<main><h1>Guia</h1><p className="text-dim">Sem empresa vinculada.</p></main>);

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("licitacoes")) {
    return (<main><h1>Guia de vendas ao governo</h1><p className="text-dim">Disponível com o módulo de Licitações.</p></main>);
  }

  return (
    <main style={{ maxWidth: 680 }}>
      <Link href="/painel/licitacoes" className="text-dim" style={{ fontSize: 13 }}>← Licitações</Link>
      <h1 className="mt-8">Guia de vendas ao governo</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        O essencial para participar de licitações e fechar com o setor público.
        Pergunte ao assistente ou consulte as respostas abaixo.
      </p>

      {hasAIKey() && (
        <div className="mt-24">
          <Assistente />
        </div>
      )}

      <div className="stack mt-24" style={{ gap: 10 }}>
        {QA.map((qa, i) => (
          <details key={i} className="card" style={{ padding: "14px 16px" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, listStyle: "none" }}>
              {qa.p}
            </summary>
            <p className="text-dim" style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.6 }}>{qa.r}</p>
          </details>
        ))}
      </div>

      <p className="text-faint mt-24" style={{ fontSize: 12 }}>
        Orientação geral com base na Lei 14.133/2021 e na LC 123/2006. Não
        substitui a leitura do edital nem assessoria jurídica.
      </p>
    </main>
  );
}
