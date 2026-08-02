-- =====================================================================
-- COS — MIGRATION 0039 : BIBLIOTECA DE OFICINA MECÂNICA
--
-- DECISÃO DE ESCRITA (ago/2026): esta biblioteca nasce COM ACENTO.
-- As nove anteriores foram escritas em ASCII, quando `technique`,
-- `strategy` e `trigger_questions` eram anotação interna do motor. Não são
-- mais: o Responder mostra a técnica ao vendedor e o exercício do curso
-- mostra o gatilho ao aluno como mensagem de cliente. Texto sem acento na
-- tela de um cliente pagante parece sistema quebrado. As antigas ficam
-- como dívida registrada; as novas não nascem devendo.
--
-- FUNDAMENTO DO SETOR (o vocabulário de quem vive isto):
--   • SINTOMA NÃO É CAUSA. O cliente chega com "está fazendo um barulho".
--     Cotar por telefone o que ninguém olhou é a origem de metade dos
--     conflitos de entrega do ramo.
--   • O DIAGNÓSTICO É O PRODUTO, e quase todo mundo dá de graça — e
--     depois vê o cliente levar o laudo para quem cobra menos a mão de
--     obra. Cobrar e abater na aprovação resolve os dois lados.
--   • HORA TÉCNICA é o que sustenta qualquer orçamento. Oficina que não
--     sabe a própria hora técnica desconta na mão de obra sem perceber.
--   • ORIGINAL, PARALELA, GENUÍNA. A escolha é do cliente e tem lei:
--     o CDC (art. 21) obriga peça original ou de mesma especificação,
--     salvo autorização em contrário. Vender paralela sem avisar é
--     ilegal, e é o que alimenta a fama do setor.
--   • A PEÇA VELHA É DO CLIENTE. Devolver não é gentileza: é prova de
--     que o serviço foi feito, e é o gesto de confiança mais barato que
--     existe neste ramo.
--   • REVISÃO TEM DATA. Quilometragem e tempo dão o mês em que o cliente
--     vai precisar. É a recompra mais previsível de todos os segmentos, e
--     é a que menos gente trabalha.
--
-- A OBJEÇÃO Nº 1 NÃO É PREÇO. É "meu primo disse que é só a vela" e
-- "na outra oficina fizeram por menos". As duas são desconfiança
-- fantasiada — e as duas pioram se você discutir. Por isso a escola de
-- `objections` aqui é Voss (isolar, rotular), nunca fechamento por pressão.
--
-- REGRA DA TRAVA ANTI-INVENÇÃO nesta biblioteca:
--   `escalate` quando o fato que falta é NÚMERO, PRAZO ou COMPROMISSO
--   (hora técnica, valor do diagnóstico, prazo de peça, garantia) —
--   inventar ali gera conflito na entrega e é o erro caro do ramo.
--   `omit` quando é PROVA OPCIONAL (equipamento, certificação): a resposta
--   sai sem a prova, nunca com uma prova inventada.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'oficina' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

-- ---------------------------------------------------------------- PRICING
(null, 'oficina', 'pricing', 'reactive',
 '{"quanto custa trocar a embreagem","qual o valor da revisão","quanto fica o conserto","me passa o preço por telefone","quanto sai para arrumar"}',
 null, 'Preço de serviço sem saber modelo, ano e motor é chute — e chute vira conflito na
entrega, porque o número dito no telefone é o que o cliente guarda.
Não fuja e não invente: dê a HORA TÉCNICA e a faixa dos serviços comuns, que são
verdade, e explique em uma frase por que o valor fechado depende de olhar.
"Trabalho com hora técnica de X. Para esse serviço, no seu carro, costuma ficar
entre A e B dependendo da peça — te confirmo certo depois de olhar."
Depois puxe os três dados que fecham a conta: modelo, ano e o que o carro está
fazendo. Quem responde isso já está agendando.', '{"pricing.hora_tecnica"}',
 '{"pricing.range","pricing.parcelamento"}', '{}', 'escalate',
 'Hora técnica como âncora + faixa honesta antes do valor fechado', '{"Dar preço fechado por telefone sem ver o veículo","Fugir do preço com \"depende\" e nada mais","Cotar pelo sintoma que o cliente descreveu, sem diagnóstico"}', 'agendar_entrada',
 'skill_seed', 'active', 'consultiva_spin'),

