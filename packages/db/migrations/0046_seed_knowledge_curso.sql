-- =====================================================================
-- COS — MIGRATION 0046 : BIBLIOTECA DE ESCOLA DE CURSO E FORMAÇÃO
--
-- Idiomas, profissionalizante, preparatório, técnico livre, in-company.
--
-- Product seed: dado que É o produto. Roda em todo ambiente.
--
-- POR QUE ESTE SEGMENTO EXISTE. A checagem de cobertura foi feita ANTES
-- de escrever, como manda a regra que nasceu do `energia_solar`: nome de
-- manifesto não é cobertura, cobertura é entrada curada. Contra as 239
-- entradas das treze bibliotecas, `escola_esportiva` já cobre turma,
-- horário, matrícula, professor, decisão compartilhada e evasão — a
-- camada OPERACIONAL. Nenhuma das 239 fala de certificação,
-- reconhecimento, empregabilidade, teste de nível, carga horária,
-- aproveitamento de estudos, calendário de turmas ou turma de empresa.
--
-- A DIFERENÇA DE FUNDO: aqui o produto é uma PROMESSA DE TRANSFORMAÇÃO
-- FUTURA. A barbearia entrega o corte na hora; o curso entrega em 6, 12
-- ou 24 meses. Três consequências que mandam nesta biblioteca inteira:
--   • a prova não é a estrutura, é o resultado de quem já saiu;
--   • o risco percebido não é o preço, é "e se eu não terminar?" — e
--     quem já tentou antes e desistiu carrega esse medo na primeira
--     mensagem, sem dizer;
--   • a promessa fácil (emprego, aprovação, fluência) é a mais cara do
--     setor. É `hard_rule`, não recomendação.
--
-- REGRA DA TRAVA: `escalate` quando o fato que falta é NÚMERO ou
-- COMPROMISSO (mensalidade, carga horária, multa, data de turma,
-- certificação). `omit` quando é prova opcional.
--
-- AS DUAS ENTRADAS QUE DEFINEM O SEGMENTO são de `limits_and_ethics`, e
-- as duas são RECUSA: "é reconhecido pelo MEC?" e "com esse curso eu
-- consigo emprego?". São as perguntas que mais chegam e as duas mentiras
-- mais comuns do ramo. Recusar bem aqui é o que protege o aluno — e o
-- cliente pagante, que é quem responde por propaganda enganosa.
-- =====================================================================

-- Recarga idempotente da biblioteca do segmento (não toca em conteúdo do tenant).
delete from public.knowledge_entries
 where skill_key = 'curso' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

-- ---------------------------------------------------------------- PREÇO
(null, 'curso', 'pricing', 'reactive',
 '{"quanto custa","qual o valor","qual a mensalidade","quanto é o curso","valor do curso","tabela de preços","quanto sai o curso"}',
 null,
 'O preço do curso não é um número, é uma TRILHA: depende de quantos módulos
faltam entre onde a pessoa está e onde ela quer chegar. Por isso não se cota por
mensagem sem saber o nível — cotar antes é vender a trilha errada e criar o
cancelamento do segundo mês.
Não fuja da pergunta: dê a FAIXA da mensalidade, deixando claro que é faixa e do
que depende (nível, carga horária, modalidade). Isso qualifica sem comprometer.
Diga na mesma mensagem se o material didático está incluso — se é cobrado à
parte, o valor dele entra aqui, não na matrícula. É o custo que mais gera briga
quando aparece depois.
Termine oferecendo o teste de nível: é ele que transforma faixa em proposta.',
 '{"pricing.range","pricing.material_didatico"}',
 '{"pricing.matricula","pricing.formas_pagamento","cursos.duracao"}', '{}', 'escalate',
 'Faixa com o que a define + conduzir ao teste de nível (Rackham)',
 '{"Dar um valor fechado sem saber o nível: vende a trilha errada","Esconder o preço: a pessoa procura a próxima escola","Falar da mensalidade e omitir o material didático","Despejar a tabela inteira de todos os cursos"}',
 'agendar_teste_de_nivel', 'skill_seed', 'active', null),

(null, 'curso', 'pricing', 'reactive',
 '{"o livro está incluso","tem que comprar material","o material é à parte","quanto custa o livro","precisa comprar apostila","a plataforma é paga"}',
 null,
 'Responda com o número exato do DNA, sem rodeio, e diga se é por módulo, por
semestre ou uma vez só. Material didático é o custo esquecido do setor: quando
não é dito na venda, o aluno descobre na matrícula e a conversa que já estava
ganha volta para o começo — agora com a confiança arranhada.
Se o material está incluso, isso é diferencial e deve ser dito com nome: "o livro
e a plataforma já estão na mensalidade". Se é à parte, diga o valor e diga
também o que ele compra com aquilo (quantos módulos, se é reutilizável, se fica
com o aluno).
Nunca minimize ("é bem baratinho"). Quem pergunta pelo material está somando o
custo total, e minimizar soa como esconder.',
 '{"pricing.material_didatico"}',
 '{"pricing.formas_pagamento","cursos.niveis"}', '{}', 'escalate',
 'Transparência de custo total (Hormozi) — o valor cheio antes da matrícula',
 '{"Dizer ''depois a gente vê'': o aluno soma isso como custo escondido","Minimizar o valor do material","Falar do material só no dia da matrícula"}',
 'informar_custo_total', 'skill_seed', 'active', null),

