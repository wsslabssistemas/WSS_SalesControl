-- =====================================================================
-- COS — MIGRATION 0008 : seção `reciprocity` no manifesto da academia
--
-- A categoria canônica `reciprocity` existia sem lar no DNA. O required_fact
-- `reciprocity.gift` era caminho órfão: a entrada de reciprocidade escalava
-- para todo tenant, para sempre — mesmo a Be Fitness, que TINHA o brinde
-- declarado no DNA. O manifesto é que estava incompleto, não o dado.
--
-- Isto sincroniza `skills.manifest` (banco) com
-- `packages/skills/academia/manifest.yaml`, onde a seção foi adicionada.
-- Achado por `required_facts_check.sql`.
--
-- Idempotente: só adiciona a seção se ainda não existir.
-- =====================================================================

update public.skills
set manifest = jsonb_set(
      manifest,
      '{dna_sections}',
      (manifest->'dna_sections') || jsonb_build_array(
        jsonb_build_object(
          'key',    'reciprocity',
          'label',  'Brindes e cortesias de adesão',
          'fields', jsonb_build_array(
                      jsonb_build_object('key', 'gift', 'type', 'text')
                    )
        )
      )
    )
where key = 'academia'
  and not exists (
    select 1
    from jsonb_array_elements(manifest->'dna_sections') s
    where s->>'key' = 'reciprocity'
  );
