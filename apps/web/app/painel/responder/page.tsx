import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { matchEntries } from "@/lib/match";
import { CopyButton } from "./CopyButton";

type Row = {
  id: string;
  category: string;
  trigger_questions: string[] | null;
  answer: string | null;
  technique: string | null;
  next_objective: string | null;
};

export default async function ResponderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Responder</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("knowledge_entries")
    .select("id, category, trigger_questions, answer, technique, next_objective")
    .eq("tenant_id", tenant.id)
    .eq("source", "tenant")
    .eq("status", "active")
    .not("answer", "is", null);

  const entries = ((data as Row[] | null) ?? []).map((e) => ({
    ...e,
    pergunta: e.trigger_questions?.[0] ?? "",
  }));

  const matches = q ? matchEntries(q, entries) : [];

  return (
    <main style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Responder</h1>
      <p style={{ opacity: 0.7 }}>
        Cole a mensagem do cliente. O sistema encontra a melhor resposta da sua
        biblioteca — você revisa e manda pelo WhatsApp.
      </p>

      <form method="get">
        <textarea
          name="q"
          defaultValue={q}
          rows={3}
          placeholder="Cole aqui a mensagem do cliente… (ex.: achei caro, tem aula experimental?)"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(128,128,128,0.4)",
            background: "transparent",
            color: "inherit",
            font: "inherit",
            resize: "vertical",
          }}
        />
        <button
          type="submit"
          style={{
            marginTop: 8,
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "var(--brand-blue)",
            color: "#fff",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Buscar resposta
        </button>
      </form>

      {q && matches.length === 0 && (
        <p style={{ opacity: 0.6, marginTop: 20 }}>
          Não encontrei uma resposta pronta pra isso. Tente outras palavras, ou
          adicione essa situação à biblioteca.
        </p>
      )}

      {matches.map((m, i) => (
        <div
          key={m.id}
          style={{
            border: "1px solid rgba(128,128,128,0.2)",
            borderRadius: 12,
            padding: "16px 18px",
            marginTop: 16,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.55, textTransform: "uppercase", letterSpacing: 1 }}>
            {i === 0 ? "Melhor resposta" : "Alternativa"} · {m.category}
            {m.technique ? ` · ${m.technique}` : ""}
          </div>
          <p style={{ whiteSpace: "pre-line", marginTop: 12, lineHeight: 1.55 }}>
            {m.answer}
          </p>
          <CopyButton text={m.answer ?? ""} />
          {m.next_objective && (
            <p style={{ marginTop: 12, fontSize: 13, opacity: 0.7 }}>
              Objetivo: {m.next_objective}
            </p>
          )}
        </div>
      ))}
    </main>
  );
}
