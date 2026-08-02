-- =====================================================================
-- COS — MIGRATION 0040 : BIBLIOTECA DE SALÃO DE BELEZA
--
-- Escrita depois de pesquisa dirigida (ago/2026), não de suposição. Os
-- números citados abaixo estão nas fontes registradas no Plano de
-- Execução; o que não tinha fonte confiável ficou de fora.
--
-- O QUE A PESQUISA MUDOU NO DESENHO (e não estava na minha cabeça antes):
--
--   • O PREÇO DA QUÍMICA NÃO É UM NÚMERO, É UMA RÉGUA. Progressiva varia
--     por comprimento e volume — o mesmo serviço custa metade num cabelo
--     curto. Responder por mensagem é criar conflito para o dia do
--     atendimento. Por isso `pricing` aqui é consultiva, e na barbearia é
--     oferta de valor: mesma pergunta, escolas opostas.
--
--   • O HISTÓRICO QUÍMICO É SEGURANÇA. Química sobre química incompatível
--     causa CORTE QUÍMICO: o fio quebra ou "derrete". Henê é incompatível
--     com alisamento; formol e glutaraldeído são proibidos pela Anvisa e
--     ainda aparecem. Isso gerou a entrada mais importante desta
--     biblioteca — e é a primeira em que a resposta comercial certa pode
--     ser RECUSAR o serviço.
--
--   • O NO-SHOW CUSTA A TARDE, NÃO A HORA. Faltas e cancelamentos de
--     última hora consomem de 10% a 20% da receita mensal do setor, e uma
--     química perdida leva 3 a 5 horas de cadeira. Sinal derruba no-show
--     em 60% a 80% — virou entrada própria.
--
--   • A CLIENTE É FIEL À PESSOA. 72% acompanham o profissional quando ele
--     troca de salão. Não é problema de RH: é a fragilidade do negócio, e
--     existe trabalho comercial que reduz.
--
--   • A EXPECTATIVA CHEGA EM FORMA DE FOTO, e o cabelo dela não chega lá
--     em uma sessão. Alinhar antes é conversa comercial, não técnica.
--
-- REGRA DA TRAVA ANTI-INVENÇÃO nesta biblioteca:
--   `escalate` para NÚMERO e COMPROMISSO (faixa, régua da química, sinal,
--   prazo de ajuste) — inventar ali cobra no caixa e na reclamação.
--   `omit` para PROVA OPCIONAL (marca, formação, portfólio).
--
-- Escrita COM ACENTO, como a de oficina: este texto é lido pelo vendedor
-- no Responder e pela aluna no exercício do curso.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'salao_beleza' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

-- ---------------------------------------------------------------- PRICING
(null, 'salao_beleza', 'pricing', 'reactive',
 '{"quanto custa a progressiva","qual o valor das mechas","quanto fica a coloração","me passa a tabela de preços","quanto custa para alisar"}',
 null, 'Esta é a pergunta que mais chega e a que mais gente responde errado — dos dois
lados. Quem manda um número fecha um preço que não vai conseguir cumprir; quem
responde "depende" e para por aí perde a cliente para quem respondeu.
O caminho é a régua: dê a faixa REAL por comprimento, que é verdade e já orienta,
e explique em uma frase por que o valor final precisa de avaliação.
"Em cabelo curto fica em torno de X, médio Y, longo a partir de Z. O que fecha o
valor é o volume e o estado do fio — por isso eu prefiro te ver antes de
prometer um número."
Depois puxe os dois dados que resolvem quase tudo: comprimento e o que já foi
feito no cabelo. Quem responde isso está praticamente agendando a avaliação.', '{"pricing.como_cobra_quimica"}',
 '{"pricing.range","pricing.parcelamento","risk_free_entry.avaliacao_gratuita"}', '{"Nunca fechar preço de química por mensagem"}', 'escalate',
 'Régua por comprimento + avaliação antes do valor fechado', '{"Mandar um número fechado sem ver o cabelo","Responder só \"depende\" e não dar régua nenhuma","Cobrar o mesmo de cabelo curto e de cabelo na cintura"}', 'agendar_avaliacao',
 'skill_seed', 'active', 'consultiva_spin'),

