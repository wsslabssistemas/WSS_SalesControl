-- =====================================================================
-- COS — MIGRATION 0019 : BIBLIOTECA COMERCIAL DE CLÍNICAS
--
-- Segmento de maior ticket e maior lacuna comercial do país.
--
-- DIAGNÓSTICO (pesquisa jul/2026): o profissional de saúde vê "vender" com
-- preconceito e deixa a comercialização de tratamentos de alto valor com a
-- recepção, sem preparo. A recepção responde preço por mensagem e agenda,
-- sem qualificar. Perde-se o tratamento, não a consulta.
--
-- TESE DESTA BIBLIOTECA:
--   1. Antes da avaliação, o objetivo NUNCA é vender o tratamento — é levar
--      a pessoa até a cadeira. Preço de tratamento por mensagem mata a venda.
--   2. Depois do plano entregue, o que mata é o SILÊNCIO (cadência pos_orcamento).
--   3. Ética não é ornamento: é proibido prometer resultado e diagnosticar por
--      mensagem. Toda entrada respeita isso — e o motor escala quando falta fato.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'clinica' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

(null, 'clinica', 'pricing', 'reactive',
 '{"quanto custa","qual o valor","quanto é a consulta","preço da avaliação","quanto fica"}',
 null,
 'Separe DUAS coisas: o valor da AVALIAÇÃO (que você informa sempre, com
transparência) e o valor do TRATAMENTO (que depende do caso e só pode ser dito
após a avaliação).
Informe o valor da avaliação de forma direta — esconder gera desconfiança.
Explique em uma linha por que o tratamento só tem preço depois de ver: cada boca
e cada pele são diferentes, e um número chutado por mensagem seria irresponsável.
Termine oferecendo dois horários de avaliação. O objetivo aqui é a cadeira, não
o fechamento.',
 '{"pricing.avaliacao_valor"}', '{"pricing.parcelamento","availability.weekly_hours"}', '{}', 'escalate',
 'Separação avaliação x tratamento + fechamento por alternativa',
 '{"Chutar valor de tratamento por mensagem: perde credibilidade e o paciente some","Esconder também o valor da avaliação","Responder o preço e não oferecer horário"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'objections', 'reactive',
 '{"tá caro","muito caro","não tenho esse dinheiro","fora do meu orçamento","achei salgado"}',
 null,
 'Em saúde, "caro" quase sempre significa "ainda não entendi o que ganho com
isso" ou "não sei como caberia no meu mês".
NÃO baixe o valor de cara — desconto reflexo desvaloriza o trabalho técnico e
ensina o paciente a barganhar. Reconheça sem se desculpar, reconecte o
tratamento a queixa que ELE trouxe (dor, mastigação, autoestima) e traga a
condição de parcelamento com o número real da parcela.
Se ele não pode o plano inteiro, ofereça faseamento: começar pelo que resolve a
queixa principal. Tratamento começado vale mais que orçamento perfeito recusado.',
 '{"pricing.parcelamento"}', '{"pricing.range","differentials.items"}', '{}', 'escalate',
 'Reconexão a queixa + diluição em parcela + faseamento do plano',
 '{"Dar desconto na primeira objeção","Repetir o valor total sem mostrar a parcela","Insistir no plano completo quando o paciente já disse que não cabe"}',
 'viabilizar_pagamento', 'skill_seed', 'active', null),

