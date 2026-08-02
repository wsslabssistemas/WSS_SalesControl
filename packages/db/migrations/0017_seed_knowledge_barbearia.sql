-- =====================================================================
-- COS — MIGRATION 0017 : BIBLIOTECA COMERCIAL DA BARBEARIA
--
-- Product seed: dado que É o produto. É a curadoria — o ativo que não se
-- copia em duas semanas. Roda em todo ambiente.
--
-- FUNDAMENTO (pesquisa de mercado, jul/2026):
--   • Cliente fiel volta a cada ~21 dias; 2 semanas (degradê curto) a 3–4
--     semanas (corte médio + barba). Rende 17–24 visitas/ano.
--   • Ticket médio nacional de corte R$35–45 (Sebrae 2024). A diferença
--     entre 10 e 22 visitas/ano é R$540–990 POR CLIENTE.
--   • Barbearia com retorno programado (agenda fixa, mesmo dia/horário)
--     retém muito mais do que a que espera o cliente lembrar.
--   • Homem valoriza: praticidade, ambiente, atendimento customizado e o
--     momento de pausa. Assinatura/clube é tendência forte (caso real:
--     R$89/mês por 2 cortes + 1 barba migrou 40% dos regulares em 3 meses).
--   • "Está caro" quase nunca é sobre preço — é valor mal comunicado.
--     Responder com pergunta reflexiva, nunca atacar concorrente.
--
-- CONSEQUÊNCIA PARA AS RESPOSTAS: o objetivo de quase toda conversa aqui
-- não é "vender um corte", é AGENDAR O PRÓXIMO e instalar o ciclo.
-- =====================================================================

-- Recarga idempotente da biblioteca do segmento (não toca em conteúdo do tenant).
delete from public.knowledge_entries
 where skill_key = 'barbearia' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

-- ---------------------------------------------------------------- PREÇO
(null, 'barbearia', 'pricing', 'reactive',
 '{"quanto custa","qual o valor","qual o preco","quanto e o corte","valor do corte","tabela de precos","quanto ta o corte"}',
 null,
 'Entregue o valor de forma direta e sem rodeio. Homem que pergunta preco quer
resposta, nao discurso — enrolar aqui derruba a conversa e ele vai no concorrente.
Diga o valor do servico perguntado, e SOMENTE depois ofereca o proximo passo
concreto: um horario. Se existir combo corte+barba com vantagem, mencione em
uma linha como opcao, nunca como empurrao.
A pergunta de preco e uma chance de agendar, nao de negociar.',
 '{"pricing.range"}', '{"catalog.items","pricing.plans"}', '{}', 'escalate',
 'Transparencia (Hormozi) + fechamento por alternativa',
 '{"Enrolar ou fugir do valor: derruba a confianca na hora","Despejar a tabela inteira quando ele perguntou um servico so","Responder o preco e nao oferecer horario: a conversa morre"}',
 'oferecer_horario', 'skill_seed', 'active', null),

(null, 'barbearia', 'objections', 'reactive',
 '{"ta caro","muito caro","achei caro","ta salgado","o outro cobra menos","mais barato ali"}',
 null,
 '"Esta caro" quase nunca e sobre dinheiro — e valor que ainda nao ficou claro.
NAO baixe o preco e NUNCA fale mal da concorrencia (soa pequeno e defende o outro).
Reconheca sem se desculpar, traga UM diferencial concreto e verdadeiro do que
esta no DNA (tempo do profissional, acabamento, produto usado, ambiente), e
devolva o foco para o resultado: cabelo que dura ate a proxima.
Se houver plano/pacote, aqui e a hora: dilua o valor no mes, com o numero real.',
 '{"differentials.items"}', '{"pricing.plans","pricing.range"}', '{}', 'escalate',
 'Ancoragem em valor + reformulacao (Voss). Nunca desconto reflexo.',
 '{"Dar desconto na primeira objecao: ensina o cliente a sempre pedir","Falar mal do concorrente","Justificar o preco com custo proprio — o cliente nao paga o seu custo"}',
 'defender_valor', 'skill_seed', 'active', null),

