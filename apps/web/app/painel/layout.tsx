import Link from "next/link";
import { requireUser, getActiveTenant } from "@/lib/auth";
import { signOut } from "./actions";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const membership = await getActiveTenant();
  const tenantName = membership?.tenant?.name ?? "(sem empresa)";

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "1.5rem" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderBottom: "1px solid rgba(128,128,128,0.25)",
          paddingBottom: 12,
          marginBottom: 28,
        }}
      >
        <strong>COS</strong>
        <nav style={{ display: "flex", gap: 14, fontSize: 14 }}>
          <Link href="/painel">Início</Link>
          <Link href="/painel/dna">DNA</Link>
        </nav>
        <span style={{ marginLeft: "auto", fontSize: 13, opacity: 0.7 }}>
          {tenantName}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            style={{
              font: "inherit",
              background: "none",
              border: "none",
              cursor: "pointer",
              opacity: 0.7,
              textDecoration: "underline",
            }}
          >
            Sair
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
