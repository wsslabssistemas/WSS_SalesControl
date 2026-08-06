-- =====================================================================
-- COS — MIGRATION 0044 : DESFECHO CANÔNICO
--
-- Feita no dia em que o dado real chegou (piloto Base44 da Be Fitness:
-- 274 clientes, 1.053 atendimentos com resultado registrado). O dado
-- expôs dois defeitos no modelo, e os dois são de graça para corrigir
-- agora porque o COS tem **zero** desfechos gravados. Nunca mais vai ser
-- tão barato.
--
-- DEFEITO 1 — A ENUM ESMAGAVA AS DUAS PERDAS NUMA SÓ.
-- O COS aceitava `sumiu` e nada mais para perda. O piloto distingue
-- `nao_respondeu` (silêncio) de `desistiu` (disse não), e essas são
-- exatamente as duas metades da tese do produto:
--   • perder por SILÊNCIO é falha de follow-up — tem conserto barato, e é
--     a lacuna que originou o COS (+70% dos orçamentos sem 2ª mensagem);
--   • perder por DECISÃO é objeção ou indecisão — é outro remédio, e o
--     JOLT mostrou que tratar um como o outro piora o desfecho.
-- Colapsar os dois tornaria o M2 incapaz de responder a única pergunta
-- que interessa: "perdemos por silêncio ou por decisão?".
--
-- DEFEITO 2 — A ENUM VIOLAVA A LEI 1.
-- `matriculou` e `marcou_visita` são vocabulário de ACADEMIA dentro do
-- núcleo. Uma barbearia não matricula; uma indústria não marca visita
-- para fechar. O núcleo nunca conhece segmento — e aqui ele conhecia.
--
-- A ENUM CANÔNICA, em vocabulário de PROCESSO (que é a técnica, o
-- produto) e não de mercado:
--   respondeu        — houve resposta, a conversa está viva
--   avancou          — moveu de etapa (visita marcada, experimental, teste)
--   ganhou           — converteu (matrícula, pedido, contrato, reserva)
--   perdeu_decisao   — disse não
--   perdeu_silencio  — parou de responder
--
-- O RÓTULO continua sendo do ramo: a tela lê `vocabulary.conversion` do
-- manifesto para dizer "Matriculou" na academia e "Fechou o pedido" na
-- indústria. Chave canônica no banco, palavra do ramo na tela — a mesma
-- regra que já vale para categoria, escola e qualificação de compra.
-- =====================================================================

-- Confere que não há nada a migrar. Se houver, a carga para antes de
-- destruir dado — melhor falhar aqui do que descobrir depois.
do $$
declare n int;
begin
  select count(*) into n from public.interactions where outcome is not null;
  if n > 0 then
    raise exception 'Existem % desfechos gravados. Migre-os antes de trocar a enum.', n;
  end if;
end $$;

alter table public.interactions drop constraint if exists interactions_outcome_check;

alter table public.interactions
  add constraint interactions_outcome_check
  check (outcome in ('respondeu','avancou','ganhou','perdeu_decisao','perdeu_silencio'));

comment on column public.interactions.outcome is
  'Desfecho canônico, em vocabulário de processo (Lei 1): respondeu | avancou | ganhou | perdeu_decisao | perdeu_silencio. O rótulo na tela vem do vocabulário do manifesto. Separar perdeu_silencio de perdeu_decisao é o que permite responder "perdemos por falta de follow-up ou por objeção?".';
