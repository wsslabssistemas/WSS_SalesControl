-- =====================================================================
-- COS — MIGRATION 0020 : CATÁLOGO DE PRODUTOS/SERVIÇOS
--
-- Distribuidora, autopeças, atacado: a empresa tem centenas de itens com
-- preço e estoque. Isso NÃO cabe no DNA (que guarda fatos curados e é
-- editado à mão) — precisa de importação de planilha e busca.
--
-- O motor consulta este catálogo para responder "tem tal peça? quanto é?"
-- sem inventar. É extensão da trava anti-invenção: só afirma o que está aqui.
--
-- Dinheiro em CENTAVOS. Preço é o de tabela; negociação fica na conversa.
-- =====================================================================

create table if not exists public.catalog_items (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  sku          text,
  name         text not null,
  description  text,
  brand        text,
  category     text,
  unit         text,
  price_cents  integer check (price_cents >= 0),
  stock_qty    numeric(14,3),
  active       boolean not null default true,
  -- Campos extras da planilha do cliente que não têm coluna própria.
  extra        jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- Um SKU por empresa (quando informado): permite reimportar a planilha
-- atualizando preço e estoque em vez de duplicar o item.
create unique index if not exists ux_catalog_tenant_sku
  on public.catalog_items(tenant_id, sku) where sku is not null;

create index if not exists ix_catalog_tenant_active
  on public.catalog_items(tenant_id, active);

create index if not exists ix_catalog_nome
  on public.catalog_items(tenant_id, name);

comment on table public.catalog_items is
  'Catálogo de produtos/serviços do tenant. Importado de planilha. O motor só pode afirmar o que está aqui.';

alter table public.catalog_items enable row level security;

drop policy if exists catalog_items_isolation on public.catalog_items;
create policy catalog_items_isolation on public.catalog_items
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));
