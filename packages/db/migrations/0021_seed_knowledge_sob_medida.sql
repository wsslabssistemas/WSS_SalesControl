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
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

(null, 'sob_medida', 'pricing', 'reactive',
 '{"quanto custa o metro","quanto fica","qual o valor","me passa um preço","quanto custa mais ou menos","preço do m2"}',
 null,
 'Preço por mensagem, sem medir, é a maior armadilha do ramo: você erra a
margem, cria expectativa falsa e vira "o caro" quando o valor real aparecer.
NÃO chute. Explique em UMA linha por que o valor depende do projeto (medida,
material, ferragem, acabamento) — a pessoa aceita bem quando entende o motivo.
Se você trabalha com faixa de investimento, informe a FAIXA: isso qualifica sem
comprometer e afasta quem não tem verba, poupando sua visita.
Termine oferecendo a visita com dois horários. O objetivo aqui é a medição, não
o fechamento.',
 '{"pricing.como_cobra"}', '{"pricing.range","availability.prazo_visita","risk_free_entry.visita_gratuita"}', '{}', 'escalate',
 'Ancoragem por faixa + condução a medição (o valor nasce na visita)',
 '{"Chutar preço por metro: destrói margem e credibilidade","Fugir da pergunta sem explicar o porquê: parece enrolação","Não oferecer a visita e deixar a conversa morrer"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'sob_medida', 'risk_free_entry', 'reactive',
 '{"vocês vão até lá","cobra a visita","tem taxa de visita","atende minha região","você vem medir","como funciona a medição"}',
 null,
 'A visita é seu ativo mais caro: combustível, tempo e conhecimento técnico.
Antes de agendar, qualifique com duas ou três perguntas rápidas — o que
precisa, para quando e em que fase está a obra. Quem só pesquisa preço se revela
aqui, e você economiza um deslocamento perdido.
Informe com clareza se a visita é gratuita ou tem valor (e se abate no
fechamento). Cobrar visita não afasta cliente sério; afasta curioso.
Diga também o que acontece na visita — medição, fotos, mostrar materiais. Quem
entende o que vai ganhar, comparece.',
 '{"risk_free_entry.visita_gratuita","risk_free_entry.raio_atendimento"}',
 '{"risk_free_entry.valor_visita","risk_free_entry.o_que_leva","availability.prazo_visita"}', '{}', 'escalate',
 'Qualificação antes do deslocamento + valor percebido da visita',
 '{"Sair para medir sem qualificar: prejuízo garantido com curioso","Não dizer que cobra e o cliente descobrir depois","Agendar sem confirmar a região"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'sob_medida', 'commitment_offer', 'proactive',
 '{"mandou o orçamento","recebeu a proposta","enviei o orçamento","cliente não respondeu o orçamento","segue o orçamento"}',
 null,
 'ESTA É A ENTRADA MAIS IMPORTANTE DO SEGMENTO. Mais de 70% dos orçamentos
deste ramo nunca recebem uma segunda mensagem — e é aí que a venda morre.
Orçamento não é arquivo, é VENDA. Sempre que possível, apresente (chamada,
vídeo ou presencial) em vez de só enviar: quem explica em 20 minutos ganha de
quem manda PDF e espera.
Se já enviou, siga a cadência dos 3 toques em 15 dias, com ÂNGULO DIFERENTE em
cada: (1) tirar dúvida do projeto, (2) condição de pagamento, (3) ajuste de
escopo ou etapa inicial menor. Repetir "conseguiu ver o orçamento?" três vezes
não move ninguém.
Nunca pressione por decisão — pergunte o que ficou em aberto.',
 '{"pricing.parcelamento"}', '{"expertise_proof.garantia","availability.prazo_entrega","differentials.items"}', '{}', 'escalate',
 'Cadência de 3 toques com ângulo diferente (o antídoto do silêncio)',
 '{"Enviar o orçamento e esperar o cliente voltar","Repetir a mesma pergunta a cada toque","Sumir depois de uma única tentativa","Cobrar decisão (\"e aí, fechou?\")"}',
 'retomar_orcamento', 'skill_seed', 'active', null),

