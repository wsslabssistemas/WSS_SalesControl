-- =====================================================================
-- COS — MIGRATION 0031 : MÓDULO CURSO (estrutura)
--
-- O curso é CONTEÚDO, como a biblioteca: mora em migration numerada, não
-- em código. Trocar uma lição não pode exigir deploy.
--
-- DESENHO CENTRAL — a teoria é uma só, o exemplo é do ramo:
--   `course_lessons` NÃO tem segmento. A lição sobre pergunta de implicação
--   é a mesma para barbearia e indústria; o EXEMPLO é buscado da
--   `knowledge_entries` do segmento da empresa na hora de renderizar, e o
--   EXERCÍCIO usa o DNA dela. Sem isso seriam 9 versões de cada lição para
--   manter — e nove verdades para desencontrar.
--
-- POR QUE ISSO IMPORTA COMERCIALMENTE: curso genérico ensina teoria; este
-- ensina a venda da empresa de quem está assistindo. É o ativo (biblioteca
-- + DNA) rendendo de novo, sem duplicar nada.
--
-- Base de evidência das escolhas (ver docs/blueprint/COS_Curso.md):
-- Hattie & Donoghue, 242 estudos — as duas técnicas mais eficazes são
-- prática distribuída e prática de teste. Por isso `course_questions` é
-- parte do modelo, não um extra, e o progresso guarda acerto por questão
-- para permitir repescagem espaçada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. MÓDULOS — as 8 escolas + fechamento. Conteúdo global, sem tenant.
-- ---------------------------------------------------------------------
create table if not exists public.course_modules (
  key         text primary key,
  ord         int  not null,
  title       text not null,
  subtitle    text not null,
  -- Liga o módulo à escola de venda, quando houver. É o que permite ao
  -- módulo puxar exemplos da biblioteca daquela escola no segmento certo.
  school_key  text references public.sales_schools(key),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. LIÇÕES — 5 a 8 minutos cada. Curtas de propósito: microlearning
--    completa 80%+, e 50% da evasão acontece nas duas primeiras semanas.
-- ---------------------------------------------------------------------
create table if not exists public.course_lessons (
  key          text primary key,
  module_key   text not null references public.course_modules(key) on delete cascade,
  ord          int  not null,
  title        text not null,
  minutes      int  not null default 6,
  -- Markdown. O corpo ensina o princípio; o exemplo concreto vem da
  -- biblioteca do segmento em tempo de renderização.
  body         text not null,
  -- A categoria canônica cujo exemplo esta lição usa. NULL = lição sem
  -- exemplo de biblioteca (as de fundamento).
  example_category text,
  -- O que o aluno faz depois de ler. Vazio = só quiz.
  practice     text,
  created_at   timestamptz not null default now()
);

create index if not exists ix_course_lessons_module on public.course_lessons(module_key, ord);

-- ---------------------------------------------------------------------
-- 3. PERGUNTAS — 3 a 5 por lição. NÃO é verificação: é o método.
--    `options` é array de texto; `correct` é o índice (base 0).
--    `explanation` aparece depois de responder — errar com explicação
--    ensina mais que acertar sem.
-- ---------------------------------------------------------------------
create table if not exists public.course_questions (
  id          uuid primary key default gen_random_uuid(),
  lesson_key  text not null references public.course_lessons(key) on delete cascade,
  ord         int  not null,
  question    text not null,
  options     text[] not null,
  correct     int  not null,
  explanation text not null,
  created_at  timestamptz not null default now(),
  constraint course_questions_correct_range
    check (correct >= 0 and correct < array_length(options, 1)),
  constraint course_questions_min_options
    check (array_length(options, 1) between 2 and 5)
);

create index if not exists ix_course_questions_lesson on public.course_questions(lesson_key, ord);

-- ---------------------------------------------------------------------
-- 4. PROGRESSO — dado DA EMPRESA e DA PESSOA. Aqui entra tenant_id e RLS.
--
-- Guarda acerto por questão (jsonb) porque a repescagem espaçada precisa
-- saber O QUE a pessoa errou, não só quanto acertou. Sem isso o segundo
-- achado da meta-análise fica de fora.
-- ---------------------------------------------------------------------
create table if not exists public.course_progress (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null,
  lesson_key   text not null references public.course_lessons(key) on delete cascade,
  completed_at timestamptz,
  -- {"<question_id>": true|false} — acerto por questão, para a repescagem.
  answers      jsonb not null default '{}'::jsonb,
  score        int,
  updated_at   timestamptz not null default now(),
  unique (tenant_id, user_id, lesson_key)
);

create index if not exists ix_course_progress_tenant on public.course_progress(tenant_id, user_id);

-- ---------------------------------------------------------------------
-- 5. RLS
--
-- Conteúdo do curso (módulos, lições, perguntas): é PRODUTO VENDIDO. Fica
-- com `service_role`, como a biblioteca curada — o app entrega server-side
-- para quem tem o módulo liberado. Se ficasse legível por `authenticated`,
-- qualquer teste grátis baixaria o curso inteiro pelo PostgREST, que foi
-- exatamente o P0 corrigido no 0006.
--
-- Progresso: dado do tenant, com a regra normal de isolamento.
-- ---------------------------------------------------------------------
alter table public.course_modules   enable row level security;
alter table public.course_lessons   enable row level security;
alter table public.course_questions enable row level security;
alter table public.course_progress  enable row level security;

drop policy if exists course_modules_service on public.course_modules;
create policy course_modules_service on public.course_modules
  for all to service_role using (true) with check (true);

drop policy if exists course_lessons_service on public.course_lessons;
create policy course_lessons_service on public.course_lessons
  for all to service_role using (true) with check (true);

drop policy if exists course_questions_service on public.course_questions;
create policy course_questions_service on public.course_questions
  for all to service_role using (true) with check (true);

-- Progresso: a pessoa lê e escreve o próprio, dentro da própria empresa.
drop policy if exists course_progress_own on public.course_progress;
create policy course_progress_own on public.course_progress
  for all to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = course_progress.tenant_id and m.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = course_progress.tenant_id and m.user_id = auth.uid()
    )
  );

drop policy if exists course_progress_service on public.course_progress;
create policy course_progress_service on public.course_progress
  for all to service_role using (true) with check (true);

comment on table public.course_lessons is
  'Lições do curso. Sem segmento de propósito: a teoria é uma só, o exemplo vem da biblioteca do segmento da empresa.';
comment on table public.course_progress is
  'Progresso por pessoa e empresa. `answers` guarda acerto por questão para permitir repescagem espaçada.';
