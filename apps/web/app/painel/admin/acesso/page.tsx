import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/platform";
import { MODULES, computeEntitlements, type ModuleKey } from "@/lib/entitlements";
import { startTrial, endTrial, toggleModule } from "./actions";

export const metadata = { title: "Acesso e planos" };

type Tenant = { id: string; name: string; slug: string; skill_key: string; settings: Record<string, unknown> | null };

export default async function AcessoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isPlatformAdmin(user?.email)) {
    return (<main><h1>Acesso e planos</h1><p className="text-dim">Restrito à WSS Labs.</p></main>);
  }

  const admin = createAdminClient();
  const [{ data: tenantsData }, { data: skillsData }] = await Promise.all([
    admin.from("tenants").select("id, name, slug, skill_key, settings"),
    admin.from("skills").select("key, manifest"),
  ]);
  const tenants = (tenantsData as Tenant[] | null) ?? [];
  const skills = (skillsData as { key: string; manifest: { capabilities?: string[] } | null }[] | null) ?? [];
  const capsOf = (skillKey: string) => skills.find((s) => s.key === skillKey)?.manifest?.capabilities ?? [];

  const moduleKeys = Object.keys(MODULES) as ModuleKey[];

  return (
    <main>
      <div className="between">
        <h1>Acesso e planos</h1>
        <Link href="/painel/admin" className="btn btn-sm btn-ghost">← Fabricante</Link>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Teste grátis e módulos por empresa. Durante o teste, tudo liberado; ao fim,
        só o que foi comprado. Cada empresa vê no menu apenas o que faz sentido pra ela.
      </p>

      <div className="stack mt-24" style={{ gap: 16 }}>
        {tenants.map((t) => {
          const ent = computeEntitlements(capsOf(t.skill_key), t.settings);
          return (
            <div key={t.id} className="card">
              <div className="between" style={{ alignItems: "baseline" }}>
                <div>
                  <strong>{t.name}</strong>
                  <span className="text-faint" style={{ fontSize: 12 }}> · {t.slug} · {t.skill_key}</span>
                </div>
                {ent.trialActive ? (
                  <span className="badge badge-success">Teste: {ent.trialDaysLeft}d</span>
                ) : (
                  <span className="badge">Sem teste ativo</span>
                )}
              </div>

              <div className="row wrap mt-16" style={{ gap: 8, alignItems: "center" }}>
                <form action={startTrial} className="row" style={{ gap: 6 }}>
                  <input type="hidden" name="tenant_id" value={t.id} />
                  <select name="days" defaultValue="14" style={{ width: "auto", padding: "5px 8px", fontSize: 13 }}>
                    <option value="7">7 dias</option>
                    <option value="14">14 dias</option>
                    <option value="30">30 dias</option>
                  </select>
                  <button type="submit" className="btn btn-sm btn-ghost">Iniciar teste</button>
                </form>
                {ent.trialActive && (
                  <form action={endTrial}>
                    <input type="hidden" name="tenant_id" value={t.id} />
                    <button type="submit" className="btn btn-sm btn-ghost">Encerrar teste</button>
                  </form>
                )}
              </div>

              <div className="mt-16">
                <p className="eyebrow" style={{ marginBottom: 8 }}>Módulos (add-ons)</p>
                <div className="row wrap" style={{ gap: 8 }}>
                  {moduleKeys.map((m) => {
                    const purchased = ((t.settings?.entitlements as Record<string, boolean> | undefined) ?? {})[m] === true;
                    return (
                      <form key={m} action={toggleModule}>
                        <input type="hidden" name="tenant_id" value={t.id} />
                        <input type="hidden" name="module" value={m} />
                        <input type="hidden" name="enable" value={purchased ? "0" : "1"} />
                        <button type="submit" className={purchased ? "btn btn-sm btn-primary" : "btn btn-sm btn-ghost"} title={MODULES[m].hint}>
                          {purchased ? "✓ " : "+ "}{MODULES[m].label}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
