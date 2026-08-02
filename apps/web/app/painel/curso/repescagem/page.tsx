import Link from "next/link";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { carregarRepescagem } from "@/lib/curso";
import Repescagem from "../Repescagem";

export const metadata = { title: "Repescagem" };

// Rota estática dentro de `curso/`, então ela vence o `[lesson]` — não existe
// e nem pode existir uma lição com a chave "repescagem".
export default async function RepescagemPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Repescagem</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("curso")) {
    return (
      <main style={{ maxWidth: 560 }}>
        <h1>Repescagem</h1>
        <p className="text-dim">O curso não está liberado para a sua empresa.</p>
      </main>
    );
  }

  const perguntas = await carregarRepescagem(tenant.id);

  return (
    <main style={{ maxWidth: 720 }}>
      <p className="text-faint" style={{ fontSize: 12, marginBottom: 6 }}>
        <Link href="/painel/curso">← Curso</Link>
      </p>
      <h1>Repescagem</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Perguntas de lições que você já fez, voltando espaçadas. Lembrar depois de alguns dias é o
        que fixa — reler no mesmo dia dá sensação de domínio e não fixa nada.
      </p>

      {perguntas.length === 0 ? (
        <div className="card mt-16">
          <p style={{ marginTop: 0 }}>Nada para revisar agora.</p>
          <p className="text-dim" style={{ marginBottom: 0, fontSize: 14 }}>
            A repescagem espera alguns dias depois da lição, de propósito. Volte aqui quando o
            curso avisar — ou siga para a próxima lição.
          </p>
          <div className="row mt-16">
            <Link href="/painel/curso" className="btn btn-sm btn-primary">Ver o curso</Link>
          </div>
        </div>
      ) : (
        <Repescagem perguntas={perguntas} />
      )}
    </main>
  );
}
