-- =====================================================================
-- COS — TESTE : COBERTURA E ATUALIDADE DO DNA (a trava anti-invenção)
--
-- Para cada entrada da biblioteca, confere se os fatos exigidos
-- (required_facts) existem no DNA daquela empresa.
--
--   PRONTA  = o motor pode responder sozinho
--   ESCALA  = falta fato, um humano precisa responder
--
-- A mesma biblioteca, com DNA diferente, se comporta diferente. É a tese do
-- COS demonstrada dentro do banco.
--
-- Efeito colateral útil: esta consulta É a lista de pendências do onboarding.
-- Ela diz exatamente o que falta o cliente preencher.
--
-- ---------------------------------------------------------------------
-- CORRIGIDO EM ago/2026 (achado da auditoria): a versão anterior filtrava
-- `slug like 'demo-%'` e fixava `skill_key = 'academia'`. Como as empresas
-- reais de academia (be-fitness, academia-nova) não têm o prefixo, a consulta
-- voltava VAZIA — a trava era um no-op que ninguém percebia, porque zero
-- linhas parece "nada errado".
--
-- A decisão: o prefixo `demo-` protege ESCRITA (seed nunca alcança empresa
-- real). Diagnóstico é LEITURA e tem que olhar todo mundo. E cada empresa é
-- checada contra a biblioteca do PRÓPRIO segmento, não contra academia.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PARTE 1 — RESUMO (uma linha por empresa)
-- Esperado: toda empresa com DNA completo aparece com Escala = 0.
-- ---------------------------------------------------------------------
with empresas as (
  select t.id, t.name, t.slug, t.skill_key, d.sections, d.section_updated_at
  from public.tenants t
  join public.commercial_dna d on d.tenant_id = t.id and d.is_current
),
checagem as (
  select e.name as empresa,
         e.slug,
         e.skill_key,
         -- `f.fact is null` = entrada que não exige fato nenhum (as de
         -- indecisão, por exemplo). O `left join` produz uma linha nula para
         -- ela, e sem este teste o bool_and a contava como ESCALA: quem não
         -- exige nada aparecia como bloqueado. Bug encontrado ao cruzar este
         -- check com o facts_lock_test, que discordava dele.
         bool_and(f.fact is null or e.sections #> string_to_array(f.fact, '.') is not null) as ok
  from empresas e
  join public.knowledge_entries k
    on k.skill_key = e.skill_key and k.tenant_id is null and k.status = 'active'
  left join lateral unnest(k.required_facts) as f(fact) on true
  group by e.name, e.slug, e.skill_key, k.id
)
select empresa                                 as "Empresa",
       skill_key                               as "Segmento",
       case when slug like 'demo-%' then 'demo' else 'real' end as "Tipo",
       count(*) filter (where ok is not false)  as "Pronta",
       count(*) filter (where ok is false)      as "Escala",
       count(*)                                 as "Total"
from checagem
group by empresa, slug, skill_key
order by "Tipo", empresa;


-- ---------------------------------------------------------------------
-- PARTE 2 — DETALHE: o que falta, entrada por entrada
-- ---------------------------------------------------------------------
with empresas as (
  select t.id, t.name, t.skill_key, d.sections
  from public.tenants t
  join public.commercial_dna d on d.tenant_id = t.id and d.is_current
),
checagem as (
  select e.name as empresa,
         k.category,
         k.entry_type,
         string_agg(f.fact, ', ') filter (
           where e.sections #> string_to_array(f.fact, '.') is null
         ) as faltando
  from empresas e
  join public.knowledge_entries k
    on k.skill_key = e.skill_key and k.tenant_id is null and k.status = 'active'
  left join lateral unnest(k.required_facts) as f(fact) on true
  group by e.name, k.id, k.category, k.entry_type
)
select empresa    as "Empresa",
       category   as "Categoria",
       entry_type as "Tipo",
       'ESCALA (falta: ' || faltando || ')' as "Situacao"
from checagem
where faltando is not null
order by 1, 2;


-- ---------------------------------------------------------------------
-- PARTE 3 — CAMINHOS ÓRFÃOS
-- Um required_fact com erro de digitação deixa a entrada em ESCALA para
-- sempre, e ninguém percebe: escalar parece o comportamento certo. Aqui
-- ficam os caminhos que NENHUMA empresa do segmento conseguiu satisfazer.
--
-- Esperado: ZERO linhas. (O `library_check.mjs` cobre o mesmo contra o
-- manifesto, sem precisar do banco — este pega o caso em que o manifesto
-- tem o campo mas nenhuma empresa preenche.)
-- ---------------------------------------------------------------------
select distinct k.skill_key as "Segmento", f.fact as "Caminho nunca satisfeito"
from public.knowledge_entries k
cross join lateral unnest(k.required_facts) as f(fact)
where k.tenant_id is null
  and k.status = 'active'
  and not exists (
    select 1
    from public.commercial_dna d
    join public.tenants t on t.id = d.tenant_id and t.skill_key = k.skill_key
    where d.is_current
      and d.sections #> string_to_array(f.fact, '.') is not null
  )
order by 1, 2;


-- ---------------------------------------------------------------------
-- PARTE 4 — ATUALIDADE (0029)
-- A trava garante que o motor só afirma o que está no DNA. Não garante que
-- o que está lá ainda é verdade: preço de um ano atrás é afirmado com a
-- mesma confiança do de ontem.
--
-- Esperado: nenhuma seção acima de 180 dias numa empresa em operação.
-- ---------------------------------------------------------------------
select t.name as "Empresa",
       s.key  as "Seção",
       (d.section_updated_at ->> s.key)::timestamptz::date as "Atualizada em",
       (current_date - ((d.section_updated_at ->> s.key)::timestamptz::date)) as "Dias"
from public.tenants t
join public.commercial_dna d on d.tenant_id = t.id and d.is_current
cross join lateral jsonb_object_keys(d.sections) as s(key)
where d.section_updated_at ? s.key
  and (current_date - ((d.section_updated_at ->> s.key)::timestamptz::date)) > 180
order by 4 desc;
