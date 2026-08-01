import { createClient } from "@/lib/supabase/server";

import type { RecurrenceConfig } from "./recurrence";
import type { Cadence } from "./cadence";
import type { SchedulingConfig } from "./scheduling";

export type ContactField = {
  key: string;
  label: string;
  type: string;
  options?: string[];
};
export type Phase = { key: string; label: string; offset_days: number };
export type Stage = {
  key: string;
  label: string;
  terminal?: boolean;
  won?: boolean;
  phases?: Phase[];
  /** Cadência de follow-up que governa esta etapa (chave em `cadences`). */
  cadence?: string;
};

/** Config de formulário vinda do manifesto da Skill (campos são dado, não código). */
export async function getSkillFormConfig(skillKey: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skills")
    .select("manifest")
    .eq("key", skillKey)
    .limit(1)
    .maybeSingle();

  const m =
    (data?.manifest as {
      contact_fields?: ContactField[];
      lead_sources?: string[];
      journey?: { stages?: Stage[] };
      recurrence?: RecurrenceConfig;
      vocabulary?: Record<string, string>;
      cadences?: Cadence[];
      scheduling?: SchedulingConfig;
    } | null) ?? {};

  return {
    fields: m.contact_fields ?? [],
    sources: m.lead_sources ?? [],
    stages: m.journey?.stages ?? [],
    // Segmentos de recompra (barbearia, distribuidora) declaram o ciclo aqui.
    recurrence: m.recurrence ?? null,
    vocabulary: m.vocabulary ?? {},
    // Sequência de toques de follow-up por etapa.
    cadences: m.cadences ?? [],
    // Segmentos com hora marcada declaram duração e passo aqui.
    scheduling: m.scheduling ?? null,
  };
}
