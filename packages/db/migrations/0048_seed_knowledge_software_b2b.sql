-- =====================================================================
-- COS — MIGRATION 0048 : BIBLIOTECA DE SOFTWARE PARA PME
--
-- A biblioteca com que a WSS Labs vende a WSS Labs.
--
-- Product seed: dado que É o produto. Roda em todo ambiente.
--
-- COBERTURA CONFERIDA ANTES DE ESCREVER, contra as 262 entradas das 14
-- bibliotecas. `automacao` e `industria` são B2B, mas de equipamento e
-- material: nenhuma das 262 fala de planilha como concorrente, medo de
-- adoção pela equipe, teste grátis, LGPD e posse do dado, implantação,
-- "é mais um sistema?" ou "a IA vai responder pelo meu cliente?".
--
-- O QUE INVERTE A VENDA AQUI: **o concorrente é o jeito de hoje.** Não é
-- outro software — é o WhatsApp pessoal, a planilha e a memória do dono.
-- O trabalho não é ganhar de um produto: é tornar visível um custo que a
-- pessoa já paga e não enxerga. Por isso `objections` é `challenger`
-- neste manifesto e `negociacao_voss` em todos os outros: Voss desarma
-- quem já tem posição, Challenger é para quem ainda não sabe que tem
-- problema.
--
-- AS DUAS ENTRADAS QUE MAIS PROTEGEM A CASA são de `limits_and_ethics`,
-- e as duas são RECUSA: "o que o produto NÃO faz" e "quem vê os meus
-- dados". Vender software prometendo o que não existe não perde um
-- cliente — perde a reputação com o segmento inteiro, porque dono de PME
-- conversa com dono de PME.
--
-- REGRA DA TRAVA: `escalate` quando o fato que falta é NÚMERO ou
-- COMPROMISSO (mensalidade, prazo, política de dados, o que o teste
-- inclui). `omit` quando é prova opcional.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'software_b2b' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

-- ---------------------------------------------------------------- PREÇO
(null, 'software_b2b', 'pricing', 'reactive',
 '{"quanto custa","qual o valor","qual a mensalidade","quanto é por mês","tem plano","me passa os valores","qual o investimento"}',
 null,
 'Não fuja e não cote fechado. Dê a FAIXA da mensalidade e diga na mesma frase o
que a define — o volume de atendimento da empresa dele. É isso que transforma
preço em conversa: quem atende 40 pessoas por mês e quem atende 400 não pagam a
mesma coisa, e ele entende isso na hora.
Diga o modelo de cobrança com todas as letras, porque ele é diferente do que o
mercado faz e isso é um argumento: cobramos por atendimento, não por usuário.
Colocar mais gente da equipe para usar não aumenta a conta — o que faria muita
empresa deixar o vendedor de fora, que é o oposto do objetivo.
Se houver taxa de implantação, diga agora. Custo que aparece depois da decisão
custa a decisão.
Termine perguntando o volume: é a única pergunta que faz o preço ficar certo.',
 '{"pricing.range","pricing.modelo"}',
 '{"pricing.o_que_conta","pricing.implantacao_custa","pricing.formas_pagamento"}', '{}', 'escalate',
 'Faixa + o que a define, e o modelo de cobrança como argumento (Hormozi)',
 '{"Cotar fechado sem saber o volume","Esconder a faixa: ele procura o próximo","Omitir taxa de implantação","Responder o preço e não perguntar o volume"}',
 'levantar_volume', 'skill_seed', 'active', null),

(null, 'software_b2b', 'pricing', 'reactive',
 '{"cobra por usuário","é por pessoa","o que conta como atendimento","se eu colocar mais gente aumenta","conta cada mensagem","e se eu passar do limite"}',
 null,
 'Responda com a definição exata do DNA, sem arredondar — é ela que evita a briga
na primeira fatura, e essa briga custa o cliente inteiro.
Explique a lógica, porque ela vende: cobrar por usuário faz a empresa economizar
tirando gente do sistema, e aí o sistema não tem o dado de ninguém. Cobrar por
atendimento alinha a conta ao valor: você paga pelo que o produto trabalhou.
Diga o que acontece ao passar do limite ANTES de ele perguntar. Se existe cota,
diga que ela existe, quanto é, e o que continua funcionando quando ela acaba —
esconder um teto é criar uma reclamação com data marcada.
Nunca invente um limite nem diga "é ilimitado" sem o DNA afirmar.',
 '{"pricing.o_que_conta","pricing.modelo"}',
 '{"pricing.range","pricing.modulos_a_parte"}', '{}', 'escalate',
 'Definição exata + a lógica do modelo como diferencial',
 '{"Dizer ''ilimitado'' sem o DNA afirmar","Arredondar a regra de contagem","Deixar o limite para a fatura descobrir"}',
 'confirmar_modelo', 'skill_seed', 'active', null),

