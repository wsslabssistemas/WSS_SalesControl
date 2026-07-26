-- 0014: técnica usada e resultado por interação.
-- Base do aprendizado por feedback (sem re-treinar modelo): correlaciona a
-- técnica/resposta com o desfecho, e realimenta o motor com o que converteu.
alter table public.interactions
  add column if not exists technique text,
  add column if not exists outcome   text
    check (outcome in ('respondeu','marcou_visita','matriculou','sumiu'));

comment on column public.interactions.technique is
  'Técnica de venda da resposta (para correlacionar com o resultado).';
comment on column public.interactions.outcome is
  'Desfecho registrado pelo vendedor: respondeu | marcou_visita | matriculou | sumiu.';
