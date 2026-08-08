import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { computeDueTouches } from "@/lib/cadence";
import { computeDue, stagesWithoutRecurrence, stagesForaDeJogo } from "@/lib/recurrence";
import { computeRenovacoes } from "@/lib/renovacao";
import { montarFila, ROTULO, type ItemDaFila as Item } from "@/lib/fila";
import { paraE164BR } from "@/lib/phone";
import { ItemDaFila } from "./ItemDaFila";

export const metadata = { title: "Fila de envio" };

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  owner_id: string | null;
  journey_stage: string;
  stage_entered_at: string;
  next_action_at: string | null;
  next_action_note: string | null;
  contract_end: string | null;
  custom: Record<string, unknown> | null;
};

/**
 * A FILA DE ENVIO DE UM TOQUE.
 *
 * O último item do `COS_Kairos_Vende_Kairos.md`: o motor decide QUEM contatar e
 * O QUE dizer; a mensagem cai numa fila; a pessoa abre e envia pelo `wa.me` com
 * um clique. Sem Meta, sem template aprovado, sem risco de banir o número.
 *
 * É o mesmo princípio do cockpit manual aplicado ao contato ativo: **a
 * inteligência é nossa, o envio é humano.** Quando o volume justificar a
 * burocracia da API oficial, a fila vira automática sem reescrever nada — o
 * que muda é quem aperta o botão.
 */
