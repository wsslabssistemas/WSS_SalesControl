import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, MAKER } from "@/lib/brand";
import { SENHA_MINIMA } from "@/lib/senha";
import { criarConta } from "./actions";

export const metadata = { title: "Criar conta" };

export default async function CriarContaPage({
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
          <h1 style={{ fontSize: 20 }}>Criar conta</h1>
          <p className="text-dim" style={{ fontSize: 14, marginTop: 4, marginBottom: 22 }}>
            30 dias para usar tudo, sem cartão. No próximo passo você diz qual é
            a sua empresa e o ramo dela.
          </p>

          <form action={criarConta}>
            <label className="label" htmlFor="nome">Seu nome</label>
            <input id="nome" name="nome" type="text" required autoComplete="name" placeholder="Como podemos te chamar" />

            <label className="label" htmlFor="email" style={{ marginTop: 16 }}>E-mail</label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="voce@empresa.com" />

            <label className="label" htmlFor="senha" style={{ marginTop: 16 }}>Senha</label>
            <input
              id="senha" name="senha" type="password" required
              minLength={SENHA_MINIMA} autoComplete="new-password" placeholder="••••••••"
            />
            <span className="text-faint" style={{ display: "block", fontSize: 12, marginTop: 6 }}>
              Pelo menos {SENHA_MINIMA} caracteres.
            </span>

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
              Criar conta e começar
            </button>
          </form>

          {erro && (
            <p className="badge badge-danger" style={{ marginTop: 16, width: "100%", justifyContent: "center" }}>
              {erro}
            </p>
          )}

          <p style={{ marginTop: 16, textAlign: "center" }}>
            <Link href="/login" className="text-dim" style={{ fontSize: 12 }}>
              Já tenho conta
            </Link>
          </p>
        </div>

        <p className="text-faint" style={{ textAlign: "center", fontSize: 12, marginTop: 18 }}>{MAKER}</p>
      </div>
    </main>
  );
}