-- --------------------------------------------------- ENTRADA SEM RISCO
(null, 'software_b2b', 'risk_free_entry', 'reactive',
 '{"tem teste","posso testar","tem período grátis","dá para experimentar","tem demonstração","quero ver funcionando"}',
 null,
 'O teste é a melhor peça de venda deste produto, e a maioria das empresas o
apresenta errado: mandam o acesso e somem. Apresente como o que é — a chance de
ver o produto respondendo uma mensagem REAL da empresa dele, não uma demo
genérica.
Diga do DNA: quanto dura, o que está liberado, se pede cartão e — a parte que
quase ninguém diz na venda — O QUE ACONTECE QUANDO O TESTE ACABA. Dizer isso
agora vale mais que qualquer desconto: é o que separa quem está vendendo de quem
está empurrando.
Combine o primeiro atendimento junto. Teste que começa sozinho é teste que
expira sozinho: o silêncio no trial é o sinal de perda mais confiável deste
segmento, e ele aparece antes de qualquer objeção ser dita.
Peça uma mensagem de cliente que ele recebeu esta semana. É com ela que a
primeira resposta deve ser gerada.',
 '{"teste.oferece","teste.duracao","teste.o_que_acontece_depois"}',
 '{"teste.o_que_inclui","teste.precisa_cartao","implantacao.prazo"}', '{}', 'escalate',
 'O teste com mensagem REAL dele + combinar o primeiro uso (Cialdini)',
 '{"Mandar o acesso e sumir","Fazer demo genérica em vez de usar a mensagem dele","Não dizer o que acontece quando o teste acaba","Começar o teste sem o DNA preenchido: o motor escala em tudo e ele acha que a IA não sabe nada"}',
 'iniciar_teste', 'skill_seed', 'active', null),

(null, 'software_b2b', 'risk_free_entry', 'proactive',
 '{}',
 'trial_followup',
 'Teste sem uso não vira assinatura. Este é o toque que decide a venda, e ele NÃO
é cobrança: ninguém assina porque foi cobrado a usar.
Abra pelo que trava de verdade, que quase sempre é o cadastro pela metade — o
produto não morre por falta de recurso, morre no DNA que ninguém terminou.
Pergunte de forma leve onde ele parou e resolva junto, na hora, por mensagem.
Se já houve uso, traga NÚMERO da conta dele: quantos atendimentos passaram pelo
sistema, quantos ficaram sem resposta, quanto tempo levou a primeira resposta.
O dado da própria empresa convence o que nenhum argumento convence, e é a única
coisa que um concorrente não consegue copiar.
Na reta final do teste, diga o que muda quando ele acabar — com antecedência,
não no dia. E aceite o não: um não dito libera a sua agenda e costuma virar o
motivo real, que às vezes tem conserto.',
 '{"teste.duracao","teste.o_que_acontece_depois"}',
 '{"implantacao.o_que_o_cliente_faz","pricing.range"}', '{}', 'omit',
 'Destravar o cadastro + devolver o número da conta dele (Blount)',
 '{"Cobrar uso: ninguém assina por cobrança","Perguntar ''o que achou?'' sem trazer dado","Avisar do fim do teste no último dia","Insistir sem descobrir onde o cadastro parou"}',
 'destravar_uso', 'skill_seed', 'active', null),

-- ----------------------------------------------------- DISPONIBILIDADE
(null, 'software_b2b', 'availability', 'reactive',
 '{"quanto tempo para começar","demora para implantar","é rápido de configurar","quando eu começo a usar","preciso instalar alguma coisa"}',
 null,
 'Responda com o prazo real do DNA e, junto, com a parte que quase toda empresa
de software esconde: O QUE É TRABALHO DELE. Esconder isso não acelera a venda —
faz o cadastro parar pela metade e o cliente concluir que o produto não funciona.
O gargalo deste produto é o onboarding, não o motor: empresa sem os fatos
cadastrados não tem produto, porque a trava anti-invenção escala em tudo e a
pessoa acha que "a IA não sabe nada". Diga isso com franqueza e ofereça fazer
junto, se for verdade no DNA.
Divida em duas datas, não uma: quando ele consegue responder o primeiro
atendimento, e quando a equipe inteira está usando. São coisas diferentes e o
prazo único confunde.
Nunca prometa "está pronto em minutos". É verdade para o acesso e mentira para o
produto.',
 '{"implantacao.prazo","implantacao.o_que_o_cliente_faz"}',
 '{"implantacao.quem_faz","implantacao.treinamento"}', '{}', 'escalate',
 'Dois prazos (primeiro uso e equipe toda) + assumir o trabalho do cliente',
 '{"Prometer ''pronto em minutos''","Esconder o que é trabalho dele","Dar um prazo único para coisas diferentes","Ignorar que sem cadastro o motor escala em tudo"}',
 'agendar_implantacao', 'skill_seed', 'active', null),