export default async function FilaPage({
  searchParams,
}: {
  searchParams: Promise<{ resp?: string }>;
}) {
  const { resp = "" } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Fila de envio</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }

  const { stages, cadences, recurrence } = await getSkillFormConfig(tenant.skill_key);
  const supabase = await createClient();

  const [{ data: cData }, { data: ixData }, { data: mData }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, phone, owner_id, journey_stage, stage_entered_at, next_action_at, next_action_note, contract_end, custom")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null),
    supabase
      .from("interactions")
      .select("contact_id, occurred_at")
      .eq("tenant_id", tenant.id)
      .order("occurred_at", { ascending: false })
      .limit(3000),
    supabase
      .from("memberships")
      .select("id, user:profiles(full_name, email)")
      .eq("tenant_id", tenant.id)
      .eq("status", "active"),
  ]);

  const todos = (cData as Contact[] | null) ?? [];
  const contatos = resp ? todos.filter((c) => c.owner_id === resp) : todos;
  const membros = ((mData as { id: string; user: { full_name: string | null; email: string | null } | null }[] | null) ?? [])
    .map((m) => ({ id: m.id, nome: m.user?.full_name ?? m.user?.email ?? "—" }));

  const ultimo: Record<string, string> = {};
  for (const i of ((ixData as { contact_id: string | null; occurred_at: string }[] | null) ?? [])) {
    if (i.contact_id && !ultimo[i.contact_id]) ultimo[i.contact_id] = i.occurred_at;
  }

  const foraDeJogo = stagesForaDeJogo(stages);
  const hojeISO = new Date().toISOString().slice(0, 10);
  const itens: Item[] = [];

  // 1. COMBINADO — o compromisso que a PESSOA assumiu com o cliente.
  for (const c of contatos) {
    if (!c.next_action_at || c.next_action_at > hojeISO || foraDeJogo.has(c.journey_stage)) continue;
    itens.push({
      contactId: c.id, name: c.name, phone: c.phone, ownerId: c.owner_id,
      motivo: "combinado",
      intencao: c.next_action_note
        ? `Retomar o que ficou combinado: ${c.next_action_note}`
        : "Retomar o contato na data que foi combinada com ele.",
      atraso: Math.round((Date.parse(hojeISO) - Date.parse(c.next_action_at)) / 86400000),
    });
  }

  // 2. RENOVAÇÃO — receita já vendida saindo pela porta.
  for (const r of computeRenovacoes(contatos, foraDeJogo)) {
    const c = contatos.find((x) => x.id === r.contactId)!;
    itens.push({
      contactId: r.contactId, name: r.name, phone: r.phone, ownerId: c.owner_id,
      motivo: "renovacao", intencao: r.intencao,
      atraso: r.vencido ? Math.abs(r.diasParaVencer) : 0,
    });
  }

  // 3. FOLLOW-UP — a cadência do ramo, que é a maior perda medida do piloto.
  for (const t of computeDueTouches(contatos, ultimo, stages, cadences)) {
    itens.push({
      contactId: t.contactId, name: t.name, phone: t.phone, ownerId: t.ownerId,
      motivo: "followup",
      intencao: t.semCadencia
        ? "Sem cadência declarada para esta etapa: retome com um ângulo novo, sem cobrar o silêncio."
        : `${t.intent} (toque ${t.stepNumber} de ${t.totalSteps})`,
      atraso: t.overdueDays,
    });
  }

  // 4. RECOMPRA — o ciclo do cliente conquistado.
  for (const r of computeDue(contatos, ultimo, recurrence, stagesWithoutRecurrence(stages))) {
    const c = contatos.find((x) => x.id === r.contactId)!;
    itens.push({
      contactId: r.contactId, name: r.name, phone: r.phone, ownerId: c.owner_id,
      motivo: "recompra",
      intencao: `Está no ponto de voltar (ciclo de ${r.intervalDays} dias). Sugira uma data concreta, sem cobrar a ausência.`,
      atraso: Math.max(0, r.overdueDays),
    });
  }

  const fila = montarFila(itens);
  const porMotivo = (m: string) => fila.filter((f) => f.motivo === m).length;

  return (
    <main>
      <div className="between">
        <h1>Fila de envio</h1>
        <Link href="/painel/followup" className="btn btn-sm btn-ghost">Follow-up →</Link>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Quem falar com hoje, por que, e o que dizer. O sistema escreve a mensagem;{" "}
        <strong>quem envia é você</strong> — um clique abre o WhatsApp com o texto pronto.
      </p>

      {membros.length > 1 && (
        <form method="get" className="row wrap mt-16" style={{ gap: 8 }}>
          <select name="resp" defaultValue={resp} style={{ width: "auto" }}>
            <option value="">Toda a equipe</option>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-sm">Filtrar</button>
        </form>
      )}

      {fila.length === 0 ? (
        <div className="card mt-24">
          <p className="text-dim" style={{ margin: 0 }}>
            Fila vazia. Ninguém combinado, vencendo, esperando follow-up ou no ponto de voltar. 🎯
          </p>
        </div>
      ) : (
        <>
          <div className="row wrap mt-16" style={{ gap: 8 }}>
            {(["combinado", "renovacao", "followup", "recompra"] as const).map((m) =>
              porMotivo(m) > 0 ? (
                <span key={m} className="badge">{ROTULO[m]}: <strong>{porMotivo(m)}</strong></span>
              ) : null,
            )}
          </div>

          {/* A ORDEM NÃO É POR DATA, É POR CUSTO DE FURAR: combinado primeiro
              (o cliente lembra que marcou), depois renovação (receita já
              vendida), depois follow-up e recompra. */}
          <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
            {fila.slice(0, 40).map((f) => {
              const num = paraE164BR(f.phone);
              return (
                <ItemDaFila
                  key={f.contactId}
                  contactId={f.contactId}
                  nome={f.name}
                  numero={num.ok ? num.digitos : null}
                  ajusteNoNumero={num.ok ? num.ajuste : null}
                  motivo={f.motivo}
                  intencao={f.intencao}
                  atraso={f.atraso}
                />
              );
            })}
          </ul>
          {fila.length > 40 && (
            <p className="text-faint" style={{ fontSize: 13, textAlign: "center" }}>
              Mostrando os 40 primeiros de {fila.length}. Resolva estes e a fila recarrega.
            </p>
          )}
        </>
      )}
    </main>
  );
}
