import Link from "next/link";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { getCompanyDetail } from "@/lib/prospect";
import { addOpportunity } from "../actions";

export const metadata = { title: "Empresa" };

function waLink(phone: string | null): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  if (!d) return null;
  return `https://wa.me/${d.startsWith("55") ? d : "55" + d}`;
}

function fmtPhone(phone: string | null): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "");
  if (d.length >= 10) {
    const ddd = d.slice(0, 2);
    const rest = d.slice(2);
    return `(${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
  }
  return phone;
}

export default async function EmpresaPage({ params }: { params: Promise<{ cnpj: string }> }) {
  const { cnpj } = await params;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return (<main><h1>Empresa</h1><p className="text-dim">Sem empresa vinculada.</p></main>);

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("prospeccao")) {
    return (<main><h1>Empresa</h1><p className="text-dim">Módulo de prospecção não disponível.</p></main>);
  }

  const d = await getCompanyDetail(cnpj);
  if (!d) {
    return (
      <main style={{ maxWidth: 560 }}>
        <Link href="/painel/oportunidades?buscar=1" className="text-dim" style={{ fontSize: 13 }}>← Oportunidades</Link>
        <h1 className="mt-8">Empresa</h1>
        <p className="badge badge-danger mt-16">Não consegui carregar os dados públicos desta empresa agora.</p>
      </main>
    );
  }

  const wa = waLink(d.phone);
  const nome = d.fantasia || d.razao;
  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="row" style={{ gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}>
      <span className="text-faint" style={{ width: 120, flexShrink: 0 }}>{label}</span>
      <span className="grow">{children}</span>
    </div>
  );

  return (
    <main style={{ maxWidth: 620 }}>
      <Link href="/painel/oportunidades?buscar=1" className="text-dim" style={{ fontSize: 13 }}>← Oportunidades</Link>
      <div className="between mt-8">
        <h1 style={{ margin: 0 }}>{nome}</h1>
        {d.situacao && <span className="badge">{d.situacao}</span>}
      </div>

      <div className="card mt-16">
        {d.fantasia && <Row label="Razão social">{d.razao}</Row>}
        <Row label="CNPJ">{d.cnpj}</Row>
        <Row label="Telefone">
          {fmtPhone(d.phone)}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ marginLeft: 10, background: "#25D366", color: "#0b2e13", border: "none", padding: "2px 10px" }}>
              WhatsApp
            </a>
          )}
        </Row>
        {d.phone2 && <Row label="Telefone 2">{fmtPhone(d.phone2)}</Row>}
        <Row label="E-mail">{d.email ?? "—"}</Row>
        <Row label="Endereço">{[d.endereco, d.municipio && `${d.municipio}/${d.uf}`].filter(Boolean).join(" · ") || "—"}</Row>
        <Row label="Atividade">{d.cnae ?? "—"}</Row>
        <Row label="Porte">{d.porte ?? "—"}</Row>
        <Row label="Aberta em">{d.abertura ? new Date(d.abertura).toLocaleDateString("pt-BR") : "—"}</Row>
      </div>

      <form action={addOpportunity} className="mt-16">
        <input type="hidden" name="cnpj" value={d.cnpj} />
        <input type="hidden" name="name" value={nome} />
        <button type="submit" className="btn btn-primary">Adicionar ao funil</button>
        <span className="text-faint" style={{ fontSize: 13, marginLeft: 10 }}>
          cria um contato em Contatos com o telefone acima
        </span>
      </form>

      <p className="text-faint mt-16" style={{ fontSize: 12 }}>
        Dados públicos da Receita Federal. Site e avaliações exigem enriquecimento pago (futuro).
      </p>
    </main>
  );
}
