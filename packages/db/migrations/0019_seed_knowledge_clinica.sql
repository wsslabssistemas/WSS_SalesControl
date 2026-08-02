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
 '{"quanto custa","qual o valor","quanto e a consulta","preco da avaliacao","quanto fica"}',
 null,
 'Separe DUAS coisas: o valor da AVALIACAO (que voce informa sempre, com
transparencia) e o valor do TRATAMENTO (que depende do caso e so pode ser dito
apos a avaliacao).
Informe o valor da avaliacao de forma direta — esconder gera desconfianca.
Explique em uma linha por que o tratamento so tem preco depois de ver: cada boca
e cada pele sao diferentes, e um numero chutado por mensagem seria irresponsavel.
Termine oferecendo dois horarios de avaliacao. O objetivo aqui e a cadeira, nao
o fechamento.',
 '{"pricing.avaliacao_valor"}', '{"pricing.parcelamento","availability.weekly_hours"}', '{}', 'escalate',
 'Separacao avaliacao x tratamento + fechamento por alternativa',
 '{"Chutar valor de tratamento por mensagem: perde credibilidade e o paciente some","Esconder tambem o valor da avaliacao","Responder o preco e nao oferecer horario"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'objections', 'reactive',
 '{"ta caro","muito caro","nao tenho esse dinheiro","fora do meu orcamento","achei salgado"}',
 null,
 'Em saude, "caro" quase sempre significa "ainda nao entendi o que ganho com
isso" ou "nao sei como caberia no meu mes".
NAO baixe o valor de cara — desconto reflexo desvaloriza o trabalho tecnico e
ensina o paciente a barganhar. Reconheca sem se desculpar, reconecte o
tratamento a queixa que ELE trouxe (dor, mastigacao, autoestima) e traga a
condicao de parcelamento com o numero real da parcela.
Se ele nao pode o plano inteiro, ofereca faseamento: comecar pelo que resolve a
queixa principal. Tratamento comecado vale mais que orcamento perfeito recusado.',
 '{"pricing.parcelamento"}', '{"pricing.range","differentials.items"}', '{}', 'escalate',
 'Reconexao a queixa + diluicao em parcela + faseamento do plano',
 '{"Dar desconto na primeira objecao","Repetir o valor total sem mostrar a parcela","Insistir no plano completo quando o paciente ja disse que nao cabe"}',
 'viabilizar_pagamento', 'skill_seed', 'active', null),

(null, 'clinica', 'goal_matching', 'reactive',
 '{"tenho dor","meu dente","minha pele","queria fazer","o que voce indica","serve pro meu caso","tenho uma mancha"}',
 null,
 'ATENCAO: e PROIBIDO dar diagnostico, indicar procedimento ou opinar sobre o
caso por mensagem. Isso e ato do profissional, presencialmente.
O que voce PODE e deve fazer: acolher a queixa com atencao real, fazer duas ou
tres perguntas que qualificam (ha quanto tempo, ja tratou antes, atrapalha o
dia a dia) e conduzir a avaliacao — que e exatamente onde a pergunta dele sera
respondida por quem pode responder.
Acolhimento nao e diagnostico. A pessoa quer se sentir ouvida antes de marcar.',
 '{}', '{"catalog.items","availability.weekly_hours"}',
 '{"Nunca dar diagnostico ou indicar procedimento por mensagem"}', 'omit',
 'Acolhimento + qualificacao por perguntas + conducao a avaliacao',
 '{"Dizer o que a pessoa provavelmente tem","Indicar procedimento sem avaliacao","Responder so \"precisa avaliar\" sem acolher: soa frio e ela nao marca"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'commitment_offer', 'proactive',
 -- "vou pensar"/"preciso ver" sairam daqui (ago/2026, limpeza do M3): sao da
 -- entrada de indecisao_jolt. Esta e a do FOLLOW-UP pos-orcamento, e os
 -- gatilhos dela sao os do orcamento entregue — mesmo desenho ja aplicado em
 -- sob_medida e automacao, onde a entrada de cadencia so tem gatilho de
 -- proposta enviada.
 '{"plano de tratamento","orcamento","mandou o orcamento","recebeu o plano"}',
 null,
 'ESTA E A ENTRADA MAIS IMPORTANTE DO SEGMENTO. O tratamento nao se perde na
apresentacao — se perde no SILENCIO depois dela. A maioria das clinicas entrega
o plano e nunca mais fala.
"Vou pensar" quase nunca e recusa: e duvida nao resolvida ou dinheiro. Nao
pressione por decisao. Pergunte o que ficou pouco claro e ofereca a condicao de
pagamento. Depois, siga a cadencia (2, 7 e 15 dias) mudando o angulo a cada
toque, sempre com porta aberta.
Um plano sem retorno em 15 dias precisa de um contato final honesto, nao de
insistencia diaria.',
 '{"pricing.parcelamento"}', '{"policies.garantia","expertise_proof.profissionais"}', '{}', 'escalate',
 'Follow-up estruturado pos-orcamento (o que quase ninguem faz)',
 '{"Entregar o plano e esperar o paciente voltar","Cobrar decisao (\"e ai, vai fechar?\")","Sumir apos um unico follow-up"}',
 'retomar_plano', 'skill_seed', 'active', null),

