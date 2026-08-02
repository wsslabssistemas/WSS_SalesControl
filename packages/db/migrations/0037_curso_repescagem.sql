-- =====================================================================
-- COS — MIGRATION 0037 : REPESCAGEM ESPAÇADA
--
-- O segundo achado da meta-análise de Hattie & Donoghue (242 estudos):
-- depois da prática de teste vem a PRÁTICA DISTRIBUÍDA. Quiz que morre no
-- fim da lição usa metade do método.
--
-- POR QUE UMA TABELA NOVA, se o `0031` já guarda acerto por questão.
-- `course_progress.answers` responde "o que a pessoa errou NAQUELA lição"
-- — e é por isso que a repescagem sabe por onde começar. O que ele não
-- guarda é o AGENDAMENTO: quando a questão volta, e quantas vezes seguidas
-- ela já foi acertada fora do contexto da lição. Dois motivos para não
-- forçar isso lá dentro:
--   • `answers` é reescrito toda vez que a pessoa refaz a lição, e a nota
--     é calculada a partir dele — gravar acerto de repescagem ali
--     falsificaria a nota da lição;
--   • o intervalo é por QUESTÃO, não por lição. São chaves diferentes.
--
-- Espaçar é o produto aqui. Guardar no lugar errado desligaria o
-- espaçamento sem ninguém perceber — o pior tipo de falha, porque a tela
-- continuaria mostrando perguntas.
-- =====================================================================

create table if not exists public.course_review (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null,
  question_id  uuid not null references public.course_questions(id) on delete cascade,
  -- Acertos SEGUIDOS na repescagem. Errar zera: o intervalo volta ao
  -- começo, que é o comportamento de toda curva de esquecimento.
  streak       int  not null default 0,
  last_seen_at timestamptz not null default now(),
  -- Quando a questão volta a aparecer. É a única coluna que a seleção lê.
  due_at       timestamptz not null,
  unique (tenant_id, user_id, question_id)
);

-- A consulta da tela é sempre "o que venceu para esta pessoa": o índice
-- cobre exatamente ela.
create index if not exists ix_course_review_due
  on public.course_review(tenant_id, user_id, due_at);

-- ---------------------------------------------------------------------
-- RLS — dado da pessoa, dentro da empresa dela. Mesma forma do progresso.
--
-- `(select auth.uid())` e não `auth.uid()` cru: sem o `select`, o Postgres
-- reavalia a função POR LINHA. Com 40 questões ninguém nota; a armadilha
-- já está registrada no ESTADO_DO_PROJETO e não vale repetir de novo.
-- ---------------------------------------------------------------------
alter table public.course_review enable row level security;

drop policy if exists course_review_own on public.course_review;
create policy course_review_own on public.course_review
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = course_review.tenant_id and m.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = course_review.tenant_id and m.user_id = (select auth.uid())
    )
  );

drop policy if exists course_review_service on public.course_review;
create policy course_review_service on public.course_review
  for all to service_role using (true) with check (true);

-- ---------------------------------------------------------------------
-- De passagem: a policy de `course_progress` do 0031 usa `auth.uid()` cru,
-- escrita antes de a regra existir. É a mesma consulta que roda a cada
-- lição aberta — corrigir aqui custa nada e evita que a próxima tabela
-- copie o modelo errado do vizinho.
-- ---------------------------------------------------------------------
drop policy if exists course_progress_own on public.course_progress;
create policy course_progress_own on public.course_progress
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = course_progress.tenant_id and m.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = course_progress.tenant_id and m.user_id = (select auth.uid())
    )
  );

comment on table public.course_review is
  'Agendamento da repescagem espaçada, por questão e por pessoa. `course_progress.answers` diz o que ela errou; esta tabela diz quando aquilo volta.';
