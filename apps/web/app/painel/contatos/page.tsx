import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { displayPhone } from "@/lib/phone";

const PAGE_SIZE = 20;

type Contact = {
  owner_id: string | null;
  id: string;
  name: string;
  phone: string | null;
  journey_stage: string;
  source: string | null;
};

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; etapa?: string; resp?: string; page?: string; importados?: string; dup?: string; sem?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const etapa = sp.etapa ?? "";
  const resp = sp.resp ?? "";
  const pageNum = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1>Contatos</h1>
        <p className="text-dim">Sem empresa vinculada.</p>
      </main>
    );
  }

  const { stages } = await getSkillFormConfig(tenant.skill_key);
  const from = (pageNum - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // Carteira por profissional: cada vendedor/barbeiro tem os seus clientes.
  const { data: membrosData } = await supabase
    .from("memberships")
    .select("id, user:profiles(full_name, email)")
    .eq("tenant_id", tenant.id)
    .eq("status", "active");
  const membros = ((membrosData as { id: string; user: { full_name: string | null; email: string | null } | null }[] | null) ?? [])
    .map((m) => ({ id: m.id, nome: m.user?.full_name ?? m.user?.email ?? "—" }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  let query = supabase
    .from("contacts")
    .select("id, name, phone, journey_stage, source, owner_id", { count: "exact" })
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null);

  const term = q.replace(/[,()%*]/g, "").trim();
  if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  if (etapa) query = query.eq("journey_stage", etapa);
  if (resp) query = query.eq("owner_id", resp);

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const contacts = (data as Contact[] | null) ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const stageLabel = (key: string) =>
    stages.find((s) => s.key === key)?.label ?? key;

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (etapa) p.set("etapa", etapa);
    if (resp) p.set("resp", resp);
    if (n > 1) p.set("page", String(n));
    const s = p.toString();
    return s ? `?${s}` : "?";
  };

  const imported = sp.importados ? parseInt(sp.importados, 10) || 0 : null;

  return (
    <main>
      <div className="between">
        <h1>
          Contatos <span className="text-faint" style={{ fontSize: 15, fontWeight: 400 }}>({total})</span>
        </h1>
        <div className="row" style={{ gap: 8 }}>
          <a href="/painel/contatos/export" className="btn btn-sm btn-ghost">Exportar</a>
          <Link href="/painel/contatos/importar" className="btn btn-sm btn-ghost">Importar</Link>
          <Link href="/painel/contatos/novo" className="btn btn-sm btn-primary">+ Novo contato</Link>
        </div>
      </div>

      {imported !== null && (
        <p className="badge badge-success mt-16">
          {imported} importado{imported === 1 ? "" : "s"}
          {sp.dup && Number(sp.dup) > 0 ? ` · ${sp.dup} duplicado(s) ignorado(s)` : ""}
          {sp.sem && Number(sp.sem) > 0 ? ` · ${sp.sem} sem nome` : ""}
        </p>
      )}

      {/* Busca + filtro (GET: server-side, sem JS) */}
      <form method="get" className="row wrap mt-16" style={{ gap: 8 }}>
        <input name="q" defaultValue={q} placeholder="Buscar por nome ou telefone" className="grow" style={{ minWidth: 180 }} />
        <select name="etapa" defaultValue={etapa} style={{ width: "auto" }}>
          <option value="">Todas as etapas</option>
          {stages.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        {membros.length > 1 && (
          <select name="resp" defaultValue={resp} style={{ width: "auto" }} title="Carteira de cada profissional">
            <option value="">Todos os profissionais</option>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        )}
        <button type="submit" className="btn">Buscar</button>
      </form>

      {contacts.length === 0 ? (
        <div className="card mt-24">
          <p className="text-dim" style={{ margin: 0 }}>
            {term || etapa
              ? "Nenhum contato para esse filtro."
              : "Nenhum contato ainda. Adicione um lead ou importe uma planilha."}
          </p>
        </div>
      ) : (
        <div className="card mt-16" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Etapa</th>
                {membros.length > 1 && <th>Responsável</th>}
                <th>Origem</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/painel/contatos/${c.id}`}>{c.name}</Link></td>
                  <td>{displayPhone(c.phone)}</td>
                  <td><span className="badge">{stageLabel(c.journey_stage)}</span></td>
                  {membros.length > 1 && (
                    <td className="text-dim">{membros.find((m) => m.id === c.owner_id)?.nome ?? "—"}</td>
                  )}
                  <td className="text-dim">{c.source ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="row mt-24" style={{ gap: 14, fontSize: 14 }}>
          {pageNum > 1 ? (
            <Link href={pageHref(pageNum - 1)}>← Anterior</Link>
          ) : (
            <span className="text-faint">← Anterior</span>
          )}
          <span className="text-dim">Página {pageNum} de {totalPages}</span>
          {pageNum < totalPages ? (
            <Link href={pageHref(pageNum + 1)}>Próxima →</Link>
          ) : (
            <span className="text-faint">Próxima →</span>
          )}
        </div>
      )}
    </main>
  );
}
