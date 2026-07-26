import Image from "next/image";
import Link from "next/link";
import { requireUser, getActiveTenant } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform";
import { BRAND_NAME } from "@/lib/brand";
import PainelNav from "./PainelNav";
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

  const nav = [
    { href: "/painel", label: "Início" },
    { href: "/painel/responder", label: "Responder" },
    { href: "/painel/contatos", label: "Contatos" },
    { href: "/painel/funil", label: "Funil" },
    { href: "/painel/agenda", label: "Agenda" },
    { href: "/painel/equipe", label: "Equipe" },
    { href: "/painel/dna", label: "DNA" },
    { href: "/painel/automacao", label: "Automação" },
    { href: "/painel/tutorial", label: "Tutorial" },
    ...(showAdmin ? [{ href: "/painel/admin", label: "Fabricante" }] : []),
  ];

  return (
    <>
      <header className="appbar">
        <Link href="/painel" className="brand-lockup">
          <Image src="/icons/icon-192.png" alt="" width={30} height={30} priority />
          <span>{BRAND_NAME}</span>
        </Link>
        <PainelNav items={nav} />
        <div className="row" style={{ marginLeft: "auto", gap: 14 }}>
          <span className="badge" title="Empresa ativa">
            {tenantName}
          </span>
          <form action={signOut}>
            <button type="submit" className="linklike" style={{ fontSize: 13 }}>
              Sair
            </button>
          </form>
        </div>
      </header>
      <div className="container" style={{ padding: "28px 1.25rem 64px" }}>
        {children}
      </div>
    </>
  );
}
