-- =====================================================================
-- COS — MIGRATION 0041 : RECARREGAR O CURSO NÃO PODE APAGAR O PROGRESSO
--
-- SINTOMA (relatado pelo fundador, ago/2026): ele respondia as perguntas
-- do Módulo 1 e o check verde não aparecia na grade.
--
-- CAUSA: nada a ver com a tela. `seed-curso.mjs` recarregava apagando as
-- lições e as perguntas antes de reinserir, e o schema tem duas cascatas
-- que ninguém olhou junto:
--
--   course_progress.lesson_key  → course_lessons(key)  ON DELETE CASCADE
--   course_review.question_id   → course_questions(id) ON DELETE CASCADE
--
-- Então cada recarga de conteúdo levava junto o progresso da pessoa e o
-- agendamento da repescagem. Naquele dia eu recarreguei os seeds várias
-- vezes — reposicionando alternativas, consertando explicações — e apaguei
-- o progresso dele em cada uma. O check sumia porque o registro sumia.
--
-- Pior: as perguntas eram recriadas com `id` NOVO a cada carga. Mesmo que
-- o progresso sobrevivesse, `course_progress.answers` (que é indexado por
-- id de pergunta) passaria a apontar para ids mortos, e a repescagem
-- perderia o que a pessoa errou. Falha silenciosa: nada quebra, só some.
--
-- CORREÇÃO, EM DUAS PARTES:
--   1. Aqui: dar às perguntas uma IDENTIDADE ESTÁVEL — `(lesson_key, ord)`
--      é o que uma pergunta É ("a 2ª pergunta da lição m1_l3"), e o `id`
--      uuid passa a ser só a chave técnica, preservada entre recargas.
--   2. No carregador: lição e pergunta passam a ser UPSERT em vez de
--      DELETE + INSERT.
--
-- A regra geral, que já custou o curso inteiro uma vez e agora custou o
-- progresso: **conteúdo e progresso vivem em tabelas diferentes de
-- propósito; recarregar conteúdo nunca pode alcançar o progresso.**
-- =====================================================================

-- Duplicata impede a restrição. Não deve existir nenhuma — mas conferir é
-- barato e o susto de descobrir depois, não.
delete from public.course_questions a
 using public.course_questions b
 where a.lesson_key = b.lesson_key
   and a.ord = b.ord
   and a.ctid > b.ctid;

alter table public.course_questions
  drop constraint if exists course_questions_lesson_ord_key;

alter table public.course_questions
  add constraint course_questions_lesson_ord_key unique (lesson_key, ord);

comment on constraint course_questions_lesson_ord_key on public.course_questions is
  'Identidade estável da pergunta. Permite recarregar o conteúdo com UPSERT, preservando o `id` — e com ele o progresso da pessoa e o agendamento da repescagem.';
