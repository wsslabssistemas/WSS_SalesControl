import Link from "next/link";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { getCompanyDetail } from "@/lib/prospect";
import { addOpportunity } from "../actions";
import { linkDeWhatsApp } from "@/lib/envio";

export const metadata = { title: "Empresa" };

// A versão anterior desta função decidia por `d.startsWith("55")` e
// CORROMPIA número de DDD 55 (Santa Maria/RS): o celular 55 98765-4321 era
// lido como "já tem código de país" e virava um número truncado. Agora usa a
// mesma regra de todo o resto — ver `lib/phone.ts`.
const waLink = (phone: string | null) => linkDeWhatsApp(phone);

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

      {/* Sem telefone na Receita: caça-contato em vários canais + campo rápido */}
      {!d.phone && (
        <div className="card mt-16" style={{ borderColor: "rgba(234,181,77,0.35)", background: "rgba(234,181,77,0.06)" }}>
          <p className="eyebrow" style={{ marginBottom: 4 }}>Sem telefone na base pública</p>
          <p className="text-dim" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>
            A Receita não publica o contato desta empresa. Procure nos canais abaixo
            (abrem já preenchidos) e cole o número no campo — ele vai junto para o funil.
          </p>
          <div className="row wrap" style={{ gap: 8 }}>
            {[
              { label: "Google", url: `https://www.google.com/search?q=${encodeURIComponent(`"${nome}" ${d.municipio ?? ""} telefone`)}` },
              { label: "Google Maps", url: `https://www.google.com/maps/search/${encodeURIComponent(`${nome} ${d.municipio ?? ""} ${d.uf ?? ""}`)}` },
              { label: "Site oficial", url: `https://www.google.com/search?q=${encodeURIComponent(`"${nome}" site oficial`)}` },
              { label: "Instagram", url: `https://www.google.com/search?q=${encodeURIComponent(`"${nome}" ${d.municipio ?? ""} instagram`)}` },
              { label: "LinkedIn", url: `https://www.google.com/search?q=${encodeURIComponent(`"${nome}" linkedin`)}` },
              { label: "CNPJ na web", url: `https://www.google.com/search?q=${encodeURIComponent(d.cnpj)}` },
            ].map((l) => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      <form action={addOpportunity} className="card mt-16">
        <input type="hidden" name="cnpj" value={d.cnpj} />
        <input type="hidden" name="name" value={nome} />
        {!d.phone && (
          <>
            <label className="label" htmlFor="phone">Telefone encontrado (opcional)</label>
            <input id="phone" name="phone" type="tel" placeholder="(51) 99999-9999" style={{ marginBottom: 14 }} />
          </>
        )}
        <button type="submit" className="btn btn-primary">Adicionar ao funil</button>
        <span className="text-faint" style={{ fontSize: 13, marginLeft: 10 }}>
          {d.phone ? "cria o contato com o telefone acima" : "você pode completar depois"}
        </span>
      </form>

      <p className="text-faint mt-16" style={{ fontSize: 12 }}>
        Dados públicos da Receita Federal. Site e avaliações dependem de enriquecimento pago (futuro).
      </p>
    </main>
  );
}
