-- =====================================================================
-- COS — TESTE DE ISOLAMENTO ENTRE EMPRESAS
--
-- Este é o teste mais importante do produto inteiro.
-- Se ele falhar, nada mais deve ser construído até corrigir.
--
-- COMO USAR
--   1. Supabase → Authentication → Users → Add user
--      Cria dois usuários e copia o UUID (coluna id) de cada um.
--   2. Cola os dois UUIDs abaixo, nas linhas indicadas.
--   3. Cola este arquivo inteiro no SQL Editor e clica em Run.
--
-- RESULTADO ESPERADO
--   Todas as verificações devem imprimir "PASSOU".
--   Qualquer "FALHOU" significa vazamento entre empresas.
-- =====================================================================

do $$
declare
  -- ↓↓↓ COLE OS DOIS UUIDs AQUI ↓↓↓
  user_a uuid := '00000000-0000-0000-0000-00000000000a';
  user_b uuid := '00000000-0000-0000-0000-00000000000b';
  -- ↑↑↑ COLE OS DOIS UUIDs AQUI ↑↑↑

  tenant_a uuid;
  tenant_b uuid;
  visto    int;
begin

  -- -------------------------------------------------------------------
  -- PREPARAÇÃO (roda como superusuário, RLS não se aplica aqui)
  -- -------------------------------------------------------------------
  insert into public.profiles (id, full_name, email)
  values (user_a, 'Usuário A', 'teste-a@exemplo.com'),
         (user_b, 'Usuário B', 'teste-b@exemplo.com')
  on conflict (id) do nothing;

  insert into public.tenants (name, slug, skill_key)
  values ('Academia Teste A', 'teste-a-' || substr(gen_random_uuid()::text,1,8), 'academia')
  returning id into tenant_a;

  insert into public.tenants (name, slug, skill_key)
  values ('Barbearia Teste B', 'teste-b-' || substr(gen_random_uuid()::text,1,8), 'barbearia')
  returning id into tenant_b;

  insert into public.memberships (user_id, tenant_id, role)
  values (user_a, tenant_a, 'owner'),
         (user_b, tenant_b, 'owner');

  insert into public.contacts (tenant_id, name, phone)
  values (tenant_a, 'Cliente Secreto da Empresa A', '51900000001'),
         (tenant_b, 'Cliente Secreto da Empresa B', '51900000002');

  insert into public.commercial_dna (tenant_id, sections)
  values (tenant_a, '{"pricing":{"range":"R$ 99 a R$ 169"}}'::jsonb),
         (tenant_b, '{"pricing":{"range":"R$ 40 a R$ 90"}}'::jsonb);

  raise notice '--- Empresas criadas: A=% | B=% ---', tenant_a, tenant_b;


  -- -------------------------------------------------------------------
  -- TESTE 1 — Usuário A enxerga os próprios clientes
  -- -------------------------------------------------------------------
  set local role authenticated;
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_a)::text, true);

  select count(*) into visto from public.contacts where tenant_id = tenant_a;
  raise notice 'TESTE 1  A vê os próprios clientes (esperado 1): % -> %',
    visto, case when visto = 1 then 'PASSOU' else 'FALHOU' end;


  -- -------------------------------------------------------------------
  -- TESTE 2 — Usuário A NÃO enxerga clientes da Empresa B
  -- -------------------------------------------------------------------
  select count(*) into visto from public.contacts where tenant_id = tenant_b;
  raise notice 'TESTE 2  A vê clientes de B (esperado 0): % -> %',
    visto, case when visto = 0 then 'PASSOU' else 'FALHOU' end;


  -- -------------------------------------------------------------------
  -- TESTE 3 — "Select geral" devolve apenas a própria empresa
  -- Este é o teste que simula um bug na aplicação.
  -- -------------------------------------------------------------------
  select count(*) into visto from public.contacts;
  raise notice 'TESTE 3  A faz SELECT sem filtro (esperado 1): % -> %',
    visto, case when visto = 1 then 'PASSOU' else 'FALHOU' end;


  -- -------------------------------------------------------------------
  -- TESTE 4 — A não enxerga o DNA (preços) da Empresa B
  -- -------------------------------------------------------------------
  select count(*) into visto from public.commercial_dna where tenant_id = tenant_b;
  raise notice 'TESTE 4  A vê o DNA de B (esperado 0): % -> %',
    visto, case when visto = 0 then 'PASSOU' else 'FALHOU' end;


  -- -------------------------------------------------------------------
  -- TESTE 5 — A não consegue ESCREVER dentro da Empresa B
  -- -------------------------------------------------------------------
  begin
    insert into public.contacts (tenant_id, name, phone)
    values (tenant_b, 'Invasor', '51900000003');
    raise notice 'TESTE 5  A escreveu em B -> FALHOU (gravou!)';
  exception when insufficient_privilege or check_violation then
    raise notice 'TESTE 5  A escreveu em B -> PASSOU (bloqueado)';
  end;


  -- -------------------------------------------------------------------
  -- TESTE 6 — Usuário B enxerga só o dele
  -- -------------------------------------------------------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_b)::text, true);

  select count(*) into visto from public.contacts;
  raise notice 'TESTE 6  B faz SELECT sem filtro (esperado 1): % -> %',
    visto, case when visto = 1 then 'PASSOU' else 'FALHOU' end;


  -- -------------------------------------------------------------------
  -- TESTE 7 — Usuário sem vínculo nenhum não vê nada
  -- -------------------------------------------------------------------
  perform set_config('request.jwt.claims',
                     json_build_object('sub', gen_random_uuid())::text, true);

  select count(*) into visto from public.contacts;
  raise notice 'TESTE 7  Estranho faz SELECT (esperado 0): % -> %',
    visto, case when visto = 0 then 'PASSOU' else 'FALHOU' end;


  -- -------------------------------------------------------------------
  -- LIMPEZA
  -- -------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', '', true);

  delete from public.tenants where id in (tenant_a, tenant_b);
  raise notice '--- Dados de teste removidos ---';

end $$;
