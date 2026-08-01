-- =====================================================================
-- COS — MIGRATION 0021 : BIBLIOTECA DE PROJETOS SOB MEDIDA
--
-- Marcenaria, vidraçaria, serralheria, esquadrias, marmoraria, solar.
-- O segmento mais arcaico do país em técnica de vendas.
--
-- FUNDAMENTO (pesquisa jul/2026):
--   • Mais de 70% dos orçamentos deste setor NUNCA recebem uma segunda
--     mensagem. Não se perde por preço — perde-se por silêncio.
--   • "Orçamento tratado como venda, e não como PDF, transforma a taxa de
--     conversão." Quem apresenta vence quem envia e espera.
--   • Cadência que funciona: 3 toques em 15 dias (3, 7 e 15), cada um com
--     ÂNGULO DIFERENTE — dúvida do projeto, condição de pagamento, ajuste
--     de escopo. Repetir o mesmo argumento não move ninguém.
--   • O valor exato só existe DEPOIS da medição — é ali que a venda
--     consultiva acontece.
--   • Visita técnica gratuita para quem só pesquisava preço é prejuízo
--     puro (combustível, tempo, conhecimento). Qualificar antes é dinheiro.
--   • Em solar, o que trava não é preço, é FLUXO DE CAIXA: o argumento é
--     payback contra o custo de seguir pagando conta cheia por 25 anos.
--   • Cliente antigo é fonte de novo serviço (manutenção, outro ambiente).
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'sob_medida' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status)
values

(null, 'sob_medida', 'pricing', 'reactive',
 '{"quanto custa o metro","quanto fica","qual o valor","me passa um preco","quanto custa mais ou menos","preco do m2"}',
 null,
 'Preco por mensagem, sem medir, e a maior armadilha do ramo: voce erra a
margem, cria expectativa falsa e vira "o caro" quando o valor real aparecer.
NAO chute. Explique em UMA linha por que o valor depende do projeto (medida,
material, ferragem, acabamento) — a pessoa aceita bem quando entende o motivo.
Se voce trabalha com faixa de investimento, informe a FAIXA: isso qualifica sem
comprometer e afasta quem nao tem verba, poupando sua visita.
Termine oferecendo a visita com dois horarios. O objetivo aqui e a medicao, nao
o fechamento.',
 '{"pricing.como_cobra"}', '{"pricing.range","availability.prazo_visita","risk_free_entry.visita_gratuita"}', '{}', 'escalate',
 'Ancoragem por faixa + conducao a medicao (o valor nasce na visita)',
 '{"Chutar preco por metro: destroi margem e credibilidade","Fugir da pergunta sem explicar o porque: parece enrolacao","Nao oferecer a visita e deixar a conversa morrer"}',
 'agendar_visita', 'skill_seed', 'active'),

(null, 'sob_medida', 'risk_free_entry', 'reactive',
 '{"voces vao ate la","cobra a visita","tem taxa de visita","atende minha regiao","voce vem medir","como funciona a medicao"}',
 null,
 'A visita e seu ativo mais caro: combustivel, tempo e conhecimento tecnico.
Antes de agendar, qualifique com duas ou tres perguntas rapidas — o que
precisa, para quando e em que fase esta a obra. Quem so pesquisa preco se revela
aqui, e voce economiza um deslocamento perdido.
Informe com clareza se a visita e gratuita ou tem valor (e se abate no
fechamento). Cobrar visita nao afasta cliente serio; afasta curioso.
Diga tambem o que acontece na visita — medicao, fotos, mostrar materiais. Quem
entende o que vai ganhar, comparece.',
 '{"risk_free_entry.visita_gratuita","risk_free_entry.raio_atendimento"}',
 '{"risk_free_entry.valor_visita","risk_free_entry.o_que_leva","availability.prazo_visita"}', '{}', 'escalate',
 'Qualificacao antes do deslocamento + valor percebido da visita',
 '{"Sair para medir sem qualificar: prejuizo garantido com curioso","Nao dizer que cobra e o cliente descobrir depois","Agendar sem confirmar a regiao"}',
 'agendar_visita', 'skill_seed', 'active'),

