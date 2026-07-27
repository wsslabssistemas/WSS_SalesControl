import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "Onboarding" };

type FieldDef = { key: string; type: string; columns?: string[]; options?: string[]; required?: boolean };
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
      <OnboardingWizard
        sections={sections}
        initial={initial}
        tenantName={tenant.name}
        initialPosture={posture}
      />
    </main>
  );
}
