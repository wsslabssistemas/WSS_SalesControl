-- =====================================================================
-- COS — MIGRATION 0030 : BIBLIOTECA DE ENERGIA SOLAR FOTOVOLTAICA
--
-- PESQUISA (ago/2026). O que separa este segmento de todos os outros:
--
--   • A CONTA DE LUZ É O DADO DE ENTRADA. Sem ela não há dimensionamento,
--     geração estimada nem payback. Quem cota sem a conta está chutando —
--     e chute em ticket de dezenas de milhares vira reclamação.
--   • O CLIENTE NUNCA ZERA A CONTA. Custo de disponibilidade continua:
--     30 kWh monofásico, 50 kWh bifásico, 100 kWh trifásico. "Conta zero"
--     é a promessa mais comum do setor e a que mais gera processo.
--   • ENTRE INSTALAR E ECONOMIZAR EXISTEM 40 A 100 DIAS. Projeto, vistoria,
--     troca de medidor e homologação. REN 1.059/2023: a distribuidora tem
--     30 dias para o projeto e 7 dias úteis para a vistoria. O prazo é dela;
--     a ansiedade é do cliente; a culpa cai no instalador.
--   • O RELÓGIO REGULATÓRIO CORRE CONTRA A ESPERA. Fio B progressivo: 45%
--     em 2025, 60% em 2026, 75% em 2027, 90% em 2028. Direito adquirido só
--     para quem homologou até 06/01/2023 (isento até 2045). Adiar custa mais
--     caro a cada ano — é a única urgência REAL que este mercado tem.
--   • GARANTIAS DESIGUAIS. Módulo: ~25 anos de desempenho, 10 a 12 de
--     produto. Inversor: 5 a 10 anos. Quem fala "25 anos de garantia" sem
--     separar está criando o próprio problema para daqui a oito anos.
--   • CRÉDITO EXPIRA EM 60 MESES. Superdimensionar não é vender mais, é
--     vender crédito que vence sem uso.
--
-- REGRA DA TRAVA: `escalate` quando o fato que falta é NÚMERO ou
-- COMPROMISSO (preço, prazo, garantia, financiamento). `omit` quando é
-- prova opcional. Aqui a lista de `hard_rules` do manifesto pesa mais que
-- em qualquer outro segmento: promessa errada em solar vira processo.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'energia_solar' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

-- ---------------------------------------------------------------- PRICING
(null, 'energia_solar', 'pricing', 'reactive',
 '{"quanto custa","qual o valor","quanto fica um sistema","preço da energia solar","quanto custa colocar placa","valor do kit"}',
 null,
 'NÃO EXISTE preço de energia solar sem a conta de luz. O sistema é dimensionado
pelo consumo: mesma casa, contas diferentes, projetos diferentes. Dar um número
agora é chutar — e o chute vira âncora, então se o projeto real sair acima você
já perdeu antes de começar.
Explique isso em uma frase e peça a conta: "o valor depende do seu consumo,
me manda uma foto da sua conta de luz que eu te trago o número certo". Pedir a
conta não é burocracia, é o que te separa de quem manda tabela por WhatsApp.
E o que você precisa não é o mês: é a MÉDIA DE 12 MESES, que vem discriminada na
própria fatura. Solar se dimensiona por média porque o sistema gera mais no verão
para abastecer o inverno — quem dimensiona pelo mês que a pessoa mandou erra a
potência para cima ou para baixo, e as duas doem.
Se precisar dar alguma referência para a pessoa não desistir, use a FAIXA dos
projetos que você costuma fazer, deixando claro que é faixa e do que depende.
E diga o que está incluso: kit, estrutura, proteções, projeto com ART, mão de
obra e homologação. Orçamento que não diz o que inclui é o que perde para o
"mais barato" que não inclui nada.',
 '{"precos.como_cobra","precos.o_que_inclui"}',
 '{"precos.faixa","precos.formas_pagamento","precos.financiamento"}', '{}', 'escalate',
 'Não cotar sem a conta de luz + faixa com escopo explícito',
 '{"Dar preço por kWp para quem não mandou a conta","Mandar tabela de kit sem dimensionar","Cotar sem dizer o que está incluso","Deixar a pessoa comparar sua proposta completa com kit avulso"}',
 'pedir_conta', 'skill_seed', 'active', null),

-- ------------------------------------------------------------- OBJECTIONS
(null, 'energia_solar', 'objections', 'reactive',
 '{"tá caro","achei caro","é muito dinheiro","não tenho esse valor","fora do meu orçamento","muito investimento"}',
 null,
 'Em solar "caro" quase nunca é sobre o preço: é sobre o tamanho do cheque
comparado a uma conta que ele já paga sem pensar. A conta de luz não parece
cara porque vem diluída em 12 vezes por ano, para sempre.
Não baixe o preço. Faça a conta que ele não fez: quanto ele vai pagar de luz nos
próximos 25 anos se não fizer nada — e lembre que a tarifa sobe, então esse
número é o piso, não o teto. O investimento tem fim; a conta de luz não.
Depois traga o payback com o dimensionamento dele, nunca uma média de internet.
E ofereça as formas de pagamento que existem de verdade na sua casa: financiar
com parcela próxima do valor da conta transforma "não tenho o valor" em "posso
trocar uma despesa por um bem".
Se ainda pesar, reduza o ESCOPO, não a qualidade: um sistema menor que cobre
parte do consumo é melhor que nenhum — e ele amplia depois.',
 '{"precos.formas_pagamento"}',
 '{"precos.financiamento","precos.faixa","precos.o_que_inclui","pos_venda.ampliacao"}', '{}', 'escalate',
 'Custo de 25 anos sem fazer nada, com o aumento REAL da tarifa + devolver a pergunta de como ficaria bom pagar',
 '{"Dar desconto na primeira pressão","Usar payback de média de internet em vez do dimensionamento dele","Ignorar que a tarifa sobe ao comparar","Reduzir qualidade do equipamento em vez do escopo"}',
 'simular_pagamento', 'skill_seed', 'active', null),

