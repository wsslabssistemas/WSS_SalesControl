"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { origemDoSite } from "@/lib/site";

/**
 * Reenvia o e-mail de confirmação.
 *
 * O e-mail é DIGITADO AQUI, não carregado na URL. Poderia vir do cadastro por
 * query string e pouparia a digitação — mas endereço de pessoa em URL fica no
 * histórico do navegador e em todo log de servidor pelo caminho. É dado de
 * cliente, e a economia de um campo não paga isso.
 *
 * RESPONDE A MESMA COISA EXISTINDO OU NÃO A CONTA, pelo mesmo motivo da tela
 * de recuperação: senão esta página vira um verificador de quem tem cadastro.
 */
export async function reenviarConfirmacao(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/confirme-email?erro=" + encodeURIComponent("Informe o e-mail."));

  const supabase = await createClient();
  const site = await origemDoSite();
  await supabase.auth.resend({
    type: "signup",
    email,
    // `type=signup` no destino: quem acabou de confirmar o cadastro ainda não
    // tem empresa, e o callback usa isso para mandar criar uma em vez de abrir
    // um painel vazio. O reenvio mandava sem o tipo — mesmo e-mail, destino
    // diferente do cadastro original.
    options: site ? { emailRedirectTo: `${site}/auth/callback?type=signup` } : undefined,
  });

  redirect("/confirme-email?reenviado=1");
}
