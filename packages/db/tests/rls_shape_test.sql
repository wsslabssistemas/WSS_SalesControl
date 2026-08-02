-- =====================================================================
-- TESTE — o FORMATO das policies não afrouxou
--
-- O `0032` separou policies `FOR ALL` em INSERT/UPDATE/DELETE por
-- desempenho: uma policy de escrita marcada como ALL também roda em toda
-- LEITURA, e `memberships`, `commercial_dna` e `knowledge_entries` são
-- lidas o tempo todo. Otimização em RLS é onde mais se afrouxa segurança
-- sem perceber — daí este teste.
--
-- A invariante: **leitura por MEMBRO, escrita por ADMIN.** Cada tabela com
-- exatamente uma policy de SELECT, e ela usando `is_member_of`.
--
-- ESPERADO: 3 linhas, todas PASSOU.
-- =====================================================================

with esperado (tabela, leitura_esperada) as (
  values
    ('memberships',       'is_member_of(tenant_id)'),
    ('commercial_dna',    'is_member_of(tenant_id)'),
    ('knowledge_entries', '((tenant_id IS NOT NULL) AND is_member_of(tenant_id))')
),
real as (
  select p.tablename,
         count(*) filter (where p.cmd = 'SELECT') as n_select,
         max(case when p.cmd = 'SELECT' then p.qual end) as leitura,
         count(*) filter (where p.cmd = 'ALL')    as n_all,
         count(*) filter (where p.cmd <> 'SELECT' and p.cmd <> 'ALL') as n_escrita
    from pg_policies p
   where p.schemaname = 'public'
     and p.tablename in ('memberships', 'commercial_dna', 'knowledge_entries')
   group by p.tablename
)
select e.tabela as "Tabela",
       case
         when r.tablename is null then 'FALHOU: tabela sem policy'
         when r.n_select <> 1 then 'FALHOU: ' || r.n_select || ' policies de SELECT (esperado 1)'
         when r.n_all > 0 then 'FALHOU: ainda existe policy FOR ALL (roda em toda leitura)'
         when r.leitura is distinct from e.leitura_esperada
           then 'FALHOU: leitura virou "' || coalesce(r.leitura, 'nula') || '"'
         when r.n_escrita < 3 then 'FALHOU: faltou policy de escrita (INSERT/UPDATE/DELETE)'
         else 'PASSOU'
       end as "Resultado"
  from esperado e
  left join real r on r.tablename = e.tabela
 order by 1;