-- ------------------------------------------------------- PROVA
(null, 'software_b2b', 'expertise_proof', 'reactive',
 '{"quem são vocês","há quanto tempo existem","quem usa","tem cliente parecido comigo","vocês são de onde","é empresa séria"}',
 null,
 'A pergunta é sobre risco, não sobre currículo: ele está pensando em confiar o
funil da empresa dele a alguém. Responda com o que é verificável no DNA — tempo
de mercado, quantas empresas usam, quais segmentos já têm biblioteca pronta.
O argumento mais forte deste produto não é tecnologia, é CURADORIA: a técnica de
venda aplicada ao ramo dele já está escrita, e isso é o que nenhum sistema
genérico tem. Diga o nome do ramo dele se estiver na lista.
Se houver caso de cliente, use número medido e com autorização — nunca nome sem
permissão, nunca percentual estimado. Em software, número inflado é a coisa que
o comprador confere.
Se você é pequeno, diga que é pequeno e transforme em argumento verdadeiro:
quem fala com você é quem constrói o produto. Fingir tamanho é o erro que não
sobrevive à primeira pergunta técnica.',
 '{"prova.tempo_de_mercado"}',
 '{"prova.casos","prova.segmentos_atendidos","produto.para_quem"}', '{}', 'omit',
 'Prova verificável + a curadoria do ramo como o que não se copia',
 '{"Inventar número de clientes","Citar nome de cliente sem autorização","Fingir ser maior do que é","Responder com adjetivo em vez de fato"}',
 'enviar_prova', 'skill_seed', 'active', null),

-- ------------------------------------------------------------ CATÁLOGO
(null, 'software_b2b', 'catalog', 'reactive',
 '{"o que o sistema faz","quais são os módulos","tem relatório","faz agendamento","tem curso","o que vem junto"}',
 null,
 'Não liste tudo. Responda o que ele perguntou usando SOMENTE a lista de módulos
do DNA, diga se está incluso ou é à parte, e ligue cada um ao problema que ele
já contou ter. Lista de funcionalidade não vende software para PME — vende quem
mostra a função resolvendo a dor que a pessoa acabou de descrever.
Se ele perguntou por algo que não existe, diga que não existe. É a hora mais
barata de dizer, e a lista do que o produto NÃO faz está no DNA justamente para
isso. Roadmap não é produto: prometer o que está para sair é vender o que não
existe e criar o cancelamento do terceiro mês.
Ofereça UMA alternativa próxima quando fizer sentido para o objetivo dele.',
 '{"produto.modulos","produto.o_que_nao_faz"}',
 '{"pricing.modulos_a_parte","produto.o_que_e"}', '{}', 'escalate',
 'Módulo ligado à dor que ele contou, nunca lista de recurso',
 '{"Despejar a lista inteira de funcionalidades","Prometer o que está no roadmap","Deixar de dizer que um módulo é cobrado à parte","Responder ''faz tudo''"}',
 'confirmar_modulo', 'skill_seed', 'active', null),

-- ------------------------------------------------- ENCAIXE COM O OBJETIVO
(null, 'software_b2b', 'goal_matching', 'reactive',
 '{"oi","olá","bom dia","boa tarde","vi o anúncio","queria entender melhor","me explica como funciona"}',
 null,
 'Abertura aqui é descoberta, e a pergunta que direciona tudo não é sobre o
produto: é COMO A EMPRESA ATENDE HOJE. Quem responde as mensagens, por onde
chegam, e o que acontece quando ninguém responde.
Duas perguntas, não cinco. E aproveite para descobrir cedo com quem você está
falando, sem constrangimento: "você é quem cuida da parte comercial aí, ou
consigo falar com quem cuida?". Perguntar no primeiro contato é natural;
descobrir depois da proposta pronta é tarde demais.
NÃO comece explicando o produto. Explicar recurso para quem ainda não nomeou o
problema é o jeito mais rápido de virar "mais um sistema". Deixe ele descrever o
jeito de hoje — é ali que aparece o custo que ele paga sem enxergar.
Responda rápido. Vender velocidade de resposta respondendo devagar encerra a
conversa sozinho.',
 '{}',
 '{"produto.o_que_e","produto.para_quem"}', '{}', 'omit',
 'Duas perguntas sobre o jeito de HOJE + descobrir o decisor no 1º contato',
 '{"Começar explicando o produto","Fazer cinco perguntas seguidas: vira formulário","Descobrir quem decide depois da proposta","Demorar para responder quem vende resposta rápida"}',
 'qualificar_atendimento', 'skill_seed', 'active', null),

