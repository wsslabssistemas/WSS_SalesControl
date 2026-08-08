import Image from "next/image";
import Link from "next/link";
import { login, signInWithGoogle } from "./actions";
import { BRAND_NAME, MAKER } from "@/lib/brand";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; aviso?: string }>;
}) {
  const { erro, aviso } = await searchParams;

  // O BOTAO DO GOOGLE SO APARECE SE O PROVEDOR ESTIVER LIGADO.
  //
  // Ele ficou visivel com o provedor desligado no Supabase, e o vendedor da Be
  // Fitness clicou nele: recebeu `Unsupported provider: provider is not
  // enabled` — texto de biblioteca, em ingles, numa tela de entrada. Do lado
  // dele o sistema estava quebrado.
  //
  // Botao que sempre falha e pior que botao ausente: ele promete um caminho
  // que nao existe e esconde o caminho que existe. Enquanto ninguem ligar o
  // Google (que exige projeto no Google Cloud), a entrada e por e-mail e senha.
  const googleLigado = process.env.GOOGLE_OAUTH_ATIVO === "1";

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem 1.25rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <Link href="/" className="brand-lockup" style={{ justifyContent: "center", width: "100%", marginBottom: 22 }}>
          <Image src="/icons/icon-192.png" alt="" width={36} height={36} priority />
          <span style={{ fontSize: 17 }}>{BRAND_NAME}</span>
        </Link>

        <div className="card" style={{ padding: "26px 24px" }}>
          <h1 style={{ fontSize: 20 }}>Entrar</h1>
          <p className="text-dim" style={{ fontSize: 14, marginTop: 4, marginBottom: 22 }}>
            Acesse o painel da sua empresa.
          </p>

          {googleLigado && (
            <>
              <form action={signInWithGoogle}>
                <button type="submit" className="btn btn-block">
                  <GoogleGlyph /> Entrar com Google
                </button>
              </form>

              <div className="row" style={{ gap: 12, margin: "18px 0", color: "var(--text-faint)", fontSize: 12 }}>
                <span className="grow" style={{ height: 1, background: "var(--border)" }} />
                ou
                <span className="grow" style={{ height: 1, background: "var(--border)" }} />
              </div>
            </>
          )}

          <form action={login}>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="voce@empresa.com" />
            <label className="label" htmlFor="password" style={{ marginTop: 16 }}>Senha</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 22 }}>
              Entrar
            </button>
          </form>

          {/* ESQUECI MINHA SENHA — nao existia, e sem ela um convite usado uma
              vez deixava a pessoa para sempre do lado de fora, dependendo do
              dono da conta para reconvidar.
              Pagina propria em vez de botao aqui: o e-mail digitado no form de
              cima nao chega a outro form sem JavaScript, e a primeira versao
              disto mandava um campo VAZIO — falharia sempre, com cara de
              "pedi e nao chegou". */}
          <p style={{ marginTop: 14, textAlign: "center" }}>
            <Link href="/recuperar" className="text-dim" style={{ fontSize: 12 }}>
              Esqueci minha senha
            </Link>
          </p>

          {erro && (
            <p className="badge badge-danger" style={{ marginTop: 16, width: "100%", justifyContent: "center" }}>
              {erro}
            </p>
          )}
          {aviso && (
            <p className="badge badge-success" style={{ marginTop: 16, width: "100%", justifyContent: "center" }}>
              {aviso}
            </p>
          )}
        </div>

        <p className="text-faint" style={{ textAlign: "center", fontSize: 12, marginTop: 18 }}>
          {MAKER}
        </p>
      </div>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
