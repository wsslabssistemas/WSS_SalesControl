import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * TROCA O TOKEN DO LINK POR SESSÃO, no nosso servidor.
 *
 * ⚠ ESTA ROTA CONSERTA UM DEFEITO QUE QUEBRAVA TODO CONVITE E TODA
 * RECUPERAÇÃO DE SENHA.
 *
 * O `action_link` que o Supabase gera aponta para o `/auth/v1/verify` dele.
 * Esse endpoint valida o token e redireciona para o nosso callback com a
 * sessão no **FRAGMENTO** da URL:
 *
 *   https://kairos.wsslabs.com.br/auth/callback?type=recovery#access_token=…
 *
 * Fragmento NUNCA é enviado ao servidor — é um detalhe do HTTP, não uma
 * configuração. Nosso `/auth/callback` é uma rota de servidor: ela procurava
 * `?code=`, não achava nada, e mandava a pessoa para o login com erro.
 *
 * Medido, não deduzido: seguindo o redirecionamento com `curl`, o cabeçalho
 * `Location` vem com `#access_token=…`. Nenhum `code`.
 *
 * A SAÍDA é não passar por aquele endpoint. O `generateLink` devolve também um
 * `hashed_token`, e `verifyOtp` troca esse token por sessão AQUI, gravando os
 * cookies pelo caminho normal do servidor. Sem fragmento, sem JavaScript no
 * meio, e igual em qualquer navegador.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") ?? "recovery";

  const erro = (m: string) =>
    NextResponse.redirect(`${origin}/login?erro=${encodeURIComponent(m)}`);

  if (!tokenHash) return erro("Link incompleto. Peça um link novo.");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: tipo as "invite" | "recovery" | "signup" | "email",
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("expired") || m.includes("invalid")) {
      return erro("Este link já foi usado ou expirou. Peça um link novo para quem te adicionou.");
    }
    return erro(error.message);
  }

  // Convite e recuperação levam ao mesmo lugar: criar a senha. Quem chega por
  // convite ainda não tem senha; quem chega por recuperação está trocando a
  // que esqueceu.
  const destino = tipo === "signup" ? "/painel/nova-empresa" : "/definir-senha?primeiro=1";
  return NextResponse.redirect(`${origin}${destino}`);
}