(null, 'sob_medida', 'objections', 'reactive',
 '{"tá caro","achei caro","muito caro","fora do orçamento","não esperava esse valor"}',
 null,
 '"Caro" quase nunca é sobre o número — é sobre não enxergar o que está incluso.
NÃO baixe o preço de cara: desconto reflexo desvaloriza o trabalho e ensina o
cliente a barganhar em tudo.
Abra o que está dentro do valor: material, ferragem, acabamento, instalação,
garantia, assistência. Compare o que a peça entrega ao longo dos anos, não o
preço de hoje — sob medida se compara por durabilidade, não por metro.
Se o valor realmente não cabe, ofereça ETAPAS: começar pelo ambiente principal e
fazer o resto depois. Projeto começado vale mais que orçamento perfeito
recusado.',
 '{"expertise_proof.garantia"}', '{"differentials.items","pricing.parcelamento","policies.assistencia"}', '{}', 'escalate',
 'Abertura de escopo + comparação por durabilidade + faseamento',
 '{"Dar desconto na primeira objeção","Justificar com o próprio custo: o cliente não paga o seu custo","Insistir no projeto inteiro quando ele já disse que não cabe"}',
 'defender_valor', 'skill_seed', 'active', null),

(null, 'sob_medida', 'objections', 'reactive',
 '{"achei mais barato","outro cobrou menos","tenho outro orçamento","o concorrente fez por"}',
 null,
 'NUNCA fale mal do concorrente — soa pequeno e ainda defende o outro.
Em sob medida, orçamentos só parecem iguais quando ninguém abre o escopo. Peça
para comparar item a item e mostre o SEU: espessura do material, marca da
ferragem, se a instalação está inclusa, prazo, garantia e quem executa (equipe
própria ou terceiro).
Na maioria das vezes a diferença de preço tem uma explicação técnica — e o
cliente prefere saber disso antes de descobrir depois da instalação.
Se ainda assim ele quiser o mais barato, deixe a porta aberta com elegância.
Cliente que volta depois de um serviço ruim fecha sem discutir preço.',
 '{"differentials.items"}', '{"expertise_proof.garantia","expertise_proof.tempo_de_casa","differentials.marcas"}', '{}', 'escalate',
 'Comparação item a item (nunca ataque ao concorrente)',
 '{"Falar mal do concorrente","Baixar para igualar o preço sem tirar escopo","Não explicar a diferença técnica e virar só \"o mais caro\""}',
 'defender_valor', 'skill_seed', 'active', null),

(null, 'sob_medida', 'objections', 'reactive',
 -- Os gatilhos de adiamento ("vou pensar", "depois te falo") saíram daqui em
 -- ago/2026: adiamento é INDECISÃO, não objeção, e tem entrada própria em
 -- commitment_offer. Aqui ficam os sinais de objeção de verdade — quando existe
 -- uma pedra concreta a isolar.
 '{"não sei se vale a pena","não era bem isso","fiquei em dúvida com o prazo","quero mudar uma parte do projeto","tenho uma ressalva"}',
 null,
 '"Vou pensar" quase nunca é recusa — é dúvida não resolvida ou dinheiro.
Não aceite passivamente e não pressione. Pergunte de forma direta e leve o que
especificamente ficou em aberto: o projeto, o valor ou o prazo. A resposta
revela a objeção REAL, que quase sempre é diferente da que ele disse.
Depois, combine um retorno com DATA ("te chamo quinta, pode ser?"). Deixar em
aberto é o mesmo que perder.
Nunca encerre com "qualquer coisa estou a disposição": isso transfere o trabalho
para quem já está em dúvida.',
 '{}', '{"pricing.parcelamento","availability.prazo_entrega"}', '{}', 'omit',
 'Isolamento da objeção real + retorno com data marcada',
 '{"Aceitar o \"vou pensar\" e sumir","Pressionar por decisão imediata","Encerrar sem combinar o próximo contato"}',
 'agendar_retorno', 'skill_seed', 'active', null),