(null, 'barbearia', 'commitment_offer', 'proactive',
 '{"tem plano","tem pacote","tem mensalidade","assinatura","clube","desconto pra vir sempre","vale a pena o pacote"}',
 null,
 'Cliente que pergunta de plano ja decidiu que vai voltar — falta so o formato.
Apresente o plano com a CONTA FEITA: quanto ele gastaria avulso no mes contra o
valor do plano. Numero fechado convence mais que adjetivo.
Reforce o beneficio que o homem realmente valoriza: prioridade na agenda e nao
precisar lembrar de marcar toda vez.
Se a barbearia ainda nao tem plano, nao invente: ofereca agendar o proximo ja
na saida deste, que produz o mesmo efeito de recorrencia.',
 '{"pricing.plans"}', '{"pricing.range","availability.booking_rule"}', '{}', 'escalate',
 'Diluicao de valor + aversao a perda',
 '{"Falar do plano sem mostrar a economia em numero","Empurrar plano para quem veio a primeira vez e ainda nao confia","Prometer condicao que nao existe na tabela"}',
 'fechar_plano', 'skill_seed', 'active', null),

-- ------------------------------------------------------------- AGENDA
(null, 'barbearia', 'availability', 'reactive',
 '{"que horas abre","qual o horario","funciona domingo","abre no sabado","ate que horas","tem horario hoje","tem vaga hoje"}',
 null,
 'Responda o horario com exatidao — e emende com o agendamento na mesma mensagem.
Nunca deixe a pessoa com a informacao solta: quem pergunta horario esta com
intencao quente, e cada resposta sem oferta de horario perde um cliente.
Ofereca DUAS opcoes concretas (fechamento por alternativa), nao um "quando voce
pode?". Duas opcoes decidem; pergunta aberta adia.',
 '{"availability.weekly_hours"}', '{"availability.booking_rule","location_contact.address"}', '{}', 'escalate',
 'Fechamento por alternativa (duas opcoes de horario)',
 '{"Responder so o horario de funcionamento e parar","Perguntar \"que dia voce pode?\" — devolve o trabalho ao cliente","Dizer que esta cheio sem oferecer a proxima janela"}',
 'agendar', 'skill_seed', 'active', null),

(null, 'barbearia', 'availability', 'reactive',
 '{"precisa agendar","tem que marcar","posso chegar","atende por ordem de chegada","tem fila"}',
 null,
 'Diga a regra da casa com clareza (agendamento, ordem de chegada ou os dois).
Se for por agendamento, venda o beneficio, nao a burocracia: e para ele nao
esperar. Se for por ordem de chegada, informe os horarios de menor movimento —
isso e informacao util e gera reciprocidade.
Em qualquer caso, termine oferecendo um horario.',
 '{"availability.booking_rule"}', '{"availability.weekly_hours"}', '{}', 'escalate',
 'Reducao de atrito + reciprocidade informativa',
 '{"Apresentar o agendamento como regra chata em vez de vantagem","Nao dizer o horario de menor fila quando e por ordem de chegada"}',
 'agendar', 'skill_seed', 'active', null),

-- ----------------------------------------------------------- SERVICOS
(null, 'barbearia', 'catalog', 'reactive',
 '{"faz barba","fazem sobrancelha","tem pigmentacao","faz luzes","platinado","corta infantil","faz relaxamento","tem limpeza de pele"}',
 null,
 'Confirme se o servico existe usando SOMENTE a lista do DNA. Nao existe? Diga
com naturalidade e ofereca o que existe e mais se aproxima — sem inventar e sem
prometer "da um jeito".
Existe? Diga o valor e o tempo aproximado, e emende com horario.
Se o servico combina com o corte (barba, sobrancelha), ofereca o combo aqui:
e o momento natural de aumentar o ticket sem parecer venda.',
 '{"catalog.items"}', '{"pricing.range"}', '{}', 'escalate',
 'Confirmacao factual + venda combinada no momento certo',
 '{"Dizer que faz um servico que a casa nao faz","Chutar tempo de execucao","Perder a chance do combo quando o servico e complementar"}',
 'oferecer_horario', 'skill_seed', 'active', null),

