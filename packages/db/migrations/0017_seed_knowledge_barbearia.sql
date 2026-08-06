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
 '{"quanto custa","qual o valor","qual o preço","quanto é o corte","valor do corte","tabela de preços","quanto tá o corte"}',
 null,
 'Entregue o valor de forma direta e sem rodeio. Homem que pergunta preço quer
resposta, não discurso — enrolar aqui derruba a conversa e ele vai no concorrente.
Diga o valor do serviço perguntado, e SOMENTE depois ofereça o próximo passo
concreto: um horário. Se existir combo corte+barba com vantagem, mencione em
uma linha como opção, nunca como empurrão.
A pergunta de preço é uma chance de agendar, não de negociar.',
 '{"pricing.range"}', '{"catalog.items","pricing.plans"}', '{}', 'escalate',
 'Transparência (Hormozi) + fechamento por alternativa',
 '{"Enrolar ou fugir do valor: derruba a confiança na hora","Despejar a tabela inteira quando ele perguntou um serviço só","Responder o preço e não oferecer horário: a conversa morre"}',
 'oferecer_horario', 'skill_seed', 'active', null),

(null, 'barbearia', 'objections', 'reactive',
 '{"tá caro","muito caro","achei caro","tá salgado","o outro cobra menos","mais barato ali"}',
 null,
 '"Está caro" quase nunca é sobre dinheiro — é valor que ainda não ficou claro.
NÃO baixe o preço e NUNCA fale mal da concorrência (soa pequeno e defende o outro).
Reconheça sem se desculpar, traga UM diferencial concreto e verdadeiro do que
está no DNA (tempo do profissional, acabamento, produto usado, ambiente), e
devolva o foco para o resultado: cabelo que dura até a próxima.
Se houver plano/pacote, aqui é a hora: dilua o valor no mês, com o número real.',
 '{"differentials.items"}', '{"pricing.plans","pricing.range"}', '{}', 'escalate',
 'Ancoragem em valor + reformulação (Voss). Nunca desconto reflexo.',
 '{"Dar desconto na primeira objeção: ensina o cliente a sempre pedir","Falar mal do concorrente","Justificar o preço com custo próprio — o cliente não paga o seu custo"}',
 'defender_valor', 'skill_seed', 'active', null),

(null, 'barbearia', 'commitment_offer', 'proactive',
 '{"tem plano","tem pacote","tem mensalidade","assinatura","clube","desconto pra vir sempre","vale a pena o pacote"}',
 null,
 'Cliente que pergunta de plano já decidiu que vai voltar — falta só o formato.
Apresente o plano com a CONTA FEITA: quanto ele gastaria avulso no mês contra o
valor do plano. Número fechado convence mais que adjetivo.
Reforce o benefício que o homem realmente valoriza: prioridade na agenda e não
precisar lembrar de marcar toda vez.
Se a barbearia ainda não tem plano, não invente: ofereça agendar o próximo já
na saída deste, que produz o mesmo efeito de recorrência.',
 '{"pricing.plans"}', '{"pricing.range","availability.booking_rule"}', '{}', 'escalate',
 'Diluição de valor + aversão a perda',
 '{"Falar do plano sem mostrar a economia em número","Empurrar plano para quem veio a primeira vez e ainda não confia","Prometer condição que não existe na tabela"}',
 'fechar_plano', 'skill_seed', 'active', null),

-- ------------------------------------------------------------- AGENDA
(null, 'barbearia', 'availability', 'reactive',
 '{"que horas abre","qual o horário","funciona domingo","abre no sábado","até que horas","tem horário hoje","tem vaga hoje"}',
 null,
 'Responda o horário com exatidão — e emende com o agendamento na mesma mensagem.
Nunca deixe a pessoa com a informação solta: quem pergunta horário está com
intenção quente, e cada resposta sem oferta de horário perde um cliente.
Ofereça DUAS opções concretas (fechamento por alternativa), não um "quando você
pode?". Duas opções decidem; pergunta aberta adia.',
 '{"availability.weekly_hours"}', '{"availability.booking_rule","location_contact.address"}', '{}', 'escalate',
 'Fechamento por alternativa (duas opções de horário)',
 '{"Responder só o horário de funcionamento e parar","Perguntar \"que dia você pode?\" — devolve o trabalho ao cliente","Dizer que está cheio sem oferecer a próxima janela"}',
 'agendar', 'skill_seed', 'active', null),