(null, 'software_b2b', 'goal_matching', 'reactive',
 '{"serve para o meu ramo","funciona para o meu negócio","vocês atendem meu segmento","é para academia","sirvo para isso"}',
 null,
 'Confirme com a lista de segmentos do DNA e seja específico — dizer "serve para
qualquer negócio" é o mesmo que dizer "não foi feito para o seu".
O diferencial real está aqui e vale a frase inteira: a técnica de venda já vem
escrita PARA O RAMO DELE. A pergunta que a academia recebe não é a que a
indústria recebe, e a resposta certa também não é. Isso é curadoria, não
configuração — e é a única parte do produto que não se copia em duas semanas.
Se o ramo dele NÃO está na lista, diga com franqueza e explique o que existe: o
núcleo funciona, a biblioteca do ramo ainda não. Prometer que "se adapta" é
vender uma caixa vazia, que é exatamente o que ele já tentou antes.
Termine ligando ao gargalo que ele descreveu, não ao catálogo.',
 '{"prova.segmentos_atendidos","produto.para_quem"}',
 '{"produto.o_que_e","produto.o_que_nao_faz"}', '{}', 'escalate',
 'Curadoria do ramo como diferencial + honestidade quando o ramo não existe',
 '{"Dizer que serve para qualquer negócio","Prometer que ''se adapta'' a um ramo sem biblioteca","Responder com o catálogo em vez do gargalo dele"}',
 'confirmar_segmento', 'skill_seed', 'active', null),

-- ----------------------------------------------------------- OBJEÇÕES
(null, 'software_b2b', 'objections', 'reactive',
 '{"já tenho um sistema","uso planilha","anoto no caderno","meu WhatsApp já resolve","tenho CRM","já uso outro"}',
 null,
 'ESTA É A OBJEÇÃO CENTRAL DO SEGMENTO, e a resposta que quase todo mundo dá é a
errada: sair listando o que o seu produto faz e o outro não. Isso vira disputa de
funcionalidade, terreno onde qualquer um empata.
Primeiro, NÃO ataque o que ele usa. Ele escolheu aquilo, e criticar soa como
criticar a escolha dele.
Depois faça a pergunta que muda a conversa: quando chega um orçamento e a pessoa
não responde, o que acontece? Quase sempre a resposta é "fica pra depois" — e
"depois" é o custo invisível que ele paga todo mês sem ver. Em serviços técnicos,
mais de 70% dos orçamentos nunca recebem uma segunda mensagem.
Aí posicione com precisão: não vendemos onde guardar o contato, isso ele já tem.
Vendemos a TÉCNICA que falta — o que dizer, quando cobrar de novo, e por quê.
Se ele já tem um sistema que resolve a operação, diga isso na cara: não é para
trocar, é para o que falta ali. O segundo sistema perde, e fingir o contrário
perde o cliente daqui a três meses.',
 '{"produto.o_que_e"}',
 '{"produto.modulos","integracoes.importacao","prova.casos"}', '{}', 'omit',
 'Tornar visível o custo do jeito de hoje (Challenger), nunca comparar recurso',
 '{"Listar funcionalidades contra o que ele usa","Falar mal da planilha ou do sistema atual","Propor substituir o que já funciona","Vender ''organização'': ele já acha que é organizado"}',
 'revelar_custo_atual', 'skill_seed', 'active', null),

(null, 'software_b2b', 'objections', 'reactive',
 '{"minha equipe não vai usar","eles não têm paciência","já tentei e ninguém usou","meu pessoal é do WhatsApp","vai dar trabalho para treinar"}',
 null,
 'Este é o medo mais honesto do dono de PME e o que mais mata software neste
mercado — e ele tem razão histórica: provavelmente já pagou por um sistema que a
equipe abandonou.
NÃO responda com "é muito fácil de usar". Todo mundo diz isso, e ele já ouviu
antes de abandonar o último.
Trate como diagnóstico: pergunte o que aconteceu da outra vez. Quase sempre é a
mesma coisa — o sistema pedia para digitar de novo o que já estava no WhatsApp,
sem devolver nada em troca. Ferramenta que só cobra dado é ferramenta abandonada.
Depois mostre a diferença concreta, com o que existir no DNA: aqui o vendedor
COLA a mensagem do cliente e RECEBE uma resposta pronta com a técnica explicada.
A troca é imediata e a favor dele — é o oposto de alimentar um cadastro.
Ofereça o teste com UM vendedor, não com a equipe inteira. Um convertido dentro
da casa vale mais que qualquer treinamento, e derruba o risco da decisão.',
 '{}',
 '{"implantacao.treinamento","teste.o_que_inclui","implantacao.o_que_o_cliente_faz"}', '{}', 'omit',
 'Diagnosticar o abandono anterior + começar por UM vendedor (JOLT — tirar risco)',
 '{"Responder ''é fácil de usar''","Prometer que a equipe vai adotar","Propor treinar todo mundo de uma vez","Ignorar que ele já foi queimado antes"}',
 'reduzir_risco', 'skill_seed', 'active', null),

