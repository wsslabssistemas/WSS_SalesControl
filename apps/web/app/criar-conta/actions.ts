"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SENHA_MINIMA } from "@/lib/senha";

const erro: (m: string) => never = (m) =>
  redirect(`/criar-conta?erro=${encodeURIComponent(m)}`);

/**
 * CRIAR CONTA — a porta que não existia.
 *
 * Até aqui a única entrada era alguém de dentro convidar. Isso obrigava o
 * fabricante a criar a empresa do cliente na mão antes de ele chegar, e o
 * fundador nomeou o problema certo: **é um ritmo anormal**. Produto que
 * precisa de um ritual de bastidor para receber alguém não é produto, é
 * serviço com fachada de produto.
 *
 * O convite continua existindo, e para outra coisa: chamar COLEGA para uma
 * empresa que já existe. São dois caminhos diferentes — quem cria a empresa e
 * quem entra numa que já tem dono.
 */
export async function criarConta(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!nome) erro("Diga como podemos te chamar.");
  if (!email) erro("Informe o e-mail.");
  if (senha.length < SENHA_MINIMA) erro(`A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { full_name: nome } },
  });

  if (error) {
    // A mensagem do Supabase vem em inglês. As duas que acontecem de verdade
    // ganham tradução; o resto passa como veio, porque inventar tradução para
    // erro desconhecido esconde a causa de quem vai investigar.
    const m = error.message.toLowerCase();
    if (m.includes("already registered") || m.includes("already been registered")) {
      erro("Já existe uma conta com esse e-mail. Entre por ali, ou use 'Esqueci minha senha'.");
    }
    if (m.includes("password")) erro(`A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`);
    erro(error.message);
  }

  // CONFIRMAÇÃO DE E-MAIL LIGADA no Supabase devolve usuário SEM sessão. Sem
  // tratar isso, a pessoa cadastraria e cairia numa tela pedindo login, com a
  // senha que ela acabou de criar não funcionando ainda — parece sistema
  // quebrado e é só um e-mail não confirmado.
  if (!data.session) {
    redirect(
      "/login?aviso=" +
        encodeURIComponent("Conta criada. Confirme o e-mail que enviamos e depois entre por aqui."),
    );
  }

  redirect("/painel/nova-empresa");
}
