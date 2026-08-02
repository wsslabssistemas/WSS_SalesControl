-- =====================================================================
-- COS — MIGRATION 0030 : BIBLIOTECA DE ENERGIA SOLAR FOTOVOLTAICA
--
-- PESQUISA (ago/2026). O que separa este segmento de todos os outros:
--
--   • A CONTA DE LUZ E O DADO DE ENTRADA. Sem ela nao ha dimensionamento,
--     geracao estimada nem payback. Quem cota sem a conta esta chutando —
--     e chute em ticket de dezenas de milhares vira reclamacao.
--   • O CLIENTE NUNCA ZERA A CONTA. Custo de disponibilidade continua:
--     30 kWh monofasico, 50 kWh bifasico, 100 kWh trifasico. "Conta zero"
--     e a promessa mais comum do setor e a que mais gera processo.
--   • ENTRE INSTALAR E ECONOMIZAR EXISTEM 40 A 100 DIAS. Projeto, vistoria,
--     troca de medidor e homologacao. REN 1.059/2023: a distribuidora tem
--     30 dias para o projeto e 7 dias uteis para a vistoria. O prazo e dela;
--     a ansiedade e do cliente; a culpa cai no instalador.
--   • O RELOGIO REGULATORIO CORRE CONTRA A ESPERA. Fio B progressivo: 45%
--     em 2025, 60% em 2026, 75% em 2027, 90% em 2028. Direito adquirido so
--     para quem homologou ate 06/01/2023 (isento ate 2045). Adiar custa mais
--     caro a cada ano — e a unica urgencia REAL que este mercado tem.
--   • GARANTIAS DESIGUAIS. Modulo: ~25 anos de desempenho, 10 a 12 de
--     produto. Inversor: 5 a 10 anos. Quem fala "25 anos de garantia" sem
--     separar esta criando o proprio problema para daqui a oito anos.
--   • CREDITO EXPIRA EM 60 MESES. Superdimensionar nao e vender mais, e
--     vender credito que vence sem uso.
--
-- REGRA DA TRAVA: `escalate` quando o fato que falta e NUMERO ou
-- COMPROMISSO (preco, prazo, garantia, financiamento). `omit` quando e
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
 '{"quanto custa","qual o valor","quanto fica um sistema","preco da energia solar","quanto custa colocar placa","valor do kit"}',
 null,
 'NAO EXISTE preco de energia solar sem a conta de luz. O sistema e dimensionado
pelo consumo: mesma casa, contas diferentes, projetos diferentes. Dar um numero
agora e chutar — e o chute vira ancora, entao se o projeto real sair acima voce
ja perdeu antes de comecar.
Explique isso em uma frase e peca a conta: "o valor depende do seu consumo,
me manda uma foto da sua conta de luz que eu te trago o numero certo". Pedir a
conta nao e burocracia, e o que te separa de quem manda tabela por WhatsApp.
Se precisar dar alguma referencia para a pessoa nao desistir, use a FAIXA dos
projetos que voce costuma fazer, deixando claro que e faixa e do que depende.
E diga o que esta incluso: kit, estrutura, protecoes, projeto com ART, mao de
obra e homologacao. Orcamento que nao diz o que inclui e o que perde para o
"mais barato" que nao inclui nada.',
 '{"precos.como_cobra","precos.o_que_inclui"}',
 '{"precos.faixa","precos.formas_pagamento","precos.financiamento"}', '{}', 'escalate',
 'Nao cotar sem a conta de luz + faixa com escopo explicito',
 '{"Dar preco por kWp para quem nao mandou a conta","Mandar tabela de kit sem dimensionar","Cotar sem dizer o que esta incluso","Deixar a pessoa comparar sua proposta completa com kit avulso"}',
 'pedir_conta', 'skill_seed', 'active', null),