(null, 'oficina', 'pricing', 'reactive',
 '{"tem peça mais barata","peça original ou paralela","qual a diferença da peça genuína","não quero gastar com original","dá para colocar uma similar"}',
 null, 'Esta pergunta é uma oportunidade de confiança, não de desconto.
A lei está do seu lado e o cliente não sabe: o CDC obriga peça original ou de
mesma especificação técnica, e paralela só com AUTORIZAÇÃO dele. Diga isso.
Explique a diferença sem torcer o nariz para a opção barata: onde a paralela
resolve bem, onde ela não vale o risco (freio, embreagem, correia, itens de
segurança) e qual é a diferença de garantia entre as duas.
Depois deixe ele escolher, e registre a escolha. Cliente que escolheu não
reclama do que escolheu — cliente que descobriu depois, sim.', '{"pricing.politica_peca"}',
 '{"expertise_proof.garantia"}', '{"Nunca colocar peça paralela sem autorização registrada do cliente (CDC art. 21)"}', 'escalate',
 'Transparência de peça como prova de honestidade (a lei a seu favor)', '{"Empurrar original sem explicar a diferença","Colocar paralela por conta própria para fechar mais barato","Falar mal da peça paralela em bloco, inclusive onde ela resolve"}', 'registrar_autorizacao',
 'skill_seed', 'active', 'consultiva_spin'),

