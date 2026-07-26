"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { normalizePhone } from "@/lib/phone";
import { parseCsv, detectColumns } from "@/lib/csv";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function importContacts(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/painel/contatos/importar?erro=Escolha+um+arquivo+CSV");
  }
  const origem = String(formData.get("origem") ?? "").trim() || "Importação";

  const text = await (file as File).text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    redirect("/painel/contatos/importar?erro=Arquivo+vazio");
  }

  const { nameIdx, phoneIdx, hasHeader } = detectColumns(rows[0]);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const supabase = await createClient();

  // Etapa de entrada = primeira não-terminal do manifesto.
  const { stages } = await getSkillFormConfig(tenant.skill_key);
  const initialStage = stages.find((s) => !s.terminal)?.key ?? stages[0]?.key ?? "contato";

  // Telefones já existentes (para ignorar duplicados sem depender só do índice).
  const { data: existing } = await supabase
    .from("contacts")
    .select("phone")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null)
    .not("phone", "is", null);
  const known = new Set(
    ((existing as { phone: string | null }[] | null) ?? [])
      .map((e) => e.phone)
      .filter(Boolean) as string[],
  );

  const seen = new Set<string>();
  const toInsert: Record<string, unknown>[] = [];
  let dup = 0;
  let semNome = 0;

  for (const r of dataRows) {
    const name = (r[nameIdx] ?? "").trim();
    if (!name) { semNome++; continue; }
    const phone = normalizePhone(r[phoneIdx] ?? "");
    if (phone && (known.has(phone) || seen.has(phone))) { dup++; continue; }
    if (phone) seen.add(phone);
    toInsert.push({
      tenant_id: tenant.id,
      owner_id: membership!.membershipId,
      name,
      phone,
      source: origem,
      journey_stage: initialStage,
    });
  }

  let importados = 0;
  // Insere em lotes; se um lote colidir no índice único, tenta linha a linha.
  for (let i = 0; i < toInsert.length; i += 200) {
    const chunk = toInsert.slice(i, i + 200);
    const { error } = await supabase.from("contacts").insert(chunk);
    if (!error) {
      importados += chunk.length;
    } else {
      for (const row of chunk) {
        const { error: e2 } = await supabase.from("contacts").insert(row);
        if (!e2) importados++;
        else dup++;
      }
    }
  }

  revalidatePath("/painel/contatos");
  redirect(`/painel/contatos?importados=${importados}&dup=${dup}&sem=${semNome}`);
}