(null, 'energia_solar', 'objections', 'reactive',
 '{"vou esperar baratear","o preço vai cair","daqui uns anos fica mais barato","vou esperar melhorar a tecnologia","ano que vem eu faço"}',
 null,
 'Esta é a objeção mais cara do setor, e a única que tem resposta com data no
calendário — sem inventar urgência nenhuma.
O equipamento realmente caiu de preço ao longo dos anos. Só que a REGRA mudou:
o Fio B é progressivo e sobe todo ano (45% em 2025, 60% em 2026, 75% em 2027,
90% em 2028). Quem instala depois paga mais pela energia que injeta, para
sempre — a condição de entrada é travada no momento da homologação, não na hora
que ele decidir.
E enquanto espera, ele continua pagando a conta cheia. Some doze contas por ano
de espera: é dinheiro que sai e não volta, enquanto o eventual desconto no
equipamento é incerto.
Não transforme isso em ameaça. Apresente como o que é: um relógio que já está
correndo e não depende de nenhum de nós dois. Deixe ele fazer a conta.',
 '{}',
 '{"precos.formas_pagamento","precos.financiamento","execucao.prazo_homologacao"}', '{}', 'omit',
 'Urgência REAL do calendário regulatório (Fio B sobe por ano) + custo da espera',
 '{"Inventar promoção que acaba para criar pressa","Prometer que o preço nunca mais cai","Ignorar que a espera tem custo mensal","Usar o Fio B como ameaça em vez de conta"}',
 'marcar_visita', 'skill_seed', 'active', null),

(null, 'energia_solar', 'objections', 'reactive',
 '{"achei mais barato","tem orçamento menor","o outro fez por menos","recebi proposta mais barata","por que você é mais caro"}',
 null,
 'Em solar, duas propostas quase nunca são a mesma coisa — e o cliente não tem
como saber sozinho. Seu trabalho é dar a ele a régua, não atacar o concorrente.
Compare item a item, com calma: marca e garantia do MÓDULO, marca e garantia do
INVERSOR (que é o que quebra primeiro), estrutura adequada ao telhado dele,
proteções (string box, DPS, aterramento), projeto com ART, e — o mais esquecido
— se a homologação está inclusa ou vai virar custo depois.
Pergunte o que a outra proposta inclui. Muitas vezes a diferença de preço é
exatamente o que falta nela, e o próprio cliente descobre isso ao ler.
Nunca fale mal de quem fez a outra proposta. Diga: "pode ser uma boa proposta,
só vamos conferir se estão comparando a mesma coisa". Quem ensina o cliente a
comparar ganha autoridade mesmo quando perde o pedido.',
 '{"precos.o_que_inclui","garantias.modulo","garantias.inversor"}',
 '{"oferta.marcas_modulo","oferta.marcas_inversor","garantias.instalacao","atuacao.equipe_propria"}', '{}', 'escalate',
 'Sincronizar as propostas (mesma potência de módulo e de inversor) para comparar laranja com laranja',
 '{"Falar mal do concorrente","Baixar o preço para igualar sem igualar o escopo","Não perguntar o que a outra proposta inclui","Comparar só o valor final"}',
 'comparar_escopo', 'skill_seed', 'active', null),

(null, 'energia_solar', 'objections', 'reactive',
 '{"e se eu mudar de casa","vou vender o imóvel","e se eu me mudar","não sei se fico aqui","o imóvel é alugado"}',
 null,
 'Objeção legítima e fácil de responder — desde que você não invente número de
valorização.
São três caminhos reais: o sistema pode ser transferido para o novo titular
junto com o imóvel (a unidade consumidora é que gera os créditos); pode ser
desinstalado e remontado em outro endereço, com custo de mão de obra e estrutura
nova; e, no caso de venda, é um item que pesa na negociação porque o comprador
herda uma conta de luz menor.
Se o imóvel é alugado, isso muda tudo: o titular da conta é quem se beneficia,
e a conversa passa pelo proprietário. Descubra isso ANTES de dimensionar, ou
você vai fazer um projeto para quem não pode decidir.
Não prometa percentual de valorização do imóvel — não é um número que você
controla nem consegue provar.',
 '{}',
 '{"pos_venda.ampliacao","diferencial.motivo_escolher","atuacao.regiao"}', '{}', 'omit',
 'Três saídas concretas + os créditos acompanham o titular para a nova UC',
 '{"Prometer percentual de valorização do imóvel","Dimensionar para quem mora de aluguel sem falar com o proprietário","Tratar a dúvida como desculpa"}',
 'confirmar_titular', 'skill_seed', 'active', null),

