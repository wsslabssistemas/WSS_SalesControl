-- =====================================================================
-- COS — MIGRATION 0009 : salvar DNA versionado (RF-04)
--
-- Editar o DNA cria uma versão NOVA e mantém a anterior (RF-04). O índice
-- único garante um só DNA corrente por tenant, então a troca precisa ser
-- atômica: desmarca a corrente e insere a nova na mesma transação. Uma função
-- faz isso de uma vez — o app não consegue deixar o tenant sem DNA corrente.
--
-- security invoker: roda com o usuário chamador; a RLS (dna_admin_write) e o
-- check de admin abaixo garantem que só owner/admin da empresa escreve.
-- Re-executável.
-- =====================================================================

create or replace function public.save_dna(p_tenant uuid, p_sections jsonb)
returns int
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_next int;
begin
  if not public.is_admin_of(p_tenant) then
    raise exception 'sem permissao para editar o DNA desta empresa';
  end if;

  select coalesce(max(version), 0) + 1 into v_next
  from public.commercial_dna
  where tenant_id = p_tenant;

  update public.commercial_dna
     set is_current = false
   where tenant_id = p_tenant and is_current;

  insert into public.commercial_dna (tenant_id, version, sections, source, is_current)
  values (p_tenant, v_next, coalesce(p_sections, '{}'::jsonb), 'manual', true);

  return v_next;
end;
$$;

revoke all on function public.save_dna(uuid, jsonb) from public;
grant execute on function public.save_dna(uuid, jsonb) to authenticated;