(null, 'sob_medida', 'availability', 'reactive',
 '{"quanto tempo demora","qual o prazo","pra quando fica pronto","consegue pra esse mês","tenho pressa"}',
 null,
 'Prazo é a segunda maior causa de perda neste ramo — e prometer o que a
produção não entrega custa mais caro que perder a venda.
Informe os TRÊS prazos separados, porque o cliente confunde: quando você vai
medir, quando entrega o orçamento e quanto leva a execução após a aprovação.
Nunca prometa data de execução sem conferir a agenda de produção.
Se ele tem urgência real, isso é sinal de compra: priorize o atendimento e
ofereça a visita mais próxima possível.',
 '{"availability.prazo_entrega","availability.prazo_visita"}', '{"availability.prazo_orcamento"}', '{}', 'escalate',
 'Separação dos três prazos + urgência como sinal de compra',
 '{"Prometer prazo sem conferir a produção","Dar um prazo único e genérico","Ignorar o sinal de urgência"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'sob_medida', 'catalog', 'reactive',
 '{"vocês fazem","trabalham com","tem esse modelo","faz em vidro","tem em alumínio","fazem instalação"}',
 null,
 'Confirme se você executa aquilo usando SOMENTE a lista do DNA — e diga com
naturalidade quando NÃO faz. Aceitar serviço que você não domina gera obra
problemática, atraso e prejuízo de imagem.
Não faz? Indique um parceiro se houver: honestidade aqui gera indicação futura.
Faz? Confirme o material, diga o que costuma influenciar no valor e conduza para
a visita, que é onde o escopo real aparece.',
 '{"catalog.items"}', '{"catalog.nao_faz","differentials.marcas","risk_free_entry.raio_atendimento"}', '{}', 'escalate',
 'Confirmação factual + honestidade sobre limites + condução a visita',
 '{"Aceitar serviço que não domina para não perder o cliente","Prometer material sem confirmar fornecedor","Não aproveitar para agendar"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'sob_medida', 'goal_matching', 'reactive',
 '{"não sei o que fica melhor","o que você indica","qual material","vale a pena","o que você faria"}',
 null,
 'Pergunta de indicação é o momento de virar consultor, não vendedor. É aqui que
você ganha do concorrente que só manda preço.
Antes de indicar, entenda o uso: quantas pessoas usam, se pega sol ou umidade,
se tem criança, quanto tempo pretende ficar no imóvel. A recomendação certa vem
do uso, não do catálogo.
Depois indique com o MOTIVO técnico ("nesse ambiente eu usaria X porque Y") e
mostre o que muda no valor. Cliente que entende o porquê compra melhor e
reclama menos.
Nunca empurre o mais caro sem justificativa de uso.',
 '{}', '{"catalog.items","differentials.marcas","differentials.items"}', '{}', 'omit',
 'Venda consultiva por uso (o diferencial contra quem só manda preço)',
 '{"Indicar o mais caro por padrão","Indicar sem entender o uso","Responder com catálogo em vez de recomendação"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'sob_medida', 'expertise_proof', 'reactive',
 '{"vocês são confiáveis","tem garantia","já fizeram parecido","tem foto de trabalho","quem instala","quanto tempo de mercado"}',
 null,
 'Sob medida é compra de alto risco percebido: o cliente paga adiantado por algo
que ainda não existe, feito por alguém que ele não conhece, dentro da casa dele.
Reduza esse medo com FATOS do DNA: tempo de mercado, obras de referência, quem
executa (equipe própria ou terceirizada) e a garantia por escrito.
Ofereça mostrar trabalhos parecidos com o dele — semelhança convence mais que
volume. Se você faz projeto em 3D, mencione: ver antes de produzir elimina boa
parte do medo.
Fato tranquiliza; adjetivo ("somos os melhores") aumenta a desconfiança.',
 '{"expertise_proof.tempo_de_casa","expertise_proof.garantia"}',
 '{"expertise_proof.obras_referencia","expertise_proof.equipe","differentials.projeto_3d"}', '{}', 'escalate',
 'Redução de risco por prova concreta (o medo é o obstáculo real)',
 '{"Responder com adjetivo em vez de prova","Prometer garantia diferente da real","Não oferecer referência parecida com o caso dele"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'sob_medida', 'reciprocity', 'proactive',
 '{"confirmar visita","lembrete de visita","véspera da medição","você vai estar em casa","posso ir amanhã"}',
 null,
 'Visita perdida é prejuízo direto: combustível, tempo e uma janela de agenda que
não volta.
Confirme na véspera, curto e objetivo: dia, hora, quanto tempo leva e quem vai.
Peça uma confirmação de uma palavra — quanto menor o esforço, maior a taxa.
Aproveite para pedir o que agiliza a medição (acesso ao ambiente, planta se
houver, decisão de quem participa). Visita com o decisor presente converte muito
mais do que visita com quem só vai repassar depois.
Se ele não puder, já ofereça outra data na mesma mensagem.',
 '{}', '{"risk_free_entry.o_que_leva","availability.prazo_visita"}', '{}', 'omit',
 'Confirmação de véspera + garantir a presença do decisor',
 '{"Não confirmar e perder a viagem","Ir sem saber se o decisor estará presente","Confirmar em cima da hora"}',
 'confirmar_visita', 'skill_seed', 'active', null),

