"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { parseCsv, detectDelimiter } from "@/lib/csv";
import { parseMoneyToCents } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const strip = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

// Sinônimos aceitos no cabeçalho da planilha do cliente. Cada empresa nomeia
// as colunas do seu jeito — o sistema se adapta, não o contrário.
const COLUNAS: Record<string, string[]> = {
  sku: ["sku", "codigo", "cod", "referencia", "ref", "codigo do produto", "id"],
  name: ["nome", "produto", "descricao do produto", "item", "titulo", "mercadoria"],
  description: ["descricao", "detalhe", "detalhes", "especificacao", "observacao"],
  brand: ["marca", "fabricante", "fornecedor"],
  category: ["categoria", "grupo", "linha", "familia", "secao", "departamento"],
  unit: ["unidade", "un", "und", "medida", "embalagem"],
  price_cents: ["preco", "valor", "preco de venda", "preco unitario", "valor unitario", "vlr", "preco venda"],
  stock_qty: ["estoque", "quantidade", "qtd", "qtde", "saldo", "disponivel"],
};

function mapearColunas(header: string[]): Record<string, number> {
  const h = header.map(strip);
  const mapa: Record<string, number> = {};
  for (const [campo, sinonimos] of Object.entries(COLUNAS)) {
    const i = h.findIndex((c) => sinonimos.includes(c));
    if (i >= 0) mapa[campo] = i;
  }
  // Sem coluna de nome reconhecida, assume a primeira — sem nome não há item.
  if (mapa.name === undefined) mapa.name = 0;
  return mapa;
}

function parseQtd(v: string): number | null {
  const s = String(v ?? "").replace(/[^\d,.-]/g, "").trim();
  if (!s) return null;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) ? n : null;
}

export async function importarCatalogo(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  if (membership!.role !== "owner" && membership!.role !== "admin") {
    redirect("/painel/catalogo?erro=Sem+permissao");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/painel/catalogo?erro=Escolha+um+arquivo+CSV");
  }
  const substituir = formData.get("substituir") === "on";

  const texto = await (file as File).text();
  const linhas = parseCsv(texto, detectDelimiter(texto));
  if (linhas.length < 2) redirect("/painel/catalogo?erro=Planilha+vazia+ou+sem+cabecalho");

  const mapa = mapearColunas(linhas[0]);
  const supabase = await createClient();

  if (substituir) {
    await supabase.from("catalog_items").delete().eq("tenant_id", tenant.id);
  }

  const itens: Record<string, unknown>[] = [];
  let semNome = 0;
  const colunasConhecidas = new Set(Object.values(mapa));

  for (const linha of linhas.slice(1)) {
    const nome = (linha[mapa.name] ?? "").trim();
    if (!nome) { semNome++; continue; }

    // Colunas que a planilha tem e o sistema não conhece viram `extra`,
    // para nada da informação do cliente se perder.
    const extra: Record<string, string> = {};
    linhas[0].forEach((cab, i) => {
      if (colunasConhecidas.has(i)) return;
      const v = (linha[i] ?? "").trim();
      if (v) extra[cab.trim()] = v;
    });

    itens.push({
      tenant_id: tenant.id,
      sku: mapa.sku !== undefined ? (linha[mapa.sku] ?? "").trim() || null : null,
      name: nome,
      description: mapa.description !== undefined ? (linha[mapa.description] ?? "").trim() || null : null,
      brand: mapa.brand !== undefined ? (linha[mapa.brand] ?? "").trim() || null : null,
      category: mapa.category !== undefined ? (linha[mapa.category] ?? "").trim() || null : null,
      unit: mapa.unit !== undefined ? (linha[mapa.unit] ?? "").trim() || null : null,
      price_cents: mapa.price_cents !== undefined ? parseMoneyToCents(linha[mapa.price_cents] ?? "") : null,
      stock_qty: mapa.stock_qty !== undefined ? parseQtd(linha[mapa.stock_qty] ?? "") : null,
      extra,
      updated_at: new Date().toISOString(),
    });
  }

  let importados = 0;
  let erros = 0;
  for (let i = 0; i < itens.length; i += 200) {
    const lote = itens.slice(i, i + 200);
    // Reimportar a mesma planilha atualiza preço/estoque em vez de duplicar.
    const comSku = lote.filter((x) => x.sku);
    const semSku = lote.filter((x) => !x.sku);
    if (comSku.length) {
      const { error } = await supabase.from("catalog_items").upsert(comSku, { onConflict: "tenant_id,sku" });
      error ? (erros += comSku.length) : (importados += comSku.length);
    }
    if (semSku.length) {
      const { error } = await supabase.from("catalog_items").insert(semSku);
      error ? (erros += semSku.length) : (importados += semSku.length);
    }
  }

  revalidatePath("/painel/catalogo");
  redirect(`/painel/catalogo?importados=${importados}&sem=${semNome}&erros=${erros}`);
}

export async function limparCatalogo() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  if (membership!.role !== "owner" && membership!.role !== "admin") {
    redirect("/painel/catalogo?erro=Sem+permissao");
  }
  const supabase = await createClient();
  await supabase.from("catalog_items").delete().eq("tenant_id", tenant.id);
  revalidatePath("/painel/catalogo");
  redirect("/painel/catalogo?limpo=1");
}