-- ------------------------------------------------------------- OBJECTIONS
(null, 'energia_solar', 'objections', 'reactive',
 '{"ta caro","achei caro","e muito dinheiro","nao tenho esse valor","fora do meu orcamento","muito investimento"}',
 null,
 'Em solar "caro" quase nunca e sobre o preco: e sobre o tamanho do cheque
comparado a uma conta que ele ja paga sem pensar. A conta de luz nao parece
cara porque vem diluida em 12 vezes por ano, para sempre.
Nao baixe o preco. Faca a conta que ele nao fez: quanto ele vai pagar de luz nos
proximos 25 anos se nao fizer nada — e lembre que a tarifa sobe, entao esse
numero e o piso, nao o teto. O investimento tem fim; a conta de luz nao.
Depois traga o payback com o dimensionamento dele, nunca uma media de internet.
E ofereca as formas de pagamento que existem de verdade na sua casa: financiar
com parcela proxima do valor da conta transforma "nao tenho o valor" em "posso
trocar uma despesa por um bem".
Se ainda pesar, reduza o ESCOPO, nao a qualidade: um sistema menor que cobre
parte do consumo e melhor que nenhum — e ele amplia depois.',
 '{"precos.formas_pagamento"}',
 '{"precos.financiamento","precos.faixa","precos.o_que_inclui","pos_venda.ampliacao"}', '{}', 'escalate',
 'Custo de 25 anos sem fazer nada + trocar despesa por bem (nunca desconto reflexo)',
 '{"Dar desconto na primeira pressao","Usar payback de media de internet em vez do dimensionamento dele","Ignorar que a tarifa sobe ao comparar","Reduzir qualidade do equipamento em vez do escopo"}',
 'simular_pagamento', 'skill_seed', 'active', null),

(null, 'energia_solar', 'objections', 'reactive',
 '{"vou esperar baratear","o preco vai cair","daqui uns anos fica mais barato","vou esperar melhorar a tecnologia","ano que vem eu faco"}',
 null,
 'Esta e a objecao mais cara do setor, e a unica que tem resposta com data no
calendario — sem inventar urgencia nenhuma.
O equipamento realmente caiu de preco ao longo dos anos. So que a REGRA mudou:
o Fio B e progressivo e sobe todo ano (45% em 2025, 60% em 2026, 75% em 2027,
90% em 2028). Quem instala depois paga mais pela energia que injeta, para
sempre — a condicao de entrada e travada no momento da homologacao, nao na hora
que ele decidir.
E enquanto espera, ele continua pagando a conta cheia. Some doze contas por ano
de espera: e dinheiro que sai e nao volta, enquanto o eventual desconto no
equipamento e incerto.
Nao transforme isso em ameaca. Apresente como o que e: um relogio que ja esta
correndo e nao depende de nenhum de nos dois. Deixe ele fazer a conta.',
 '{}',
 '{"precos.formas_pagamento","precos.financiamento","execucao.prazo_homologacao"}', '{}', 'omit',
 'Urgencia REAL do calendario regulatorio (Fio B sobe por ano) + custo da espera',
 '{"Inventar promocao que acaba para criar pressa","Prometer que o preco nunca mais cai","Ignorar que a espera tem custo mensal","Usar o Fio B como ameaca em vez de conta"}',
 'marcar_visita', 'skill_seed', 'active', null),

(null, 'energia_solar', 'objections', 'reactive',
 '{"achei mais barato","tem orcamento menor","o outro fez por menos","recebi proposta mais barata","por que voce e mais caro"}',
 null,
 'Em solar, duas propostas quase nunca sao a mesma coisa — e o cliente nao tem
como saber sozinho. Seu trabalho e dar a ele a regua, nao atacar o concorrente.
Compare item a item, com calma: marca e garantia do MODULO, marca e garantia do
INVERSOR (que e o que quebra primeiro), estrutura adequada ao telhado dele,
protecoes (string box, DPS, aterramento), projeto com ART, e — o mais esquecido
— se a homologacao esta inclusa ou vai virar custo depois.
Pergunte o que a outra proposta inclui. Muitas vezes a diferenca de preco e
exatamente o que falta nela, e o proprio cliente descobre isso ao ler.
Nunca fale mal de quem fez a outra proposta. Diga: "pode ser uma boa proposta,
so vamos conferir se estao comparando a mesma coisa". Quem ensina o cliente a
comparar ganha autoridade mesmo quando perde o pedido.',
 '{"precos.o_que_inclui","garantias.modulo","garantias.inversor"}',
 '{"oferta.marcas_modulo","oferta.marcas_inversor","garantias.instalacao","atuacao.equipe_propria"}', '{}', 'escalate',
 'Dar a regua de comparacao item a item (nunca atacar o concorrente)',
 '{"Falar mal do concorrente","Baixar o preco para igualar sem igualar o escopo","Nao perguntar o que a outra proposta inclui","Comparar so o valor final"}',
 'comparar_escopo', 'skill_seed', 'active', null),