(null, 'sob_medida', 'commitment_offer', 'proactive',
 '{"mandou o orcamento","recebeu a proposta","enviei o orcamento","cliente nao respondeu o orcamento","segue o orcamento"}',
 null,
 'ESTA E A ENTRADA MAIS IMPORTANTE DO SEGMENTO. Mais de 70% dos orcamentos
deste ramo nunca recebem uma segunda mensagem — e e ai que a venda morre.
Orcamento nao e arquivo, e VENDA. Sempre que possivel, apresente (chamada,
video ou presencial) em vez de so enviar: quem explica em 20 minutos ganha de
quem manda PDF e espera.
Se ja enviou, siga a cadencia dos 3 toques em 15 dias, com ANGULO DIFERENTE em
cada: (1) tirar duvida do projeto, (2) condicao de pagamento, (3) ajuste de
escopo ou etapa inicial menor. Repetir "conseguiu ver o orcamento?" tres vezes
nao move ninguem.
Nunca pressione por decisao — pergunte o que ficou em aberto.',
 '{"pricing.parcelamento"}', '{"expertise_proof.garantia","availability.prazo_entrega","differentials.items"}', '{}', 'escalate',
 'Cadencia de 3 toques com angulo diferente (o antidoto do silencio)',
 '{"Enviar o orcamento e esperar o cliente voltar","Repetir a mesma pergunta a cada toque","Sumir depois de uma unica tentativa","Cobrar decisao (\"e ai, fechou?\")"}',
 'retomar_orcamento', 'skill_seed', 'active'),

(null, 'sob_medida', 'objections', 'reactive',
 '{"ta caro","achei caro","muito caro","fora do orcamento","nao esperava esse valor"}',
 null,
 '"Caro" quase nunca e sobre o numero — e sobre nao enxergar o que esta incluso.
NAO baixe o preco de cara: desconto reflexo desvaloriza o trabalho e ensina o
cliente a barganhar em tudo.
Abra o que esta dentro do valor: material, ferragem, acabamento, instalacao,
garantia, assistencia. Compare o que a peca entrega ao longo dos anos, nao o
preco de hoje — sob medida se compara por durabilidade, nao por metro.
Se o valor realmente nao cabe, ofereca ETAPAS: comecar pelo ambiente principal e
fazer o resto depois. Projeto comecado vale mais que orcamento perfeito
recusado.',
 '{"expertise_proof.garantia"}', '{"differentials.items","pricing.parcelamento","policies.assistencia"}', '{}', 'escalate',
 'Abertura de escopo + comparacao por durabilidade + faseamento',
 '{"Dar desconto na primeira objecao","Justificar com o proprio custo: o cliente nao paga o seu custo","Insistir no projeto inteiro quando ele ja disse que nao cabe"}',
 'defender_valor', 'skill_seed', 'active'),

(null, 'sob_medida', 'objections', 'reactive',
 '{"achei mais barato","outro cobrou menos","tenho outro orcamento","o concorrente fez por"}',
 null,
 'NUNCA fale mal do concorrente — soa pequeno e ainda defende o outro.
Em sob medida, orcamentos so parecem iguais quando ninguem abre o escopo. Peca
para comparar item a item e mostre o SEU: espessura do material, marca da
ferragem, se a instalacao esta inclusa, prazo, garantia e quem executa (equipe
propria ou terceiro).
Na maioria das vezes a diferenca de preco tem uma explicacao tecnica — e o
cliente prefere saber disso antes de descobrir depois da instalacao.
Se ainda assim ele quiser o mais barato, deixe a porta aberta com elegancia.
Cliente que volta depois de um servico ruim fecha sem discutir preco.',
 '{"differentials.items"}', '{"expertise_proof.garantia","expertise_proof.tempo_de_casa","differentials.marcas"}', '{}', 'escalate',
 'Comparacao item a item (nunca ataque ao concorrente)',
 '{"Falar mal do concorrente","Baixar para igualar o preco sem tirar escopo","Nao explicar a diferenca tecnica e virar so \"o mais caro\""}',
 'defender_valor', 'skill_seed', 'active'),