-- --------------------------------------------------------- RISK_FREE_ENTRY
(null, 'energia_solar', 'risk_free_entry', 'reactive',
 '{"tem como simular","faz orçamento sem compromisso","quanto eu economizaria","dá para fazer uma estimativa","como sei se vale a pena"}',
 null,
 'Este é o melhor momento da conversa e o mais desperdiçado. A pessoa está
pedindo para você entregar valor antes de vender — aceite na hora.
Peça a conta de luz e devolva uma análise de verdade: consumo médio dos últimos
meses, tamanho de sistema que faz sentido, geração estimada e o que sobraria de
conta (nunca zero). Isso é trabalho técnico real entregue de graça, e cria a
reciprocidade mais forte que existe neste mercado.
Combine o próximo passo junto com a entrega: "te mando a simulação até amanhã e
a gente conversa quinta". Simulação entregue sem data de retorno vira PDF
esquecido, e o cliente usa o seu número para negociar com outro.
Se você faz visita técnica sem custo, ofereça aqui — mas só depois de qualificar
telhado e padrão, para não gastar deslocamento com quem só pesquisava.',
 '{"execucao.prazo_proposta"}',
 '{"precos.como_cobra","execucao.prazo_visita","atuacao.regiao"}', '{}', 'escalate',
 'Entregar análise real da conta como reciprocidade + data de retorno combinada',
 '{"Mandar simulação genérica sem a conta dele","Entregar a simulação sem marcar o retorno","Sair para visita antes de qualificar telhado e padrão","Prometer economia sem dimensionar"}',
 'entregar_simulacao', 'skill_seed', 'active', null),

-- ---------------------------------------------------------- AVAILABILITY
(null, 'energia_solar', 'availability', 'reactive',
 '{"em quanto tempo fica pronto","quando começo a economizar","demora quanto","prazo de instalação","quando liga o sistema"}',
 null,
 'Aqui mora a maior frustração do setor, e ela é evitável: o cliente acha que
instalou é igual a economizando. Não é. Existem TRÊS relógios diferentes e você
precisa nomear os três.
Primeiro o seu: projeto e proposta. Depois a instalação física, que em
residência costuma ser rápida — dias, não semanas. E então o terceiro, que NÃO
É SEU: a concessionária. Ela aprova o projeto, faz vistoria e troca o medidor,
e só a partir daí o sistema injeta e gera crédito.
Diga isso na venda, não depois. Cliente que descobre sozinho que vai esperar
semanas depois de pagar acha que foi enganado — e a reclamação não vai para a
distribuidora, vai para você.
Informe o prazo da SUA concessionária como estimativa honesta, nunca como
compromisso. E combine que você da posição durante a espera, sem ele precisar
perguntar. Essa única frase evita a maior parte das reclamações do setor.',
 '{"execucao.prazo_instalacao","execucao.prazo_homologacao"}',
 '{"execucao.prazo_visita","execucao.prazo_proposta","execucao.distribuidoras"}', '{}', 'escalate',
 'Nomear os quatro relógios com os prazos reais e homologar ANTES de o cliente comprar o kit',
 '{"Dizer só o prazo de instalação e omitir a homologação","Prometer o prazo da concessionária como se fosse seu","Deixar o cliente descobrir a espera depois de pagar","Sumir durante a homologação"}',
 'alinhar_prazos', 'skill_seed', 'active', null),

-- --------------------------------------------------------------- CATALOG
(null, 'energia_solar', 'catalog', 'reactive',
 '{"quantas placas preciso","quantos painéis","qual a potência","quantos kwp","cabe no meu telhado","qual sistema serve para mim"}',
 null,
 'Pergunta técnica se responde com método, não com palpite. E o palpite aqui é
caro: sistema subdimensionado frustra, superdimensionado gera crédito que expira
em 60 meses sem uso.
Explique de que depende, em linguagem de gente: o consumo dos últimos 12 meses
(não o do mês passado, que pode ser atípico), a área útil e a inclinação do
telhado, o sombreamento ao longo do dia e o padrão de ligação.
Peça a conta e, se puder, uma foto do telhado. Com isso você já diz se cabe, e
o que muda se não couber tudo — começar menor e ampliar depois é caminho
legítimo, desde que o inversor seja escolhido pensando nisso.
Confirme o tipo de telhado antes de prometer qualquer coisa: cerâmico, metálico,
fibrocimento, laje e solo pedem estruturas diferentes, com custo e prazo
diferentes. Prometer sem ver o telhado é como orçar sem medir.',
 '{"oferta.telhados_atendidos","oferta.tipos_sistema"}',
 '{"pos_venda.ampliacao","execucao.prazo_visita","oferta.marcas_inversor"}', '{}', 'escalate',
 'Dimensionar pela média de 12 meses, com folga de consumo futuro e padrão de entrada conferido',
 '{"Dizer número de placas sem ver consumo e telhado","Dimensionar pelo mês atípico","Superdimensionar para aumentar a venda","Prometer sem confirmar o tipo de telhado"}',
 'dimensionar', 'skill_seed', 'active', null),

