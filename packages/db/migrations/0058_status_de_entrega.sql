-- 0058 — O STATUS DE ENTREGA DA MENSAGEM
--
-- POR QUE
-- A Meta já nos manda `sent`, `delivered`, `read` e `failed` a cada mensagem
-- que sai. `desmontarPacote` interpreta os quatro desde que o webhook nasceu —
-- e a rota **jogava o array inteiro fora**, gravando só as mensagens
-- recebidas. Havia dado chegando e nenhum lugar para pousar.
--
-- Enquanto o envio era humano pelo `wa.me`, isso era irrelevante: a mensagem
-- saía do celular do vendedor e a Meta não tinha o que reportar. Com o canal
-- oficial no ar e a reativação dos 1.089 pela frente, `failed` passa a ser o
-- dado mais importante que existe: mensagem que não chegou é dinheiro gasto
-- sem conversa, e hoje ela é invisível. É a forma de erro que esta casa mais
-- pagou — o defeito que se apresenta como silêncio.
--
-- ⚠ O STATUS SÓ ANDA PARA A FRENTE, E ISSO É TRIGGER, NÃO CONVENÇÃO
--
-- A Meta não garante ORDEM de entrega dos webhooks. `delivered` pode chegar
-- antes de `sent`, e um pico de latência basta para isso. Sem trava, o webhook
-- gravaria o que chegou por último e a mensagem lida apareceria como "enviada"
-- — regressão silenciosa, que é a pior espécie porque parece dado normal.
--
-- A ordem é `sent` < `delivered` < `read`. E `failed` VENCE TUDO de propósito:
-- na prática ele só segue `sent`, mas se a Meta disser que falhou depois de
-- qualquer coisa, a leitura certa é acreditar. O erro aqui deve andar na
-- direção de MOSTRAR o problema, nunca de escondê-lo.
--
-- Trigger e não policy pela mesma razão do `t_decisions_append_only` (0006):
-- RLS é row-level, não column-level, e a invariante precisa valer para TODO
-- papel — inclusive o `service_role`, que é justamente quem o webhook usa.
--
-- ⚠ NADA DE `upsert` COM ESTE ÍNDICE. A chave para achar a linha é
-- `(tenant_id, external_id)`, cujo índice é PARCIAL (`where external_id is not
-- null`, 0052). O Postgres não infere índice parcial sem repetir o predicado e
-- o PostgREST não sabe expressar isso — foi exatamente assim que toda gravação
-- da mensagem do cliente falhou em silêncio em ago/2026. O caminho é `update`
-- com os dois `eq`, e conferindo o erro.

alter table interactions
  add column if not exists delivery_status text
    check (delivery_status in ('sent','delivered','read','failed')),
  add column if not exists delivery_error text,
  add column if not exists delivery_at timestamptz;

comment on column interactions.delivery_status is
  'Ultimo status reportado pela Meta para esta mensagem. NULL para interacao que nunca saiu pelo canal oficial (registro manual, toque pelo wa.me, mensagem recebida).';
comment on column interactions.delivery_error is
  'Mensagem de erro da Meta quando delivery_status = failed. E o unico texto que diz POR QUE nao chegou.';
comment on column interactions.delivery_at is
  'Quando o ultimo status chegou. Serve para medir atraso de entrega e para saber se o status esta velho.';

-- Só as que saíram pelo canal e ainda não foram entregues/lidas interessam
-- para a tela de conversas. Índice parcial pelo mesmo motivo do 0052: a
-- esmagadora maioria das linhas tem `delivery_status` nulo e não deve pesar.
create index if not exists ix_interactions_entrega
  on interactions (tenant_id, delivery_at desc)
  where delivery_status is not null;

-- ---------------------------------------------------------------------
-- A TRAVA: status não regride
-- ---------------------------------------------------------------------

create or replace function public.status_de_entrega_nao_regride()
returns trigger
language plpgsql
as $$
declare
  peso_novo int;
  peso_velho int;
begin
  if new.delivery_status is null then
    -- Limpar o status é permitido (correção manual). O que não se permite é
    -- trocar um estado avançado por um anterior sem passar por nulo.
    return new;
  end if;

  peso_novo := case new.delivery_status
    when 'sent' then 1 when 'delivered' then 2 when 'read' then 3 when 'failed' then 9 end;
  peso_velho := case old.delivery_status
    when 'sent' then 1 when 'delivered' then 2 when 'read' then 3 when 'failed' then 9 else 0 end;

  if peso_novo < peso_velho then
    -- Não é erro: é webhook fora de ordem, que é comportamento normal da Meta.
    -- Levantar exceção faria a rota devolver 500, a Meta reenviar, e o mesmo
    -- pacote quebrar para sempre — com ela desativando a assinatura depois de
    -- tantas falhas. Descartar a regressão e manter o que já valia é o
    -- comportamento certo.
    new.delivery_status := old.delivery_status;
    new.delivery_error  := old.delivery_error;
    new.delivery_at     := old.delivery_at;
  end if;

  return new;
end;
$$;

drop trigger if exists t_status_de_entrega_nao_regride on public.interactions;
create trigger t_status_de_entrega_nao_regride
  before update on public.interactions
  for each row
  when (old.delivery_status is distinct from new.delivery_status)
  execute function public.status_de_entrega_nao_regride();
