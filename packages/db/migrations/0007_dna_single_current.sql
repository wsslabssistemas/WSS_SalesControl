-- =====================================================================
-- COS — MIGRATION 0007 : UM ÚNICO DNA CORRENTE POR TENANT (P1)
--
-- `ix_dna_tenant_current` foi criado como índice comum, não UNIQUE. Dois
-- registros com is_current = true no mesmo tenant eram possíveis — e o motor
-- escolheria de forma ambígua qual DNA vale, sem erro. O DNA é a fonte única
-- de verdade dos fatos; "único" tem que ser garantia do banco, não disciplina.
--
-- Re-executável. Seguro: verificado que não há duplicata corrente antes.
-- =====================================================================

drop index if exists public.ix_dna_tenant_current;

create unique index ix_dna_tenant_current
  on public.commercial_dna(tenant_id)
  where is_current;
