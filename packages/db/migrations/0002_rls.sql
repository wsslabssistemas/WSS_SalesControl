-- =====================================================================
-- COS — MIGRATION 0002 : ISOLAMENTO ENTRE EMPRESAS (RLS)
--
-- Esta é a migration mais importante do projeto.
-- Ela garante, DENTRO DO BANCO, que a Empresa A nunca leia dados da B.
--
-- Mesmo que a aplicação tenha um bug e peça "todos os clientes",
-- o Postgres devolve apenas os da empresa do usuário logado.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Função auxiliar
--
-- SECURITY DEFINER faz a função rodar com privilégios do dono, o que
-- evita recursão infinita quando a política de memberships consulta
-- a própria tabela memberships.
-- search_path fixo evita sequestro da função.
-- ---------------------------------------------------------------------
create or replace function public.is_member_of(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id   = auth.uid()
      and m.tenant_id = target_tenant
      and m.status    = 'active'
  );
$$;

revoke all on function public.is_member_of(uuid) from public;
grant execute on function public.is_member_of(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- Papel administrativo dentro da empresa
-- ---------------------------------------------------------------------
create or replace function public.is_admin_of(target_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id   = auth.uid()
      and m.tenant_id = target_tenant
      and m.status    = 'active'
      and m.role in ('owner','admin')
  );
$$;

revoke all on function public.is_admin_of(uuid) from public;
grant execute on function public.is_admin_of(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- Habilita RLS em TODAS as tabelas
-- ---------------------------------------------------------------------
alter table public.tenants               enable row level security;
alter table public.profiles              enable row level security;
alter table public.memberships           enable row level security;
alter table public.skills                enable row level security;
alter table public.tenant_skills         enable row level security;
alter table public.commercial_dna        enable row level security;
alter table public.knowledge_entries     enable row level security;
alter table public.contacts              enable row level security;
alter table public.contact_stage_history enable row level security;
alter table public.interactions          enable row level security;
alter table public.decisions             enable row level security;
alter table public.events                enable row level security;
alter table public.prospects             enable row level security;
alter table public.signals               enable row level security;
alter table public.opportunities         enable row level security;
alter table public.cadence_runs          enable row level security;
alter table public.suppression_list      enable row level security;
alter table public.contact_touch_log     enable row level security;
alter table public.usage_ledger          enable row level security;


-- ---------------------------------------------------------------------
-- Identidade
-- ---------------------------------------------------------------------

-- A empresa só é visível para quem é membro dela
create policy tenants_select on public.tenants
  for select using (public.is_member_of(id));

create policy tenants_update on public.tenants
  for update using (public.is_admin_of(id))
  with check (public.is_admin_of(id));

-- Cada usuário enxerga o próprio perfil
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Membros enxergam a equipe da própria empresa
create policy memberships_select on public.memberships
  for select using (public.is_member_of(tenant_id));

create policy memberships_admin_write on public.memberships
  for all using (public.is_admin_of(tenant_id))
  with check (public.is_admin_of(tenant_id));


-- ---------------------------------------------------------------------
-- Skills (catálogo global, leitura para todos os autenticados)
-- Escrita só via service_role (processos de fundo)
-- ---------------------------------------------------------------------
create policy skills_read on public.skills
  for select to authenticated using (true);

create policy tenant_skills_all on public.tenant_skills
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));


-- ---------------------------------------------------------------------
-- DNA Comercial — leitura para membros, escrita só para admin
-- ---------------------------------------------------------------------
create policy dna_select on public.commercial_dna
  for select using (public.is_member_of(tenant_id));

create policy dna_admin_write on public.commercial_dna
  for all using (public.is_admin_of(tenant_id))
  with check (public.is_admin_of(tenant_id));


-- ---------------------------------------------------------------------
-- Conhecimento
-- Política dupla: entradas globais da Skill (tenant_id nulo) são
-- visíveis para todos; entradas próprias só para membros.
-- ---------------------------------------------------------------------
create policy knowledge_select on public.knowledge_entries
  for select to authenticated
  using (tenant_id is null or public.is_member_of(tenant_id));

create policy knowledge_tenant_write on public.knowledge_entries
  for all
  using (tenant_id is not null and public.is_admin_of(tenant_id))
  with check (tenant_id is not null and public.is_admin_of(tenant_id));


-- ---------------------------------------------------------------------
-- Operação comercial — isolamento simples por tenant
-- ---------------------------------------------------------------------
create policy contacts_isolation on public.contacts
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));

create policy interactions_isolation on public.interactions
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));

create policy prospects_isolation on public.prospects
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));

create policy signals_isolation on public.signals
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));

create policy opportunities_isolation on public.opportunities
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));

create policy cadence_isolation on public.cadence_runs
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));

create policy suppression_isolation on public.suppression_list
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));

create policy touch_log_isolation on public.contact_touch_log
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));


-- ---------------------------------------------------------------------
-- Tabelas append-only: leitura e inserção, nunca alteração ou exclusão.
-- A ausência de policy para UPDATE/DELETE já bloqueia essas operações.
-- ---------------------------------------------------------------------
create policy stage_history_select on public.contact_stage_history
  for select using (public.is_member_of(tenant_id));
create policy stage_history_insert on public.contact_stage_history
  for insert with check (public.is_member_of(tenant_id));

create policy decisions_select on public.decisions
  for select using (public.is_member_of(tenant_id));
create policy decisions_insert on public.decisions
  for insert with check (public.is_member_of(tenant_id));
-- Exceção: o desfecho é registrado depois que o cliente responde
create policy decisions_outcome_update on public.decisions
  for update using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));

create policy events_select on public.events
  for select using (public.is_member_of(tenant_id));
create policy events_insert on public.events
  for insert with check (public.is_member_of(tenant_id));


-- ---------------------------------------------------------------------
-- Consumo: só leitura para admin. Escrita exclusiva do service_role,
-- para o cliente nunca poder adulterar o próprio consumo.
-- ---------------------------------------------------------------------
create policy usage_select on public.usage_ledger
  for select using (public.is_admin_of(tenant_id));


-- =====================================================================
-- Verificação: lista tabelas que ficaram SEM RLS.
-- O resultado esperado é ZERO linhas.
-- =====================================================================
select tablename as tabela_sem_rls
from pg_tables
where schemaname = 'public'
  and tablename not in (
    select c.relname from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relrowsecurity
  );
