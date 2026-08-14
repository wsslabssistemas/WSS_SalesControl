import { createAdminClient } from "@/lib/supabase/admin";
import { computeAlerts } from "@/lib/agenda";
import { computeDue, stagesWithoutRecurrence } from "@/lib/recurrence";
import { buildIcs, type IcsEvent } from "@/lib/ics";
import type { Stage } from "@/lib/skill";
import { lerTudo } from "@/lib/paginado";

/**
 * Calendário assinável do estabelecimento (.ics).
 *
 * Não há sessão aqui: um app de calendário não faz login. A credencial é o
 * TOKEN secreto da URL — mesmo modelo do "endereço secreto" do Google Agenda.
 * Por isso o token é longo, aleatório, e pode ser trocado pelo dono a qualquer
 * momento (o que invalida o endereço antigo).
 *
 * Só expõe nome do contato e o toque a fazer — nunca telefone, histórico ou
 * qualquer dado sensível.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token || token.length < 24) {
    return new Response("Endereço inválido.", { status: 404 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return new Response("Indisponível.", { status: 503 });
  }

  // O token identifica a empresa. Sem par, 404 — nunca revelar o motivo.
  const { data: tenants } = await admin
    .from("tenants")
    .select("id, name, skill_key, settings")
    .is("deleted_at", null);

  const tenant = (
    (tenants as { id: string; name: string; skill_key: string; settings: Record<string, unknown> | null }[] | null) ?? []
  ).find((t) => (t.settings as { calendar_token?: string } | null)?.calendar_token === token);

  if (!tenant) return new Response("Endereço inválido.", { status: 404 });

  const [{ data: skill }, contatos] = await Promise.all([
    admin.from("skills").select("manifest").eq("key", tenant.skill_key).maybeSingle(),
    // ⚠ PAGINADO. Este feed é assinado no Google/Apple/Outlook e ninguém o
    // abre para conferir — ele aparece pronto no calendário. Cortado em 1.000
    // contatos, o compromisso de quem ficou de fora nunca chega, e a ausência
    // de um evento num calendário é indistinguível de não haver compromisso.
    lerTudo<{
      id: string; name: string; phone: string | null; owner_id: string | null;
      journey_stage: string; stage_entered_at: string; custom: Record<string, unknown> | null;
    }>(
      (de, ate) => admin
        .from("contacts")
        .select("id, name, phone, owner_id, journey_stage, stage_entered_at, custom")
        .eq("tenant_id", tenant.id)
        .is("deleted_at", null)
        .order("id")
        .range(de, ate),
      { rotulo: "contatos do calendario" },
    ),
  ]);

  const manifest = (skill?.manifest as { journey?: { stages?: Stage[] }; recurrence?: Record<string, unknown> } | null) ?? {};
  const stages = manifest.journey?.stages ?? [];
  const contacts = contatos;

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const eventos: IcsEvent[] = [];

  // 1) Toques das fases da jornada.
  for (const a of computeAlerts(contacts, stages)) {
    eventos.push({
      uid: `toque-${a.contactId}-${a.phaseLabel}-${a.date.toISOString().slice(0, 10)}@kairos`,
      title: `${a.name} — ${a.phaseLabel}`,
      description: `${a.stageLabel}. Toque previsto pelo Kairós.`,
      date: a.date,
      url: base ? `${base}/painel/contatos/${a.contactId}` : undefined,
    });
  }

  // 2) Retornos de recompra (segmentos com ciclo declarado).
  const ultimaVisita: Record<string, string> = {};
  // ⚠ PAGINADO. Este feed vira a agenda no celular de quem trabalha. Cortado,
  // um cliente ja atendido reapareceria como retorno devido — e ninguem
  // desconfia de um compromisso a mais no calendario.
  const ix = await lerTudo<{ contact_id: string | null; occurred_at: string }>(
    (de, ate) => admin
      .from("interactions")
      .select("contact_id, occurred_at")
      .eq("tenant_id", tenant.id)
      .order("occurred_at", { ascending: false })
      .range(de, ate),
    { rotulo: "interacoes do calendario" },
  );
  for (const i of ix) {
    if (i.contact_id && !ultimaVisita[i.contact_id]) ultimaVisita[i.contact_id] = i.occurred_at;
  }

  for (const r of computeDue(contacts, ultimaVisita, manifest.recurrence ?? null, stagesWithoutRecurrence(stages))) {
    eventos.push({
      uid: `retorno-${r.contactId}-${r.suggested.toISOString().slice(0, 10)}@kairos`,
      title: `Chamar ${r.name} de volta`,
      description: `Ciclo de ${r.intervalDays} dias. ${r.daysSince} dias desde o último contato.`,
      date: r.suggested,
      url: base ? `${base}/painel/contatos/${r.contactId}` : undefined,
    });
  }

  const ics = buildIcs(`Kairós — ${tenant.name}`, eventos);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="kairos.ics"`,
      // Não deve ser guardado por intermediários: é endereço privado.
      "Cache-Control": "private, max-age=900",
    },
  });
}
