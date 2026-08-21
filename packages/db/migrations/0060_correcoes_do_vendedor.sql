-- 0060 — O QUE O VENDEDOR CORRIGE NA MENSAGEM DO MOTOR
--
-- POR QUE
-- O fundador fez a pergunta que decide o produto: *"como deixaremos a IA ainda
-- mais inteligente?"* — depois de constatar, testando ao vivo, que ela às vezes
-- entrega 100% e às vezes precisa de adaptação.
--
-- A resposta não é ajustar o prompt. É parar de jogar fora o sinal que já
-- existe: **toda vez que alguém adapta a mensagem antes de enviar, um vendedor
-- experiente está corrigindo o modelo, no momento exato, de graça.**
--
-- Hoje essa correção desaparece. O texto sugerido é substituído na tela e some;
-- o que fica registrado em `interactions` é só o que saiu. O par
-- "sugerido × enviado" — que é a lição inteira — nunca existiu.
--
-- ⚠ POR QUE ESTE SINAL VALE MAIS QUE O DESFECHO, hoje.
--
-- `lib/aprendizado.ts` já sabe medir qual técnica converte, e está certo em
-- calar: são 14 fechamentos na base inteira, amostra que não sustenta nada. E
-- desfecho demora semanas.
--
-- A correção do vendedor chega em SEGUNDOS e em TODA mensagem. Vinte mensagens
-- geram vinte lições; vinte matrículas levam dois meses. Para sair do zero,
-- este é o único caminho rápido — e ele não compete com o desfecho, prepara.
--
-- ⚠ E O `contexto` É OBRIGATÓRIO, não enfeite. O par sugerido-enviado sozinho
-- não ensina: "tirou o horário oferecido" é correção certa quando o cliente
-- não pediu horário e errada quando ele pediu. Sem a situação, o exemplo
-- ensina a regra errada — que é pior que não ensinar.

create table if not exists public.ai_edits (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  contact_id    uuid references public.contacts(id) on delete set null,
  created_by    uuid references public.memberships(id) on delete set null,
  contexto      text not null,
  sugerido      text not null,
  enviado       text not null,
  occurred_at   timestamptz not null default now()
);

comment on table public.ai_edits is
  'O que o motor sugeriu x o que a pessoa realmente mandou. E a correcao de um vendedor experiente sobre o modelo, capturada no momento em que ela acontece — o unico sinal de qualidade que nao depende de esperar a conversa converter.';
comment on column public.ai_edits.contexto is
  'O que o cliente tinha dito / o motivo do toque. Sem ele o par sugerido-enviado nao ensina nada: a mesma correcao pode ser certa numa situacao e errada em outra.';

create index if not exists ix_ai_edits_tenant on public.ai_edits(tenant_id, occurred_at desc);

-- Correção de vendedor é dado comercial da empresa: mesma regra de todo o
-- resto. Sem policy cross-tenant — a Lei 3 vale aqui como em qualquer tabela.
alter table public.ai_edits enable row level security;

create policy ai_edits_isolation on public.ai_edits
  for all using (public.is_member_of(tenant_id))
  with check (public.is_member_of(tenant_id));