-- ----------------------------------------------------- PRIMEIRA VISITA
(null, 'barbearia', 'risk_free_entry', 'reactive',
 '{"nunca fui ai","primeira vez","sou novo aqui","conheci agora","vi no instagram","me indicaram"}',
 null,
 'Primeira vez e o momento de maior risco percebido: ele teme sair com um corte
ruim e ter que conviver com isso por semanas. Reduza esse medo.
Acolha em uma linha, cite o diferencial que prova cuidado (conversa antes de
cortar, acabamento, profissional experiente) e ofereca horario.
Se existe oferta de entrada, use — mas o principal redutor de risco aqui e a
sensacao de que vao ESCUTAR o que ele quer antes de passar a maquina.',
 '{"differentials.items"}', '{"risk_free_entry.exists","risk_free_entry.offer","location_contact.address"}', '{}', 'escalate',
 'Reducao de risco percebido + acolhimento (a experiencia e o produto)',
 '{"Tratar o novo igual ao antigo: perde a chance de encantar","Comecar por preco com quem ainda nao confia","Nao explicar como funciona a primeira visita"}',
 'agendar_primeira', 'skill_seed', 'active', null),

-- ----------------------------------------------------- O CICLO (CORE)
(null, 'barbearia', 'retention', 'proactive',
 '{"faz tempo que nao venho","sumido","ta na hora do corte","preciso cortar","to precisando dar um trato"}',
 null,
 'ESTA E A ENTRADA MAIS IMPORTANTE DO SEGMENTO. Barbearia vive de recompra:
o fiel volta a cada ~21 dias e rende 17 a 24 visitas por ano. Quem espera o
cliente lembrar sozinho perde metade dessas visitas.
Fale como quem conhece o cliente, nao como cobranca: use o ciclo dele
(frequencia e dia preferido) para SUGERIR um horario especifico, ja pronto.
"Ta na sua semana, sabado 10h ta livre — quer que eu segure?" funciona muito
melhor que "aparece quando puder".
Nunca cobre a ausencia nem use culpa. Curto, cordial, com horario na mao.',
 '{}', '{"availability.weekly_hours","pricing.range"}', '{}', 'omit',
 'Retorno programado — sugerir o horario em vez de pedir que ele marque',
 '{"Cobrar a ausencia (\"sumiu, hein\"): afasta","Mandar mensagem generica sem horario","Insistir em sequencia quando ele nao respondeu: espace e mude o angulo"}',
 'agendar_retorno', 'skill_seed', 'active', null),

(null, 'barbearia', 'retention', 'proactive',
 '{"reativacao","cliente parado","nao vem ha meses","recuperar cliente","ficou muito tempo sem vir"}',
 null,
 'Cliente parado ha muito tempo exige angulo DIFERENTE do que ele ja conhece —
repetir a mesma oferta so confirma a decisao dele de nao voltar.
Traga uma novidade real da casa (profissional novo, servico novo, horario novo)
ou um gancho pessoal e concreto. Uma mensagem, sem cobranca, com porta aberta.
Se nao responder, pare e espere o proximo ciclo: insistir queima o contato.
Recuperar cliente antigo custa muito menos que conquistar um novo — mas so
funciona sem pressao.',
 '{}', '{"catalog.items","differentials.items"}', '{}', 'omit',
 'Reativacao por novidade + porta aberta (sem culpa, sem insistencia)',
 '{"Repetir a mesma oferta de sempre","Mandar varias mensagens seguidas","Fingir intimidade que nao existe"}',
 'reativar', 'skill_seed', 'active', null),

