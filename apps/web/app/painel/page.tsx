import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { computeCooling } from "@/lib/agenda";
import { computeDue, stagesWithoutRecurrence, stagesForaDeJogo } from "@/lib/recurrence";
import { computeDueTouches } from "@/lib/cadence";
import { linkDeWhatsApp } from "@/lib/envio";
import { lerTudo } from "@/lib/paginado";
import { computeRenovacoes } from "@/lib/renovacao";
import { construirFila, ROTULO, PESO } from "@/lib/fila";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  journey_stage: string;
  stage_entered_at: string;
  owner_id: string | null;
  custom: Record<string, unknown> | null;
  next_action_at: string | null;
  next_action: string | null;
  next_action_note: string | null;
  contract_end: string | null;
};
type Ix = { contact_id: string | null; occurred_at: string; outcome: string | null };

// Desfecho canônico (0044). As DUAS perdas aparecem separadas de propósito:
// perder por silêncio tem conserto barato (follow-up); perder por decisão é
// outro remédio. Somar as duas esconde justamente o que dá para consertar.
const OUTCOMES: { key: string; label: string; color: string }[] = [
  { key: "ganhou", label: "Fecharam", color: "var(--success)" },
  { key: "avancou", label: "Avançaram", color: "var(--brand-cyan)" },
  { key: "respondeu", label: "Responderam", color: "var(--brand-blue)" },
  { key: "perdeu_decisao", label: "Disseram não", color: "var(--warn)" },
  { key: "perdeu_silencio", label: "Sumiram", color: "var(--danger)" },
];

