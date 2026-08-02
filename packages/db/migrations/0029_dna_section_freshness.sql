-- =====================================================================
-- COS — MIGRATION 0029 : quando cada seção do DNA foi atualizada
--
-- PROBLEMA (auditoria, P1): a trava anti-invenção verifica PRESENÇA, não
-- ATUALIDADE. Um DNA preenchido em 2025 passa como PRONTA em 2026, e o
-- motor afirma com toda a confiança um preço que não existe mais. É o furo
-- com maior chance de fazer o sistema mentir sem nunca ter inventado nada:
-- o dado estava lá, só estava velho.
--
-- SOLUÇÃO: carimbo POR SEÇÃO, não por registro. Registro inteiro não serve
-- — quem mexe no horário toda semana carregaria o preço de dois anos atrás
-- como se fosse novo.
--
-- O carimbo SOBREVIVE AO VERSIONAMENTO: salvar uma versão nova só renova a
-- data das seções que realmente mudaram. Sem isso, bastaria abrir e salvar
-- o DNA para tudo parecer recém-revisado — o pior dos mundos, porque daria
-- a sensação de frescor sem nenhuma revisão real.
-- =====================================================================

alter table public.commercial_dna
  add column if not exists section_updated_at jsonb not null default '{}'::jsonb;

comment on column public.commercial_dna.section_updated_at is
  'Quando cada seção mudou pela última vez: {"pricing": "2026-08-01T..."}. Renovado só quando o conteúdo da seção muda.';

-- Backfill honesto: para o que já existe, o melhor palpite é a data de
-- criação do registro. Não inventamos frescor que não podemos provar.
update public.commercial_dna d
   set section_updated_at = coalesce(
     (select jsonb_object_agg(k, d.created_at) from jsonb_object_keys(d.sections) k),
     '{}'::jsonb
   )
 where d.section_updated_at = '{}'::jsonb
   and d.sections <> '{}'::jsonb;

-- ---------------------------------------------------------------------
-- A regra do carimbo, isolada numa função PURA.
--
-- Separada de propósito: `save_dna` exige ser admin da empresa, então testar
-- a regra através dela exigiria sessão de usuário. Aqui a regra é testável
-- com um `select` — e é a regra que importa, não o encanamento.
-- ---------------------------------------------------------------------
create or replace function public.dna_section_stamps(
  p_prev_sections jsonb,
  p_prev_ts jsonb,
  p_new jsonb,
  p_agora timestamptz default now()
)
returns jsonb
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_ts jsonb := '{}'::jsonb;
  v_key text;
begin
  for v_key in select jsonb_object_keys(coalesce(p_new, '{}'::jsonb)) loop
    if p_prev_sections is not null
       and p_prev_sections ? v_key
       and p_prev_sections -> v_key = p_new -> v_key
       and coalesce(p_prev_ts, '{}'::jsonb) ? v_key
    then
      -- Não mudou: mantém a data antiga. Abrir e salvar não vira revisão.
      v_ts := v_ts || jsonb_build_object(v_key, p_prev_ts -> v_key);
    else
      v_ts := v_ts || jsonb_build_object(v_key, to_jsonb(p_agora));
    end if;
  end loop;
  return v_ts;
end;
$$;

-- ---------------------------------------------------------------------
-- save_dna passa a carimbar. Mesma assinatura — o app não muda.
-- ---------------------------------------------------------------------
create or replace function public.save_dna(p_tenant uuid, p_sections jsonb)
returns int
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_next int;
  v_prev_sections jsonb;
  v_prev_ts jsonb;
  v_ts jsonb := '{}'::jsonb;
begin
  if not public.is_admin_of(p_tenant) then
    raise exception 'sem permissao para editar o DNA desta empresa';
  end if;

  select coalesce(max(version), 0) + 1 into v_next
  from public.commercial_dna
  where tenant_id = p_tenant;

  select sections, section_updated_at
    into v_prev_sections, v_prev_ts
  from public.commercial_dna
  where tenant_id = p_tenant and is_current;

  v_ts := public.dna_section_stamps(v_prev_sections, v_prev_ts, p_sections);

  update public.commercial_dna
     set is_current = false
   where tenant_id = p_tenant and is_current;

  insert into public.commercial_dna
    (tenant_id, version, sections, source, is_current, section_updated_at)
  values
    (p_tenant, v_next, coalesce(p_sections, '{}'::jsonb), 'manual', true, v_ts);

  return v_next;
end;
$$;

revoke all on function public.save_dna(uuid, jsonb) from public;
grant execute on function public.save_dna(uuid, jsonb) to authenticated;
