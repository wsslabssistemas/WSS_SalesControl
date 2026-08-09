"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SENHA_MINIMA } from "@/lib/senha";

export async function definirSenha(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const repetida = String(formData.get("repetida") ?? "");

  const erro: (m: string) => never = (m) =>
    redirect(`/definir-senha?erro=${encodeURIComponent(m)}`);

  if (senha.length < SENHA_MINIMA) erro(`A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`);
  if (senha !== repetida) erro("As duas senhas não são iguais.");

  const supabase = await createClient();

  // A SESSÃO TEM QUE EXISTIR. Esta tela só é alcançável depois do link do
  // convite ter sido trocado por sessão no callback. Sem sessão, `updateUser`
  // falharia com uma mensagem de biblioteca que não ajuda ninguém — e o caso
  // real que leva aqui é link expirado ou já usado, que tem conserto simples
  // (pedir outro) e precisa ser dito assim.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    erro("Seu link de acesso expirou ou já foi usado. Peça um convite novo para quem te adicionou.");
  }

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) erro(error.message);

  redirect("/painel");
}

/**
 * Pedido de recuperação, disparado da tela de login.
 *
 * RESPONDE A MESMA COISA EXISTINDO OU NÃO A CONTA. Dizer "e-mail não
 * cadastrado" transforma a tela num verificador de quem usa o sistema: dá para
 * testar uma lista inteira e descobrir quais endereços têm conta. Não é dado
 * catastrófico, mas é dado do cliente vazando de graça, e a mensagem neutra
 * custa nada.
 */
export async function pedirRecuperacao(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/login?erro=" + encodeURIComponent("Informe o e-mail."));

  const supabase = await createClient();
  const origem = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/callback?type=recovery`,
  });

  redirect(
    "/login?aviso=" +
      encodeURIComponent("Se existir uma conta com esse e-mail, o link para criar uma senha nova chegou lá."),
  );
}