(null, 'energia_solar', 'objections', 'reactive',
 '{"e se eu mudar de casa","vou vender o imovel","e se eu me mudar","nao sei se fico aqui","o imovel e alugado"}',
 null,
 'Objecao legitima e facil de responder — desde que voce nao invente numero de
valorizacao.
Sao tres caminhos reais: o sistema pode ser transferido para o novo titular
junto com o imovel (a unidade consumidora e que gera os creditos); pode ser
desinstalado e remontado em outro endereco, com custo de mao de obra e estrutura
nova; e, no caso de venda, e um item que pesa na negociacao porque o comprador
herda uma conta de luz menor.
Se o imovel e alugado, isso muda tudo: o titular da conta e quem se beneficia,
e a conversa passa pelo proprietario. Descubra isso ANTES de dimensionar, ou
voce vai fazer um projeto para quem nao pode decidir.
Nao prometa percentual de valorizacao do imovel — nao e um numero que voce
controla nem consegue provar.',
 '{}',
 '{"pos_venda.ampliacao","diferencial.motivo_escolher","atuacao.regiao"}', '{}', 'omit',
 'Tres saidas concretas + descobrir quem e o titular antes de dimensionar',
 '{"Prometer percentual de valorizacao do imovel","Dimensionar para quem mora de aluguel sem falar com o proprietario","Tratar a duvida como desculpa"}',
 'confirmar_titular', 'skill_seed', 'active', null),

-- --------------------------------------------------------- RISK_FREE_ENTRY
(null, 'energia_solar', 'risk_free_entry', 'reactive',
 '{"tem como simular","faz orcamento sem compromisso","quanto eu economizaria","da para fazer uma estimativa","como sei se vale a pena"}',
 null,
 'Este e o melhor momento da conversa e o mais desperdicado. A pessoa esta
pedindo para voce entregar valor antes de vender — aceite na hora.
Peca a conta de luz e devolva uma analise de verdade: consumo medio dos ultimos
meses, tamanho de sistema que faz sentido, geracao estimada e o que sobraria de
conta (nunca zero). Isso e trabalho tecnico real entregue de graca, e cria a
reciprocidade mais forte que existe neste mercado.
Combine o proximo passo junto com a entrega: "te mando a simulacao ate amanha e
a gente conversa quinta". Simulacao entregue sem data de retorno vira PDF
esquecido, e o cliente usa o seu numero para negociar com outro.
Se voce faz visita tecnica sem custo, ofereca aqui — mas so depois de qualificar
telhado e padrao, para nao gastar deslocamento com quem so pesquisava.',
 '{"execucao.prazo_proposta"}',
 '{"precos.como_cobra","execucao.prazo_visita","atuacao.regiao"}', '{}', 'escalate',
 'Entregar analise real da conta como reciprocidade + data de retorno combinada',
 '{"Mandar simulacao generica sem a conta dele","Entregar a simulacao sem marcar o retorno","Sair para visita antes de qualificar telhado e padrao","Prometer economia sem dimensionar"}',
 'entregar_simulacao', 'skill_seed', 'active', null),

