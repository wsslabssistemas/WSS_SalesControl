import Image from "next/image";
import Link from "next/link";
import { requireUser, getActiveTenant, listMemberships } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform";
import { loadEntitlements, MODULES } from "@/lib/entitlements";
import { BRAND_NAME } from "@/lib/brand";
import PainelNav from "./PainelNav";
import TenantSwitcher from "./TenantSwitcher";
import { signOut } from "./actions";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [membership, empresas] = await Promise.all([getActiveTenant(), listMemberships()]);
  const showAdmin = isPlatformAdmin(user.email);
  const showManager = ["owner", "admin", "manager"].includes(membership?.role ?? "");

  // Módulos liberados por empresa/segmento (add-ons). Só aparecem se aplicáveis
  // ao segmento e (em teste OU comprados) — evita painel poluído.
  const ent = membership?.tenant
    ? await loadEntitlements(membership.tenant.id, membership.tenant.skill_key)
    : null;
  const moduleNav = (ent?.unlocked ?? []).map((m) => ({ href: MODULES[m].href, label: MODULES[m].label }));

  const nav = [
    { href: "/painel", label: "Início" },
    { href: "/painel/responder", label: "Responder" },
    { href: "/painel/contatos", label: "Contatos" },
    { href: "/painel/followup", label: "Follow-up" },
    { href: "/painel/funil", label: "Funil" },
    { href: "/painel/agenda", label: "Agenda" },
    ...moduleNav,
    ...(showManager ? [{ href: "/painel/gestao", label: "Gestão" }] : []),
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
          <TenantSwitcher
            empresas={empresas.map((m) => ({ id: m.tenant!.id, name: m.tenant!.name }))}
            atual={membership?.tenant?.id ?? ""}
          />
          <form action={signOut}>
            <button type="submit" className="linklike" style={{ fontSize: 13 }}>
              Sair
            </button>
          </form>
        </div>
      </header>
      {ent?.trialActive && (
        <div style={{ background: "var(--brand-gradient-soft)", borderBottom: "1px solid var(--border-brand)", textAlign: "center", fontSize: 13, padding: "7px 12px" }}>
          Teste grátis · <strong>{ent.trialDaysLeft} dia{ent.trialDaysLeft === 1 ? "" : "s"}</strong> restante{ent.trialDaysLeft === 1 ? "" : "s"} — todos os recursos liberados.
        </div>
      )}
      <div className="container" style={{ padding: "28px 1.25rem 64px" }}>
        {children}
      </div>
    </>
  );
}
