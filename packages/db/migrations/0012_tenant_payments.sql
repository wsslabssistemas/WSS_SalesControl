-- =====================================================================
-- COS — MIGRATION 0012 : pagamentos por empresa (dado do fabricante)
--
-- Controle financeiro da WSS Labs: quem pagou, quanto, quando. É dado
-- cross-tenant do fabricante — RLS ligada e SEM policy para authenticated,
-- então só o service_role (painel do fabricante) acessa. Nenhum cliente vê.
-- =====================================================================

create table if not exists public.tenant_payments (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  period       text not null,                    -- ex.: "2026-07"
  amount_cents int  not null default 0,
  currency     text not null default 'BRL',
  status       text not null default 'pending'
               check (status in ('pending', 'paid')),
  paid_at      timestamptz,
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists ix_tenant_payments_tenant
  on public.tenant_payments(tenant_id, period);

alter table public.tenant_payments enable row level security;
-- Sem policy para authenticated: dado do fabricante. service_role ignora RLS.
