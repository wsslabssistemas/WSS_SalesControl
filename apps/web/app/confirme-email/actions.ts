"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await supabase.auth.resend({
    type: "signup",
    email,
    options: site ? { emailRedirectTo: `${site}/auth/callback` } : undefined,
  });

  redirect("/confirme-email?reenviado=1");
}
