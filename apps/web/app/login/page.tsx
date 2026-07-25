import { login, signInWithGoogle } from "./actions";

const field: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  marginTop: 6,
  border: "1px solid rgba(128,128,128,0.4)",
  borderRadius: 8,
  background: "transparent",
  color: "inherit",
  font: "inherit",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main style={{ maxWidth: 360, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <p
        style={{
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
          opacity: 0.55,
        }}
      >
        COS · WSS Labs
      </p>
      <h1 style={{ fontSize: 24, margin: "4px 0 24px" }}>Entrar</h1>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(128,128,128,0.4)",
            background: "transparent",
            color: "inherit",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Entrar com Google
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "20px 0",
          opacity: 0.5,
          fontSize: 12,
        }}
      >
        <span style={{ flex: 1, height: 1, background: "currentColor" }} />
        ou
        <span style={{ flex: 1, height: 1, background: "currentColor" }} />
      </div>

      <form action={login}>
        <label style={{ fontSize: 13, opacity: 0.8 }}>
          E-mail
          <input name="email" type="email" required autoComplete="email" style={field} />
        </label>
        <label style={{ fontSize: 13, opacity: 0.8, display: "block", marginTop: 16 }}>
          Senha
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            style={field}
          />
        </label>
        <button
          type="submit"
          style={{
            marginTop: 24,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: "#111",
            color: "#fff",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </form>

      {erro && (
        <p style={{ marginTop: 16, color: "#c0392b", fontSize: 13 }}>{erro}</p>
      )}
    </main>
  );
}