-- ----------------------------------------------------------- OBJEÇÕES
(null, 'curso', 'objections', 'reactive',
 '{"está caro","achei caro","não tenho esse valor","o outro é mais barato","tem curso mais barato","não cabe no meu bolso"}',
 null,
 '"Caro" em curso quase nunca é sobre a mensalidade: é sobre pagar meses por um
resultado que ainda não existe. Não baixe o preço de cara — desconto reflexo
ensina o aluno a barganhar todo semestre e desvaloriza o que vem depois.
Reconheça sem se desculpar e abra o que está dentro do valor: carga horária,
material, plataforma, reposição, alunos por turma, certificado. Curso é o produto
em que o cliente menos sabe o que está comparando.
Reenquadre para a menor unidade que existir de verdade no DNA: o valor por aula
ou por mês. E ofereça as formas de pagamento que existem — em curso, o que trava
quase sempre é fluxo de caixa, não o total.
Se ainda assim não couber, ofereça o que cabe: carga menor, modalidade mais
barata, começar por um módulo. Aluno que fez menos volta; aluno pressionado some.',
 '{"pricing.range","pricing.formas_pagamento"}',
 '{"cursos.carga_horaria","pricing.desconto_a_vista","estrutura.alunos_por_turma"}', '{}', 'escalate',
 'Abrir o que está incluso + diluir na menor unidade real (Tracy)',
 '{"Dar desconto na primeira pressão","Falar mal da outra escola","Comparar mensalidade sem comparar carga horária","Prometer desconto que não existe no DNA"}',
 'defender_valor', 'skill_seed', 'active', null),

(null, 'curso', 'objections', 'reactive',
 '{"não tenho tempo","minha rotina é corrida","trabalho o dia todo","não consigo toda semana","é muito tempo de curso"}',
 null,
 'Tempo é a objeção real do adulto que volta a estudar, e ela é honesta — não
discuta se a pessoa tem tempo. Reduza o sacrifício percebido com o que existe de
verdade no DNA: a carga por semana, os horários que sobram, a modalidade que
encaixa (online ao vivo, gravado, sábado), e a política de reposição.
O número que convence não é a duração total do curso, é a fatia semanal: "são
duas aulas de uma hora e meia" cabe na cabeça de quem trabalha; "dezoito meses"
não. Diga os dois, nessa ordem.
Se houver reposição de aula, isto é o argumento central e quase ninguém usa: o
medo não é a aula de hoje, é a semana em que o trabalho apertar.
Termine com o horário concreto que serve à rotina que ele acabou de descrever.',
 '{"cursos.duracao","cursos.grade_horarios"}',
 '{"cursos.modalidades","estrutura.reposicao"}', '{}', 'escalate',
 'Fatiar o compromisso na unidade semanal + reposição como rede de segurança',
 '{"Argumentar que ele ''arruma tempo se quiser''","Responder com a duração total sem a carga semanal","Ignorar a reposição, que é o que tira o medo real"}',
 'oferecer_horario', 'skill_seed', 'active', null),

(null, 'curso', 'objections', 'reactive',
 '{"já tentei antes e não fui","sempre começo e paro","já fiz curso e desisti","tenho medo de não terminar","não sei se vou conseguir levar"}',
 null,
 'Esta é a objeção mais importante do segmento e a que quase ninguém trata, porque
ela chega disfarçada de conversa fiada. Quem diz isso já decidiu que quer — o que
trava é a lembrança de ter pagado e não ter ido. Discutir preço aqui é responder
outra pergunta.
NÃO minimize ("dessa vez vai dar certo") e não venda motivação. Trate como
diagnóstico: pergunte o que aconteceu da outra vez — quase sempre é horário
errado, nível errado ou turma sem vínculo. Os três têm solução concreta, e é isso
que muda a conversa.
Depois mostre o que a SUA escola faz de diferente naquele ponto específico, com o
que existe no DNA: teste de nível para não cair na turma errada, turma pequena,
reposição, acompanhamento nas primeiras semanas.
Não prometa que ele vai terminar. Prometa o que você controla: que vai perceber
quando ele começar a faltar.',
 '{"teste_nivel.como_funciona","estrutura.metodologia"}',
 '{"estrutura.alunos_por_turma","estrutura.reposicao","contrato.politica_trancamento"}', '{}', 'escalate',
 'Diagnosticar a desistência anterior antes de vender (Rackham) — o medo é o obstáculo real',
 '{"Responder com motivação: ''dessa vez você consegue''","Tratar como objeção de preço","Prometer que ele vai terminar","Ignorar e seguir para o fechamento"}',
 'reduzir_risco', 'skill_seed', 'active', 'consultiva_spin'),

