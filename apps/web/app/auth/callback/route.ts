import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de autenticação. O Supabase manda para cá com um `code`, que
 * trocamos por sessão (grava os cookies).
 *
 * TRÊS CAMINHOS CHEGAM AQUI, e mandar os três para o painel era um defeito
 * silencioso:
 *
 *   - **Google** → painel. Quem entra por OAuth não tem senha nossa e nem
 *     precisa: o Google é a credencial.
 *   - **Convite** (`type=invite`) → **definir senha**. Aqui estava a
 *     armadilha: a pessoa convidada entrava, era mandada ao painel, usava o
 *     sistema — e no dia seguinte não conseguia entrar, porque nunca definiu
 *     senha e o link do convite é de uso único. Do lado dela, o sistema
 *     simplesmente parou de funcionar sem explicação.
 *   - **Recuperação** (`type=recovery`) → definir senha, pelo mesmo motivo.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tipo = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Quem acabou de CONFIRMAR o cadastro já tem senha (definiu no
      // formulário) e ainda não tem empresa: o destino útil é criar a empresa,
      // não o painel vazio.
      if (tipo === "signup") return NextResponse.redirect(`${origin}/painel/nova-empresa`);
      const precisaDeSenha = tipo === "invite" || tipo === "recovery";
      return NextResponse.redirect(
        `${origin}${precisaDeSenha ? "/definir-senha?primeiro=1" : "/painel"}`,
      );
    }
    return NextResponse.redirect(
      `${origin}/login?erro=${encodeURIComponent(error.message)}`,
    );
  }

  // O Supabase manda o erro na query quando o link expirou ou já foi usado —
  // e "link expirado" é a causa mais comum de alguém não conseguir entrar.
  // Repassar o texto dele é melhor que um "falha no login" genérico, que não
  // diz a quem recebeu o convite que basta pedir outro.
  const erro = searchParams.get("error_description") ?? searchParams.get("error");
  return NextResponse.redirect(
    `${origin}/login?erro=${encodeURIComponent(erro ?? "Não consegui completar o acesso. Peça um convite novo.")}`,
  );
}