(null, 'barbearia', 'availability', 'reactive',
 '{"precisa agendar","tem que marcar","posso chegar","atende por ordem de chegada","tem fila"}',
 null,
 'Diga a regra da casa com clareza (agendamento, ordem de chegada ou os dois).
Se for por agendamento, venda o benefício, não a burocracia: é para ele não
esperar. Se for por ordem de chegada, informe os horários de menor movimento —
isso é informação útil e gera reciprocidade.
Em qualquer caso, termine oferecendo um horário.',
 '{"availability.booking_rule"}', '{"availability.weekly_hours"}', '{}', 'escalate',
 'Redução de atrito + reciprocidade informativa',
 '{"Apresentar o agendamento como regra chata em vez de vantagem","Não dizer o horário de menor fila quando é por ordem de chegada"}',
 'agendar', 'skill_seed', 'active', null),

-- ----------------------------------------------------------- SERVIÇOS
(null, 'barbearia', 'catalog', 'reactive',
 '{"faz barba","fazem sobrancelha","tem pigmentação","faz luzes","platinado","corta infantil","faz relaxamento","tem limpeza de pele"}',
 null,
 'Confirme se o serviço existe usando SOMENTE a lista do DNA. Não existe? Diga
com naturalidade e ofereça o que existe e mais se aproxima — sem inventar e sem
prometer "dá um jeito".
Existe? Diga o valor e o tempo aproximado, e emende com horário.
Se o serviço combina com o corte (barba, sobrancelha), ofereça o combo aqui:
é o momento natural de aumentar o ticket sem parecer venda.',
 '{"catalog.items"}', '{"pricing.range"}', '{}', 'escalate',
 'Confirmação factual + venda combinada no momento certo',
 '{"Dizer que faz um serviço que a casa não faz","Chutar tempo de execução","Perder a chance do combo quando o serviço é complementar"}',
 'oferecer_horario', 'skill_seed', 'active', null),

-- ----------------------------------------------------- PRIMEIRA VISITA
(null, 'barbearia', 'risk_free_entry', 'reactive',
 '{"nunca fui aí","primeira vez","sou novo aqui","conheci agora","vi no instagram","me indicaram"}',
 null,
 'Primeira vez é o momento de maior risco percebido: ele teme sair com um corte
ruim e ter que conviver com isso por semanas. Reduza esse medo.
Acolha em uma linha, cite o diferencial que prova cuidado (conversa antes de
cortar, acabamento, profissional experiente) e ofereça horário.
Se existe oferta de entrada, use — mas o principal redutor de risco aqui é a
sensação de que vão ESCUTAR o que ele quer antes de passar a máquina.',
 '{"differentials.items"}', '{"risk_free_entry.exists","risk_free_entry.offer","location_contact.address"}', '{}', 'escalate',
 'Redução de risco percebido + acolhimento (a experiência é o produto)',
 '{"Tratar o novo igual ao antigo: perde a chance de encantar","Começar por preço com quem ainda não confia","Não explicar como funciona a primeira visita"}',
 'agendar_primeira', 'skill_seed', 'active', null),

-- ----------------------------------------------------- O CICLO (CORE)
(null, 'barbearia', 'retention', 'proactive',
 '{"faz tempo que não venho","sumido","tá na hora do corte","preciso cortar","to precisando dar um trato"}',
 null,
 'ESTA É A ENTRADA MAIS IMPORTANTE DO SEGMENTO. Barbearia vive de recompra:
o fiel volta a cada ~21 dias e rende 17 a 24 visitas por ano. Quem espera o
cliente lembrar sozinho perde metade dessas visitas.
Fale como quem conhece o cliente, não como cobrança: use o ciclo dele
(frequência e dia preferido) para SUGERIR um horário específico, já pronto.
"Tá na sua semana, sábado 10h tá livre — quer que eu segure?" funciona muito
melhor que "aparece quando puder".
Nunca cobre a ausência nem use culpa. Curto, cordial, com horário na mão.',
 '{}', '{"availability.weekly_hours","pricing.range"}', '{}', 'omit',
 'Retorno programado — sugerir o horário em vez de pedir que ele marque',
 '{"Cobrar a ausência (\"sumiu, hein\"): afasta","Mandar mensagem genérica sem horário","Insistir em sequência quando ele não respondeu: espace e mude o ângulo"}',
 'agendar_retorno', 'skill_seed', 'active', null),

