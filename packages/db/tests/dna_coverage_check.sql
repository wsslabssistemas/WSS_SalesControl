-- =====================================================================
-- COS — TESTE : COBERTURA DE DNA (a trava anti-invencao)
--
-- Para cada entrada da biblioteca, confere se os fatos exigidos
-- (required_facts) existem no DNA daquela empresa.
--
--   PRONTA  = o motor pode responder sozinho
--   ESCALA  = falta fato, um humano precisa responder
--
-- A mesma biblioteca, com DNA diferente, se comporta diferente.
-- E essa a tese do COS demonstrada dentro do banco.
--
-- Efeito colateral util: esta consulta E a lista de pendencias do
-- onboarding. Ela diz exatamente o que falta o cliente preencher.
--
-- Pre-requisitos: 0003, 0004 e seeds/demo_tenants.sql executados.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PARTE 1 — RESUMO (2 linhas)
-- Esperado: demo-be-fitness quase toda PRONTA,
--           demo-academia-nova com varias em ESCALA.
-- ---------------------------------------------------------------------
with empresas as (
  select t.id, t.name, d.sections
  from public.tenants t
  join public.commercial_dna d on d.tenant_id = t.id and d.is_current
  where t.slug like 'demo-%'
),
checagem as (
  select e.name as empresa,
         bool_and(e.sections #> string_to_array(f.fact, '.') is not null) as ok
  from empresas e
  cross join public.knowledge_entries k
  left join lateral unnest(k.required_facts) as f(fact) on true
  where k.skill_key = 'academia' and k.tenant_id is null
  group by e.name, k.id
)
select empresa                                    as "Empresa",
       count(*) filter (where ok is not false)    as "Pronta",
       count(*) filter (where ok is false)        as "Escala",
       count(*)                                   as "Total"
from checagem
group by empresa
order by empresa;


-- ---------------------------------------------------------------------
-- PARTE 2 — DETALHE (uma linha por entrada, por empresa)
-- Mostra exatamente qual fato esta faltando em cada caso.
-- ---------------------------------------------------------------------
with empresas as (
  select t.id, t.name, d.sections
  from public.tenants t
  join public.commercial_dna d on d.tenant_id = t.id and d.is_current
  where t.slug like 'demo-%'
),
checagem as (
  select e.name as empresa,
         k.category,
         k.entry_type,
         string_agg(f.fact, ', ') filter (
           where e.sections #> string_to_array(f.fact, '.') is null
         ) as faltando
  from empresas e
  cross join public.knowledge_entries k
  left join lateral unnest(k.required_facts) as f(fact) on true
  where k.skill_key = 'academia' and k.tenant_id is null
  group by e.name, k.id, k.category, k.entry_type
)
select empresa    as "Empresa",
       category   as "Categoria",
       entry_type as "Tipo",
       case when faltando is null
            then 'PRONTA'
            else 'ESCALA (falta: ' || faltando || ')'
       end        as "Situacao"
from checagem
order by 1, 4 desc, 2;


-- ---------------------------------------------------------------------
-- PARTE 3 — CAMINHOS ORFAOS
-- Um required_fact com erro de digitacao deixa a entrada em ESCALA
-- para sempre, e ninguem percebe: escalar para humano parece o
-- comportamento certo. Esta consulta lista os caminhos que nenhuma
-- empresa conseguiu satisfazer — candidatos a typo.
--
-- Esperado: ZERO linhas depois que a Academia Nova estiver completa.
-- Ate la, compare com as dna_sections do manifesto da Skill.
-- ---------------------------------------------------------------------
select distinct f.fact as "Caminho nunca satisfeito"
from public.knowledge_entries k
cross join lateral unnest(k.required_facts) as f(fact)
where k.skill_key = 'academia'
  and k.tenant_id is null
  and not exists (
    select 1
    from public.commercial_dna d
    join public.tenants t on t.id = d.tenant_id
    where d.is_current
      and t.slug like 'demo-%'
      and d.sections #> string_to_array(f.fact, '.') is not null
  )
order by 1;
