import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { carregarGrade, carregarExercicio, carregarExercicioFeito } from "@/lib/curso";
import Exercicio from "../../Exercicio";

export const metadata = { title: "Exercício" };

export default async function ExercicioPage({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  const { modulo } = await params;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Exercício</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("curso")) {
    return (<main><h1>Exercício</h1><p className="text-dim">O curso não está liberado para a sua empresa.</p></main>);
  }

  const grade = await carregarGrade();
  const bloco = grade.find((g) => g.modulo.key === modulo);
  if (!bloco) notFound();

  const [exercicio, feito] = await Promise.all([
    carregarExercicio(tenant.id, tenant.skill_key, modulo),
    carregarExercicioFeito(tenant.id, modulo),
  ]);

  return (
    <main style={{ maxWidth: 720 }}>
      <p className="text-faint" style={{ fontSize: 12, marginBottom: 6 }}>
        <Link href="/painel/curso">← Curso</Link>
      </p>
      <p className="eyebrow" style={{ margin: 0 }}>Módulo {bloco.modulo.ord} · exercício</p>
      <h1 style={{ marginTop: 4 }}>{bloco.modulo.title}</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Uma mensagem real do seu ramo, respondida com os fatos da sua empresa. Não tem nota:
        resposta aberta não tem gabarito, e nota chutada ensinaria o contrário do que este curso
        defende. O que tem é comparação — a sua resposta contra o que a biblioteca recomenda.
      </p>

      {!exercicio ? (
        <div className="card mt-16">
          <p style={{ marginTop: 0 }}>Ainda não dá para montar o exercício deste módulo.</p>
          <p className="text-dim" style={{ marginBottom: 0, fontSize: 14 }}>
            Ele é montado a partir da biblioteca curada do seu segmento
            (<code>{tenant.skill_key}</code>), e nenhuma entrada dela tem situação escrita para este
            módulo ainda. Isso é falta de curadoria, não erro seu — a WSS Labs resolve.
          </p>
        </div>
      ) : (
        <Exercicio
          moduleKey={modulo}
          situacao={exercicio.situacao}
          escola={exercicio.escola}
          recomendacao={exercicio.recomendacao}
          fatos={exercicio.fatos}
          autoavaliacao={exercicio.autoavaliacao}
          jaFeito={feito ? { resposta: feito.resposta, updated_at: feito.updated_at } : null}
        />
      )}
    </main>
  );
}
