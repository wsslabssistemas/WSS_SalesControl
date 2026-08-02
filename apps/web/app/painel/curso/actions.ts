"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { agendar } from "@/lib/repescagem";
import { revalidatePath } from "next/cache";

export type ResultadoQuiz =
  | { ok: true; acertos: number; total: number; score: number }
  | { ok: false; error: string };

export type ResultadoPergunta =
  | { ok: true; certa: boolean; explicacao: string }
  | { ok: false; error: string };

/**
 * Corrige UMA pergunta e devolve a explicação.
 *
 * É o coração do método: a explicação aparece logo depois de responder,
 * inclusive quando erra — errar com explicação ensina mais do que acertar sem.
 * E a correção é aqui, no servidor, porque mandar o gabarito para o browser
 * transformaria a prática de recuperação em jogo de adivinhar no inspetor.
 */
export async function responderPergunta(
  questionId: string,
  escolha: number,
): Promise<ResultadoPergunta> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("curso")) return { ok: false, error: "Curso não liberado para esta empresa." };

  const admin = createAdminClient();
  const { data } = await admin
    .from("course_questions")
    .select("correct, explanation")
    .eq("id", questionId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Pergunta não encontrada." };

  const q = data as { correct: number; explanation: string };
  return { ok: true, certa: escolha === q.correct, explicacao: q.explanation };
}

/**
 * Registra a lição concluída e a nota.
 *
 * A CORREÇÃO ACONTECE NO SERVIDOR. As respostas certas nunca vão para o
 * browser: se fossem, bastaria abrir o inspetor para ver o gabarito, e o quiz
 * deixaria de ser prática de recuperação — que é o método do curso, não um
 * enfeite. Por isso a tela manda só o que a pessoa escolheu.
 */
export async function concluirLicao(
  lessonKey: string,
  escolhas: Record<string, number>,
): Promise<ResultadoQuiz> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("curso")) return { ok: false, error: "Curso não liberado para esta empresa." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { ok: false, error: "Sessão expirada." };

  // Gabarito com service_role: o conteúdo do curso é produto vendido e não é
  // legível pelo papel `authenticated` (mesma regra da biblioteca curada).
  const admin = createAdminClient();
  const { data: perguntas } = await admin
    .from("course_questions")
    .select("id, correct")
    .eq("lesson_key", lessonKey);

  const lista = (perguntas as { id: string; correct: number }[] | null) ?? [];
  if (!lista.length) return { ok: false, error: "Lição sem perguntas." };

  const respostas: Record<string, boolean> = {};
  let acertos = 0;
  for (const q of lista) {
    const acertou = escolhas[q.id] === q.correct;
    respostas[q.id] = acertou;
    if (acertou) acertos++;
  }
  const score = Math.round((acertos / lista.length) * 100);

  // `answers` guarda acerto POR QUESTÃO — é o que permite a repescagem
  // espaçada trazer de volta só o que a pessoa errou.
  const { error } = await supabase.from("course_progress").upsert(
    {
      tenant_id: tenant.id,
      user_id: userId,
      lesson_key: lessonKey,
      completed_at: new Date().toISOString(),
      answers: respostas,
      score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,user_id,lesson_key" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/painel/curso");
  return { ok: true, acertos, total: lista.length, score };
}

/**
 * Guarda o exercício de fim de módulo.
 *
 * Não corrige e não dá nota — resposta aberta não tem gabarito, e nota
 * inventada contradiz a tese do curso (ver o cabeçalho do `0038`). O que se
 * guarda é o que a pessoa escreveu e o que ela marcou em si mesma, para poder
 * comparar quando refizer.
 */
export async function salvarExercicio(
  moduleKey: string,
  situacao: string,
  resposta: string,
  autoavaliacao: Record<string, boolean>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("curso")) return { ok: false, error: "Curso não liberado para esta empresa." };

  const texto = (resposta ?? "").trim();
  if (texto.length < 20) return { ok: false, error: "Escreva a sua resposta antes de ver a recomendação." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { ok: false, error: "Sessão expirada." };

  const { error } = await supabase.from("course_exercise").insert({
    tenant_id: tenant.id,
    user_id: userId,
    module_key: moduleKey,
    situacao,
    resposta: texto,
    autoavaliacao,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/painel/curso");
  return { ok: true };
}

/**
 * Responde UMA pergunta de repescagem e reagenda a próxima aparição.
 *
 * Separada de `responderPergunta` porque faz uma coisa a mais e não pode fazer
 * uma que aquela faz: não toca em `course_progress`. Gravar acerto de
 * repescagem junto com a nota da lição inflaria a nota de uma prova que a
 * pessoa não refez — o número deixaria de significar o que diz significar.
 */
export async function responderRepescagem(
  questionId: string,
  escolha: number,
): Promise<ResultadoPergunta> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("curso")) return { ok: false, error: "Curso não liberado para esta empresa." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return { ok: false, error: "Sessão expirada." };

  const admin = createAdminClient();
  const { data } = await admin
    .from("course_questions")
    .select("correct, explanation")
    .eq("id", questionId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Pergunta não encontrada." };

  const q = data as { correct: number; explanation: string };
  const certa = escolha === q.correct;

  // O streak vem do banco, não do browser: quem controla o intervalo é o
  // servidor, senão bastaria mandar um número alto para nunca mais rever nada.
  const { data: atual } = await supabase
    .from("course_review")
    .select("streak")
    .eq("tenant_id", tenant.id)
    .eq("question_id", questionId)
    .maybeSingle();

  const agora = new Date();
  const { streak, due_at } = agendar((atual as { streak: number } | null)?.streak ?? 0, certa, agora);

  const { error } = await supabase.from("course_review").upsert(
    {
      tenant_id: tenant.id,
      user_id: userId,
      question_id: questionId,
      streak,
      due_at,
      last_seen_at: agora.toISOString(),
    },
    { onConflict: "tenant_id,user_id,question_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/painel/curso");
  return { ok: true, certa, explicacao: q.explanation };
}