(null, 'energia_solar', 'catalog', 'reactive',
 '{"só me manda o orçamento","não precisa ligar","prefiro por escrito","manda por email","sem visita agora","não quero reunião"}',
 null,
 'Boa parte de quem pesquisa solar quer comparar sozinho antes de falar com
qualquer vendedor — e insistir em ligação com quem pediu por escrito é o jeito
mais rápido de ser descartado em silêncio.
Entregue por escrito o que permite ele avançar: os tipos de sistema que você
instala, marcas de módulo e inversor, o que a proposta inclui, garantias
separadas (módulo, inversor, instalação) e o prazo típico. Faixa de investimento
sim; valor fechado sem dimensionamento, não — e explique por quê.
Faça no máximo DUAS perguntas junto, por escrito, e só as que mudam o projeto:
o valor médio da conta e o tipo de telhado.
Deixe a porta aberta com um retorno combinado e leve. Quem compara sozinho volta
quando entende — desde que você não tenha enchido o saco antes.',
 '{"precos.o_que_inclui","oferta.tipos_sistema"}',
 '{"garantias.modulo","garantias.inversor","precos.faixa","execucao.prazo_instalacao"}', '{}', 'escalate',
 'Material completo por escrito + duas perguntas + porta aberta',
 '{"Insistir em visita para quem pediu por escrito","Mandar valor fechado sem dimensionar","Enviar material genérico de marketing","Sumir porque ele não respondeu na hora"}',
 'entregar_material', 'skill_seed', 'active', null),

-- --------------------------------------------------------- EXPERTISE_PROOF
(null, 'energia_solar', 'expertise_proof', 'reactive',
 '{"vocês são confiáveis","há quanto tempo trabalham","quem instala","tem engenheiro","já fizeram quantos","posso ver algum sistema"}',
 null,
 'Desconfiança aqui é racional: o mercado teve muita empresa que vendeu, instalou
mal e sumiu — e o cliente vai colocar dezenas de milhares de reais em cima do
próprio telhado.
Prove com o que é verificável: quem assina a ART (o projeto exige responsável
técnico com CREA), se a equipe de instalação é própria ou terceirizada, há
quanto tempo você instala e quantos sistemas já entregou. Número e registro
valem mais que adjetivo.
Ofereça o que nenhum concorrente ruim oferece: um cliente próximo para ele
conversar, ou um sistema para ver de perto. Em solar a prova social vale mais
que folder, porque o vizinho mostra a conta.
Se você não tem um dado que ele pediu, diga e mostre o que tem no lugar.
Inventar certificação ou obra é o único erro irreversível desta conversa.',
 '{}',
 '{"atuacao.responsavel_tecnico","atuacao.equipe_propria","diferencial.tempo_de_casa","diferencial.obras_referencia","garantias.instalacao"}', '{}', 'omit',
 'Prova verificável: ART, equipe própria e cliente que ele pode ver',
 '{"Responder com adjetivo em vez de registro","Citar cliente sem autorização","Afirmar certificação que não tem","Esconder que a instalação é terceirizada"}',
 'enviar_prova', 'skill_seed', 'active', null),

-- ---------------------------------------------------------- GOAL_MATCHING
(null, 'energia_solar', 'goal_matching', 'reactive',
 '{"tenho um comércio","é para minha empresa","é no sítio","é um condomínio","tenho consumo alto","é para minha casa"}',
 null,
 'O mesmo produto resolve problemas diferentes, e o argumento tem que mudar com
o tipo de imóvel — senão você fala de economia para quem está pensando em
previsibilidade.
Residência: o gatilho é a conta que sobe todo ano e o desconforto de não poder
usar o ar-condicionado. Comércio: energia é custo fixo, e sistema previsível
melhora margem — fale com quem olha a planilha. Indústria e produção: interessa
demanda contratada, horário de ponta e continuidade. Rural: bombeamento e
irrigação mudam o dimensionamento e muitas vezes há linha de crédito própria.
Condomínio: decisão coletiva, assembleia e área comum — o ciclo é mais longo e
tem mais de um decisor.
Pergunte para que serve o imóvel e quem decide, antes de recomendar. E confirme
o padrão de ligação: ele muda o custo de disponibilidade que vai continuar sendo
cobrado, e isso precisa entrar na conta desde o começo.',
 '{"oferta.tipos_sistema"}',
 '{"atuacao.regiao","precos.financiamento","oferta.telhados_atendidos"}', '{}', 'escalate',
 'Argumento pelo uso do imóvel e pelo decisor, não pelo produto',
 '{"Falar de economia doméstica para decisor de empresa","Ignorar quem decide no condomínio","Não confirmar o padrão de ligação","Recomendar antes de saber o uso"}',
 'qualificar_perfil', 'skill_seed', 'active', null),

-- ------------------------------------------------------- COMMITMENT_OFFER
(null, 'energia_solar', 'commitment_offer', 'proactive',
 '{"mandou a proposta","enviei o orçamento","ficou de responder","não respondeu a simulação","segue a proposta"}',
 null,
 'Em solar o orçamento não morre de preço: morre de silêncio. O cliente recebe
três propostas, não entende as diferenças, adia — e adiar é a decisão mais fácil
de todas, porque não exige nada dele.
Não repita a proposta. Volte com ÂNGULO NOVO a cada toque: primeiro confirmar
que abriu e tirar dúvida da simulação; depois a opção de pagamento que ele não
tinha considerado; depois, se fizer sentido, um escopo menor que cabe agora.
Cada toque precisa entregar algo, nunca só cobrar.
Marque data em vez de deixar em aberto. "Te ligo quinta às 10h para a gente
fechar as dúvidas" vale mais que "qualquer coisa me chama" — este último
transfere para o cliente a tarefa que é sua.
E no último toque, pergunte também se foi não. Um não dito libera sua agenda e,
com frequência, vira o motivo real que você ainda podia resolver.',
 '{}',
 '{"precos.financiamento","precos.formas_pagamento","pos_venda.ampliacao","execucao.prazo_homologacao"}', '{}', 'omit',
 'Cadência com ângulo novo e data marcada (o antídoto do silêncio)',
 '{"Reenviar a mesma proposta","Perguntar só se ele viu","Deixar o retorno por conta do cliente","Desistir depois do segundo silêncio"}',
 'cobrar_posicao', 'skill_seed', 'active', null),