(null, 'barbearia', 'retention', 'proactive',
 '{"pos atendimento","depois do corte","agradecer","como ficou","proximo agendamento"}',
 null,
 'O melhor momento para instalar o ciclo e logo depois do corte, quando ele esta
satisfeito e se olhando no espelho. Barbearia que agenda o proximo AINDA NA
CADEIRA retem muito mais do que a que espera o cliente voltar sozinho.
No pos-atendimento: agradeca em uma linha, pergunte se ficou do jeito que ele
queria (isso resgata problema antes de virar cliente perdido) e ja proponha a
data do proximo pelo ciclo dele.',
 '{}', '{"availability.weekly_hours"}', '{}', 'omit',
 'Ancoragem do proximo agendamento no pico de satisfacao',
 '{"Deixar o proximo agendamento por conta do cliente","Perguntar se gostou e nao fazer nada com a resposta","Mandar so \"obrigado pela preferencia\": nao produz retorno"}',
 'agendar_proximo', 'skill_seed', 'active', null),

-- ------------------------------------------------------------ FALTAS
-- Era 'policies', categoria que não existe no manifesto (corrigido em ago/2026
-- pelo library_check). Recuperar quem faltou é retenção — mesmo destino que a
-- entrada equivalente da escola esportiva.
(null, 'barbearia', 'retention', 'reactive',
 '{"nao vou poder ir","preciso desmarcar","vou atrasar","remarcar","perdi o horario","faltei"}',
 null,
 'Remarcar bem e retencao. Nao demonstre irritacao — a falta ja aconteceu e o
custo de perder o cliente e maior que o do horario vago.
Confirme a regra da casa se houver, e imediatamente ofereca DUAS novas opcoes.
Quem desmarca com aviso e um cliente que se importa: trate como tal.
Para quem faltou sem avisar, uma mensagem cordial no dia seguinte com um horario
concreto recupera boa parte deles.',
 '{"policies.no_show"}', '{"availability.weekly_hours","policies.cancellation"}', '{}', 'omit',
 'Recuperacao imediata com alternativa (nunca punir na conversa)',
 '{"Cobrar explicacao","Deixar sem remarcar: e assim que o cliente some","Aplicar politica com aspereza — a regra existe, o tom nao precisa"}',
 'remarcar', 'skill_seed', 'active', null),

-- ------------------------------------------------------- PROFISSIONAL
(null, 'barbearia', 'expertise_proof', 'reactive',
 '{"quem corta","qual barbeiro","com quem eu marco","o fulano ta","quero com o mesmo de sempre","tem barbeiro bom pra degrade"}',
 null,
 'Preferencia por profissional e o sinal mais forte de fidelizacao que existe
nesse ramo — o vinculo e com a pessoa, nao com a loja. Respeite sempre.
Confirme a agenda do profissional pedido. Se ele nao tiver horario, NUNCA
empurre outro como se fosse igual: ofereca a proxima janela dele E, como
alternativa, outro profissional apresentado pela especialidade concreta.
Registre a preferencia — ela orienta todos os proximos contatos.',
 '{}', '{"availability.weekly_hours","differentials.items"}', '{}', 'omit',
 'Respeito ao vinculo + alternativa qualificada',
 '{"Trocar o barbeiro sem avisar: quebra a confianca","Dizer \"e tudo igual aqui\" — para ele nao e","Nao registrar a preferencia e errar no proximo contato"}',
 'agendar_com_preferido', 'skill_seed', 'active', null),

-- ----------------------------------------------------------- LOCAL
(null, 'barbearia', 'goal_matching', 'reactive',
 '{"onde fica","qual o endereco","como chego","tem estacionamento","e perto de onde"}',
 null,
 'Mande o endereco completo e o ponto de referencia — e, se houver, a informacao
de estacionamento, que e decisiva para quem vai de carro.
Emende com horario: quem pergunta onde fica esta decidindo ir agora.',
 '{"location_contact.address"}', '{"availability.weekly_hours","differentials.items"}', '{}', 'escalate',
 'Reducao de atrito fisico + agendamento na sequencia',
 '{"Mandar so o endereco sem referencia","Nao aproveitar o sinal de intencao para agendar"}',
 'agendar', 'skill_seed', 'active', null),