(null, 'software_b2b', 'objections', 'reactive',
 '{"está caro","é muito para o meu tamanho","não cabe no orçamento","achei salgado","tem coisa mais barata"}',
 null,
 'Antes de mexer no preço, descubra caro COMPARADO A QUÊ. Em software para PME a
comparação quase nunca é com outro produto: é com zero, porque hoje ele não paga
nada por isso — e "de graça" é imbatível até o custo do de graça aparecer.
Então traga a conta que ele nunca fez, com os números DELE: quantos orçamentos
saem por mês, quantos não recebem segunda mensagem, quanto vale um fechamento.
Um cliente recuperado por mês costuma pagar o sistema inteiro. Essa conta não é
promessa de resultado — é aritmética sobre o que ele mesmo informou.
NÃO dê desconto na primeira pressão: desconto reflexo em assinatura vira
renegociação todo mês e desvaloriza o produto no segmento inteiro, porque dono
de PME conversa com dono de PME.
Se realmente não couber, ofereça o que cabe de verdade: menos módulos, começar
por um vendedor. Cliente que começou pequeno cresce; cliente pressionado cancela.',
 '{"pricing.range"}',
 '{"pricing.modelo","pricing.formas_pagamento","produto.modulos"}', '{}', 'escalate',
 'A conta com os números DELE, nunca promessa de resultado',
 '{"Dar desconto na primeira pressão","Prometer aumento de vendas ou percentual de conversão","Comparar com concorrente em vez de comparar com o custo de hoje","Empurrar o plano cheio quando ele cabe no menor"}',
 'defender_valor', 'skill_seed', 'active', null),

(null, 'software_b2b', 'objections', 'reactive',
 '{"é mais um sistema","vou ter que alimentar mais um lugar","já tenho sistema demais","mais uma tela para olhar","não quero mais senha"}',
 null,
 'Objeção legítima, e a casa concorda com ela — o segundo sistema perde, e fingir
o contrário só adia a descoberta. Reconheça isso de frente, porque concordar aqui
é o que dá credibilidade ao resto.
A pergunta que separa é: ele vai digitar a mesma coisa duas vezes, ou vai receber
algo que não tinha? Ferramenta que só pede dado é abandonada; ferramenta que
devolve resposta pronta na hora em que ele precisa responder, não.
Mostre o fluxo real com o que existe no DNA: a mensagem do cliente entra, a
resposta sai com a técnica explicada, e o registro acontece de lambuja — o
cadastro é efeito colateral do trabalho, não trabalho a mais.
Se, ouvindo ele, a conclusão honesta for que hoje isso REALMENTE seria um segundo
lugar para alimentar, diga. Perder essa venda é mais barato que um cancelamento
em três meses com uma avaliação pública junto.',
 '{"produto.o_que_e"}',
 '{"integracoes.quais","produto.modulos"}', '{}', 'omit',
 'Concordar com a objeção e mostrar a troca imediata (Challenger)',
 '{"Negar que é mais um sistema","Prometer integração que não existe para contornar","Insistir quando a resposta honesta é que não serve agora"}',
 'mostrar_fluxo', 'skill_seed', 'active', null),

(null, 'software_b2b', 'objections', 'reactive',
 '{"a IA vai responder pelo meu cliente","vai mandar mensagem sozinha","não quero robô falando","o cliente vai perceber que é robô","perde o toque humano"}',
 null,
 'Recuse a premissa com clareza, porque a resposta honesta aqui é melhor que a
resposta que ele teme: a IA NÃO atende sozinha e não substitui o vendedor. Ela
redige, explica a técnica usada e mostra o próximo passo — quem lê, ajusta e
ENVIA é gente.
Diga isso mesmo que pareça vender menos. Quem promete atendimento automático está
vendendo o que o cliente dele vai detestar, e a conta chega em avaliação pública.
O enquadramento certo: o produto não tira o vendedor da conversa, tira dele a
parte que ele faz mal quando está com pressa — lembrar do follow-up, achar a
resposta certa, saber o que dizer para quem travou.
Se o DNA disser que o envio é manual, diga que é manual. É verdade, e é
tranquilizador exatamente para quem tem esse medo.',
 '{}',
 '{"integracoes.whatsapp","produto.o_que_nao_faz","produto.o_que_e"}',
 '{"Nunca dizer que a IA atende sozinha ou substitui o vendedor.","Nunca afirmar envio automático sem o campo de integração confirmar."}', 'omit',
 'Recusar a premissa: a inteligência é nossa, o envio é humano',
 '{"Dizer que automatiza o atendimento","Prometer envio automático sem o DNA confirmar","Vender ''robô que vende sozinho''"}',
 'alinhar_expectativa', 'skill_seed', 'active', null),

