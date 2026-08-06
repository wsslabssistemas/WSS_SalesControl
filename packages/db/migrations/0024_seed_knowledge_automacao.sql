-- =====================================================================
-- COS — MIGRATION 0024 : BIBLIOTECA DE AUTOMAÇÃO E SISTEMAS PREDIAIS
--
-- Venda técnica consultiva B2B/B2G. Ticket alto, ciclo longo, decisão
-- compartilhada (quem usa não é quem assina).
--
-- FUNDAMENTO:
--   • O valor real só aparece depois da VISITA TÉCNICA — orçar por telefone
--     destrói margem e credibilidade.
--   • O que mata a venda é o silêncio pós-proposta, não o preço.
--   • Em equipamento, o argumento vencedor é CUSTO TOTAL (energia, parada,
--     manutenção), nunca o preço da compra.
--   • Quem usa o equipamento não é quem assina o cheque: mapear o decisor
--     cedo evita proposta que morre esperando aprovação.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'automacao' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

(null, 'automacao', 'pricing', 'reactive',
 '{"quanto custa","qual o valor","me passa um orçamento","quanto fica","preço do sistema","valor da instalação"}',
 null,
 'Orçar equipamento técnico por telefone é o erro mais caro do ramo: sem ver
carga, infraestrutura e condição do local, qualquer número está errado — e o
valor real depois vira "vocês aumentaram".
Explique em UMA linha por que depende do levantamento (carga térmica, ponto de
energia, estrutura, acesso). Quem entende o motivo aceita bem.
Se você trabalha com faixa de ticket, informe a FAIXA: qualifica quem tem verba
e poupa visita perdida.
Termine oferecendo a visita técnica com dois horários — é ali que o escopo
aparece e a venda começa.',
 '{"comercial.ticket_medio"}', '{"comercial.prazo_entrega","atuacao.regiao"}', '{}', 'escalate',
 'Ancoragem por faixa + condução ao levantamento técnico',
 '{"Dar número fechado sem levantamento","Fugir da pergunta sem explicar o porquê","Não oferecer a visita e deixar esfriar"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'objections', 'reactive',
 '{"tá caro","achei caro","fora do orçamento","o concorrente fez por menos","recebi proposta menor"}',
 null,
 'Em equipamento, preço de compra é a menor parte da conta. O que decide é o
CUSTO TOTAL: consumo de energia, parada de operação, manutenção e vida útil.
Um sistema 20% mais barato que consome mais e para no verão custa muito mais
em dois anos.
NUNCA ataque o concorrente. Peça para comparar item a item: marca e linha do
equipamento, capacidade real, se inclui projeto, instalação, start-up,
treinamento e garantia. Proposta técnica só parece igual quando ninguém abre o
escopo.
Se o valor não cabe, ofereça FASEAMENTO — começar pelo ambiente crítico e
expandir depois. Projeto iniciado vale mais que proposta perfeita recusada.',
 '{"solucoes.diferencial_tecnico"}',
 '{"comercial.garantia","pos_venda.manutencao_contrato","comercial.prazo_pagamento"}', '{}', 'escalate',
 'Custo total de propriedade + comparação item a item + faseamento',
 '{"Baixar preço sem tirar escopo","Falar mal do concorrente","Comparar só o valor de compra"}',
 'defender_valor', 'skill_seed', 'active', null),

(null, 'automacao', 'commitment_offer', 'proactive',
 '{"enviei a proposta","mandou o orçamento","ficou de responder","não respondeu a proposta","segue a proposta técnica"}',
 null,
 'ENTRADA MAIS IMPORTANTE DO SEGMENTO. Em ciclo longo, proposta enviada e
esquecida é a regra — e a maioria das empresas faz UM follow-up e desiste.
Nunca cobre decisão. Cada toque precisa ter ângulo NOVO: (1) tirar dúvida
técnica do escopo, (2) trazer a conta de retorno ou a condição de pagamento,
(3) propor ajuste de escopo ou etapa inicial.
Pergunte também o que falta INTERNAMENTE: em B2B a proposta costuma travar em
aprovação, verba ou prioridade — não em vontade. Descobrir isso muda tudo, e
você só descobre perguntando.
Combine sempre a próxima data. Deixar em aberto é perder.',
 '{"comercial.prazo_pagamento"}',
 '{"comercial.prazo_entrega","comercial.garantia","capacidade.obras_referencia"}', '{}', 'escalate',
 'Cadência com ângulo novo + descobrir o travamento interno',
 '{"Enviar e esperar","Repetir a mesma pergunta a cada toque","Assumir que silêncio é recusa","Sumir após um follow-up"}',
 'retomar_proposta', 'skill_seed', 'active', null),

