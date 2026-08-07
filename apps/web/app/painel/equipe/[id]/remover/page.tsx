import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { removeMember } from "../../actions";

type Member = {
  id: string;
  user: { full_name: string | null; email: string | null } | null;
};

export default async function RemoverMembroPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;

  if (!tenant || (membership.role !== "owner" && membership.role !== "admin")) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Remover</h1>
        <p style={{ opacity: 0.85 }}>Só um administrador pode remover membros.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("memberships")
    .select("id, user:profiles(full_name, email)")
    .eq("tenant_id", tenant.id)
    .eq("status", "active");
  const { data: contacts } = await supabase
    .from("contacts")
    .select("owner_id")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null);

  const team = (members as Member[] | null) ?? [];
  const alvo = team.find((m) => m.id === id);
  if (!alvo) notFound();

  const owned = (contacts as { owner_id: string | null }[] | null) ?? [];
  const nContatos = owned.filter((c) => c.owner_id === id).length;
  const outros = team.filter((m) => m.id !== id);

  const nome = alvo.user?.full_name ?? alvo.user?.email ?? "este membro";
  const action = removeMember.bind(null, id);

  return (
    <main style={{ maxWidth: 460 }}>
      <Link href="/painel/equipe" style={{ fontSize: 13, opacity: 0.7 }}>
        ← Equipe
      </Link>
      <h1 style={{ fontSize: 24, margin: "8px 0 0" }}>Remover {nome}</h1>
      <p style={{ opacity: 0.75, marginTop: 8 }}>
        {nContatos > 0
          ? `${nContatos} contato(s) estão com esta pessoa. Para ninguém ficar sem acompanhamento, transfira-os antes de remover.`
          : "Esta pessoa não tem contatos atribuídos."}
      </p>

      {erro && (
        <p style={{ color: "var(--danger)", fontSize: 13, padding: "8px 10px", border: "1px solid rgba(192,57,43,0.4)", borderRadius: 8, background: "rgba(192,57,43,0.08)", marginTop: 12 }}>
          {erro}
        </p>
      )}

      <form action={action} style={{ display: "grid", gap: 14, marginTop: 16 }}>
        {/* DUAS SAÍDAS, e a segunda existe por causa do rodízio de recepção:
            despejar a carteira inteira de quem saiu num vendedor só não
            transfere a carteira, transfere o problema — e o resultado é
            ninguém sendo acompanhado por ninguém. */}
        {nContatos > 0 && outros.length > 1 && (
          <label style={{ fontSize: 13, opacity: 0.85, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="checkbox" name="modo" value="dividir" style={{ marginTop: 3 }} />
            <span>
              Dividir igualmente entre os {outros.length} que ficam
              <span style={{ display: "block", fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                Cerca de {Math.ceil(nContatos / outros.length)} contatos para cada. Marcando isto,
                a escolha abaixo é ignorada.
              </span>
            </span>
          </label>
        )}

        {nContatos > 0 && (
          <label style={{ fontSize: 13, opacity: 0.85 }}>
            Ou passar todos para
            <select
              name="new_owner"
              defaultValue=""
              style={{
                display: "block",
                width: "100%",
                padding: "9px 11px",
                marginTop: 5,
                border: "1px solid rgba(128,128,128,0.4)",
                borderRadius: 8,
                background: "var(--bg-elev)",
                color: "var(--text)",
                font: "inherit",
              }}
            >
              <option value="" disabled>
                Selecione uma pessoa
              </option>
              {outros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user?.full_name ?? m.user?.email ?? m.id}
                </option>
              ))}
            </select>
          </label>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="submit"
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "var(--danger)",
              color: "#fff",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Remover e transferir
          </button>
          <Link href="/painel/equipe" style={{ fontSize: 14, opacity: 0.7 }}>
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
