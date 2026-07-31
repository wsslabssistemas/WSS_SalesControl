-- =====================================================================
-- COS — MIGRATION 0016 : INSTALAR SKILL SEM CONTRADIÇÃO
--
-- Bug real (jul/2026): trocar o segmento gravava só tenants.skill_key, mas
-- a RLS de `skills` exige vínculo em `tenant_skills`. Resultado: o app não
-- conseguia LER o manifesto — formulário sem etapas e sem origens.
-- É o P2 "schema se contradiz sobre Skills por tenant" virando defeito.
--
-- Solução: uma única porta de entrada que escreve nos DOIS lugares.
-- =====================================================================

create or replace function public.install_skill(p_tenant uuid, p_skill_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_skill_id uuid;
  v_version  text;
begin
  -- Só quem administra a empresa instala Skill.
  if auth.role() <> 'service_role' and not exists (
    select 1 from public.memberships m
     where m.tenant_id = p_tenant
       and m.user_id = auth.uid()
       and m.status = 'active'
       and m.role in ('owner','admin')
  ) then
    raise exception 'Sem permissao para instalar Skill nesta empresa.';
  end if;

  select id, version into v_skill_id, v_version
    from public.skills
   where key = p_skill_key and status = 'published'
   order by version desc
   limit 1;

  if v_skill_id is null then
    raise exception 'Skill % nao esta publicada.', p_skill_key;
  end if;

  update public.tenants set skill_key = p_skill_key where id = p_tenant;

  -- Uma Skill instalada por empresa: a troca substitui a anterior.
  delete from public.tenant_skills where tenant_id = p_tenant;
  insert into public.tenant_skills (tenant_id, skill_id, version)
  values (p_tenant, v_skill_id, v_version);
end;
$$;

comment on function public.install_skill is
  'Instala a Skill do segmento: grava tenants.skill_key E o vinculo em tenant_skills (a RLS de skills depende dele).';

revoke all on function public.install_skill(uuid, text) from public;
grant execute on function public.install_skill(uuid, text) to authenticated, service_role;

-- Conserta o que ja esta no banco: todo tenant sem vinculo ganha o seu.
insert into public.tenant_skills (tenant_id, skill_id, version)
select t.id, s.id, s.version
  from public.tenants t
  join public.skills s
    on s.key = t.skill_key and s.status = 'published'
 where t.deleted_at is null
   and not exists (select 1 from public.tenant_skills ts where ts.tenant_id = t.id);
