import Link from "next/link";
import { importContacts } from "./actions";

export const metadata = { title: "Importar contatos" };

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main style={{ maxWidth: 560 }}>
      <Link href="/painel/contatos" className="text-dim" style={{ fontSize: 13 }}>
        ← Contatos
      </Link>
      <h1 className="mt-8">Importar contatos</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Suba uma planilha em CSV com <strong>nome</strong> e <strong>telefone</strong>.
        Telefones repetidos (na planilha ou já no sistema) são ignorados.
      </p>

      {erro && <p className="badge badge-danger mt-16">{erro}</p>}

      <form action={importContacts} className="card mt-16">
        <label className="label" htmlFor="file">Arquivo CSV</label>
        <input id="file" name="file" type="file" accept=".csv,text/csv" required />

        <label className="label" htmlFor="origem" style={{ marginTop: 16 }}>
          Origem (marca de onde vieram)
        </label>
        <input id="origem" name="origem" type="text" placeholder="Ex.: Planilha Instagram" defaultValue="Importação" />

        <button type="submit" className="btn btn-primary mt-24">Importar</button>
      </form>

      <div className="card mt-16">
        <p className="eyebrow" style={{ marginBottom: 8 }}>Como preparar a planilha</p>
        <ul className="text-dim" style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7 }}>
          <li>No Excel ou Google Sheets, use as colunas <code>nome</code> e <code>telefone</code>.</li>
          <li>Salve/exporte como <strong>CSV</strong> (aceita separador vírgula ou ponto-e-vírgula).</li>
          <li>Cada contato entra como novo lead na primeira etapa da jornada.</li>
        </ul>
        <a href="/painel/contatos/export?template=1" className="btn btn-sm btn-ghost mt-16">
          Baixar modelo (CSV)
        </a>
      </div>
    </main>
  );
}