(null, 'curso', 'objections', 'reactive',
 '{"online não funciona pra mim","prefiro presencial","não aprendo online","aula gravada eu não assisto","é ao vivo ou gravado"}',
 null,
 'A dúvida é legítima e a resposta honesta separa duas coisas que o mercado
mistura: aula ONLINE AO VIVO tem professor, turma e horário — é presencial sem
deslocamento. Aula GRAVADA é outro produto, e é nela que a desistência é maior,
porque ninguém cobra presença de ninguém.
Diga qual das duas você oferece, com o nome certo, e não venda uma como se fosse
a outra. Se você tem as duas, diga para que serve cada uma.
Depois trate o que está por baixo: a pergunta quase sempre é "vou me manter?".
Traga o que existe no DNA que responde isso — turma com horário fixo, chamada,
professor que cobra, turma pequena, plataforma com acompanhamento.
Se a pessoa realmente precisa de presencial e você não tem, diga. Vender online
para quem não vai assistir é vender o cancelamento junto.',
 '{"cursos.modalidades","estrutura.metodologia"}',
 '{"estrutura.plataforma","estrutura.alunos_por_turma"}', '{}', 'escalate',
 'Separar ao vivo de gravado com o nome certo + responder ao medo por baixo',
 '{"Vender gravado dizendo que é ''como se fosse presencial''","Dizer que online é igual para todo mundo","Empurrar a modalidade que tem vaga em vez da que serve"}',
 'confirmar_modalidade', 'skill_seed', 'active', null),

-- --------------------------------------------------- ENTRADA SEM RISCO
(null, 'curso', 'risk_free_entry', 'reactive',
 '{"tem teste de nível","como sei meu nível","preciso fazer teste","posso assistir uma aula","tem aula demonstrativa","dá para experimentar"}',
 null,
 'O teste de nível é a entrada sem risco deste ramo, e ele vende sozinho quando é
apresentado como o que é: um DIAGNÓSTICO gratuito, não uma prova. Muita gente
adia a matrícula com medo de ser avaliada — a palavra "teste" assusta, e por isso
a primeira frase tem que tirar a nota da mesa.
Explique com o DNA: quanto tempo dura, se é online ou presencial, o que a pessoa
recebe depois. O que ela recebe é a parte que converte — o resultado com a trilha
dela, não um número.
Agende com data e hora exatas, nunca "quando você puder". E diga o que fazer se
não puder: remarcar é normal, sumir não.
Se houver aula demonstrativa, ofereça as duas coisas na ordem certa — teste
primeiro, aula depois, porque assistir à aula do nível errado desanima.',
 '{"teste_nivel.oferece","teste_nivel.como_funciona"}',
 '{"teste_nivel.gratuito","teste_nivel.online_ou_presencial","teste_nivel.aula_demonstrativa"}', '{}', 'escalate',
 'Tirar a nota da mesa: diagnóstico, não prova (Cialdini — reciprocidade)',
 '{"Chamar de ''prova'' ou ''avaliação''","Agendar sem data e hora exatas","Oferecer aula demonstrativa antes do teste: o nível errado desanima","Cobrar por um teste que o DNA diz ser gratuito"}',
 'agendar_teste_de_nivel', 'skill_seed', 'active', null),

(null, 'curso', 'risk_free_entry', 'proactive',
 '{}',
 'trial_followup',
 'Quem não compareceu ao teste de nível não perdeu o interesse — perdeu o dia.
Reagende no dia seguinte, sem cobrança e sem culpa. Uma mensagem cordial com DUAS
opções concretas converte muito mais que perguntar "quando você pode?".
Remova o obstáculo antes de ele aparecer de novo: confirme quanto tempo leva,
onde é (ou o link, se for online) e que não precisa estudar nada antes. Boa parte
das faltas é dúvida boba sobre o que ia acontecer, não desinteresse.
Se faltar de novo, espace o contato e mude o ângulo — insistir queima.',
 '{"teste_nivel.como_funciona"}',
 '{"teste_nivel.online_ou_presencial","cursos.proximas_turmas"}', '{}', 'omit',
 'Reagendar sem cobrança, com duas opções concretas (Blount)',
 '{"Cobrar a falta","Perguntar ''quando você pode?'' e devolver o trabalho","Repetir a mesma mensagem no dia seguinte"}',
 'reagendar_teste', 'skill_seed', 'active', null),

