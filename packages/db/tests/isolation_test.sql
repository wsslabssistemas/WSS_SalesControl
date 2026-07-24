-- =====================================================================
-- COS — TESTE DE ISOLAMENTO ENTRE EMPRESAS
--
-- Este é o teste mais importante do produto inteiro.
-- Se ele falhar, nada mais deve ser construído até corrigir.
--
-- COMO USAR
--   Cole este arquivo inteiro no SQL Editor do Supabase e clique em Run.
--
-- RESULTADO ESPERADO
--   Uma tabela com 7 linhas, todas com "PASSOU".
--   Qualquer "FALHOU" significa vazamento de dados entre empresas.
-- =====================================================================

drop table if exists _teste_isolamento;
create temporary table _teste_isolamento (
  ordem       int,
  verificacao text,
  esperado    text,
  obtido      text,
  status      text
);

-- Necessário: durante o teste o banco assume o papel "authenticated",
-- e sem esta permissão ele não conseguiria gravar o resultado.
grant all on _teste_isolamento to authenticated;

do $$
declare
  -- Usuários de teste criados em Authentication → Users
  user_a uuid := '59d85c34-a650-4ee0-88b5-675b21556824';
  user_b uuid := 'a24006d8-57df-4367-8852-1456d0aa4544';

  tenant_a uuid;
  tenant_b uuid;
  visto    int;
begin

  -- -------------------------------------------------------------------
  -- PREPARAÇÃO
  -- Roda como dono do banco: aqui o RLS não se aplica, de propósito.
  -- -------------------------------------------------------------------
  insert into public.profiles (id, full_name, email)
  values (user_a, 'Usuário A', 'teste-a@exemplo.com'),
         (user_b, 'Usuário B', 'teste-b@exemplo.com')
  on conflict (id) do nothing;

  insert into public.tenants (name, slug, skill_key)
  values ('Academia Teste A',
          'teste-a-' || substr(gen_random_uuid()::text, 1, 8),
          'academia')
  returning id into tenant_a;

  insert into public.tenants (name, slug, skill_key)
  values ('Barbearia Teste B',
          'teste-b-' || substr(gen_random_uuid()::text, 1, 8),
          'barbearia')
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


  -- -------------------------------------------------------------------
  -- A partir daqui o banco trata as consultas como se fossem feitas
  -- pelo Usuário A logado no sistema.
  -- -------------------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_a)::text, true);


  -- TESTE 1 — A enxerga os próprios clientes
  select count(*) into visto
  from public.contacts where tenant_id = tenant_a;

  insert into _teste_isolamento values
    (1, 'A ve os proprios clientes', '1', visto::text,
     case when visto = 1 then 'PASSOU' else 'FALHOU' end);


  -- TESTE 2 — A NÃO enxerga clientes da Empresa B
  select count(*) into visto
  from public.contacts where tenant_id = tenant_b;

  insert into _teste_isolamento values
    (2, 'A ve clientes da Empresa B', '0', visto::text,
     case when visto = 0 then 'PASSOU' else 'FALHOU' end);


  -- TESTE 3 — SELECT sem filtro devolve apenas a própria empresa
  -- Simula um bug na aplicação que esquece de filtrar por empresa.
  select count(*) into visto from public.contacts;

  insert into _teste_isolamento values
    (3, 'A faz SELECT sem filtro nenhum', '1', visto::text,
     case when visto = 1 then 'PASSOU' else 'FALHOU' end);


  -- TESTE 4 — A não enxerga os preços (DNA) da Empresa B
  select count(*) into visto
  from public.commercial_dna where tenant_id = tenant_b;

  insert into _teste_isolamento values
    (4, 'A ve o DNA/precos da Empresa B', '0', visto::text,
     case when visto = 0 then 'PASSOU' else 'FALHOU' end);


  -- TESTE 5 — A não consegue ESCREVER dentro da Empresa B
  begin
    insert into public.contacts (tenant_id, name, phone)
    values (tenant_b, 'Invasor', '51900000003');

    insert into _teste_isolamento values
      (5, 'A grava um cliente dentro da Empresa B',
       'bloqueado', 'gravou', 'FALHOU');
  exception
    when insufficient_privilege or check_violation then
      insert into _teste_isolamento values
        (5, 'A grava um cliente dentro da Empresa B',
         'bloqueado', 'bloqueado', 'PASSOU');
  end;


  -- TESTE 6 — Agora como Usuário B: enxerga só o dele
  perform set_config('request.jwt.claims',
                     json_build_object('sub', user_b)::text, true);

  select count(*) into visto from public.contacts;

  insert into _teste_isolamento values
    (6, 'B faz SELECT sem filtro nenhum', '1', visto::text,
     case when visto = 1 then 'PASSOU' else 'FALHOU' end);


  -- TESTE 7 — Usuário sem vínculo nenhum não vê nada
  perform set_config('request.jwt.claims',
                     json_build_object('sub', gen_random_uuid())::text, true);

  select count(*) into visto from public.contacts;

  insert into _teste_isolamento values
    (7, 'Usuario estranho faz SELECT', '0', visto::text,
     case when visto = 0 then 'PASSOU' else 'FALHOU' end);


  -- -------------------------------------------------------------------
  -- LIMPEZA — volta a ser dono do banco e apaga os dados de teste
  -- -------------------------------------------------------------------
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);

  delete from public.tenants where id in (tenant_a, tenant_b);

end $$;


-- =====================================================================
-- RESULTADO
-- =====================================================================
select
  ordem       as "#",
  verificacao as "Verificacao",
  esperado    as "Esperado",
  obtido      as "Obtido",
  status      as "Resultado"
from _teste_isolamento
order by ordem;