(null, 'salao_beleza', 'pricing', 'reactive',
 '{"por que com ela é mais caro","tem diferença de preço por profissional","o valor muda com quem faz","quero a mais barata","qual a diferença do preço"}',
 null, 'Preço por nível de profissional é comum e justo, e fica constrangedor quando
ninguém explicou antes. Explique sem hierarquizar pessoa: o que muda é
experiência e o tipo de trabalho, não a dedicação.
"Todas as profissionais aqui fazem o serviço com o mesmo padrão. A diferença de
valor é de experiência em trabalho mais complexo — loiro, correção de cor,
cabelo com histórico difícil."
E oriente pelo CASO dela, não pelo bolso dela. Se o que ela precisa é simples,
diga que a profissional de valor menor resolve — isso constrói mais confiança do
que qualquer desconto, e ela volta para o serviço caro quando precisar.
Nunca deixe a cliente escolher no escuro para depois se decepcionar.', '{}',
 '{"pricing.varia_por_profissional","expertise_proof.profissionais"}', '{}', 'omit',
 'Explicar o nível pelo tipo de trabalho e recomendar pelo caso, não pelo preço', '{"Deixar a cliente descobrir a diferença de preço só no caixa","Empurrar a profissional mais cara em serviço simples","Falar de \"melhor\" e \"pior\" profissional"}', 'agendar_horario',
 'skill_seed', 'active', 'consultiva_spin'),

