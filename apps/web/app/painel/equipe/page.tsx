import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { changeRole } from "./actions";
import { stagesForaDeJogo } from "@/lib/recurrence";
import { computePlacar } from "@/lib/placar";
import { PlacarDaEquipe } from "./Placar";
import LinkDoConvite from "./LinkDoConvite";

type Member = {
  id: string;
  role: string;
  user: { full_name: string | null; email: string | null } | null;
};

const ROLES = ["owner", "admin", "manager", "agent"];

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ convite?: string; ok?: string }>;
}) {
  const sp = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Equipe</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }
  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const { stages } = await getSkillFormConfig(tenant.skill_key);
  const wonKeys = new Set(stages.filter((s) => s.won).map((s) => s.key));
  const terminalKeys = stagesForaDeJogo(stages);

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("memberships")
    .select("id, role, user:profiles(full_name, email)")
    .eq("tenant_id", tenant.id)
    .eq("status", "active");
  // Janela de 30 dias: placar é sobre o mês corrente de trabalho, não sobre a
  // história inteira. Somar tudo desde sempre premia quem está há mais tempo.
  const desde = new Date(Date.now() - 30 * 86400000).toISOString();
  const hojeISO = new Date().toISOString().slice(0, 10);
  const [{ data: contacts }, { data: idsData }, { data: ixData }] = await Promise.all([
    supabase
      .from("contacts")
      .select("owner_id, journey_stage, created_at, next_action_at")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null),
    supabase
      .from("contacts")
      .select("id, owner_id")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null),
    supabase
      .from("interactions")
      .select("contact_id, direction, occurred_at")
      .eq("tenant_id", tenant.id)
      .gte("occurred_at", desde)
      .order("occurred_at", { ascending: true })
      .limit(4000),
  ]);

  const team = (members as Member[] | null) ?? [];
  const owned =
    (contacts as { owner_id: string | null; journey_stage: string; created_at: string; next_action_at: string | null }[] | null) ??
    [];
  const mine = (id: string) => owned.filter((c) => c.owner_id === id);
  const cadastros = (id: string) => mine(id).length;
  const matriculas = (id: string) =>
    mine(id).filter((c) => wonKeys.has(c.journey_stage)).length;
  const emAberto = (id: string) =>
    mine(id).filter((c) => !terminalKeys.has(c.journey_stage)).length;

  // -------------------------------------------------------------- O PLACAR
  //
  // Um ATENDIMENTO é uma mensagem que ENTROU; a resposta é a primeira saída
  // depois dela. Medir assim, e não por registro manual, é o que faz o tempo
  // de resposta existir sem ninguém preencher nada — e registro manual de
  // tempo é o campo que todo mundo esquece justamente nos dias corridos, que
  // são os dias em que ele importaria.
  const ownerDe = new Map<string, string | null>(
    ((idsData as { id: string; owner_id: string | null }[] | null) ?? []).map((r) => [r.id, r.owner_id]),
  );

  const ix = (ixData as { contact_id: string | null; direction: string; occurred_at: string }[] | null) ?? [];
  const atendimentos: { ownerId: string | null; entradaISO: string; respostaISO: string | null }[] = [];
  const aguardando = new Map<string, string>();
  for (const i of ix) {
    if (!i.contact_id) continue;
    if (i.direction === "inbound") {
      // Só a PRIMEIRA de uma sequência: três mensagens seguidas do cliente são
      // um atendimento, não três, e contar três inflaria o volume de quem
      // atende gente ansiosa.
      if (!aguardando.has(i.contact_id)) aguardando.set(i.contact_id, i.occurred_at);
    } else if (aguardando.has(i.contact_id)) {
      atendimentos.push({
        ownerId: ownerDe.get(i.contact_id) ?? null,
        entradaISO: aguardando.get(i.contact_id)!,
        respostaISO: i.occurred_at,
      });
      aguardando.delete(i.contact_id);
    }
  }
  // Entrada SEM resposta também é atendimento — e é justamente ela que não
  // pode sumir da conta: se sumisse, quem não respondeu ninguém apareceria com
  // tempo de resposta ótimo.
  for (const [cid, entrada] of aguardando) {
    atendimentos.push({ ownerId: ownerDe.get(cid) ?? null, entradaISO: entrada, respostaISO: null });
  }

  const placar = computePlacar(
    team.map((m) => ({ id: m.id, nome: m.user?.full_name ?? m.user?.email ?? "—" })),
    atendimentos,
    owned.map((c) => ({
      ownerId: c.owner_id,
      ganho: wonKeys.has(c.journey_stage),
      combinadoAtrasado: !!c.next_action_at && c.next_action_at < hojeISO && !terminalKeys.has(c.journey_stage),
      novoNoPeriodo: c.created_at >= desde,
    })),
  );

  const inviteLink = sp.convite ? decodeURIComponent(sp.convite) : null;

  return (
    <main>
      <div className="between">
        <h1>Equipe</h1>
        {isAdmin && (
          <Link href="/painel/equipe/adicionar" className="btn btn-sm btn-primary">
            + Adicionar
          </Link>
        )}
      </div>

      <PlacarDaEquipe placar={placar} periodo="últimos 30 dias" />

      {inviteLink && (
        <div className="card mt-16" style={{ borderColor: "var(--border-brand)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13 }}>
            <span className="badge badge-success" style={{ marginRight: 8 }}>Convite gerado</span>
            Envie este link para a pessoa (WhatsApp, e-mail) — ela define a própria senha:
          </p>
          <LinkDoConvite link={inviteLink} />
        </div>
      )}
      {sp.ok && <p className="badge badge-success mt-16">Membro vinculado.</p>}

      <div className="card mt-24" style={{ padding: 0, overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>Papel</th>
              <th style={{ textAlign: "right" }}>Cadastros</th>
              <th style={{ textAlign: "right" }}>Em aberto</th>
              <th style={{ textAlign: "right" }}>Matrículas</th>
              {isAdmin && <th style={{ textAlign: "right" }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {team.map((mem) => (
              <tr key={mem.id}>
                <td>
                  {mem.user?.full_name ?? mem.user?.email ?? "—"}
                  {mem.user?.full_name && (
                    <span className="text-faint" style={{ fontSize: 12 }}> · {mem.user?.email}</span>
                  )}
                </td>
                <td>
                  {isAdmin && mem.id !== membership.membershipId ? (
                    <form action={changeRole.bind(null, mem.id)} className="row" style={{ gap: 6 }}>
                      <select name="role" defaultValue={mem.role} style={{ width: "auto", padding: "5px 8px", fontSize: 13 }}>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button type="submit" className="btn btn-sm btn-ghost">Salvar</button>
                    </form>
                  ) : (
                    <span className="badge">{mem.role}</span>
                  )}
                </td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{cadastros(mem.id)}</td>
                <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{emAberto(mem.id)}</td>
                <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{matriculas(mem.id)}</td>
                {isAdmin && (
                  <td style={{ textAlign: "right" }}>
                    {mem.id !== membership.membershipId ? (
                      <Link href={`/painel/equipe/${mem.id}/remover`} style={{ color: "var(--danger)", fontSize: 13 }}>
                        Remover
                      </Link>
                    ) : (
                      <span className="text-faint" style={{ fontSize: 13 }}>você</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-faint" style={{ marginTop: 20, fontSize: 13 }}>
        Cadastros e matrículas vêm dos contatos de cada vendedor. Tempo de resposta
        entra com o histórico de atendimentos.
      </p>
    </main>
  );
}