-- ----------------------------------------------------- DISPONIBILIDADE
(null, 'curso', 'availability', 'reactive',
 '{"que horários tem","tem turma de manhã","quando começa a próxima turma","tem turma à noite","qual dia da semana","tem aula no sábado"}',
 null,
 'Turma tem dia, hora e DATA DE INÍCIO — e é isso que diferencia esta pergunta da
mesma pergunta numa academia. Antes de listar tudo, pergunte o turno possível:
assim você responde com as duas turmas que servem, e não com a grade inteira, que
confunde e adia.
Diga a data de início da próxima turma junto com o horário. A data é o que
transforma "vou ver" em decisão — sem ela, a conversa não tem prazo e por isso
não tem fim.
Se a turma que serve ainda vai abrir, diga isso com honestidade e diga o que
depende (número mínimo de alunos, se for o caso). Prometer abertura de turma que
não está confirmada é criar um cancelamento com data marcada.
Termine oferecendo o teste de nível na semana que antecede o início.',
 '{"cursos.grade_horarios","cursos.proximas_turmas"}',
 '{"cursos.vagas_por_turma","cursos.modalidades"}', '{}', 'escalate',
 'Filtro por turno (duas opções, nunca a grade inteira) + data de início',
 '{"Mandar a grade inteira e deixar a pessoa decifrar","Dar o horário sem a data de início","Prometer turma que ainda não está confirmada","Dizer que está cheio sem oferecer a próxima janela"}',
 'oferecer_horario', 'skill_seed', 'active', null),

(null, 'curso', 'availability', 'reactive',
 '{"a turma já começou","perdi o início","dá para entrar agora","já passou a data","posso entrar no meio"}',
 null,
 'Esta pergunta é sinal de compra alto e costuma ser respondida com um "não" que
custa caro. Responda com a regra real do DNA: até quantas aulas depois do início
ainda dá para entrar, e o que a escola faz para a pessoa alcançar a turma.
Se dá para entrar, diga o que ele perde e o que é reposto — sem maquiar. Aluno
que entra atrasado sem saber disso vira o primeiro a desistir.
Se NÃO dá, não deixe a conversa morrer no não: dê a data da próxima turma, ofereça
o teste de nível agora (para chegar pronto) e combine o retorno para a semana da
abertura. Quem procurou hoje está no ponto hoje; daqui a dois meses estará no
ponto de outra escola.',
 '{"regras.entrada_turma_iniciada","cursos.proximas_turmas"}',
 '{"estrutura.reposicao","teste_nivel.como_funciona"}', '{}', 'escalate',
 'Transformar o não em data: teste agora, turma na próxima abertura',
 '{"Responder só ''já começou'' e encerrar","Deixar entrar sem avisar o que ele perdeu","Não marcar retorno para a data da próxima turma"}',
 'marcar_proxima_turma', 'skill_seed', 'active', null),

-- ------------------------------------------------------------ CATÁLOGO
(null, 'curso', 'catalog', 'reactive',
 '{"quais cursos vocês têm","tem curso de","quantas horas tem o curso","quantos módulos","qual a carga horária","tem curso de informática"}',
 null,
 'Confirme o que existe usando SOMENTE a lista do DNA, e responda com a estrutura
completa do curso perguntado: níveis ou módulos, carga horária e duração. Em
curso, essas três coisas juntas são o produto — dizer só o nome não responde
nada, e é assim que a pessoa vai comparar com o concorrente que informou tudo.
Não liste o catálogo inteiro. Responda o que ele perguntou e ofereça UMA
alternativa próxima quando fizer sentido para o objetivo dele.
Se não tem o curso, diga com naturalidade e indique o mais próximo do objetivo —
nunca invente curso, módulo ou carga horária para não perder a conversa. Carga
horária inventada aparece no certificado.',
 '{"cursos.lista","cursos.niveis","cursos.carga_horaria"}',
 '{"cursos.duracao","cursos.modalidades"}', '{}', 'escalate',
 'Nome + níveis + carga horária: o produto é a estrutura, não o rótulo',
 '{"Dizer só o nome do curso","Mandar o catálogo inteiro","Inventar carga horária para parecer maior","Afirmar curso que não está na lista do DNA"}',
 'confirmar_curso', 'skill_seed', 'active', null),

-- ----------------------------------------------------- ENCAIXE COM O OBJETIVO
(null, 'curso', 'goal_matching', 'reactive',
 '{"oi","olá","bom dia","boa tarde","queria informações","gostaria de saber sobre o curso","quero começar"}',
 null,
 'Abertura aqui é descoberta, não catálogo. A pergunta que direciona tudo é PARA
QUE serve o curso: trabalho, prova, viagem, exigência da empresa ou vontade
própria. O mesmo curso, vendido para objetivos diferentes, é uma conversa
diferente — e quem responde com tabela perde a chance de acertar a trilha.
Cumprimente com o nome, pergunte para que ele quer o curso e de que ponto está
partindo (já estudou antes?). Duas perguntas, não cinco.
Não dispare preço nem grade de imediato: sem o objetivo, os dois vão estar
errados. Responda rápido — quem procura curso costuma falar com três escolas no
mesmo dia, e a primeira que entende o objetivo sai na frente.',
 '{}',
 '{"cursos.lista","teste_nivel.oferece"}', '{}', 'omit',
 'Duas perguntas que direcionam (para quê e de onde parte) — Girard',
 '{"Mandar tabela e grade de imediato","\"Como posso ajudar?\" e esperar","Fazer cinco perguntas seguidas: vira formulário","Demorar para responder"}',
 'qualificar_objetivo', 'skill_seed', 'active', null),

