-- =====================================================================
-- TESTE — carimbo de atualidade por seção do DNA (0029)
--
-- A regra que importa: **abrir e salvar não vira revisão**. Só a seção que
-- mudou de conteúdo recebe data nova. Sem isso, bastaria clicar em salvar
-- para tudo parecer recém-revisado — frescor falso é pior que nenhum, porque
-- desliga o alarme sem resolver o problema.
--
-- ESPERADO: 5 linhas, todas com resultado = PASSOU.
-- =====================================================================

with base as (
  select
    '{"pricing":{"range":"R$ 100"},"availability":{"weekly_hours":"9h-18h"}}'::jsonb as antes,
    '{"pricing":"2025-01-10T12:00:00+00","availability":"2025-01-10T12:00:00+00"}'::jsonb as carimbos,
    '2026-08-01T12:00:00+00'::timestamptz as agora
),

-- 1. Nada mudou: as duas datas antigas continuam.
t1 as (
  select 'nada mudou mantem as duas datas' as caso,
         public.dna_section_stamps(antes, carimbos, antes, agora) as r,
         '2025'::text as esperado_prefixo
  from base
),
-- 2. Só o preço mudou: preço ganha data nova, horário mantém a antiga.
t2 as (
  select 'so o preco mudou' as caso,
         public.dna_section_stamps(
           antes, carimbos,
           '{"pricing":{"range":"R$ 130"},"availability":{"weekly_hours":"9h-18h"}}'::jsonb,
           agora) as r,
         null::text
  from base
),
-- 3. Seção nova nasce com a data de agora.
t3 as (
  select 'secao nova recebe agora' as caso,
         public.dna_section_stamps(
           antes, carimbos,
           antes || '{"catalog":{"items":[]}}'::jsonb,
           agora) as r,
         null::text
  from base
),
-- 4. Ordem das chaves não conta (jsonb compara por estrutura).
t4 as (
  select 'ordem das chaves nao conta' as caso,
         public.dna_section_stamps(
           '{"pricing":{"a":1,"b":2}}'::jsonb,
           '{"pricing":"2025-01-10T12:00:00+00"}'::jsonb,
           '{"pricing":{"b":2,"a":1}}'::jsonb,
           agora) as r,
         null::text
  from base
),
-- 5. Sem DNA anterior, tudo é novo.
t5 as (
  select 'primeiro DNA carimba tudo' as caso,
         public.dna_section_stamps(null, null, antes, agora) as r, null::text
  from base
)

select caso,
       case when (r->>'pricing') like '2025%' and (r->>'availability') like '2025%'
            then 'PASSOU' else 'FALHOU: ' || r::text end as resultado
  from t1
union all
select caso,
       case when (r->>'pricing') like '2026%' and (r->>'availability') like '2025%'
            then 'PASSOU' else 'FALHOU: ' || r::text end
  from t2
union all
select caso,
       case when (r->>'catalog') like '2026%' and (r->>'pricing') like '2025%'
            then 'PASSOU' else 'FALHOU: ' || r::text end
  from t3
union all
select caso,
       case when (r->>'pricing') like '2025%'
            then 'PASSOU' else 'FALHOU: ' || r::text end
  from t4
union all
select caso,
       case when (r->>'pricing') like '2026%' and (r->>'availability') like '2026%'
            then 'PASSOU' else 'FALHOU: ' || r::text end
  from t5;
