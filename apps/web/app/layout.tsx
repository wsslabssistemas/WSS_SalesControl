import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COS — Commercial Operating System",
  description: "Inteligência comercial multi-tenant. WSS Labs.",
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