(null, 'clinica', 'goal_matching', 'reactive',
 '{"tenho dor","meu dente","minha pele","queria fazer","o que você indica","serve pro meu caso","tenho uma mancha"}',
 null,
 'ATENÇÃO: é PROIBIDO dar diagnóstico, indicar procedimento ou opinar sobre o
caso por mensagem. Isso é ato do profissional, presencialmente.
O que você PODE e deve fazer: acolher a queixa com atenção real, fazer duas ou
três perguntas que qualificam (há quanto tempo, já tratou antes, atrapalha o
dia a dia) e conduzir a avaliação — que é exatamente onde a pergunta dele será
respondida por quem pode responder.
Acolhimento não é diagnóstico. A pessoa quer se sentir ouvida antes de marcar.',
 '{}', '{"catalog.items","availability.weekly_hours"}',
 '{"Nunca dar diagnóstico ou indicar procedimento por mensagem"}', 'omit',
 'Acolhimento + qualificação por perguntas + condução a avaliação',
 '{"Dizer o que a pessoa provavelmente tem","Indicar procedimento sem avaliação","Responder só \"precisa avaliar\" sem acolher: soa frio e ela não marca"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'commitment_offer', 'proactive',
 -- "vou pensar"/"preciso ver" saíram daqui (ago/2026, limpeza do M3): são da
 -- entrada de indecisao_jolt. Esta é a do FOLLOW-UP pós-orçamento, e os
 -- gatilhos dela são os do orçamento entregue — mesmo desenho já aplicado em
 -- sob_medida e automação, onde a entrada de cadência só tem gatilho de
 -- proposta enviada.
 '{"plano de tratamento","orçamento","mandou o orçamento","recebeu o plano"}',
 null,
 'ESTA É A ENTRADA MAIS IMPORTANTE DO SEGMENTO. O tratamento não se perde na
apresentação — se perde no SILÊNCIO depois dela. A maioria das clínicas entrega
o plano e nunca mais fala.
"Vou pensar" quase nunca é recusa: é dúvida não resolvida ou dinheiro. Não
pressione por decisão. Pergunte o que ficou pouco claro e ofereça a condição de
pagamento. Depois, siga a cadência (2, 7 e 15 dias) mudando o ângulo a cada
toque, sempre com porta aberta.
Um plano sem retorno em 15 dias precisa de um contato final honesto, não de
insistência diária.',
 '{"pricing.parcelamento"}', '{"policies.garantia","expertise_proof.profissionais"}', '{}', 'escalate',
 'Follow-up estruturado pós-orçamento (o que quase ninguém faz)',
 '{"Entregar o plano e esperar o paciente voltar","Cobrar decisão (\"e aí, vai fechar?\")","Sumir após um único follow-up"}',
 'retomar_plano', 'skill_seed', 'active', null),

(null, 'clinica', 'risk_free_entry', 'reactive',
 '{"nunca fui aí","primeira vez","como funciona","preciso marcar avaliação","quero conhecer"}',
 null,
 'A avaliação é a porta de entrada e o momento em que o tratamento realmente se
vende — sua única meta na conversa é o comparecimento.
Explique com clareza o que acontece na avaliação: quanto tempo dura, o que será
examinado, se sai com plano e valor no mesmo dia, e o que ele deve levar
(documento, exame anterior, carteirinha).
Reduza o medo: muita gente adia por receio, não por dinheiro. Diga que na
avaliação não se faz procedimento sem combinar antes.
Ofereça dois horários concretos.',
 '{"pricing.avaliacao_valor","availability.weekly_hours"}', '{"location_contact.address","differentials.items"}', '{}', 'escalate',
 'Redução de medo + clareza de processo + fechamento por alternativa',
 '{"Marcar sem explicar como funciona: aumenta a falta","Ignorar o medo, que é a objeção real em saúde","Não dizer o que levar"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'availability', 'proactive',
 '{"confirmar consulta","lembrete","véspera","confirma sua avaliação","você vem"}',
 null,
 'Falta em clínica é prejuízo duplo: a cadeira ociosa não volta e o tratamento
que se venderia naquela avaliação não acontece.
Confirme na véspera, curto: dia, hora, profissional e endereço, pedindo uma
confirmação de uma palavra. Se houver política de cancelamento, informe agora
com naturalidade — nunca depois da falta.
Se ele não puder, já ofereça outro horário na mesma mensagem: troque a falta por
um remarcado antes que ele desista de vez.',
 '{"availability.weekly_hours"}', '{"policies.no_show","location_contact.address"}', '{}', 'escalate',
 'Confirmação de véspera com resposta de baixo atrito',
 '{"Confirmar em cima da hora","Mensagem longa","Não oferecer alternativa a quem avisou que não pode"}',
 'confirmar_presenca', 'skill_seed', 'active', null),

