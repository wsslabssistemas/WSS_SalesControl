-- 0052 — IDENTIDADE EXTERNA DA INTERAÇÃO
--
-- POR QUE
-- A Meta REENVIA o webhook quando não recebe 200 dentro do prazo dela. Isso é
-- comportamento normal e frequente — um pico de latência na Vercel basta. Sem
-- uma chave de deduplicação, a mesma frase do cliente entra duas vezes no
-- histórico.
--
-- E duplicata aqui não é sujeira cosmética. `interactions` é a base de:
--   - tempo de resposta (mediana e p90) na Gestão,
--   - "esfriando", que mede silêncio,
--   - a contagem de atendimentos, que é COMO O PRODUTO COBRA.
-- Ou seja: reenvio não tratado infla a fatura do cliente e estraga a única
-- métrica que o produto vende. O tipo de erro que aparece três meses depois,
-- numa reclamação sobre a conta, sem ninguém saber de onde veio.
--
-- POR QUE `NULL` É PERMITIDO E POR QUE O ÍNDICE É PARCIAL
-- A esmagadora maioria das interações não vem de fora: o que o vendedor cola
-- no Responder, o toque da fila, o registro manual. Essas não têm — e não
-- deveriam ter — identificador externo. Um índice único comum trataria vários
-- `NULL` como distintos no Postgres (o que funcionaria), mas o índice PARCIAL
-- deixa a intenção explícita e não carrega 2.100 linhas nulas.
--
-- POR QUE A UNICIDADE INCLUI `tenant_id`
-- O identificador é único dentro da conta da Meta, não no mundo. Duas empresas
-- com contas diferentes poderiam, em tese, colidir. Mais importante: é a Lei 3
-- — nenhuma chave deste banco atravessa empresa.

alter table interactions
  add column if not exists external_id text;

comment on column interactions.external_id is
  'Identificador da mensagem no provedor externo (wamid do WhatsApp). NULL para interação criada dentro do produto. Serve para o webhook ser idempotente quando a Meta reenvia.';

create unique index if not exists interactions_tenant_external_id_key
  on interactions (tenant_id, external_id)
  where external_id is not null;
