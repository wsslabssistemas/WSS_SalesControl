import Link from "next/link";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { carregarGrade, carregarProgresso } from "@/lib/curso";

export const metadata = { title: "Curso" };

export default async function CursoPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1>Curso</h1>
        <p className="text-dim">Sem empresa vinculada.</p>
      </main>
    );
  }

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("curso")) {
    return (
      <main style={{ maxWidth: 560 }}>
        <h1>Curso</h1>
        <div className="card mt-16">
          <p style={{ marginTop: 0 }}>O curso de técnicas de venda não está liberado para a sua empresa.</p>
          <p className="text-dim" style={{ marginBottom: 0, fontSize: 14 }}>
            São 9 módulos com as técnicas que o sistema usa nas respostas — com os exemplos do seu
            próprio ramo. Fale com a WSS Labs para habilitar.
          </p>
        </div>
      </main>
    );
  }

  const [grade, progresso] = await Promise.all([carregarGrade(), carregarProgresso(tenant.id)]);

  const todas = grade.flatMap((g) => g.licoes);
  const feitas = todas.filter((l) => progresso.get(l.key)?.completed_at).length;
  const pct = todas.length ? Math.round((feitas / todas.length) * 100) : 0;

  // A próxima lição é a primeira não concluída — o botão que tira a pessoa da
  // paralisia de "por onde começo".
  const proxima = todas.find((l) => !progresso.get(l.key)?.completed_at) ?? null;
  const minutosRestantes = todas
    .filter((l) => !progresso.get(l.key)?.completed_at)
    .reduce((s, l) => s + l.minutes, 0);

  return (
    <main style={{ maxWidth: 720 }}>
      <h1>Técnicas de venda</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        As técnicas que o sistema aplica nas respostas — com os exemplos do seu ramo. Lições de 6 a 7
        minutos, cada uma terminando em prática.
      </p>

      <div className="card mt-16">
        <div className="between" style={{ marginBottom: 10, alignItems: "baseline" }}>
          <strong>
            {feitas} de {todas.length} {todas.length === 1 ? "lição concluída" : "lições concluídas"}
          </strong>
          <span className="brand-text" style={{ fontWeight: 700 }}>{pct}%</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${pct}%`, transition: "width .4s ease" }} />
        </div>
        {proxima && (
          <div className="between mt-16" style={{ alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="text-faint" style={{ fontSize: 13 }}>
              {feitas === 0
                ? `Comece pela primeira — ${proxima.minutes} minutos.`
                : `Faltam ${minutosRestantes} minutos para terminar o que já está no ar.`}
            </span>
            <Link href={`/painel/curso/${proxima.key}`} className="btn btn-sm btn-primary">
              {feitas === 0 ? "Começar" : "Continuar"} →
            </Link>
          </div>
        )}
      </div>

      <div className="stack mt-16" style={{ gap: 12 }}>
        {grade.map(({ modulo, licoes }) => {
          const concluidas = licoes.filter((l) => progresso.get(l.key)?.completed_at).length;
          const completo = licoes.length > 0 && concluidas === licoes.length;
          return (
            <div key={modulo.key} className="card">
              <div className="between" style={{ alignItems: "flex-start", gap: 10 }}>
                <div className="grow">
                  <p className="eyebrow" style={{ margin: 0 }}>Módulo {modulo.ord}</p>
                  <p style={{ margin: "2px 0 4px", fontSize: 16, fontWeight: 600 }}>{modulo.title}</p>
                  <p className="text-dim" style={{ margin: 0, fontSize: 14 }}>{modulo.subtitle}</p>
                </div>
                {licoes.length === 0 ? (
                  <span className="badge" style={{ whiteSpace: "nowrap" }}>em breve</span>
                ) : completo ? (
                  <span className="badge badge-success" style={{ whiteSpace: "nowrap" }}>concluído</span>
                ) : (
                  <span className="text-faint" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {concluidas}/{licoes.length}
                  </span>
                )}
              </div>

              {licoes.length > 0 && (
                <div className="mt-16 stack" style={{ gap: 0 }}>
                  {licoes.map((l, i) => {
                    const feita = !!progresso.get(l.key)?.completed_at;
                    const nota = progresso.get(l.key)?.score;
                    return (
                      <Link
                        key={l.key}
                        href={`/painel/curso/${l.key}`}
                        className="row"
                        style={{
                          gap: 10,
                          padding: "10px 0",
                          alignItems: "center",
                          textDecoration: "none",
                          borderBottom: i < licoes.length - 1 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                            display: "grid", placeItems: "center", fontSize: 12,
                            border: feita ? "none" : "1px solid var(--border-strong)",
                            background: feita ? "var(--success)" : "transparent",
                            color: feita ? "#08210b" : "var(--text-faint)",
                          }}
                        >
                          {feita ? "✓" : l.ord}
                        </span>
                        <span className="grow" style={{ fontSize: 14 }}>{l.title}</span>
                        {feita && nota != null && (
                          <span className="text-faint" style={{ fontSize: 11 }}>{nota}%</span>
                        )}
                        <span className="text-faint" style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                          {l.minutes} min
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-faint mt-16" style={{ fontSize: 12 }}>
        <Link href="/painel">← Início</Link>
      </p>
    </main>
  );
}
