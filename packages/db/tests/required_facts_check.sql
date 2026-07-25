-- =====================================================================
-- COS — VERIFICAÇÃO: required_facts × dna_sections
--
-- Cruza todo `required_facts` das entradas de biblioteca contra as
-- seções e campos declarados em `dna_sections` do manifesto da Skill.
--
-- POR QUÊ: um caminho com typo (ex.: `reciprocity.gift`, quando
-- `reciprocity` é categoria e não seção de DNA) nunca é satisfeito por
-- nenhum DNA. A entrada escala para sempre — e falha na direção que
-- parece segura, então passa despercebida. É o P1 da auditoria.
--
-- COMO USAR: rode DEPOIS dos seeds (0003 + 0004).
-- RESULTADO ESPERADO: ZERO linhas. Qualquer linha é um caminho quebrado.
-- =====================================================================

with valid_paths as (
  -- Todos os pares seção.campo válidos, por Skill, vindos do manifesto.
  select s.key                       as skill_key,
         sec->>'key'                 as section,
         f->>'key'                   as field
  from public.skills s,
       jsonb_array_elements(s.manifest->'dna_sections') sec,
       jsonb_array_elements(coalesce(sec->'fields', '[]'::jsonb)) f
),
req as (
  -- Todo required_fact usado na biblioteca global, quebrado em seção/campo.
  select k.skill_key,
         k.category,
         rf                          as required_fact,
         split_part(rf, '.', 1)      as sec,
         split_part(rf, '.', 2)      as fld
  from public.knowledge_entries k,
       unnest(k.required_facts) rf
  where k.tenant_id is null
)
select r.skill_key,
       r.category,
       r.required_fact,
       case
         when not exists (
           select 1 from valid_paths v
           where v.skill_key = r.skill_key and v.section = r.sec
         ) then 'SECAO inexistente no manifesto'
         else 'CAMPO inexistente na secao'
       end as problema
from req r
where not exists (
  select 1 from valid_paths v
  where v.skill_key = r.skill_key
    and v.section   = r.sec
    and v.field     = r.fld
)
order by r.skill_key, r.category, r.required_fact;