export default async function PainelHome({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>;
}) {
  // `ver` abre uma seção inteira em vez das 8 primeiras. Antes, "+58 outros
  // esfriando" era TEXTO MORTO: o número existia, o vendedor via, e não havia
  // para onde ir. Número que informa e não leva a lugar nenhum é pior que
  // número escondido — ele avisa de um problema e nega o caminho.
  const { ver } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;

  if (!tenant) {
    return (
      <main>
        <h1>Início</h1>
        <p className="text-dim">
          Você ainda não tem empresa aqui.{" "}
          <Link href="/painel/nova-empresa">Criar a minha agora →</Link>
        </p>
      </main>
    );
  }

  const { stages, recurrence, cadences } = await getSkillFormConfig(tenant.skill_key);
  const supabase = await createClient();

  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  // PAGINADO porque os números desta tela são CONTAGENS: `contacts.length` é o
  // total exibido e o funil conta por etapa sobre este mesmo array. O corte
  // silencioso do PostgREST em 1.000 linhas não deixaria a tela quebrada — ela
  // mostraria "1.000 contatos" e um funil proporcionalmente errado, com toda a
  // aparência de estar certo. Com 273 contatos isso nunca apareceu; com 9 mil,
  // seria o primeiro número que o fundador olharia de manhã.
  const [contactsData, { count: membersCount }, { data: ixData }, { data: skill }, { data: dnaRow }] = await Promise.all([
    lerTudo<Contact>(
      (de, ate) => supabase
        .from("contacts")
        .select("id, name, phone, journey_stage, stage_entered_at, owner_id, custom, next_action_at, next_action, next_action_note, contract_end")
        .eq("tenant_id", tenant.id)
        .is("deleted_at", null)
        .order("id")
        .range(de, ate),
      { rotulo: "contatos do painel" },
    ),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("status", "active"),
    supabase
      .from("interactions")
      .select("contact_id, occurred_at, outcome")
      .eq("tenant_id", tenant.id)
      .order("occurred_at", { ascending: false })
      .limit(2000),
    supabase.from("skills").select("manifest").eq("key", tenant.skill_key).maybeSingle(),
    supabase.from("commercial_dna").select("sections").eq("tenant_id", tenant.id).eq("is_current", true).maybeSingle(),
  ]);

  // Cobertura de DNA (para sugerir o onboarding).
  const dnaSections = (skill?.manifest as { dna_sections?: { key: string }[] } | null)?.dna_sections ?? [];
  const dnaFilledObj = (dnaRow?.sections as Record<string, unknown> | null) ?? {};
  const dnaFilled = dnaSections.filter((s) => {
    const v = dnaFilledObj[s.key];
    if (v == null) return false;
    if (typeof v === "object") return Object.keys(v as object).length > 0;
    return String(v).length > 0;
  }).length;
  const dnaIncompleto = dnaSections.length > 0 && dnaFilled < dnaSections.length;
  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const contacts = contactsData;
  const ix = (ixData as Ix[] | null) ?? [];

  // FORA DE JOGO = terminal OU perda. Contar só `terminal` colocaria os 135
  // leads que pararam de responder dentro de "em aberto" — e número inflado
  // não parece defeito, parece um mês bom.
  const foraDeJogo = stagesForaDeJogo(stages);
  const emAberto = contacts.filter((c) => !foraDeJogo.has(c.journey_stage)).length;

  // Última interação por contato (para "esfriando").
  const lastByContact: Record<string, string> = {};
  for (const i of ix) {
    if (!i.contact_id) continue;
    if (!lastByContact[i.contact_id]) lastByContact[i.contact_id] = i.occurred_at;
  }

  const cooling = computeCooling(contacts, lastByContact, stages);
  const hojeISO = new Date().toISOString().slice(0, 10);

  // ⚠ UMA FILA, NÃO CINCO LISTAS.
  //
  // Esta tela montava cinco listas independentes — combinado, renovação,
  // recompra, esfriando e "para hoje" — e nenhuma sabia da outra. A mesma
  // aluna aparecia em TRÊS delas ao mesmo tempo (o fundador pegou: Ana
  // Alicie, matriculada, no "Você combinou de voltar" depois de já ter
  // respondido). O vendedor manda UMA mensagem por pessoa; cinco listas
  // pedem cinco.
  //
  // A dedução "uma pessoa, um motivo" já existia — só que trancada dentro de
  // `/painel/fila`. Agora as duas telas chamam a mesma `construirFila`, e o
  // motivo aparece escrito na linha em vez de ficar implícito no título da
  // seção em que a pessoa caiu.
  const fila = construirFila({
    contatos: contacts.map((c) => ({ ...c, next_action_note: c.next_action_note })),
    ultimoContato: lastByContact, stages, cadences, recurrence, hojeISO,
    deps: { stagesForaDeJogo, stagesWithoutRecurrence, computeRenovacoes, computeDueTouches, computeDue },
  });

  // Resultados dos últimos 30 dias (do feedback registrado).
  const recentOutcomes = ix.filter((i) => i.outcome && i.occurred_at >= monthAgo);
  const outcomeCount = (k: string) => recentOutcomes.filter((i) => i.outcome === k).length;

  const stageLabel = (k: string) => stages.find((s) => s.key === k)?.label ?? k;
  const perStage = stages
    .filter((s) => !s.terminal && !s.lost)
    .map((s) => ({ label: s.label, key: s.key, n: contacts.filter((c) => c.journey_stage === s.key).length }));

  const waLink = (phone: string | null) => linkDeWhatsApp(phone);

  return (
    <main>
      <div className="between">
        <h1>{tenant.name}</h1>
        <Link href="/painel/contatos/novo" className="btn btn-primary btn-sm">
          + Novo contato
        </Link>
      </div>

      {/* Onboarding: calibrar o DNA */}
      {isAdmin && dnaIncompleto && (
        <Link href="/painel/onboarding" className="card card-hover mt-16" style={{ display: "block", borderColor: "var(--border-brand)", background: "var(--brand-gradient-soft)" }}>
          <div className="between" style={{ alignItems: "center", gap: 12 }}>
            <div>
              <strong>Termine de calibrar seu Kairós</strong>
              <p className="text-dim" style={{ margin: "4px 0 0", fontSize: 14 }}>
                {dnaFilled}/{dnaSections.length} seções do DNA preenchidas. Complete o onboarding para o sistema responder com os seus fatos.
              </p>
            </div>
            <span className="btn btn-sm btn-primary" style={{ whiteSpace: "nowrap" }}>Continuar →</span>
          </div>
        </Link>
      )}

      {/* Números-chave */}
      <div className="stat-grid mt-24">
        <Link href="/painel/contatos" className="card card-hover" style={{ display: "block" }}>
          <div className="stat-num">{contacts.length}</div>
          <div className="stat-label">Contatos</div>
        </Link>
        <Link href="/painel/funil" className="card card-hover" style={{ display: "block" }}>
          <div className="stat-num">{emAberto}</div>
          <div className="stat-label">Em aberto</div>
        </Link>
        <Link href="/painel/fila" className="card card-hover" style={{ display: "block" }}>
          <div className="stat-num" style={{ color: fila.length ? "var(--warn)" : undefined }}>{fila.length}</div>
          <div className="stat-label">Para falar hoje</div>
        </Link>
        <Link href="/painel?ver=esfriando#esfriando" className="card card-hover" style={{ display: "block" }}>
          <div className="stat-num" style={{ color: cooling.length ? "var(--danger)" : undefined }}>{cooling.length}</div>
          <div className="stat-label">Esfriando</div>
        </Link>
      </div>

      {/* Resultados dos últimos 30 dias — o feedback do que aconteceu */}
      {recentOutcomes.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 15, margin: "0 0 10px" }}>Resultados (últimos 30 dias)</h2>
          <div className="row wrap" style={{ gap: 8 }}>
            {OUTCOMES.map((o) => (
              <span key={o.key} className="badge" style={{ padding: "8px 13px", fontSize: 13 }}>
                {o.label}: <strong style={{ color: o.color }}>{outcomeCount(o.key)}</strong>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ⚠ UMA FILA, COM O MOTIVO ESCRITO NA LINHA.
          Aqui havia cinco seções — combinado, renovação, recompra, esfriando
          e "para hoje" — cada uma com a sua própria lista. Uma pessoa podia
          estar em três, e nada na tela dizia que era a mesma. O vendedor
          manda UMA mensagem por pessoa; a fila agora reflete isso.
          O motivo virou coluna porque ele era o TÍTULO DA SEÇÃO: com tudo
          numa lista só, sem a etiqueta ninguém saberia por que a pessoa está
          ali — e "por que estou falando com essa pessoa" é metade da decisão. */}
      <section id="fila" style={{ marginTop: 32 }}>
        <div className="between" style={{ alignItems: "baseline" }}>
          <h2 style={{ fontSize: 15, margin: 0 }}>Quem falar com hoje</h2>
          <Link href="/painel/fila" style={{ fontSize: 13, opacity: 0.7 }}>abrir a fila →</Link>
        </div>
        {fila.length === 0 ? (
          <p className="text-dim" style={{ fontSize: 14, marginTop: 10 }}>
            Ninguém pendente. Tudo em dia. 🎉
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 10 }}>
            {(ver === "fila" ? fila : fila.slice(0, 8)).map((f) => {
              const wa = waLink(f.phone);
              return (
                <li
                  key={f.contactId}
                  className="row wrap"
                  style={{ gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: 14 }}
                >
                  <span
                    className={f.atraso > 0 ? "badge badge-danger" : "badge badge-brand"}
                    style={{ minWidth: 62, justifyContent: "center" }}
                  >
                    {f.atraso > 0 ? `+${f.atraso}d` : "hoje"}
                  </span>
                  <Link href={`/painel/contatos/${f.contactId}`} className="grow" style={{ minWidth: 120 }}>
                    {f.name}
                  </Link>
                  <span className={PESO[f.motivo] === 0 ? "badge badge-warn" : "badge"} style={{ whiteSpace: "nowrap" }}>
                    {ROTULO[f.motivo]}
                  </span>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: "#25D366", color: "#0b2e13", border: "none", padding: "3px 10px" }}>
                      WhatsApp
                    </a>
                  )}
                  <Link href={`/painel/responder?customer=${f.contactId}`} className="btn btn-sm btn-ghost">
                    Responder
                  </Link>
                </li>
              );
            })}
            {fila.length > 8 && ver !== "fila" && (
              <li style={{ fontSize: 13, paddingTop: 10, textAlign: "center" }}>
                <Link href="/painel?ver=fila#fila" className="btn btn-sm btn-ghost">
                  Ver os outros {fila.length - 8} →
                </Link>
              </li>
            )}
          </ul>
        )}
        <p className="text-faint" style={{ marginTop: 12, fontSize: 12 }}>
          Cada pessoa aparece <strong>uma vez</strong>, pelo motivo mais urgente. Depois
          que a conversa acontece, ela sai daqui sozinha e só volta quando houver
          um motivo novo — o combinado seguinte, o contrato a vencer, o próximo
          toque da régua ou a hora da recompra.
        </p>
      </section>

      {/* Funil resumido */}
      <section style={{ marginTop: 32 }}>
        <div className="between" style={{ alignItems: "baseline" }}>
          <h2 style={{ fontSize: 15, margin: 0 }}>Funil</h2>
          <Link href="/painel/funil" style={{ fontSize: 13, opacity: 0.7 }}>ver funil</Link>
        </div>
        <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
          {perStage.map((s) => (
            <Link key={s.key} href={`/painel/contatos?etapa=${s.key}`} className="badge" style={{ padding: "7px 12px", fontSize: 13 }}>
              {s.label}: <strong style={{ color: "var(--text)" }}>{s.n}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
