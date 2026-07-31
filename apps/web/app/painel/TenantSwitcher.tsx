"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { trocarEmpresa } from "./actions";

export default function TenantSwitcher({
  empresas,
  atual,
}: {
  empresas: { id: string; name: string }[];
  atual: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (empresas.length <= 1) {
    return (
      <span className="badge" title="Empresa ativa">
        {empresas[0]?.name ?? "(sem empresa)"}
      </span>
    );
  }

  return (
    <select
      value={atual}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          await trocarEmpresa(e.target.value);
          router.refresh();
        })
      }
      title="Trocar de empresa"
      style={{ width: "auto", padding: "5px 9px", fontSize: 13 }}
    >
      {empresas.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
        </option>
      ))}
    </select>
  );
}
