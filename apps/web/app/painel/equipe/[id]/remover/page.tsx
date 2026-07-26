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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

      <form action={action} style={{ display: "grid", gap: 14, marginTop: 16 }}>
        {nContatos > 0 && (
          <label style={{ fontSize: 13, opacity: 0.85 }}>
            Transferir contatos para
            <select
              name="new_owner"
              defaultValue=""
              required
              style={{
                display: "block",
                width: "100%",
                padding: "9px 11px",
                marginTop: 5,
                border: "1px solid rgba(128,128,128,0.4)",
                borderRadius: 8,
                background: "transparent",
                color: "inherit",
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