(null, 'barbearia', 'retention', 'proactive',
 '{"reativação","cliente parado","não vem há meses","recuperar cliente","ficou muito tempo sem vir"}',
 null,
 'Cliente parado há muito tempo exige ângulo DIFERENTE do que ele já conhece —
repetir a mesma oferta só confirma a decisão dele de não voltar.
Traga uma novidade real da casa (profissional novo, serviço novo, horário novo)
ou um gancho pessoal e concreto. Uma mensagem, sem cobrança, com porta aberta.
Se não responder, pare e espere o próximo ciclo: insistir queima o contato.
Recuperar cliente antigo custa muito menos que conquistar um novo — mas só
funciona sem pressão.',
 '{}', '{"catalog.items","differentials.items"}', '{}', 'omit',
 'Reativação por novidade + porta aberta (sem culpa, sem insistência)',
 '{"Repetir a mesma oferta de sempre","Mandar várias mensagens seguidas","Fingir intimidade que não existe"}',
 'reativar', 'skill_seed', 'active', null),

(null, 'barbearia', 'retention', 'proactive',
 '{"pós atendimento","depois do corte","agradecer","como ficou","próximo agendamento"}',
 null,
 'O melhor momento para instalar o ciclo é logo depois do corte, quando ele está
satisfeito e se olhando no espelho. Barbearia que agenda o próximo AINDA NA
CADEIRA retém muito mais do que a que espera o cliente voltar sozinho.
No pós-atendimento: agradeça em uma linha, pergunte se ficou do jeito que ele
queria (isso resgata problema antes de virar cliente perdido) e já proponha a
data do próximo pelo ciclo dele.',
 '{}', '{"availability.weekly_hours"}', '{}', 'omit',
 'Ancoragem do próximo agendamento no pico de satisfação',
 '{"Deixar o próximo agendamento por conta do cliente","Perguntar se gostou e não fazer nada com a resposta","Mandar só \"obrigado pela preferência\": não produz retorno"}',
 'agendar_proximo', 'skill_seed', 'active', null),

-- ------------------------------------------------------------ FALTAS
-- Era 'policies', categoria que não existe no manifesto (corrigido em ago/2026
-- pelo library_check). Recuperar quem faltou é retenção — mesmo destino que a
-- entrada equivalente da escola esportiva.
(null, 'barbearia', 'retention', 'reactive',
 '{"não vou poder ir","preciso desmarcar","vou atrasar","remarcar","perdi o horário","faltei"}',
 null,
 'Remarcar bem é retenção. Não demonstre irritação — a falta já aconteceu e o
custo de perder o cliente é maior que o do horário vago.
Confirme a regra da casa se houver, e imediatamente ofereça DUAS novas opções.
Quem desmarca com aviso é um cliente que se importa: trate como tal.
Para quem faltou sem avisar, uma mensagem cordial no dia seguinte com um horário
concreto recupera boa parte deles.',
 '{"policies.no_show"}', '{"availability.weekly_hours","policies.cancellation"}', '{}', 'omit',
 'Recuperação imediata com alternativa (nunca punir na conversa)',
 '{"Cobrar explicação","Deixar sem remarcar: é assim que o cliente some","Aplicar política com aspereza — a regra existe, o tom não precisa"}',
 'remarcar', 'skill_seed', 'active', null),

-- ------------------------------------------------------- PROFISSIONAL
(null, 'barbearia', 'expertise_proof', 'reactive',
 '{"quem corta","qual barbeiro","com quem eu marco","o fulano tá","quero com o mesmo de sempre","tem barbeiro bom pra degradê"}',
 null,
 'Preferência por profissional é o sinal mais forte de fidelização que existe
nesse ramo — o vínculo é com a pessoa, não com a loja. Respeite sempre.
Confirme a agenda do profissional pedido. Se ele não tiver horário, NUNCA
empurre outro como se fosse igual: ofereça a próxima janela dele E, como
alternativa, outro profissional apresentado pela especialidade concreta.
Registre a preferência — ela orienta todos os próximos contatos.',
 '{}', '{"availability.weekly_hours","differentials.items"}', '{}', 'omit',
 'Respeito ao vínculo + alternativa qualificada',
 '{"Trocar o barbeiro sem avisar: quebra a confiança","Dizer \"é tudo igual aqui\" — para ele não é","Não registrar a preferência e errar no próximo contato"}',
 'agendar_com_preferido', 'skill_seed', 'active', null),

