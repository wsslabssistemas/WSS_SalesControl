import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { computeDueTouches } from "@/lib/cadence";
import { computeDue, stagesWithoutRecurrence, stagesForaDeJogo } from "@/lib/recurrence";
import { computeRenovacoes } from "@/lib/renovacao";
import { construirFila, comCarimbo, ROTULO, type ItemDaFila as Item } from "@/lib/fila";
import { paraE164BR } from "@/lib/phone";
import { lerTudo } from "@/lib/paginado";
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
  next_action: string | null;
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

  const { stages, cadences, recurrence, contract } = await getSkillFormConfig(tenant.skill_key);
  const supabase = await createClient();

  // LEITURA PAGINADA, e não é otimização — é correção.
  //
  // Estas duas consultas não tinham `.range()`, e o PostgREST corta em 1.000
  // linhas SEM AVISAR. Com 273 contatos ninguém via; com os 9 mil que vão
  // entrar, a fila passaria a calcular sobre 1.000 contatos ARBITRÁRIOS (não
  // há ordenação declarada) e a lista do dia sairia errada com cara de certa.
  //
  // O `limit(3000)` das interações era a mesma doença com número maior: quem
  // tivesse o último contato mais antigo que a 3.000ª interação apareceria
  // como "nunca contatado", e entraria na fila indevidamente.
  const [cData, ixData, { data: mData }] = await Promise.all([
    lerTudo<Contact>(
      (de, ate) => supabase
        .from("contacts")
        .select("id, name, phone, owner_id, journey_stage, stage_entered_at, next_action_at, next_action, next_action_note, contract_end, custom")
        .eq("tenant_id", tenant.id)
        .is("deleted_at", null)
        .order("id")
        .range(de, ate),
      { rotulo: "contatos da fila" },
    ),
    lerTudo<{ contact_id: string | null; occurred_at: string }>(
      (de, ate) => supabase
        .from("interactions")
        .select("contact_id, occurred_at")
        .eq("tenant_id", tenant.id)
        .order("occurred_at", { ascending: false })
        .range(de, ate),
      { rotulo: "interações da fila" },
    ),
    supabase
      .from("memberships")
      .select("id, user:profiles(full_name, email)")
      .eq("tenant_id", tenant.id)
      .eq("status", "active"),
  ]);

  const todos = cData;
  const contatos = resp ? todos.filter((c) => c.owner_id === resp) : todos;
  const membros = ((mData as { id: string; user: { full_name: string | null; email: string | null } | null }[] | null) ?? [])
    .map((m) => ({ id: m.id, nome: m.user?.full_name ?? m.user?.email ?? "—" }));

  const ultimo: Record<string, string> = {};
  for (const i of ixData) {
    if (i.contact_id && !ultimo[i.contact_id]) ultimo[i.contact_id] = i.occurred_at;
  }

  const hojeISO = new Date().toISOString().slice(0, 10);

  // AS QUATRO ORIGENS MORAM EM `lib/fila.ts`, não aqui. Enquanto a montagem
  // vivia nesta tela, o Painel inicial montava as SUAS cinco listas e a
  // dedução "uma pessoa, um motivo" não valia lá — a mesma aluna aparecia em
  // três lugares. Fila é lógica, não é tela.
  const fila = construirFila({
    contatos: contatos.map(comCarimbo), ultimoContato: ultimo, stages, cadences, recurrence, renewal: contract?.renewal, hojeISO,
    deps: { stagesForaDeJogo, stagesWithoutRecurrence, computeRenovacoes, computeDueTouches, computeDue },
  });
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
            {(["combinado", "renovacao", "followup", "recompra", "lembrete"] as const).map((m) =>
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
                  observacao={f.observacao}
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
