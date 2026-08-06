-- =====================================================================
-- COS — MIGRATION 0043 : BIBLIOTECA DE PET (banho, tosa, creche e hotel)
--
-- A dica veio do fundador: "hoje temos pets com creche e hotel". É
-- exatamente isso que separa este segmento de barbearia com cachorro.
--
-- O QUE CRECHE E HOTEL TRAZEM, E NENHUMA DAS 12 SKILLS ANTERIORES TEM:
--
--   • HOSPEDAGEM SE VENDE POR PERÍODO, não por horário — entrada, saída,
--     diárias e um número finito de vagas. Em feriado e férias esgota com
--     antecedência, como a data da casa de festas.
--   • CRECHE SE VENDE POR PLANO MENSAL com frequência declarada. É receita
--     recorrente contratada, e a evasão se parece com a da academia.
--   • EXISTE PORTA DE ENTRADA OBRIGATÓRIA QUE NÃO É COMERCIAL: a avaliação
--     comportamental. Cão que não se adapta ao grupo não entra. Aceitar sem
--     avaliar é como fazer química sem ver o histórico do fio — só que o
--     dano acontece com o animal de OUTRO cliente junto.
--   • QUEM DECIDE NÃO É QUEM USA, e a emoção é o produto. O tutor deixa um
--     membro da família com desconhecidos. O relatório do dia não é mimo:
--     é a entrega do serviço.
--
-- LIMITE DESTE SEGMENTO, escrito de propósito: veterinário NÃO entra aqui.
-- Consulta, exame, vacina e cirurgia são `clinica`, que já existe. A
-- biblioteca inteira respeita isso, e uma das entradas trata justamente de
-- quando encaminhar em vez de opinar.
--
-- CONTEXTO: 3º maior mercado pet do mundo, +240 milhões de animais. E o
-- alerta que vale registrar: cerca de 29% das empresas do setor fecham em
-- até dois anos, quase sempre por gestão — não por falta de cliente.
--
-- REGRA DA TRAVA ANTI-INVENÇÃO aqui:
--   `escalate` para PREÇO, VAGA e REGRA SANITÁRIA — inventar ali gera
--   conflito na retirada ou risco real ao animal.
--   `omit` para prova opcional (câmera, formação da equipe, parceria).
--
-- Escrita COM ACENTO, como oficina, salão e casa de festas.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'pet' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

-- ---------------------------------------------------------------- PRICING
(null, 'pet', 'pricing', 'reactive',
 '{"quanto custa o banho","qual o valor da tosa","quanto fica o banho e tosa","me passa a tabela","quanto custa para o meu cachorro"}',
 null, 'Banho não tem preço único, tem RÉGUA — e a régua é porte e pelagem. Dar um número
sem saber isso é o que gera a discussão na hora de retirar o animal.
Responda com a régua, que é verdade e já orienta, e peça os dois dados que fecham:
"Depende do porte e do tipo de pelo. Mini fica em X, pequeno Y, médio Z, grande a
partir de W — pelo longo tem acréscimo porque leva mais tempo de secagem. Qual a
raça e o tamanho dele?"
Pergunte o nome do animal já nesta primeira mensagem e use daí em diante. Parece
detalhe e não é: para o tutor, o nome é o que separa quem vê um cliente de quem
vê o cachorro dele.
E se o pelo estiver embaraçado ou for a primeira tosa, avise que o valor pode
mudar depois de ver — antes, nunca depois.', '{"pricing.banho_por_porte"}',
 '{"catalog.items","pricing.parcelamento","availability.prazo_banho"}', '{}', 'escalate',
 'Régua por porte e pelagem + perguntar o nome do animal na primeira mensagem', '{"Dar preço único sem saber porte e pelagem","Descobrir o nó no pelo só na hora e cobrar a mais sem avisar","Chamar o animal de \"ele\" a conversa inteira"}', 'agendar_banho',
 'skill_seed', 'active', 'consultiva_spin'),