-- ---------------------------------------------------------- AVAILABILITY
(null, 'energia_solar', 'availability', 'reactive',
 '{"em quanto tempo fica pronto","quando comeco a economizar","demora quanto","prazo de instalacao","quando liga o sistema"}',
 null,
 'Aqui mora a maior frustracao do setor, e ela e evitavel: o cliente acha que
instalou é igual a economizando. Nao e. Existem TRES relogios diferentes e voce
precisa nomear os tres.
Primeiro o seu: projeto e proposta. Depois a instalacao fisica, que em
residencia costuma ser rapida — dias, nao semanas. E entao o terceiro, que NAO
E SEU: a concessionaria. Ela aprova o projeto, faz vistoria e troca o medidor,
e so a partir dai o sistema injeta e gera credito.
Diga isso na venda, nao depois. Cliente que descobre sozinho que vai esperar
semanas depois de pagar acha que foi enganado — e a reclamacao nao vai para a
distribuidora, vai para voce.
Informe o prazo da SUA concessionaria como estimativa honesta, nunca como
compromisso. E combine que voce da posicao durante a espera, sem ele precisar
perguntar. Essa unica frase evita a maior parte das reclamacoes do setor.',
 '{"execucao.prazo_instalacao","execucao.prazo_homologacao"}',
 '{"execucao.prazo_visita","execucao.prazo_proposta","execucao.distribuidoras"}', '{}', 'escalate',
 'Nomear os tres relogios e separar o que e seu do que e da concessionaria',
 '{"Dizer so o prazo de instalacao e omitir a homologacao","Prometer o prazo da concessionaria como se fosse seu","Deixar o cliente descobrir a espera depois de pagar","Sumir durante a homologacao"}',
 'alinhar_prazos', 'skill_seed', 'active', null),

-- --------------------------------------------------------------- CATALOG
(null, 'energia_solar', 'catalog', 'reactive',
 '{"quantas placas preciso","quantos paineis","qual a potencia","quantos kwp","cabe no meu telhado","qual sistema serve para mim"}',
 null,
 'Pergunta tecnica se responde com metodo, nao com palpite. E o palpite aqui e
caro: sistema subdimensionado frustra, superdimensionado gera credito que expira
em 60 meses sem uso.
Explique de que depende, em linguagem de gente: o consumo dos ultimos 12 meses
(nao o do mes passado, que pode ser atipico), a area util e a inclinacao do
telhado, o sombreamento ao longo do dia e o padrao de ligacao.
Peca a conta e, se puder, uma foto do telhado. Com isso voce ja diz se cabe, e
o que muda se nao couber tudo — comecar menor e ampliar depois e caminho
legitimo, desde que o inversor seja escolhido pensando nisso.
Confirme o tipo de telhado antes de prometer qualquer coisa: ceramico, metalico,
fibrocimento, laje e solo pedem estruturas diferentes, com custo e prazo
diferentes. Prometer sem ver o telhado e como orcar sem medir.',
 '{"oferta.telhados_atendidos","oferta.tipos_sistema"}',
 '{"pos_venda.ampliacao","execucao.prazo_visita","oferta.marcas_inversor"}', '{}', 'escalate',
 'Dimensionar por consumo de 12 meses e telhado real, nunca por palpite',
 '{"Dizer numero de placas sem ver consumo e telhado","Dimensionar pelo mes atipico","Superdimensionar para aumentar a venda","Prometer sem confirmar o tipo de telhado"}',
 'dimensionar', 'skill_seed', 'active', null),

