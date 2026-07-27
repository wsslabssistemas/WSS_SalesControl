import Link from "next/link";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";

export const metadata = { title: "Licitações" };

export default async function LicitacoesPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Licitações</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }

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

  return (
    <main style={{ maxWidth: 620 }}>
      <h1>Licitações</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Monitor de editais públicos do seu segmento e região, via PNCP (Portal
        Nacional de Contratações Públicas).
      </p>
      <div className="card mt-16">
        <p className="eyebrow" style={{ marginBottom: 4 }}>Em construção</p>
        <p className="text-dim" style={{ marginTop: 0, marginBottom: 0, fontSize: 14 }}>
          Este módulo entra depois da Prospecção. Vai listar editais abertos por
          segmento/UF e alertar sobre novos. Fonte pública e gratuita (PNCP).
        </p>
      </div>
      <p className="text-faint mt-16" style={{ fontSize: 12 }}>
        <Link href="/painel">← Início</Link>
      </p>
    </main>
  );
}