(null, 'pet', 'pricing', 'reactive',
 '{"quanto custa a creche","qual o valor do plano","quanto é a diária do hotel","tem pacote mensal","quanto custa deixar ele o dia todo"}',
 null, 'Creche e hotel se vendem diferente de banho, e confundir os dois na resposta perde
a venda maior.
CRECHE é plano mensal por frequência: quanto mais dias na semana, menor o valor
do dia. Apresente sempre a conta por dia, porque é ela que mostra o valor real:
"no plano de 3x fica R$ X por mês, que dá R$ Y por dia — e ele já tem a vaga
garantida no mesmo dia toda semana."
HOTEL é diária, com entrada e saída, e a pergunta que ninguém responde antes é se
a diária conta por pernoite ou por 24 horas. Diga isso sem ser perguntado.
E avise da alta temporada ANTES: feriado e férias costumam ter acréscimo e
esgotam com antecedência. Tutor que descobre o acréscimo no fim do ano se sente
pego; tutor que soube em julho reserva em julho.
Pergunte a ROTINA dele antes de recomendar frequência. Quem trabalha fora todo
dia e tem cão jovem precisa de outra coisa de quem viaja três vezes por ano.', '{"pricing.plano_creche"}',
 '{"pricing.diaria_hotel","pricing.alta_temporada","catalog.capacidade"}', '{}', 'escalate',
 'Plano por frequência com o valor do DIA + alta temporada avisada antes', '{"Responder creche e hotel como se fossem o mesmo serviço","Não dizer se a diária é por pernoite ou por 24h","Deixar o acréscimo de alta temporada para dezembro"}', 'agendar_avaliacao',
 'skill_seed', 'active', 'consultiva_spin'),