(null, 'curso', 'goal_matching', 'reactive',
 '{"quanto tempo até eu falar","em quanto tempo fico pronto","quanto tempo leva para aprender","quando eu termino","em quanto tempo consigo o certificado"}',
 null,
 'Esta é a pergunta que decide a venda, e a resposta honesta tem duas partes que
não podem ser separadas: o tempo do CURSO e o que ele entrega em cada etapa.
Diga a duração real do DNA — quantos meses, quantos módulos, quantas aulas por
semana. E amarre ao objetivo dele: para viajar em seis meses, o alvo não é
terminar o curso, é chegar a um ponto específico da trilha.
Nunca prometa fluência, domínio ou prontidão em prazo. Ninguém controla o ritmo
de outra pessoa, e essa é a promessa que mais volta como reclamação. O que se
pode afirmar é o que a escola entrega: carga horária, o que se estuda em cada
módulo e o que o aluno sai sabendo fazer.
Se o prazo dele não cabe no curso, diga. Ajustar a expectativa agora é mais
barato que perder o aluno no terceiro mês.',
 '{"cursos.duracao","cursos.niveis"}',
 '{"cursos.carga_horaria","estrutura.metodologia"}', '{}', 'escalate',
 'Prazo do curso + o que cada etapa entrega, nunca prazo de resultado',
 '{"Prometer fluência ou domínio em X meses","Responder só com a duração total","Ignorar o prazo que ele tem","Dizer ''depende de você'' e encerrar: é verdade e não ajuda"}',
 'alinhar_expectativa', 'skill_seed', 'active', null),

(null, 'curso', 'goal_matching', 'reactive',
 '{"já estudei antes","preciso começar do zero","fiz dois anos e parei","tenho um pouco de base","dá para pular módulo","aproveita o que já fiz"}',
 null,
 'Nunca responda isso por mensagem. Quem já estudou antes tem base irregular — sabe
coisas de um nível e não sabe do anterior — e é exatamente por isso que existe o
teste de nível. Chutar o ponto de partida aqui é a causa número um de
desistência: colocado acima, a pessoa trava e some; colocado abaixo, se entedia e
some do mesmo jeito.
Explique a regra de aproveitamento do DNA: o que a escola aceita, como avalia e o
que acontece com o que já foi cursado. Se existe aproveitamento formal, ele é um
argumento comercial forte — economiza meses e dinheiro do aluno.
Acolha o histórico sem julgar. Muita gente parou por motivo que não tem nada a
ver com capacidade, e ouvir isso é metade da venda.
Termine agendando o teste, com data e hora.',
 '{"contrato.aproveitamento","teste_nivel.como_funciona"}',
 '{"cursos.niveis","teste_nivel.gratuito"}', '{}', 'escalate',
 'Nunca chutar o nível: o teste é o que evita a desistência do primeiro mês',
 '{"Dizer ''você começa do básico'' sem testar","Prometer aproveitamento sem a regra do DNA","Julgar quem parou antes"}',
 'agendar_teste_de_nivel', 'skill_seed', 'active', null),

-- ------------------------------------------------------- PROVA TÉCNICA
(null, 'curso', 'expertise_proof', 'reactive',
 '{"quem dá aula","o professor é formado","qual a metodologia","há quanto tempo vocês existem","quantos alunos por turma","a escola é boa"}',
 null,
 'A pergunta parece sobre credencial e é sobre RISCO: a pessoa vai entregar meses e
dinheiro e quer saber se vai valer. Responda com o que é verificável no DNA —
tempo de escola, quem dá aula e a formação, quantos alunos por turma, e como a
aula acontece na prática.
Metodologia só convence quando vira cena: diga o que o aluno FAZ na primeira
aula, não o nome do método. "Na primeira aula você já fala" vale mais que
qualquer sigla.
Turma pequena é o argumento mais forte deste ramo quando é verdade — significa
que o professor percebe quem está ficando para trás, que é justamente o medo de
quem já desistiu antes.
Se houver casos de alunos, use com autorização e com nome do resultado, não do
aluno. Nunca cite nome de aluno sem permissão.',
 '{"estrutura.professores","resultados.tempo_de_mercado"}',
 '{"estrutura.metodologia","estrutura.alunos_por_turma","resultados.casos"}', '{}', 'omit',
 'Prova verificável: quem ensina, quantos por turma e o que acontece na 1ª aula',
 '{"Responder com adjetivo (''ótimos professores'') em vez de fato","Citar nome de aluno sem autorização","Vender metodologia pelo nome do método","Inventar tempo de mercado ou número de formados"}',
 'enviar_prova', 'skill_seed', 'active', null),

