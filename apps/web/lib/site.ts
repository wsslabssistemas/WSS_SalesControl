import { headers } from "next/headers";

/**
 * A origem ABSOLUTA do site — `https://kairos.wsslabs.com.br`.
 *
 * ⚠ POR QUE ISTO É UMA FUNÇÃO COMPARTILHADA E NÃO UM `process.env` SOLTO.
 *
 * Todo `redirectTo` e `emailRedirectTo` do Supabase precisa ser absoluto.
 * Vazio, ele é recusado — e o modo como cada chamada falha é diferente e
 * silencioso:
 *
 *   - `resetPasswordForEmail` com destino relativo cai na "Site URL" padrão do
 *     Supabase. A pessoa clica no link do e-mail, chega na raiz do site ainda
 *     deslogada, e não há erro em lugar nenhum.
 *   - `resend({type:"signup"})` sem `emailRedirectTo` faz a mesma coisa.
 *   - `generateLink` do convite falha inteiro.
 *
 * O convite já tinha essa cascata escrita dentro dele, e `criar-conta` tinha
 * uma cópia. As outras duas portas ficaram com `process.env.X ?? ""` — e
 * `NEXT_PUBLIC_SITE_URL` não está no `.env.local`. Ou seja: a variável era uma
 * dependência invisível de três telas de acesso, e a falha dela é da classe que
 * mais custou neste projeto — **não aparece como erro**, aparece como e-mail
 * que leva ao lugar errado.
 *
 * Com a cascata, a variável vira opcional em vez de obrigatória: em produção o
 * `VERCEL_URL` responde, e o `host` da requisição é o último recurso.
 *
 * A ordem importa. `NEXT_PUBLIC_SITE_URL` vem primeiro porque é o domínio
 * próprio; `VERCEL_URL` é o domínio do deploy (muda a cada build de preview) e
 * o `host` é o que o cliente mandou — bom o bastante para não quebrar, ruim
 * demais para ser a primeira escolha.
 */
export async function origemDoSite(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const h = await headers();
  const host = h.get("host");
  return host ? `https://${host}` : "";
}