(null, 'energia_solar', 'catalog', 'reactive',
 '{"so me manda o orcamento","nao precisa ligar","prefiro por escrito","manda por email","sem visita agora","nao quero reuniao"}',
 null,
 'Boa parte de quem pesquisa solar quer comparar sozinho antes de falar com
qualquer vendedor — e insistir em ligacao com quem pediu por escrito e o jeito
mais rapido de ser descartado em silencio.
Entregue por escrito o que permite ele avancar: os tipos de sistema que voce
instala, marcas de modulo e inversor, o que a proposta inclui, garantias
separadas (modulo, inversor, instalacao) e o prazo tipico. Faixa de investimento
sim; valor fechado sem dimensionamento, nao — e explique por que.
Faca no maximo DUAS perguntas junto, por escrito, e so as que mudam o projeto:
o valor medio da conta e o tipo de telhado.
Deixe a porta aberta com um retorno combinado e leve. Quem compara sozinho volta
quando entende — desde que voce nao tenha enchido o saco antes.',
 '{"precos.o_que_inclui","oferta.tipos_sistema"}',
 '{"garantias.modulo","garantias.inversor","precos.faixa","execucao.prazo_instalacao"}', '{}', 'escalate',
 'Material completo por escrito + duas perguntas + porta aberta',
 '{"Insistir em visita para quem pediu por escrito","Mandar valor fechado sem dimensionar","Enviar material generico de marketing","Sumir porque ele nao respondeu na hora"}',
 'entregar_material', 'skill_seed', 'active', null),

-- --------------------------------------------------------- EXPERTISE_PROOF
(null, 'energia_solar', 'expertise_proof', 'reactive',
 '{"voces sao confiaveis","ha quanto tempo trabalham","quem instala","tem engenheiro","ja fizeram quantos","posso ver algum sistema"}',
 null,
 'Desconfianca aqui e racional: o mercado teve muita empresa que vendeu, instalou
mal e sumiu — e o cliente vai colocar dezenas de milhares de reais em cima do
proprio telhado.
Prove com o que e verificavel: quem assina a ART (o projeto exige responsavel
tecnico com CREA), se a equipe de instalacao e propria ou terceirizada, ha
quanto tempo voce instala e quantos sistemas ja entregou. Numero e registro
valem mais que adjetivo.
Ofereca o que nenhum concorrente ruim oferece: um cliente proximo para ele
conversar, ou um sistema para ver de perto. Em solar a prova social vale mais
que folder, porque o vizinho mostra a conta.
Se voce nao tem um dado que ele pediu, diga e mostre o que tem no lugar.
Inventar certificacao ou obra e o unico erro irreversivel desta conversa.',
 '{}',
 '{"atuacao.responsavel_tecnico","atuacao.equipe_propria","diferencial.tempo_de_casa","diferencial.obras_referencia","garantias.instalacao"}', '{}', 'omit',
 'Prova verificavel: ART, equipe propria e cliente que ele pode ver',
 '{"Responder com adjetivo em vez de registro","Citar cliente sem autorizacao","Afirmar certificacao que nao tem","Esconder que a instalacao e terceirizada"}',
 'enviar_prova', 'skill_seed', 'active', null),

-- ---------------------------------------------------------- GOAL_MATCHING
(null, 'energia_solar', 'goal_matching', 'reactive',
 '{"tenho um comercio","e para minha empresa","e no sitio","e um condominio","tenho consumo alto","e para minha casa"}',
 null,
 'O mesmo produto resolve problemas diferentes, e o argumento tem que mudar com
o tipo de imovel — senao voce fala de economia para quem esta pensando em
previsibilidade.
Residencia: o gatilho e a conta que sobe todo ano e o desconforto de nao poder
usar o ar-condicionado. Comercio: energia e custo fixo, e sistema previsivel
melhora margem — fale com quem olha a planilha. Industria e producao: interessa
demanda contratada, horario de ponta e continuidade. Rural: bombeamento e
irrigacao mudam o dimensionamento e muitas vezes ha linha de credito propria.
Condominio: decisao coletiva, assembleia e area comum — o ciclo e mais longo e
tem mais de um decisor.
Pergunte para que serve o imovel e quem decide, antes de recomendar. E confirme
o padrao de ligacao: ele muda o custo de disponibilidade que vai continuar sendo
cobrado, e isso precisa entrar na conta desde o comeco.',
 '{"oferta.tipos_sistema"}',
 '{"atuacao.regiao","precos.financiamento","oferta.telhados_atendidos"}', '{}', 'escalate',
 'Argumento pelo uso do imovel e pelo decisor, nao pelo produto',
 '{"Falar de economia domestica para decisor de empresa","Ignorar quem decide no condominio","Nao confirmar o padrao de ligacao","Recomendar antes de saber o uso"}',
 'qualificar_perfil', 'skill_seed', 'active', null),

