import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { changeRole } from "./actions";

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
  const terminalKeys = new Set(stages.filter((s) => s.terminal).map((s) => s.key));

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("memberships")
    .select("id, role, user:profiles(full_name, email)")
    .eq("tenant_id", tenant.id)
    .eq("status", "active");
  const { data: contacts } = await supabase
    .from("contacts")
    .select("owner_id, journey_stage")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null);

  const team = (members as Member[] | null) ?? [];
  const owned =
    (contacts as { owner_id: string | null; journey_stage: string }[] | null) ??
    [];
  const mine = (id: string) => owned.filter((c) => c.owner_id === id);
  const cadastros = (id: string) => mine(id).length;
  const matriculas = (id: string) =>
    mine(id).filter((c) => wonKeys.has(c.journey_stage)).length;
  const emAberto = (id: string) =>
    mine(id).filter((c) => !terminalKeys.has(c.journey_stage)).length;

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

      {inviteLink && (
        <div className="card mt-16" style={{ borderColor: "var(--border-brand)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13 }}>
            <span className="badge badge-success" style={{ marginRight: 8 }}>Convite gerado</span>
            Envie este link para a pessoa (WhatsApp, e-mail) — ela define a própria senha:
          </p>
          <input readOnly value={inviteLink} style={{ fontSize: 12 }} />
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