(null, 'clinica', 'risk_free_entry', 'reactive',
 '{"nunca fui ai","primeira vez","como funciona","preciso marcar avaliacao","quero conhecer"}',
 null,
 'A avaliacao e a porta de entrada e o momento em que o tratamento realmente se
vende — sua unica meta na conversa e o comparecimento.
Explique com clareza o que acontece na avaliacao: quanto tempo dura, o que sera
examinado, se sai com plano e valor no mesmo dia, e o que ele deve levar
(documento, exame anterior, carteirinha).
Reduza o medo: muita gente adia por receio, nao por dinheiro. Diga que na
avaliacao nao se faz procedimento sem combinar antes.
Ofereca dois horarios concretos.',
 '{"pricing.avaliacao_valor","availability.weekly_hours"}', '{"location_contact.address","differentials.items"}', '{}', 'escalate',
 'Reducao de medo + clareza de processo + fechamento por alternativa',
 '{"Marcar sem explicar como funciona: aumenta a falta","Ignorar o medo, que e a objecao real em saude","Nao dizer o que levar"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'availability', 'proactive',
 '{"confirmar consulta","lembrete","vespera","confirma sua avaliacao","voce vem"}',
 null,
 'Falta em clinica e prejuizo duplo: a cadeira ociosa nao volta e o tratamento
que se venderia naquela avaliacao nao acontece.
Confirme na vespera, curto: dia, hora, profissional e endereco, pedindo uma
confirmacao de uma palavra. Se houver politica de cancelamento, informe agora
com naturalidade — nunca depois da falta.
Se ele nao puder, ja ofereca outro horario na mesma mensagem: troque a falta por
um remarcado antes que ele desista de vez.',
 '{"availability.weekly_hours"}', '{"policies.no_show","location_contact.address"}', '{}', 'escalate',
 'Confirmacao de vespera com resposta de baixo atrito',
 '{"Confirmar em cima da hora","Mensagem longa","Nao oferecer alternativa a quem avisou que nao pode"}',
 'confirmar_presenca', 'skill_seed', 'active', null),

