-- =====================================================================
-- COS — MIGRATION 0042 : BIBLIOTECA DE CASA DE FESTAS E BUFFET
--
-- Segmento nascido de uma intuição do fundador, confirmada e ampliada por
-- pesquisa (ago/2026). A intuição: **festa infantil se repete todo ano, a
-- família costuma trocar de casa, e ninguém trabalha isso.**
--
-- A PESQUISA CONFIRMOU E ACRESCENTOU O QUE FALTAVA:
--   • A festa quase nunca cai no dia do aniversário — o costume é o
--     primeiro ou o segundo FIM DE SEMANA depois. Então o alerta não é
--     "aniversário em X": é "reservar o fim de semana próximo a X".
--   • Sábado e domingo esgotam com 30 a 60 dias de antecedência em festa
--     infantil. Chegar no mês da festa é chegar tarde — o alerta tem que
--     sair com MESES de antecedência.
--   • "Cliente recorrente é o melhor negócio" é consenso declarado do
--     setor, e mesmo assim a recompra anual não é trabalhada. É a brecha.
--
-- O QUE MAIS MUDA EM RELAÇÃO A TUDO QUE JÁ TEMOS:
--   A DATA É O ESTOQUE, e é o mais perecível do catálogo. Duas festas não
--   cabem no mesmo sábado. Isso cria a única URGÊNCIA HONESTA do COS: a
--   data existe ou não existe, e dá para provar na agenda. Em todos os
--   outros segmentos a regra é não inventar escassez; aqui a escassez é
--   real, verificável, e não usá-la é omissão.
--
--   E o SINAL não é política de no-show: é o que transfere a posse da
--   data. Segurar data na palavra perde duas vendas de uma vez.
--
-- O QUE ESTOURA O ORÇAMENTO NÃO É O PREÇO, É O QUE NÃO FOI DITO: taxa de
-- rolha, hora extra, convidado além do contratado, taxa de serviço. Três
-- entradas desta biblioteca existem só para isso.
--
-- REGRA DA TRAVA ANTI-INVENÇÃO aqui:
--   `escalate` para DATA, VALOR e REGRA DE CONTRATO — inventar
--   disponibilidade ou esconder extra é o que gera o conflito do dia.
--   `omit` para prova opcional (depoimento, alvará, parceiro).
--
-- Escrita COM ACENTO, como oficina e salão.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'casa_de_festa' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

-- ---------------------------------------------------------------- PRICING
(null, 'casa_de_festa', 'pricing', 'reactive',
 '{"quanto custa a festa","qual o valor do pacote","quanto fica para 80 pessoas","me passa os valores","quanto custa alugar o espaço"}',
 null, 'A primeira pergunta a fazer não é quantas pessoas: é O QUE ela quer contratar.
Pacote fechado (espaço, comida, bebida e equipe, cobrado por convidado) e aluguel
de espaço puro são dois negócios diferentes vendidos com o mesmo nome — e quem
não separa isso na primeira mensagem passa o orçamento inteiro sendo comparado
com uma coisa que não é a sua.
Pergunte: tipo de evento, número aproximado de convidados, data pretendida e se
ela quer tudo incluso ou só o espaço. Com isso o valor sai de verdade.
E dê o valor com o ESCOPO junto, sempre: "para 80 convidados no pacote completo
fica em X, e nesse valor entra isto, isto e isto". Número solto é o que perde
para o "mais barato" que não inclui nada.', '{"pricing.regime"}',
 '{"pricing.valor_por_convidado","pricing.valor_espaco","catalog.items","catalog.capacidade"}', '{}', 'escalate',
 'Separar pacote fechado de espaço puro ANTES de dar valor', '{"Dar valor sem saber se é pacote ou só espaço","Cotar por convidado sem dizer o mínimo cobrado","Mandar número solto, sem o que está incluso"}', 'qualificar_evento',
 'skill_seed', 'active', 'consultiva_spin'),

