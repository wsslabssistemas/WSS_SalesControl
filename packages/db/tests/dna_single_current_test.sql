-- =====================================================================
-- COS — TESTE: um único DNA corrente por tenant (migration 0007)
--
-- COMO USAR: rode DEPOIS do 0007.
-- RESULTADO ESPERADO: 2 linhas, ambas "PASSOU".
--   1. inserir um segundo DNA corrente no mesmo tenant é bloqueado
--   2. inserir um segundo DNA NÃO-corrente é permitido
-- Cria um tenant demo temporário e o apaga ao final.
-- =====================================================================

drop table if exists _teste_dna_current;
create temporary table _teste_dna_current (
  ordem int, verificacao text, esperado text, obtido text, status text
);

do $$
declare t uuid;
begin
  insert into public.tenants (name, slug, skill_key)
  values ('Demo DNA', 'demo-dna-' || substr(gen_random_uuid()::text, 1, 8), 'academia')
  returning id into t;

  insert into public.commercial_dna (tenant_id, version, sections, is_current)
  values (t, 1, '{}'::jsonb, true);

  -- TESTE 1 — segundo DNA corrente deve ser bloqueado
  begin
    insert into public.commercial_dna (tenant_id, version, sections, is_current)
    values (t, 2, '{}'::jsonb, true);
    insert into _teste_dna_current values
      (1, 'segundo DNA corrente no mesmo tenant', 'bloqueado', 'permitido', 'FALHOU');
  exception when unique_violation then
    insert into _teste_dna_current values
      (1, 'segundo DNA corrente no mesmo tenant', 'bloqueado', 'bloqueado', 'PASSOU');
  end;

  -- TESTE 2 — segundo DNA NÃO-corrente deve ser permitido
  begin
    insert into public.commercial_dna (tenant_id, version, sections, is_current)
    values (t, 3, '{}'::jsonb, false);
    insert into _teste_dna_current values
      (2, 'segundo DNA nao-corrente (historico)', 'permitido', 'permitido', 'PASSOU');
  exception when others then
    insert into _teste_dna_current values
      (2, 'segundo DNA nao-corrente (historico)', 'permitido', 'bloqueado', 'FALHOU');
  end;

  delete from public.tenants where id = t;
end $$;

select ordem as "#", verificacao as "Verificacao", esperado as "Esperado",
       obtido as "Obtido", status as "Resultado"
from _teste_dna_current order by ordem;