(null, 'clinica', 'ecosystem', 'reactive',
 '{"aceita convenio","atende plano","meu plano cobre","tem reembolso","unimed","ipe"}',
 null,
 'Responda com EXATIDAO usando so a lista do DNA — errar convenio gera paciente
irritado na recepcao e cancelamento.
Se atende: confirme e ja conduza ao agendamento.
Se nao atende aquele convenio: diga com naturalidade e apresente as duas saidas
reais — reembolso (se a clinica emite a documentacao) e o particular parcelado.
Muita gente com convenio fecha particular quando entende a diferenca de prazo e
de escolha do profissional. Nao ataque o convenio; mostre a alternativa.',
 '{"convenios.aceita_convenio"}', '{"convenios.lista","convenios.reembolso","pricing.parcelamento"}', '{}', 'escalate',
 'Exatidao factual + reconducao ao particular sem atacar o convenio',
 '{"Dizer que aceita sem ter certeza","Encerrar a conversa quando nao atende o convenio","Falar mal do plano de saude do paciente"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'expertise_proof', 'reactive',
 '{"quem atende","qual dentista","o doutor e formado","tem especializacao","quantos anos de experiencia","voce ja fez isso"}',
 null,
 'Pergunta sobre credencial e sinal de interesse alto com medo por baixo: a
pessoa quer permissao para confiar.
Responda com fatos verificaveis do DNA — formacao, especialidade, registro
profissional, tempo de casa, tecnologia usada. Fato tranquiliza; adjetivo
("somos os melhores") aumenta a desconfianca.
Nao use caso, foto ou nome de outro paciente: sigilo e obrigatorio.
Feche convidando para conhecer a estrutura na avaliacao.',
 '{"expertise_proof.profissionais"}', '{"expertise_proof.tecnologia","expertise_proof.tempo_de_casa"}', '{}', 'escalate',
 'Prova por fato verificavel (nunca por adjetivo, nunca por caso de terceiro)',
 '{"Responder com adjetivo em vez de credencial","Citar caso ou foto de outro paciente","Inventar especializacao"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'limits_and_ethics', 'reactive',
 '{"vai ficar bom","tem garantia","funciona mesmo","da certo","fica igual da foto","quanto tempo dura"}',
 null,
 'ATENCAO — LIMITE LEGAL: e vedado prometer ou garantir resultado em saude e
estetica. Nao existe "vai ficar igual a foto".
O que voce pode: falar do que o procedimento se propoe a fazer, do que costuma
ser observado, da experiencia da equipe e da politica de acompanhamento da
clinica (se existir no DNA). Explique que o resultado depende do caso, da
resposta individual e do cuidado depois — e que isso sera avaliado
presencialmente.
Ser honesto aqui converte mais do que prometer: o paciente percebe seriedade.',
 '{}', '{"policies.garantia","expertise_proof.profissionais"}',
 '{"Nunca prometer ou garantir resultado","Nunca dizer que ficara igual a uma foto de referencia"}', 'omit',
 'Honestidade tecnica como diferencial de confianca',
 '{"Prometer resultado para nao perder a venda","Dizer que \"sempre da certo\"","Confundir garantia de servico com garantia de resultado"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'retention', 'proactive',
 '{"parou o tratamento","nao voltou","abandonou","faltou nas ultimas","sumiu no meio"}',
 null,
 'Paciente que some no meio do tratamento e o pior prejuizo do segmento: houve
custo, a receita nao entrou e o caso fica inacabado — as vezes pior do que
comecou.
Retome sem culpa e sem cobranca. Pergunte se aconteceu algo (muitas vezes e
dinheiro, medo ou horario) e ofereca a saida concreta: remarcar, refazer o
parcelamento ou ajustar o plano.
Uma mensagem pessoal e curta funciona muito melhor que aviso automatico. Nunca
exponha o procedimento dele em mensagem que outra pessoa possa ler.',
 '{}', '{"pricing.parcelamento","availability.weekly_hours"}',
 '{"Preservar sigilo: nao detalhar procedimento em mensagem"}', 'omit',
 'Retomada sem culpa + remocao do obstaculo real',
 '{"Cobrar a ausencia","Mandar aviso automatico frio","Detalhar o tratamento em mensagem sem cuidado com sigilo"}',
 'retomar_tratamento', 'skill_seed', 'active', null),

(null, 'clinica', 'reciprocity', 'reactive',
 '{"oi","ola","bom dia","boa tarde","boa noite","informacoes","gostaria de saber"}',
 null,
 'Abertura em saude precisa de acolhimento antes de qualquer processo. A pessoa
que chama uma clinica quase sempre esta com um incomodo — dor, vergonha ou
duvida.
Cumprimente com o nome, pergunte de forma aberta o que ela esta sentindo ou
buscando, e so entao conduza. Nao dispare tabela de precos nem regras de
convenio na primeira mensagem.
Uma pergunta acolhedora aumenta muito a chance de a pessoa contar o caso real —
e e o caso real que faz ela marcar.',
 '{}', '{"availability.weekly_hours","location_contact.address"}', '{}', 'omit',
 'Acolhimento antes de processo (a queixa vem depois da confianca)',
 '{"Responder com tabela de precos de imediato","\"Como posso ajudar?\" e esperar","Tom burocratico com quem esta com dor"}',
 'qualificar', 'skill_seed', 'active', null),

