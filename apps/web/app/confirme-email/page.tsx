import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, MAKER } from "@/lib/brand";
import { reenviarConfirmacao } from "./actions";

export const metadata = { title: "Confirme seu e-mail" };

/**
 * A TELA QUE FALTAVA ENTRE CRIAR A CONTA E ENTRAR.
 *
 * Antes, quem se cadastrava com a confirmação de e-mail ligada era mandado
 * para o login com um aviso pequeno em cima do formulário. Duas coisas davam
 * errado: o aviso passava despercebido, e a pessoa ficava tentando entrar com
 * uma senha que "não funcionava" — quando na verdade faltava um clique no
 * e-mail dela. Parece sistema quebrado e é só um passo não contado.
 */
export default async function ConfirmeEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; reenviado?: string }>;
}) {
  const { erro, reenviado } = await searchParams;

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "2rem 1.25rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Link href="/" className="brand-lockup" style={{ justifyContent: "center", width: "100%", marginBottom: 22 }}>
          <Image src="/icons/icon-192.png" alt="" width={36} height={36} priority />
          <span style={{ fontSize: 17 }}>{BRAND_NAME}</span>
        </Link>

        <div className="card" style={{ padding: "26px 24px" }}>
          <h1 style={{ fontSize: 20, marginTop: 0 }}>Falta um passo: confirme seu e-mail</h1>

          <p className="text-dim" style={{ fontSize: 14, marginTop: 10 }}>
            Sua conta foi criada. Enviamos um link de confirmação para o e-mail que
            você cadastrou — <strong>clique nele e você entra direto</strong>, já na
            tela para cadastrar a sua empresa.
          </p>

          <div className="card" style={{ background: "var(--bg-elev)", marginTop: 16, padding: "12px 14px" }}>
            <p className="text-dim" style={{ margin: 0, fontSize: 13 }}>
              <strong>Não chegou?</strong> Olhe no <strong>spam</strong> ou na aba
              &ldquo;Promoções&rdquo; — é onde esse tipo de e-mail costuma cair.
              Pode levar um ou dois minutos.
            </p>
          </div>

          <form action={reenviarConfirmacao} style={{ marginTop: 18 }}>
            <label className="label" htmlFor="email">Reenviar para</label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="voce@empresa.com" />
            <button type="submit" className="btn btn-block" style={{ marginTop: 12 }}>
              Reenviar o link
            </button>
          </form>

          {reenviado && (
            <p className="badge badge-success" style={{ marginTop: 16, width: "100%", justifyContent: "center", whiteSpace: "normal", textAlign: "center", padding: "10px 12px" }}>
              Se existir uma conta com esse e-mail e ela ainda não estiver confirmada,
              o link novo já saiu.
            </p>
          )}
          {erro && (
            <p className="badge badge-danger" style={{ marginTop: 16, width: "100%", justifyContent: "center" }}>
              {erro}
            </p>
          )}

          <p style={{ marginTop: 18, textAlign: "center" }}>
            <Link href="/login" className="text-dim" style={{ fontSize: 12 }}>
              Já confirmei — quero entrar
            </Link>
          </p>
        </div>

        <p className="text-faint" style={{ textAlign: "center", fontSize: 12, marginTop: 18 }}>{MAKER}</p>
      </div>
    </main>
  );
}
