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
import { montarExercicio, type Exercicio, type EntradaDaBiblioteca } from "./exercicio";
import { temFato } from "./facts";

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
  // paginacao-ok: a policy `course_progress_own` (0037) filtra por
  // `user_id = auth.uid()`, e a chave é (tenant, user, LIÇÃO). O teto real
  // desta consulta é o número de lições do curso — 45 hoje, 122 se cada
  // pergunta virasse lição. Para passar de 1.000 o curso teria que ter mil
  // aulas, e nesse dia isto aqui não é o primeiro problema.
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

// ---------------------------------------------------------------------
// EXERCÍCIO DE FIM DE MÓDULO — a parte que nenhuma plataforma de curso copia.
//
// A montagem é pura e mora em `lib/exercicio.ts`. Aqui fica só o que ela não
// pode fazer sozinha: buscar a biblioteca do segmento (service_role, porque é
// produto vendido) e o DNA da empresa (client do usuário, para a RLS valer).
// ---------------------------------------------------------------------

export async function carregarExercicio(
  tenantId: string,
  skillKey: string,
  moduleKey: string,
): Promise<Exercicio | null> {
  const admin = createAdminClient();
  const supabase = await createClient();

  const [{ data: modulos }, { data: licoes }, { data: biblioteca }, { data: dna }] = await Promise.all([
    admin.from("course_modules").select("key, ord, school_key").order("ord"),
    admin.from("course_lessons").select("module_key, example_category"),
    admin
      .from("knowledge_entries")
      .select("category, school, trigger_questions, strategy, technique, common_errors, next_objective, required_facts")
      .is("tenant_id", null)
      .eq("skill_key", skillKey)
      .eq("status", "active"),
    supabase
      .from("commercial_dna")
      .select("sections")
      .eq("tenant_id", tenantId)
      .eq("is_current", true)
      .maybeSingle(),
  ]);

  const mods = (modulos as { key: string; ord: number; school_key: string | null }[] | null) ?? [];
  const alvo = mods.find((m) => m.key === moduleKey);
  if (!alvo) return null;

  const entradas = (biblioteca as EntradaDaBiblioteca[] | null) ?? [];
  const sections = (dna?.sections as Record<string, unknown> | null) ?? null;

  // As categorias do módulo saem das próprias lições: `example_category` já
  // declara de qual situação da biblioteca cada aula puxa o exemplo. Criar um
  // campo novo para dizer a mesma coisa seria uma segunda verdade para manter.
  // A ORDEM é por frequência — a categoria que o módulo mais trabalha primeiro.
  const categoriasDe = (key: string) => {
    const conta = new Map<string, number>();
    for (const l of ((licoes as { module_key: string; example_category: string | null }[] | null) ?? [])) {
      if (l.module_key !== key || !l.example_category) continue;
      conta.set(l.example_category, (conta.get(l.example_category) ?? 0) + 1);
    }
    return [...conta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c);
  };

  // MONTA OS MÓDULOS ANTERIORES SÓ PARA SABER O QUE EVITAR.
  //
  // Sem isto, com 20 entradas para 9 módulos o encaixe por categoria colide e o
  // aluno vê a MESMA situação em três módulos — o que ensina que o exercício é
  // enfeite. Custa alguns milissegundos de CPU sobre dados já carregados, e a
  // sequência continua determinística: o módulo 7 sempre evita o mesmo conjunto.
  const usadas: string[] = [];
  for (const m of mods) {
    const ex = montarExercicio(entradas, m.school_key, categoriasDe(m.key), sections, temFato, usadas);
    if (m.key === moduleKey) return ex;
    if (ex) usadas.push(ex.entryRef);
  }
  return null;
}

export type ExercicioFeito = {
  situacao: string;
  resposta: string;
  autoavaliacao: Record<string, boolean>;
  updated_at: string;
};

/** O que a pessoa já escreveu neste módulo (RLS: só o dela). */
export async function carregarExercicioFeito(
  tenantId: string,
  moduleKey: string,
): Promise<ExercicioFeito | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_exercise")
    .select("situacao, resposta, autoavaliacao, updated_at")
    .eq("tenant_id", tenantId)
    .eq("module_key", moduleKey)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ExercicioFeito | null) ?? null;
}

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

  // paginacao-ok: as duas policies (`course_progress_own` e
  // `course_review_own`, 0037) filtram por `user_id = auth.uid()`. Uma linha
  // por LIÇÃO feita (45) e uma por PERGUNTA agendada (122) — os dois tetos são
  // do conteúdo do curso, não da operação, e nenhum deles se aproxima de mil.
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