-- ------------------------------------------------------- COMMITMENT_OFFER
(null, 'energia_solar', 'commitment_offer', 'proactive',
 '{"mandou a proposta","enviei o orcamento","ficou de responder","nao respondeu a simulacao","segue a proposta"}',
 null,
 'Em solar o orcamento nao morre de preco: morre de silencio. O cliente recebe
tres propostas, nao entende as diferencas, adia — e adiar e a decisao mais facil
de todas, porque nao exige nada dele.
Nao repita a proposta. Volte com ANGULO NOVO a cada toque: primeiro confirmar
que abriu e tirar duvida da simulacao; depois a opcao de pagamento que ele nao
tinha considerado; depois, se fizer sentido, um escopo menor que cabe agora.
Cada toque precisa entregar algo, nunca so cobrar.
Marque data em vez de deixar em aberto. "Te ligo quinta as 10h para a gente
fechar as duvidas" vale mais que "qualquer coisa me chama" — este ultimo
transfere para o cliente a tarefa que e sua.
E no ultimo toque, pergunte tambem se foi nao. Um nao dito libera sua agenda e,
com frequencia, vira o motivo real que voce ainda podia resolver.',
 '{}',
 '{"precos.financiamento","precos.formas_pagamento","pos_venda.ampliacao","execucao.prazo_homologacao"}', '{}', 'omit',
 'Cadencia com angulo novo e data marcada (o antidoto do silencio)',
 '{"Reenviar a mesma proposta","Perguntar so se ele viu","Deixar o retorno por conta do cliente","Desistir depois do segundo silencio"}',
 'cobrar_posicao', 'skill_seed', 'active', null),

(null, 'energia_solar', 'commitment_offer', 'reactive',
 '{"vou pensar","preciso ver com calma","vou conversar com minha esposa","vou analisar","depois eu te falo","me da um tempo"}',
 null,
 'Se ele ja entendeu o valor e mesmo assim adiou, isto NAO e objecao: e
indecisao. E a diferenca importa, porque o remedio e oposto. Argumentar mais com
quem ja concordou aumenta a sensacao de risco e empurra a decisao para longe.
Julgue primeiro: se ainda nao viu valor, volte para a descoberta. Se ja
concordou, o que trava e medo de errar — sistema caro, no proprio telhado, com
tres propostas diferentes e nenhuma referencia para comparar.
Pare de oferecer opcoes e RECOMENDE uma: "no seu caso eu faria assim, por isto".
Quem esta travado nao quer escolher, quer ser orientado por quem entende.
Diminua o tamanho da decisao com o que for verdade na sua casa: comecar menor e
ampliar depois, financiamento com parcela proxima da conta, garantia de
instalacao por escrito, um cliente proximo para ele conversar. Reduzir risco
destrava mais que reduzir preco.
E combine o proximo passo com data. Sem data, este cliente some — e some sem
dizer nao, que e o que faz o vendedor achar que ainda esta vivo.',
 '{}',
 '{"garantias.instalacao","precos.financiamento","pos_venda.ampliacao","diferencial.obras_referencia"}', '{}', 'omit',
 'Recomendar UM caminho e diminuir o tamanho da decisao, nunca repetir o argumento',
 '{"Repetir os beneficios para quem ja concordou","Mandar mais opcoes de kit","Dar desconto achando que e preco","Deixar sem data de retorno"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt'),

