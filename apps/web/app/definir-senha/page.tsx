import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BRAND_NAME, MAKER } from "@/lib/brand";
import { definirSenha } from "./actions";
import { SENHA_MINIMA } from "@/lib/senha";

export const metadata = { title: "Criar senha" };

export default async function DefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; primeiro?: string }>;
}) {
  const { erro, primeiro } = await searchParams;

  // Sem sessão não há o que definir. Mostrar o formulário assim mesmo faria a
  // pessoa digitar a senha duas vezes para só então descobrir que o link
  // venceu — e o conserto (pedir outro convite) não está nas mãos dela.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "2rem 1.25rem" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <Link href="/" className="brand-lockup" style={{ justifyContent: "center", width: "100%", marginBottom: 22 }}>
          <Image src="/icons/icon-192.png" alt="" width={36} height={36} priority />
          <span style={{ fontSize: 17 }}>{BRAND_NAME}</span>
        </Link>

        <div className="card" style={{ padding: "26px 24px" }}>
          {!user ? (
            <>
              <h1 style={{ fontSize: 20 }}>Link expirado</h1>
              <p className="text-dim" style={{ fontSize: 14, marginTop: 8 }}>
                Convites valem por tempo limitado e só podem ser usados uma vez.
                Peça um novo para quem te adicionou — leva um minuto.
              </p>
              <Link href="/login" className="btn btn-block" style={{ marginTop: 18 }}>
                Voltar para a entrada
              </Link>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 20 }}>{primeiro ? "Bem-vindo" : "Criar senha nova"}</h1>
              <p className="text-dim" style={{ fontSize: 14, marginTop: 4, marginBottom: 22 }}>
                {primeiro
                  ? `Crie uma senha para entrar no ${BRAND_NAME} daqui em diante.`
                  : "Escolha a senha que você vai usar para entrar."}
              </p>
              <p className="text-faint" style={{ fontSize: 12, marginTop: -14, marginBottom: 18 }}>
                {user.email}
              </p>

              <form action={definirSenha}>
                <label className="label" htmlFor="senha">Senha</label>
                <input
                  id="senha" name="senha" type="password" required
                  minLength={SENHA_MINIMA} autoComplete="new-password" placeholder="••••••••"
                />
                <label className="label" htmlFor="repetida" style={{ marginTop: 16 }}>Repita a senha</label>
                <input
                  id="repetida" name="repetida" type="password" required
                  minLength={SENHA_MINIMA} autoComplete="new-password" placeholder="••••••••"
                />
                <p className="text-faint" style={{ fontSize: 12, marginTop: 8 }}>
                  Pelo menos {SENHA_MINIMA} caracteres.
                </p>
                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
                  Salvar e entrar
                </button>
              </form>
            </>
          )}

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