(null, 'software_b2b', 'objections', 'reactive',
 '{"vou perder o que já tenho","consigo trazer meus contatos","tenho tudo na planilha","e o histórico do meu cliente","dá para importar"}',
 null,
 'Responda com o que o DNA diz que a importação FAZ e o que ela NÃO faz, nessa
ordem. Prometer migração completa e entregar metade é a decepção que acontece no
primeiro dia de uso, quando o cliente ainda está decidindo se confia.
Separe duas coisas que ele mistura: trazer a lista de contatos costuma ser
simples; trazer o histórico de conversa raramente é. Diga qual é o caso.
E tire o peso da decisão: ele não precisa migrar tudo para começar. Começar pelos
contatos ativos é mais rápido, mostra valor na primeira semana e evita o projeto
de importação que trava a implantação inteira.
Se ele não tem nada estruturado — só WhatsApp e memória —, isso não é problema, é
o caso mais comum. Diga assim.',
 '{"integracoes.importacao"}',
 '{"integracoes.o_que_nao_integra","implantacao.prazo","implantacao.o_que_o_cliente_faz"}', '{}', 'escalate',
 'Separar contato de histórico + começar pelos ativos, não por tudo',
 '{"Prometer migração completa sem confirmar","Tratar ''não tenho nada organizado'' como problema","Deixar a importação virar o projeto que trava a implantação"}',
 'reduzir_risco', 'skill_seed', 'active', null),

-- ---------------------------------------------------------- COMPROMISSO
(null, 'software_b2b', 'commitment_offer', 'reactive',
 '{"tem fidelidade","tem contrato","e se eu quiser cancelar","preciso assinar por quanto tempo","tem multa","como faço para sair"}',
 null,
 'Responda com o contrato do DNA, sem amenizar. Quem pergunta como sai está
medindo o risco de entrar — e em software essa é a pergunta que mais decide,
porque ele já ficou preso a algo antes.
Diga os três na ordem: por quanto tempo prende, como se cancela na prática (o
caminho real, não o teórico), e o que acontece com os dados dele depois.
O terceiro é o que converte e quase ninguém oferece espontaneamente. Se ele leva
os dados embora, isso é um argumento forte: reduz o custo de errar com você.
Se NÃO há fidelidade, diga com todas as letras — é diferencial num mercado em que
quase todo mundo prende. Se há, diga por quê, com honestidade.
Nunca prometa isenção que não está no contrato.',
 '{"contrato.fidelidade","contrato.cancelamento","dados.se_cancelar"}',
 '{"dados.exportacao","contrato.reajuste"}', '{}', 'escalate',
 'Abrir o contrato inteiro + a saída como redutor de risco (JOLT)',
 '{"Amenizar a fidelidade","Não falar do que acontece com os dados","Prometer isenção fora do contrato","Deixar o reajuste para a surpresa"}',
 'reduzir_risco', 'skill_seed', 'active', null),

(null, 'software_b2b', 'commitment_offer', 'reactive',
 '{"vou pensar","preciso ver com meu sócio","depois eu te falo","me manda por e-mail que eu vejo","vou avaliar","esse mês não dá"}',
 null,
 'ATENÇÃO: isto quase nunca é preço. Quem chegou até aqui já concordou que perde
venda por falta de follow-up — travou porque já pagou por um sistema abandonado e
tem medo de repetir.
Primeiro julgue: se ele ainda não enxergou o custo do jeito de hoje, é falta de
valor e você volta para a descoberta. Mas se concordou com tudo e mesmo assim
adiou, é INDECISÃO — e aí o erro clássico é mandar mais material. Mais detalhe
vira mais risco percebido e mais gente para consultar.
Faça o contrário de dar mais opções: RECOMENDE UMA. "No seu caso eu começaria só
com o Responder, com um vendedor" vale mais que a tabela de planos inteira.
Depois tire o risco com o que existir de verdade: teste antes de pagar, sem
fidelidade, dados exportáveis, começar por um vendedor.
E descubra o que trava de fato, perguntando direto: falta o sócio aprovar, falta
caixa, ou é receio da equipe não usar? Cada um tem saída diferente, e raramente é
o que a primeira frase diz. Combine o próximo passo COM DATA — sem data, este
cliente some, e some sem dizer não.',
 '{}',
 '{"teste.oferece","contrato.fidelidade","dados.exportacao","pricing.range"}', '{}', 'omit',
 'Recomendar UM caminho e tirar risco — nunca mandar mais material',
 '{"Mandar mais material para quem já concordou","Dar desconto achando que o problema é preço","Aceitar o ''vou pensar'' sem descobrir o que trava","Deixar sem data marcada"}',
 'marcar_retorno', 'skill_seed', 'active', null),

-- --------------------------------------------------------- RECIPROCIDADE
(null, 'software_b2b', 'reciprocity', 'reactive',
 '{"conheço alguém que precisa","tenho um amigo com empresa","posso indicar","tem programa de indicação","fui indicado"}',
 null,
 'Indicação é a captação mais barata deste segmento por um motivo estrutural: dono
de PME confia em dono de PME muito mais do que em anúncio. E o indicado chega com
a objeção mais difícil já resolvida — a de que o sistema é abandonado.
Se existe recompensa cadastrada, diga qual é e para os DOIS lados. Se não existe,
agradeça de forma concreta assim mesmo e ofereça o que estiver no DNA: implantação
feita junto, um módulo liberado, prioridade no suporte. Nunca invente benefício.
O momento de PEDIR não é na assinatura: é depois do primeiro resultado que ele
consegue medir na própria conta. Pedir antes é pedir no vazio.
Quando alguém chega indicado, use o vínculo — cite quem indicou (sem expor dado
nenhum dele) e comece pelo problema que aquele conhecido já resolveu.',
 '{}',
 '{"pricing.implantacao_custa","prova.casos"}', '{}', 'omit',
 'Recompensa para os dois lados + pedir depois do primeiro resultado medido',
 '{"Inventar programa de indicação","Pedir indicação na assinatura, antes de qualquer resultado","Expor dados de quem indicou"}',
 'pedir_indicacao', 'skill_seed', 'active', null),