-- ----------------------------------------------------- LIMITES E ÉTICA
(null, 'curso', 'limits_and_ethics', 'reactive',
 '{"é reconhecido pelo MEC","tem certificado","o certificado vale","é registrado","vale para concurso","o diploma é válido"}',
 null,
 'ATENÇÃO — É A PERGUNTA QUE MAIS CHEGA E A MENTIRA MAIS COMUM DO SETOR. Responda
com o campo de certificação do DNA, e só com ele.
A verdade depende do tipo de curso: o MEC reconhece graduação e pós-graduação;
curso TÉCNICO de nível médio é autorizado pelo Conselho Estadual de Educação e
registrado no SISTEC; CURSO LIVRE — idiomas, profissionalizante de curta duração,
formação inicial e continuada — emite certificado próprio com carga horária e NÃO
tem nem precisa ter reconhecimento do MEC.
Dizer "somos reconhecidos pelo MEC" para vender curso livre é propaganda
enganosa, e é a mentira que o aluno descobre no primeiro concurso ou na primeira
entrevista, quando já pagou o curso inteiro.
A resposta honesta VENDE melhor: diga exatamente o que está impresso no
certificado, a carga horária que consta e para que ele serve de verdade
(comprovar horas em processo seletivo, progressão interna, currículo). Se o dado
não estiver no DNA, não responda — confirme com a escola e volte.',
 '{"certificacao.emite_certificado","certificacao.tipo","certificacao.reconhecimento"}',
 '{"cursos.carga_horaria","certificacao.exigencias"}',
 '{"Nunca afirmar reconhecimento do MEC sem o campo de certificação do DNA dizer isso.","Nunca chamar certificado de curso livre de diploma."}', 'escalate',
 'Dizer exatamente o que está impresso no certificado — a honestidade aqui converte',
 '{"Dizer ''reconhecido pelo MEC'' quando é curso livre","Chamar certificado de diploma","Prometer validade em concurso sem conferir o edital","Responder ''sim'' para encerrar a conversa"}',
 'confirmar_certificacao', 'skill_seed', 'active', null),

(null, 'curso', 'limits_and_ethics', 'reactive',
 '{"com esse curso eu consigo emprego","garante aprovação","vou ficar fluente","depois do curso eu passo","tem garantia de emprego","quanto vou ganhar depois"}',
 null,
 'RECUSE a promessa, e recuse de um jeito que aproxime. Emprego, salário,
aprovação e fluência dependem da pessoa, do mercado e da sorte — ninguém controla
o resultado de outra pessoa, e prometer isso é a promessa mais cara do setor.
Não desconverse nem entregue um "depende" seco: os dois soam como fuga e derrubam
a conversa. Faça três coisas, nesta ordem.
Primeiro, diga com franqueza que não existe garantia, e diga por quê — porque
quem promete isso está vendendo, não ensinando.
Segundo, troque a promessa pelo que a escola de fato entrega: carga horária, o
que o aluno sai sabendo FAZER, e o resultado verificável de quem já saiu, quando
existir no DNA.
Terceiro, devolva a decisão para o terreno certo com uma pergunta: o que ele
precisa conseguir fazer, especificamente, para o objetivo dele. Isso transforma
uma pergunta impossível numa conversa sobre trilha.
Quem recusa bem aqui ganha mais confiança do que quem promete.',
 '{}',
 '{"resultados.casos","resultados.aprovacoes","cursos.carga_horaria"}',
 '{"Nunca prometer emprego, salário, aprovação ou fluência — nem como certeza, nem como quase certeza.","Nunca apresentar caso de aluno como resultado esperado."}', 'omit',
 'Recusar a promessa e trocar pelo que se controla (Cialdini — autoridade honesta)',
 '{"Dizer ''com certeza você consegue''","Responder ''depende de você'' e encerrar","Usar caso de um aluno como se fosse a média","Prometer aprovação em prova"}',
 'alinhar_expectativa', 'skill_seed', 'active', null),

-- ---------------------------------------------------------- COMPROMISSO
(null, 'curso', 'commitment_offer', 'reactive',
 '{"tem contrato","tem fidelidade","e se eu desistir","tem multa","posso trancar","e se eu precisar parar","quanto tempo de contrato"}',
 null,
 'Responda com o contrato do DNA, palavra por palavra, e não amenize. Quem pergunta
sobre multa está calculando o risco de não terminar — e é exatamente esse medo
que decide a matrícula. Esconder agora é criar a reclamação depois.
Diga três coisas na ordem: por quantos meses o contrato prende, quanto custa
desistir no meio, e o que acontece se ele precisar PAUSAR. A terceira é a que
converte e quase ninguém oferece: trancamento com o que já foi cursado
preservado é a resposta que o medo dele está pedindo.
Se existir troca de turma ou de horário no meio, diga — é a saída para o motivo
mais comum de abandono, que é a rotina mudar.
Nunca diga que "não tem multa" quando tem, e nunca prometa isenção que não está
no contrato. A multa precisa ser proporcional ao que falta cumprir; cobrar o
contrato inteiro de quem desistiu no primeiro mês é a cláusula que vira processo
e avaliação pública.',
 '{"contrato.fidelidade","contrato.multa_rescisao","contrato.politica_trancamento"}',
 '{"contrato.transferencia_turma","pricing.desconto_a_vista"}', '{}', 'escalate',
 'Abrir o contrato inteiro + oferecer o trancamento como saída (JOLT — tirar risco)',
 '{"Amenizar a multa para não assustar","Dizer que não tem fidelidade quando tem","Não mencionar o trancamento, que é a resposta ao medo real","Prometer isenção que não está no contrato"}',
 'reduzir_risco', 'skill_seed', 'active', null),

