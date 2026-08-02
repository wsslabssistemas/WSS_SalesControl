-- =====================================================================
-- COS — TESTE : coerência entre `tenants.skill_key` e `tenant_skills`
--
-- A AUDITORIA APONTAVA UMA CONTRADIÇÃO: `tenants.skill_key` é UMA Skill;
-- `tenant_skills` é tabela de junção (várias). Qual manda?
--
-- DECISÃO (ago/2026), sem migration e sem quebrar nada:
--   • `tenant_skills` é o que a empresa TEM INSTALADO. É a fonte da RLS —
--     sem o vínculo, a policy de `skills` esconde o manifesto e o painel
--     abre sem etapas e sem origens. Já derrubou 6 empresas demo.
--   • `tenants.skill_key` é a Skill ATIVA — a que o painel usa agora.
--     Guardar a ativa numa coluna é o que permite ler o manifesto sem
--     join em toda página.
--
-- Não é contradição, é papel diferente: o conjunto e o ponteiro. A regra
-- que precisa valer é uma só, e é o que este teste cobra:
--
--   **a Skill ativa tem que estar entre as instaladas.**
--
-- Quando um dia uma empresa tiver duas Skills (uma clínica que também
-- vende produtos), `tenant_skills` já suporta; só o seletor de ativa muda.
--
-- ESPERADO: ZERO linhas em cada uma das duas consultas.
-- =====================================================================

-- 1. Empresa cuja Skill ativa NÃO está instalada.
--    Sintoma no app: painel sem etapas, sem origens, formulário vazio.
select t.slug        as "Empresa",
       t.skill_key   as "Skill ativa",
       coalesce(string_agg(s.key, ', '), '(nenhuma instalada)') as "Instaladas"
from public.tenants t
left join public.tenant_skills ts on ts.tenant_id = t.id
left join public.skills s on s.id = ts.skill_id
group by t.id, t.slug, t.skill_key
having t.skill_key is not null
   and not coalesce(bool_or(s.key = t.skill_key), false);

-- 2. Empresa sem Skill ativa definida.
select slug as "Empresa sem skill_key"
from public.tenants
where skill_key is null or skill_key = '';