(null, 'casa_de_festa', 'pricing', 'reactive',
 '{"posso levar minha bebida","tem taxa de rolha","e se passar do horário","e se for mais gente","tem taxa de serviço"}',
 null, 'Estas quatro perguntas são as que estouram o orçamento do cliente — e o momento
de responder é ANTES, não na hora de fechar a conta.
Diga tudo de uma vez, com número, mesmo que ela tenha perguntado só uma:
"Pode trazer sua bebida sim, a rolha é de X por garrafa aberta. Hora extra fica
em Y. Convidado além do contratado é Z por pessoa, cobrado no acerto final."
Parece que assusta. Faz o contrário: cliente que ouviu tudo antes confia no
resto, e cliente que descobre no dia vira reclamação pública — e neste ramo a
reclamação circula no grupo das mães, no grupo da formatura, no Instagram.
Se a sua casa NÃO permite bebida de fora, diga com o motivo, sem rodeio. Regra
explicada é regra aceita.', '{"pricing.taxa_rolha","pricing.hora_extra","pricing.convidado_extra"}',
 '{"policies.fornecedor_externo"}', '{"Todo extra é dito antes: rolha, hora extra, convidado a mais e taxa de serviço"}', 'escalate',
 'Antecipar os quatro extras que estouram o orçamento, com número', '{"Deixar a taxa de rolha para o contrato","Responder só o que foi perguntado","Descobrir no dia que o cliente trouxe bebida e não sabia da regra"}', 'enviar_orcamento',
 'skill_seed', 'active', 'consultiva_spin'),