(null, 'energia_solar', 'commitment_offer', 'reactive',
 '{"vou pensar","preciso ver com calma","vou conversar com minha esposa","vou analisar","depois eu te falo","me dá um tempo"}',
 null,
 'Se ele já entendeu o valor e mesmo assim adiou, isto NÃO é objeção: é
indecisão. E a diferença importa, porque o remédio é oposto. Argumentar mais com
quem já concordou aumenta a sensação de risco e empurra a decisão para longe.
Julgue primeiro: se ainda não viu valor, volte para a descoberta. Se já
concordou, o que trava é medo de errar — sistema caro, no próprio telhado, com
três propostas diferentes e nenhuma referência para comparar.
Pare de oferecer opções e RECOMENDE uma: "no seu caso eu faria assim, por isto".
Quem está travado não quer escolher, quer ser orientado por quem entende.
Diminua o tamanho da decisão com o que for verdade na sua casa: começar menor e
ampliar depois, financiamento com parcela próxima da conta, garantia de
instalação por escrito, um cliente próximo para ele conversar. Reduzir risco
destrava mais que reduzir preço.
E combine o próximo passo com data. Sem data, este cliente some — e some sem
dizer não, que é o que faz o vendedor achar que ainda está vivo.',
 '{}',
 '{"garantias.instalacao","precos.financiamento","pos_venda.ampliacao","diferencial.obras_referencia"}', '{}', 'omit',
 'Recomendar UM caminho e diminuir o tamanho da decisão, nunca repetir o argumento',
 '{"Repetir os benefícios para quem já concordou","Mandar mais opções de kit","Dar desconto achando que é preço","Deixar sem data de retorno"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt'),

-- ----------------------------------------------------------- RECIPROCITY
(null, 'energia_solar', 'reciprocity', 'proactive',
 '{"visita técnica","vou aí ver o telhado","agendar visita","confirmar visita","quando você vem"}',
 null,
 'A visita técnica é o momento em que você deixa de ser mais um orçamento e vira
o profissional que esteve lá. Trate como venda, não como medição.
Antes: confirme na véspera e peça acesso ao telhado e ao padrão de entrada.
Visita que não consegue subir ou abrir o quadro vira segunda visita, e segunda
visita é prejuízo.
Durante: mostre o que você está vendo. Explicar por que aquele trecho do telhado
não serve por causa da sombra da caixa d água vale mais que qualquer folder —
e o cliente conta isso para o vizinho.
Peça para o decisor estar presente. Em residência isso costuma significar o
casal; descobrir na hora da assinatura que falta alguém custa semanas.
Depois: saia com o próximo passo combinado e com a data da proposta. A visita é
onde a confiança nasce; deixar ela terminar sem data é jogar fora o melhor
momento da venda.',
 '{"execucao.prazo_visita"}',
 '{"execucao.prazo_proposta","atuacao.equipe_propria","atuacao.regiao"}', '{}', 'escalate',
 'Visita como venda: confirmar véspera, decisor presente e sair com data',
 '{"Ir sem confirmar acesso ao telhado","Medir em silêncio e ir embora","Fazer a visita sem o decisor","Sair sem combinar quando entrega a proposta"}',
 'realizar_visita', 'skill_seed', 'active', null),

-- ------------------------------------------------------- LIMITS_AND_ETHICS
(null, 'energia_solar', 'limits_and_ethics', 'reactive',
 '{"vou zerar minha conta","fico sem pagar luz","conta zero","garante a economia","não pago mais nada","é de graça depois"}',
 null,
 'ESTA É A ENTRADA MAIS IMPORTANTE DO SEGMENTO, e ela existe para você NÃO
vender melhor: existe para você não vender errado.
Ninguém zera a conta. Mesmo gerando tudo o que consome, o cliente continua
pagando o custo de disponibilidade — o mínimo para o imóvel seguir ligado na
rede: 30 kWh no monofásico, 50 no bifásico, 100 no trifásico. Além disso ficam
iluminação pública e os tributos que incidem.
Diga isso ANTES de fechar, com naturalidade. "Sua conta não zera, ela cai para
perto do mínimo" é uma frase que custa cinco segundos e evita um cliente furioso
na primeira fatura — que é exatamente quem reclama publicamente e mata sua
indicação.
Também não garanta geração: produção varia com clima, sujeira e estação. Fale em
estimativa baseada no dimensionamento, e explique que o excedente vira crédito
com validade de 60 meses.
Em solar, a promessa exagerada não perde a venda: ganha a venda e perde a
empresa.',
 '{}',
 '{"garantias.modulo","garantias.inversor","pos_venda.monitoramento"}', '{}', 'omit',
 'Dizer o limite antes de fechar: taxa mínima, imposto sobre o que vem da rede, geração estimada e crédito de 60 meses',
 '{"Prometer conta zero","Garantir economia em percentual fixo","Omitir o custo de disponibilidade","Falar 25 anos de garantia sem separar módulo, produto e inversor"}',
 'alinhar_expectativa', 'skill_seed', 'active', null),

