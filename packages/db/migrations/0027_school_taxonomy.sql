-- =====================================================================
-- COS — MIGRATION 0027 : ESCOLA DE VENDA COMO DIMENSÃO CANÔNICA (M1)
--
-- PROBLEMA: `knowledge_entries.technique` é texto livre. Levantamento de
-- ago/2026 encontrou 134 rótulos distintos para 134 entradas — impossível
-- medir, impossível aprender. E o CLAUDE.md manda: "Toda dimensão de
-- análise é enum, nunca texto livre." Estávamos violando a própria regra
-- justamente na dimensão que É o produto.
--
-- SOLUÇÃO EM DUAS PEÇAS:
--   1. `strategy_map` no MANIFESTO (categoria → escola), por segmento. É o
--      orquestrador de estratégia em dado. Por segmento porque Rackham
--      provou que fechamento por pressão sobe conversão em ticket baixo e
--      a DERRUBA em ticket alto: barbearia e indústria não podem responder
--      com a mesma escola.
--   2. `knowledge_entries.school` como OVERRIDE. NULL = "usa o padrão da
--      categoria". Só a exceção é gravada.
--
-- Resolução no motor:  entrada.school  ??  manifesto.strategy_map[categoria]
--
-- ONDE MORA CADA COISA (importante, e a primeira versão errou isto):
--   • o padrão por categoria → `strategy_map`, no manifesto do segmento;
--   • o override de uma entrada → a 17ª coluna do PRÓPRIO seed dela;
--   • esta migration → só a estrutura e o dicionário de escolas.
--
-- A primeira versão deste arquivo trazia os overrides como UPDATE por `ilike`
-- sobre o texto de `technique`. Funcionava e era gambiarra: recarregar uma
-- biblioteca (DELETE + INSERT) apagava tudo, e só um comentário lembrava de
-- rodar de novo. Regra em dois lugares = o repositório deixa de ser a verdade.
-- Agora o override é dado explícito no seed, e a recarga o preserva.
--
-- Ver: docs/blueprint/COS_Escolas_de_Venda.md
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. A coluna de override
-- ---------------------------------------------------------------------
alter table public.knowledge_entries
  add column if not exists school text;

alter table public.knowledge_entries
  drop constraint if exists knowledge_entries_school_check;

alter table public.knowledge_entries
  add constraint knowledge_entries_school_check
  check (school is null or school in (
    'consultiva_spin', 'persuasao_cialdini', 'negociacao_voss', 'challenger',
    'indecisao_jolt', 'cadencia_blount', 'relacionamento_carnegie',
    'fechamento_classico', 'oferta_valor'
  ));

comment on column public.knowledge_entries.school is
  'Escola de venda. NULL = usa o strategy_map do manifesto para a categoria.';

-- ---------------------------------------------------------------------
-- 2. Dicionário das escolas — o "mental" de cada uma, em dado
--
-- Isto NÃO é a curadoria (essa continua em knowledge_entries, protegida).
-- É dicionário de métodos publicados e conhecidos: o que a escola propõe,
-- quando usar, QUANDO NÃO USAR e o que a evidência sustenta. Por isso pode
-- ser lido pelo app — é o que o motor mostra ao vendedor quando explica a
-- abordagem, e é a espinha do módulo de curso.
-- ---------------------------------------------------------------------
create table if not exists public.sales_schools (
  key          text primary key,
  name         text not null,
  author       text not null,
  principle    text not null,   -- a ideia central em uma frase
  when_to_use  text not null,
  when_to_avoid text not null,  -- tão importante quanto: nenhuma escola serve sempre
  evidence     text not null,   -- forte | media | mista | pratica_de_campo
  evidence_note text not null,  -- honestidade sobre a força do dado
  created_at   timestamptz not null default now()
);

alter table public.sales_schools enable row level security;

drop policy if exists sales_schools_read on public.sales_schools;
create policy sales_schools_read on public.sales_schools
  for select to authenticated using (true);

drop policy if exists sales_schools_write on public.sales_schools;
create policy sales_schools_write on public.sales_schools
  for all to service_role using (true) with check (true);

delete from public.sales_schools;
insert into public.sales_schools
  (key, name, author, principle, when_to_use, when_to_avoid, evidence, evidence_note)
values
('consultiva_spin', 'Venda consultiva', 'Neil Rackham',
 'Entender antes de convencer: a pergunta de implicacao (o que esse problema te custa) e o que separa o melhor vendedor do mediano.',
 'Sempre que houver diagnostico a fazer: preco, especificacao, escolha de plano, mix. E a escola padrao de quase todo primeiro contato.',
 'Quando o cliente ja decidiu e so quer executar. Interrogatorio depois da decisao vira atrito.',
 'forte',
 '35 mil visitas de venda observadas em 12 paises. E a pesquisa mais seria ja feita em vendas.'),

('persuasao_cialdini', 'Persuasao', 'Robert Cialdini',
 'Decisao humana segue atalhos: reciprocidade, prova social, autoridade, compromisso, afinidade, unidade e escassez.',
 'Prova de competencia, primeira experiencia (o pequeno sim), amostra, brinde e indicacao.',
 'Escassez inventada. E o principio mais fraco da lista e o que mais destroi confianca quando o cliente descobre.',
 'mista',
 'Autoridade e prova social resistiram bem. Pe-na-porta tem efeito pequeno (r = 0,17) e escassez fabricada e o mais fraco de todos.'),

