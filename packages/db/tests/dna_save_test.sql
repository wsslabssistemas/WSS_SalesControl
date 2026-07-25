-- =====================================================================
-- COS — TESTE: save_dna versiona o DNA (migration 0009 / RF-04)
--
-- RESULTADO ESPERADO: 3 linhas, todas "PASSOU".
--   Duas edições → duas versões; uma única corrente; a corrente é a última.
-- Cria tenant + usuário demo temporários e apaga ao final.
-- =====================================================================

drop table if exists _t_savedna;
create temporary table _t_savedna(verificacao text, esperado text, obtido text, status text);

do $$
declare
  u uuid := gen_random_uuid();
  t uuid;
  v1 int; v2 int; versoes int; correntes int; range_corrente text;
begin
  insert into auth.users(id) values (u);
  insert into public.profiles(id, email)
    values (u, 'demo-savedna@exemplo.com') on conflict (id) do nothing;
  insert into public.tenants(name, slug, skill_key)
    values ('Demo SaveDNA', 'demo-savedna-' || substr(gen_random_uuid()::text, 1, 8), 'academia')
    returning id into t;
  insert into public.memberships(user_id, tenant_id, role) values (u, t, 'owner');

  -- Como o usuário autenticado (owner = admin)
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', u)::text, true);
  select public.save_dna(t, '{"pricing":{"range":"R$ 99"}}'::jsonb)  into v1;
  select public.save_dna(t, '{"pricing":{"range":"R$ 129"}}'::jsonb) into v2;
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);

  select count(*) into versoes  from public.commercial_dna where tenant_id = t;
  select count(*) into correntes from public.commercial_dna where tenant_id = t and is_current;
  select sections->'pricing'->>'range' into range_corrente
    from public.commercial_dna where tenant_id = t and is_current;

  insert into _t_savedna values
   ('duas versoes criadas', '2', versoes::text,
    case when versoes = 2 then 'PASSOU' else 'FALHOU' end),
   ('uma unica corrente', '1', correntes::text,
    case when correntes = 1 then 'PASSOU' else 'FALHOU' end),
   ('corrente = ultima edicao', 'R$ 129', coalesce(range_corrente, 'null'),
    case when range_corrente = 'R$ 129' then 'PASSOU' else 'FALHOU' end);

  delete from public.tenants where id = t;
  delete from auth.users where id = u;
end $$;

select verificacao as "Verificacao", esperado as "Esperado",
       obtido as "Obtido", status as "Resultado"
from _t_savedna order by verificacao;