-- --------------------------------------------------------------- RETENTION
(null, 'energia_solar', 'retention', 'proactive',
 '{"instalou e não homologou","esperando a concessionária","quando troca o medidor","já instalou faz tempo","cadê minha homologação"}',
 null,
 'O período entre a instalação e a homologação é onde a reputação deste mercado
se decide. O cliente pagou, vê as placas no telhado, e a conta continua vindo
igual. Se você sumir nessa janela, ele conclui que foi enganado — mesmo quando
está tudo certo e o prazo é da distribuidora.
A regra é simples: de posição ANTES de ele perguntar. Um aviso quando o projeto
entra na concessionária, um no meio do caminho e um quando o medidor é trocado.
Três mensagens que custam nada e valem a indicação inteira.
Explique o que está acontecendo em cada etapa e o que depende de quem. Cliente
que entende que o prazo é da distribuidora cobra a distribuidora; cliente que
não entende cobra você — e cobra em avaliação pública.
Quando homologar, feche o ciclo: ensine a ler a primeira conta com o sistema
(ele vai estranhar o custo mínimo), mostre como acompanhar a geração e SÓ
ENTÃO peça a indicação. Indicação pedida antes de o cliente ver o resultado é
pedido no vazio; pedida depois da primeira conta menor, ela vem sozinha.',
 '{}',
 '{"execucao.prazo_homologacao","pos_venda.monitoramento","execucao.distribuidoras"}', '{}', 'omit',
 'Dar posição antes de o cliente perguntar + pedir indicação só depois da primeira conta',
 '{"Sumir depois de instalar","Deixar o cliente descobrir sozinho o atraso","Pedir indicação antes de ele ver a economia","Não ensinar a ler a primeira conta"}',
 'acompanhar_homologacao', 'skill_seed', 'active', null),

(null, 'energia_solar', 'retention', 'proactive',
 '{"limpeza dos painéis","manutenção","está gerando menos","revisão do sistema","faz tempo que instalei","quero ampliar"}',
 null,
 'Cliente instalado não é cliente encerrado: é a carteira mais barata que você
tem. Ele já confia, já tem o sistema e vai precisar de você de novo.
Painel sujo gera menos, e a queda é gradual — o cliente não percebe, só acha que
"não economiza tanto quanto prometeram". Quem some por dois anos é chamado de
volta como culpado; quem aparece na revisão é chamado para ampliar.
Programe o retorno pelo ciclo combinado (semestral ou anual conforme a região e
a poeira) e chegue com dado, não com oferta: geração do período, comparação com
o esperado, o que dá para melhorar.
Ampliação é a venda mais fácil deste mercado e a mais esquecida. Quem comprou ar
condicionado novo, trocou o chuveiro, comprou carro elétrico ou aumentou a
família está gerando menos do que consome — e ele não sabe. Você sabe, se
estiver olhando.',
 '{}',
 '{"pos_venda.manutencao","pos_venda.monitoramento","pos_venda.ampliacao"}', '{}', 'omit',
 'Conferir a geração pelo app contra a proposta + limpeza anual com reaperto de estrutura e proteções',
 '{"Sumir após a homologação","Chegar na revisão só para vender","Não avisar quando a geração cai","Perder a ampliação para o concorrente que apareceu"}',
 'agendar_revisao', 'skill_seed', 'active', null),

-- --------------------------------------------------------------- ECOSYSTEM
(null, 'energia_solar', 'ecosystem', 'reactive',
 '{"tem financiamento","dá para parcelar no banco","como funciona o financiamento","aprova meu crédito","tem linha de crédito","consorcio"}',
 null,
 'Financiamento não é detalhe do pagamento: em solar ele É parte da venda. A
maioria dos projetos só acontece porque a parcela cabe onde a conta de luz já
cabia — trocar despesa por bem é o argumento que destrava a maior parte dos
"não tenho o valor".
Trabalhe com o que existe na sua casa e está no DNA: nunca cite banco, taxa ou
prazo que você não confirmou. Taxa errada dita por WhatsApp vira expectativa
quebrada na hora da aprovação.
Ajude o cliente a chegar preparado no banco. Entregue o dossiê técnico do
projeto — dimensionamento, geração estimada, economia projetada e garantias.
Analista aprova mais rápido o que consegue entender, e essa é uma vantagem que
o concorrente desorganizado não tem.
Se a aprovação demorar, mantenha a conversa viva com posição, não com cobrança.
E lembre que crédito reprovado não é fim: há entrada maior, escopo menor e
consorcio — desde que existam na sua operação.',
 '{"precos.financiamento"}',
 '{"precos.formas_pagamento","precos.faixa","execucao.prazo_proposta"}', '{}', 'escalate',
 'Financiamento como parte da venda + dossiê técnico para o banco',
 '{"Citar taxa ou banco que não confirmou","Deixar o cliente ir sozinho ao banco","Tratar reprovação como fim da venda","Prometer aprovação"}',
 'encaminhar_financiamento', 'skill_seed', 'active', null),

