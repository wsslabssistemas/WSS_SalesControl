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
import { escolherRepescagem, type Candidato } from "./repescagem";

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

// ---------------------------------------------------------------------
// REPESCAGEM ESPAÇADA
//
// A segunda metade do método: prática de teste morre no fim da lição se as
// perguntas não voltarem espaçadas. A REGRA de quando cada uma volta é pura e
// mora em `lib/repescagem.ts`, testada sem banco; aqui fica só o que ela não
// pode fazer sozinha — juntar progresso, gabarito e agendamento.
// ---------------------------------------------------------------------

export type PerguntaRepescagem = {
  id: string;
  question: string;
  options: string[];
  licao: string;
  modulo: string;
};

/**
 * A sessão de hoje: até 5 perguntas de lições JÁ CONCLUÍDAS.
 *
 * Só entra lição concluída de propósito — repescar o que a pessoa ainda não
 * estudou não é espaçamento, é pegadinha.
 */
export async function carregarRepescagem(tenantId: string): Promise<PerguntaRepescagem[]> {
  // Sem filtro por pessoa nas consultas: a RLS de `course_progress` e de
  // `course_review` já entrega só as linhas de quem está logado. Repetir o
  // `user_id` aqui daria a impressão de que o isolamento é da aplicação.
  const supabase = await createClient();

  const [{ data: progresso }, { data: revisoes }] = await Promise.all([
    supabase
      .from("course_progress")
      .select("lesson_key, completed_at, answers")
      .eq("tenant_id", tenantId)
      .not("completed_at", "is", null),
    supabase.from("course_review").select("question_id, streak, due_at").eq("tenant_id", tenantId),
  ]);

  const feitas = (progresso as { lesson_key: string; completed_at: string; answers: Record<string, boolean> }[] | null) ?? [];
  if (!feitas.length) return [];

  const agendado = new Map(
    ((revisoes as { question_id: string; streak: number; due_at: string }[] | null) ?? []).map((r) => [
      r.question_id,
      r,
    ]),
  );

  // Gabarito e ordem do curso: conteúdo vendido, então `service_role`.
  const admin = createAdminClient();
  const chaves = feitas.map((p) => p.lesson_key);
  const [{ data: perguntas }, { data: licoes }, { data: modulos }] = await Promise.all([
    admin.from("course_questions").select("id, lesson_key, question, options").in("lesson_key", chaves),
    admin.from("course_lessons").select("key, module_key, ord, title").in("key", chaves),
    admin.from("course_modules").select("key, ord, title"),
  ]);

  const porLicao = new Map(
    ((licoes as { key: string; module_key: string; ord: number; title: string }[] | null) ?? []).map((l) => [l.key, l]),
  );
  const porModulo = new Map(
    ((modulos as { key: string; ord: number; title: string }[] | null) ?? []).map((m) => [m.key, m]),
  );
  const conclusao = new Map(feitas.map((p) => [p.lesson_key, p]));

  const candidatos: Candidato[] = [];
  const visiveis = new Map<string, PerguntaRepescagem>();

  for (const q of ((perguntas as { id: string; lesson_key: string; question: string; options: string[] }[] | null) ?? [])) {
    const licao = porLicao.get(q.lesson_key);
    const p = conclusao.get(q.lesson_key);
    if (!licao || !p) continue;
    const modulo = porModulo.get(licao.module_key);
    const rev = agendado.get(q.id);

    candidatos.push({
      question_id: q.id,
      lesson_key: q.lesson_key,
      ordem: (modulo?.ord ?? 0) * 100 + licao.ord,
      errou_na_licao: p.answers?.[q.id] === false,
      concluida_em: p.completed_at,
      due_at: rev?.due_at ?? null,
      streak: rev?.streak ?? 0,
    });
    visiveis.set(q.id, {
      id: q.id,
      question: q.question,
      options: q.options,
      licao: licao.title,
      modulo: modulo?.title ?? "",
    });
  }

  return escolherRepescagem(candidatos, new Date())
    .map((c) => visiveis.get(c.question_id))
    .filter((q): q is PerguntaRepescagem => !!q);
}

// O renderizador de markdown mora em `lib/markdown.ts` — lógica pura, sem
// imports, para poder ser testada em Node puro. Reexportado aqui para as telas
// continuarem importando de um lugar só.
export { paraBlocos, pedacos, type Bloco } from "./markdown";