-- ----------------------------------------------------------- RECIPROCITY
(null, 'energia_solar', 'reciprocity', 'proactive',
 '{"visita tecnica","vou ai ver o telhado","agendar visita","confirmar visita","quando voce vem"}',
 null,
 'A visita tecnica e o momento em que voce deixa de ser mais um orcamento e vira
o profissional que esteve la. Trate como venda, nao como medicao.
Antes: confirme na vespera e peca acesso ao telhado e ao padrao de entrada.
Visita que nao consegue subir ou abrir o quadro vira segunda visita, e segunda
visita e prejuizo.
Durante: mostre o que voce esta vendo. Explicar por que aquele trecho do telhado
nao serve por causa da sombra da caixa d agua vale mais que qualquer folder —
e o cliente conta isso para o vizinho.
Peca para o decisor estar presente. Em residencia isso costuma significar o
casal; descobrir na hora da assinatura que falta alguem custa semanas.
Depois: saia com o proximo passo combinado e com a data da proposta. A visita e
onde a confianca nasce; deixar ela terminar sem data e jogar fora o melhor
momento da venda.',
 '{"execucao.prazo_visita"}',
 '{"execucao.prazo_proposta","atuacao.equipe_propria","atuacao.regiao"}', '{}', 'escalate',
 'Visita como venda: confirmar vespera, decisor presente e sair com data',
 '{"Ir sem confirmar acesso ao telhado","Medir em silencio e ir embora","Fazer a visita sem o decisor","Sair sem combinar quando entrega a proposta"}',
 'realizar_visita', 'skill_seed', 'active', null),

-- ------------------------------------------------------- LIMITS_AND_ETHICS
(null, 'energia_solar', 'limits_and_ethics', 'reactive',
 '{"vou zerar minha conta","fico sem pagar luz","conta zero","garante a economia","nao pago mais nada","e de graca depois"}',
 null,
 'ESTA E A ENTRADA MAIS IMPORTANTE DO SEGMENTO, e ela existe para voce NAO
vender melhor: existe para voce nao vender errado.
Ninguem zera a conta. Mesmo gerando tudo o que consome, o cliente continua
pagando o custo de disponibilidade — o minimo para o imovel seguir ligado na
rede: 30 kWh no monofasico, 50 no bifasico, 100 no trifasico. Alem disso ficam
iluminacao publica e os tributos que incidem.
Diga isso ANTES de fechar, com naturalidade. "Sua conta nao zera, ela cai para
perto do minimo" e uma frase que custa cinco segundos e evita um cliente furioso
na primeira fatura — que e exatamente quem reclama publicamente e mata sua
indicacao.
Tambem nao garanta geracao: producao varia com clima, sujeira e estacao. Fale em
estimativa baseada no dimensionamento, e explique que o excedente vira credito
com validade de 60 meses.
Em solar, a promessa exagerada nao perde a venda: ganha a venda e perde a
empresa.',
 '{}',
 '{"garantias.modulo","garantias.inversor","pos_venda.monitoramento"}', '{}', 'omit',
 'Dizer o limite antes de fechar (conta minima, geracao estimada, credito 60 meses)',
 '{"Prometer conta zero","Garantir economia em percentual fixo","Omitir o custo de disponibilidade","Falar 25 anos de garantia sem separar modulo, produto e inversor"}',
 'alinhar_expectativa', 'skill_seed', 'active', null),

-- --------------------------------------------------------------- RETENTION
(null, 'energia_solar', 'retention', 'proactive',
 '{"instalou e nao homologou","esperando a concessionaria","quando troca o medidor","ja instalou faz tempo","cade minha homologacao"}',
 null,
 'O periodo entre a instalacao e a homologacao e onde a reputacao deste mercado
se decide. O cliente pagou, ve as placas no telhado, e a conta continua vindo
igual. Se voce sumir nessa janela, ele conclui que foi enganado — mesmo quando
esta tudo certo e o prazo e da distribuidora.
A regra e simples: de posicao ANTES de ele perguntar. Um aviso quando o projeto
entra na concessionaria, um no meio do caminho e um quando o medidor e trocado.
Tres mensagens que custam nada e valem a indicacao inteira.
Explique o que esta acontecendo em cada etapa e o que depende de quem. Cliente
que entende que o prazo e da distribuidora cobra a distribuidora; cliente que
nao entende cobra voce — e cobra em avaliacao publica.
Quando homologar, feche o ciclo: ensine a ler a primeira conta com o sistema
(ele vai estranhar o custo minimo), mostre como acompanhar a geracao e SO
ENTAO peca a indicacao. Indicacao pedida antes de o cliente ver o resultado e
pedido no vazio; pedida depois da primeira conta menor, ela vem sozinha.',
 '{}',
 '{"execucao.prazo_homologacao","pos_venda.monitoramento","execucao.distribuidoras"}', '{}', 'omit',
 'Dar posicao antes de o cliente perguntar + pedir indicacao so depois da primeira conta',
 '{"Sumir depois de instalar","Deixar o cliente descobrir sozinho o atraso","Pedir indicacao antes de ele ver a economia","Nao ensinar a ler a primeira conta"}',
 'acompanhar_homologacao', 'skill_seed', 'active', null),