-- ---------------------------------------------------------------------
-- HÍBRIDO COM BATERIA (BESS) — acrescentado em ago/2026 a partir do
-- retorno de um ESPECIALISTA DO RAMO. Primeira correção da curadoria vinda
-- de quem vive o mercado, e não de pesquisa.
--
-- O que ele apontou: o on-grid virou commodity (guerra de preço, margem
-- derretida) e o híbrido é onde poucos sabem — "o buraco é bem mais
-- embaixo". Some-se o gargalo de conexão: concessionárias limitando ou
-- negando novos sistemas por saturação da rede.
--
-- A lógica econômica que sustenta, e que conecta com o resto desta
-- biblioteca: com o Fio B subindo todo ano, a energia INJETADA vale menos
-- a cada ano, enquanto a ARMAZENADA é consumida direto não paga o pedágio.
-- O mercado migra de "gerar e injetar" para "gerar, guardar e usar".
-- ---------------------------------------------------------------------

(null, 'energia_solar', 'catalog', 'reactive',
 '{"tem bateria","sistema híbrido","funciona quando falta luz","é off grid","guarda energia","backup de energia","bess"}',
 null,
 'Comece separando as três coisas que o cliente costuma misturar, porque quase
ninguém sabe a diferença e é nisso que você ganha autoridade.
On-grid: gera de dia e injeta o excedente na rede. Barato, mas quando falta luz
o sistema DESLIGA — inclusive por norma, para não energizar a rede e por em
risco quem está consertando. Muita gente instala achando que tem backup e
descobre isso no primeiro apagão.
Híbrido com bateria: gera, guarda o excedente e usa quando quiser — inclusive
quando a rede cai. É o que resolve o que a maioria imagina que já comprou.
Off-grid: sem rede nenhuma. Só faz sentido onde não existe ligação.
Depois pergunte o que ELE quer resolver, porque muda tudo: reduzir conta,
continuar funcionando na queda de energia, ou fugir do horário caro. Cada um
pede um dimensionamento diferente e nem todos precisam de bateria.
Se o assunto for bateria, informe com honestidade o que a SUA operação entrega:
quais marcas, quanta autonomia e o que ela alimenta. Bateria não sustenta a casa
inteira: sustenta o que foi dimensionado para sustentar, e prometer diferente é
reclamação garantida no primeiro uso.',
 '{"oferta.tipos_sistema"}',
 '{"oferta.marcas_bateria","oferta.autonomia_backup","precos.faixa","oferta.marcas_inversor"}', '{}', 'escalate',
 'Separar on-grid, híbrido e off-grid antes de cotar — e dimensionar o backup pelo que ele quer manter ligado',
 '{"Deixar o cliente achar que on-grid funciona na queda de energia","Prometer autonomia sem dimensionar as cargas","Vender bateria para quem só quer reduzir conta","Falar BESS e sigla técnica com quem quer entender o básico"}',
 'avaliar_hibrido', 'skill_seed', 'active', null),

(null, 'energia_solar', 'objections', 'reactive',
 '{"bateria não vale a pena","bateria é muito cara","bateria não compensa no brasil","ouvi dizer que bateria não vale","melhor só o solar comum"}',
 null,
 'Essa objeção foi verdade por muito tempo, e por isso circula tanto. O
comprador não está sendo teimoso: está repetindo uma informação que já foi
correta. Não corrija como quem corrige um erro — atualize o cenário.
Duas coisas mudaram. O preço da bateria caiu muito, e a REGRA mudou: o Fio B
sobe todos os anos, então a energia que você injeta na rede vale menos a cada
ano. Isso inverte a conta: guardar para usar deixou de competir com injetar,
porque injetar está ficando pior por decisão regulatória, não por opinião de
vendedor.
Mesmo assim, seja honesto — bateria NÃO compensa para todo mundo. Para quem
consome de dia, tem conta baixa e nunca falta luz na rua, o on-grid puro segue
sendo a escolha certa, e dizer isso constrói mais confiança que qualquer
argumento.
Ela compensa quando existe pelo menos um destes: consumo concentrado à noite,
queda de energia frequente, tarifa com horário caro, ou restrição da
concessionária que impede injetar. Descubra qual é o caso dele ANTES de
defender a bateria — senão você está vendendo solução para um problema que
talvez ele não tenha.',
 '{}',
 '{"oferta.marcas_bateria","oferta.autonomia_backup","precos.financiamento","precos.faixa"}', '{}', 'omit',
 'Atualizar o cenário em vez de corrigir o cliente — e admitir quando não compensa',
 '{"Tratar a objeção como ignorância do cliente","Empurrar bateria para quem não tem nenhum dos quatro casos","Prometer payback de bateria sem simular","Ignorar que a informação antiga já foi verdadeira"}',
 'defender_o_hibrido', 'skill_seed', 'active', 'challenger'),

