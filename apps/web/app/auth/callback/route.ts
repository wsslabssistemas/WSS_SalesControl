import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback do OAuth (Google). O Supabase redireciona para cá com um `code`;
 * trocamos por uma sessão (grava os cookies) e mandamos para o painel.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/painel`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=falha_no_login_google`);
}