(null, 'sob_medida', 'ecosystem', 'reactive',
 '{"meu arquiteto","a arquiteta pediu","o engenheiro indicou","trabalham com arquiteto","tem comissão para indicação"}',
 null,
 'Arquiteto, engenheiro e construtora são o canal mais valioso deste ramo: quem
tem o profissional do lado recebe obra recorrente, com cliente pré-convencido e
menos disputa de preço.
Trate o profissional como parceiro, não como intermediário: respeite o projeto
dele, comunique alterações antes de executar e nunca passe por cima para falar
só com o cliente final — isso queima a fonte para sempre.
Se há política de parceria ou comissão, seja transparente. Se não há, ofereça o
que ele mais valoriza: cumprir prazo e não dar problema na obra dele.',
 '{}', '{"expertise_proof.obras_referencia","differentials.items"}', '{}', 'omit',
 'Canal profissional como fonte recorrente (respeitar o projeto e a relação)',
 '{"Passar por cima do arquiteto para falar direto com o cliente","Alterar o projeto sem avisar","Tratar o profissional como obstáculo"}',
 'cultivar_parceria', 'skill_seed', 'active', null),

(null, 'sob_medida', 'retention', 'proactive',
 '{"cliente antigo","já fiz serviço para ele","faz tempo que instalei","ampliar o projeto","outro ambiente"}',
 null,
 'Quem já comprou de você é o lead mais barato e mais quente que existe — e a
maioria das empresas deste ramo nunca mais fala com o cliente depois de entregar.
Retome com um gancho concreto e útil: revisão do que foi instalado, manutenção
preventiva, ou o ambiente que ficou para depois ("na época você comentou da
área externa").
Não mande promoção genérica. A força aqui é a memória: mostrar que você lembra
do projeto dele vale mais que desconto.
Peça indicação no momento certo — logo após um elogio, nunca durante negociação.',
 '{}', '{"catalog.items","policies.assistencia"}', '{}', 'omit',
 'Reativação por memória do projeto (o lead mais barato que existe)',
 '{"Nunca mais falar com quem já comprou","Mandar promoção genérica","Pedir indicação antes de entregar valor"}',
 'reativar_cliente', 'skill_seed', 'active', null),

(null, 'sob_medida', 'limits_and_ethics', 'reactive',
 '{"dá pra fazer mais barato","tira uma parte","faz sem nota","consegue um jeitinho","material mais simples"}',
 null,
 'Baixar preço tirando qualidade escondido do cliente é o caminho mais rápido
para o problema: a obra volta, a garantia vira prejuízo e a indicação morre.
Se o cliente pede mais barato, seja transparente sobre o que MUDA: material,
espessura, ferragem, acabamento ou prazo. Ele tem direito de escolher — mas
com a informação na mão.
Reduzir escopo é legítimo; reduzir qualidade sem avisar, não.
Nunca prometa nota fiscal, garantia ou condição que a empresa não pratica.',
 '{}', '{"pricing.como_cobra","expertise_proof.garantia","policies.alteracao_escopo"}', '{}', 'omit',
 'Transparência sobre trade-off (reduzir escopo, nunca qualidade escondida)',
 '{"Baixar o material sem avisar para fechar o preço","Prometer condição fiscal que não existe","Aceitar prazo impossível para não perder"}',
 'ajustar_escopo', 'skill_seed', 'active', null),

(null, 'sob_medida', 'availability', 'reactive',
 '{"oi","ola","bom dia","boa tarde","boa noite","gostaria de um orçamento","preciso de um orçamento"}',
 null,
 'Pedido de orçamento é o início de tudo neste ramo — e a maioria responde com
"me manda as medidas", jogando o trabalho no cliente.
Faça diferente: cumprimente, pergunte O QUE ele quer resolver e para quando, e
já indique o caminho (visita para medir). Duas ou três perguntas curtas
qualificam e mostram profissionalismo.
Responda RÁPIDO. Neste setor o primeiro que responde bem costuma levar a obra —
o cliente pediu orçamento para três empresas no mesmo dia.',
 '{}', '{"availability.prazo_visita","risk_free_entry.raio_atendimento"}', '{}', 'omit',
 'Abertura com qualificação + velocidade de resposta como vantagem',
 '{"Pedir que o cliente mande as medidas: é seu trabalho, não dele","Responder horas depois","Começar pelo preço antes de saber o que ele quer"}',
 'qualificar', 'skill_seed', 'active', null),

(null, 'sob_medida', 'commitment_offer', 'reactive',
 '{"vou pensar","preciso decidir com minha esposa","vou analisar o orçamento","me manda mais opções","ainda estou vendo","vou esperar um pouco","depois eu falo"}',
 null,
 'Este é o cliente que mais aparece e o mais mal tratado do ramo. Ele não sumiu
por preço: travou porque a compra é cara, demorada e IRREVERSÍVEL — se ficar
ruim, ele vai conviver com aquilo por dez anos. Medo de errar, não falta de
dinheiro.
O erro que quase todo mundo comete é mandar mais opções e mais referências. Cada
opção nova adia a decisão: quem está travado não consegue comparar mais coisa.
Pare de ampliar e comece a estreitar.
RECOMENDE. Diga qual solução você faria na casa dele e por que, com a sua
experiência de quem já fez isso muitas vezes. Cliente travado quer um especialista
que assuma posição, não um catálogo.
Tire o risco com o que for verdade: projeto antes de produzir, medida conferida
no local, garantia, pagamento diluído, começar por um ambiente em vez da casa
toda. Reduzir o TAMANHO da decisão funciona melhor que reduzir o preço.
E combine o próximo passo com data. Sem data, este cliente some — e some sem dizer
não, que é o que faz o vendedor achar que ainda está vivo.',
 '{"pricing.range"}',
 '{"expertise_proof.garantia","policies.alteracao_escopo","pricing.parcelamento","availability.prazo_entrega","differentials.projeto_3d","expertise_proof.obras_referencia"}', '{}', 'escalate',
 'Estreitar em vez de ampliar: recomendar uma solução e diminuir o tamanho da decisão',
 '{"Mandar mais opções para quem está em dúvida","Dar desconto antes de descobrir o medo real","Reexplicar o valor do sob medida","Deixar o retorno sem data"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt');
