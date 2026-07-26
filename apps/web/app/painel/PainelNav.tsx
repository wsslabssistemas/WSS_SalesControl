"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export default function PainelNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/painel" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="nav">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={isActive(it.href) ? "active" : ""}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
