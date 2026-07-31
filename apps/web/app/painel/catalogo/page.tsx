import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { brl } from "@/lib/money";
import { importarCatalogo, limparCatalogo } from "./actions";

export const metadata = { title: "Catálogo" };

const PAGE_SIZE = 25;

type Item = {
  id: string;
  sku: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  unit: string | null;
  price_cents: number | null;
  stock_qty: number | null;
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; importados?: string; sem?: string; erros?: string; erro?: string; limpo?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Catálogo</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }
  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const supabase = await createClient();
  const from = (pageNum - 1) * PAGE_SIZE;

  let query = supabase
    .from("catalog_items")
    .select("id, sku, name, brand, category, unit, price_cents, stock_qty", { count: "exact" })
    .eq("tenant_id", tenant.id)
    .eq("active", true);

  const termo = q.replace(/[,()%*]/g, "").trim();
  if (termo) {
    query = query.or(
      `name.ilike.%${termo}%,description.ilike.%${termo}%,sku.ilike.%${termo}%,brand.ilike.%${termo}%`,
    );
  }

  const { data, count } = await query.order("name").range(from, from + PAGE_SIZE - 1);
  const itens = (data as Item[] | null) ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (n > 1) p.set("page", String(n));
    const s = p.toString();
    return s ? `?${s}` : "?";
  };

  return (
    <main>
      <div className="between">
        <h1>
          Catálogo <span className="text-faint" style={{ fontSize: 15, fontWeight: 400 }}>({total.toLocaleString("pt-BR")})</span>
        </h1>
        <a href="/painel/catalogo/modelo" className="btn btn-sm btn-ghost">Baixar modelo</a>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Seus produtos com preço e estoque. O sistema só afirma ao cliente o que
        estiver aqui — nada é inventado.
      </p>

      {sp.importados && (
        <p className="badge badge-success mt-16">
          {sp.importados} item(ns) importado(s)
          {sp.sem && Number(sp.sem) > 0 ? ` · ${sp.sem} sem nome ignorado(s)` : ""}
          {sp.erros && Number(sp.erros) > 0 ? ` · ${sp.erros} com erro` : ""}
        </p>
      )}
      {sp.limpo && <p className="badge badge-warn mt-16">Catálogo limpo.</p>}
      {sp.erro && <p className="badge badge-danger mt-16">{sp.erro}</p>}

      {isAdmin && (
        <div className="card mt-16">
          <p className="eyebrow" style={{ marginBottom: 4 }}>Importar planilha</p>
          <p className="text-dim" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>
            Arquivo CSV. O sistema reconhece sozinho colunas como <strong>código,
            nome, descrição, marca, categoria, unidade, preço e estoque</strong> —
            em qualquer ordem. Colunas que ele não conhece são guardadas do mesmo
            jeito. Reimportar com o mesmo código atualiza preço e estoque.
          </p>
          <form action={importarCatalogo} className="row wrap" style={{ gap: 10, alignItems: "center" }}>
            <input type="file" name="file" accept=".csv,text/csv" required className="grow" style={{ minWidth: 200 }} />
            <label className="row text-dim" style={{ gap: 6, fontSize: 13, width: "auto" }}>
              <input type="checkbox" name="substituir" style={{ width: "auto" }} />
              substituir tudo
            </label>
            <button type="submit" className="btn btn-primary">Importar</button>
          </form>
          {total > 0 && (
            <form action={limparCatalogo} className="mt-16">
              <button type="submit" className="linklike" style={{ fontSize: 12, color: "var(--danger)" }}>
                limpar catálogo
              </button>
            </form>
          )}
        </div>
      )}

      <form method="get" className="row wrap mt-16" style={{ gap: 8 }}>
        <input name="q" defaultValue={q} placeholder="Buscar por nome, código, marca…" className="grow" style={{ minWidth: 200 }} />
        <button type="submit" className="btn">Buscar</button>
      </form>

      {itens.length === 0 ? (
        <div className="card mt-16">
          <p className="text-dim" style={{ margin: 0 }}>
            {termo ? "Nenhum item para essa busca." : "Nenhum produto ainda. Importe sua planilha acima."}
          </p>
        </div>
      ) : (
        <div className="card mt-16" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Código</th><th>Produto</th><th>Marca</th>
                <th style={{ textAlign: "right" }}>Preço</th>
                <th style={{ textAlign: "right" }}>Estoque</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((i) => (
                <tr key={i.id}>
                  <td className="text-faint" style={{ fontSize: 12 }}>{i.sku ?? "—"}</td>
                  <td>
                    {i.name}
                    {i.category && <span className="text-faint" style={{ fontSize: 12 }}> · {i.category}</span>}
                  </td>
                  <td className="text-dim">{i.brand ?? "—"}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {i.price_cents != null ? brl(i.price_cents) : "—"}
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {i.stock_qty != null ? `${i.stock_qty}${i.unit ? " " + i.unit : ""}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="row mt-24" style={{ gap: 14, fontSize: 14 }}>
          {pageNum > 1 ? <Link href={pageHref(pageNum - 1)}>← Anterior</Link> : <span className="text-faint">← Anterior</span>}
          <span className="text-dim">Página {pageNum} de {totalPages}</span>
          {pageNum < totalPages ? <Link href={pageHref(pageNum + 1)}>Próxima →</Link> : <span className="text-faint">Próxima →</span>}
        </div>
      )}
    </main>
  );
}