(null, 'curso', 'commitment_offer', 'reactive',
 '{"vou pensar","preciso pensar","vou ver no próximo semestre","depois eu te falo","vou conversar em casa","ano que vem eu começo","me dá um tempo"}',
 null,
 'ATENÇÃO: isto quase nunca é preço. Quem chegou até aqui já concordou que precisa
do curso — travou com medo de começar e não terminar, e adiar é a decisão mais
confortável que existe.
Primeiro julgue: se a pessoa ainda não viu para que serve, é falta de valor e
você volta para a descoberta. Mas se ela concordou com tudo e mesmo assim adiou,
é INDECISÃO — e aí o erro clássico é reforçar o argumento de novo. Repetir por
que estudar é importante para quem já concordou empurra a pessoa para longe.
Faça o contrário de dar mais opções: RECOMENDE UMA. "Pelo que você me contou, eu
começaria pela turma de terça e quinta à noite" vale mais que uma grade com oito
horários. Quem está travado não quer escolher, quer ser orientado.
Depois tire o risco da mesa com o que existir de verdade: teste de nível antes de
pagar, trancamento, troca de turma, começar por um módulo.
E use o que este ramo tem e a academia não: a turma tem DATA DE INÍCIO. "Vou ver
no próximo semestre" não é um não, é uma data — registre-a e combine o retorno
para a semana antes da abertura. Sumir e voltar no mês do início é chegar junto
com todos os concorrentes.',
 '{"cursos.proximas_turmas"}',
 '{"contrato.politica_trancamento","teste_nivel.oferece","contrato.transferencia_turma","cursos.grade_horarios"}', '{}', 'escalate',
 'Recomendar UMA turma, tirar risco e registrar a data — nunca repetir o argumento',
 '{"Repetir por que estudar é importante para quem já concordou","Mandar mais opções de horário para quem está em dúvida","Dar desconto achando que o problema é preço","Deixar o ''próximo semestre'' sem data marcada"}',
 'marcar_proxima_turma', 'skill_seed', 'active', 'indecisao_jolt'),

-- ---------------------------------------------------------- RECIPROCIDADE
(null, 'curso', 'reciprocity', 'reactive',
 '{"tem desconto para indicação","meu amigo estuda aí","fui indicado","tem promoção de matrícula","indiquei alguém"}',
 null,
 'Indicação é a captação mais barata deste segmento e a que traz o aluno que menos
desiste — quem entra por indicação já tem um vínculo dentro da turma.
Se existe recompensa cadastrada, diga qual é e para os DOIS lados. Se não existe,
agradeça de forma concreta assim mesmo e ofereça o que estiver no DNA: matrícula
cortesia, material, uma aula extra. Nunca invente benefício.
O momento certo de PEDIR indicação não é na matrícula: é depois de uma conquista
do aluno — passou de nível, fez a primeira apresentação, tirou o certificado.
Pedir antes do resultado é pedir no vazio.
Quando alguém chega indicado, use o vínculo: pergunte quem indicou e cite a
pessoa na conversa (sem expor dado nenhum dela). Reconhecimento é o que mais
fideliza aqui.',
 '{}',
 '{"pricing.matricula","resultados.casos"}', '{}', 'omit',
 'Recompensa para os dois lados + pedir depois da conquista, não antes',
 '{"Inventar recompensa que não existe","Pedir indicação na matrícula, antes de qualquer resultado","Expor dados de quem indicou"}',
 'pedir_indicacao', 'skill_seed', 'active', null),

-- -------------------------------------------------------------- RETENÇÃO
(null, 'curso', 'retention', 'proactive',
 '{"parou de vir","faltou as últimas aulas","sumiu","quer cancelar","vai trancar","está atrasado na mensalidade"}',
 'reactivation',
 'ESTA É A ENTRADA QUE PROTEGE A RECEITA JÁ VENDIDA. Contrato de doze meses só
vale doze meses se o aluno chegar lá — e a evasão AVISA ANTES: falta seguida,
atraso de pagamento e o aluno que para de responder vêm antes do cancelamento.
Quem só age no pedido de cancelamento está sempre chegando depois, quando a
decisão já foi tomada e já foi explicada para a família.
Chame cedo e NUNCA cobre a falta: cobrança gera culpa, e culpa gera silêncio.
Abra pelo conteúdo, não pela ausência — o que a turma fez na aula que ele perdeu,
e a reposição, se existir no DNA.
Depois pergunte direto e sem julgamento o que mudou. As três causas reais são
horário que não serve mais, dinheiro, e a sensação de estar ficando para trás. As
três têm saída concreta: trocar de turma, renegociar, ou aula de reforço.
Trancar com data de volta marcada retém muito mais do que deixar cancelar — e
muito mais do que insistir para ele continuar sem resolver o que travou.',
 '{"estrutura.reposicao"}',
 '{"contrato.politica_trancamento","contrato.transferencia_turma","cursos.grade_horarios"}', '{}', 'omit',
 'Agir na falta, não no cancelamento + trancar com data em vez de perder (Blount)',
 '{"Abrir cobrando a ausência","Esperar o pedido de cancelamento para agir","Insistir que ele continue sem resolver o que travou","Oferecer desconto antes de descobrir a causa"}',
 'reter_aluno', 'skill_seed', 'active', null),

