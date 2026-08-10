"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SENHA_MINIMA } from "@/lib/senha";
import { origemDoSite } from "@/lib/site";

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
  // `emailRedirectTo` É OBRIGATÓRIO AQUI, e faltava.
  //
  // Sem ele, o link do e-mail de confirmação volta para a "Site URL" padrão do
  // Supabase — a raiz do site — em vez de passar pelo nosso `/auth/callback`.
  // A pessoa clica em confirmar, cai na página inicial e continua deslogada,
  // sem entender o que aconteceu. O reenvio (`/confirme-email`) já mandava
  // certo; o cadastro original, não. Duas portas para o mesmo e-mail e só uma
  // apontando para o lugar certo.
  const site = await origemDoSite();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { full_name: nome },
      ...(site ? { emailRedirectTo: `${site}/auth/callback?type=signup` } : {}),
    },
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

  // ⚠ CONTA QUE JÁ EXISTE NÃO VEM COMO ERRO — e foi assim que a primeira
  // vendedora da Be Fitness ficou travada.
  //
  // Com a confirmação de e-mail LIGADA, o Supabase não avisa que o e-mail já
  // tem cadastro: ele devolve sucesso, sem sessão e sem erro, de propósito —
  // senão esta tela viraria um verificador de quem tem conta no sistema.
  //
  // O sinal documentado é outro: `identities` volta VAZIO. Sem checar isso, o
  // código caía no `!data.session` abaixo e mandava a pessoa para a tela de
  // "confirme seu e-mail" — esperando uma mensagem que NUNCA vai chegar,
  // porque não há nada para confirmar. Ela descreveu exatamente assim:
  // "criei a conta e a senha, mas diz que preciso confirmar no e-mail, e esse
  // e-mail não chegou".
  //
  // Pior: a senha que ela digitou aqui NÃO substituiu a antiga. Ela ficou
  // esperando um e-mail com uma senha na cabeça que não é a da conta.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    erro(
      "Já existe uma conta com esse e-mail. Entre em 'Já tenho conta' — " +
      "e se não lembrar a senha, use 'Esqueci minha senha' na tela de entrada.",
    );
  }

  // CONFIRMAÇÃO DE E-MAIL LIGADA no Supabase devolve usuário SEM sessão. Sem
  // tratar isso, a pessoa cadastraria e cairia numa tela pedindo login, com a
  // senha que ela acabou de criar não funcionando ainda — parece sistema
  // quebrado e é só um e-mail não confirmado.
  if (!data.session) {
    // TELA PRÓPRIA, não um aviso na tela de login. Mandada para o login com um
    // badge em cima do formulário, a pessoa não via — e ficava tentando entrar
    // com uma senha que "não funcionava", quando faltava um clique no e-mail
    // dela. Parece sistema quebrado e é só um passo não contado.
    redirect("/confirme-email");
  }

  redirect("/painel/nova-empresa");
}