(null, 'clinica', 'ecosystem', 'reactive',
 '{"aceita convênio","atende plano","meu plano cobre","tem reembolso","unimed","ipe"}',
 null,
 'Responda com EXATIDÃO usando só a lista do DNA — errar convênio gera paciente
irritado na recepção e cancelamento.
Se atende: confirme e já conduza ao agendamento.
Se não atende aquele convênio: diga com naturalidade e apresente as duas saídas
reais — reembolso (se a clínica emite a documentação) e o particular parcelado.
Muita gente com convênio fecha particular quando entende a diferença de prazo e
de escolha do profissional. Não ataque o convênio; mostre a alternativa.',
 '{"convenios.aceita_convenio"}', '{"convenios.lista","convenios.reembolso","pricing.parcelamento"}', '{}', 'escalate',
 'Exatidão factual + recondução ao particular sem atacar o convênio',
 '{"Dizer que aceita sem ter certeza","Encerrar a conversa quando não atende o convênio","Falar mal do plano de saúde do paciente"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'expertise_proof', 'reactive',
 '{"quem atende","qual dentista","o doutor é formado","tem especialização","quantos anos de experiência","você já fez isso"}',
 null,
 'Pergunta sobre credencial é sinal de interesse alto com medo por baixo: a
pessoa quer permissão para confiar.
Responda com fatos verificáveis do DNA — formação, especialidade, registro
profissional, tempo de casa, tecnologia usada. Fato tranquiliza; adjetivo
("somos os melhores") aumenta a desconfiança.
Não use caso, foto ou nome de outro paciente: sigilo é obrigatório.
Feche convidando para conhecer a estrutura na avaliação.',
 '{"expertise_proof.profissionais"}', '{"expertise_proof.tecnologia","expertise_proof.tempo_de_casa"}', '{}', 'escalate',
 'Prova por fato verificável (nunca por adjetivo, nunca por caso de terceiro)',
 '{"Responder com adjetivo em vez de credencial","Citar caso ou foto de outro paciente","Inventar especialização"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'limits_and_ethics', 'reactive',
 '{"vai ficar bom","tem garantia","funciona mesmo","dá certo","fica igual da foto","quanto tempo dura"}',
 null,
 'ATENÇÃO — LIMITE LEGAL: é vedado prometer ou garantir resultado em saúde e
estética. Não existe "vai ficar igual a foto".
O que você pode: falar do que o procedimento se propõe a fazer, do que costuma
ser observado, da experiência da equipe e da política de acompanhamento da
clínica (se existir no DNA). Explique que o resultado depende do caso, da
resposta individual e do cuidado depois — e que isso será avaliado
presencialmente.
Ser honesto aqui converte mais do que prometer: o paciente percebe seriedade.',
 '{}', '{"policies.garantia","expertise_proof.profissionais"}',
 '{"Nunca prometer ou garantir resultado","Nunca dizer que ficará igual a uma foto de referência"}', 'omit',
 'Honestidade técnica como diferencial de confiança',
 '{"Prometer resultado para não perder a venda","Dizer que \"sempre dá certo\"","Confundir garantia de serviço com garantia de resultado"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'retention', 'proactive',
 '{"parou o tratamento","não voltou","abandonou","faltou nas últimas","sumiu no meio"}',
 null,
 'Paciente que some no meio do tratamento é o pior prejuízo do segmento: houve
custo, a receita não entrou e o caso fica inacabado — às vezes pior do que
começou.
Retome sem culpa e sem cobrança. Pergunte se aconteceu algo (muitas vezes é
dinheiro, medo ou horário) e ofereça a saída concreta: remarcar, refazer o
parcelamento ou ajustar o plano.
Uma mensagem pessoal e curta funciona muito melhor que aviso automático. Nunca
exponha o procedimento dele em mensagem que outra pessoa possa ler.',
 '{}', '{"pricing.parcelamento","availability.weekly_hours"}',
 '{"Preservar sigilo: não detalhar procedimento em mensagem"}', 'omit',
 'Retomada sem culpa + remoção do obstáculo real',
 '{"Cobrar a ausência","Mandar aviso automático frio","Detalhar o tratamento em mensagem sem cuidado com sigilo"}',
 'retomar_tratamento', 'skill_seed', 'active', null),

(null, 'clinica', 'reciprocity', 'reactive',
 '{"oi","ola","bom dia","boa tarde","boa noite","informações","gostaria de saber"}',
 null,
 'Abertura em saúde precisa de acolhimento antes de qualquer processo. A pessoa
que chama uma clínica quase sempre está com um incômodo — dor, vergonha ou
dúvida.
Cumprimente com o nome, pergunte de forma aberta o que ela está sentindo ou
buscando, e só então conduza. Não dispare tabela de preços nem regras de
convênio na primeira mensagem.
Uma pergunta acolhedora aumenta muito a chance de a pessoa contar o caso real —
e é o caso real que faz ela marcar.',
 '{}', '{"availability.weekly_hours","location_contact.address"}', '{}', 'omit',
 'Acolhimento antes de processo (a queixa vem depois da confiança)',
 '{"Responder com tabela de preços de imediato","\"Como posso ajudar?\" e esperar","Tom burocrático com quem está com dor"}',
 'qualificar', 'skill_seed', 'active', null),

