-- =====================================================================
-- COS — MIGRATION 0028 : `demo_seed` como origem de DNA
--
-- POR QUÊ: o DNA de demonstração precisa ser distinguível de DNA real no
-- próprio registro, não só pelo slug do tenant. Gravar dado fictício como
-- `manual` seria apagar a diferença justamente onde ela importa — é assim
-- que dado de demonstração é confundido com fato de empresa.
--
-- A convenção do projeto já protege pelo slug (`demo-%`). Isto é a segunda
-- camada: dá para responder "isto veio de seed?" com um `select`.
-- =====================================================================

alter table public.commercial_dna
  drop constraint if exists commercial_dna_source_check;

alter table public.commercial_dna
  add constraint commercial_dna_source_check
  check (source in ('onboarding', 'manual', 'learned', 'demo_seed'));

comment on column public.commercial_dna.source is
  'Origem do DNA. `demo_seed` = dado fictício de demonstração, nunca fato de empresa real.';