-- --------------------------------------------------------- ECOSSISTEMA
(null, 'barbearia', 'ecosystem', 'reactive',
 '{"vende produto","tem pomada","qual produto voce usa","onde compro","indica um shampoo"}',
 null,
 'Pergunta sobre produto e oportunidade dupla: ticket adicional e prova de
autoridade tecnica. Responda o que usou e por que serve ao cabelo DELE — o
motivo tecnico e o que converte, nao a marca.
Se a casa vende, ofereca com naturalidade. Se nao vende, indique mesmo assim:
a honestidade aqui gera reciprocidade e ele volta.
Nunca prometa resultado que o produto nao entrega.',
 '{}', '{"catalog.items","differentials.items"}', '{}', 'omit',
 'Autoridade tecnica + reciprocidade',
 '{"Empurrar produto sem explicar o porque","Prometer resultado exagerado","Nao indicar nada quando a casa nao vende: perde autoridade"}',
 'venda_adicional', 'skill_seed', 'active', null),

-- --------------------------------------------------------- LIMITES
(null, 'barbearia', 'limits_and_ethics', 'reactive',
 '{"nao gostei do corte","ficou ruim","cortou demais","nao era isso que eu queria","ficou torto"}',
 null,
 'Insatisfacao com o corte e o momento mais delicado do ramo — o cliente vai
conviver com o resultado por semanas e esta se sentindo exposto.
NUNCA discuta nem justifique tecnica. Acolha, assuma o desconforto dele como
legitimo e chame para ajustar presencialmente o quanto antes.
A maioria dos casos se resolve com um retoque e o cliente sai mais fiel do que
antes. Discutir por mensagem perde o cliente e vira avaliacao ruim.
Nao prometa devolucao ou cortesia que a casa nao pratica.',
 '{}', '{"policies.no_show","availability.weekly_hours"}', '{}', 'omit',
 'Acolhimento + recuperacao de servico (chamar para o presencial)',
 '{"Explicar por que tecnicamente esta certo: ele nao quer aula","Discutir por mensagem","Prometer reembolso sem saber a politica da casa"}',
 'ajustar_presencial', 'skill_seed', 'active', null),

-- ------------------------------------------------------- ABORDAGEM
(null, 'barbearia', 'reciprocity', 'reactive',
 '{"oi","ola","bom dia","boa tarde","boa noite","tudo bem","opa"}',
 null,
 'Saudacao seca ("Bom dia, como posso ajudar?") desperdiça o contato.
Responda com cordialidade curta e ja ofereca o caminho: corte, barba ou os dois,
e um horario. O homem que chama a barbearia quase sempre quer marcar — poupe
etapas.
Se e cliente conhecido, use o nome e o servico de sempre: reconhecimento e o que
mais fideliza nesse ramo.',
 '{}', '{"availability.weekly_hours","catalog.items"}', '{}', 'omit',
 'Abertura com direcao (evita a conversa que nao anda)',
 '{"\"Como posso ajudar?\" e esperar: joga o trabalho no cliente","Nao reconhecer cliente antigo","Responder com bloco de texto longo"}',
 'oferecer_horario', 'skill_seed', 'active', null),

-- ⚠ Aqui havia um `;` que encerrava o INSERT no meio do arquivo, deixando as
-- 3 últimas entradas órfãs — SQL inválido, e o carregador lia só 16 de 19.
-- Achado em ago/2026 pela trava nova do library_check.

