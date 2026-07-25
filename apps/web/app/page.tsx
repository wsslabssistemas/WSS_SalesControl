import { BRAND_NAME, MAKER } from "@/lib/brand";

const label: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  opacity: 0.55,
};

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <p style={{ ...label, letterSpacing: 2 }}>{MAKER}</p>
      <h1 style={{ fontSize: 32, margin: "4px 0 0" }}>{BRAND_NAME}</h1>
      <p style={{ opacity: 0.75, marginTop: 8 }}>
        Inteligência comercial · modelo manual. Em construção.
      </p>

      <section style={{ marginTop: 40 }}>
        <h2 style={label}>Fundação pronta</h2>
        <ul>
          <li>
            App Next.js 15 + API (Hono) na rota <code>/api</code>
          </li>
          <li>Supabase conectado (URL + chave pública)</li>
          <li>Banco: RLS, hardening P0/P1, validador de Skill</li>
        </ul>

        <h2 style={{ ...label, marginTop: 28 }}>Próximo</h2>
        <ul>
          <li>Login e contexto de empresa</li>
          <li>Tela de DNA — os fatos da empresa</li>
          <li>Console reativo: colar mensagem → resposta de vendas</li>
        </ul>
      </section>

      <p style={{ marginTop: 40, fontSize: 13, opacity: 0.6 }}>
        Verificação da API: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