(null, 'sob_medida', 'objections', 'reactive',
 '{"vou pensar","preciso pensar","depois te falo","vou ver e te retorno","qualquer coisa eu chamo"}',
 null,
 '"Vou pensar" quase nunca e recusa — e duvida nao resolvida ou dinheiro.
Nao aceite passivamente e nao pressione. Pergunte de forma direta e leve o que
especificamente ficou em aberto: o projeto, o valor ou o prazo. A resposta
revela a objecao REAL, que quase sempre e diferente da que ele disse.
Depois, combine um retorno com DATA ("te chamo quinta, pode ser?"). Deixar em
aberto e o mesmo que perder.
Nunca encerre com "qualquer coisa estou a disposicao": isso transfere o trabalho
para quem ja esta em duvida.',
 '{}', '{"pricing.parcelamento","availability.prazo_entrega"}', '{}', 'omit',
 'Isolamento da objecao real + retorno com data marcada',
 '{"Aceitar o \"vou pensar\" e sumir","Pressionar por decisao imediata","Encerrar sem combinar o proximo contato"}',
 'agendar_retorno', 'skill_seed', 'active'),

(null, 'sob_medida', 'availability', 'reactive',
 '{"quanto tempo demora","qual o prazo","pra quando fica pronto","consegue pra esse mes","tenho pressa"}',
 null,
 'Prazo e a segunda maior causa de perda neste ramo — e prometer o que a
producao nao entrega custa mais caro que perder a venda.
Informe os TRES prazos separados, porque o cliente confunde: quando voce vai
medir, quando entrega o orcamento e quanto leva a execucao apos a aprovacao.
Nunca prometa data de execucao sem conferir a agenda de producao.
Se ele tem urgencia real, isso e sinal de compra: priorize o atendimento e
ofereca a visita mais proxima possivel.',
 '{"availability.prazo_entrega","availability.prazo_visita"}', '{"availability.prazo_orcamento"}', '{}', 'escalate',
 'Separacao dos tres prazos + urgencia como sinal de compra',
 '{"Prometer prazo sem conferir a producao","Dar um prazo unico e generico","Ignorar o sinal de urgencia"}',
 'agendar_visita', 'skill_seed', 'active'),

(null, 'sob_medida', 'catalog', 'reactive',
 '{"voces fazem","trabalham com","tem esse modelo","faz em vidro","tem em aluminio","fazem instalacao"}',
 null,
 'Confirme se voce executa aquilo usando SOMENTE a lista do DNA — e diga com
naturalidade quando NAO faz. Aceitar servico que voce nao domina gera obra
problematica, atraso e prejuizo de imagem.
Nao faz? Indique um parceiro se houver: honestidade aqui gera indicacao futura.
Faz? Confirme o material, diga o que costuma influenciar no valor e conduza para
a visita, que e onde o escopo real aparece.',
 '{"catalog.items"}', '{"catalog.nao_faz","differentials.marcas","risk_free_entry.raio_atendimento"}', '{}', 'escalate',
 'Confirmacao factual + honestidade sobre limites + conducao a visita',
 '{"Aceitar servico que nao domina para nao perder o cliente","Prometer material sem confirmar fornecedor","Nao aproveitar para agendar"}',
 'agendar_visita', 'skill_seed', 'active'),

