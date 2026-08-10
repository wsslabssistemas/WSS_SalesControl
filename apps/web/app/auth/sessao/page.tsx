import SessaoDoFragmento from "./SessaoDoFragmento";

export const metadata = { title: "Entrando" };

/**
 * Página que resgata a sessão vinda no fragmento da URL.
 *
 * O `/auth/callback` manda para cá quando não encontra `?code=`. O fragmento
 * SOBREVIVE ao redirecionamento: quando o destino não traz fragmento próprio,
 * o navegador reaplica o da origem. É comportamento padrão de HTTP, e é o que
 * permite o servidor passar a bola para o browser sem perder o token.
 */
export default function SessaoPage() {
  return <main><SessaoDoFragmento /></main>;
}
