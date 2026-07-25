import type { Metadata } from "next";
import { BRAND_NAME, MAKER } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND_NAME} — inteligência comercial`,
  description: `Inteligência comercial multi-tenant. ${MAKER}.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