(null, 'sob_medida', 'goal_matching', 'reactive',
 '{"nao sei o que fica melhor","o que voce indica","qual material","vale a pena","o que voce faria"}',
 null,
 'Pergunta de indicacao e o momento de virar consultor, nao vendedor. E aqui que
voce ganha do concorrente que so manda preco.
Antes de indicar, entenda o uso: quantas pessoas usam, se pega sol ou umidade,
se tem crianca, quanto tempo pretende ficar no imovel. A recomendacao certa vem
do uso, nao do catalogo.
Depois indique com o MOTIVO tecnico ("nesse ambiente eu usaria X porque Y") e
mostre o que muda no valor. Cliente que entende o porque compra melhor e
reclama menos.
Nunca empurre o mais caro sem justificativa de uso.',
 '{}', '{"catalog.items","differentials.marcas","differentials.items"}', '{}', 'omit',
 'Venda consultiva por uso (o diferencial contra quem so manda preco)',
 '{"Indicar o mais caro por padrao","Indicar sem entender o uso","Responder com catalogo em vez de recomendacao"}',
 'agendar_visita', 'skill_seed', 'active'),

(null, 'sob_medida', 'expertise_proof', 'reactive',
 '{"voces sao confiaveis","tem garantia","ja fizeram parecido","tem foto de trabalho","quem instala","quanto tempo de mercado"}',
 null,
 'Sob medida e compra de alto risco percebido: o cliente paga adiantado por algo
que ainda nao existe, feito por alguem que ele nao conhece, dentro da casa dele.
Reduza esse medo com FATOS do DNA: tempo de mercado, obras de referencia, quem
executa (equipe propria ou terceirizada) e a garantia por escrito.
Ofereca mostrar trabalhos parecidos com o dele — semelhanca convence mais que
volume. Se voce faz projeto em 3D, mencione: ver antes de produzir elimina boa
parte do medo.
Fato tranquiliza; adjetivo ("somos os melhores") aumenta a desconfianca.',
 '{"expertise_proof.tempo_de_casa","expertise_proof.garantia"}',
 '{"expertise_proof.obras_referencia","expertise_proof.equipe","differentials.projeto_3d"}', '{}', 'escalate',
 'Reducao de risco por prova concreta (o medo e o obstaculo real)',
 '{"Responder com adjetivo em vez de prova","Prometer garantia diferente da real","Nao oferecer referencia parecida com o caso dele"}',
 'agendar_visita', 'skill_seed', 'active'),

(null, 'sob_medida', 'reciprocity', 'proactive',
 '{"confirmar visita","lembrete de visita","vespera da medicao","voce vai estar em casa","posso ir amanha"}',
 null,
 'Visita perdida e prejuizo direto: combustivel, tempo e uma janela de agenda que
nao volta.
Confirme na vespera, curto e objetivo: dia, hora, quanto tempo leva e quem vai.
Peca uma confirmacao de uma palavra — quanto menor o esforco, maior a taxa.
Aproveite para pedir o que agiliza a medicao (acesso ao ambiente, planta se
houver, decisao de quem participa). Visita com o decisor presente converte muito
mais do que visita com quem so vai repassar depois.
Se ele nao puder, ja ofereca outra data na mesma mensagem.',
 '{}', '{"risk_free_entry.o_que_leva","availability.prazo_visita"}', '{}', 'omit',
 'Confirmacao de vespera + garantir a presenca do decisor',
 '{"Nao confirmar e perder a viagem","Ir sem saber se o decisor estara presente","Confirmar em cima da hora"}',
 'confirmar_visita', 'skill_seed', 'active'),

(null, 'sob_medida', 'ecosystem', 'reactive',
 '{"meu arquiteto","a arquiteta pediu","o engenheiro indicou","trabalham com arquiteto","tem comissao para indicacao"}',
 null,
 'Arquiteto, engenheiro e construtora sao o canal mais valioso deste ramo: quem
tem o profissional do lado recebe obra recorrente, com cliente pre-convencido e
menos disputa de preco.
Trate o profissional como parceiro, nao como intermediario: respeite o projeto
dele, comunique alteracoes antes de executar e nunca passe por cima para falar
so com o cliente final — isso queima a fonte para sempre.
Se ha politica de parceria ou comissao, seja transparente. Se nao ha, ofereca o
que ele mais valoriza: cumprir prazo e nao dar problema na obra dele.',
 '{}', '{"expertise_proof.obras_referencia","differentials.items"}', '{}', 'omit',
 'Canal profissional como fonte recorrente (respeitar o projeto e a relacao)',
 '{"Passar por cima do arquiteto para falar direto com o cliente","Alterar o projeto sem avisar","Tratar o profissional como obstaculo"}',
 'cultivar_parceria', 'skill_seed', 'active'),

