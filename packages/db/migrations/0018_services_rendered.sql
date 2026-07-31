-- =====================================================================
-- COS — MIGRATION 0018 : ATENDIMENTOS REALIZADOS (com valor)
--
-- Por que tabela própria e não uma coluna em `interactions`:
-- interactions é append-only (trigger 0006) e registra CONVERSA. Serviço
-- prestado é outro fato: tem valor, profissional e pode ser corrigido.
--
-- Escopo deliberado: isto NÃO é caixa nem comanda. É inteligência de venda —
-- serve para responder "quanto cada profissional gerou" e "quanto ficou na
-- mesa". Sem isso, não há como medir recompra em dinheiro.
--
-- Dinheiro em CENTAVOS (inteiro), nunca string de exibição.
-- =====================================================================

create table if not exists public.services_rendered (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  contact_id   uuid references public.contacts(id) on delete set null,
  -- Quem executou. É um membership (vendedor/barbeiro não é tabela).
  performed_by uuid references public.memberships(id) on delete set null,
  service      text not null,
  value_cents  integer not null check (value_cents >= 0),
  -- Comissão do profissional no momento do serviço (o percentual muda com o
  -- tempo; congelar aqui evita recalcular o passado errado).
  commission_pct numeric(5,2) check (commission_pct >= 0 and commission_pct <= 100),
  occurred_at  timestamptz not null default now(),
  note         text,
  created_by   uuid references public.memberships(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists ix_services_tenant_date
  on public.services_rendered(tenant_id, occurred_at desc);
create index if not exists ix_services_performer
  on public.services_rendered(tenant_id, performed_by, occurred_at desc);
create index if not exists ix_services_contact
  on public.services_rendered(contact_id, occurred_at desc);

comment on table public.services_rendered is
  'Serviço prestado com valor. Base de faturamento por profissional e de recompra em dinheiro. Não é caixa/PDV.';

-- RLS: nenhum acesso sem contexto de empresa (Lei 3).
alter table public.services_rendered enable row level security;

drop policy if exists services_rendered_isolation on public.services_rendered;
create policy services_rendered_isolation on public.services_rendered
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));
