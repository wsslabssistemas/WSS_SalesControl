-- =====================================================================
-- COS — MIGRATION 0050 : VIGÊNCIA DO CONTRATO
--
-- Pedido do fundador, e ele trouxe a parte difícil junto: *"tentar
-- interagir com o cliente no mês ou x tempo antes de vencer, para não
-- fazer o contato apenas quando está por vencer."* É exatamente a
-- diferença entre RENOVAR e COBRAR.
--
-- Contato único no vencimento chega no pior momento possível: a pessoa já
-- decidiu, e a conversa vira negociação de preço sob pressão de prazo —
-- o terreno onde o cliente ganha e a margem perde.
--
-- POR QUE COLUNA E NÃO `custom`: é do núcleo. "Contrato com vigência"
-- não é vocabulário de mercado — academia, curso, escola esportiva e
-- software têm; barbearia não. Quem decide se aparece é o manifesto
-- (`contract.enabled`), do mesmo jeito que já decide `services.enabled`.
-- No jsonb não daria para indexar nem ordenar, e a tela inicial pergunta
-- "quem vence nos próximos 60 dias" a cada carga.
--
-- A REGRA DE NEGÓCIO NÃO MORA AQUI. As três janelas (60/30/7) e o que
-- dizer em cada uma estão em `lib/renovacao.ts`, função pura e testada:
-- é regra, não schema, e regra em SQL é regra que ninguém consegue medir.
-- =====================================================================

alter table public.contacts
  add column if not exists contract_start date,
  add column if not exists contract_end   date;

-- Índice parcial: só interessa quem TEM vigência, que é a minoria da base.
create index if not exists ix_contacts_contract_end
  on public.contacts(tenant_id, contract_end)
  where contract_end is not null;

comment on column public.contacts.contract_start is
  'Início da vigência (matrícula, plano, assinatura). Serve para saber há quanto tempo é cliente — que é o argumento da renovação.';
comment on column public.contacts.contract_end is
  'Fim da vigência. Dispara as três janelas de renovação: 60 dias (falar do RESULTADO, sem mencionar renovação), 30 (abrir continuidade) e 7 (condição concreta).';


-- =====================================================================
-- VERIFICAÇÃO — as colunas existem.
-- =====================================================================
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'contacts'
   and column_name in ('contract_start', 'contract_end')
 order by column_name;
