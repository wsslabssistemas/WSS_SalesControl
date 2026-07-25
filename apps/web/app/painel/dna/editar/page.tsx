import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { DnaEditor } from "../DnaEditor";

type FieldDef = {
  key: string;
  type: string;
  columns?: string[];
  options?: string[];
  required?: boolean;
};
type SectionDef = {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
  fields?: FieldDef[];
};

export default async function EditarDnaPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;

  if (!tenant) {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Editar DNA</h1>
        <p style={{ opacity: 0.85 }}>Sem empresa vinculada.</p>
      </main>
    );
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    return (
      <main>
        <h1 style={{ fontSize: 24, marginTop: 0 }}>Editar DNA</h1>
        <p style={{ opacity: 0.85 }}>
          Só um administrador da empresa pode editar o DNA.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: skill } = await supabase
    .from("skills")
    .select("manifest")
    .eq("key", tenant.skill_key)
    .limit(1)
    .maybeSingle();
  const { data: dna } = await supabase
    .from("commercial_dna")
    .select("sections")
    .eq("tenant_id", tenant.id)
    .eq("is_current", true)
    .maybeSingle();

  const sections =
    (skill?.manifest as { dna_sections?: SectionDef[] } | null)?.dna_sections ??
    [];
  const initial = (dna?.sections as Record<string, unknown> | null) ?? {};

  return (
    <main style={{ maxWidth: 640 }}>
      <Link href="/painel/dna" style={{ fontSize: 13, opacity: 0.7 }}>
        ← DNA
      </Link>
      <h1 style={{ fontSize: 24, margin: "8px 0 0" }}>Editar DNA</h1>
      <p style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>
        Cada alteração cria uma nova versão; a anterior é preservada.
      </p>
      <DnaEditor sections={sections} initial={initial} />
    </main>
  );
}
