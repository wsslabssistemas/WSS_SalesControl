-- =====================================================================
-- COS — MIGRATION 0001 : FUNDAÇÃO
-- Cria toda a estrutura de dados da plataforma.
-- Executar no SQL Editor do Supabase.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists vector;

-- Atualiza updated_at automaticamente
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =====================================================================
-- 1. IDENTIDADE E ORGANIZAÇÃO
-- =====================================================================

-- A empresa contratante (academia, barbearia...). O centro de tudo.
create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  skill_key   text not null,
  plan        text not null default 'trial',
  status      text not null default 'trial'
              check (status in ('trial','active','past_due','suspended')),
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create trigger t_tenants_touch before update on public.tenants
  for each row execute function public.touch_updated_at();


-- Extensão do usuário do Supabase Auth
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger t_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();


-- Ponte usuário <-> empresa. É o que faz o multi-tenancy funcionar.
-- Vendedor NÃO é tabela: é um membership com papel 'agent'.
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  role        text not null default 'agent'
              check (role in ('owner','admin','manager','agent')),
  status      text not null default 'active'
              check (status in ('active','invited','disabled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, tenant_id)
);
create index ix_memberships_tenant on public.memberships(tenant_id);
create index ix_memberships_user   on public.memberships(user_id);
create trigger t_memberships_touch before update on public.memberships
  for each row execute function public.touch_updated_at();


-- =====================================================================
-- 2. SKILLS E DNA COMERCIAL
-- =====================================================================

-- Catálogo global de especializações. Não pertence a nenhuma empresa.
create table public.skills (
  id            uuid primary key default gen_random_uuid(),
  key           text not null,
  name          text not null,
  version       text not null,
  manifest      jsonb not null,
  status        text not null default 'draft'
                check (status in ('draft','published','deprecated')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (key, version)
);
create trigger t_skills_touch before update on public.skills
  for each row execute function public.touch_updated_at();


-- Instalação da Skill numa empresa, com versão fixada.
create table public.tenant_skills (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  skill_id     uuid not null references public.skills(id),
  version      text not null,
  overrides    jsonb not null default '{}'::jsonb,
  installed_at timestamptz not null default now(),
  unique (tenant_id, skill_id)
);
create index ix_tenant_skills_tenant on public.tenant_skills(tenant_id);


-- Os FATOS da empresa. Fonte única de verdade.
-- O que não estiver aqui NÃO pode ser afirmado pela IA.
create table public.commercial_dna (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  version     int  not null default 1,
  sections    jsonb not null default '{}'::jsonb,
  source      text not null default 'manual'
              check (source in ('onboarding','manual','learned')),
  is_current  boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (tenant_id, version)
);
create index ix_dna_tenant_current on public.commercial_dna(tenant_id)
  where is_current;


-- =====================================================================
-- 3. CONHECIMENTO (Biblioteca Comercial)
-- =====================================================================

-- tenant_id NULO = conhecimento global da Skill (herdado por todos).
-- tenant_id preenchido = conhecimento próprio daquela empresa.
create table public.knowledge_entries (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid references public.tenants(id) on delete cascade,
  skill_key         text not null,
  category          text not null,
  entry_type        text not null default 'reactive'
                    check (entry_type in ('reactive','proactive')),

  trigger_questions text[] not null default '{}',
  opportunity_type  text,

  strategy          text not null,
  required_facts    text[] not null default '{}',
  optional_facts    text[] not null default '{}',
  hard_rules        text[] not null default '{}',
  on_missing_facts  text not null default 'escalate'
                    check (on_missing_facts in ('escalate','omit')),

  technique         text,
  common_errors     text[] not null default '{}',
  next_objective    text,

  embedding         vector(1536),
  source            text not null default 'skill_seed'
                    check (source in ('skill_seed','tenant','learned')),
  status            text not null default 'active'
                    check (status in ('active','draft','archived')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index ix_knowledge_tenant   on public.knowledge_entries(tenant_id);
create index ix_knowledge_skill    on public.knowledge_entries(skill_key, category);
create trigger t_knowledge_touch before update on public.knowledge_entries
  for each row execute function public.touch_updated_at();


-- =====================================================================
-- 4. OPERAÇÃO COMERCIAL
-- =====================================================================

-- O lead / cliente final da empresa contratante.
create table public.contacts (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  name              text not null,
  phone             text,
  email             text,

  source            text,
  source_detail     text,

  -- Texto validado contra o manifesto da Skill, nunca enum do banco:
  -- enum obrigaria migration a cada segmento novo.
  journey_stage     text not null default 'contato',
  journey_phase     text,
  stage_entered_at  timestamptz not null default now(),

  owner_id          uuid references public.memberships(id) on delete set null,
  next_action       text,
  next_action_at    timestamptz,

  custom            jsonb not null default '{}'::jsonb,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
-- Trava de duplicidade garantida pelo banco, não pela tela
create unique index ux_contacts_tenant_phone
  on public.contacts(tenant_id, phone)
  where phone is not null and deleted_at is null;
create index ix_contacts_tenant_stage on public.contacts(tenant_id, journey_stage);
create index ix_contacts_next_action  on public.contacts(tenant_id, next_action_at);
create trigger t_contacts_touch before update on public.contacts
  for each row execute function public.touch_updated_at();


-- Histórico de mudanças de etapa. Só INSERT.
-- A jornada é um grafo: pode avançar, pular e RETROCEDER.
-- Sem esta tabela, o valor anterior é sobrescrito e a análise se perde.
create table public.contact_stage_history (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  contact_id   uuid not null references public.contacts(id) on delete cascade,
  from_stage   text,
  to_stage     text not null,
  reason       text not null,
  triggered_by text not null default 'system'
               check (triggered_by in ('system','agent','ai_detected')),
  decision_id  uuid,
  occurred_at  timestamptz not null default now()
);
create index ix_stage_history_contact on public.contact_stage_history(contact_id, occurred_at);


-- Cada troca registrada.
-- input_kind separa três coisas que o protótipo misturava no mesmo campo:
-- mensagem real do cliente, anotação do vendedor, e iniciativa do sistema.
-- Só 'customer_message' entra em embedding e em métrica de resposta.
create table public.interactions (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  contact_id    uuid not null references public.contacts(id) on delete cascade,
  input_kind    text not null default 'customer_message'
                check (input_kind in ('customer_message','agent_briefing','system_initiated')),
  channel       text not null default 'whatsapp',
  direction     text not null check (direction in ('inbound','outbound')),
  content       text not null,
  created_by    uuid references public.memberships(id) on delete set null,
  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index ix_interactions_contact on public.interactions(contact_id, occurred_at);
create index ix_interactions_tenant  on public.interactions(tenant_id, occurred_at);


-- =====================================================================
-- 5. COMMERCIAL MEMORY
-- =====================================================================

-- Princípio 15: toda decisão tem memória.
-- context_snapshot é obrigatório: sem ele é impossível distinguir
-- "a decisão foi ruim" de "a informação disponível era ruim".
create table public.decisions (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  contact_id         uuid references public.contacts(id) on delete cascade,
  interaction_id     uuid references public.interactions(id) on delete set null,

  context_snapshot   jsonb not null,
  journey_stage      text,
  strategy           text,
  technique          text,
  rationale          text,
  suggested_response text,
  next_step          text,

  missing_facts      text[] not null default '{}',
  escalated          boolean not null default false,
  confidence         numeric(4,3),

  model              text,
  tokens_in          int,
  tokens_out         int,
  cost_cents         int,
  latency_ms         int,

  -- Prazo x execução separados: sem os dois carimbos não existe
  -- medição de aderência à cadência.
  due_at             timestamptz,
  executed_at        timestamptz,

  outcome            text,
  outcome_at         timestamptz,

  created_at         timestamptz not null default now()
);
create index ix_decisions_tenant  on public.decisions(tenant_id, created_at);
create index ix_decisions_contact on public.decisions(contact_id, created_at);
create index ix_decisions_learning
  on public.decisions(tenant_id, technique, journey_stage)
  where outcome is not null;


-- Log append-only. Base do futuro Event Intelligence Bus.
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  actor_id     uuid references public.memberships(id) on delete set null,
  type         text not null,
  entity_type  text,
  entity_id    uuid,
  payload      jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null default now()
);
create index ix_events_tenant on public.events(tenant_id, occurred_at);
create index ix_events_type   on public.events(tenant_id, type, occurred_at);


-- =====================================================================
-- 6. CAMADA PROATIVA
-- =====================================================================

-- Empresas/pessoas sem relacionamento ainda. Espaço de PESQUISA.
-- Separado de contacts de propósito: misturar polui conversão e consentimento.
create table public.prospects (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  kind            text not null default 'company' check (kind in ('company','person')),
  name            text not null,
  tax_id          text,
  sector          text,
  size            text,
  location        text,
  source          text not null,
  raw             jsonb not null default '{}'::jsonb,
  enrichment      jsonb not null default '{}'::jsonb,
  score           int,
  status          text not null default 'new'
                  check (status in ('new','researching','qualified','approached','converted','discarded')),
  legal_basis     text,
  do_not_contact  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index ix_prospects_tenant on public.prospects(tenant_id, status);
create trigger t_prospects_touch before update on public.prospects
  for each row execute function public.touch_updated_at();


-- Todo gatilho, interno ou externo.
create table public.signals (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  subject_type  text not null check (subject_type in ('contact','prospect')),
  subject_id    uuid not null,
  type          text not null,
  source        text not null default 'internal'
                check (source in ('internal','public_registry','tender','import','referral')),
  payload       jsonb not null default '{}'::jsonb,
  strength      numeric(4,3) not null default 0.5,
  detected_at   timestamptz not null default now(),
  expires_at    timestamptz,
  consumed_at   timestamptz
);
create index ix_signals_tenant  on public.signals(tenant_id, detected_at);
create index ix_signals_subject on public.signals(subject_type, subject_id);


-- Saída do Opportunity Engine.
-- reason é NOT NULL: oportunidade sem "por que este, por que agora"
-- vira lista de tarefa aleatória e o vendedor aprende a ignorar.
create table public.opportunities (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  subject_type  text not null check (subject_type in ('contact','prospect')),
  subject_id    uuid not null,
  type          text not null
                check (type in ('reactivation','renewal','referral','upsell','rescue','prospecting','trial_followup')),
  reason        text not null,
  signal_ids    uuid[] not null default '{}',
  priority      int not null default 0,
  suggested_play text,
  status        text not null default 'open'
                check (status in ('open','assigned','in_progress','won','lost','expired')),
  assigned_to   uuid references public.memberships(id) on delete set null,
  scheduled_for date,
  expires_at    timestamptz,
  outcome       text,
  outcome_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index ix_opportunities_queue
  on public.opportunities(tenant_id, status, priority desc);
create trigger t_opportunities_touch before update on public.opportunities
  for each row execute function public.touch_updated_at();


-- Execução de sequência de contato (cadência declarada na Skill).
create table public.cadence_runs (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  cadence_key    text not null,
  current_step   int not null default 0,
  next_run_at    timestamptz,
  status         text not null default 'running'
                 check (status in ('running','stopped','completed')),
  stop_reason    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index ix_cadence_due on public.cadence_runs(tenant_id, next_run_at)
  where status = 'running';
create trigger t_cadence_touch before update on public.cadence_runs
  for each row execute function public.touch_updated_at();


-- LGPD operacional. Consultada ANTES de qualquer envio, em qualquer canal.
create table public.suppression_list (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  channel     text not null,
  identifier  text not null,
  reason      text not null
              check (reason in ('opt_out','bounce','complaint','manual')),
  created_at  timestamptz not null default now(),
  unique (tenant_id, channel, identifier)
);


-- Anti-saturação: impede que a mesma pessoa receba várias campanhas seguidas.
create table public.contact_touch_log (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  subject_type  text not null check (subject_type in ('contact','prospect')),
  subject_id    uuid not null,
  channel       text not null,
  campaign_key  text,
  sent_at       timestamptz not null default now()
);
create index ix_touch_subject on public.contact_touch_log(subject_type, subject_id, sent_at);


-- =====================================================================
-- 7. CONSUMO E MARGEM
-- =====================================================================

create table public.usage_ledger (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  feature      text not null,
  model        text,
  tokens_in    int not null default 0,
  tokens_out   int not null default 0,
  cost_cents   int not null default 0,
  cached       boolean not null default false,
  occurred_at  timestamptz not null default now()
);
create index ix_usage_tenant_period on public.usage_ledger(tenant_id, occurred_at);