(null, 'energia_solar', 'availability', 'reactive',
 '{"a concessionária negou","não tem capacidade na rede","rede saturada","limitaram minha potência","não aprovaram meu projeto","só aprovaram parte"}',
 null,
 'Esta é a conversa que mais cresce e a que mais integrador perde por não saber
responder. Em várias regiões a distribuidora limita ou nega a conexão de novos
sistemas porque a rede local está saturada — e o cliente costuma receber isso
como um "não" definitivo, quando raramente é.
Primeiro descubra o que exatamente veio: negativa total, limite de potência
menor que o projetado, ou exigência de reforço na rede com custo. São três
situações diferentes e só a primeira é realmente uma parede.
Depois mostre o caminho que quase ninguém apresenta: se o problema é INJETAR na
rede, existe a saída de não injetar. Um sistema híbrido com bateria, ou com
limitação de injeção, consome a própria geração em vez de mandar para fora — e
o que a concessionária restringe é a injeção, não o consumo próprio.
Isso muda o projeto: dimensiona pelo consumo, não pelo excedente. E muda a
conversa comercial, porque você deixou de ser mais um orçamento e virou quem
resolveu o problema que travou o cliente.
Nunca prometa aprovação. Diga que vai levantar a situação da unidade junto à
distribuidora e voltar com o que é possível — e volte, mesmo que a resposta
seja ruim.',
 '{"execucao.prazo_homologacao"}',
 '{"oferta.tipos_sistema","execucao.distribuidoras","oferta.marcas_bateria"}', '{}', 'escalate',
 'Separar os três tipos de negativa e apresentar a saída de não injetar',
 '{"Aceitar a negativa como fim da venda","Prometer que consegue aprovar","Manter o projeto original e só recorrer","Não verificar a situação real da unidade junto à distribuidora"}',
 'viabilizar_com_bateria', 'skill_seed', 'active', null),

-- =====================================================================
-- ENTRADAS ACRESCENTADAS PELA REVISÃO DO ESPECIALISTA (ago/2026)
-- Integrador do RS, engenheiro, trabalha por indicação. As duas vieram
-- das perguntas de fechamento do kit de revisão: a primeira é a pergunta
-- que ele recebe TODA SEMANA e que não existia em lugar nenhum da
-- biblioteca; a segunda é a mudança de processo que ele adotou na prática
-- e que inverteu uma etapa da jornada deste segmento.
-- =====================================================================

(null, 'energia_solar', 'goal_matching', 'reactive',
 '{"posso enviar para outro endereço","dá para usar em outra casa","tenho dois imóveis","gerar aqui e usar lá","autoconsumo remoto","posso dividir a geração"}',
 null,
 'PODE — e esta é a pergunta que mais aparece e a que menos gente sabe responder.
Chama-se AUTOCONSUMO REMOTO: gera-se numa unidade e envia-se o excedente para
outra, em percentual definido pelo cliente, desde que as unidades estejam no
MESMO CPF ou CNPJ e na área da mesma concessionária.
Isso destrava projeto que parecia inviável, e por isso vale perguntar sempre.
Apartamento sem telhado e casa de praia com telhado grande? Gera lá e abate
aqui. Comércio com consumo alto e telhado ruim? Usa o telhado do galpão.
Duas coisas ditas junto, senão a promessa fica maior que a entrega: o rateio é
declarado a concessionária e não se muda toda hora, então vale definir o
percentual com calma; e cada unidade continua pagando o custo de
disponibilidade dela, porque cada uma tem o próprio medidor.
Antes de prometer, confirme o titular de CADA conta. É o dado que decide se o
projeto existe.',
 '{}',
 '{"atuacao.regiao","execucao.distribuidoras"}', '{}', 'omit',
 'Autoconsumo remoto: gerar numa unidade e abater em outra do mesmo titular',
 '{"Prometer rateio entre CPFs diferentes","Esquecer que cada unidade mantém a taxa mínima","Dimensionar sem confirmar o titular de cada conta"}',
 'confirmar_titularidade', 'skill_seed', 'active', null),

(null, 'energia_solar', 'availability', 'reactive',
 '{"quando eu compro o material","já posso comprar o kit","quando chega o equipamento","tenho que pagar tudo antes","quando começa a instalação"}',
 null,
 'A ordem certa protege o dinheiro do cliente, e quase todo mundo faz ao contrário.
O certo é HOMOLOGAR PRIMEIRO: protocola o projeto, espera o parecer de acesso, e
só então o cliente compra o kit.
O motivo é concreto e virou comum: a rede das concessionárias está com muita
geração instalada, e elas passaram a analisar o fluxo de inversão. Se a potência
for alta para aquela rua, elas podem LIMITAR a potência do sistema ou exigir que
o cliente construa uma subestação. Quem comprou o material antes fica com kit
errado e dinheiro parado — e a culpa cai no integrador, mesmo não sendo dele.
Existe um atalho legítimo: em consumo local, até a potência da aprovação
simplificada da sua concessionária, o parecer sai praticamente certo. Acima
disso entra análise de fluxo, e aí o risco é real.
Diga os relógios separados, com número: análise do projeto de 10 a 30 dias,
entrega do kit de 10 a 20 dias, instalação, e vistoria em até 5 dias úteis
depois de solicitada. Cliente que sabe a ordem não liga cobrando.',
 '{"execucao.prazo_analise_projeto","execucao.prazo_kit","execucao.prazo_vistoria"}',
 '{"execucao.limite_fast_track","execucao.homologa_antes","execucao.distribuidoras"}', '{}', 'escalate',
 'Homologar antes de comprar: o parecer de acesso protege o cliente de material errado',
 '{"Mandar comprar o kit antes do parecer de acesso","Somar todos os prazos num número só","Prometer o prazo da concessionária como se fosse seu","Ignorar o limite da aprovação simplificada ao dimensionar"}',
 'protocolar_projeto', 'skill_seed', 'active', null);