-- -------------------------------------------------------- RISK_FREE_ENTRY
(null, 'salao_beleza', 'risk_free_entry', 'reactive',
 '{"nunca fui aí","primeira vez no salão","tenho medo de estragar o cabelo","não conheço o trabalho de vocês","já tive experiência ruim"}',
 null, 'Cliente nova de salão não está comparando preço: está com medo. Cabelo estragado
leva meses para voltar, e quase toda mulher tem uma história ruim para contar —
dela ou de alguém.
Não venda serviço nesta mensagem. Ofereça a AVALIAÇÃO, que é olhar o cabelo,
conferir o histórico e dizer o que dá e o que não dá. Quem chega com medo precisa
de um passo pequeno e reversível, não de um pacote.
"Vem tomar um café e a gente olha o seu cabelo sem compromisso. Eu te digo o que
dá para fazer, em quantas vezes, e quanto fica. Se não fizer sentido, você não
fez nada de errado."
E se ela contar a experiência ruim, ouça inteira antes de responder. A história
dela é o mapa do que você não pode repetir.', '{"risk_free_entry.avaliacao_gratuita"}',
 '{"risk_free_entry.o_que_inclui","expertise_proof.tempo_de_casa","expertise_proof.especialidades"}', '{}', 'escalate',
 'Passo pequeno e reversível para quem chega com medo (a avaliação, não o pacote)', '{"Responder medo com promoção","Vender o pacote completo na primeira mensagem","Cortar a história da experiência ruim para falar do salão"}', 'agendar_avaliacao',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- ----------------------------------------------------------- AVAILABILITY
(null, 'salao_beleza', 'availability', 'reactive',
 '{"tem horário hoje","tem vaga para sábado","que horas vocês atendem","consigo encaixar amanhã","tem alguém livre agora"}',
 null, 'Agenda é o produto do salão: cadeira vazia não se revende, e horário nobre
(sábado, fim de tarde) é o mais disputado.
Nunca responda com pergunta aberta ("que dia você prefere?"), que devolve o
trabalho para a cliente e alonga a conversa. Ofereça DUAS opções concretas, uma
delas fora do pico — e diga o tempo que o serviço leva, para ela se organizar.
"Tenho quinta às 14h ou sábado às 9h. A progressiva leva umas 4 horas, então vale
reservar a manhã."
Se o que ela pediu está cheio, não pare no "não tenho": ofereça o mais próximo e
a lista de espera. Cliente que ouve só "está lotado" procura outro salão; cliente
que ouve uma alternativa fica.', '{"availability.weekly_hours"}',
 '{"availability.tempo_quimica","availability.antecedencia"}', '{}', 'escalate',
 'Duas opções concretas + o tempo real de cadeira dito antes', '{"Perguntar \"que dia você prefere?\" em vez de oferecer","Dizer só que está lotado","Marcar química sem avisar quanto tempo leva"}', 'agendar_horario',
 'skill_seed', 'active', 'fechamento_classico'),

(null, 'salao_beleza', 'availability', 'reactive',
 '{"quanto tempo demora","vou ficar quanto tempo aí","dá tempo no meu horário de almoço","preciso sair às","é rápido"}',
 null, 'Subestimar o tempo é a forma mais rápida de transformar um bom serviço em
reclamação. A cliente que planejou duas horas e ficou cinco não lembra do
resultado — lembra do dia perdido.
Diga o tempo REAL, com folga, e o que faz variar: comprimento, volume e se vai
precisar de lavagem e finalização depois.
Se o tempo dela não cabe, seja honesta e ofereça o que cabe: "hoje, no seu
intervalo, dá para fazer o corte e a escova. A coloração eu prefiro fazer com
tempo, senão a gente corre e o resultado sofre."
Isso não perde venda: perde a venda que ia dar problema, e ganha a cliente que
percebeu que você não empurra.', '{"availability.tempo_quimica"}',
 '{"catalog.items"}', '{}', 'escalate',
 'Tempo real com folga + oferecer o que cabe no tempo dela', '{"Dizer \"é rapidinho\" para não perder o agendamento","Encaixar química em intervalo curto","Descobrir na cadeira que ela precisa sair em uma hora"}', 'agendar_horario',
 'skill_seed', 'active', 'fechamento_classico'),

-- --------------------------------------------------------- EXPERTISE_PROOF
(null, 'salao_beleza', 'expertise_proof', 'reactive',
 '{"quem faz mechas aí","quem é boa em loiro","com quem eu marco","vocês fazem cabelo cacheado","tem alguém especialista em"}',
 null, 'A cliente escolhe PESSOA, não empresa — e isso não é um problema a contornar, é
como o setor funciona. Cerca de 7 em cada 10 clientes acompanham o profissional
quando ele muda de salão.
Responda nominalmente e com prova: quem faz, há quanto tempo, e um trabalho
parecido com o caso dela. Foto do mesmo tipo de cabelo vale mais que qualquer
adjetivo — "somos referência em loiro" é o que todo concorrente escreve.
E aproveite para construir o vínculo com o SALÃO junto: apresente a equipe como
equipe. "A Ju faz o seu caso, e ela trabalha comigo há seis anos" liga a
profissional à casa, em vez de separar.
Se a especialidade que ela pede não existe aí, diga na hora. Aceitar cabelo que
ninguém domina é como se ganha reclamação.', '{"expertise_proof.tempo_de_casa"}',
 '{"expertise_proof.profissionais","expertise_proof.especialidades","expertise_proof.formacoes"}', '{}', 'omit',
 'Prova nominal com trabalho parecido + vínculo com a casa, não só com a pessoa', '{"Responder com adjetivo genérico","Aceitar um tipo de cabelo que ninguém do salão domina","Falar da profissional como se ela fosse independente da casa"}', 'agendar_horario',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- ----------------------------------------------------------------- CATALOG
(null, 'salao_beleza', 'catalog', 'reactive',
 '{"vocês fazem unha","tem depilação","fazem sobrancelha","atende noiva","tem massagem","fazem cílios"}',
 null, 'Pergunta de catálogo é oportunidade de agenda, não de informação. Responder só
"fazemos" encerra a conversa exatamente onde ela poderia virar horário.
Confirme o que faz, diga o que NÃO faz sem rodeio, e emende com a combinação
natural: quem vem fazer a unha costuma querer sobrancelha no mesmo dia; quem vem
para a química ganha tempo se já deixar o corte junto.
"Fazemos sim. E como você já vai estar aqui, dá para deixar a sobrancelha no
mesmo horário — economiza uma vinda."
Combinar serviço no mesmo agendamento aumenta o ticket sem empurrar nada: você
está economizando o tempo dela, que é o que ela mais valoriza.
Se o salão não faz, indique quem faz bem. A cliente lembra de quem resolveu.', '{"catalog.items"}',
 '{"catalog.nao_faz","ecosystem.parceiros"}', '{}', 'escalate',
 'Confirmar + combinar serviço no mesmo horário (economizar a vinda dela)', '{"Responder só \"fazemos\" e encerrar","Oferecer combinação que não cabe no tempo","Dizer que faz um serviço que o salão não domina"}', 'agendar_horario',
 'skill_seed', 'active', 'consultiva_spin'),

-- ----------------------------------------------------------- GOAL_MATCHING
(null, 'salao_beleza', 'goal_matching', 'reactive',
 '{"quero ficar assim","mandei a foto","quero esse loiro","dá para fazer igual da foto","quero mudar o visual"}',
 null, 'A foto é o começo da conversa, não o pedido. O cabelo da referência tem outro
histórico, outra base e, muitas vezes, outra pessoa por trás de três sessões de
trabalho — e a cliente não sabe disso.
Alinhar isso ANTES é a diferença entre encantar e virar reclamação. E é conversa
comercial: você não está dizendo não, está construindo um caminho.
Três perguntas resolvem: o que já foi feito no cabelo, quando foi a última vez, e
se ela tem uma data marcada.
Depois traduza em plano com etapas: "esse loiro dá para chegar, mas não em uma
sessão sem castigar o fio. Eu faria assim: uma agora, outra em seis semanas.
Você fica bonita já na primeira, e chega lá sem quebrar."
Cliente que entende o caminho aceita o caminho. Cliente que esperava chegar hoje
sai triste mesmo com um bom trabalho.', '{}',
 '{"catalog.items","availability.tempo_quimica","expertise_proof.especialidades"}', '{"Não prometer o resultado da foto sem ver o cabelo"}', 'omit',
 'Transformar a foto em plano por etapas, alinhado antes de marcar', '{"Prometer o resultado da foto para agradar","Dizer só \"não dá\" sem oferecer caminho","Deixar a conversa sobre expectativa para o dia do serviço"}', 'agendar_avaliacao',
 'skill_seed', 'active', 'consultiva_spin'),

-- -------------------------------------------------------------- OBJECTIONS
(null, 'salao_beleza', 'objections', 'reactive',
 '{"tá caro","achei caro","no outro salão é mais barato","minha amiga faz por menos","vi mais em conta ali"}',
 null, 'Antes de mexer no preço, descubra caro comparado a quê — e no salão a comparação
quase nunca é do mesmo serviço.
A diferença mora em três lugares: o produto usado (linha profissional contra o
que se compra em supermercado), o tempo dedicado, e o que acontece DEPOIS —
manutenção, ajuste, garantia do resultado.
Pergunte com curiosidade, não com defesa: "consegue ver que produto ela usa? E
está incluso o tratamento depois da química?"
Nunca fale mal do outro salão nem da amiga que faz mais barato. Quem faz isso
está falando mal da escolha da cliente, e ela ouve exatamente assim.
E se ela não puder pagar agora, não force: ofereça o que cabe hoje e deixe o
resto para o próximo ciclo. Cliente que fez metade volta; cliente pressionada
some.', '{}',
 '{"pricing.range","catalog.marcas_produtos","policies.garantia_servico"}', '{}', 'omit',
 'Descobrir "caro comparado a quê" — produto, tempo e o que vem depois', '{"Dar desconto na primeira pressão","Falar mal do salão concorrente ou da amiga","Comparar preço sem abrir o que está incluído"}', 'isolar_objecao',
 'skill_seed', 'active', 'negociacao_voss'),

(null, 'salao_beleza', 'objections', 'reactive',
 '{"vou fazer em casa","comprei o produto e vou aplicar","minha prima faz na minha casa","vou tentar sozinha","compro o kit e faço"}',
 null, 'Não discuta com a decisão dela — reagir mal aqui confirma que você só quer o
dinheiro. E boa parte das clientes que fazem em casa voltam depois, ou para
corrigir ou para manter.
Reconheça o que é verdade: em serviço simples, fazer em casa funciona mesmo.
Depois diga onde o risco está, e diga como informação, não como ameaça:
"Hidratação em casa funciona bem. O que eu não faria sozinha é descoloração e
alisamento — é onde o fio quebra, e correção sai mais cara do que o serviço."
Ofereça o meio-termo que a mantém sua: a avaliação para ela saber o que o cabelo
aguenta, ou o produto certo para usar em casa.
Se ela fizer e der errado, ela vai lembrar de quem avisou sem julgar — e é para
você que ela vai ligar.', '{}',
 '{"retention.manutencao_casa","ecosystem.revenda"}', '{}', 'omit',
 'Reconhecer o que funciona em casa e marcar o limite do risco, sem ameaça', '{"Assustar com o pior cenário para forçar o agendamento","Ironizar o produto de farmácia ou a prima","Perder o contato porque ela vai fazer em casa desta vez"}', 'oferecer_alternativa',
 'skill_seed', 'active', 'negociacao_voss'),

-- -------------------------------------------------------- COMMITMENT_OFFER
-- A ENTRADA DE INDECISÃO deste segmento. Aqui ela é específica: a cliente
-- concordou com o plano, gostou do orçamento e mesmo assim não marca —
-- porque mudar o cabelo é irreversível por meses, e o medo não é do preço.
(null, 'salao_beleza', 'commitment_offer', 'reactive',
 '{"vou ver e te falo","depois eu marco","preciso ver minha agenda","vou pensar","qualquer coisa eu chamo","deixa eu me organizar"}',
 null, 'ATENÇÃO: quem ouviu o plano, concordou e mesmo assim não marcou raramente está em
dúvida sobre o preço. Está com medo de se arrepender — e no cabelo o
arrependimento dura meses, não um dia.
Repetir o argumento aqui PIORA. A pesquisa das conversas gravadas mostra que a
maioria dos vendedores volta a explicar quando o cliente hesita, e que isso
aumenta a chance de perder.
Faça o contrário, nesta ordem:
1. Pergunte o que trava, sem cobrar decisão: "o que ainda te deixa em dúvida?"
2. RECOMENDE um caminho em vez de abrir opções: "no seu caso eu começaria só
   pelo corte e um tratamento, e a cor a gente vê no mês que vem."
3. DIMINUA o tamanho da decisão — um passo reversível agora, o resto depois.
E ofereça HORÁRIO, não pergunta aberta: "tenho quinta às 15h; seguro para você?"
Cliente indecisa não quer escolher entre cinco opções. Quer ser orientada por
alguém que entende.', '{}',
 '{"policies.garantia_servico","availability.weekly_hours"}', '{}', 'omit',
 'Reduzir o risco em vez de insistir: recomendar um caminho e começar pequeno', '{"Repetir o quanto o resultado vai ficar bonito","Dar desconto para acelerar uma decisão que não é sobre preço","Encerrar com \"qualquer coisa me chama\""}', 'reduzir_risco',
 'skill_seed', 'active', 'indecisao_jolt'),

(null, 'salao_beleza', 'commitment_offer', 'proactive',
 '{"precisa pagar antes","tem que dar sinal","por que cobra antecipado","posso pagar no dia","não gosto de pagar antes"}',
 null, 'Sinal em serviço longo não é desconfiança: é o que protege a agenda de quem
trabalha com hora marcada. Faltas de última hora consomem uma fatia grande da
receita do setor, e uma química perdida leva junto uma tarde inteira que não se
revende.
Explique com o motivo real, sem constrangimento e sem tom de cobrança:
"Para química eu reservo umas quatro horas só para você, e nesse tempo não
consigo atender mais ninguém. Por isso peço 30% no PIX, que já entra no valor do
dia. Se precisar remarcar até 24 horas antes, ele vale para o novo horário."
Repare no que a frase faz: dá a razão, deixa claro que o dinheiro não é a mais, e
oferece saída para quem tem imprevisto — que é a parte que tira o medo.
Política de sinal bem explicada derruba falta de forma expressiva. Mal explicada,
espanta cliente boa.', '{"policies.sinal","policies.cancelamento"}',
 '{"pricing.parcelamento"}', '{}', 'escalate',
 'Sinal explicado pela cadeira reservada, com saída para imprevisto', '{"Cobrar sinal sem explicar o motivo","Não dar alternativa para quem precisa remarcar","Aplicar sinal em serviço curto, onde ele só cria atrito"}', 'confirmar_agendamento',
 'skill_seed', 'active', 'fechamento_classico'),

-- ------------------------------------------------------------- RECIPROCITY
(null, 'salao_beleza', 'reciprocity', 'proactive',
 '{"meu cabelo está caindo","está muito ressecado","não sei o que fazer com meu cabelo","meu cabelo não cresce","está sem vida"}',
 null, 'Quando a cliente descreve um problema do cabelo, ela está pedindo orientação — e
a resposta instintiva, oferecer um serviço, queima a melhor oportunidade de
confiança que existe neste ramo.
Entregue valor antes de vender: pergunte o essencial (o que usa, com que
frequência lava, o que já fez de química) e dê UMA orientação que ela pode
aplicar hoje, de graça.
"Pelo que você conta, o fio está pedindo hidratação, não corte. Começa lavando
com água morna e afastando o condicionador da raiz — em duas semanas você já
sente diferença."
Depois convide para a avaliação, sem emendar na mesma frase. Quem recebe conselho
útil de graça volta; quem recebe conselho com preço colado desconfia dos dois.
E se o caso for simples, diga que é simples. Inventar gravidade é o que faz o
setor perder credibilidade.', '{}',
 '{"risk_free_entry.avaliacao_gratuita","retention.manutencao_casa"}', '{}', 'omit',
 'Orientação útil de graça antes do convite (reciprocidade que custa competência)', '{"Responder problema de cabelo com tabela de preço","Exagerar a gravidade para vender tratamento","Colar o convite na mesma frase do conselho"}', 'agendar_avaliacao',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- -------------------------------------------------------- LIMITS_AND_ETHICS
-- A ENTRADA MAIS IMPORTANTE DESTA BIBLIOTECA. É a única, em onze
-- segmentos, em que a resposta comercial certa pode ser RECUSAR o serviço.
(null, 'salao_beleza', 'limits_and_ethics', 'reactive',
 '{"já fiz henê","não sei o que passaram no meu cabelo","fiz progressiva e agora quero descolorir","fiz em casa e quero arrumar","posso fazer as duas químicas"}',
 null, 'Pare a venda aqui. Química sobre química incompatível causa CORTE QUÍMICO: o fio
perde estrutura e quebra, e não existe conserto — só cortar e esperar crescer.
Henê é incompatível com alisamentos e descoloração. Formol e glutaraldeído são
proibidos pela Anvisa como alisantes e ainda circulam, inclusive em produto que a
cliente traz de casa. E quando ela não sabe o que foi usado, a informação que
falta é justamente a que decide.
O procedimento, sem exceção: TESTE DE MECHA antes de qualquer química em cabelo
com histórico desconhecido ou com henê. É rápido, é barato e é o que separa
profissional de sorte.
Explique sem assustar e sem soar como desculpa para não fazer:
"Antes de qualquer coisa eu faço um teste numa mecha escondida. Se o fio
aguentar, a gente segue tranquila; se não aguentar, eu te mostro o porquê e a
gente monta outro caminho."
E se o teste reprovar, RECUSE. Perder um serviço custa muito menos do que
devolver uma cliente com o cabelo quebrado — e ela conta para todo mundo.', '{}',
 '{"catalog.marcas_produtos","risk_free_entry.o_que_inclui"}', '{"Nunca aplicar química sem conferir o histórico do cabelo","Cabelo com henê ou histórico desconhecido exige teste de mecha","Formol e glutaraldeído como alisantes são proibidos pela Anvisa"}', 'omit',
 'Teste de mecha como regra + recusa técnica explicada sem assustar', '{"Fazer a química porque a cliente insistiu","Aceitar produto que a cliente trouxe de casa","Assustar com o risco em vez de propor o teste"}', 'testar_mecha',
 'skill_seed', 'active', 'relacionamento_carnegie'),

(null, 'salao_beleza', 'limits_and_ethics', 'reactive',
 '{"não gostei do resultado","não ficou como eu queria","a cor não é essa","meu cabelo ficou ressecado depois","quero reclamar"}',
 null, 'A primeira reação decide tudo, e a instintiva é a errada: explicar por que ficou
certo. Para quem está olhando no espelho e não gostou, explicação soa como
"o problema é você".
Ouça inteiro, sem interromper e sem justificar. Depois traga para o presencial,
que é onde se resolve: no cabelo, olhando junto, dá para separar o que é ajuste
do que é expectativa que não foi alinhada.
"Quero ver com você. Consegue passar amanhã? Se for algo que eu consigo ajustar,
eu ajusto — e sem custo."
Se o ajuste é possível dentro do que vocês combinaram, faça e não cobre.
Se o que ela esperava não era possível, aí sim explique — mas depois de ter
ouvido, e sem transformar em quem tinha razão.
Cliente com problema bem resolvido vira defensora mais fiel do que aquela em que
tudo correu liso. É o pior momento e a melhor oportunidade do relacionamento.', '{"policies.garantia_servico"}',
 '{"retention.manutencao_casa"}', '{}', 'escalate',
 'Ouvir sem justificar, trazer para o presencial e ajustar sem cobrar', '{"Explicar por WhatsApp por que o resultado está certo","Cobrar o ajuste do que estava combinado","Deixar a conversa esfriar esperando ela desistir"}', 'agendar_ajuste',
 'skill_seed', 'active', 'relacionamento_carnegie'),

-- --------------------------------------------------------------- RETENTION
(null, 'salao_beleza', 'retention', 'proactive',
 '{"está na hora do retoque","a raiz apareceu","faz tempo que não vou aí","quando devo voltar","preciso retocar"}',
 null, 'O retoque é o negócio mais previsível do salão e o menos trabalhado. Raiz de
coloração aparece em torno de trinta dias, unha pede manutenção a cada quinze,
progressiva se repete por temporada — dá para saber a semana em que cada cliente
vai precisar.
A mensagem que funciona não é "está na hora do retoque". É específica dela:
"Sua cor foi feita dia 12, então a raiz deve estar começando a aparecer agora.
Tenho quinta às 15h ou sábado às 10h — quer que eu segure um?"
Duas coisas acontecem aí: ela vê que existe um registro (e registro é o que
diferencia salão organizado de salão que improvisa) e ela não precisa decidir
nada além de escolher entre dois horários.
Marcar o PRÓXIMO horário ainda na cadeira, no fim do atendimento, funciona melhor
que qualquer mensagem depois — é o momento de maior satisfação do ciclo inteiro.', '{"retention.intervalo_retoque"}',
 '{"retention.lembrete","availability.weekly_hours"}', '{}', 'escalate',
 'Recompra no ciclo dela, com dois horários oferecidos em vez de pergunta aberta', '{"Mandar mensagem genérica de campanha","Esperar a cliente lembrar sozinha","Perguntar \"quando você quer vir?\" em vez de oferecer"}', 'agendar_retoque',
 'skill_seed', 'active', 'cadencia_blount'),

(null, 'salao_beleza', 'retention', 'proactive',
 '{"cliente sumiu","não vem há meses","parou de vir","faltou e não remarcou","deixou de aparecer"}',
 null, 'Cliente que parou de vir raramente foi embora por um motivo grande. Na maior parte
das vezes furou uma vez, ficou constrangida e não voltou — o silêncio é vergonha,
não insatisfação.
Por isso a mensagem de retomada não pode ter nenhum traço de cobrança. Nada de
"sentimos sua falta" com culpa embutida, nada de lembrar da falta.
"Oi, Marina! Passando para saber como está o seu cabelo depois daquela cor.
Ficou bom o tom no sol? Se quiser dar uma olhada, estou com a agenda mais
tranquila nesta semana."
Repare: pergunta pelo RESULTADO, não pela ausência. Isso devolve a conversa sem
constrangimento e ainda descobre se houve um problema que ninguém contou.
E cuidado com quem já faltou antes: cliente que volta depois de muito tempo tem
mais chance de faltar de novo — para essa, confirme com mais atenção e considere
o sinal.', '{}',
 '{"policies.sinal","retention.intervalo_retoque"}', '{}', 'omit',
 'Retomada pelo resultado, sem traço de cobrança pela ausência', '{"Mandar mensagem com culpa (\"você sumiu\")","Abrir a retomada com promoção","Tratar cliente que faltou do mesmo jeito que a pontual"}', 'reabrir_conversa',
 'skill_seed', 'active', 'cadencia_blount'),

(null, 'salao_beleza', 'retention', 'proactive',
 '{"a profissional saiu do salão","minha cabeleireira mudou de lugar","ela não trabalha mais aí","com quem eu vou agora","quero saber para onde ela foi"}',
 null, 'Este é o risco estrutural do salão, e o mais mal trabalhado: cerca de 7 em cada 10
clientes acompanham o profissional quando ele muda de casa. O vínculo é com a
pessoa, e isso não vai mudar.
O que dá para mudar é ter um segundo vínculo — com o salão — construído ANTES da
saída, não depois. Isso se faz no dia a dia: a cliente ser reconhecida por quem
atende na recepção, o registro do que ela gosta valer para qualquer profissional,
o resultado ser padrão da casa e não sorte de quem pegou.
Quando a saída acontecer, nunca disputa. Não critique quem saiu e não esconda
para onde foi — as duas coisas queimam você, não a outra pessoa.
"A Ju seguiu para o projeto dela e desejo tudo de bom. Aqui quem faz o seu tipo de
cor é a Carla, que trabalha com a gente há quatro anos — separei o registro do que
foi feito no seu cabelo para ela continuar do mesmo jeito."
O registro é o argumento mais forte que existe aqui: continuidade que a
profissional sozinha não consegue levar.', '{}',
 '{"expertise_proof.profissionais","expertise_proof.especialidades"}', '{}', 'omit',
 'Transferência com continuidade registrada, sem disputar com quem saiu', '{"Criticar a profissional que saiu","Fingir que ela nunca existiu","Deixar a cliente descobrir sozinha e sumir junto"}', 'transferir_carteira',
 'skill_seed', 'active', 'cadencia_blount'),

-- --------------------------------------------------------------- ECOSYSTEM
(null, 'salao_beleza', 'ecosystem', 'proactive',
 '{"que produto eu uso em casa","onde compro esse shampoo","vocês vendem produto","o que passo depois","como faço para durar mais"}',
 null, 'Esta pergunta vem no melhor momento possível — logo depois do resultado, quando a
cliente quer manter o que acabou de ver. E é a venda mais fácil e mais mal feita
do salão.
Mal feita é recitar produto. Bem feita é ligar o produto ao RESULTADO dela:
"Para essa cor durar, o que mais pesa é não lavar com shampoo comum, porque ele
abre a cutícula e a cor vai embora. Esse aqui é o que eu uso em você."
Duas regras que sustentam a confiança no longo prazo:
1. Indique o que ela precisa, não o que está encalhado. Uma indicação errada
   custa a credibilidade de todas as próximas.
2. Se o de farmácia resolve o caso dela, diga. Você perde uma venda pequena e
   ganha o direito de ser levada a sério quando indicar o caro.
E diga a quantidade e a frequência — produto bom usado errado vira reclamação
sobre o produto, e depois sobre você.', '{}',
 '{"ecosystem.revenda","retention.manutencao_casa","catalog.marcas_produtos"}', '{}', 'omit',
 'Ligar o produto ao resultado dela, com honestidade sobre quando não precisa', '{"Recitar produto sem ligar ao caso dela","Empurrar o que está parado no estoque","Vender sem explicar quantidade e frequência"}', 'oferecer_manutencao',
 'skill_seed', 'active', 'persuasao_cialdini');

-- Verificação (valor esperado escrito, como manda a convenção):
-- 19 entradas, 12 categorias distintas, 1 de indecisão (indecisao_jolt).
select count(*) as entradas, count(distinct category) as categorias
  from public.knowledge_entries where skill_key = 'salao_beleza' and tenant_id is null;
