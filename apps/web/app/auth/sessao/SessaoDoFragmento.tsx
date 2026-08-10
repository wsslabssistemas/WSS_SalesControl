"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * RESGATE DA SESSÃO QUE VEIO NO FRAGMENTO DA URL.
 *
 * O `/auth/v1/verify` do Supabase devolve a sessão em `#access_token=…`, e
 * fragmento não chega ao servidor. Os links NOVOS não passam mais por lá (ver
 * `/auth/confirmar`), mas dois casos continuam caindo aqui:
 *
 *  1. Links já enviados antes desta correção, que ainda estão no WhatsApp de
 *     alguém.
 *  2. E-mails que o PRÓPRIO Supabase manda a partir dos modelos dele
 *     (confirmação de cadastro, recuperação pedida na tela de login). Aqueles
 *     endereços são montados por ele, não por nós.
 *
 * Só o browser enxerga o fragmento — por isso este pedaço é client-side, e por
 * isso ele existe apesar de o caminho preferido ser todo no servidor.
 */
export default function SessaoDoFragmento() {
  const [estado, setEstado] = useState<"lendo" | "falhou">("lendo");

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const p = new URLSearchParams(hash);
    const access_token = p.get("access_token");
    const refresh_token = p.get("refresh_token");
    const tipo = p.get("type") ?? new URLSearchParams(window.location.search).get("type");

    if (!access_token || !refresh_token) {
      setEstado("falhou");
      return;
    }

    (async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        setEstado("falhou");
        return;
      }
      // `replace` e não `push`: a URL com o token não pode ficar no histórico
      // do navegador, onde qualquer um que pegue o aparelho volta nela.
      const destino =
        tipo === "signup" ? "/painel/nova-empresa" : "/definir-senha?primeiro=1";
      window.location.replace(destino);
    })();
  }, []);

  if (estado === "falhou") {
    return (
      <div className="card" style={{ maxWidth: 420, margin: "80px auto", padding: "26px 24px" }}>
        <h1 style={{ fontSize: 20, marginTop: 0 }}>Não consegui completar o acesso</h1>
        <p className="text-dim" style={{ fontSize: 14 }}>
          Este link já foi usado ou expirou — eles valem uma vez só. Peça um link
          novo para quem te adicionou.
        </p>
        <a href="/login" className="btn btn-block" style={{ marginTop: 14 }}>
          Ir para a entrada
        </a>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "80px auto", padding: "26px 24px", textAlign: "center" }}>
      <p className="text-dim" style={{ margin: 0 }}>Entrando…</p>
    </div>
  );
}