(null, 'sob_medida', 'retention', 'proactive',
 '{"cliente antigo","ja fiz servico para ele","faz tempo que instalei","ampliar o projeto","outro ambiente"}',
 null,
 'Quem ja comprou de voce e o lead mais barato e mais quente que existe — e a
maioria das empresas deste ramo nunca mais fala com o cliente depois de entregar.
Retome com um gancho concreto e util: revisao do que foi instalado, manutencao
preventiva, ou o ambiente que ficou para depois ("na epoca voce comentou da
area externa").
Nao mande promocao generica. A forca aqui e a memoria: mostrar que voce lembra
do projeto dele vale mais que desconto.
Peca indicacao no momento certo — logo apos um elogio, nunca durante negociacao.',
 '{}', '{"catalog.items","policies.assistencia"}', '{}', 'omit',
 'Reativacao por memoria do projeto (o lead mais barato que existe)',
 '{"Nunca mais falar com quem ja comprou","Mandar promocao generica","Pedir indicacao antes de entregar valor"}',
 'reativar_cliente', 'skill_seed', 'active'),

(null, 'sob_medida', 'limits_and_ethics', 'reactive',
 '{"da pra fazer mais barato","tira uma parte","faz sem nota","consegue um jeitinho","material mais simples"}',
 null,
 'Baixar preco tirando qualidade escondido do cliente e o caminho mais rapido
para o problema: a obra volta, a garantia vira prejuizo e a indicacao morre.
Se o cliente pede mais barato, seja transparente sobre o que MUDA: material,
espessura, ferragem, acabamento ou prazo. Ele tem direito de escolher — mas
com a informacao na mao.
Reduzir escopo e legitimo; reduzir qualidade sem avisar, nao.
Nunca prometa nota fiscal, garantia ou condicao que a empresa nao pratica.',
 '{}', '{"pricing.como_cobra","expertise_proof.garantia","policies.alteracao_escopo"}', '{}', 'omit',
 'Transparencia sobre trade-off (reduzir escopo, nunca qualidade escondida)',
 '{"Baixar o material sem avisar para fechar o preco","Prometer condicao fiscal que nao existe","Aceitar prazo impossivel para nao perder"}',
 'ajustar_escopo', 'skill_seed', 'active'),

(null, 'sob_medida', 'availability', 'reactive',
 '{"oi","ola","bom dia","boa tarde","boa noite","gostaria de um orcamento","preciso de um orcamento"}',
 null,
 'Pedido de orcamento e o inicio de tudo neste ramo — e a maioria responde com
"me manda as medidas", jogando o trabalho no cliente.
Faca diferente: cumprimente, pergunte O QUE ele quer resolver e para quando, e
ja indique o caminho (visita para medir). Duas ou tres perguntas curtas
qualificam e mostram profissionalismo.
Responda RAPIDO. Neste setor o primeiro que responde bem costuma levar a obra —
o cliente pediu orcamento para tres empresas no mesmo dia.',
 '{}', '{"availability.prazo_visita","risk_free_entry.raio_atendimento"}', '{}', 'omit',
 'Abertura com qualificacao + velocidade de resposta como vantagem',
 '{"Pedir que o cliente mande as medidas: e seu trabalho, nao dele","Responder horas depois","Comecar pelo preco antes de saber o que ele quer"}',
 'qualificar', 'skill_seed', 'active');
