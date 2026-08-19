import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Renova a sessão do Supabase a cada request e protege as rotas do painel.
 * Padrão oficial do @supabase/ssr para o App Router.
 *
 * ⚠ POR QUE EXISTE UM RELÓGIO AQUI — o incidente de 19/ago/2026.
 *
 * O fundador reportou "o sistema parou de funcionar", com 504
 * `FUNCTION_INVOCATION_TIMEOUT`. Os logs mostraram 15 timeouts contra 33
 * respostas boas em 20 minutos, TODOS em `error/edge-middleware`, com a
 * mensagem *"did not return an initial response within 25s"* — e o mais
 * revelador: **`/login` estava entre eles**, uma tela que não toca em nada do
 * produto.
 *
 * A causa não era o build (o deploy estava `READY`), não era o Postgres
 * (respondia em 0,1s) e não era o Auth (0,3s, medido de fora). Era latência
 * intermitente entre a borda da Vercel e o Supabase.
 *
 * **O defeito de desenho é este arquivo, não o Supabase.** `getUser()` roda em
 * TODA requisição e não tinha limite de tempo. Qualquer lentidão do Auth virava
 * uma tela branca de 25 segundos em cima do usuário — e não só no painel:
 * como o middleware cobre tudo, até a tela de entrar parava. Um serviço lento
 * derrubava o produto inteiro.
 *
 * ⚠ E NO ESTOURO, ELE DEIXA PASSAR — de propósito.
 *
 * Redirecionar para `/login` quando o relógio estoura seria pior que o
 * problema: derrubaria a sessão de quem ESTÁ logado por causa de um segundo
 * ruim da rede, e quem já está em `/login` entraria em laço.
 *
 * Deixar passar não abre buraco de segurança porque **a defesa real é a RLS no
 * Postgres**, não este arquivo (Lei 3). O redirecionamento daqui é conforto de
 * navegação: ele evita que alguém deslogado veja uma tela de painel vazia. A
 * página adiante faz a própria verificação com o próprio cliente, e o banco
 * recusa qualquer leitura sem sessão válida.
 *
 * Ou seja: com o Supabase lento, o pior caso passa a ser uma tela que carrega
 * sem dado — em vez de uma que não carrega nunca.
 */

/**
 * Quanto esperamos pelo Auth antes de seguir sem ele.
 *
 * 3 segundos porque a medição real é de 0,1 a 0,7s: o limite precisa ser
 * folgado o bastante para nunca cortar uma chamada saudável, e curto o
 * bastante para a pessoa não achar que travou. A plataforma mata em 25s, então
 * qualquer coisa perto disso não é proteção — é o mesmo defeito com outro
 * número.
 */
const LIMITE_AUTH_MS = 3_000;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: getUser() valida o token no servidor a cada request.
  //
  // O `Promise.race` é o relógio. `demorou` é um marcador próprio (e não
  // `null`) para que "o Auth respondeu que não há usuário" e "o Auth não
  // respondeu" NÃO se confundam — os dois pedem comportamento oposto, e
  // confundi-los é como uma lentidão vira logout em massa.
  const demorou = Symbol("auth-demorou");
  let resultado: Awaited<ReturnType<typeof supabase.auth.getUser>> | typeof demorou;

  try {
    resultado = await Promise.race([
      supabase.auth.getUser(),
      new Promise<typeof demorou>((r) => setTimeout(() => r(demorou), LIMITE_AUTH_MS)),
    ]);
  } catch {
    // Erro de rede também deixa passar, pelo mesmo motivo do estouro: a defesa
    // é a RLS, e uma falha de infraestrutura não pode virar tela morta.
    resultado = demorou;
  }

  if (resultado === demorou) {
    console.warn(
      `[middleware] Auth do Supabase nao respondeu em ${LIMITE_AUTH_MS}ms — seguindo sem sessao em ${request.nextUrl.pathname}`,
    );
    return response;
  }

  const user = resultado.data.user;

  // Rotas do painel exigem sessão.
  if (request.nextUrl.pathname.startsWith("/painel") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