(null, 'clinica', 'catalog', 'reactive',
 '{"vocês fazem","tem esse procedimento","atende criança","fazem clareamento","tem harmonização","fazem implante"}',
 null,
 'Confirme se o procedimento existe usando SOMENTE a lista do DNA e diga qual
profissional executa.
Não faz? Diga com naturalidade, e se houver encaminhamento parceiro, ofereça —
honestidade aqui gera indicação futura.
Faz? Confirme, informe o valor da AVALIAÇÃO (não do procedimento, que depende do
caso) e ofereça horário.
Nunca prometa prazo de tratamento sem avaliação.',
 '{"catalog.items"}', '{"pricing.avaliacao_valor","expertise_proof.profissionais"}', '{}', 'escalate',
 'Confirmação factual + condução a avaliação',
 '{"Dizer que faz o que a clínica não faz","Dar preço de procedimento por mensagem","Prometer prazo sem ver o caso"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'objections', 'reactive',
 '{"vou ver com meu marido","preciso falar com minha esposa","vou conversar em casa","depende do meu filho"}',
 null,
 'Quem decide nem sempre é quem fala com você — e isso é normal em tratamento de
valor alto. NÃO trate como desculpa.
Ajude a pessoa a levar a conversa: pergunte qual seria a dúvida do outro
(quase sempre é valor ou necessidade), e ofereça material objetivo para ela
mostrar — plano por escrito com as condições de pagamento.
Se fizer sentido, convide os dois para a próxima conversa: decisão compartilhada
fecha melhor do que decisão intermediada.
Combine um retorno com data, nunca deixe em aberto.',
 '{}', '{"pricing.parcelamento"}', '{}', 'omit',
 'Municiar o defensor interno + convite ao decisor + retorno com data',
 '{"Tratar como enrolação","Deixar sem data de retorno","Pressionar quem não decide"}',
 'agendar_retorno_decisao', 'skill_seed', 'active', null),

(null, 'clinica', 'goal_matching', 'reactive',
 '{"onde fica","endereço","como chego","tem estacionamento","é perto"}',
 null,
 'Envie endereço completo, referência e a informação de estacionamento — em
clínica isso pesa na decisão, principalmente para quem vai com dor ou levando
familiar.
Emende com dois horários de avaliação: quem pergunta onde fica já decidiu ir.',
 '{"location_contact.address"}', '{"location_contact.estacionamento","availability.weekly_hours"}', '{}', 'escalate',
 'Redução de atrito físico + agendamento imediato',
 '{"Mandar só o endereço","Não aproveitar o sinal de intenção"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'availability', 'reactive',
 '{"que horas atende","tem vaga","qual o horário","atende sábado","demora pra marcar","tem fila de espera"}',
 null,
 'Informe o horário e o prazo real de agendamento — prometer vaga que não existe
gera cancelamento e reclamação.
Ofereça DUAS opções concretas em vez de perguntar "quando você pode": duas
opções decidem, pergunta aberta adia.
Se a agenda estiver cheia, ofereça a próxima janela real e a lista de espera
para desistência. Não deixe a pessoa sem próximo passo.',
 '{"availability.weekly_hours"}', '{"availability.prazo_agendamento"}', '{}', 'escalate',
 'Fechamento por alternativa + honestidade de agenda',
 '{"Prometer encaixe que não existe","Perguntar quando ele pode","Dizer que está cheio e encerrar"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'commitment_offer', 'reactive',
 -- "vou conversar em casa" saiu daqui: estava LITERALMENTE idêntico na entrada
 -- de objections do decisor, logo acima. Frase que nomeia outra pessoa na
 -- decisão é daquela; medo é desta. O precedente é escola_esportiva.
 '{"preciso pensar","é muita coisa de uma vez","tenho medo","e se não der certo","vou avaliar","depois eu retorno"}',
 null,
 'Em saúde a indecisão quase sempre é MEDO, não dúvida sobre o preço — medo de dor,
de não dar certo, de gastar e se arrepender. Quem já ouviu o plano e mesmo assim
adiou não precisa de mais explicação técnica: precisa de menos risco.
O erro mais comum é reexplicar o tratamento. Para quem já entendeu, mais detalhe
aumenta a sensação de complexidade e trava mais.
Nomeie o receio antes de responder ("é normal ficar em dúvida quando o plano é
longo"), e pergunte o que especificamente preocupa. A resposta muda tudo: medo do
resultado se resolve com prova; medo do valor, com faseamento; medo do processo,
com clareza do passo a passo.
Depois RECOMENDE UM caminho, começando pelo menor passo real que resolve algo —
a avaliação, a primeira etapa, o que for reversível. Ninguém precisa decidir o
tratamento inteiro hoje.
Nunca pressione decisão de saúde e nunca opine sobre gravidade para acelerar. Isso
é limite ético, e também funciona melhor.',
 '{"catalog.items"}',
 '{"pricing.parcelamento","policies.garantia","pricing.avaliacao_valor","policies.cancelamento","expertise_proof.profissionais"}', '{}', 'escalate',
 'Nomear o medo, fatiar o compromisso e recomendar o menor passo reversível',
 '{"Reexplicar o tratamento para quem já entendeu","Criar urgência com risco de saúde","Oferecer mais opções de tratamento","Cobrar decisão no mesmo dia"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt');