-- ----------------------------------------------------------- LOCAL
(null, 'barbearia', 'goal_matching', 'reactive',
 '{"onde fica","qual o endereço","como chego","tem estacionamento","é perto de onde"}',
 null,
 'Mande o endereço completo e o ponto de referência — e, se houver, a informação
de estacionamento, que é decisiva para quem vai de carro.
Emende com horário: quem pergunta onde fica está decidindo ir agora.',
 '{"location_contact.address"}', '{"availability.weekly_hours","differentials.items"}', '{}', 'escalate',
 'Redução de atrito físico + agendamento na sequência',
 '{"Mandar só o endereço sem referência","Não aproveitar o sinal de intenção para agendar"}',
 'agendar', 'skill_seed', 'active', null),

-- --------------------------------------------------------- ECOSSISTEMA
(null, 'barbearia', 'ecosystem', 'reactive',
 '{"vende produto","tem pomada","qual produto você usa","onde compro","indica um shampoo"}',
 null,
 'Pergunta sobre produto é oportunidade dupla: ticket adicional e prova de
autoridade técnica. Responda o que usou e por que serve ao cabelo DELE — o
motivo técnico é o que converte, não a marca.
Se a casa vende, ofereça com naturalidade. Se não vende, indique mesmo assim:
a honestidade aqui gera reciprocidade e ele volta.
Nunca prometa resultado que o produto não entrega.',
 '{}', '{"catalog.items","differentials.items"}', '{}', 'omit',
 'Autoridade técnica + reciprocidade',
 '{"Empurrar produto sem explicar o porquê","Prometer resultado exagerado","Não indicar nada quando a casa não vende: perde autoridade"}',
 'venda_adicional', 'skill_seed', 'active', null),

-- --------------------------------------------------------- LIMITES
(null, 'barbearia', 'limits_and_ethics', 'reactive',
 '{"não gostei do corte","ficou ruim","cortou demais","não era isso que eu queria","ficou torto"}',
 null,
 'Insatisfação com o corte é o momento mais delicado do ramo — o cliente vai
conviver com o resultado por semanas e está se sentindo exposto.
NUNCA discuta nem justifique técnica. Acolha, assuma o desconforto dele como
legítimo e chame para ajustar presencialmente o quanto antes.
A maioria dos casos se resolve com um retoque e o cliente sai mais fiel do que
antes. Discutir por mensagem perde o cliente e vira avaliação ruim.
Não prometa devolução ou cortesia que a casa não pratica.',
 '{}', '{"policies.no_show","availability.weekly_hours"}', '{}', 'omit',
 'Acolhimento + recuperação de serviço (chamar para o presencial)',
 '{"Explicar por que tecnicamente está certo: ele não quer aula","Discutir por mensagem","Prometer reembolso sem saber a política da casa"}',
 'ajustar_presencial', 'skill_seed', 'active', null),

-- ------------------------------------------------------- ABORDAGEM
(null, 'barbearia', 'reciprocity', 'reactive',
 '{"oi","ola","bom dia","boa tarde","boa noite","tudo bem","opa"}',
 null,
 'Saudação seca ("Bom dia, como posso ajudar?") desperdiça o contato.
Responda com cordialidade curta e já ofereça o caminho: corte, barba ou os dois,
e um horário. O homem que chama a barbearia quase sempre quer marcar — poupe
etapas.
Se é cliente conhecido, use o nome e o serviço de sempre: reconhecimento é o que
mais fideliza nesse ramo.',
 '{}', '{"availability.weekly_hours","catalog.items"}', '{}', 'omit',
 'Abertura com direção (evita a conversa que não anda)',
 '{"\"Como posso ajudar?\" e esperar: joga o trabalho no cliente","Não reconhecer cliente antigo","Responder com bloco de texto longo"}',
 'oferecer_horario', 'skill_seed', 'active', null),