-- -------------------------------------------------------- RISK_FREE_ENTRY
(null, 'casa_de_festa', 'risk_free_entry', 'reactive',
 '{"posso conhecer o espaço","dá para visitar","quero ver o lugar","tem como passar aí","posso levar meu filho para ver"}',
 null, 'Diga sim rápido e ofereça horário na hora. Quem visita fecha muito mais, e o
motivo é simples: fotos não transmitem tamanho, cheiro, som e a sensação de
imaginar a festa acontecendo ali.
Nunca responda "pode passar quando quiser" — isso adia para sempre. Ofereça duas
opções concretas: "sábado às 11h você vê o espaço montado para uma festa, ou
terça às 15h, com calma e sem gente".
Sábado com festa montada é o melhor argumento que você tem, e é de graça.
Convide quem decide junto, e convide a criança se for infantil: criança que
gostou do espaço vira o melhor vendedor da casa dentro da própria família.
Na visita, mostre o que a foto não mostra — banheiro, área dos pais,
estacionamento, onde a mãe vai ficar. É onde a decisão realmente acontece.', '{}',
 '{"catalog.estrutura","availability.horarios","expertise_proof.alvara"}', '{}', 'omit',
 'Visita com dois horários oferecidos e o espaço montado como prova', '{"Responder \"pode passar quando quiser\"","Marcar visita sem quem decide junto","Mostrar só o salão e esquecer banheiro, estacionamento e área dos pais"}', 'agendar_visita',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- ----------------------------------------------------------- AVAILABILITY
(null, 'casa_de_festa', 'availability', 'reactive',
 '{"tem data disponível","o dia 15 está livre","tem sábado em novembro","consigo essa data","ainda dá para essa semana"}',
 null, 'Aqui está a única urgência HONESTA deste ramo, e não usá-la é omissão: a data
existe ou não existe, e dá para provar na agenda. Duas festas não cabem no mesmo
sábado.
Confira antes de responder — nunca afirme disponibilidade de memória.
Se está livre, diga com clareza o que a mantém livre: "está sim, e ela fica
disponível até alguém confirmar com o sinal. Não consigo segurar sem isso, e
prefiro te falar isso agora do que te ligar depois avisando que foi."
Se está ocupada, não pare no não. Ofereça o fim de semana vizinho, o outro
horário do mesmo dia, e a lista de espera. Em festa infantil quase toda família
aceita o sábado seguinte — é só perguntar.
E quando a data pedida é apertada, diga a verdade sobre o calendário: sábado à
tarde costuma fechar com meses de antecedência. Isso não é pressão, é
informação que ela precisa para decidir.', '{"availability.sinal","availability.horarios"}',
 '{"availability.antecedencia","availability.espera"}', '{"Não afirmar disponibilidade de data sem conferir a agenda"}', 'escalate',
 'Escassez REAL e verificável + alternativa de fim de semana vizinho', '{"Afirmar que a data está livre sem conferir","Dizer só \"está ocupada\" e encerrar","Segurar a data na palavra para não perder o cliente"}', 'oferecer_data',
 'skill_seed', 'active', 'fechamento_classico'),

-- --------------------------------------------------------- EXPERTISE_PROOF
(null, 'casa_de_festa', 'expertise_proof', 'reactive',
 '{"vocês são organizados","como sei que vai dar certo","já fizeram festa grande","tem segurança para as crianças","quantas festas vocês fazem"}',
 null, 'Confiar uma data única a alguém é diferente de comprar um produto: se der errado,
não tem segunda chance. O aniversário de sete anos acontece uma vez.
Por isso a prova aqui é operacional, não estética. Responda com número e com
documento: quantos eventos por mês, há quantos anos, alvará e AVCB em dia,
seguro, e — a mais forte de todas — uma família que fez festa aí e aceita
conversar por telefone.
Em festa infantil, segurança é o que a mãe está perguntando mesmo quando ela
pergunta outra coisa. Antecipe: quantos monitores por criança, se a área externa
é fechada, se tem enfermaria ou protocolo de acidente, se a brinquedoteca tem
supervisão.
Adjetivo aqui não vale nada. "Somos referência" é o que todo concorrente
escreve; "fazemos 18 festas por mês há 11 anos, e você pode ligar para a Paula,
que fez a do filho dela mês passado" é outra conversa.', '{"expertise_proof.tempo_de_casa"}',
 '{"expertise_proof.eventos_por_mes","expertise_proof.depoimentos","expertise_proof.alvara","catalog.estrutura"}', '{}', 'omit',
 'Prova operacional com número, documento e cliente que atende o telefone', '{"Responder com adjetivo","Não antecipar a pergunta de segurança em festa infantil","Citar alvará ou seguro que não existe"}', 'agendar_visita',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- ----------------------------------------------------------------- CATALOG
(null, 'casa_de_festa', 'catalog', 'reactive',
 '{"o que está incluso","cabe quantas pessoas","tem brinquedoteca","tem estacionamento","o espaço é climatizado","posso levar decoradora"}',
 null, 'Pergunta de estrutura é pergunta de imaginação: a pessoa está montando a festa na
cabeça e testando se cabe ali.
Responda o que foi perguntado e acrescente o que ela ainda não sabe que importa —
capacidade mínima e máxima, o que o espaço tem, e o que ela precisa trazer.
Sobre fornecedor de fora, seja explícito antes que vire problema: se decoradora,
fotógrafo ou buffet externo podem entrar, se tem taxa, se precisa credenciamento
e qual o horário de montagem. Quase toda briga de véspera nasce aí.
E diga a capacidade com honestidade nos dois extremos. Festa de 30 pessoas num
salão de 150 fica triste; 150 num espaço de 100 fica sufocante. Recomendar o
tamanho certo — inclusive dizendo que a sua casa é grande demais para o caso
dela — é o que faz a família voltar no ano seguinte.', '{"catalog.items","catalog.capacidade"}',
 '{"catalog.estrutura","policies.fornecedor_externo","catalog.nao_faz"}', '{}', 'escalate',
 'Responder a estrutura e antecipar a regra de fornecedor externo', '{"Deixar a regra de fornecedor de fora para o contrato","Aceitar festa pequena demais para o espaço sem avisar","Prometer estrutura que a casa não tem"}', 'enviar_orcamento',
 'skill_seed', 'active', 'consultiva_spin'),

-- ----------------------------------------------------------- GOAL_MATCHING
(null, 'casa_de_festa', 'goal_matching', 'reactive',
 '{"é para o meu filho","vai ser a formatura","é o casamento","confraternização da empresa","festa de 15 anos","chá revelação"}',
 null, 'Cada evento tem um medo diferente, e vender todos do mesmo jeito é o erro mais
comum da casa de festas.
INFANTIL: quem decide é a mãe ou o pai, e o medo é a criança não se divertir e a
festa dar trabalho. Fale de monitor, de segurança e do que ELES não vão precisar
fazer no dia.
FORMATURA: a decisão é de comissão, o dinheiro é rateado e o processo demora.
Descubra quem assina e dê material para a pessoa defender internamente.
CASAMENTO: ticket alto, decisão de casal, e o medo é arrependimento — não existe
refazer. Aqui pressão destrói; o que funciona é reduzir risco e mostrar caso
parecido.
EMPRESA: quem contrata não é quem usa. O critério é logística, nota fiscal e
prazo, não emoção.
Descobrir o tipo muda a conversa inteira, e é a primeira pergunta a fazer — antes
de convidados, antes de data, antes de preço.', '{}',
 '{"catalog.items","expertise_proof.depoimentos"}', '{}', 'omit',
 'Adaptar ao tipo de evento: cada um tem decisor e medo diferentes', '{"Vender casamento com argumento de festa infantil","Tratar comissão de formatura como decisor único","Ignorar que na festa infantil quem paga não é quem usa"}', 'qualificar_evento',
 'skill_seed', 'active', 'consultiva_spin'),

-- -------------------------------------------------------------- OBJECTIONS
(null, 'casa_de_festa', 'objections', 'reactive',
 '{"achei mais barato em outro","tá caro","o outro espaço cobra menos","recebi orçamento menor","é muito dinheiro"}',
 null, 'Antes de mexer no preço, descubra o que está sendo comparado — e neste ramo quase
nunca é a mesma coisa.
A diferença mora em quatro lugares, e é só perguntar: o valor inclui bebida?
Inclui equipe e serviço? Quantas horas? E o que acontece se passar do horário ou
vier mais gente?
"Consegue ver se no outro está incluso o serviço e quantas horas são? É onde
costuma estar a diferença." Você não está atacando ninguém — está dando a régua
para comparar duas coisas diferentes.
Muitas vezes o orçamento mais barato é espaço puro, e o cliente vai descobrir
depois que precisa contratar buffet, equipe, louça e limpeza por fora. Mostre a
conta fechada dos dois caminhos, sem falar mal de ninguém, e deixe ele concluir.
E se realmente for o mesmo escopo por menos, diga a verdade: você não vai cobrir,
e o motivo é o que você entrega junto.', '{}',
 '{"pricing.regime","pricing.valor_por_convidado","pricing.taxa_rolha","pricing.hora_extra"}', '{"Não comparar preço sem separar pacote fechado de espaço puro"}', 'omit',
 'Comparar a conta FECHADA dos dois regimes, nunca o número solto', '{"Dar desconto na primeira pressão","Falar mal do outro espaço","Comparar seu pacote completo com o aluguel puro do concorrente"}', 'isolar_objecao',
 'skill_seed', 'active', 'negociacao_voss'),

(null, 'casa_de_festa', 'objections', 'reactive',
 '{"vou pesquisar outros espaços","quero ver mais opções","vou visitar outros lugares","estou orçando em vários"}',
 null, 'Pesquisar é o comportamento normal de quem vai gastar alto numa data única —
reagir mal confirma o medo que motivou a pesquisa.
Apoie e ajude a comparar: "faz muito sentido conhecer outros. Leva esta lista do
que perguntar em cada um: o que está incluso, quantas horas, taxa de rolha, hora
extra e o que acontece se vier mais gente." Você acabou de dar o critério — e o
critério é o seu.
Depois faça a única coisa que protege a venda aqui: fale da DATA. "Só uma coisa
prática: o sábado que você quer ainda está livre, e eu não consigo segurar sem
sinal. Se você estiver em dúvida entre espaços, vale decidir antes de a agenda
fechar."
Isso não é pressão inventada — é a agenda, e ela é verificável.
E marque o retorno com dia. Sem data combinada, essa conversa termina aqui.', '{"availability.sinal"}',
 '{"availability.antecedencia"}', '{}', 'escalate',
 'Dar a régua de comparação e trazer a data real como o único relógio', '{"Demonstrar irritação com a pesquisa","Inventar que a data está quase fechando","Deixar sair sem data de retorno"}', 'marcar_retorno',
 'skill_seed', 'active', 'negociacao_voss'),

-- -------------------------------------------------------- COMMITMENT_OFFER
(null, 'casa_de_festa', 'commitment_offer', 'reactive',
 -- "dá para segurar a data" SAIU daqui: é da entrada de limits_and_ethics,
 -- que trata do pedido de reserva sem sinal. Duas entradas donas da mesma
 -- frase é empate por construção, e nenhum ranking desempata — a lição já
 -- custou academia e clínica, e eu quase repeti no segmento novo.
 '{"como faço para reservar","quanto é o sinal","quero fechar a data","posso confirmar depois","como funciona o contrato","onde assino"}',
 null, 'Este é o momento decisivo e ele é simples: a data só sai do mercado com sinal.
Explique sem constrangimento, e explique pelo lado DELA: "o sinal é de X e é o
que reserva a data no seu nome. Enquanto ele não entra, eu preciso continuar
oferecendo esse sábado para quem perguntar — e eu não quero te ligar depois
avisando que foi."
Repare que a frase não pressiona: ela é honesta sobre como o negócio funciona, e
protege o cliente de um risco que ele não sabia que estava correndo.
Diga junto as regras que ele vai querer saber antes de pagar: o que acontece se
precisar cancelar, se dá para trocar a data, e até quando paga o restante.
Regra clara antes do sinal fecha mais do que desconto.
E facilite o pagamento na hora — PIX na conversa, contrato por assinatura
digital. Cada dia entre o "quero" e o "paguei" é um dia de risco.', '{"availability.sinal","policies.cancelamento"}',
 '{"pricing.parcelamento","policies.remarcacao"}', '{"Nunca segurar data sem sinal"}', 'escalate',
 'O sinal explicado pelo risco DELA, com as regras ditas antes do pagamento', '{"Segurar a data na palavra","Deixar as regras de cancelamento para o contrato","Deixar dias entre o \"quero\" e o pagamento"}', 'reservar_data',
 'skill_seed', 'active', 'fechamento_classico'),

-- A ENTRADA DE INDECISÃO. Aqui ela tem uma característica que nenhum outro
-- segmento tem: a hesitação custa a DATA, e o vendedor sabe disso. É onde
-- a tentação de apertar é máxima — e apertar é o que perde.
(null, 'casa_de_festa', 'commitment_offer', 'reactive',
 '{"vou pensar","preciso conversar em casa","depois eu confirmo","deixa eu ver com meu marido","vou decidir e te falo","preciso ver o orçamento geral"}',
 null, 'ATENÇÃO: quem visitou, gostou e mesmo assim não fechou raramente está em dúvida
sobre o seu espaço. Está com medo de errar numa decisão cara que não se refaz —
ou está com o orçamento da festa inteira aberto na cabeça, e a sua parte é só
uma delas.
A tentação aqui é apertar, porque a data corre de verdade. Não aperte. Repetir o
argumento quando a pessoa já concordou aumenta a chance de perder.
Faça isto, nesta ordem:
1. Pergunte o que trava, sem cobrar decisão: "o que ainda está te deixando em
   dúvida — é o valor, a data, ou tem outra coisa?"
2. RECOMENDE um caminho em vez de abrir opções: "no seu caso eu faria o pacote
   intermediário e deixaria a decoração por sua conta — fica mais em conta e o
   resultado é o mesmo."
3. DIMINUA a decisão: existe sinal menor para reservar? Data de meio de semana?
   Horário mais barato? Reservar agora e fechar o cardápio depois?
Só DEPOIS disso, e uma vez só, diga a situação real da data — sem drama, como
informação. A escassez aqui é verdadeira, e por isso ela não precisa de tom.', '{}',
 '{"availability.sinal","pricing.parcelamento","availability.horarios"}', '{}', 'omit',
 'Reduzir o risco antes de falar da data — e falar da data uma vez só, sem drama', '{"Repetir o quanto o espaço é bonito","Usar a data como pressão logo na primeira mensagem","Dar desconto para acelerar uma decisão que não é sobre preço"}', 'reduzir_risco',
 'skill_seed', 'active', 'indecisao_jolt'),

-- ------------------------------------------------------------- RECIPROCITY
(null, 'casa_de_festa', 'reciprocity', 'proactive',
 '{"nunca organizei festa","não sei por onde começar","é a primeira festa","quantas pessoas devo chamar","o que preciso contratar"}',
 null, 'Quem está organizando a primeira festa está perdida, e a casa que ORGANIZA em vez
de vender ganha a conversa inteira.
Entregue o mapa de graça: a ordem das decisões (data e espaço primeiro, porque é
o que esgota; depois convidados, cardápio, decoração e lembrança), o que costuma
ser esquecido (bolo, som, quem recebe os convidados) e a régua de quantos
convidados cabem no orçamento que ela tem.
Isso custa cinco minutos e vale mais que qualquer desconto, porque resolve o
problema real dela — que não é preço, é não saber o que fazer.
E ofereça os parceiros que você confia, sem cobrar por indicar. Quem vira o ponto
de referência da festa inteira dificilmente perde a parte que é dele.
Regra dura: não emende a venda na mesma frase do conselho. Ajude, e depois
convide para conhecer o espaço.', '{}',
 '{"ecosystem.parceiros","catalog.capacidade","availability.antecedencia"}', '{}', 'omit',
 'Organizar a festa antes de vender a festa (reciprocidade que custa competência)', '{"Emendar a venda na mesma frase do conselho","Indicar parceiro ruim para agradar","Responder quem está perdida com tabela de preços"}', 'agendar_visita',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- -------------------------------------------------------- LIMITS_AND_ETHICS
(null, 'casa_de_festa', 'limits_and_ethics', 'reactive',
 '{"vocês seguram a data para mim","dá para reservar sem pagar","confia em mim","só me garante que ninguém pega","depois eu passo o sinal"}',
 null, 'Este é o pedido mais simpático e mais caro do ramo, e dizer sim é o erro que
custa duas vendas: a que não pagou e a que você recusou enquanto esperava.
Recuse com clareza e com afeto, explicando pelo lado dela:
"Eu queria muito poder, mas se eu segurar sem sinal e aparecer alguém que
confirma, eu vou ter que escolher — e nenhum dos dois lados sai bem disso. Com o
sinal a data é sua e ninguém mais pergunta por ela."
Ofereça o que dá para oferecer de verdade: um prazo curto e declarado (24 ou 48
horas) para ela decidir, com o compromisso de avisar SE alguém perguntar pela
mesma data nesse intervalo. Isso é honesto, é operável e resolve a maior parte
dos casos.
E se você avisar que apareceu outro interessado, que seja verdade. Inventar
concorrente para acelerar é a mentira mais fácil de contar aqui — e a que mais
destrói quando a família descobre depois, conversando com outra mãe.', '{"availability.sinal"}',
 '{"policies.cancelamento"}', '{"Nunca segurar data sem sinal","Nunca inventar outro interessado para acelerar a decisão"}', 'escalate',
 'Recusar com afeto e oferecer prazo declarado em vez de reserva informal', '{"Segurar a data por simpatia","Inventar que apareceu outro interessado","Recusar de forma seca, sem oferecer alternativa"}', 'reservar_data',
 'skill_seed', 'active', 'relacionamento_carnegie'),

(null, 'casa_de_festa', 'limits_and_ethics', 'reactive',
 '{"preciso cancelar","vou ter que desmarcar","dá para mudar a data","aconteceu um imprevisto","perco o sinal"}',
 null, 'Cancelamento em casa de festas dói dos dois lados: a família está passando por
algo, e você tem uma data que talvez não revenda.
Comece pelo lado humano, sempre. Pergunte o que aconteceu antes de falar de
regra. A maior parte dos casos não é cancelamento — é REMARCAÇÃO disfarçada, e
ela se resolve oferecendo outra data com o mesmo sinal.
Ofereça a troca antes de aplicar a penalidade: "consegue outra data? Se der, eu
transfiro o sinal e a gente resolve sem prejuízo para você."
Se for cancelamento mesmo, aplique a regra que estava escrita — sem improvisar
para mais nem para menos. Regra que muda conforme o humor vira desconfiança na
próxima família que perguntar.
E registre o motivo. Família que cancelou por imprevisto e foi bem tratada volta
no ano seguinte; família que foi tratada como caloteira conta a história para
todo mundo.', '{"policies.cancelamento"}',
 '{"policies.remarcacao","availability.espera"}', '{}', 'escalate',
 'Oferecer remarcação antes da penalidade + aplicar a regra escrita sem improviso', '{"Começar pela regra em vez de perguntar o que houve","Improvisar a penalidade para mais ou para menos","Não registrar o motivo e perder a família do ano que vem"}', 'remarcar_data',
 'skill_seed', 'active', 'relacionamento_carnegie'),

-- --------------------------------------------------------------- RETENTION
-- A ENTRADA QUE JUSTIFICA ESTE SEGMENTO EXISTIR. Foi a intuição do
-- fundador, e a pesquisa confirmou que ninguém trabalha isso.
(null, 'casa_de_festa', 'retention', 'proactive',
 '{"fez festa aqui ano passado","aniversário do ano que vem","cliente antigo","a família já fez festa aqui","vai fazer de novo"}',
 null, 'Aniversário se repete todo ano, a data é previsível com um ano de antecedência, e
a maior parte das casas de festa espera a família ligar. Ela liga — para outro
lugar, porque foi quem chamou primeiro.
Duas coisas fazem essa recompra funcionar, e as duas são contraintuitivas:
1. O ALERTA NÃO É NO ANIVERSÁRIO. A festa quase nunca acontece no dia: o costume
   é o primeiro ou o segundo fim de semana depois. Ofereça o FIM DE SEMANA
   próximo, não o dia.
2. O ALERTA É COM MESES DE ANTECEDÊNCIA. Sábado bom fecha com meses. Chegar no
   mês da festa é chegar tarde — e é exatamente quando todo mundo chega.
A mensagem que funciona é específica e sem cara de campanha:
"Oi, Renata! O aniversário do Théo está chegando — ano passado a festa dele aqui
foi no dia 12. Estou abrindo a agenda de outubro e os dois primeiros sábados
depois do aniversário ainda estão livres. Quer que eu segure um para você
decidir com calma?"
Isso mostra registro, oferece data específica e chega antes de todo mundo. É a
venda mais barata que esta casa tem, e a que quase ninguém faz.', '{"retention.antecedencia_contato"}',
 '{"retention.condicao_retorno","availability.horarios"}', '{}', 'escalate',
 'Recompra anual pelo fim de semana próximo ao aniversário, com meses de antecedência', '{"Esperar a família ligar","Avisar no mês da festa, quando a agenda já fechou","Oferecer o dia do aniversário em vez do fim de semana próximo","Mandar mensagem genérica de campanha"}', 'oferecer_data',
 'skill_seed', 'active', 'cadencia_blount'),

(null, 'casa_de_festa', 'retention', 'proactive',
 '{"depois da festa","como foi o evento","pedir depoimento","agradecer o cliente","pós evento"}',
 null, 'O dia seguinte à festa é o pico de satisfação do ciclo inteiro, e é a única janela
em que você consegue três coisas de uma vez — e quase toda casa deixa passar.
Mande uma mensagem curta, sem venda nenhuma: agradeça, mande uma foto boa que a
sua equipe fez, e pergunte se ficou tudo como ela imaginou.
Aí, e só aí, peça as duas coisas que valem dinheiro: o depoimento (que você vai
usar com a próxima família) e a indicação — e peça de forma específica, porque
pedido vago não gera nada: "conhece alguém que vai fazer festa nos próximos
meses?"
E registre a data do aniversário na hora, enquanto a informação está fresca. É
ela que vai disparar o contato do ano que vem.
Lembre de uma coisa que só existe aqui: os CONVIDADOS da festa são o seu público.
Cada festa é uma demonstração para 40 famílias ao mesmo tempo — e é por isso que
a lembrança com o seu contato vale mais que anúncio.', '{}',
 '{"ecosystem.indicacao","expertise_proof.depoimentos","retention.condicao_retorno"}', '{}', 'omit',
 'Colher depoimento, indicação e a data do aniversário no pico da satisfação', '{"Deixar passar o dia seguinte","Pedir indicação de forma vaga","Não registrar a data do aniversário e perder o gatilho do ano que vem"}', 'registrar_aniversario',
 'skill_seed', 'active', 'cadencia_blount'),

-- --------------------------------------------------------------- ECOSYSTEM
(null, 'casa_de_festa', 'ecosystem', 'reactive',
 '{"vocês indicam decoradora","tem fotógrafo","quem faz o bolo","preciso de animação","tem cerimonial","indica algum fornecedor"}',
 null, 'A família não quer contratar seis fornecedores: ela quer que a festa aconteça. A
casa que resolve isso vira o centro da decisão — e vende mais sem baixar preço.
Indique nominalmente, com quem você confia de verdade, e diga por quê. Indicação
ruim volta contra você, porque para a família o problema aconteceu na SUA festa.
Duas regras que mantêm a rede saudável:
1. Indique quem entrega, não quem paga comissão. Se houver comissão, que ela
   nunca decida a indicação.
2. Peça de volta de forma específica: decoradora e fotógrafo atendem famílias que
   ainda não escolheram o espaço — é a melhor fonte de cliente que existe aqui.
E não esqueça do público que já está dentro de casa: os convidados. Cada festa
mostra o seu espaço para dezenas de famílias com filhos da mesma idade. Um
cartão na lembrancinha, o Instagram marcado na foto, e o atendimento visível no
dia valem mais que qualquer anúncio pago.', '{}',
 '{"ecosystem.parceiros","ecosystem.indicacao"}', '{}', 'omit',
 'Rede nominal e recíproca + tratar os convidados como o público da próxima venda', '{"Indicar por comissão em vez de por entrega","Receber indicação e nunca retribuir","Esquecer que os convidados são o público da festa seguinte"}', 'ativar_parceria',
 'skill_seed', 'active', 'relacionamento_carnegie');

-- Verificação (valor esperado escrito, como manda a convenção):
-- 17 entradas, 12 categorias distintas, 1 de indecisão (indecisao_jolt).
select count(*) as entradas, count(distinct category) as categorias
  from public.knowledge_entries where skill_key = 'casa_de_festa' and tenant_id is null;