-- ------------------------------------------------- CONFIRMACAO (anti-furo)
-- Pesquisa: a ociosidade e o maior gargalo do ramo; cada furo de 45 min e
-- receita que nao volta. Lembrete + confirmacao reduzem drasticamente a falta.
-- Idem: confirmação de véspera é agenda, como já era na clínica.
(null, 'barbearia', 'availability', 'proactive',
 '{"confirmar horario","lembrete","confirmacao de agendamento","vespera","voce vem amanha"}',
 null,
 'Confirmar o horario na vespera e a acao de maior retorno financeiro do ramo:
cadeira vazia nao se recupera. Mande curto, com dia, hora e profissional, e peca
uma confirmacao de uma palavra — quanto menor o esforco de responder, maior a
taxa de confirmacao.
Se a casa cobra sinal ou tem politica de falta, informe com naturalidade AGORA,
nunca depois que ele faltou.
Se ele nao puder, ja ofereca outro horario na mesma mensagem: assim voce troca
um furo por um remarcado.',
 '{}', '{"policies.no_show","availability.weekly_hours"}', '{}', 'omit',
 'Confirmacao de vespera com resposta de baixo atrito + troca imediata',
 '{"Confirmar em cima da hora: nao da tempo de preencher a vaga","Mensagem longa que exige leitura","Avisar da politica de falta so depois que faltou"}',
 'confirmar_presenca', 'skill_seed', 'active', null),

-- ------------------------------------------------------------- INDICACAO
-- Pesquisa: member-get-member converte mais e traz cliente mais fiel.
(null, 'barbearia', 'reciprocity', 'proactive',
 '{"indicacao","indicar amigo","trouxe um amigo","programa de indicacao","quem me indicou"}',
 null,
 'Indicacao e a captacao mais barata e a que traz o cliente mais fiel neste ramo.
O momento certo de pedir e logo depois de um elogio ou de um corte que ele gostou
— nunca no meio da negociacao de preco.
Peca de forma concreta e facil ("manda meu contato pra alguem que voce sabe que
ta precisando"), nao de forma vaga. Se existe recompensa cadastrada, diga qual e
e para os DOIS lados. Se nao existe, agradeca de forma concreta assim mesmo.
Nunca invente premio que a casa nao pratica.',
 '{}', '{"pricing.range","differentials.items"}', '{}', 'omit',
 'Member-get-member no pico de satisfacao + reciprocidade de mao dupla',
 '{"Pedir indicacao antes de entregar valor","Pedido vago (\"indica ai\")","Prometer recompensa que a casa nao tem"}',
 'pedir_indicacao', 'skill_seed', 'active', null),

(null, 'barbearia', 'commitment_offer', 'reactive',
 '{"vou ver e te falo","depois eu marco","qualquer coisa eu chamo","vou pensar no horario","ainda nao sei se vou","te aviso"}',
 null,
 'Aqui o valor e baixo e o cliente ja quis — o que trava e a agenda dele, nao a
sua barbearia. Tratar isso como objecao de preco e o erro.
Nao pergunte "que dia fica bom para voce". Pergunta aberta joga o trabalho de
decidir de volta para quem ja esta travado, e a conversa morre ali.
RECOMENDE DOIS horarios concretos e proximos, e so dois. Duas opcoes decidem;
cinco viram lista para pensar depois.
Tire o risco: diga que da para remarcar se aparecer imprevisto, quando isso for
verdade na casa. Saber que nao esta preso resolve boa parte do adiamento — e
quem remarca volta, quem nao marcou some.
Se mesmo assim ele adiar, encerre leve e sem cobranca, deixando o proximo passo
combinado. Insistencia em barbearia queima a relacao, que e o ativo.',
 '{"catalog.items"}',
 '{"policies.cancellation","availability.booking_rule","availability.weekly_hours"}', '{}', 'omit',
 'Duas opcoes concretas + remarcacao sem atrito (nunca pergunta aberta)',
 '{"Perguntar que dia fica bom","Mandar a agenda inteira","Insistir depois do segundo nao","Tratar adiamento como objecao de preco"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt');
