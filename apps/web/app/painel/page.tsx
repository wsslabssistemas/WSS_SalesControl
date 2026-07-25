import Link from "next/link";
import { getActiveTenant } from "@/lib/auth";

export default async function PainelHome() {
  const membership = await getActiveTenant();

  return (
    <main>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Início</h1>

      {membership?.tenant ? (
        <p style={{ opacity: 0.85 }}>
          Empresa: <strong>{membership.tenant.name}</strong> · Skill:{" "}
          <code>{membership.tenant.skill_key}</code> · seu papel: {membership.role}
        </p>
      ) : (
        <p style={{ opacity: 0.85 }}>
          Seu usuário ainda não está vinculado a uma empresa.
        </p>
      )}

      <ul style={{ marginTop: 24 }}>
        <li>
          <Link href="/painel/dna">DNA — os fatos da empresa</Link>
        </li>
        <li style={{ opacity: 0.5, marginTop: 6 }}>
          Console reativo — colar mensagem → resposta (em breve)
        </li>
      </ul>
    </main>
  );
}
