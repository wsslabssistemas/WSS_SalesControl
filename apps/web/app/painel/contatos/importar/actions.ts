"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { normalizePhone } from "@/lib/phone";
import { parseCsv, detectColumns, parseDataBR } from "@/lib/csv";
import { lerTudo } from "@/lib/paginado";
import { escolherResponsavel } from "@/lib/carteira";
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

  // ⚠ PARA QUEM VAI A CARTEIRA — e o padrão anterior era um problema calado.
  //
  // Tudo entrava no nome de quem importou. Como quem importa é o fundador, a
  // próxima carga de ex-alunos cairia inteira na carteira dele — e a Fila abre
  // na carteira de quem está logado, então **nenhum dos três recepcionistas
  // veria uma linha sequer** dela.
  //
  // A distribuição é redonda: quem tem a menor carteira recebe o próximo. É a
  // mesma regra do lead que chega sozinho pelo canal (`lib/carteira.ts`), e
  // não é sorteio — sorteio desequilibra com três pessoas, e rodízio precisaria
  // guardar de quem foi a vez.
  const dividir = String(formData.get("dividir") ?? "") === "1";

  const text = await (file as File).text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    redirect("/painel/contatos/importar?erro=Arquivo+vazio");
  }

  const { nameIdx, phoneIdx, hasHeader, nameLabel, phoneLabel, adivinhou, startIdx, endIdx } = detectColumns(rows[0]);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const supabase = await createClient();

  // Etapa de entrada = primeira não-terminal do manifesto.
  const { stages } = await getSkillFormConfig(tenant.skill_key);
  const initialStage = stages.find((s) => !s.terminal)?.key ?? stages[0]?.key ?? "contato";

  // ⚠ PAGINADO, e aqui o corte tinha CONSEQUÊNCIA DE ESCRITA.
  //
  // Este conjunto é o que diz "esse telefone já existe, não importe de novo".
  // Cortado em 1.000, ele conhecia só uma fração da base — e todo contato
  // repetido a partir daí era reapresentado como novo. O índice único do
  // banco segura o estrago, mas segura CAINDO PARA linha a linha e contando o
  // repetido como `dup`: a tela continuava dizendo um número plausível.
  //
  // Com os 9 mil cadastros a caminho, esta era a leitura que ia doer primeiro.
  const existing = await lerTudo<{ phone: string | null }>(
    (de, ate) => supabase
      .from("contacts")
      .select("phone")
      .eq("tenant_id", tenant.id)
      .is("deleted_at", null)
      .not("phone", "is", null)
      .order("id")
      .range(de, ate),
    { rotulo: "telefones ja cadastrados" },
  );
  const known = new Set(existing.map((e) => e.phone).filter(Boolean) as string[]);

  // A equipe que pode receber carteira, e o tamanho da carteira de cada um.
  // Só é consultado quando a divisão foi pedida — importação para si mesmo
  // não precisa saber da equipe.
  const donos: { id: string; carteira: number }[] = [];
  if (dividir) {
    const { data: mems } = await supabase
      .from("memberships")
      .select("id, role")
      .eq("tenant_id", tenant.id)
      .eq("status", "active")
      .order("id");
    const ativos = ((mems as { id: string; role: string }[] | null) ?? []);
    const agentes = ativos.filter((m) => m.role === "agent");
    for (const a of (agentes.length ? agentes : ativos)) {
      // paginacao-ok: só o TAMANHO da carteira, sem trazer linha nenhuma.
      const { count } = await supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("owner_id", a.id)
        .is("deleted_at", null);
      donos.push({ id: a.id, carteira: count ?? 0 });
    }
  }
  /** Quem recebe o próximo. Sem divisão, é quem importou. */
  const proximoDono = (): string => {
    if (!donos.length) return membership!.membershipId;
    // A carteira do escolhido cresce na hora, senão todos os 1.200 iriam para
    // a mesma pessoa — a menor carteira só muda depois de gravar.
    const escolhido = escolherResponsavel(donos, Object.fromEntries(donos.map((d) => [d.id, d.carteira])));
    const alvo = donos.find((d) => d.id === escolhido);
    if (alvo) alvo.carteira++;
    return escolhido ?? membership!.membershipId;
  };

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
      owner_id: proximoDono(),
      name,
      phone,
      source: origem,
      journey_stage: initialStage,
      // Vigência, quando a planilha traz. Data em pt-BR é convertida com
      // cuidado: `new Date("03/08/2026")` no JavaScript é 8 de MARÇO.
      contract_start: startIdx >= 0 ? parseDataBR(r[startIdx] ?? "") : null,
      contract_end: endIdx >= 0 ? parseDataBR(r[endIdx] ?? "") : null,
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
  // Devolve QUAL coluna virou nome e qual virou telefone. Sem isso, uma
  // planilha com cabeçalho fora do vocabulário importa três mil linhas com o
  // campo errado e diz "3.000 importados" — o erro que só aparece quando
  // alguém abre um contato e vê um código no lugar do nome.
  const cols = new URLSearchParams({
    nomeCol: nameLabel, foneCol: phoneLabel,
    chute: [adivinhou.nome ? "nome" : "", adivinhou.telefone ? "telefone" : ""].filter(Boolean).join(","),
  });
  redirect(`/painel/contatos?importados=${importados}&dup=${dup}&sem=${semNome}&${cols}`);
}
