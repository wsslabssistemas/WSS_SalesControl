import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import {
  carregarLicao,
  carregarGrade,
  carregarProgresso,
  exemploDoRamo,
  paraBlocos,
  pedacos,
} from "@/lib/curso";
import Quiz from "../Quiz";

export const metadata = { title: "Lição" };

/** Markdown mínimo → JSX. Sem dangerouslySetInnerHTML e sem dependência nova. */
function Corpo({ md }: { md: string }) {
  return (
    <>
      {paraBlocos(md).map((b, i) => {
        if (b.tipo === "titulo") {
          return (
            <h2 key={i} style={{ fontSize: 15, margin: "26px 0 8px", letterSpacing: ".01em" }}>
              {b.texto}
            </h2>
          );
        }
        if (b.tipo === "citacao") {
          return (
            <blockquote
              key={i}
              style={{
                margin: "14px 0",
                padding: "10px 16px",
                borderLeft: "3px solid var(--border-brand)",
                background: "var(--surface-2)",
                borderRadius: "0 8px 8px 0",
                fontStyle: "italic",
                lineHeight: 1.6,
              }}
            >
              {b.texto}
            </blockquote>
          );
        }
        if (b.tipo === "lista") {
          return (
            <ul key={i} style={{ margin: "10px 0", paddingLeft: 20, lineHeight: 1.65 }}>
              {b.itens.map((it, k) => (
                <li key={k} style={{ marginBottom: 6 }}>
                  {pedacos(it).map((p, j) => (p.forte ? <strong key={j}>{p.texto}</strong> : <span key={j}>{p.texto}</span>))}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} style={{ margin: "0 0 14px", lineHeight: 1.7, fontSize: 15 }}>
            {pedacos(b.texto).map((p, j) => (p.forte ? <strong key={j}>{p.texto}</strong> : <span key={j}>{p.texto}</span>))}
          </p>
        );
      })}
    </>
  );
}

export default async function LicaoPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Curso</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("curso")) {
    return (
      <main style={{ maxWidth: 560 }}>
        <h1>Curso</h1>
        <div className="card mt-16">
          <p style={{ margin: 0 }}>O curso não está liberado para a sua empresa.</p>
        </div>
      </main>
    );
  }

  const dados = await carregarLicao(lesson);
  if (!dados) notFound();
  const { licao, modulo, perguntas } = dados;

  const [grade, progresso, exemplo] = await Promise.all([
    carregarGrade(),
    carregarProgresso(tenant.id),
    exemploDoRamo(tenant.skill_key, licao.example_category),
  ]);

  const todas = grade.flatMap((g) => g.licoes);
  const idx = todas.findIndex((l) => l.key === licao.key);
  const proxima = idx >= 0 && idx < todas.length - 1 ? todas[idx + 1] : null;
  const jaFeita = !!progresso.get(licao.key)?.completed_at;

  return (
    <main style={{ maxWidth: 680 }}>
      <p className="text-faint" style={{ fontSize: 12, marginBottom: 6 }}>
        <Link href="/painel/curso">← Curso</Link>
        {" · "}Módulo {modulo?.ord}: {modulo?.title}
      </p>

      <div className="between" style={{ alignItems: "baseline", gap: 10 }}>
        <h1 style={{ marginBottom: 0 }}>{licao.title}</h1>
        <span className="text-faint" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
          {licao.minutes} min
        </span>
      </div>

      <article className="mt-16">
        <Corpo md={licao.body} />
      </article>

      {/* O EXEMPLO DO RAMO. A lição é a mesma para todo mundo; isto aqui vem da
          biblioteca curada do segmento da empresa. É o que nenhuma plataforma
          de curso consegue fazer — ela não tem a curadoria nem o DNA. */}
      {exemplo && (
        <div className="card mt-16" style={{ borderColor: "var(--border-brand)", background: "var(--brand-gradient-soft)" }}>
          <p className="eyebrow" style={{ marginTop: 0, marginBottom: 8 }}>No seu ramo</p>
          {exemplo.gatilhos.length > 0 && (
            <>
              <p className="text-dim" style={{ margin: "0 0 6px", fontSize: 13 }}>
                Quando o seu cliente diz:
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.6 }}>
                {exemplo.gatilhos.map((g) => `“${g}”`).join("  ·  ")}
              </p>
            </>
          )}
          {exemplo.tecnica && (
            <p style={{ margin: "0 0 10px", fontSize: 14 }}>
              <strong>O que o sistema faz:</strong> {exemplo.tecnica}
            </p>
          )}
          {exemplo.erros.length > 0 && (
            <p className="text-dim" style={{ margin: 0, fontSize: 13 }}>
              <strong style={{ color: "var(--text)" }}>E evita:</strong> {exemplo.erros.join(" · ")}
            </p>
          )}
        </div>
      )}

      {licao.practice && (
        <div className="card mt-16">
          <p className="eyebrow" style={{ marginTop: 0, marginBottom: 8 }}>Faça hoje</p>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{licao.practice}</p>
        </div>
      )}

      {perguntas.length > 0 ? (
        <Quiz
          lessonKey={licao.key}
          perguntas={perguntas.map((p) => ({ id: p.id, question: p.question, options: p.options }))}
          proxima={proxima ? { key: proxima.key, title: proxima.title } : null}
          jaFeita={jaFeita}
        />
      ) : (
        <div className="card mt-16">
          <p className="text-dim" style={{ margin: 0 }}>Esta lição ainda não tem prática.</p>
        </div>
      )}
    </main>
  );
}
