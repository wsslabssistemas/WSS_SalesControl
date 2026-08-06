-- =====================================================================
-- COS — MIGRATION 0025 : BIBLIOTECA DE ESCOLA ESPORTIVA E CLUBE
--
-- Natação, artes marciais, crossfit, pilates, tênis, escolinhas, clubes.
--
-- O QUE TORNA ESTE SEGMENTO DIFERENTE DE ACADEMIA:
--   • Quem DECIDE muitas vezes não é quem PRATICA (mãe/pai matrícula o
--     filho). Falar com a criança e ignorar o responsável perde a venda.
--   • A aula experimental é AGENDADA dentro de uma turma com horário fixo —
--     não é "venha quando quiser". Vaga na turma é finita e isso cria
--     urgência real e honesta.
--   • O horário costuma decidir mais que o preço: se não bate com a rotina
--     da família, nem o melhor preço fecha.
--   • Evasão é o inimigo: matrícula sem frequência vira cancelamento em
--     poucos meses.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'escola_esportiva' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

(null, 'escola_esportiva', 'pricing', 'reactive',
 '{"quanto custa","qual o valor","qual a mensalidade","quanto é por mês","tem taxa de matrícula","valor das aulas"}',
 null,
 'Entregue o valor com transparência — esconder preço derruba a confiança e a
família procura a próxima escola.
Mas nunca pare no número: emende com UMA pergunta que descubra para quem é a
aula e qual o horário possível. Em escola esportiva o horário decide mais que o
preço, e a conversa que morre no valor é a que não perguntou nada.
Se houver taxa de matrícula ou desconto para irmãos, diga aqui — família com
dois filhos decide muito por isso.
Termine oferecendo a aula experimental: é ela que vende, não a tabela.',
 '{"pricing.range"}',
 '{"pricing.matricula","pricing.desconto_irmaos","experimental.oferece"}', '{}', 'escalate',
 'Transparência + descoberta de horário + condução à experimental',
 '{"Esconder o valor","Responder só o preço e encerrar","Não mencionar desconto para irmãos quando existe"}',
 'agendar_experimental', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'availability', 'reactive',
 '{"que horário tem","tem turma de manhã","qual dia","tem vaga","horário da turma","tem aula sábado"}',
 null,
 'ESTA É A PERGUNTA QUE MAIS DECIDE NO SEGMENTO. Turma tem dia e hora fixos, e
se não bate com a rotina da família, não adianta preço nem estrutura.
Antes de listar tudo, pergunte a idade e o turno possível — assim você responde
com as DUAS turmas que servem, e não com a grade inteira, que confunde.
Confirme a vaga de verdade. Prometer lugar em turma cheia gera cancelamento e
reclamação no primeiro dia.
Se a turma ideal está lotada, ofereça a alternativa mais próxima E a lista de
espera — nunca deixe a família sem próximo passo.',
 '{"modalidades.grade_horarios"}',
 '{"modalidades.vagas_por_turma","modalidades.faixas_etarias","modalidades.lista"}', '{}', 'escalate',
 'Filtro por idade e turno (duas opções, nunca a grade inteira)',
 '{"Mandar a grade inteira e deixar a família decifrar","Prometer vaga em turma cheia","Não oferecer alternativa quando lotou"}',
 'agendar_experimental', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'risk_free_entry', 'reactive',
 '{"tem aula experimental","posso experimentar","dá pra fazer uma aula","como funciona a primeira aula","tem aula teste"}',
 null,
 'A experimental é o que vende. Ninguém matrícula um filho em algo que ele não
experimentou — e ninguém volta para uma escola onde a primeira aula foi
confusa.
Explique COMO funciona: precisa agendar, qual turma, quanto dura, o que levar
(toalha, garrafa, touca, roupa) e se precisa de atestado. Dúvida sobre o que
levar é a maior causa de falta.
Agende com data e hora exatas, na turma certa para a idade — experimental em
turma errada gera experiência ruim.
Se a escola não oferece experimental, não invente: ofereça conhecer a estrutura
e assistir a uma aula.',
 '{"experimental.oferece","experimental.como_funciona"}',
 '{"experimental.o_que_levar","experimental.precisa_agendar","regras.atestado_medico"}', '{}', 'escalate',
 'Redução de incerteza (o que levar e onde ir) para garantir presença',
 '{"Marcar sem explicar o que levar","Colocar em turma de idade errada","Prometer experimental que a escola não faz"}',
 'agendar_experimental', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'goal_matching', 'reactive',
 '{"meu filho tem","qual idade","serve pra criança","tem turma pra ele","ele nunca praticou","qual modalidade indica"}',
 null,
 'Pergunta sobre a criança é o momento de acolher a preocupação do responsável —
que quase nunca é sobre esporte: é sobre o filho se adaptar, não se machucar e
gostar.
Descubra idade, se já praticou e o objetivo da FAMÍLIA (saúde, disciplina,
socialização, gastar energia, competição). O objetivo dos pais costuma ser
diferente do que a criança diria.
Indique a turma pela idade e pelo nível, explicando como o professor conduz
iniciante. Tranquilizar sobre a adaptação vale mais que falar de metodologia.
Nunca prometa resultado ("vai ficar craque", "vai perder peso").',
 '{"modalidades.faixas_etarias"}',
 '{"modalidades.lista","estrutura.professores","modalidades.grade_horarios"}', '{}', 'escalate',
 'Acolhimento da preocupação do responsável + indicação por idade e nível',
 '{"Falar só de metodologia técnica","Ignorar o medo de o filho não se adaptar","Prometer resultado"}',
 'agendar_experimental', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'objections', 'reactive',
 '{"tá caro","muito caro","achei caro","não cabe no orçamento","o outro cobra menos"}',
 null,
 '"Caro" em escola esportiva quase sempre significa "não vejo ainda o que meu
filho ganha com isso".
Não baixe o preço. Reconecte ao objetivo que o próprio responsável trouxe
(disciplina, saúde, socialização) e mostre o que está incluso: professor
formado, turma pequena, estrutura, acompanhamento.
Traga a conta por aula — mensalidade dividida pelo número de aulas costuma soar
muito mais razoável que o valor cheio.
Se houver plano semestral, desconto para irmãos ou matrícula cortesia, é aqui.
Nunca fale mal da escola concorrente.',
 '{"pricing.range"}',
 '{"pricing.desconto_irmaos","estrutura.professores","modalidades.vagas_por_turma"}', '{}', 'escalate',
 'Reconexão ao objetivo da família + valor por aula',
 '{"Dar desconto na primeira objeção","Falar mal do concorrente","Repetir o valor cheio sem quebrar por aula"}',
 'defender_valor', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'objections', 'reactive',
 -- "vou falar com meu marido" e "vou conversar em casa" saíram daqui em
 -- ago/2026: são adiamento, e adiamento é indecisão (entrada própria em
 -- commitment_offer). Aqui fica quem DECLARA que outra pessoa decide — caso em
 -- que a jogada certa é municiar o defensor, não reduzir risco.
 '{"preciso ver com a mãe","depende do pai","o responsável decide","quem decide é o pai","quem paga é a avo"}',
 null,
 'Decisão compartilhada é a norma aqui: quase sempre um responsável pesquisa e o
outro participa da decisão. Isso não é desculpa.
Ajude quem está falando com você a levar a informação completa: valor, horário,
o que está incluso e a data da experimental. Mande organizado, para ele apenas
mostrar.
Pergunte qual seria a dúvida do outro — geralmente é valor ou distância — e
responda antes.
Convide os dois para a experimental: decisão tomada junto, vendo o filho na
aula, fecha muito mais que decisão intermediada por mensagem.
Combine retorno com DATA.',
 '{}', '{"pricing.range","modalidades.grade_horarios"}', '{}', 'omit',
 'Municiar o defensor + convidar o decisor para a experimental',
 '{"Tratar como enrolação","Deixar sem data de retorno","Mandar informação desorganizada e difícil de repassar"}',
 'agendar_retorno', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'objections', 'reactive',
 '{"é longe","fica longe da minha casa","não tenho como levar","quem leva","difícil de chegar"}',
 null,
 'Distância é uma objeção logística REAL — quem leva e busca costuma ser o gargalo
da família, não o dinheiro.
Não tente convencer que "é pertinho". Trate o problema: existe turma em horário
que combina com a saída da escola ou do trabalho? Há estacionamento? Outra
família do bairro já frequenta?
Se a escola tem turmas em vários horários, ofereça o que reduz deslocamento
extra. Se há estrutura para o responsável esperar (espaço, wi-fi), mencione:
resolve a hora ociosa de quem espera.
Se realmente não houver saída, seja honesto — indicar que não vai funcionar
preserva a reputação e traz indicação depois.',
 '{}', '{"modalidades.grade_horarios","estrutura.instalacoes","estrutura.estacionamento"}', '{}', 'omit',
 'Tratar a logística como problema real (não como objeção a contornar)',
 '{"Insistir que é perto","Ignorar quem leva e busca","Não oferecer horário que reduza deslocamento"}',
 'ajustar_horario', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'retention', 'proactive',
 '{"não compareceu","faltou na experimental","não veio","desmarcou","reagendar aula"}',
 null,
 'Falta na experimental é a maior perda evitável do segmento — a família estava
interessada e algo atrapalhou (esqueceu, imprevisto, insegurança).
Reagende no dia seguinte, sem cobrança e sem culpa. Uma mensagem cordial com
DUAS novas opções recupera boa parte.
Aproveite para remover o obstáculo: confirme o que levar, o horário e onde
entrar — muitas faltas são por dúvida boba, não por desinteresse.
Se faltar de novo, espace o contato e mude o ângulo. Insistir queima.',
 '{}', '{"modalidades.grade_horarios","experimental.o_que_levar"}', '{}', 'omit',
 'Recuperação imediata do no-show + remoção do obstáculo',
 '{"Deixar quem faltou sem contato","Cobrar explicação","Reagendar sem confirmar o que levar"}',
 'reagendar_experimental', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'retention', 'proactive',
 '{"pós experimental","como foi a aula","gostou da aula","depois da experimental","fechar matrícula"}',
 null,
 'ENTRADA MAIS IMPORTANTE. O melhor momento para matricular é nas 24h seguintes a
experimental, enquanto a criança ainda está empolgada e o responsável viu o
filho participando.
Pergunte primeiro como FOI para ele — a resposta te dá o argumento. Se a criança
gostou, o responsável já está convencido e falta só o operacional.
Traga a vaga da turma como urgência honesta: se a turma tem lugares contados,
diga. Isso é verdade e acelera decisão sem pressão artificial.
Deixe o próximo passo trivial: o que precisa para matricular, o que levar e a
data da primeira aula.',
 '{}', '{"modalidades.vagas_por_turma","pricing.matricula","regras.atestado_medico"}', '{}', 'omit',
 'Fechamento no pico de empolgação + urgência honesta pela vaga',
 '{"Esperar a família voltar sozinha","Perguntar se gostou e não propor a matrícula","Inventar urgência que não existe"}',
 'fechar_matricula', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'retention', 'proactive',
 '{"aluno faltando","parou de vir","desanimou","vai trancar","quer cancelar","evasão"}',
 null,
 'Evasão mata escola esportiva silenciosamente: o aluno falta, some e só avisa
quando já decidiu sair.
Falta seguida é sinal de alerta ANTES do cancelamento. Chame cedo, com cuidado e
sem cobrança — o motivo costuma ser mudança de rotina, dificuldade de adaptação
na turma, atrito com colega ou perda de motivação.
Fale com o RESPONSÁVEL quando for menor, e ofereça saída concreta: trocar de
turma ou horário, conversar com o professor, ou uma pausa combinada com data de
volta.
Trancar com data marcada retém muito mais que deixar cancelar.',
 '{}', '{"modalidades.grade_horarios","estrutura.professores"}', '{}', 'omit',
 'Intervenção na FALTA (antes do pedido de cancelamento)',
 '{"Esperar o pedido de cancelamento","Cobrar a ausência","Não oferecer troca de turma ou pausa com data"}',
 'reter_aluno', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'expertise_proof', 'reactive',
 '{"quem da aula","o professor é formado","tem experiência","quantos alunos por turma","é seguro"}',
 null,
 'Confiar um filho a alguém é a decisão mais sensível deste segmento. A pergunta
sobre o professor é, na verdade, sobre segurança.
Responda com fatos: formação, tempo de experiência, quantos alunos por turma e
como é o acompanhamento de iniciante. Turma pequena é um argumento forte —
significa olhar individual.
Se há estrutura de segurança relevante (profissional na borda da piscina,
tatame adequado, protocolo), mencione.
Convide para conhecer e assistir a uma aula: ver o professor com as crianças
convence mais que qualquer descrição.',
 '{"estrutura.professores"}',
 '{"modalidades.vagas_por_turma","estrutura.instalacoes"}', '{}', 'escalate',
 'Prova de segurança por fato + convite para ver a aula',
 '{"Responder com adjetivo","Omitir o tamanho da turma quando é grande","Não convidar para conhecer"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'catalog', 'reactive',
 '{"vocês têm natação","tem judô","fazem hidroginástica","tem aula para adulto","atende idoso","tem turma para bebê"}',
 null,
 'Confirme usando SOMENTE a lista do DNA e a faixa etária de cada modalidade.
Dizer que atende uma idade que a turma não comporta gera frustração na primeira
aula.
Não tem? Diga com naturalidade e ofereça a modalidade mais próxima do objetivo
dele — muita gente chega pedindo uma coisa e fecha em outra quando entende a
diferença.
Tem? Confirme, diga os horários que servem para a idade e conduza a
experimental.',
 '{"modalidades.lista","modalidades.faixas_etarias"}',
 '{"modalidades.grade_horarios","pricing.range"}', '{}', 'escalate',
 'Confirmação factual por idade + alternativa por objetivo',
 '{"Aceitar idade fora da faixa da turma","Dizer que tem modalidade que não existe","Não oferecer alternativa"}',
 'agendar_experimental', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'commitment_offer', 'reactive',
 '{"tem plano semestral","desconto se pagar tudo","tem pacote","vale mais a pena anual","desconto para irmãos"}',
 null,
 'Quem pergunta de plano longo já decidiu ficar — falta o formato.
Mostre a conta fechada: quanto economiza no semestre ou no ano em relação ao
mensal. Número convence mais que adjetivo.
Reforce o benefício que a família valoriza: valor travado (sem reajuste no meio
do ano) e vaga garantida na turma.
Para família com mais de um filho, o desconto de irmãos costuma ser o que
decide — traga sem esperar ele perguntar.
Nunca prometa condição que a escola não pratica.',
 '{"pricing.range"}',
 '{"pricing.desconto_irmaos","pricing.formas_pagamento","modalidades.vagas_por_turma"}', '{}', 'escalate',
 'Diluição com conta fechada + valor travado + desconto família',
 '{"Falar do plano sem mostrar a economia","Empurrar anual para quem ainda não experimentou","Esconder o desconto de irmãos"}',
 'fechar_plano', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'limits_and_ethics', 'reactive',
 '{"precisa de atestado","ele tem problema de saúde","tem asma","teve lesão","pode fazer mesmo com","é seguro pra ele"}',
 null,
 'Saúde de aluno — especialmente criança — não admite improviso.
Informe com clareza a regra da escola sobre atestado médico e o que é exigido.
Isso protege o aluno e a escola.
NUNCA opine sobre condição de saúde, nem diga que "pode fazer sem problema".
Quem libera é o médico. Acolha a preocupação, informe a regra e diga que o
professor adapta a atividade dentro do que o médico autorizar.
Não prometa que a atividade vai tratar, curar ou melhorar uma condição —
mesmo quando a família insiste.',
 '{}', '{"regras.atestado_medico","regras.idade_minima","estrutura.professores"}',
 '{"Nunca opinar sobre condição de saúde nem liberar atividade"}', 'omit',
 'Acolher a preocupação sem opinar sobre saúde',
 '{"Dizer que pode fazer sem restrição","Prometer melhora de condição de saúde","Ignorar a exigência de atestado para não perder a matrícula"}',
 'orientar_atestado', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'reciprocity', 'reactive',
 '{"oi","ola","bom dia","boa tarde","boa noite","queria informações","gostaria de saber sobre as aulas"}',
 null,
 'Abertura aqui é acolhimento: quem procura escola esportiva geralmente está
pensando no filho, e quer sentir que vai ser bem cuidado.
Cumprimente com o nome e pergunte PARA QUEM é a aula e a idade — essas duas
respostas direcionam tudo o que vem depois e evitam mandar informação errada.
Não dispare tabela de preços nem a grade inteira na primeira mensagem.
Responda rápido: família costuma consultar três escolas no mesmo dia, e a
primeira que acolhe bem sai na frente.',
 '{}', '{"modalidades.lista","modalidades.faixas_etarias"}', '{}', 'omit',
 'Acolhimento + duas perguntas que direcionam (para quem e que idade)',
 '{"Mandar tabela e grade de imediato","\"Como posso ajudar?\" e esperar","Demorar para responder"}',
 'qualificar', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'ecosystem', 'reactive',
 '{"tem convênio","escola parceira","desconto empresa","indicação de amigo","trouxe um colega"}',
 null,
 'Indicação e convênio são a captação mais barata deste segmento: criança puxa
criança, e família confia em quem já frequenta.
O melhor momento de pedir indicação é logo após um elogio ou uma conquista do
aluno (faixa, prova, evolução) — nunca durante negociação de preço.
Se há convênio com escola, empresa ou clube, confirme com exatidão qual é o
benefício. Errar convênio gera constrangimento na recepção.
Se há recompensa por indicação, diga qual é para os DOIS lados. Se não há,
agradeça de forma concreta assim mesmo — e reconheça publicamente quando puder.',
 '{}', '{"pricing.desconto_irmaos","modalidades.lista"}', '{}', 'omit',
 'Indicação no pico de orgulho (conquista do aluno)',
 '{"Pedir indicação durante negociação","Prometer convênio sem confirmar","Não reconhecer quem indicou"}',
 'pedir_indicacao', 'skill_seed', 'active', null),

