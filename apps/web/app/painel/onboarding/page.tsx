import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import OnboardingWizard from "./OnboardingWizard";
import EscolherSegmento from "./EscolherSegmento";
import { listSegments, countContacts } from "./segmento-actions";

export const metadata = { title: "Onboarding" };

type FieldDef = { key: string; label?: string; type: string; columns?: string[]; options?: string[]; required?: boolean };
type SectionDef = { key: string; label: string; required?: boolean; type?: string; fields?: FieldDef[] };

export default async function OnboardingPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Onboarding</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    return (
      <main>
        <h1>Onboarding</h1>
        <p className="text-dim">Só um administrador da empresa faz o onboarding.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: skill }, { data: dna }, { data: t }] = await Promise.all([
    supabase.from("skills").select("manifest").eq("key", tenant.skill_key).maybeSingle(),
    supabase.from("commercial_dna").select("sections").eq("tenant_id", tenant.id).eq("is_current", true).maybeSingle(),
    supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle(),
  ]);

  const [segments, contatos] = await Promise.all([listSegments(), countContacts()]);
  const sections = (skill?.manifest as { dna_sections?: SectionDef[] } | null)?.dna_sections ?? [];
  const initial = (dna?.sections as Record<string, unknown> | null) ?? {};
  const settings = (t?.settings as Record<string, unknown> | null) ?? {};
  const posture = typeof settings.posture === "string" ? settings.posture : "";

  return (
    <main style={{ maxWidth: 620 }}>
      <Link href="/painel" className="text-dim" style={{ fontSize: 13 }}>← Início</Link>
      <h1 className="mt-8">Vamos calibrar seu Kairós</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Poucas perguntas para o sistema conhecer sua empresa e responder com os
        seus fatos. Leva alguns minutos e você pode ajustar depois.
      </p>
      {/* Passo 1: o ramo. Ele define TODO o resto — vocabulário, jornada,
          campos, seções de DNA e quais abas aparecem. */}
      <section className="mt-24">
        <div className="between" style={{ alignItems: "baseline" }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>1. Qual é o seu ramo?</h2>
          <span className="text-faint" style={{ fontSize: 12 }}>define todo o painel</span>
        </div>
        <p className="text-dim" style={{ marginTop: 4, fontSize: 14 }}>
          O sistema se adapta ao seu negócio: muda o jeito de chamar as coisas, as
          etapas da venda, as perguntas do cadastro e as ferramentas disponíveis.
        </p>
        <div className="mt-16">
          <EscolherSegmento segments={segments} atual={tenant.skill_key} contatos={contatos} />
        </div>
      </section>

      <section className="mt-24" style={{ borderTop: "1px solid var(--border)", paddingTop: 24 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>2. Conte sobre a empresa</h2>
        <p className="text-dim" style={{ marginTop: 0, fontSize: 14 }}>
          As perguntas abaixo são as do seu ramo — mudam se você trocar o segmento acima.
        </p>
        <OnboardingWizard
          sections={sections}
          initial={initial}
          tenantName={tenant.name}
          initialPosture={posture}
        />
      </section>
    </main>
  );
}
