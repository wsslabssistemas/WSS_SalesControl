-- 0059 — NÃO CONTATAR
--
-- POR QUE
-- O fundador rodou a primeira simulação da reativação e leu a lista em voz
-- alta. Três dos nove nomes não eram ex-alunos:
--
--   • **Gympass** e **Total Pass Participações LTDA** — empresas de convênio.
--     Estão na base porque PAGAM a academia.
--   • **Cinara** — aluga uma sala. Também está na base porque paga.
--
-- Nenhum dos três é pessoa para trazer de volta, e mandar "você já treinou com
-- a gente e acabou parando" para o financeiro de um convênio é o tipo de erro
-- que não quebra tela nenhuma: ele chega em quem paga, no nome da academia.
--
-- E o mesmo campo resolve outros dois casos que ele levantou na mesma frase:
-- quem pagou **aula avulsa** (turista de passagem, que nunca foi aluno) e —
-- o mais importante — **quem pede para não receber mais mensagem**.
--
-- ⚠ POR QUE UMA COLUNA, E NÃO UMA ETAPA DA JORNADA
--
-- A tentação é mover o Gympass para `recusou` (terminal) e pronto. Seria
-- errado: etapa descreve ONDE a pessoa está na venda, e o Gympass não está em
-- lugar nenhum da venda — ele é um pagador institucional. Usar etapa como
-- lixeira estragaria o funil, a conversão e a carteira, que são calculados por
-- etapa.
--
-- Além disso, "não contatar" é ORTOGONAL à etapa: um aluno ATIVO pode pedir
-- para não receber mensagem e continuar sendo aluno ativo. Duas perguntas
-- diferentes precisam de dois campos.
--
-- ⚠ E POR QUE ISTO É OBRIGAÇÃO, NÃO CONVENIÊNCIA
--
-- Honrar pedido de descadastro é exigência da LGPD e da própria política do
-- WhatsApp. Continuar mandando para quem pediu para parar é o caminho mais
-- curto para a denúncia — e denúncia derruba a qualidade do número, que afeta
-- a entrega de TUDO, inclusive a renovação de quem paga em dia. O prejuízo não
-- fica contido na pessoa que reclamou.

alter table contacts
  add column if not exists do_not_contact boolean not null default false,
  add column if not exists do_not_contact_reason text,
  add column if not exists do_not_contact_at timestamptz;

comment on column contacts.do_not_contact is
  'Nao entra em nenhuma lista de contato proativo. Ortogonal a etapa: aluno ativo pode pedir para nao receber e continuar aluno ativo. Usado para pedido de descadastro (LGPD), pagador institucional (convenio, aluguel) e quem nunca foi cliente de fato.';
comment on column contacts.do_not_contact_reason is
  'POR QUE ele nao recebe, em texto livre. Sem isto a marcacao vira um booleano orfao que ninguem tem coragem de desfazer — e reverter uma marcacao errada fica impossivel de justificar.';
comment on column contacts.do_not_contact_at is
  'Quando foi marcado. Pedido de descadastro precisa de data para ser defensavel.';

-- Índice PARCIAL: a esmagadora maioria e `false` e nao deve pesar. Mesma razao
-- do `external_id` no 0052.
create index if not exists ix_contacts_nao_contatar
  on contacts (tenant_id)
  where do_not_contact;

-- ---------------------------------------------------------------------
-- A DATA ANDA JUNTO DA MARCA
--
-- Trigger e nao "lembrar de preencher": a marcacao vai acontecer de tres
-- lugares diferentes (botao da simulacao, ficha do contato, e o webhook quando
-- a pessoa pede para sair). Deixar a data por conta de quem chama garante que
-- um dos tres vai esquecer — e o que esquecer sera justamente o automatico,
-- que e o unico com valor juridico.
-- ---------------------------------------------------------------------

create or replace function public.carimba_nao_contatar()
returns trigger
language plpgsql
as $$
begin
  if new.do_not_contact and not coalesce(old.do_not_contact, false) then
    new.do_not_contact_at := now();
  elsif not new.do_not_contact then
    -- Desmarcou: limpa data e motivo, senao a ficha fica dizendo que a pessoa
    -- pediu para sair quando ela nao pediu mais.
    new.do_not_contact_at := null;
    new.do_not_contact_reason := null;
  end if;
  return new;
end;
$$;

drop trigger if exists t_carimba_nao_contatar on public.contacts;
create trigger t_carimba_nao_contatar
  before insert or update on public.contacts
  for each row
  execute function public.carimba_nao_contatar();