(null, 'automacao', 'risk_free_entry', 'reactive',
 '{"vocês fazem visita","vem ver aqui","precisa ir no local","fazem levantamento","cobra a visita"}',
 null,
 'A visita técnica é onde a venda realmente acontece: é o momento em que você
vira consultor e não fornecedor de preço.
Qualifique antes de deslocar — o que ele quer resolver, se a obra existe, qual
o prazo e quem participa. Visita para quem só pesquisa preço é prejuízo.
Explique o que acontece no levantamento (medição, avaliação de infra, fotos) e
o que ele já sai sabendo. Isso aumenta muito o comparecimento.
Peça a presença de quem DECIDE. Levantamento feito só com o operacional vira
proposta que espera meses por uma aprovação que ninguém defende.',
 '{"atuacao.regiao"}', '{"comercial.prazo_entrega","capacidade.equipe_tecnica"}', '{}', 'escalate',
 'Qualificação antes do deslocamento + garantir o decisor na visita',
 '{"Ir ao local sem qualificar","Fazer levantamento só com quem não decide","Não explicar o que o cliente ganha na visita"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'goal_matching', 'reactive',
 '{"o que vocês indicam","qual sistema serve","o que é melhor pro meu caso","preciso resolver","tenho problema com"}',
 null,
 'Aqui você vira consultor — é o que separa quem vende solução de quem vende
equipamento.
Antes de indicar, entenda a OPERAÇÃO: o que o ambiente exige, quantas horas
funciona, o que acontece quando para, se há norma a cumprir, se é obra nova ou
substituição. A recomendação certa vem do uso, não do catálogo.
Depois indique com o motivo técnico e o impacto prático ("nesse caso eu usaria
X, porque o ambiente exige Y e isso reduz Z"). Traduza técnica em consequência:
o decisor entende parada de produção e conta de luz, não especificação.
Nunca empurre a solução mais cara sem justificativa de uso.',
 '{"solucoes.linhas"}', '{"solucoes.diferencial_tecnico","capacidade.certificacoes"}', '{}', 'escalate',
 'Venda consultiva por operação + tradução de técnica em consequência',
 '{"Indicar pelo catálogo sem entender a operação","Responder em jargão técnico para quem decide por número","Empurrar o mais caro"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'expertise_proof', 'reactive',
 '{"vocês já fizeram","tem referência","quem instala","tem certificação","há quanto tempo atuam","quem é a equipe"}',
 null,
 'Em sistema crítico o medo não é preço: é parar a operação, obra malfeita e
ficar sem assistência depois.
Responda com FATOS do DNA — tempo de mercado, certificações, equipe técnica
própria ou terceirizada, e obras de referência SEMELHANTES a dele. Semelhança
convence mais que volume: um caso do mesmo tipo de operação vale por dez
genéricos.
Fale de quem executa e de como funciona o suporte depois. Fato tranquiliza;
adjetivo aumenta a desconfiança.',
 '{"capacidade.equipe_tecnica"}',
 '{"capacidade.certificacoes","capacidade.obras_referencia","pos_venda.suporte"}', '{}', 'escalate',
 'Prova por semelhança (caso parecido vale mais que volume)',
 '{"Responder com adjetivo","Citar obra sem relação com o caso dele","Omitir que a execução é terceirizada"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'availability', 'reactive',
 '{"qual o prazo","quanto tempo pra instalar","consegue pra esse mês","tenho urgência","quando fica pronto"}',
 null,
 'Prazo em obra é compromisso com terceiros: atrasar trava pedreiro, eletricista
e entrega do imóvel. Prometer o que a produção não cumpre custa mais que perder
a venda.
Separe os prazos: quando você visita, quando entrega a proposta e quanto leva a
execução após aprovação — e diga o que depende de terceiro (importação, obra
civil, disponibilidade do equipamento).
Urgência é sinal de compra: priorize o atendimento e ofereça a visita mais
próxima. Mas não comprometa prazo sem conferir agenda e estoque.',
 '{"comercial.prazo_entrega"}', '{"comercial.prazo_pagamento","atuacao.regiao"}', '{}', 'escalate',
 'Separação de prazos + urgência como sinal de prioridade',
 '{"Prometer prazo sem conferir produção e estoque","Não avisar o que depende de terceiro","Dar prazo único e genérico"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'catalog', 'reactive',
 '{"vocês trabalham com","tem essa marca","fazem manutenção","atendem esse tipo","instalam de outra marca"}',
 null,
 'Confirme usando SOMENTE o DNA: linhas, marcas representadas e o que você
executa. Aceitar serviço fora do domínio gera obra problemática e queima
reputação num mercado onde todo mundo se conhece.
Não atende? Diga com naturalidade e indique parceiro se houver — honestidade
aqui volta em indicação.
Atende? Confirme, diga o que costuma influenciar no valor e conduza ao
levantamento. Se há exclusividade de marca, mencione: é algo que o concorrente
não pode oferecer.',
 '{"solucoes.linhas"}',
 '{"solucoes.marcas_representadas","pos_venda.manutencao_contrato","atuacao.atende_retrofit"}', '{}', 'escalate',
 'Confirmação factual + exclusividade como diferencial',
 '{"Aceitar serviço que não domina","Prometer marca sem confirmar representação","Não aproveitar para agendar"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'commitment_offer', 'reactive',
 '{"tem contrato de manutenção","vocês dão assistência","é só instalar e pronto","tem suporte depois","garantia como funciona"}',
 null,
 'Contrato de manutenção é a receita recorrente do ramo — é o argumento que
derruba o concorrente que só instala e some.
Explique o que o contrato cobre, a frequência e o que ele evita: equipamento sem
manutenção perde eficiência, consome mais e para na pior hora.
Ligue a garantia ao contrato quando for o caso, com honestidade: muitos
fabricantes exigem manutenção periódica para manter a garantia — isso é
argumento técnico legítimo, não pressão.
Ofereça no fechamento, nunca depois da instalação: no calor da compra o cliente
enxerga valor; meses depois, só enxerga custo.',
 '{"pos_venda.manutencao_contrato"}', '{"comercial.garantia","pos_venda.suporte"}', '{}', 'escalate',
 'Recorrência oferecida no fechamento (não depois)',
 '{"Deixar o contrato para depois da instalação","Prometer cobertura que o contrato não tem","Usar a garantia como ameaça em vez de argumento"}',
 'fechar_contrato', 'skill_seed', 'active', null),

(null, 'automacao', 'objections', 'reactive',
 -- "vou levar para a diretoria" e "vou ver com o financeiro" saíram daqui em
 -- ago/2026: são travamento de decisão, e isso tem entrada própria em
 -- commitment_offer (que já inclui municiar o defensor). Aqui fica o processo
 -- de compra declarado — quem assina, quantos orçamentos, qual parecer falta.
 '{"depende da aprovação","vou levar pro engenheiro","preciso de três orçamentos","quem assina o contrato","precisa passar pelo jurídico"}',
 null,
 'Em B2B quem fala com você raramente assina sozinho — e isso é normal, não
desculpa.
Ajude seu contato a DEFENDER a proposta internamente: pergunte qual será a
objeção de quem aprova (quase sempre valor, prazo ou risco de parada) e entregue
o material que responde aquilo — proposta clara, conta de retorno, referências.
Ofereça participar da conversa com o decisor: apresentação técnica de 20 minutos
converte muito mais que PDF repassado por terceiro.
Combine retorno com DATA e descubra o rito da empresa (quando o comitê se reúne,
quando fecha o orçamento). Adaptar-se ao calendário dele encurta o ciclo.',
 '{}', '{"comercial.prazo_pagamento","capacidade.obras_referencia"}', '{}', 'omit',
 'Municiar o defensor interno + acesso ao decisor + calendário da empresa',
 '{"Tratar como enrolação","Entregar proposta que só você entende","Não descobrir quando a verba é definida"}',
 'acessar_decisor', 'skill_seed', 'active', null),

(null, 'automacao', 'retention', 'proactive',
 '{"cliente antigo","já instalamos para ele","faz tempo que atendemos","equipamento antigo","hora de trocar"}',
 null,
 'A base instalada é o ativo mais subaproveitado deste ramo. Equipamento tem
vida útil previsível — e quem instalou sabe exatamente quando ele vai pedir
troca, retrofit ou ampliação.
Retome com gancho técnico e útil: revisão preventiva, atualização de sistema,
eficiência energética, ou o ambiente que ficou para a segunda etapa.
Cliente antigo compra mais rápido, negocia menos e já confia na equipe. Ainda
assim, a maioria das empresas nunca mais liga depois de entregar.
Nunca use alarmismo ("vai quebrar") — use dado: tempo de uso, consumo,
frequência de chamado.',
 '{}', '{"pos_venda.manutencao_contrato","solucoes.linhas","atuacao.atende_retrofit"}', '{}', 'omit',
 'Base instalada como pipeline previsível (vida útil é o gatilho)',
 '{"Nunca mais falar com quem já comprou","Usar medo em vez de dado","Esperar o equipamento quebrar para reaparecer"}',
 'reativar_base', 'skill_seed', 'active', null),

(null, 'automacao', 'reciprocity', 'reactive',
 '{"oi","ola","bom dia","boa tarde","preciso de informações","gostaria de um contato"}',
 null,
 'Em B2B técnico, a primeira resposta já mostra se você é fornecedor de preço ou
parceiro técnico.
Cumprimente, pergunte o que ele quer RESOLVER (não o que quer comprar) e onde —
duas perguntas curtas qualificam e demonstram competência.
Responda rápido: em obra e manutenção, quem responde primeiro costuma levar o
trabalho, porque o cliente já pediu para três empresas.
Não comece por catálogo nem por preço.',
 '{}', '{"atuacao.regiao","solucoes.linhas"}', '{}', 'omit',
 'Abertura por problema (não por produto) + velocidade de resposta',
 '{"Mandar catálogo de imediato","Perguntar só o que ele quer comprar","Demorar horas para responder"}',
 'qualificar', 'skill_seed', 'active', null),

(null, 'automacao', 'ecosystem', 'reactive',
 '{"o engenheiro pediu","meu arquiteto","a construtora","trabalham com projetista","tem parceria"}',
 null,
 'Engenheiro, arquiteto, construtora e integrador são o canal recorrente deste
ramo: quem está na especificação entra em obra atrás de obra, com concorrência
muito menor.
Trate o profissional como parceiro: respeite o projeto, comunique alteração
antes de executar e nunca passe por cima para negociar direto com o cliente
final — isso queima a fonte para sempre.
Ofereça o que ele mais valoriza: cumprir prazo, não dar problema na obra dele e
dar suporte técnico na especificação.
Se há política de parceria, seja transparente.',
 '{}', '{"capacidade.obras_referencia","capacidade.certificacoes"}', '{}', 'omit',
 'Canal de especificação como pipeline recorrente',
 '{"Passar por cima do projetista","Alterar o projeto sem avisar","Não apoiar tecnicamente a especificação"}',
 'cultivar_parceria', 'skill_seed', 'active', null),

(null, 'automacao', 'limits_and_ethics', 'reactive',
 '{"dá pra fazer mais simples","tira uma parte","consegue sem projeto","faz mais barato","precisa de art"}',
 null,
 'Reduzir escopo é legítimo; reduzir SEGURANÇA ou conformidade, nunca. Em
sistema elétrico, térmico e predial há norma, responsabilidade técnica e risco
real de acidente.
Se o cliente pede mais barato, seja transparente sobre o que muda: capacidade,
eficiência, vida útil, garantia. Ele decide — com a informação na mão.
Diga com clareza o que NÃO dá para abrir mão (dimensionamento mínimo,
aterramento, responsável técnico). Perder uma venda por isso é mais barato que
responder por um acidente.
Nunca prometa desempenho, economia ou conformidade que não pode comprovar.',
 '{}', '{"comercial.garantia","capacidade.certificacoes","solucoes.diferencial_tecnico"}',
 '{"Nunca abrir mão de norma técnica e responsabilidade técnica"}', 'omit',
 'Transparência no trade-off + limite inegociável de segurança',
 '{"Subdimensionar para fechar o preço","Prometer economia sem cálculo","Executar sem responsável técnico quando exigido"}',
 'ajustar_escopo', 'skill_seed', 'active', null),

(null, 'automacao', 'ecosystem', 'reactive',
 '{"licitação","edital","pregão","vocês vendem pro governo","tem sicaf","atendem prefeitura"}',
 null,
 'Venda ao setor público é outro jogo: não se ganha por relacionamento, ganha-se
por habilitação em dia, especificação atendida ao pé da letra e preço calculado
com margem real.
Confirme o cadastro (SICAF) e o porte declarado — ME/EPP tem vantagem legal em
licitação e muita empresa perde por não marcar isso.
Antes de disputar, confira ITEM A ITEM se você atende a especificação. Afirmar
que atende sem conferir gera desclassificação ou, pior, contrato impossível de
cumprir.
Atestado de capacidade técnica costuma ser o que elimina concorrente — mantenha
os seus organizados.',
 '{"publico.cadastro_sicaf"}',
 '{"publico.porte_declarado","publico.atestados_capacidade","capacidade.certificacoes"}',
 '{"Nunca afirmar atendimento a especificação sem conferir item a item"}', 'escalate',
 'Habilitação e conformidade como vantagem competitiva',
 '{"Disputar sem conferir a especificação","Esquecer a vantagem de ME/EPP","Deixar certidão vencer"}',
 'avaliar_edital', 'skill_seed', 'active', null),

(null, 'automacao', 'commitment_offer', 'reactive',
 '{"vou levar para a diretoria","preciso aprovar internamente","vamos avaliar","é um investimento alto","vou ver com o financeiro","ficou para o próximo orçamento","estamos analisando"}',
 null,
 'Proposta técnica aprovada tecnicamente e mesmo assim parada quase nunca morre
por preço: morre porque ninguém quer assinar. Quem aprova sabe que se der errado a
conta é dele — parar a operação, errar o fornecedor, gastar mal o orçamento do ano.
Medo de errar pesa mais que vontade de melhorar.
O erro que piora tudo é mandar mais material técnico. Para quem já entendeu, mais
detalhe vira mais risco percebido e mais gente para consultar.
Descubra o que trava de verdade, e pergunte direto: falta verba deste ano, falta
alguém aprovar, ou é receio de a obra parar? Cada uma tem saída diferente, e o
travamento raramente é o que a primeira frase diz.
Depois diminua a decisão. Faseamento resolve mais que desconto: começar por um
setor, um piloto medido, a etapa crítica primeiro. Aprovar um pedaço é infinitamente
mais fácil do que aprovar tudo — e o pedaço que funciona aprova o resto sozinho.
Municie o seu defensor interno com o material que ELE precisa para defender lá
dentro, não o que você gostaria de apresentar.',
 '{"comercial.garantia"}',
 '{"comercial.prazo_entrega","pos_venda.manutencao_contrato","capacidade.obras_referencia","comercial.prazo_pagamento","comercial.ticket_medio"}', '{}', 'escalate',
 'Faseamento e piloto em vez de desconto + municiar quem defende internamente',
 '{"Mandar mais material técnico para quem já aprovou tecnicamente","Dar desconto para destravar aprovação","Aceitar estamos analisando sem descobrir o que trava","Falar só com quem não assina"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt'),

(null, 'automacao', 'catalog', 'reactive',
 '{"só me manda a proposta","não precisa de visita agora","prefiro por email","manda o material técnico","sem reunião","depois a gente conversa","me passa só o escopo"}',
 null,
 'Boa parte do comprador técnico prefere estudar sozinho antes de falar com
qualquer fornecedor — e ele compara em silêncio. Forçar reunião com quem pediu
material é o jeito mais rápido de ser descartado sem nem saber por quê.
Mande o material que permite ele avançar sem você: escopo do que você faz, linhas
atendidas, certificações e habilitações, prazo típico e faixa de investimento
quando existir no seu DNA. Preço fechado sem levantamento não se manda; faixa e
premissas, sim.
Diga com clareza o que MUDA depois do levantamento técnico. Isso protege você de
ser comparado por um número que não existe e ainda mostra competência.
Faça no máximo duas perguntas por escrito — as que mudam o escopo (tamanho da
área, situação do equipamento atual). E deixe a porta aberta com um retorno
combinado, sem cobrança.',
 '{"solucoes.linhas"}',
 '{"capacidade.certificacoes","comercial.ticket_medio","comercial.prazo_entrega","atuacao.regiao","capacidade.obras_referencia"}', '{}', 'escalate',
 'Material que permite avançar sozinho + o que muda depois do levantamento',
 '{"Forçar reunião para quem pediu material","Mandar preço fechado sem levantamento","Enviar material genérico de marketing","Sumir quando ele não responde de imediato"}',
 'entregar_material', 'skill_seed', 'active', null);