(null, 'escola_esportiva', 'commitment_offer', 'reactive',
 '{"vou pensar","vou ver com meu marido","vou falar com a minha esposa","não sei se ele vai gostar","e se ele não se adaptar","depois eu confirmo","vou ver se ele quer"}',
 null,
 'Quem decide é o responsável, mas quem usa é a criança — e o medo dele é
específico: matricular, pagar e a criança desistir em duas semanas. Não é preço.
Já aconteceu com ele ou com um conhecido.
Não volte a explicar os benefícios da modalidade. Ele já concordou; repetir soa
como venda e aumenta a desconfiança.
Nomeie o receio de frente: "a dúvida costuma ser se ele vai gostar mesmo". Isso
alivia, porque é exatamente o que a pessoa estava pensando sem falar.
Depois RECOMENDE UMA turma — a certa para a idade e o nível — em vez de mandar a
grade inteira. E tire o risco com o que existir: aula experimental, começar sem
compromisso de semestre, poder trocar de turma se o horário não funcionar.
Fechar aqui é marcar a experimental com dia e hora, não conseguir um "sim" para o
semestre. O compromisso pequeno é o que destrava o grande.',
 '{"modalidades.lista"}',
 '{"experimental.oferece","experimental.como_funciona","modalidades.grade_horarios","modalidades.vagas_por_turma","pricing.matricula"}', '{}', 'escalate',
 'Nomear o medo da desistência + recomendar UMA turma + experimental com data',
 '{"Repetir os benefícios da modalidade","Mandar a grade inteira de horários","Pressionar o responsável a fechar o semestre","Ignorar que quem usa é a criança"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt');
