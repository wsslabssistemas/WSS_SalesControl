-- O STATUS DE ENTREGA NÃO REGRIDE (0058)
--
-- ⚠ POR QUE ESTE TESTE EXISTE.
--
-- A Meta NÃO garante a ordem de entrega dos webhooks: `delivered` pode chegar
-- antes de `sent`, e um pico de latência basta. Sem a trava, o webhook
-- gravaria o que chegou por último e uma mensagem LIDA voltaria a aparecer
-- como "enviada".
--
-- Regressão silenciosa é a pior espécie de defeito nesta casa, porque o dado
-- errado parece dado normal. Ninguém abre uma tela e desconfia de um "enviada"
-- — só de um erro.
--
-- É trigger e não convenção pela mesma razão do `t_decisions_append_only`
-- (0006): a invariante precisa valer para TODO papel, inclusive o
-- `service_role`, que é justamente quem o webhook usa.
--
-- COMO RODAR: psql -f status_entrega_test.sql
-- Ele cria o próprio dado, confere e faz rollback. Não toca em linha real.

begin;

-- Um tenant e um contato de teste, com prefixo `demo-` pela regra da casa:
-- nenhum delete deste arquivo pode alcançar empresa real.
insert into tenants (id, name, slug, skill_key)
values ('00000000-0000-0000-0000-0000000000aa', 'Demo Status', 'demo-status-entrega', 'academia');

insert into contacts (id, tenant_id, name)
values ('00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-0000000000aa', 'Contato de teste');

insert into interactions (id, tenant_id, contact_id, direction, content, external_id)
values ('00000000-0000-0000-0000-0000000000cc', '00000000-0000-0000-0000-0000000000aa',
        '00000000-0000-0000-0000-0000000000bb', 'outbound', 'mensagem de teste', 'wamid.TESTE');

-- 1. O caminho normal AVANÇA nos três degraus. Esperado ao fim: 'read'.
update interactions set delivery_status='sent'      where id='00000000-0000-0000-0000-0000000000cc';
update interactions set delivery_status='delivered' where id='00000000-0000-0000-0000-0000000000cc';
update interactions set delivery_status='read'      where id='00000000-0000-0000-0000-0000000000cc';
do $$
declare v text;
begin
  select delivery_status into v from interactions where id='00000000-0000-0000-0000-0000000000cc';
  if v is distinct from 'read' then
    raise exception 'FALHA: avanco normal deveria terminar em read, veio %', v;
  end if;
end $$;

-- 2. ⚠ O CASO QUE O TRIGGER EXISTE PARA PEGAR: webhook fora de ordem.
--    'sent' chegando DEPOIS de 'read' deve ser descartado.
--    Esperado: continua 'read'.
update interactions set delivery_status='sent' where id='00000000-0000-0000-0000-0000000000cc';
do $$
declare v text;
begin
  select delivery_status into v from interactions where id='00000000-0000-0000-0000-0000000000cc';
  if v is distinct from 'read' then
    raise exception 'FALHA: status regrediu de read para % — webhook fora de ordem sobrescreveu', v;
  end if;
end $$;

-- 3. `failed` vence tudo. Na prática ele só segue `sent`, mas se a Meta disser
--    que falhou, a leitura certa é acreditar: o erro deve andar na direção de
--    MOSTRAR o problema. Esperado: 'failed'.
update interactions set delivery_status='failed', delivery_error='numero invalido'
  where id='00000000-0000-0000-0000-0000000000cc';
do $$
declare v text;
begin
  select delivery_status into v from interactions where id='00000000-0000-0000-0000-0000000000cc';
  if v is distinct from 'failed' then
    raise exception 'FALHA: failed deveria vencer, veio %', v;
  end if;
end $$;

-- 4. Nada supera `failed`. Esperado: continua 'failed', com o motivo intacto.
update interactions set delivery_status='read' where id='00000000-0000-0000-0000-0000000000cc';
do $$
declare v text; e text;
begin
  select delivery_status, delivery_error into v, e from interactions where id='00000000-0000-0000-0000-0000000000cc';
  if v is distinct from 'failed' then
    raise exception 'FALHA: read sobrescreveu failed, veio %', v;
  end if;
  if e is distinct from 'numero invalido' then
    raise exception 'FALHA: o motivo da falha foi perdido na regressao descartada, veio %', e;
  end if;
end $$;

-- 5. Limpar é permitido — é a correção manual. Esperado: NULL.
update interactions set delivery_status=null, delivery_error=null where id='00000000-0000-0000-0000-0000000000cc';
do $$
declare v text;
begin
  select delivery_status into v from interactions where id='00000000-0000-0000-0000-0000000000cc';
  if v is not null then
    raise exception 'FALHA: limpar o status deveria ser permitido, veio %', v;
  end if;
end $$;

select 'status_entrega_test: tudo certo (5 verificacoes)' as resultado;

rollback;