(null, 'curso', 'retention', 'proactive',
 '{"trancou o curso","parou no meio","quer voltar a estudar","voltei a ter tempo","aluno antigo"}',
 'reactivation',
 'Quem trancou é o lead mais barato que existe: já escolheu a escola, já pagou, já
conhece o professor e já sabe onde fica. Ainda assim, é a base que quase todo
mundo esquece.
Retome com a informação que interessa a ELE, não com promoção: em que nível ele
parou, o que fica preservado do que já cursou, e quando abre a próxima turma
daquele nível. Essas três coisas juntas respondem a pergunta que trava o retorno
— "vou ter que começar tudo de novo?".
Se o tempo parado for longo, ofereça o teste de nível de novo, enquadrado como
cuidado e não como prova: "para você voltar no ponto certo, não atrás".
Programe o retorno pelo calendário de turmas, não por data solta. Chamar na
semana em que abre a turma do nível dele é a diferença entre um "quem sabe" e uma
matrícula.',
 '{"contrato.politica_trancamento","cursos.proximas_turmas"}',
 '{"contrato.aproveitamento","teste_nivel.oferece","cursos.niveis"}', '{}', 'omit',
 'Voltar no ponto certo: nível preservado + data da turma (Blount — cadência com gancho)',
 '{"Mandar promoção genérica para quem trancou","Não dizer o que fica preservado","Chamar em data solta em vez da abertura da turma"}',
 'reativar_aluno', 'skill_seed', 'active', null),

-- ----------------------------------------------------------- ECOSSISTEMA
(null, 'curso', 'ecosystem', 'reactive',
 '{"turma para empresa","curso in company","treinar minha equipe","turma fechada","vocês atendem empresa","curso para funcionários"}',
 null,
 'Turma de empresa é outro jogo e a maior parte das escolas responde com a tabela
do varejo, que é o jeito mais rápido de perder. Aqui quem pergunta raramente é
quem assina, e o que ele precisa não é preço: é um material que ele possa
apresentar internamente.
Confirme primeiro o que o DNA diz: se você monta turma fechada, o mínimo de
alunos, onde acontece (na empresa, na escola ou online) e como você fatura.
Depois qualifique com DUAS perguntas, não mais: quantas pessoas e para que serve
o treinamento — porque exigência de cliente, avaliação de desempenho e
desenvolvimento têm desenhos diferentes.
Descubra cedo quem decide e como a verba anda, sem constrangimento: "você é quem
cuida dessa parte aí, ou consigo falar com quem cuida?". Perguntar no primeiro
contato é natural; descobrir depois da proposta pronta é tarde demais.
Entregue por escrito o que ele vai precisar levar para dentro: carga horária,
formato, o que a equipe sai sabendo fazer e as condições. Material incompleto
obriga a conversar, e obrigar a conversar é exatamente o que ele não pode fazer.',
 '{"corporativo.atende","corporativo.minimo_alunos"}',
 '{"corporativo.local","corporativo.faturamento","cursos.carga_horaria"}', '{}', 'escalate',
 'Qualificar volume e decisor + entregar material que ele apresenta internamente',
 '{"Responder com a tabela do varejo","Descobrir quem decide depois da proposta pronta","Mandar preço sem carga horária e formato","Insistir em reunião com quem pediu material por escrito"}',
 'qualificar_corporativo', 'skill_seed', 'active', null);


-- =====================================================================
-- VERIFICAÇÃO 1 — quantas entradas por categoria
-- =====================================================================
select category      as "Categoria",
       count(*)      as "Entradas",
       count(*) filter (where entry_type = 'proactive') as "Proativas"
from public.knowledge_entries
where skill_key = 'curso' and tenant_id is null
group by category
order by 1;


-- =====================================================================
-- VERIFICAÇÃO 2 — a estratégia não pode conter fato do cliente
-- O resultado esperado é ZERO linhas.
-- =====================================================================
select category, left(strategy, 60) as "Trecho"
from public.knowledge_entries
where skill_key = 'curso' and tenant_id is null
  and (strategy ~* 'R\$ ?[0-9]' or strategy ~* '[0-9]{2}:[0-9]{2}');
