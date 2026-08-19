import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Roda em tudo menos assets estáticos E as rotas de API.
  //
  // ⚠ POR QUE `api` SAIU DAQUI (19/ago/2026).
  //
  // O middleware chama o Auth do Supabase em toda requisição que ele cobre — e
  // cobria `/api/*`, incluindo **o webhook do WhatsApp**. Isso é errado por
  // dois motivos, e o segundo é grave:
  //
  //   1. É trabalho jogado fora. O webhook não tem sessão de usuário para
  //      renovar: ele se autentica pela ASSINATURA da Meta (HMAC do corpo
  //      cru), que é mais forte que sessão e não depende do Auth.
  //
  //   2. **Auth lento virava risco de perder o canal.** No incidente deste dia
  //      o Auth demorou e o middleware segurou requisições por 25 segundos. Se
  //      isso pega um pacote da Meta, ela não recebe 200 no prazo, REENVIA — e
  //      depois de falhas repetidas **desativa a assinatura do webhook**. Ou
  //      seja: uma lentidão de login podia derrubar o recebimento de mensagens
  //      de um cliente pagante, por um caminho que ninguém ligaria com login.
  //
  // Tirar `api` daqui não afrouxa nada: cada rota de API já decide a própria
  // autenticação, e a defesa dos dados continua sendo a RLS (Lei 3).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