-- ⚠ Aqui havia um `;` que encerrava o INSERT no meio do arquivo, deixando as
-- 3 últimas entradas órfãs — SQL inválido, e o carregador lia só 16 de 19.
-- Achado em ago/2026 pela trava nova do library_check.

-- ------------------------------------------------- CONFIRMAÇÃO (anti-furo)
-- Pesquisa: a ociosidade é o maior gargalo do ramo; cada furo de 45 min é
-- receita que não volta. Lembrete + confirmação reduzem drasticamente a falta.
-- Idem: confirmação de véspera é agenda, como já era na clínica.
(null, 'barbearia', 'availability', 'proactive',
 '{"confirmar horário","lembrete","confirmação de agendamento","véspera","você vem amanhã"}',
 null,
 'Confirmar o horário na véspera é a ação de maior retorno financeiro do ramo:
cadeira vazia não se recupera. Mande curto, com dia, hora e profissional, e peça
uma confirmação de uma palavra — quanto menor o esforço de responder, maior a
taxa de confirmação.
Se a casa cobra sinal ou tem política de falta, informe com naturalidade AGORA,
nunca depois que ele faltou.
Se ele não puder, já ofereça outro horário na mesma mensagem: assim você troca
um furo por um remarcado.',
 '{}', '{"policies.no_show","availability.weekly_hours"}', '{}', 'omit',
 'Confirmação de véspera com resposta de baixo atrito + troca imediata',
 '{"Confirmar em cima da hora: não dá tempo de preencher a vaga","Mensagem longa que exige leitura","Avisar da política de falta só depois que faltou"}',
 'confirmar_presenca', 'skill_seed', 'active', null),

-- ------------------------------------------------------------- INDICAÇÃO
-- Pesquisa: member-get-member converte mais e traz cliente mais fiel.
(null, 'barbearia', 'reciprocity', 'proactive',
 '{"indicação","indicar amigo","trouxe um amigo","programa de indicação","quem me indicou"}',
 null,
 'Indicação é a captação mais barata e a que traz o cliente mais fiel neste ramo.
O momento certo de pedir é logo depois de um elogio ou de um corte que ele gostou
— nunca no meio da negociação de preço.
Peça de forma concreta e fácil ("manda meu contato pra alguém que você sabe que
tá precisando"), não de forma vaga. Se existe recompensa cadastrada, diga qual é
e para os DOIS lados. Se não existe, agradeça de forma concreta assim mesmo.
Nunca invente prêmio que a casa não pratica.',
 '{}', '{"pricing.range","differentials.items"}', '{}', 'omit',
 'Member-get-member no pico de satisfação + reciprocidade de mão dupla',
 '{"Pedir indicação antes de entregar valor","Pedido vago (\"indica aí\")","Prometer recompensa que a casa não tem"}',
 'pedir_indicacao', 'skill_seed', 'active', null),

(null, 'barbearia', 'commitment_offer', 'reactive',
 '{"vou ver e te falo","depois eu marco","qualquer coisa eu chamo","vou pensar no horário","ainda não sei se vou","te aviso"}',
 null,
 'Aqui o valor é baixo e o cliente já quis — o que trava é a agenda dele, não a
sua barbearia. Tratar isso como objeção de preço é o erro.
Não pergunte "que dia fica bom para você". Pergunta aberta joga o trabalho de
decidir de volta para quem já está travado, e a conversa morre ali.
RECOMENDE DOIS horários concretos e próximos, e só dois. Duas opções decidem;
cinco viram lista para pensar depois.
Tire o risco: diga que dá para remarcar se aparecer imprevisto, quando isso for
verdade na casa. Saber que não está preso resolve boa parte do adiamento — e
quem remarca volta, quem não marcou some.
Se mesmo assim ele adiar, encerre leve e sem cobrança, deixando o próximo passo
combinado. Insistência em barbearia queima a relação, que é o ativo.',
 '{"catalog.items"}',
 '{"policies.cancellation","availability.booking_rule","availability.weekly_hours"}', '{}', 'omit',
 'Duas opções concretas + remarcação sem atrito (nunca pergunta aberta)',
 '{"Perguntar que dia fica bom","Mandar a agenda inteira","Insistir depois do segundo não","Tratar adiamento como objeção de preço"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt');
