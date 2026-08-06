-- =====================================================================
-- COS — MIGRATION 0045 : ESCOLA NA INTERAÇÃO (o M2, finalmente)
--
-- O piloto trouxe 1.053 atendimentos com a técnica registrada — e 898
-- rótulos DISTINTOS. É o problema dos 134 nomes de `technique` da
-- biblioteca outra vez, agora pior: texto livre gerado por IA, em inglês,
-- e composto. Um exemplo real:
--
--   "Intelligence Gathering (Belfort), Sell Yourself First (Girard),
--    Hot Button (Tracy), Puppy Dog Close"
--
-- Cruzar isso com desfecho produz uma tabela com n=1 por linha. O
-- `CLAUDE.md` já dizia: toda dimensão de análise é enum, nunca texto livre.
--
-- POR QUE `schools` É ARRAY, E NÃO UMA ESCOLA SÓ.
--
-- O desenho original do M2 previa uma coluna `school` singular. O dado
-- real mostrou que isso mentiria: cada atendimento usa TRÊS OU QUATRO
-- técnicas juntas, de escolas diferentes. Creditar a matrícula a uma só
-- seria inventar uma atribuição que ninguém mediu — e inventar precisão é
-- a mesma família de erro que a trava anti-invenção existe para impedir,
-- só que virada para dentro, contra a nossa própria análise.
--
-- Com array, a pergunta que se responde é honesta: "em que fração dos
-- atendimentos GANHOS esta escola apareceu, contra a fração no total?".
-- Isso é CO-OCORRÊNCIA, não causa — e é o máximo que este dado sustenta.
-- Dizer mais que isso seria o folclore que o produto promete não repetir.
--
-- `technique` continua guardado, cru. A canonização é uma leitura do
-- original, não um substituto — e um dia alguém vai querer conferir.
-- =====================================================================

alter table public.interactions
  add column if not exists schools text[] not null default '{}';

comment on column public.interactions.schools is
  'Escolas de venda canônicas identificadas no texto livre de `technique`. Array porque um atendimento usa várias juntas: creditar o desfecho a uma só seria inventar atribuição. Vazio = não foi possível classificar com confiança, e isso é informação, não zero.';

-- A consulta do M2 é sempre "escola × desfecho neste tenant".
create index if not exists ix_interactions_schools
  on public.interactions using gin (schools);
