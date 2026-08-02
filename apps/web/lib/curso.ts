// Curso — leitura do conteúdo e do progresso.
//
// O conteúdo (módulos, lições, perguntas) é PRODUTO VENDIDO e fica com
// `service_role`, como a biblioteca curada. Se fosse legível por
// `authenticated`, qualquer teste grátis baixaria o curso inteiro pelo
// PostgREST — foi exatamente o P0 corrigido no 0006. Por isso tudo aqui é
// server-side, e para o browser só vai o que a tela mostra.
//
// O progresso é o contrário: é dado da pessoa, lido e escrito com o client
// do usuário, para a RLS valer.

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type Modulo = {
  key: string;
  ord: number;
  title: string;
  subtitle: string;
  school_key: string | null;
};

export type Licao = {
  key: string;
  module_key: string;
  ord: number;
  title: string;
  minutes: number;
  body: string;
  example_category: string | null;
  practice: string | null;
};

export type Pergunta = {
  id: string;
  ord: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

export type ProgressoLicao = { lesson_key: string; completed_at: string | null; score: number | null };

/** A grade: módulos com as lições que já existem. Módulo sem lição é "em breve". */
export async function carregarGrade(): Promise<{ modulo: Modulo; licoes: Licao[] }[]> {
  const admin = createAdminClient();
  const [{ data: mods }, { data: licoes }] = await Promise.all([
    admin.from("course_modules").select("key, ord, title, subtitle, school_key").order("ord"),
    admin.from("course_lessons").select("key, module_key, ord, title, minutes, body, example_category, practice").order("ord"),
  ]);
  const porModulo = new Map<string, Licao[]>();
  for (const l of (licoes as Licao[] | null) ?? []) {
    if (!porModulo.has(l.module_key)) porModulo.set(l.module_key, []);
    porModulo.get(l.module_key)!.push(l);
  }
  return ((mods as Modulo[] | null) ?? []).map((m) => ({ modulo: m, licoes: porModulo.get(m.key) ?? [] }));
}

export async function carregarLicao(key: string): Promise<{ licao: Licao; modulo: Modulo; perguntas: Pergunta[] } | null> {
  const admin = createAdminClient();
  const { data: licao } = await admin
    .from("course_lessons")
    .select("key, module_key, ord, title, minutes, body, example_category, practice")
    .eq("key", key)
    .maybeSingle();
  if (!licao) return null;

  const [{ data: modulo }, { data: perguntas }] = await Promise.all([
    admin.from("course_modules").select("key, ord, title, subtitle, school_key").eq("key", (licao as Licao).module_key).maybeSingle(),
    admin.from("course_questions").select("id, ord, question, options, correct, explanation").eq("lesson_key", key).order("ord"),
  ]);

  return {
    licao: licao as Licao,
    modulo: modulo as Modulo,
    perguntas: ((perguntas as Pergunta[] | null) ?? []),
  };
}

/**
 * O EXEMPLO DO RAMO — a parte que nenhuma plataforma de curso consegue copiar.
 *
 * A lição é a mesma para todo mundo; o exemplo vem da biblioteca curada do
 * SEGMENTO da empresa. A aula sobre pergunta de impacto mostra "está caro" com
 * o vocabulário de barbearia para a barbearia e de indústria para a indústria,
 * sem que exista uma segunda versão da lição para manter.
 */
export async function exemploDoRamo(
  skillKey: string,
  categoria: string | null,
): Promise<{ gatilhos: string[]; tecnica: string | null; erros: string[] } | null> {
  if (!categoria) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("knowledge_entries")
    .select("trigger_questions, technique, common_errors")
    .is("tenant_id", null)
    .eq("skill_key", skillKey)
    .eq("category", categoria)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const e = data as { trigger_questions: string[] | null; technique: string | null; common_errors: string[] | null };
  return {
    gatilhos: (e.trigger_questions ?? []).slice(0, 4),
    tecnica: e.technique,
    erros: (e.common_errors ?? []).slice(0, 3),
  };
}

/** Progresso da pessoa (RLS: só o dela, dentro da própria empresa). */
export async function carregarProgresso(tenantId: string): Promise<Map<string, ProgressoLicao>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_progress")
    .select("lesson_key, completed_at, score")
    .eq("tenant_id", tenantId);
  return new Map(((data as ProgressoLicao[] | null) ?? []).map((p) => [p.lesson_key, p]));
}

// O renderizador de markdown mora em `lib/markdown.ts` — lógica pura, sem
// imports, para poder ser testada em Node puro. Reexportado aqui para as telas
// continuarem importando de um lugar só.
export { paraBlocos, pedacos, type Bloco } from "./markdown";
