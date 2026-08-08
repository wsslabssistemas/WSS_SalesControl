-- 0053 — TELEFONE NÃO É IDENTIDADE
--
-- O QUE ACONTECEU
-- Na importação dos 368 planos da Be Fitness, 324 inserções falharam em
-- `ux_contacts_tenant_phone`. A causa não foi dado sujo: **12 telefones são
-- compartilhados por duas pessoas diferentes, e as duas são alunas pagantes.**
--
--   Fabiana da Cunha Lagoas  +  Francisco Thaso da Cunha Lagoas
--   Esther Elisabeth Arndt   +  Volmar Rosa da Costa
--   Silvana Cunha Pacheco    +  Rodrigo dos Santos
--
-- São casais e famílias. Em academia de bairro isso não é exceção: é mãe e
-- filho, marido e mulher, dois irmãos. O índice único dizia "um telefone, uma
-- pessoa", e isso é FALSO no mundo que o produto modela.
--
-- POR QUE O ÍNDICE EXISTIA, E POR QUE ISSO NÃO SE PERDE
-- Ele era a trava contra importar a mesma pessoa duas vezes. A intenção estava
-- certa; a chave é que estava errada. Identidade de aluno é o **código do
-- sistema da academia**, não o telefone — e é por ele que a trava passa a ser
-- feita, com índice único parcial.
--
-- Onde não houver código, a proteção continua existindo na aplicação:
-- `importar-planos.mjs` casa por código, depois por telefone (nas quatro
-- formas em que ele pode estar gravado) antes de decidir criar alguém.
--
-- A LIÇÃO, que vale além deste caso: **restrição de banco afirma um fato sobre
-- o mundo.** Quando ela quebra com dado real e legítimo, a pergunta certa não
-- é como contornar — é se o fato afirmado era verdade. Aqui não era.

-- 1. O telefone deixa de ser único, mas continua INDEXADO: ele é o caminho de
--    busca mais usado do sistema (o webhook do WhatsApp chega com um número e
--    precisa achar de quem é).
drop index if exists ux_contacts_tenant_phone;

create index if not exists ix_contacts_tenant_phone
  on contacts (tenant_id, phone)
  where phone is not null;

-- 2. A identidade real: o código do cadastro no sistema de origem. Parcial
--    porque contato criado dentro do produto (lead que chegou pelo WhatsApp)
--    não tem código — e não ter código não pode impedir de existir.
create unique index if not exists ux_contacts_tenant_codigo_sistema
  on contacts (tenant_id, (custom->>'codigo_sistema'))
  where custom->>'codigo_sistema' is not null;
