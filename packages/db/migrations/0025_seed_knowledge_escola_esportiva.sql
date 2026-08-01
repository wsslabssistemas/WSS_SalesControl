-- =====================================================================
-- COS — MIGRATION 0025 : BIBLIOTECA DE ESCOLA ESPORTIVA E CLUBE
--
-- Natação, artes marciais, crossfit, pilates, tênis, escolinhas, clubes.
--
-- O QUE TORNA ESTE SEGMENTO DIFERENTE DE ACADEMIA:
--   • Quem DECIDE muitas vezes não é quem PRATICA (mãe/pai matricula o
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
   on_missing_facts, technique, common_errors, next_objective, source, status)
values

(null, 'escola_esportiva', 'pricing', 'reactive',
 '{"quanto custa","qual o valor","qual a mensalidade","quanto e por mes","tem taxa de matricula","valor das aulas"}',
 null,
 'Entregue o valor com transparencia — esconder preco derruba a confianca e a
familia procura a proxima escola.
Mas nunca pare no numero: emende com UMA pergunta que descubra para quem e a
aula e qual o horario possivel. Em escola esportiva o horario decide mais que o
preco, e a conversa que morre no valor e a que nao perguntou nada.
Se houver taxa de matricula ou desconto para irmaos, diga aqui — familia com
dois filhos decide muito por isso.
Termine oferecendo a aula experimental: e ela que vende, nao a tabela.',
 '{"pricing.range"}',
 '{"pricing.matricula","pricing.desconto_irmaos","experimental.oferece"}', '{}', 'escalate',
 'Transparencia + descoberta de horario + condução à experimental',
 '{"Esconder o valor","Responder so o preco e encerrar","Nao mencionar desconto para irmaos quando existe"}',
 'agendar_experimental', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'availability', 'reactive',
 '{"que horario tem","tem turma de manha","qual dia","tem vaga","horario da turma","tem aula sabado"}',
 null,
 'ESTA E A PERGUNTA QUE MAIS DECIDE NO SEGMENTO. Turma tem dia e hora fixos, e
se nao bate com a rotina da familia, nao adianta preco nem estrutura.
Antes de listar tudo, pergunte a idade e o turno possivel — assim voce responde
com as DUAS turmas que servem, e nao com a grade inteira, que confunde.
Confirme a vaga de verdade. Prometer lugar em turma cheia gera cancelamento e
reclamacao no primeiro dia.
Se a turma ideal esta lotada, ofereca a alternativa mais proxima E a lista de
espera — nunca deixe a familia sem proximo passo.',
 '{"modalidades.grade_horarios"}',
 '{"modalidades.vagas_por_turma","modalidades.faixas_etarias","modalidades.lista"}', '{}', 'escalate',
 'Filtro por idade e turno (duas opcoes, nunca a grade inteira)',
 '{"Mandar a grade inteira e deixar a familia decifrar","Prometer vaga em turma cheia","Nao oferecer alternativa quando lotou"}',
 'agendar_experimental', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'risk_free_entry', 'reactive',
 '{"tem aula experimental","posso experimentar","da pra fazer uma aula","como funciona a primeira aula","tem aula teste"}',
 null,
 'A experimental e o que vende. Ninguem matricula um filho em algo que ele nao
experimentou — e ninguem volta para uma escola onde a primeira aula foi
confusa.
Explique COMO funciona: precisa agendar, qual turma, quanto dura, o que levar
(toalha, garrafa, touca, roupa) e se precisa de atestado. Duvida sobre o que
levar e a maior causa de falta.
Agende com data e hora exatas, na turma certa para a idade — experimental em
turma errada gera experiencia ruim.
Se a escola nao oferece experimental, nao invente: ofereca conhecer a estrutura
e assistir a uma aula.',
 '{"experimental.oferece","experimental.como_funciona"}',
 '{"experimental.o_que_levar","experimental.precisa_agendar","regras.atestado_medico"}', '{}', 'escalate',
 'Reducao de incerteza (o que levar e onde ir) para garantir presenca',
 '{"Marcar sem explicar o que levar","Colocar em turma de idade errada","Prometer experimental que a escola nao faz"}',
 'agendar_experimental', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'goal_matching', 'reactive',
 '{"meu filho tem","qual idade","serve pra crianca","tem turma pra ele","ele nunca praticou","qual modalidade indica"}',
 null,
 'Pergunta sobre a crianca e o momento de acolher a preocupacao do responsavel —
que quase nunca e sobre esporte: e sobre o filho se adaptar, nao se machucar e
gostar.
Descubra idade, se ja praticou e o objetivo da FAMILIA (saude, disciplina,
socializacao, gastar energia, competicao). O objetivo dos pais costuma ser
diferente do que a crianca diria.
Indique a turma pela idade e pelo nivel, explicando como o professor conduz
iniciante. Tranquilizar sobre a adaptacao vale mais que falar de metodologia.
Nunca prometa resultado ("vai ficar craque", "vai perder peso").',
 '{"modalidades.faixas_etarias"}',
 '{"modalidades.lista","estrutura.professores","modalidades.grade_horarios"}', '{}', 'escalate',
 'Acolhimento da preocupacao do responsavel + indicacao por idade e nivel',
 '{"Falar so de metodologia tecnica","Ignorar o medo de o filho nao se adaptar","Prometer resultado"}',
 'agendar_experimental', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'objections', 'reactive',
 '{"ta caro","muito caro","achei caro","nao cabe no orcamento","o outro cobra menos"}',
 null,
 '"Caro" em escola esportiva quase sempre significa "nao vejo ainda o que meu
filho ganha com isso".
Nao baixe o preco. Reconecte ao objetivo que o proprio responsavel trouxe
(disciplina, saude, socializacao) e mostre o que esta incluso: professor
formado, turma pequena, estrutura, acompanhamento.
Traga a conta por aula — mensalidade dividida pelo numero de aulas costuma soar
muito mais razoavel que o valor cheio.
Se houver plano semestral, desconto para irmaos ou matricula cortesia, e aqui.
Nunca fale mal da escola concorrente.',
 '{"pricing.range"}',
 '{"pricing.desconto_irmaos","estrutura.professores","modalidades.vagas_por_turma"}', '{}', 'escalate',
 'Reconexao ao objetivo da familia + valor por aula',
 '{"Dar desconto na primeira objecao","Falar mal do concorrente","Repetir o valor cheio sem quebrar por aula"}',
 'defender_valor', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'objections', 'reactive',
 '{"vou falar com meu marido","preciso ver com a mae","vou conversar em casa","depende do pai","o responsavel decide"}',
 null,
 'Decisao compartilhada e a norma aqui: quase sempre um responsavel pesquisa e o
outro participa da decisao. Isso nao e desculpa.
Ajude quem esta falando com voce a levar a informacao completa: valor, horario,
o que esta incluso e a data da experimental. Mande organizado, para ele apenas
mostrar.
Pergunte qual seria a duvida do outro — geralmente e valor ou distancia — e
responda antes.
Convide os dois para a experimental: decisao tomada junto, vendo o filho na
aula, fecha muito mais que decisao intermediada por mensagem.
Combine retorno com DATA.',
 '{}', '{"pricing.range","modalidades.grade_horarios"}', '{}', 'omit',
 'Municiar o defensor + convidar o decisor para a experimental',
 '{"Tratar como enrolacao","Deixar sem data de retorno","Mandar informacao desorganizada e dificil de repassar"}',
 'agendar_retorno', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'objections', 'reactive',
 '{"e longe","fica longe da minha casa","nao tenho como levar","quem leva","dificil de chegar"}',
 null,
 'Distancia e uma objecao logistica REAL — quem leva e busca costuma ser o gargalo
da familia, nao o dinheiro.
Nao tente convencer que "e pertinho". Trate o problema: existe turma em horario
que combina com a saida da escola ou do trabalho? Ha estacionamento? Outra
familia do bairro ja frequenta?
Se a escola tem turmas em varios horarios, ofereca o que reduz deslocamento
extra. Se ha estrutura para o responsavel esperar (espaco, wi-fi), mencione:
resolve a hora ociosa de quem espera.
Se realmente nao houver saida, seja honesto — indicar que nao vai funcionar
preserva a reputacao e traz indicacao depois.',
 '{}', '{"modalidades.grade_horarios","estrutura.instalacoes","estrutura.estacionamento"}', '{}', 'omit',
 'Tratar a logistica como problema real (nao como objecao a contornar)',
 '{"Insistir que e perto","Ignorar quem leva e busca","Nao oferecer horario que reduza deslocamento"}',
 'ajustar_horario', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'retention', 'proactive',
 '{"nao compareceu","faltou na experimental","nao veio","desmarcou","reagendar aula"}',
 null,
 'Falta na experimental e a maior perda evitavel do segmento — a familia estava
interessada e algo atrapalhou (esqueceu, imprevisto, insegurança).
Reagende no dia seguinte, sem cobranca e sem culpa. Uma mensagem cordial com
DUAS novas opcoes recupera boa parte.
Aproveite para remover o obstaculo: confirme o que levar, o horario e onde
entrar — muitas faltas sao por duvida boba, nao por desinteresse.
Se faltar de novo, espace o contato e mude o angulo. Insistir queima.',
 '{}', '{"modalidades.grade_horarios","experimental.o_que_levar"}', '{}', 'omit',
 'Recuperacao imediata do no-show + remocao do obstaculo',
 '{"Deixar quem faltou sem contato","Cobrar explicacao","Reagendar sem confirmar o que levar"}',
 'reagendar_experimental', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'retention', 'proactive',
 '{"pos experimental","como foi a aula","gostou da aula","depois da experimental","fechar matricula"}',
 null,
 'ENTRADA MAIS IMPORTANTE. O melhor momento para matricular e nas 24h seguintes a
experimental, enquanto a crianca ainda esta empolgada e o responsavel viu o
filho participando.
Pergunte primeiro como FOI para ele — a resposta te da o argumento. Se a crianca
gostou, o responsavel ja esta convencido e falta so o operacional.
Traga a vaga da turma como urgencia honesta: se a turma tem lugares contados,
diga. Isso e verdade e acelera decisao sem pressao artificial.
Deixe o proximo passo trivial: o que precisa para matricular, o que levar e a
data da primeira aula.',
 '{}', '{"modalidades.vagas_por_turma","pricing.matricula","regras.atestado_medico"}', '{}', 'omit',
 'Fechamento no pico de empolgacao + urgencia honesta pela vaga',
 '{"Esperar a familia voltar sozinha","Perguntar se gostou e nao propor a matricula","Inventar urgencia que nao existe"}',
 'fechar_matricula', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'retention', 'proactive',
 '{"aluno faltando","parou de vir","desanimou","vai trancar","quer cancelar","evasao"}',
 null,
 'Evasao mata escola esportiva silenciosamente: o aluno falta, some e so avisa
quando ja decidiu sair.
Falta seguida e sinal de alerta ANTES do cancelamento. Chame cedo, com cuidado e
sem cobranca — o motivo costuma ser mudanca de rotina, dificuldade de adaptacao
na turma, atrito com colega ou perda de motivacao.
Fale com o RESPONSAVEL quando for menor, e ofereca saida concreta: trocar de
turma ou horario, conversar com o professor, ou uma pausa combinada com data de
volta.
Trancar com data marcada retem muito mais que deixar cancelar.',
 '{}', '{"modalidades.grade_horarios","estrutura.professores"}', '{}', 'omit',
 'Intervencao na FALTA (antes do pedido de cancelamento)',
 '{"Esperar o pedido de cancelamento","Cobrar a ausencia","Nao oferecer troca de turma ou pausa com data"}',
 'reter_aluno', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'expertise_proof', 'reactive',
 '{"quem da aula","o professor e formado","tem experiencia","quantos alunos por turma","e seguro"}',
 null,
 'Confiar um filho a alguem e a decisao mais sensivel deste segmento. A pergunta
sobre o professor e, na verdade, sobre seguranca.
Responda com fatos: formacao, tempo de experiencia, quantos alunos por turma e
como e o acompanhamento de iniciante. Turma pequena e um argumento forte —
significa olhar individual.
Se ha estrutura de seguranca relevante (profissional na borda da piscina,
tatame adequado, protocolo), mencione.
Convide para conhecer e assistir a uma aula: ver o professor com as criancas
convence mais que qualquer descricao.',
 '{"estrutura.professores"}',
 '{"modalidades.vagas_por_turma","estrutura.instalacoes"}', '{}', 'escalate',
 'Prova de seguranca por fato + convite para ver a aula',
 '{"Responder com adjetivo","Omitir o tamanho da turma quando e grande","Nao convidar para conhecer"}',
 'agendar_visita', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'catalog', 'reactive',
 '{"voces tem natacao","tem judo","fazem hidroginastica","tem aula para adulto","atende idoso","tem turma para bebe"}',
 null,
 'Confirme usando SOMENTE a lista do DNA e a faixa etaria de cada modalidade.
Dizer que atende uma idade que a turma nao comporta gera frustracao na primeira
aula.
Nao tem? Diga com naturalidade e ofereca a modalidade mais proxima do objetivo
dele — muita gente chega pedindo uma coisa e fecha em outra quando entende a
diferenca.
Tem? Confirme, diga os horarios que servem para a idade e conduza a
experimental.',
 '{"modalidades.lista","modalidades.faixas_etarias"}',
 '{"modalidades.grade_horarios","pricing.range"}', '{}', 'escalate',
 'Confirmacao factual por idade + alternativa por objetivo',
 '{"Aceitar idade fora da faixa da turma","Dizer que tem modalidade que nao existe","Nao oferecer alternativa"}',
 'agendar_experimental', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'commitment_offer', 'reactive',
 '{"tem plano semestral","desconto se pagar tudo","tem pacote","vale mais a pena anual","desconto para irmaos"}',
 null,
 'Quem pergunta de plano longo ja decidiu ficar — falta o formato.
Mostre a conta fechada: quanto economiza no semestre ou no ano em relacao ao
mensal. Numero convence mais que adjetivo.
Reforce o beneficio que a familia valoriza: valor travado (sem reajuste no meio
do ano) e vaga garantida na turma.
Para familia com mais de um filho, o desconto de irmaos costuma ser o que
decide — traga sem esperar ele perguntar.
Nunca prometa condicao que a escola nao pratica.',
 '{"pricing.range"}',
 '{"pricing.desconto_irmaos","pricing.formas_pagamento","modalidades.vagas_por_turma"}', '{}', 'escalate',
 'Diluicao com conta fechada + valor travado + desconto familia',
 '{"Falar do plano sem mostrar a economia","Empurrar anual para quem ainda nao experimentou","Esconder o desconto de irmaos"}',
 'fechar_plano', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'limits_and_ethics', 'reactive',
 '{"precisa de atestado","ele tem problema de saude","tem asma","teve lesao","pode fazer mesmo com","e seguro pra ele"}',
 null,
 'Saude de aluno — especialmente crianca — nao admite improviso.
Informe com clareza a regra da escola sobre atestado medico e o que e exigido.
Isso protege o aluno e a escola.
NUNCA opine sobre condicao de saude, nem diga que "pode fazer sem problema".
Quem libera e o medico. Acolha a preocupacao, informe a regra e diga que o
professor adapta a atividade dentro do que o medico autorizar.
Nao prometa que a atividade vai tratar, curar ou melhorar uma condicao —
mesmo quando a familia insiste.',
 '{}', '{"regras.atestado_medico","regras.idade_minima","estrutura.professores"}',
 '{"Nunca opinar sobre condicao de saude nem liberar atividade"}', 'omit',
 'Acolher a preocupacao sem opinar sobre saude',
 '{"Dizer que pode fazer sem restricao","Prometer melhora de condicao de saude","Ignorar a exigencia de atestado para nao perder a matricula"}',
 'orientar_atestado', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'reciprocity', 'reactive',
 '{"oi","ola","bom dia","boa tarde","boa noite","queria informacoes","gostaria de saber sobre as aulas"}',
 null,
 'Abertura aqui e acolhimento: quem procura escola esportiva geralmente esta
pensando no filho, e quer sentir que vai ser bem cuidado.
Cumprimente com o nome e pergunte PARA QUEM e a aula e a idade — essas duas
respostas direcionam tudo o que vem depois e evitam mandar informacao errada.
Nao dispare tabela de precos nem a grade inteira na primeira mensagem.
Responda rapido: familia costuma consultar tres escolas no mesmo dia, e a
primeira que acolhe bem sai na frente.',
 '{}', '{"modalidades.lista","modalidades.faixas_etarias"}', '{}', 'omit',
 'Acolhimento + duas perguntas que direcionam (para quem e que idade)',
 '{"Mandar tabela e grade de imediato","\"Como posso ajudar?\" e esperar","Demorar para responder"}',
 'qualificar', 'skill_seed', 'active'),

(null, 'escola_esportiva', 'ecosystem', 'reactive',
 '{"tem convenio","escola parceira","desconto empresa","indicacao de amigo","trouxe um colega"}',
 null,
 'Indicacao e convenio sao a captacao mais barata deste segmento: crianca puxa
crianca, e familia confia em quem ja frequenta.
O melhor momento de pedir indicacao e logo apos um elogio ou uma conquista do
aluno (faixa, prova, evolucao) — nunca durante negociacao de preco.
Se ha convenio com escola, empresa ou clube, confirme com exatidao qual e o
beneficio. Errar convenio gera constrangimento na recepcao.
Se ha recompensa por indicacao, diga qual e para os DOIS lados. Se nao ha,
agradeca de forma concreta assim mesmo — e reconheça publicamente quando puder.',
 '{}', '{"pricing.desconto_irmaos","modalidades.lista"}', '{}', 'omit',
 'Indicacao no pico de orgulho (conquista do aluno)',
 '{"Pedir indicacao durante negociacao","Prometer convenio sem confirmar","Nao reconhecer quem indicou"}',
 'pedir_indicacao', 'skill_seed', 'active');