-- -------------------------------------------------------- RISK_FREE_ENTRY
(null, 'pet', 'risk_free_entry', 'reactive',
 '{"nunca deixei ele em lugar nenhum","tenho medo de deixar","ele nunca ficou sem mim","primeira vez","como sei se ele vai se dar bem"}',
 null, 'O tutor não está comparando preço: está com medo. Deixar um animal com
desconhecidos é decisão emocional, e responder isso com tabela é perder a conversa.
Ofereça o DIA DE AVALIAÇÃO, que é o passo pequeno e reversível: ele passa algumas
horas, vocês observam como ele se comporta no grupo, e no fim você conta como foi.
"Traz ele numa manhã para conhecer. Ele fica algumas horas, eu te mando foto no
meio do dia e no fim eu te digo com sinceridade se este é o lugar dele. Se não
for, eu te falo — e não tem custo nenhum nisso."
Repare no que essa frase entrega: o tutor não precisa decidir nada hoje, e você
se comprometeu a dizer a verdade inclusive quando a verdade custa a venda.
Depois do dia, o que fecha a venda não é argumento: é a FOTO. Mandar o registro
dele brincando vale mais que qualquer folder — e é a entrega real do serviço.', '{"risk_free_entry.avaliacao_obrigatoria","risk_free_entry.como_funciona"}',
 '{"expertise_proof.monitoramento","risk_free_entry.primeira_vez"}', '{}', 'escalate',
 'Dia de avaliação como passo reversível + a foto como fechamento', '{"Responder medo com preço","Prometer que ele vai se adaptar antes de ver","Não mandar notícia durante o dia de teste"}', 'agendar_avaliacao',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- ----------------------------------------------------------- AVAILABILITY
(null, 'pet', 'availability', 'reactive',
 '{"tem vaga para o feriado","consigo hotel no fim de ano","tem vaga na creche","dá para deixar amanhã","tem horário hoje"}',
 null, 'Vaga é estoque físico aqui, e no hotel ela é escassa de verdade — feriado e férias
esgotam com antecedência. Essa é uma escassez honesta, verificável, e não avisar
é omissão.
Confira antes de responder; nunca afirme vaga de memória.
Se tem, ofereça e diga o que a garante: "tenho vaga sim para esse período. A
reserva fica confirmada com o sinal — enquanto isso eu preciso continuar
oferecendo para quem perguntar."
Se não tem, não pare no não: ofereça o período vizinho, a lista de espera e, se
fizer sentido, a alternativa de day care no lugar da hospedagem.
E use o calendário a favor do tutor, sem drama: "fim de ano aqui costuma fechar
em outubro — se você já sabe as datas, vale garantir agora". Isso não é pressão,
é a informação que ele precisa para não ficar sem lugar.', '{"availability.antecedencia_hotel"}',
 '{"catalog.capacidade","availability.weekly_hours","policies.cancelamento"}', '{"Não prometer vaga sem conferir a ocupação do dia"}', 'escalate',
 'Escassez real de vaga + alternativa de período e de serviço', '{"Afirmar que tem vaga sem conferir","Dizer só \"está lotado\" e encerrar","Deixar para avisar da alta temporada em cima da hora"}', 'reservar_vaga',
 'skill_seed', 'active', 'fechamento_classico'),

-- --------------------------------------------------------- EXPERTISE_PROOF
(null, 'pet', 'expertise_proof', 'reactive',
 '{"quem cuida deles","tem câmera","quantas pessoas trabalham","como vocês separam os cachorros","tem veterinário"}',
 null, 'Estas perguntas são todas a mesma pergunta com roupas diferentes: *"posso confiar
o meu cachorro a vocês?"*. Responder com adjetivo não serve.
Responda com número e com estrutura: quantos animais por cuidador, como a
separação é feita (porte, temperamento, energia), se tem câmera e como o tutor
acessa, e qual veterinário vocês acionam se algo acontecer.
Antecipe a pergunta que ele tem medo de fazer, porque ela está lá: "se acontecer
alguma coisa, a gente leva no vet X, te aviso na hora e você decide". Dizer isso
antes de ser perguntado é a maior prova de que vocês pensaram no assunto.
E a prova mais forte de todas não custa nada: um tutor que deixa o cão aí e
aceita conversar. Vale mais que qualquer depoimento escrito.
Se vocês não têm câmera, diga que não têm e diga o que fazem no lugar — relatório
com foto vale mais que câmera que ninguém assiste.', '{"expertise_proof.tempo_de_casa"}',
 '{"expertise_proof.equipe","expertise_proof.monitoramento","expertise_proof.parceria_vet","policies.emergencia"}', '{}', 'omit',
 'Prova por número e estrutura + antecipar a pergunta da emergência', '{"Responder com \"cuidamos com muito amor\"","Esperar ele perguntar o que acontece numa emergência","Prometer câmera ou veterinário parceiro que não existe"}', 'agendar_avaliacao',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- ----------------------------------------------------------------- CATALOG
(null, 'pet', 'catalog', 'reactive',
 '{"vocês atendem gato","fazem tosa higiênica","tem leva e traz","fazem adestramento","atendem cachorro grande","tem taxi dog"}',
 null, 'Pergunta de catálogo é oportunidade de agenda, não de informação — e a resposta
mais valiosa aqui costuma ser sobre o que vocês NÃO fazem.
Confirme o que faz, diga o limite sem rodeio, e emende com a combinação natural:
quem traz para o banho pode deixar na creche no mesmo dia; quem vai viajar pode
deixar o banho para o dia da retirada, e o animal volta cheiroso para casa.
"Fazemos sim. E se ele já vai estar aqui, dá para deixar o banho para o dia em
que você buscar — ele volta pronto e você economiza uma vinda."
Sobre limites, seja direto: se não atendem gato, se não pegam cão acima de certo
porte, se não fazem tosa de determinada raça. Aceitar o que a casa não domina é
como se ganha um animal machucado e uma reclamação.
E se não fazem, indique quem faz bem. O tutor lembra de quem resolveu.', '{"catalog.items"}',
 '{"catalog.nao_faz","catalog.estrutura","ecosystem.parceiros"}', '{}', 'escalate',
 'Confirmar, declarar o limite e combinar serviço na mesma vinda', '{"Aceitar serviço que a casa não domina","Responder só \"fazemos\" e encerrar","Não oferecer a combinação que economiza uma ida do tutor"}', 'agendar_banho',
 'skill_seed', 'active', 'consultiva_spin'),

-- ----------------------------------------------------------- GOAL_MATCHING
(null, 'pet', 'goal_matching', 'reactive',
 '{"ele fica sozinho o dia todo","ele destrói tudo em casa","vou viajar","ele é muito agitado","ele não socializa","preciso de alguém para ficar com ele"}',
 null, 'O tutor descreve um PROBLEMA e o vendedor mediano responde com um SERVIÇO. Aqui
vale a pergunta de impacto, igual em qualquer venda séria.
"Ele fica sozinho o dia todo" não é pedido de creche ainda — é uma queixa. Antes
de oferecer, pergunte o que acontece por causa disso: destrói alguma coisa? Late
e o vizinho reclama? Fica agitado quando você chega? Está engordando?
Quando o tutor responde isso, ele mesmo dimensiona o tamanho do problema — e a
frequência que ele vai contratar sai da conta dele, não da sua sugestão.
Aí recomende UM caminho, com motivo: "pelo que você conta, eu começaria com 2x
por semana. Não é para resolver tudo de uma vez — é para ele gastar energia no
meio da semana, que é quando você percebe a diferença em casa."
Recomendação com critério fecha; cardápio de planos faz o tutor pensar.', '{}',
 '{"pricing.plano_creche","catalog.items","risk_free_entry.como_funciona"}', '{}', 'omit',
 'Pergunta de impacto antes de oferecer + recomendar UMA frequência com motivo', '{"Oferecer o plano de 5x para quem descreveu um problema pequeno","Listar todos os planos e deixar o tutor escolher sozinho","Responder a queixa com tabela de preço"}', 'agendar_avaliacao',
 'skill_seed', 'active', 'consultiva_spin'),

-- -------------------------------------------------------------- OBJECTIONS
(null, 'pet', 'objections', 'reactive',
 '{"tá caro","achei caro","no outro é mais barato","dá para fazer por menos","é muito por um banho"}',
 null, 'Antes de mexer no preço, descubra caro comparado a quê — e aqui a comparação
quase nunca é do mesmo serviço.
A diferença mora em três lugares: o TEMPO que o animal passa (secador na gaiola
por duas horas contra secagem na mão), quem manuseia (pessoa treinada contra
rotatividade), e o que está incluso (hidratação, tosa higiênica, corte de unha,
limpeza de ouvido).
Pergunte com curiosidade legítima: "consegue ver se lá a secagem é na mão? E se o
corte de unha está incluso?" Você não está atacando ninguém — está dando a régua.
Nunca fale mal do concorrente. Quem faz isso está falando mal da escolha do
tutor, e ele ouve exatamente assim.
E se o orçamento apertou de verdade, ofereça o que cabe: espaçar o banho um pouco
mais, ou o plano de frequência menor. Tutor que fez menos volta; tutor
pressionado troca de lugar.', '{}',
 '{"pricing.banho_por_porte","catalog.items","expertise_proof.equipe"}', '{}', 'omit',
 'Descobrir "caro comparado a quê" — tempo, manuseio e o que está incluso', '{"Dar desconto na primeira pressão","Falar mal do pet shop concorrente","Comparar preço sem abrir o que está incluído"}', 'isolar_objecao',
 'skill_seed', 'active', 'negociacao_voss'),

(null, 'pet', 'objections', 'reactive',
 '{"eu mesmo dou banho nele","faço em casa","meu vizinho olha para mim","deixo com a minha mãe","não preciso pagar por isso"}',
 null, 'Não discuta com a decisão dele — e boa parte dos tutores que dão banho em casa
estão certos: cachorro pequeno de pelo curto, banho em casa resolve.
Reconheça isso primeiro, porque é verdade e porque desarma: "em cão pequeno de
pelo curto funciona bem mesmo."
Depois marque o limite onde ele realmente existe, como informação e não como
ameaça: secagem incompleta em pelo grosso causa problema de pele; tosa de máquina
sem prática machuca; corte de unha errado sangra e o animal passa a ter medo para
sempre.
E ofereça o meio-termo que mantém a relação: só a tosa, só a higiênica, ou um
banho de vez em quando entre os de casa.
Sobre "deixo com alguém conhecido": não compita com isso. Concorde e ofereça a
creche pelo que ela é — não é cuidado, é energia gasta e socialização, que a casa
da mãe dele não entrega. São coisas diferentes, e dizer isso ganha respeito.', '{}',
 '{"catalog.items","retention.intervalo_banho"}', '{}', 'omit',
 'Reconhecer o que funciona em casa e marcar o limite real, sem ameaça', '{"Assustar com problema de pele para forçar o agendamento","Competir com o parente que olha o cachorro de graça","Ironizar o banho caseiro"}', 'oferecer_alternativa',
 'skill_seed', 'active', 'negociacao_voss'),

-- -------------------------------------------------------- COMMITMENT_OFFER
(null, 'pet', 'commitment_offer', 'reactive',
 '{"tem pacote de banhos","vale a pena o plano","tem mensalidade","tem desconto se fechar vários","como funciona o plano"}',
 null, 'Plano é a melhor venda deste segmento: garante frequência, garante vaga e resolve
o problema do tutor de ficar remarcando toda semana.
Apresente pelo VALOR DO DIA, nunca pelo total do mês — o total assusta e o valor
do dia mostra a verdade: "no plano de 3x fica R$ X por mês, que dá R$ Y por dia,
contra R$ Z na diária avulsa. E ele fica com a vaga garantida nos mesmos dias."
Some o que o plano dá além do desconto, porque é o que sustenta a renovação: vaga
reservada no mesmo dia, rotina para o animal (que é o que faz efeito de verdade)
e a agenda dele resolvida.
Recomende UMA frequência, com motivo tirado do que ele contou — não abra o
cardápio inteiro. E se ele hesitar no compromisso mensal, ofereça o pacote de
banhos avulsos, que é o degrau menor.
Regra dura: nunca empurre o plano de 5x para quem descreveu necessidade de 2x. O
tutor cancela no segundo mês e não volta.', '{"pricing.plano_creche"}',
 '{"pricing.banho_por_porte","catalog.capacidade","pricing.parcelamento"}', '{}', 'escalate',
 'Plano pelo valor do DIA + vaga garantida como benefício real', '{"Apresentar só o valor total do mês","Empurrar a frequência maior do que a necessidade","Vender plano sem checar se há vaga nos dias que ele precisa"}', 'fechar_plano',
 'skill_seed', 'active', 'oferta_valor'),

-- A ENTRADA DE INDECISÃO. Aqui o medo não é de gastar: é de o animal
-- sofrer. Argumento não resolve medo — só reduzir risco resolve.
(null, 'pet', 'commitment_offer', 'reactive',
 '{"vou pensar","depois eu vejo","preciso conversar em casa","vou ver como ele reage","deixa eu pensar melhor","qualquer coisa eu chamo"}',
 null, 'ATENÇÃO: quem conheceu o lugar, gostou e mesmo assim não fechou raramente está em
dúvida sobre o preço. Está com medo de o animal sofrer — de estranhar, de brigar,
de ficar triste, de acontecer alguma coisa e ele não estar lá.
Repetir o quanto a casa é boa PIORA, porque ele já concordou com isso. Insistir em
quem está com medo confirma o medo.
Faça o contrário, nesta ordem:
1. Pergunte o que trava, sem cobrar decisão: "o que ainda te deixa em dúvida — é
   ele se adaptar, o horário, ou o valor?"
2. RECOMENDE um caminho: "no caso dele eu começaria com um dia só, meio período,
   e a gente vê como ele volta para casa."
3. DIMINUA a decisão: meio período em vez de dia inteiro, uma vez em vez de plano,
   diária avulsa antes da hospedagem longa.
E ofereça o que nenhum argumento substitui: notícia durante o dia. "Você me manda
ele na quinta, eu te mando foto no meio da manhã e você decide o resto depois."
Medo não se vence com convencimento. Vence-se com um passo pequeno e reversível.', '{}',
 '{"risk_free_entry.como_funciona","expertise_proof.monitoramento"}', '{}', 'omit',
 'Reduzir o risco em vez de insistir: meio período, um dia, e notícia durante', '{"Repetir o quanto a estrutura é boa","Dar desconto para vencer um medo que não é de preço","Encerrar com \"qualquer coisa me chama\""}', 'reduzir_risco',
 'skill_seed', 'active', 'indecisao_jolt'),

-- ------------------------------------------------------------- RECIPROCITY
(null, 'pet', 'reciprocity', 'proactive',
 '{"ele está se coçando","o pelo está caindo","ele está com mau cheiro","posso dar banho com que frequência","que ração vocês indicam"}',
 null, 'Quando o tutor descreve algo do animal, ele está pedindo orientação — e entregar
isso de graça é a forma mais rápida de virar a referência dele.
Dê UMA orientação prática que ele pode aplicar hoje, e o limite do que você pode
opinar. Frequência de banho por pelagem, escovação em casa, produto que não serve
para cachorro: tudo isso é seu terreno e ajuda de verdade.
MAS — e esta é a regra dura deste segmento — coceira, queda de pelo, ferida,
mudança de comportamento e cheiro forte podem ser problema de SAÚDE, e isso é do
veterinário. Diga isso com clareza, sem enrolar e sem diagnosticar:
"Isso pode ser só ressecamento e o banho com produto certo resolve, mas pode ser
alergia ou fungo — e aí é caso de veterinário. Eu não consigo dizer daqui qual
dos dois é."
Encaminhar em vez de opinar não perde venda: ganha o tutor. Quem cuida do animal
mesmo quando não é o serviço dele vira a primeira pessoa que ele chama.', '{}',
 '{"retention.intervalo_banho","ecosystem.parceiros","expertise_proof.parceria_vet"}', '{"Não diagnosticar nem orientar tratamento: consulta, exame e medicação são do veterinário"}', 'omit',
 'Orientação útil de graça + encaminhar ao veterinário em vez de opinar', '{"Dar palpite sobre problema de pele","Vender banho terapêutico para o que pode ser doença","Emendar a venda na mesma frase do conselho"}', 'orientar_e_encaminhar',
 'skill_seed', 'active', 'persuasao_cialdini'),

-- -------------------------------------------------------- LIMITS_AND_ETHICS
(null, 'pet', 'limits_and_ethics', 'reactive',
 '{"a vacina está vencida","não tenho a carteirinha","ele é bravo com outros cachorros","ele já mordeu","posso deixar mesmo assim","só dessa vez"}',
 null, 'Esta é a entrada mais importante desta biblioteca, e é a única em que a resposta
comercial certa costuma ser RECUSAR.
Vacina em dia e avaliação comportamental não são burocracia: um animal doente
contamina o grupo, e um cão reativo machuca o cachorro de outra família — dentro
da sua casa, sob sua responsabilidade.
Recuse com firmeza e com afeto, explicando pelo lado dele:
"Eu não posso receber sem a vacina em dia, e não é implicância: se entrar um
animal com gripe canina, todos os que estão aqui pegam. O mesmo cuidado que eu
tenho com os outros é o que eu vou ter com ele."
Ofereça o caminho em vez de só negar: quanto tempo depois da vacina ele pode
entrar, o que dá para fazer enquanto isso (banho individual, horário separado),
e onde vacinar se ele não tiver veterinário.
E se um cão não se adaptou ao grupo, diga a verdade com cuidado — sem dizer que
ele é "problemático". Ofereça a alternativa individual. O tutor que ouve isso com
respeito volta para outro serviço; o que ouve um julgamento vai embora e conta.', '{"policies.vacinas_exigidas"}',
 '{"policies.nao_aceita","risk_free_entry.como_funciona","catalog.items"}', '{"Nunca aceitar animal sem vacina em dia","Nunca aceitar em creche ou hotel sem avaliação comportamental"}', 'escalate',
 'Recusa sanitária e comportamental explicada pelo cuidado com o animal dele', '{"Abrir exceção \"só dessa vez\"","Recusar de forma seca, sem oferecer caminho","Chamar o cão de problemático para o tutor"}', 'orientar_regularizacao',
 'skill_seed', 'active', 'relacionamento_carnegie'),

(null, 'pet', 'limits_and_ethics', 'reactive',
 '{"ele voltou machucado","ele chegou estranho","aconteceu alguma coisa","ele está mancando","por que não me avisaram"}',
 null, 'Não existe momento mais delicado neste ramo, e a primeira reação decide se você
mantém ou perde a família para sempre.
Nunca minimize e nunca se defenda primeiro. Ouça inteiro, pergunte o que ele
observou, e leve para o presencial ou para o veterinário no mesmo dia.
"Quero ver ele agora. Consegue trazer? Se precisar de veterinário, eu vou junto."
Assuma o que é seu, rápido e sem discussão de culpa. Em casa com muitos animais,
arranhão e mordida acontecem mesmo com tudo certo — o que não pode acontecer é o
tutor descobrir sozinho.
E a regra que evita quase todos os casos: AVISAR NA HORA. Qualquer incidente,
por menor que seja, é comunicado no dia, com foto, antes de o tutor chegar. Quem
avisa está cuidando; quem é descoberto está escondendo — o fato é o mesmo e a
leitura é oposta.
Registre o que aconteceu e o que mudou por causa disso. Família que viu a casa
mudar um procedimento por causa do caso dela costuma ficar.', '{"policies.emergencia"}',
 '{"expertise_proof.parceria_vet","expertise_proof.equipe"}', '{}', 'escalate',
 'Avisar na hora, assumir o que é seu e levar ao presencial no mesmo dia', '{"Minimizar (\"isso é normal entre cachorros\")","Esperar o tutor perceber sozinho","Discutir culpa antes de cuidar do animal"}', 'resolver_incidente',
 'skill_seed', 'active', 'relacionamento_carnegie'),

-- --------------------------------------------------------------- RETENTION
(null, 'pet', 'retention', 'proactive',
 '{"está na hora do banho","faz tempo que não vem","quando devo trazer de novo","o pelo já está sujo","preciso marcar banho"}',
 null, 'O banho tem ciclo previsível por pelagem, e o tutor quase nunca lembra — ele
percebe quando o cachorro já está com cheiro, e aí liga para quem tiver vaga.
Chegue antes. A mensagem que funciona é específica do animal, não de campanha:
"Oi, Ana! O Thor tomou banho dia 8, então já está fechando as três semanas dele.
Tenho quinta às 10h ou sábado às 9h — quero segurar um?"
Duas coisas acontecem: ela vê que existe um registro (e registro é o que separa
casa organizada de casa que improvisa) e ela não precisa decidir nada além de
escolher entre dois horários.
E o melhor momento para marcar o próximo é na RETIRADA, quando o animal está
lindo e o tutor está satisfeito. Marcar ali converte muito mais do que qualquer
mensagem depois.', '{"retention.intervalo_banho"}',
 '{"retention.lembrete","availability.weekly_hours"}', '{}', 'escalate',
 'Recompra pelo ciclo da pelagem, com dois horários oferecidos', '{"Mandar mensagem genérica de campanha","Esperar o tutor lembrar","Perguntar \"quando você quer trazer?\" em vez de oferecer"}', 'agendar_banho',
 'skill_seed', 'active', 'cadencia_blount'),

(null, 'pet', 'retention', 'proactive',
 '{"cliente sumiu","parou de trazer","cancelou o plano","não vem há meses","deixou de vir"}',
 null, 'Tutor que parou de trazer raramente foi embora por um motivo grande — e quando foi,
você precisa saber, porque pode estar acontecendo com outros.
A mensagem de retomada não pode ter traço de cobrança nem de promoção. E ela não
pergunta pelo serviço: pergunta pelo ANIMAL.
"Oi, Marcos! Faz um tempo que o Bidu não aparece por aqui — está tudo bem com
ele? Fiquei com ele na cabeça."
É honesto e é a pergunta certa. Se estiver tudo bem, você reabriu a porta e já
pode oferecer horário. Se aconteceu algo — o cão adoeceu, faleceu, ou teve uma
experiência ruim aí — você precisava saber, e a forma como você responde a isso
decide se essa família volta um dia.
Cuidado especial com quem CANCELOU O PLANO: quase sempre foi frequência que não
coube na rotina ou no bolso, não insatisfação. Ofereça o degrau menor em vez de
tentar recuperar o plano cheio.', '{}',
 '{"pricing.plano_creche","retention.intervalo_banho"}', '{}', 'omit',
 'Retomada pelo animal, nunca pelo serviço nem por promoção', '{"Abrir a retomada com desconto","Mandar mensagem com culpa (\"sumiu\")","Tentar recuperar o plano cheio de quem cancelou por frequência"}', 'reabrir_conversa',
 'skill_seed', 'active', 'cadencia_blount'),

-- --------------------------------------------------------------- ECOSYSTEM
(null, 'pet', 'ecosystem', 'reactive',
 '{"vocês vendem ração","que antipulgas usar","indicam veterinário","tem adestrador","onde compro isso"}',
 null, 'A rede em volta do animal é grande e o tutor não sabe navegar sozinha: veterinário,
adestrador, pet sitter, transporte, ração. Quem vira a referência dele para tudo
isso dificilmente perde a parte que é sua.
Indique nominalmente e por entrega, nunca por comissão — indicação ruim volta
contra você, porque para o tutor o problema aconteceu com quem VOCÊ indicou.
Na venda de produto, ligue ao caso dele, não ao estoque: "para o pelo do Thor, o
shampoo que eu uso aqui é esse — em casa, entre um banho e outro, ele resolve".
E se o de supermercado serve, diga. Você perde uma venda pequena e ganha o
direito de ser levada a sério quando indicar o caro.
O veterinário parceiro merece atenção especial: é a sua fonte de cliente mais
qualificada e o seu apoio em emergência. Essa relação se cuida nos dois sentidos —
mande cliente para ele também, e avise quando notar algo no animal que ele deva
olhar.', '{}',
 '{"ecosystem.revenda","ecosystem.parceiros","ecosystem.indicacao","expertise_proof.parceria_vet"}', '{}', 'omit',
 'Rede nominal por entrega + o veterinário como parceria de mão dupla', '{"Indicar por comissão em vez de por entrega","Empurrar o que está parado no estoque","Receber indicação do veterinário e nunca retribuir"}', 'ativar_parceria',
 'skill_seed', 'active', 'relacionamento_carnegie');

-- Verificação (valor esperado escrito, como manda a convenção):
-- 17 entradas, 12 categorias distintas, 1 de indecisão (indecisao_jolt).
select count(*) as entradas, count(distinct category) as categorias
  from public.knowledge_entries where skill_key = 'pet' and tenant_id is null;