-- ----------------------------------------------------- LIMITES E ÉTICA
(null, 'software_b2b', 'limits_and_ethics', 'reactive',
 '{"onde ficam meus dados","vocês veem meus clientes","é seguro","e a LGPD","quem tem acesso","meus dados vão para a IA"}',
 null,
 'Responda com o campo de dados do DNA e SÓ com ele. Esta é a pergunta em que uma
resposta vaga custa a venda inteira, porque quem pergunta já desconfia.
Diga quatro coisas, nesta ordem: onde os dados ficam, quem consegue ver e em que
situação, se ele consegue exportar quando quiser, e o que acontece se cancelar.
Não use "é tudo criptografado" como resposta — é verdade em todo lugar e não
responde nada do que ele perguntou.
Sobre a IA: seja específico. Diga o que é enviado ao modelo e o que não é. Vago
aqui é pior que ruim, porque a pessoa preenche o silêncio com o pior cenário.
Se o dado exato não estiver no DNA, NÃO responda por dedução. Diga que vai
confirmar e volte com a resposta escrita — em LGPD, chutar é a coisa mais cara
que se pode fazer.',
 '{"dados.onde_ficam","dados.quem_ve","dados.exportacao","dados.se_cancelar"}',
 '{"contrato.cancelamento"}',
 '{"Nunca afirmar política de dados, retenção ou tratamento fora do que está no DNA."}', 'escalate',
 'Quatro respostas concretas em vez de ''é seguro'' (Carnegie — franqueza que aproxima)',
 '{"Responder ''é tudo criptografado'' e achar que respondeu","Ser vago sobre o que vai para a IA","Deduzir política de dados que não está escrita","Prometer conformidade sem o DNA afirmar"}',
 'confirmar_politica_de_dados', 'skill_seed', 'active', null),

(null, 'software_b2b', 'limits_and_ethics', 'reactive',
 '{"faz emissão de nota","controla estoque","tem financeiro","faz folha de pagamento","envia mensagem sozinho","faz disparo em massa"}',
 null,
 'RECUSE com clareza e sem rodeio, e recuse de um jeito que aumente a confiança —
porque aumenta mesmo. Dizer o que o produto não faz é o movimento que mais
converte nesta conversa, e é o oposto do que ele espera ouvir de um vendedor.
Use a lista do DNA. Se está lá como "não faz", a resposta é não, mesmo que a
venda esteja quase fechada. Prometer aqui não perde um cliente: perde a reputação
com o segmento inteiro, porque dono de PME conversa com dono de PME.
Depois de dizer não, faça duas coisas: explique por que não fazemos (foco em
técnica de venda, não em gestão), e diga o que resolve o problema por trás, se
existir. Muitas vezes o pedido é sintoma de outra coisa.
Caso especial e importante: DISPARO EM MASSA não é algo que "ainda não temos" —
é algo que a casa decidiu não fazer, por LGPD e por risco de banir o número do
cliente. Diga assim, com a razão junto. A razão é o que transforma um não em
argumento.',
 '{"produto.o_que_nao_faz"}',
 '{"produto.modulos","integracoes.o_que_nao_integra","integracoes.whatsapp"}',
 '{"Nunca prometer recurso que está na lista do que o produto NÃO faz, nem como roadmap."}', 'escalate',
 'Recusar com a razão junto — o não que constrói autoridade',
 '{"Prometer para o roadmap","Dizer ''em breve'' sem data e sem compromisso","Recusar sem explicar por quê","Empurrar um módulo que não resolve o que ele pediu"}',
 'alinhar_escopo', 'skill_seed', 'active', null),

