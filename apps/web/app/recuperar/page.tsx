import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, MAKER } from "@/lib/brand";
import { pedirRecuperacao } from "../definir-senha/actions";

export const metadata = { title: "Recuperar acesso" };

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "2rem 1.25rem" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <Link href="/" className="brand-lockup" style={{ justifyContent: "center", width: "100%", marginBottom: 22 }}>
          <Image src="/icons/icon-192.png" alt="" width={36} height={36} priority />
          <span style={{ fontSize: 17 }}>{BRAND_NAME}</span>
        </Link>

        <div className="card" style={{ padding: "26px 24px" }}>
          <h1 style={{ fontSize: 20 }}>Recuperar acesso</h1>
          <p className="text-dim" style={{ fontSize: 14, marginTop: 4, marginBottom: 22 }}>
            Diga o e-mail que você usa aqui e mandamos um link para criar uma
            senha nova. Serve também para quem recebeu convite e o link já venceu.
          </p>

          <form action={pedirRecuperacao}>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="voce@empresa.com" />
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
              Mandar o link
            </button>
          </form>

          <p style={{ marginTop: 14, textAlign: "center" }}>
            <Link href="/login" className="text-dim" style={{ fontSize: 12 }}>
              Voltar para a entrada
            </Link>
          </p>

          {erro && (
            <p className="badge badge-danger" style={{ marginTop: 16, width: "100%", justifyContent: "center" }}>
              {erro}
            </p>
          )}
        </div>

        <p className="text-faint" style={{ textAlign: "center", fontSize: 12, marginTop: 18 }}>{MAKER}</p>
      </div>
    </main>
  );
}
