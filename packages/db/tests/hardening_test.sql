-- =====================================================================
-- COS — TESTE DO HARDENING (migration 0006)
--
-- Prova as duas correções P0:
--   P0-1  a biblioteca curada não é mais legível por authenticated
--   P0-2  decisions é append-only em nível de coluna
--
-- COMO USAR: cole no SQL Editor e rode (ou via MCP), DEPOIS do 0006.
-- RESULTADO ESPERADO: 6 linhas, todas "PASSOU".
--
-- Não toca em dado de produto: cria um tenant demo temporário, lê a
-- biblioteca global existente, e apaga o que criou ao final.
-- =====================================================================

drop table if exists _teste_hardening;
create temporary table _teste_hardening (
  ordem int, verificacao text, esperado text, obtido text, status text
);
grant all on _teste_hardening to authenticated;

do $$
declare
  u_membro uuid := gen_random_uuid();
  t_temp   uuid;
  s_algum  uuid;
  d_id     uuid;
  visto    int;
begin
  -- ---------- PREPARAÇÃO (dono do banco; RLS não se aplica) ----------
  -- Cria o próprio usuário de auth (profiles.id tem FK para auth.users).
  -- Só `id` é obrigatório; o resto tem default.
  insert into auth.users (id) values (u_membro);

  insert into public.profiles (id, full_name, email)
  values (u_membro, 'Membro Hardening', 'demo-hardening@exemplo.com')
  on conflict (id) do nothing;

  insert into public.tenants (name, slug, skill_key)
  values ('Demo Hardening',
          'demo-hardening-' || substr(gen_random_uuid()::text, 1, 8),
          'academia')
  returning id into t_temp;

  insert into public.memberships (user_id, tenant_id, role)
  values (u_membro, t_temp, 'owner');

  -- Instala UMA skill existente no tenant temporário.
  select id into s_algum from public.skills limit 1;
  insert into public.tenant_skills (tenant_id, skill_id, version)
  select t_temp, s_algum, version from public.skills where id = s_algum;

  -- Uma decisão para testar o append-only.
  insert into public.decisions (tenant_id, context_snapshot, rationale, cost_cents)
  values (t_temp, '{"msg":"oi"}'::jsonb, 'racional original', 100)
  returning id into d_id;


  -- ==================== P0-2 : append-only ====================

  -- TESTE 1 — reescrever rationale é bloqueado
  begin
    update public.decisions set rationale = 'adulterado' where id = d_id;
    insert into _teste_hardening values
      (1, 'UPDATE em rationale (imutavel)', 'bloqueado', 'permitido', 'FALHOU');
  exception when raise_exception then
    insert into _teste_hardening values
      (1, 'UPDATE em rationale (imutavel)', 'bloqueado', 'bloqueado', 'PASSOU');
  end;

  -- TESTE 2 — reescrever cost_cents é bloqueado
  begin
    update public.decisions set cost_cents = 999 where id = d_id;
    insert into _teste_hardening values
      (2, 'UPDATE em cost_cents (imutavel)', 'bloqueado', 'permitido', 'FALHOU');
  exception when raise_exception then
    insert into _teste_hardening values
      (2, 'UPDATE em cost_cents (imutavel)', 'bloqueado', 'bloqueado', 'PASSOU');
  end;

  -- TESTE 3 — preencher o desfecho é permitido
  begin
    update public.decisions
       set outcome = 'ganho', outcome_at = now(), executed_at = now()
     where id = d_id;
    insert into _teste_hardening values
      (3, 'UPDATE em outcome/executed_at', 'permitido', 'permitido', 'PASSOU');
  exception when raise_exception then
    insert into _teste_hardening values
      (3, 'UPDATE em outcome/executed_at', 'permitido', 'bloqueado', 'FALHOU');
  end;

  -- TESTE 4 — o rationale seguiu intacto apesar das tentativas
  perform 1 from public.decisions
   where id = d_id and rationale = 'racional original';
  insert into _teste_hardening values
    (4, 'rationale intacto apos as tentativas', 'sim',
     case when found then 'sim' else 'nao' end,
     case when found then 'PASSOU' else 'FALHOU' end);


  -- ================ P0-1 : biblioteca fechada ================
  -- A partir daqui, como o usuário autenticado membro do tenant temp.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
                     json_build_object('sub', u_membro)::text, true);

  -- TESTE 5 — authenticated NÃO lê a biblioteca global curada
  select count(*) into visto
  from public.knowledge_entries where tenant_id is null;
  insert into _teste_hardening values
    (5, 'authenticated ve a biblioteca GLOBAL', '0', visto::text,
     case when visto = 0 then 'PASSOU' else 'FALHOU' end);

  -- TESTE 6 — authenticated só vê a Skill que instalou, não o catálogo
  select count(*) into visto from public.skills;
  insert into _teste_hardening values
    (6, 'authenticated ve so a Skill instalada', '1', visto::text,
     case when visto = 1 then 'PASSOU' else 'FALHOU' end);


  -- ---------- LIMPEZA (volta a dono do banco) ----------
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
  delete from public.tenants where id = t_temp;    -- cascata: tenant_skills, decisão, membership
  delete from auth.users   where id = u_membro;    -- cascata: profile
end $$;

select
  ordem       as "#",
  verificacao as "Verificacao",
  esperado    as "Esperado",
  obtido      as "Obtido",
  status      as "Resultado"
from _teste_hardening
order by ordem;