-- -------------------------------------------------------- RISK_FREE_ENTRY
(null, 'oficina', 'risk_free_entry', 'reactive',
 '{"vocês olham de graça","dá para dar uma olhada","é cobrado só para ver","quanto custa o diagnóstico","preciso pagar para saber o problema"}',
 null, 'Duas coisas diferentes, e confundir as duas custa dinheiro: CHECAGEM é olhar o
óbvio em minutos (pneu, freio, nível, luz de painel) e pode ser gratuita, porque
gera confiança e leva pouco tempo. DIAGNÓSTICO é trabalho técnico com
equipamento e hora de mecânico — e é o seu produto.
Diga isso sem constrangimento: "a checagem rápida eu faço na hora, sem cobrar. Se
precisar de diagnóstico com scanner, custa X e eu abato se você aprovar o serviço."
Oficina que dá diagnóstico de graça vira consultoria gratuita da concorrência —
o cliente sai com o laudo e fecha onde a mão de obra é mais barata.', '{"risk_free_entry.checagem_gratuita","pricing.diagnostico_valor"}',
 '{"risk_free_entry.o_que_inclui","risk_free_entry.leva_e_traz"}', '{}', 'escalate',
 'Separar checagem gratuita de diagnóstico cobrado, com abatimento na aprovação', '{"Dar o diagnóstico completo de graça e virar consultoria da concorrência","Cobrar o diagnóstico sem explicar que abate","Chamar de \"olhadinha\" um trabalho que leva uma hora"}', 'agendar_entrada',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- ----------------------------------------------------------- AVAILABILITY
(null, 'oficina', 'availability', 'reactive',
 '{"consigo levar hoje","fica pronto quando","quanto tempo demora","preciso do carro amanhã","dá para fazer no mesmo dia"}',
 null, 'Prazo de oficina tem duas partes, e prometer só a primeira é o que gera cliente
bravo no balcão: a SUA parte (o serviço) e a parte que não é sua (a peça).
Fale as duas em voz alta. "O serviço em si é de meio dia. O que manda no prazo é
a peça: se for de estoque, sai amanhã; se precisar pedir, são X dias."
E combine o aviso: quem avisa antes do atraso está resolvendo; quem avisa depois
de ser cobrado está se justificando — o fato é o mesmo e a leitura é oposta.
Se o cliente depende do carro para trabalhar, isso muda tudo: pergunte antes de
prometer, e ofereça o que você tiver de apoio.', '{"availability.prazo_servico","availability.prazo_peca"}',
 '{"availability.prazo_diagnostico","risk_free_entry.carro_reserva"}', '{}', 'escalate',
 'Separar o prazo do serviço do prazo da peça + combinar o aviso de atraso', '{"Prometer prazo sem confirmar disponibilidade da peça","Dizer \"amanhã\" para não perder o cliente","Descobrir só na entrega que ele precisava do carro para trabalhar"}', 'agendar_entrada',
 'skill_seed', 'active', 'consultiva_spin'),

-- --------------------------------------------------------- EXPERTISE_PROOF
(null, 'oficina', 'expertise_proof', 'reactive',
 '{"vocês mexem em carro da minha marca","tem scanner para esse modelo","já fizeram esse serviço antes","é especializado em quê","tem experiência com carro importado"}',
 null, 'Competência em oficina se demonstra, não se afirma. "Somos especializados" não
diz nada — todo concorrente escreve igual.
O que demonstra: o equipamento que você tem (scanner, alinhamento, banco de
teste), o tempo no mesmo endereço, a marca em que você é referência, e um caso
concreto do mesmo modelo e do mesmo defeito.
E o que constrói mais autoridade que qualquer folder: dizer o que você NÃO faz.
"Câmbio automático dessa linha eu não pego, mando para o Fulano, que é quem faz
bem" ganha mais confiança do que aceitar e entregar mal.
Se o cliente perguntou por uma marca que você não domina, diga na hora.', '{"expertise_proof.tempo_de_casa"}',
 '{"expertise_proof.especialidades","expertise_proof.equipamentos","expertise_proof.certificacoes","catalog.marcas_atendidas"}', '{}', 'omit',
 'Prova concreta (equipamento, caso igual, tempo) e o limite declarado', '{"Responder com adjetivo: \"somos referência\", \"qualidade premium\"","Aceitar serviço de marca que você não domina para não perder o cliente","Citar equipamento que a oficina não tem"}', 'agendar_entrada',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- ----------------------------------------------------------------- CATALOG
(null, 'oficina', 'catalog', 'reactive',
 '{"me manda a tabela de preços","quero por escrito antes de levar","o que está incluso na revisão","manda a lista de serviços","prefiro ver por escrito"}',
 null, 'Cliente que pede por escrito não está desconfiando: está economizando tempo, e
uma parte grande já pesquisou tudo antes de falar com você. Forçar conversa aí é
atrito — e ele vai buscar a informação em quem entregar.
Mande o que dá para mandar sem chute: o que a revisão inclui item a item, os
serviços que você executa, a hora técnica e a política de peça. Junto, uma linha
de contexto que só você pode dar: "esse pacote cobre o que o seu modelo pede na
quilometragem que você falou".
Termine com UMA pergunta fácil e um caminho para agendar. Sem insistir em ligar.', '{"catalog.items"}',
 '{"pricing.hora_tecnica","catalog.nao_faz","availability.weekly_hours"}', '{}', 'escalate',
 'Entregar a ficha por escrito sem forçar conversa (o comprador que se serve sozinho)', '{"Responder \"passa aqui que eu te explico\" a quem pediu por escrito","Mandar tabela genérica que não serve para o veículo dele","Sumir depois de mandar a lista"}', 'agendar_entrada',
 'skill_seed', 'active', 'consultiva_spin'),

-- ----------------------------------------------------------- GOAL_MATCHING
(null, 'oficina', 'goal_matching', 'reactive',
 '{"está fazendo um barulho","acendeu uma luz no painel","está puxando para o lado","está gastando muito combustível","o carro está estranho","está falhando"}',
 null, 'Este é o começo mais comum do dia e o mais mal aproveitado. O cliente traz um
SINTOMA e o vendedor mediano responde com um SERVIÇO — "deve ser a pastilha, são
X reais". Se errar, perdeu a confiança; se acertar, virou sorte.
Faça três perguntas antes de qualquer palpite, e elas são sempre as mesmas:
quando começou, em que situação aparece (frio, curva, freando, subida) e se
mudou de intensidade. Nenhuma delas fala do que você vende, e as três reduzem
muito o campo de investigação.
Depois traduza o que ouviu em risco, não em peça: "pelo que você descreve, pode
ser coisa simples ou pode ser do sistema de freio — e essa segunda hipótese é a
que eu não deixaria esperar". Urgência que o próprio cliente conclui é a única
que ele não desconfia.', '{}',
 '{"catalog.items","expertise_proof.equipamentos"}', '{}', 'omit',
 'Perguntas de situação e de implicação antes do palpite (Rackham no balcão)', '{"Dar o diagnóstico pelo sintoma, por telefone","Assustar o cliente com a hipótese mais cara","Fazer dez perguntas seguidas e virar interrogatório"}', 'agendar_entrada',
 'skill_seed', 'active', 'consultiva_spin'),

-- -------------------------------------------------------------- OBJECTIONS
(null, 'oficina', 'objections', 'reactive',
 '{"na outra oficina fizeram por menos","achei mais barato ali","o concorrente cobrou metade","por que é mais caro aí","vi mais barato na internet"}',
 null, 'Antes de mexer no preço, descubra o que está sendo comparado — e quase nunca é a
mesma coisa. A diferença costuma estar em três lugares: a peça (paralela contra
original), a mão de obra (o que está incluso) e a garantia.
Pergunte com curiosidade legítima, não com desconfiança: "consegue ver se o
orçamento dele é com peça original? E quanto ele dá de garantia?". Você não está
atacando ninguém — está ajudando a comparar duas coisas diferentes.
NUNCA fale mal da outra oficina. Quem faz isso está falando mal do cliente que
quase escolheu ela, e o cliente ouve exatamente assim.
Se depois de tudo for mesmo o mesmo escopo e mais barato, diga a verdade: você
não vai cobrir, e o motivo é o que você entrega junto. Cliente respeita isso.', '{}',
 '{"pricing.politica_peca","expertise_proof.garantia","pricing.hora_tecnica"}', '{}', 'omit',
 'Descobrir "mais barato comparado a quê" — peça, escopo e garantia', '{"Baixar o preço na primeira pressão","Falar mal da outra oficina","Comparar só o valor total, sem abrir o que está incluso"}', 'isolar_objecao',
 'skill_seed', 'active', 'negociacao_voss'),

(null, 'oficina', 'objections', 'reactive',
 '{"meu primo disse que é só a vela","meu cunhado entende e falou que","vi um vídeo dizendo que é","já sei o que é, só quero trocar a peça","não precisa diagnóstico, é o sensor"}',
 null, 'Aqui você tem duas escolhas, e a instintiva é a errada. Discutir com o primo é
discutir com alguém em quem o cliente confia mais do que em você — e você acabou
de chegar.
Reconheça a hipótese e transforme em teste: "pode ser mesmo, é o mais comum
nesse sintoma. O teste leva vinte minutos e a gente confirma antes de trocar
qualquer coisa — se for isso, você economiza; se não for, você não trocou peça à
toa." Repare que a frase protege o dinheiro DELE, não a sua venda.
Se ele insistir em só trocar a peça, faça e registre por escrito que foi
solicitação do cliente sem diagnóstico. Você não pode garantir resultado de um
serviço que não indicou — e isso precisa estar dito antes, não depois.', '{"policies.autorizacao"}',
 '{"pricing.diagnostico_valor"}', '{"Não garantir resultado de serviço executado por pedido do cliente sem diagnóstico"}', 'omit',
 'Não disputar com o palpite: transformar a hipótese em teste barato', '{"Dizer que o primo está errado","Aceitar trocar a peça sem registrar que foi pedido do cliente","Forçar diagnóstico completo em quem só quer uma peça"}', 'confirmar_diagnostico',
 'skill_seed', 'active', 'negociacao_voss'),

(null, 'oficina', 'objections', 'reactive',
 '{"vou levar em outro lugar para ver","quero uma segunda opinião","vou consultar em outra oficina","preciso conferir esse orçamento"}',
 null, 'Segunda opinião é sinal de valor alto, não de desconfiança em você. Reagir mal
confirma exatamente o medo que motivou o pedido.
Apoie: "faz sentido, é um valor que merece conferir. Leva o orçamento
discriminado — se a outra vier mais barata, olha se a peça é a mesma e qual a
garantia." Você acabou de dar a ele o critério de comparação, e o critério é o
seu.
Ofereça o material que facilita a conferência: o que foi diagnosticado, o que foi
medido, a foto do que está gasto. Quem sai com prova na mão volta mais.
E marque o retorno com dia: "te chamo quinta para saber o que você decidiu?".
Sem data, essa conversa acaba aqui.', '{}',
 '{"expertise_proof.garantia","policies.orcamento_validade"}', '{}', 'omit',
 'Apoiar a segunda opinião e entregar o critério de comparação', '{"Demonstrar irritação ou pressionar para fechar na hora","Deixar sair sem data de retorno","Não dar o orçamento discriminado por medo de perder o serviço"}', 'marcar_retorno',
 'skill_seed', 'active', 'negociacao_voss'),

-- -------------------------------------------------------- COMMITMENT_OFFER
-- A ENTRADA DE INDECISÃO. Todo segmento tem a sua: o cliente que concordou
-- e mesmo assim não decidiu (40 a 60% das perdas, JOLT). Aqui ela é
-- especialmente perigosa porque o carro parado cria urgência real — e
-- urgência real faz o vendedor apertar, que é o movimento que piora.
(null, 'oficina', 'commitment_offer', 'reactive',
 '{"vou pensar e te falo","preciso ver com minha esposa","depois eu retorno","deixa eu ver como fica o mês","não sei se faço agora","vou avaliar"}',
 null, 'ATENÇÃO: quem já ouviu o diagnóstico, concordou com o problema e mesmo assim
adiou não está em dúvida sobre o conserto. Está com medo de errar — de gastar e
o problema voltar, de estar sendo empurrado, de descobrir que era mais barato.
Repetir o argumento aqui PIORA. A pesquisa das 2,5 milhões de chamadas mostrou
que 73% dos vendedores voltam ao começo quando o cliente hesita, e que em 84%
das vezes isso aumentou a chance de perder.
Faça o contrário, nesta ordem:
1. Pergunte o que trava, sem cobrar decisão: "o que ainda te deixa em dúvida?"
2. RECOMENDE um caminho em vez de abrir opções: "no seu caso eu faria só o
   freio agora, que é segurança, e deixava a suspensão para a próxima."
3. DIMINUA o tamanho da decisão — só o urgente agora, o resto com data.
Nenhum dos três é argumento novo. Os três reduzem risco.', '{"policies.autorizacao"}',
 '{"pricing.parcelamento","expertise_proof.garantia"}', '{}', 'omit',
 'Reduzir o risco em vez de insistir: recomendar um caminho e fatiar o serviço', '{"Repetir o diagnóstico com mais detalhe técnico","Assustar com o que pode acontecer se não fizer","Dar desconto para acelerar uma decisão que não é sobre preço"}', 'reduzir_risco',
 'skill_seed', 'active', 'indecisao_jolt'),

(null, 'oficina', 'commitment_offer', 'reactive',
 '{"não tenho como fazer tudo agora","dá para fazer por partes","só o mais urgente","posso parcelar","fazer em duas vezes"}',
 null, 'Este é o pedido mais fácil de atender e o mais mal aproveitado do balcão.
Separe o orçamento em três blocos, sempre na mesma ordem: SEGURANÇA (freio,
pneu, direção, suspensão comprometida), o que PIORA se esperar (vazamento,
correia, arrefecimento) e o que pode esperar sem risco.
Recomende explicitamente o primeiro bloco e diga por quê. Um cliente que faz o
essencial hoje e volta em sessenta dias vale mais do que um que não faz nada e
some — e ele volta sem negociar, porque já sabe como você trabalha.
Combine a data do segundo bloco na hora, com quilometragem estimada. Sem data
combinada, o segundo bloco não acontece.
E se ele precisar de prazo, ofereça o parcelamento que você tem, sem inventar.', '{"policies.autorizacao"}',
 '{"pricing.parcelamento"}', '{}', 'escalate',
 'Fatiar por risco (segurança primeiro) e agendar o segundo bloco com data', '{"Fazer só o barato e não avisar o que ficou pendente","Deixar o cliente escolher o que é urgente sem orientação","Não marcar a data do resto"}', 'aprovar_etapa',
 'skill_seed', 'active', 'cadencia_blount'),

-- ------------------------------------------------------------- RECIPROCITY
(null, 'oficina', 'reciprocity', 'proactive',
 '{"cliente novo","primeira vez aqui","indicado por alguém","veio só trocar óleo","passou para perguntar"}',
 null, 'A forma mais rápida de virar a oficina de confiança de alguém é entregar valor
antes de vender: a checagem rápida bem feita, com o resultado dito por inteiro —
inclusive o que está bom.
Falar o que está BOM é o movimento que quase ninguém faz e o que mais convence:
"olhei o freio, a pastilha está com meia vida, não precisa mexer agora". Quem
ouve isso passa a acreditar em você quando o problema for real.
Regra dura: se na checagem não achou nada urgente, não invente nada. A tentação
de encontrar um serviço para justificar o tempo é exatamente o que criou a fama
do setor — e ela cobra caro no cliente seguinte.
Termine dizendo quando ele deve voltar, com quilometragem. Isso vale mais que
qualquer brinde.', '{"risk_free_entry.checagem_gratuita"}',
 '{"risk_free_entry.o_que_inclui","retention.intervalo_revisao"}', '{}', 'omit',
 'Entregar diagnóstico honesto antes de vender — inclusive o "está tudo bem"', '{"Encontrar um serviço para justificar a checagem","Entregar a checagem e emendar a venda na mesma frase","Não dizer quando ele deve voltar"}', 'agendar_retorno',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- -------------------------------------------------------- LIMITS_AND_ETHICS
(null, 'oficina', 'limits_and_ethics', 'reactive',
 '{"vocês trocaram o que eu não pedi","não autorizei esse serviço","por que veio mais caro que o orçamento","quero a peça velha","não fui avisado"}',
 null, 'Este é o conflito clássico do ramo, e ele se resolve ANTES, não depois.
A lei é clara e está do lado de quem trabalha certo: o orçamento prévio
discriminado é obrigatório, o serviço não autorizado não pode ser cobrado, e as
peças substituídas pertencem ao cliente.
Na prática, três hábitos evitam praticamente todos os casos:
1. Nada é executado sem aprovação registrada — mensagem serve, e vale mais que
   a palavra no balcão.
2. Apareceu serviço novo no meio? Para, chama, explica, e só segue com o "pode
   fazer" dele. Ninguém fica bravo por ser consultado.
3. Guarde as peças trocadas e entregue na devolução do veículo, sem ele pedir.
Se o erro já aconteceu, não discuta: reconheça, corrija o que for seu e não
cobre o que não foi autorizado. A conta de brigar é sempre maior.', '{"policies.autorizacao","policies.pecas_substituidas"}',
 '{"policies.orcamento_validade"}', '{"Serviço não autorizado não é cobrado do cliente","As peças substituídas são devolvidas ao cliente"}', 'escalate',
 'Autorização registrada e peça devolvida — a lei como padrão de atendimento', '{"Executar serviço extra achando que o cliente vai agradecer","Descartar a peça trocada sem perguntar","Discutir a conta em vez de reconhecer o que foi erro seu"}', 'registrar_autorizacao',
 'skill_seed', 'active', 'relacionamento_carnegie'),

(null, 'oficina', 'limits_and_ethics', 'reactive',
 '{"isso precisa mesmo","você não está inventando serviço","toda oficina fala isso","como eu sei que precisa trocar","não confio muito em oficina"}',
 null, 'Quando o cliente diz isso, ele não está te ofendendo: está repetindo uma
experiência que teve, e é uma experiência comum no ramo. Levar para o pessoal
confirma a desconfiança.
Responda com PROVA, não com defesa. "Justo. Vem cá que eu te mostro" resolve mais
que qualquer argumento: mostrar a peça no carro, a folga, a medida fora do
padrão, a foto do antes. Prova que se vê não se discute.
E separe o que é NECESSÁRIO do que é RECOMENDÁVEL, em voz alta, sempre. Um
profissional que diz "isso aqui pode esperar seis meses" ganha o direito de ser
levado a sério quando disser "isso aqui eu não deixaria sair".
Nunca use medo para vender. Além de errado, funciona uma vez.', '{}',
 '{"expertise_proof.equipamentos","expertise_proof.tempo_de_casa"}', '{}', 'omit',
 'Mostrar em vez de argumentar + separar o necessário do recomendável', '{"Se ofender com a desconfiança","Usar medo (\"pode travar na estrada\") para acelerar a decisão","Colocar tudo como urgente"}', 'mostrar_prova',
 'skill_seed', 'active', 'relacionamento_carnegie'),

-- --------------------------------------------------------------- RETENTION
(null, 'oficina', 'retention', 'proactive',
 '{"está na hora da revisão","faz tempo que não aparece","quando é a próxima revisão","última vez foi há","cliente antigo sumiu"}',
 null, 'A revisão é o negócio mais previsível que existe neste ramo: dá para saber o mês
em que o cliente vai precisar, e quase ninguém trabalha isso.
A conta é simples e vale mais que qualquer campanha: com a quilometragem da
última visita e a rodagem mensal dele, você sabe quando vence. Avise ANTES de
vencer, com a data e o motivo.
A mensagem que funciona não é "está na hora da revisão". É específica do carro
dele: "seu carro fez a última revisão em março com 42 mil. Pela sua rodagem,
deve estar chegando nos 52 mil agora — quer que eu reserve uma manhã?"
Isso mostra que existe um registro, e registro é a coisa que o cliente mais
associa a oficina séria.
Ofereça DIA E HORA, não "quando puder". Sem data marcada, ele adia.', '{"retention.intervalo_revisao"}',
 '{"availability.weekly_hours","retention.lembrete"}', '{}', 'escalate',
 'Recompra por quilometragem estimada, com dia e hora oferecidos', '{"Mandar mensagem genérica de campanha","Avisar depois de a revisão já ter vencido","Perguntar \"quando você pode\" em vez de oferecer horário"}', 'agendar_revisao',
 'skill_seed', 'active', 'cadencia_blount'),

(null, 'oficina', 'retention', 'proactive',
 '{"fez um serviço grande e não voltou","cliente antigo que parou de vir","sumiu depois do conserto","não voltou depois da última vez"}',
 null, 'Cliente que fez um serviço grande e não voltou é o mais caro de perder e o mais
barato de recuperar — e o silêncio dele quase nunca significa o que parece.
Na maior parte das vezes não é insatisfação: é que ninguém chamou. Mas às vezes
é, e você precisa saber. Uma pergunta resolve as duas hipóteses de uma vez:
"faz um tempo que o seu carro não aparece por aqui. Aquele serviço resolveu
mesmo? Ficou tudo certo depois?"
Se resolveu, você reabriu a porta e já pode oferecer a revisão. Se não resolveu,
você acabou de recuperar um cliente que ia sumir de vez — e conserto de garantia
custa muito menos do que cliente perdido.
Não comece pedindo agendamento. Comece perguntando pelo resultado.', '{}',
 '{"expertise_proof.garantia","retention.intervalo_revisao"}', '{}', 'omit',
 'Reativação pelo resultado do último serviço, não pela oferta', '{"Abrir a conversa com promoção","Presumir que o silêncio é insatisfação","Deixar passar a janela da garantia sem perguntar"}', 'reabrir_conversa',
 'skill_seed', 'active', 'cadencia_blount'),

-- --------------------------------------------------------------- ECOSYSTEM
(null, 'oficina', 'ecosystem', 'proactive',
 '{"vocês trabalham com seguradora","tem convênio","indicação de guincho","fazem funilaria também","quem faz retífica"}',
 null, 'A oficina não vive sozinha, e a rede em volta é fonte de cliente que quase
ninguém organiza: autopeças, guincho, funilaria, retífica, seguradora, lava-rápido
e locadora convivem com o mesmo carro.
Duas regras que fazem a rede render em vez de virar favor de mão única:
1. Indique bem, e indique nominalmente. Quem manda o cliente para um parceiro
   ruim paga o prejuízo da reputação junto.
2. Peça de volta, sem constrangimento e de forma específica: "quando aparecer
   carro com problema elétrico, pode me mandar que eu resolvo".
E o que mais rende: seja o ponto de referência do cliente para tudo o que envolve
o carro dele, mesmo o que você não faz. Quem resolve o problema de alguém —
inclusive indicando outro — vira a primeira ligação da próxima vez.', '{}',
 '{"ecosystem.parceiros","ecosystem.indicacao"}', '{}', 'omit',
 'Rede de indicação recíproca e nominal, com pedido específico', '{"Indicar parceiro que você não confia para agradar o cliente","Receber indicação e nunca retribuir","Dizer só \"não faço\" sem indicar quem faz"}', 'ativar_parceria',
 'skill_seed', 'active', 'relacionamento_carnegie');

-- Verificação (o valor esperado está escrito aqui, como manda a convenção):
-- 18 entradas, 12 categorias distintas, 1 de indecisão (indecisao_jolt).
select count(*) as entradas, count(distinct category) as categorias
  from public.knowledge_entries where skill_key = 'oficina' and tenant_id is null;