(null, 'clinica', 'catalog', 'reactive',
 '{"voces fazem","tem esse procedimento","atende crianca","fazem clareamento","tem harmonizacao","fazem implante"}',
 null,
 'Confirme se o procedimento existe usando SOMENTE a lista do DNA e diga qual
profissional executa.
Nao faz? Diga com naturalidade, e se houver encaminhamento parceiro, ofereca —
honestidade aqui gera indicacao futura.
Faz? Confirme, informe o valor da AVALIACAO (nao do procedimento, que depende do
caso) e ofereca horario.
Nunca prometa prazo de tratamento sem avaliacao.',
 '{"catalog.items"}', '{"pricing.avaliacao_valor","expertise_proof.profissionais"}', '{}', 'escalate',
 'Confirmacao factual + conducao a avaliacao',
 '{"Dizer que faz o que a clinica nao faz","Dar preco de procedimento por mensagem","Prometer prazo sem ver o caso"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'objections', 'reactive',
 '{"vou ver com meu marido","preciso falar com minha esposa","vou conversar em casa","depende do meu filho"}',
 null,
 'Quem decide nem sempre e quem fala com voce — e isso e normal em tratamento de
valor alto. NAO trate como desculpa.
Ajude a pessoa a levar a conversa: pergunte qual seria a duvida do outro
(quase sempre e valor ou necessidade), e ofereca material objetivo para ela
mostrar — plano por escrito com as condicoes de pagamento.
Se fizer sentido, convide os dois para a proxima conversa: decisao compartilhada
fecha melhor do que decisao intermediada.
Combine um retorno com data, nunca deixe em aberto.',
 '{}', '{"pricing.parcelamento"}', '{}', 'omit',
 'Municiar o defensor interno + convite ao decisor + retorno com data',
 '{"Tratar como enrolacao","Deixar sem data de retorno","Pressionar quem nao decide"}',
 'agendar_retorno_decisao', 'skill_seed', 'active', null),

(null, 'clinica', 'goal_matching', 'reactive',
 '{"onde fica","endereco","como chego","tem estacionamento","e perto"}',
 null,
 'Envie endereco completo, referencia e a informacao de estacionamento — em
clinica isso pesa na decisao, principalmente para quem vai com dor ou levando
familiar.
Emende com dois horarios de avaliacao: quem pergunta onde fica ja decidiu ir.',
 '{"location_contact.address"}', '{"location_contact.estacionamento","availability.weekly_hours"}', '{}', 'escalate',
 'Reducao de atrito fisico + agendamento imediato',
 '{"Mandar so o endereco","Nao aproveitar o sinal de intencao"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'availability', 'reactive',
 '{"que horas atende","tem vaga","qual o horario","atende sabado","demora pra marcar","tem fila de espera"}',
 null,
 'Informe o horario e o prazo real de agendamento — prometer vaga que nao existe
gera cancelamento e reclamacao.
Ofereca DUAS opcoes concretas em vez de perguntar "quando voce pode": duas
opcoes decidem, pergunta aberta adia.
Se a agenda estiver cheia, ofereca a proxima janela real e a lista de espera
para desistencia. Nao deixe a pessoa sem proximo passo.',
 '{"availability.weekly_hours"}', '{"availability.prazo_agendamento"}', '{}', 'escalate',
 'Fechamento por alternativa + honestidade de agenda',
 '{"Prometer encaixe que nao existe","Perguntar quando ele pode","Dizer que esta cheio e encerrar"}',
 'agendar_avaliacao', 'skill_seed', 'active', null),

(null, 'clinica', 'commitment_offer', 'reactive',
 -- "vou conversar em casa" saiu daqui: estava LITERALMENTE identico na entrada
 -- de objections do decisor, logo acima. Frase que nomeia outra pessoa na
 -- decisao e daquela; medo e desta. O precedente e escola_esportiva.
 '{"preciso pensar","e muita coisa de uma vez","tenho medo","e se nao der certo","vou avaliar","depois eu retorno"}',
 null,
 'Em saude a indecisao quase sempre e MEDO, nao duvida sobre o preco — medo de dor,
de nao dar certo, de gastar e se arrepender. Quem ja ouviu o plano e mesmo assim
adiou nao precisa de mais explicacao tecnica: precisa de menos risco.
O erro mais comum e reexplicar o tratamento. Para quem ja entendeu, mais detalhe
aumenta a sensacao de complexidade e trava mais.
Nomeie o receio antes de responder ("é normal ficar em duvida quando o plano é
longo"), e pergunte o que especificamente preocupa. A resposta muda tudo: medo do
resultado se resolve com prova; medo do valor, com faseamento; medo do processo,
com clareza do passo a passo.
Depois RECOMENDE UM caminho, comecando pelo menor passo real que resolve algo —
a avaliacao, a primeira etapa, o que for reversivel. Ninguem precisa decidir o
tratamento inteiro hoje.
Nunca pressione decisao de saude e nunca opine sobre gravidade para acelerar. Isso
e limite etico, e tambem funciona melhor.',
 '{"catalog.items"}',
 '{"pricing.parcelamento","policies.garantia","pricing.avaliacao_valor","policies.cancelamento","expertise_proof.profissionais"}', '{}', 'escalate',
 'Nomear o medo, fatiar o compromisso e recomendar o menor passo reversivel',
 '{"Reexplicar o tratamento para quem ja entendeu","Criar urgencia com risco de saude","Oferecer mais opcoes de tratamento","Cobrar decisao no mesmo dia"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt');
