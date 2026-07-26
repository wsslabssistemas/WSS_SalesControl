import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { matchEntries, distinctCategories } from "@/lib/match";
import { displayPhone, whatsappNumber } from "@/lib/phone";
import JourneyBar from "@/components/JourneyBar";
import { hasAIKey } from "@/lib/ai";
import { CopyButton } from "./CopyButton";
import GerarIA from "./GerarIA";
import { logInteraction } from "./actions";

type Entry = {
  id: string;
  category: string;
  trigger_questions: string[] | null;
  answer: string | null;
  strategy: string | null;
  technique: string | null;
  next_objective: string | null;
};

type ContactLite = { id: string; name: string; journey_stage: string; phone: string | null };
type Interaction = { id: string; direction: string; content: string; occurred_at: string };

export default async function ResponderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; customer?: string; salvo?: string }>;
}) {
  const { q = "", customer = "", salvo } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1>Responder</h1>
        <p className="text-dim">Sem empresa vinculada.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { stages } = await getSkillFormConfig(tenant.skill_key);

  const [{ data: entriesData }, { data: contactsData }] = await Promise.all([
    supabase
      .from("knowledge_entries")
      .select("id, category, trigger_questions, answer, strategy, technique, next_objective")
      .eq("tenant_id", tenant.id)
      .eq("source", "tenant")
      .eq("status", "active")
      .not("answer", "is", null),
    supabase
      .from("contacts")
      .select("id, name, journey_stage, phone")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null)
      .order("name"),
  ]);

  const entries = (entriesData as Entry[] | null) ?? [];
  const contacts = (contactsData as ContactLite[] | null) ?? [];
  const matches = q ? matchEntries(q, entries) : [];
  const categories = distinctCategories(entries);

  const contact = customer ? contacts.find((c) => c.id === customer) ?? null : null;
  let history: Interaction[] = [];
  if (contact) {
    const { data: h } = await supabase
      .from("interactions")
      .select("id, direction, content, occurred_at")
      .eq("tenant_id", tenant.id)
      .eq("contact_id", contact.id)
      .order("occurred_at", { ascending: false })
      .limit(6);
    history = (h as Interaction[] | null) ?? [];
  }

  const stageLabel = (k: string) => stages.find((s) => s.key === k)?.label ?? k;
  const wa = contact ? whatsappNumber(contact.phone) : null;

  return (
    <main style={{ maxWidth: 760 }}>
      <div className="between">
        <div>
          <h1>Responder</h1>
          <p className="text-dim" style={{ marginTop: 4 }}>
            Escolha o cliente, cole a mensagem e receba a melhor resposta da sua
            biblioteca. Você revisa e manda pelo WhatsApp.
          </p>
        </div>
      </div>

      {/* Contexto do cliente selecionado */}
      {contact && (
        <div className="card mt-16">
          <div className="between">
            <div className="row" style={{ gap: 10 }}>
              <strong style={{ fontSize: 16 }}>{contact.name}</strong>
              <span className="badge">{stageLabel(contact.journey_stage)}</span>
            </div>
            <div className="row" style={{ gap: 12 }}>
              {wa && (
                <a className="btn btn-sm" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" style={{ background: "#25D366", color: "#0b2e13", border: "none" }}>
                  WhatsApp
                </a>
              )}
              <Link href={`/painel/contatos/${contact.id}`} className="text-dim" style={{ fontSize: 13 }}>
                ver ficha →
              </Link>
            </div>
          </div>
          <div className="mt-16" style={{ paddingBottom: 4 }}>
            <JourneyBar stages={stages} current={contact.journey_stage} />
          </div>
          {history.length > 0 && (
            <div className="mt-16">
              <p className="eyebrow" style={{ marginBottom: 8 }}>Últimas interações</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {history.map((h) => (
                  <li key={h.id} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: 13, borderBottom: "1px solid var(--border)" }}>
                    <span className={h.direction === "inbound" ? "badge" : "badge badge-brand"} style={{ alignSelf: "flex-start" }}>
                      {h.direction === "inbound" ? "cliente" : "nós"}
                    </span>
                    <span className="grow" style={{ color: "var(--text-dim)" }}>
                      {h.content.length > 120 ? h.content.slice(0, 120) + "…" : h.content}
                    </span>
                    <span className="text-faint" style={{ whiteSpace: "nowrap" }}>
                      {new Date(h.occurred_at).toLocaleDateString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {history.length === 0 && (
            <p className="text-faint mt-8" style={{ fontSize: 13 }}>
              Primeiro atendimento deste cliente — sem histórico ainda.
            </p>
          )}
        </div>
      )}

      {/* Console */}
      <form method="get" className="mt-16">
        <label className="label">Cliente (opcional — traz jornada e histórico)</label>
        <select name="customer" defaultValue={customer}>
          <option value="">— sem vincular —</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {stageLabel(c.journey_stage)}
            </option>
          ))}
        </select>

        <label className="label" style={{ marginTop: 14 }}>Mensagem do cliente</label>
        <textarea
          id="msg"
          name="q"
          defaultValue={q}
          rows={4}
          placeholder="Cole aqui a mensagem que o cliente enviou… (ex.: achei caro, tem aula experimental?)"
          style={{ resize: "vertical" }}
        />
        <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>
          Buscar resposta
        </button>
      </form>

      {salvo && (
        <p className="badge badge-success mt-16">Atendimento registrado no histórico do cliente.</p>
      )}

      {/* Motor de IA (gera resposta personalizada; usa DNA + biblioteca + histórico) */}
      {hasAIKey() && (
        <GerarIA
          contactId={contact?.id}
          message={q}
          stages={stages.map((s) => ({ key: s.key, label: s.label }))}
        />
      )}

      {/* Biblioteca (busca manual, sem custo) */}
      {q && matches.length === 0 && (
        <div className="card mt-24">
          <p style={{ marginBottom: 12 }}>
            Não achei uma resposta pronta pra <strong>“{q}”</strong>. Navegue por categoria:
          </p>
          <div className="row wrap" style={{ gap: 8 }}>
            {categories.map((cat) => (
              <Link key={cat} href={`/painel/responder?q=${encodeURIComponent(cat)}${customer ? `&customer=${customer}` : ""}`} className="badge" style={{ padding: "6px 11px" }}>
                {cat}
              </Link>
            ))}
          </div>
        </div>
      )}

      {matches.map((m, i) => (
        <div key={m.id} className="card mt-16">
          <div className="eyebrow">
            {i === 0 ? "Melhor resposta" : "Alternativa"} · {m.category}
            {m.technique ? ` · ${m.technique}` : ""}
          </div>
          <p style={{ whiteSpace: "pre-line", marginTop: 12, lineHeight: 1.55 }}>{m.answer}</p>
          <div className="row" style={{ gap: 12, marginTop: 8 }}>
            <CopyButton text={m.answer ?? ""} />
            {contact && (
              <form action={logInteraction}>
                <input type="hidden" name="contact_id" value={contact.id} />
                <input type="hidden" name="inbound" value={q} />
                <input type="hidden" name="outbound" value={m.answer ?? ""} />
                <button type="submit" className="btn btn-sm btn-ghost">
                  Registrar no cliente
                </button>
              </form>
            )}
          </div>
          {m.next_objective && (
            <p className="text-dim" style={{ marginTop: 12, fontSize: 13 }}>
              Objetivo: {m.next_objective}
            </p>
          )}
        </div>
      ))}
    </main>
  );
}
