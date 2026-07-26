-- =====================================================================
-- COS — MIGRATION 0013 : resposta pronta na biblioteca
--
-- A biblioteca do modelo MANUAL guarda a resposta pronta (o texto que o
-- vendedor copia), não só a estratégia. `answer` é esse texto. As entradas
-- de estratégia global (0004) seguem com answer nulo; as entradas prontas
-- por tenant preenchem answer.
--
-- O conteúdo curado (respostas) é o ATIVO — importado no banco, nunca
-- commitado em repositório. Aqui vai só a coluna.
-- =====================================================================

alter table public.knowledge_entries
  add column if not exists answer text;
