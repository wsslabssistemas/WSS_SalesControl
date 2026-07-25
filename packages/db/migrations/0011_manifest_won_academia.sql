-- =====================================================================
-- COS — MIGRATION 0011 : marca a etapa "ganha" da academia
--
-- A etapa `convertido` (Matriculado) ganha `won: true`. É o que define a
-- conversão canônica (matrículas ÷ leads) e a contagem de matrículas por
-- vendedor, de forma segmento-agnóstica (cada Skill marca a sua).
-- Sincroniza skills.manifest com packages/skills/academia/manifest.yaml.
-- Idempotente.
-- =====================================================================

update public.skills
set manifest = jsonb_set(
      manifest,
      '{journey,stages}',
      (
        select jsonb_agg(
          case when s->>'key' = 'convertido'
               then s || '{"won":true}'::jsonb
               else s end
        )
        from jsonb_array_elements(manifest->'journey'->'stages') s
      )
    )
where key = 'academia'
  and not exists (
    select 1
    from jsonb_array_elements(manifest->'journey'->'stages') s
    where s->>'key' = 'convertido' and (s->>'won') = 'true'
  );
