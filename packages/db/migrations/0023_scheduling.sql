-- 0023: disponibilidade e agendamento.
-- Sem saber o que esta livre, o motor escala para um humano toda vez que
-- alguem quer marcar — e no modo automatico a venda nao fecha. Escopo
-- deliberado: o MINIMO para o motor dizer "sabado 10h esta livre, confirmo?".
-- (Conteudo aplicado via MCP; ver historico do commit.)
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null, ends_at time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists ix_availability_tenant on public.availability_rules(tenant_id, weekday) where active;
create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete cascade,
  starts_at timestamptz not null, ends_at timestamptz not null,
  reason text, created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists ix_blocks_tenant_periodo on public.availability_blocks(tenant_id, starts_at, ends_at);
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  membership_id uuid references public.memberships(id) on delete set null,
  service text,
  starts_at timestamptz not null,
  duration_min integer not null default 30 check (duration_min > 0),
  status text not null default 'agendado' check (status in ('agendado','confirmado','realizado','faltou','cancelado')),
  origem text not null default 'manual' check (origem in ('manual','motor','cliente')),
  note text,
  created_by uuid references public.memberships(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_appointments_tenant_periodo on public.appointments(tenant_id, starts_at) where status in ('agendado','confirmado');
create index if not exists ix_appointments_contato on public.appointments(contact_id, starts_at desc);
alter table public.availability_rules enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.appointments enable row level security;
drop policy if exists availability_rules_isolation on public.availability_rules;
create policy availability_rules_isolation on public.availability_rules for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
drop policy if exists availability_blocks_isolation on public.availability_blocks;
create policy availability_blocks_isolation on public.availability_blocks for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
drop policy if exists appointments_isolation on public.appointments;
create policy appointments_isolation on public.appointments for all using (public.is_member_of(tenant_id)) with check (public.is_member_of(tenant_id));
