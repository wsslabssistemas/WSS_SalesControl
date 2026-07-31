import { buildCsv } from "@/lib/csv";

/** Modelo de planilha do catálogo, com as colunas que o sistema reconhece. */
export async function GET() {
  const csv = buildCsv([
    ["codigo", "nome", "descricao", "marca", "categoria", "unidade", "preco", "estoque"],
    ["ABC-123", "Filtro de ar", "Filtro de ar motor 1.0", "Fram", "Filtros", "un", "45,90", "120"],
    ["", "Instalação de filtro", "Serviço de instalação", "", "Serviços", "un", "30,00", ""],
  ]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modelo-catalogo.csv"',
    },
  });
}
