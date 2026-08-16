-- ---------------------------------------------------------------------
-- A CREDENCIAL DO CANAL É POR EMPRESA — e ela NÃO pode morar em `settings`.
--
-- ⚠ O QUE ESTA MIGRATION IMPEDE.
--
-- O envio pelo WhatsApp era configurado por variável de ambiente
-- (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`): **um número para o sistema
-- inteiro.** A ENTRADA já era por empresa — o webhook acha o tenant pelo
-- `phone_number_id` do pacote — então saída global e entrada por empresa
-- estavam inconsistentes. Com dois clientes, as mensagens dos dois sairiam do
-- mesmo número.
--
-- ⚠ E POR QUE NÃO EM `tenants.settings`, que seria o lugar óbvio.
--
-- A policy `tenants_select` (0002) libera a linha inteira para QUALQUER membro
-- da empresa. `settings` já carrega aparência, token de calendário e a ração —
-- coisas que um recepcionista pode ver. Um token da Meta, não: ele manda
-- mensagem em nome da academia, para qualquer número, sem passar pelo produto.
-- Guardado ali, os três recepcionistas da Be Fitness leriam o segredo com uma
-- chamada de API do próprio navegador.
--
-- Então ele mora numa tabela com **RLS ligada e NENHUMA policy**: em Postgres
-- isso nega tudo. Só o `service_role` alcança, do servidor, como já acontece
-- com a biblioteca curada (0006). Mesma regra, mesmo motivo: o que não precisa
-- chegar ao browser não chega.
-- ---------------------------------------------------------------------

create table if not exists public.tenant_secrets (
  tenant_id             uuid primary key references public.tenants(id) on delete cascade,

  -- Cloud API da Meta. O token é o de usuário do sistema (permanente); o
  -- temporário de 24h serve para testar e morre no dia seguinte.
  whatsapp_token        text,
  whatsapp_phone_id     text,
  -- O que a Meta devolve na verificação do webhook. É escolhido por quem
  -- configura, não pela Meta.
  whatsapp_verify_token text,

  -- Quem mexeu por último. Credencial trocada sem rastro é o tipo de mudança
  -- que ninguém consegue explicar depois.
  updated_at            timestamptz not null default now(),
  updated_by            uuid references public.memberships(id) on delete set null
);

alter table public.tenant_secrets enable row level security;

-- ⚠ NENHUMA POLICY, DE PROPÓSITO. RLS ligada sem policy nega para todos os
-- papéis com RLS aplicada (`anon`, `authenticated`). `service_role` tem
-- `bypassrls` e continua alcançando — é ele quem lê no servidor.
--
-- Se um dia alguém precisar "só ver se está configurado" no browser, a
-- resposta certa é uma coluna derivada em `tenants.settings` (um booleano),
-- nunca uma policy aqui.

-- Cinto e suspensório: sem GRANT, o PostgREST nem tenta. RLS é a defesa real,
-- mas as duas juntas custam uma linha.
revoke all on public.tenant_secrets from anon, authenticated;

comment on table public.tenant_secrets is
  'Segredos por empresa (credencial de canal). RLS nega a todos: só service_role, server-side.';
