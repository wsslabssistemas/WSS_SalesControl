-- =====================================================================
-- COS — MIGRATION 0038 : EXERCÍCIO DO CURSO COM O DNA DA EMPRESA
--
-- É a peça descrita em `COS_Curso.md` §6.5 como "a parte que ninguém
-- copia": ao fim de cada módulo, uma mensagem REAL do ramo do aluno, que
-- ele responde com os fatos da própria empresa. Curso genérico ensina
-- teoria; este ensina a venda da empresa de quem está assistindo.
--
-- POR QUE NÃO EXISTE NOTA, NEM CORREÇÃO POR IA.
--
-- Resposta aberta não tem gabarito. Dar nota exigiria um modelo julgando
-- texto livre — caro em token, impossível de auditar e, o pior, errado com
-- ar de autoridade: o aluno recebe "72%" sem saber de onde saiu. O curso
-- inteiro se vende por ensinar COM NOTA DE EVIDÊNCIA; corrigir no chute
-- contradiria a própria tese.
--
-- O que substitui a nota é mais honesto e mais eficaz: o aluno escreve
-- PRIMEIRO — sem ver nada —, e só depois recebe o que a biblioteca
-- recomenda para aquela situação NAQUELE segmento (a escola que governa, a
-- estratégia, os erros comuns, o próximo passo) e os fatos do DNA da
-- empresa dele. Comparar o próprio texto com a recomendação é a prática de
-- recuperação de novo, agora em resposta aberta.
--
-- Escrever antes de ver não é detalhe de fluxo: é o método. Quem lê a
-- recomendação primeiro acha que teria escrito aquilo — e não teria.
-- =====================================================================

create table if not exists public.course_exercise (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null,
  module_key  text not null references public.course_modules(key) on delete cascade,
  -- A entrada da biblioteca que gerou a situação. Sem FK de propósito: a
  -- biblioteca é recarregada com DELETE + INSERT a cada correção de
  -- curadoria, e uma FK apagaria em cascata o exercício que a pessoa fez.
  -- O que precisa sobreviver é o que ELA escreveu.
  entry_ref   text,
  -- A mensagem exibida, congelada. A biblioteca muda; o exercício feito não.
  situacao    text not null,
  resposta    text not null,
  -- Autoavaliação: {"<ponto>": true|false}. É o aluno que marca, e isso é
  -- deliberado — ver o comentário do cabeçalho.
  autoavaliacao jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ix_course_exercise_pessoa
  on public.course_exercise(tenant_id, user_id, module_key);

-- ---------------------------------------------------------------------
-- RLS — dado da pessoa dentro da empresa dela, igual ao progresso.
-- `(select auth.uid())` e não `auth.uid()` cru: sem o select, o Postgres
-- reavalia a função por linha.
-- ---------------------------------------------------------------------
alter table public.course_exercise enable row level security;

drop policy if exists course_exercise_own on public.course_exercise;
create policy course_exercise_own on public.course_exercise
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = course_exercise.tenant_id and m.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = course_exercise.tenant_id and m.user_id = (select auth.uid())
    )
  );

drop policy if exists course_exercise_service on public.course_exercise;
create policy course_exercise_service on public.course_exercise
  for all to service_role using (true) with check (true);

comment on table public.course_exercise is
  'Exercício de fim de módulo: mensagem real do ramo respondida com o DNA da empresa. Sem nota — resposta aberta não tem gabarito, e nota inventada contradiz a tese do curso.';