(null, 'energia_solar', 'retention', 'proactive',
 '{"limpeza dos paineis","manutencao","esta gerando menos","revisao do sistema","faz tempo que instalei","quero ampliar"}',
 null,
 'Cliente instalado nao e cliente encerrado: e a carteira mais barata que voce
tem. Ele ja confia, ja tem o sistema e vai precisar de voce de novo.
Painel sujo gera menos, e a queda e gradual — o cliente nao percebe, so acha que
"nao economiza tanto quanto prometeram". Quem some por dois anos e chamado de
volta como culpado; quem aparece na revisao e chamado para ampliar.
Programe o retorno pelo ciclo combinado (semestral ou anual conforme a regiao e
a poeira) e chegue com dado, nao com oferta: geracao do periodo, comparacao com
o esperado, o que da para melhorar.
Ampliacao e a venda mais facil deste mercado e a mais esquecida. Quem comprou ar
condicionado novo, trocou o chuveiro, comprou carro eletrico ou aumentou a
familia esta gerando menos do que consome — e ele nao sabe. Voce sabe, se
estiver olhando.',
 '{}',
 '{"pos_venda.manutencao","pos_venda.monitoramento","pos_venda.ampliacao"}', '{}', 'omit',
 'Retorno programado com dado de geracao (a ampliacao e a venda esquecida)',
 '{"Sumir apos a homologacao","Chegar na revisao so para vender","Nao avisar quando a geracao cai","Perder a ampliacao para o concorrente que apareceu"}',
 'agendar_revisao', 'skill_seed', 'active', null),

-- --------------------------------------------------------------- ECOSYSTEM
(null, 'energia_solar', 'ecosystem', 'reactive',
 '{"tem financiamento","da para parcelar no banco","como funciona o financiamento","aprova meu credito","tem linha de credito","consorcio"}',
 null,
 'Financiamento nao e detalhe do pagamento: em solar ele E parte da venda. A
maioria dos projetos so acontece porque a parcela cabe onde a conta de luz ja
cabia — trocar despesa por bem e o argumento que destrava a maior parte dos
"nao tenho o valor".
Trabalhe com o que existe na sua casa e esta no DNA: nunca cite banco, taxa ou
prazo que voce nao confirmou. Taxa errada dita por WhatsApp vira expectativa
quebrada na hora da aprovacao.
Ajude o cliente a chegar preparado no banco. Entregue o dossie tecnico do
projeto — dimensionamento, geracao estimada, economia projetada e garantias.
Analista aprova mais rapido o que consegue entender, e essa e uma vantagem que
o concorrente desorganizado nao tem.
Se a aprovacao demorar, mantenha a conversa viva com posicao, nao com cobranca.
E lembre que credito reprovado nao e fim: ha entrada maior, escopo menor e
consorcio — desde que existam na sua operacao.',
 '{"precos.financiamento"}',
 '{"precos.formas_pagamento","precos.faixa","execucao.prazo_proposta"}', '{}', 'escalate',
 'Financiamento como parte da venda + dossie tecnico para o banco',
 '{"Citar taxa ou banco que nao confirmou","Deixar o cliente ir sozinho ao banco","Tratar reprovacao como fim da venda","Prometer aprovacao"}',
 'encaminhar_financiamento', 'skill_seed', 'active', null);