-- -------------------------------------------------------------- RETENÇÃO
(null, 'software_b2b', 'retention', 'proactive',
 '{"parou de usar","não entra faz tempo","caiu o uso","reclamou","vai cancelar","não respondeu o suporte"}',
 'reactivation',
 'ESTA É A ENTRADA QUE PROTEGE A RECEITA JÁ VENDIDA. Em assinatura, o dinheiro se
perde DEPOIS da venda, e o cancelamento é o último passo — não o primeiro. Antes
dele vêm queda de uso, silêncio e a equipe voltando para o WhatsApp.
Chame cedo e NUNCA cobre o uso: cobrança gera culpa e culpa gera silêncio. Abra
pelo que a conta dele mostra, não pelo que falta — "vi que os atendimentos de
julho não passaram por aqui" é diagnóstico; "você não está usando" é cobrança.
Pergunte direto o que mudou. As três causas reais são quase sempre estas, e todas
têm saída concreta: o cadastro nunca ficou pronto e o motor escala em tudo; a
pessoa que usava saiu da empresa; ou a equipe voltou ao jeito antigo porque
ninguém mostrou o ganho.
Ofereça o conserto específico, não desconto. Desconto para quem não usa compra
mais um mês de não uso — e o cancelamento acontece igual, um mês depois.',
 '{}',
 '{"implantacao.o_que_o_cliente_faz","implantacao.treinamento","produto.modulos"}', '{}', 'omit',
 'Agir na queda de uso, não no pedido de cancelamento (Blount)',
 '{"Abrir cobrando o uso","Esperar o pedido de cancelamento para agir","Oferecer desconto antes de descobrir a causa","Assumir que silêncio é satisfação"}',
 'reter_cliente', 'skill_seed', 'active', null),

(null, 'software_b2b', 'retention', 'proactive',
 '{"cancelou","era cliente","saiu no ano passado","cliente antigo","voltou a procurar"}',
 'reactivation',
 'Quem cancelou é o lead mais barato que existe: já conhece o produto, já passou
pela implantação e já sabe onde dói. E é a base que praticamente todo mundo
esquece.
Retome pelo MOTIVO da saída, nunca por promoção genérica. Se o motivo tinha
conserto e foi consertado, essa é a mensagem inteira — diga o que mudou
exatamente naquilo, com honestidade sobre o que continua igual.
Se o motivo não foi consertado, não invente que foi. Reconhecer aumenta a chance
de ele voltar quando for, e destrói se você fingir.
Se a saída foi por caixa, o gancho é outro: o menor plano que resolve o gargalo
principal, não o plano que ele tinha.
Espace os toques. Dois contatos bem colocados valem mais que seis, e insistir com
quem cancelou queima a indicação junto.',
 '{}',
 '{"produto.modulos","pricing.range","contrato.fidelidade"}', '{}', 'omit',
 'Voltar pelo motivo da saída, nunca por promoção (Blount — gancho com razão)',
 '{"Mandar promoção genérica para quem cancelou","Fingir que um problema foi resolvido","Insistir: com quem cancelou, insistência queima a indicação também"}',
 'reativar_cliente', 'skill_seed', 'active', null),

-- ----------------------------------------------------------- ECOSSISTEMA
(null, 'software_b2b', 'ecosystem', 'reactive',
 '{"integra com o whatsapp","conversa com meu sistema","tem api","integra com agenda","manda mensagem automática","integra com meu erp"}',
 null,
 'Responda com a lista de integrações do DNA — SÓ o que já funciona — e diga com a
mesma clareza o que não integra. Roadmap não entra nesta resposta: prometer
integração futura é a promessa que mais volta como cancelamento, porque o cliente
compra por causa dela.
Sobre WhatsApp, seja específico e honesto, porque é a pergunta que mais chega e a
que mais se mente: diga se o envio é automático ou se a mensagem é preparada e
enviada por uma pessoa. A resposta honesta tem um argumento embutido — sem API
não oficial, não existe risco de o número do cliente ser banido, e esse risco é
real no mercado.
Se ele precisa de uma integração que não existe, diga que não existe e pergunte o
que ela resolveria. Muitas vezes o objetivo tem outro caminho já disponível —
descobrir isso vale mais que a integração.',
 '{"integracoes.quais","integracoes.whatsapp"}',
 '{"integracoes.o_que_nao_integra","integracoes.importacao"}',
 '{"Nunca prometer integração que não esteja na lista do DNA, nem como roadmap."}', 'escalate',
 'Só o que já funciona + o envio humano como proteção do número dele',
 '{"Prometer integração de roadmap","Dizer ''integra com tudo''","Ser vago sobre o envio no WhatsApp","Não perguntar o que a integração pedida resolveria"}',
 'confirmar_integracao', 'skill_seed', 'active', null);


-- =====================================================================
-- VERIFICAÇÃO 1 — quantas entradas por categoria
-- =====================================================================
select category      as "Categoria",
       count(*)      as "Entradas",
       count(*) filter (where entry_type = 'proactive') as "Proativas"
from public.knowledge_entries
where skill_key = 'software_b2b' and tenant_id is null
group by category
order by 1;


-- =====================================================================
-- VERIFICAÇÃO 2 — a estratégia não pode conter fato do cliente.
-- O resultado esperado é ZERO linhas.
-- =====================================================================
select category, left(strategy, 60) as "Trecho"
from public.knowledge_entries
where skill_key = 'software_b2b' and tenant_id is null
  and (strategy ~* 'R\$ ?[0-9]' or strategy ~* '[0-9]{2}:[0-9]{2}');
