-- =====================================================================
-- COS — MIGRATION 0049 : A PRÓXIMA AÇÃO COM DATA
--
-- Nasceu de um caso real, contado pelo fundador: um lead chamado Sami
-- disse em julho que só iria à academia em agosto. Não havia onde
-- guardar isso. O vendedor tinha três opções, todas ruins — anotar num
-- papel, confiar na memória, ou deixar o lead esfriar até o sistema
-- reclamar sozinho três dias depois.
--
-- O QUE JÁ EXISTIA E POR QUE NÃO BASTAVA. O produto tinha duas formas de
-- lembrar de alguém, e as duas são do SISTEMA, não da pessoa:
--   • CADÊNCIA — o manifesto diz "toque no dia 2, no 6 e no 8". É régua
--     do ramo, boa para o caso comum e cega para o caso específico.
--   • ESFRIANDO — "sem contato há 3 dias". É alarme de ausência.
-- Nenhuma das duas sabe o que o CLIENTE disse. Quando ele marca a data,
-- cobrar antes é queimar, e esperar o alarme genérico é chegar tarde.
--
-- POR QUE COLUNA E NÃO `custom`: isto não é campo de segmento — é do
-- núcleo. Toda venda tem "combinei de voltar em tal dia", e é o único
-- compromisso que o VENDEDOR assume com o cliente. Enfiado no jsonb não
-- daria para ordenar nem indexar, e a tela inicial precisa das duas
-- coisas todo dia.
--
-- A NOTA É OBRIGATÓRIA NA PRÁTICA, e é o detalhe que faz a diferença:
-- "voltar dia 3" não diz nada em agosto. "Ele disse que começa em agosto,
-- depois das férias" faz o vendedor retomar de onde parou em vez de abrir
-- com "oi, tudo bem?".
-- =====================================================================

alter table public.contacts
  add column if not exists next_action_at   date,
  add column if not exists next_action_note text;

-- Índice parcial: só interessa quem TEM data marcada, e essa é a minoria.
-- A tela inicial pergunta "o que vence hoje ou já venceu" a cada carga.
create index if not exists ix_contacts_next_action
  on public.contacts(tenant_id, next_action_at)
  where next_action_at is not null;

comment on column public.contacts.next_action_at is
  'Data combinada com o cliente para o próximo contato. Diferente de cadência (régua do ramo) e de "esfriando" (alarme de ausência): esta é a data que a PESSOA marcou.';
comment on column public.contacts.next_action_note is
  'O que foi combinado, nas palavras de quem atendeu. Sem isso o lembrete vira "voltar dia 3", que não diz nada um mês depois.';


-- =====================================================================
-- VERIFICAÇÃO — as colunas existem e o índice é parcial.
-- =====================================================================
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'contacts'
   and column_name in ('next_action_at', 'next_action_note')
 order by column_name;