('negociacao_voss', 'Negociacao', 'Chris Voss',
 'Negociar nao e vencer: e descobrir a objecao verdadeira. Nomear a emocao baixa a temperatura antes de qualquer argumento.',
 'Objecao, impasse, preco sob pressao. Rotular ("parece que o prazo e o que mais preocupa") e perguntar como fazer funcionar.',
 'Quando nao ha objecao real. Rotular emocao inexistente soa como tecnica e queima a confianca.',
 'pratica_de_campo',
 'Experiencia de negociacao do FBI mais do que ensaio controlado; a literatura de tomada de perspectiva sustenta a direcao.'),

('challenger', 'Desafiar a premissa', 'Matthew Dixon',
 'Em venda complexa, o melhor vendedor ensina algo que o cliente ainda nao tinha percebido, em vez de so atender ao pedido.',
 'B2B tecnico, comite de compra, cliente que pede preco antes de descrever o problema.',
 'B2C de ticket baixo e cliente apressado. Nem todo comprador quer ser educado — as vezes ele so quer o horario.',
 'media',
 'Dados proprietarios da CEB, criticados por universalismo: e a metodologia medindo a si mesma.'),

('indecisao_jolt', 'Vencer a indecisao', 'Matthew Dixon (JOLT)',
 'O cliente nao sumiu por preco: ele travou por medo de errar. Reduzir o risco percebido vale mais que reforcar o argumento.',
 'Cliente que some depois do orcamento, adia sem motivo claro, pede mais opcoes ou mais tempo.',
 'Antes de existir decisao. Nao se combate indecisao em quem ainda nao entendeu o problema.',
 'forte',
 '2,5 milhoes de chamadas analisadas: 40 a 60% das perdas sao indecisao, nao concorrente. Insistir no argumento piorou o desfecho em 84% dos casos.'),

('cadencia_blount', 'Cadencia e prospeccao', 'Jeb Blount',
 'A maior causa de falta de venda e falta de contato consistente. Constancia vence talento.',
 'Follow-up, retomada, reativacao, reposicao. Toda etapa em que o silencio e o inimigo.',
 'Repetir a mesma mensagem. Cadencia sem angulo novo vira perseguicao e queima a conta.',
 'media',
 'A direcao tem base solida; os numeros que circulam ("80% das vendas entre o 5o e o 12o contato") sao folclore sem fonte rastreavel.'),

('relacionamento_carnegie', 'Relacionamento', 'Dale Carnegie',
 'Interesse genuino, escuta e nunca humilhar. Descreve gente, nao mercado — por isso nao envelhece.',
 'Acolhimento, medo, reclamacao, limite etico, parceiro de canal. Sempre que a confianca vier antes da tecnica.',
 'Como substituto de diagnostico. Simpatia sem descoberta nao fecha venda tecnica.',
 'media',
 'Observacao clinica consolidada por quase um seculo de pratica, com apoio da literatura de rapport.'),

('fechamento_classico', 'Fechamento', 'Ziglar, Hopkins e Tracy',
 'Conduzir a decisao: emocao decide, logica justifica. Duas opcoes fecham mais que uma pergunta aberta.',
 'Ticket baixo e decisao rapida: escolher horario, marcar experimental, confirmar presenca.',
 'Ticket alto e ciclo longo. Rackham mostrou que fechamento por pressao REDUZ a conversao conforme o valor sobe.',
 'mista',
 'Eficaz em venda pequena e contraproducente em venda grande — foi um dos achados centrais da pesquisa de Rackham.'),

('oferta_valor', 'Montagem de oferta', 'Alex Hormozi e Daniel Kahneman',
 'O valor percebido cresce quando o risco e o sacrificio caem; e perder pesa mais do que ganhar o equivalente.',
 'Preco, pedido de entrada, condicao, garantia, faseamento, comparacao de custo total.',
 'Como desconto disfarcado. Baixar preco na primeira pressao nao e oferta, e margem entregue.',
 'forte',
 'A aversao a perda (Kahneman e Tversky) e dos achados mais replicados da economia comportamental; a parte de montagem de oferta e pratica de mercado.');

-- ---------------------------------------------------------------------
-- 3. O que NÃO está aqui, de propósito
--
-- • As 2 entradas da barbearia que estavam na categoria `policies` foram
--   corrigidas no próprio `0017` (viraram `availability` e `retention`).
--   Corrigir no seed e não por UPDATE aqui é o que faz um ambiente novo
--   nascer certo, em vez de nascer errado e ser consertado depois.
-- • Os overrides de escola moram na 17ª coluna dos seeds `0004` e `0026`.
--
-- Quem já tinha o banco populado antes desta migration: recarregue as duas
-- bibliotecas para trazer o dado novo —
--   node scripts/seed-knowledge.mjs packages/db/migrations/0004_seed_knowledge_academia.sql
--   node scripts/seed-knowledge.mjs packages/db/migrations/0026_seed_knowledge_industria.sql
--   node scripts/seed-knowledge.mjs packages/db/migrations/0017_seed_knowledge_barbearia.sql
-- ---------------------------------------------------------------------
