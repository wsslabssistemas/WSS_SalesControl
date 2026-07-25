import Link from "next/link";
import { requireUser, getActiveTenant } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform";
import { BRAND_NAME } from "@/lib/brand";
import { signOut } from "./actions";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const membership = await getActiveTenant();
  const tenantName = membership?.tenant?.name ?? "(sem empresa)";
  const showAdmin = isPlatformAdmin(user.email);

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
        <strong>{BRAND_NAME}</strong>
        <nav style={{ display: "flex", gap: 14, fontSize: 14 }}>
          <Link href="/painel">Início</Link>
          <Link href="/painel/contatos">Contatos</Link>
          <Link href="/painel/funil">Funil</Link>
          <Link href="/painel/agenda">Agenda</Link>
          <Link href="/painel/equipe">Equipe</Link>
          <Link href="/painel/dna">DNA</Link>
          {showAdmin && <Link href="/painel/admin">Fabricante</Link>}
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
