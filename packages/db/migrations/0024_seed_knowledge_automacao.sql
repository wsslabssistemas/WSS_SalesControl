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
 '{"quanto custa","qual o valor","me passa um orcamento","quanto fica","preco do sistema","valor da instalacao"}',
 null,
 'Orcar equipamento tecnico por telefone e o erro mais caro do ramo: sem ver
carga, infraestrutura e condicao do local, qualquer numero esta errado — e o
valor real depois vira "voces aumentaram".
Explique em UMA linha por que depende do levantamento (carga termica, ponto de
energia, estrutura, acesso). Quem entende o motivo aceita bem.
Se voce trabalha com faixa de ticket, informe a FAIXA: qualifica quem tem verba
e poupa visita perdida.
Termine oferecendo a visita tecnica com dois horarios — e ali que o escopo
aparece e a venda comeca.',
 '{"comercial.ticket_medio"}', '{"comercial.prazo_entrega","atuacao.regiao"}', '{}', 'escalate',
 'Ancoragem por faixa + conducao ao levantamento tecnico',
 '{"Dar numero fechado sem levantamento","Fugir da pergunta sem explicar o porque","Nao oferecer a visita e deixar esfriar"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'objections', 'reactive',
 '{"ta caro","achei caro","fora do orcamento","o concorrente fez por menos","recebi proposta menor"}',
 null,
 'Em equipamento, preco de compra e a menor parte da conta. O que decide e o
CUSTO TOTAL: consumo de energia, parada de operacao, manutencao e vida util.
Um sistema 20% mais barato que consome mais e para no verao custa muito mais
em dois anos.
NUNCA ataque o concorrente. Peca para comparar item a item: marca e linha do
equipamento, capacidade real, se inclui projeto, instalacao, start-up,
treinamento e garantia. Proposta tecnica so parece igual quando ninguem abre o
escopo.
Se o valor nao cabe, ofereca FASEAMENTO — comecar pelo ambiente critico e
expandir depois. Projeto iniciado vale mais que proposta perfeita recusada.',
 '{"solucoes.diferencial_tecnico"}',
 '{"comercial.garantia","pos_venda.manutencao_contrato","comercial.prazo_pagamento"}', '{}', 'escalate',
 'Custo total de propriedade + comparacao item a item + faseamento',
 '{"Baixar preco sem tirar escopo","Falar mal do concorrente","Comparar so o valor de compra"}',
 'defender_valor', 'skill_seed', 'active', null),

(null, 'automacao', 'commitment_offer', 'proactive',
 '{"enviei a proposta","mandou o orcamento","ficou de responder","nao respondeu a proposta","segue a proposta tecnica"}',
 null,
 'ENTRADA MAIS IMPORTANTE DO SEGMENTO. Em ciclo longo, proposta enviada e
esquecida e a regra — e a maioria das empresas faz UM follow-up e desiste.
Nunca cobre decisao. Cada toque precisa ter angulo NOVO: (1) tirar duvida
tecnica do escopo, (2) trazer a conta de retorno ou a condicao de pagamento,
(3) propor ajuste de escopo ou etapa inicial.
Pergunte tambem o que falta INTERNAMENTE: em B2B a proposta costuma travar em
aprovacao, verba ou prioridade — nao em vontade. Descobrir isso muda tudo, e
voce so descobre perguntando.
Combine sempre a proxima data. Deixar em aberto e perder.',
 '{"comercial.prazo_pagamento"}',
 '{"comercial.prazo_entrega","comercial.garantia","capacidade.obras_referencia"}', '{}', 'escalate',
 'Cadencia com angulo novo + descobrir o travamento interno',
 '{"Enviar e esperar","Repetir a mesma pergunta a cada toque","Assumir que silencio e recusa","Sumir apos um follow-up"}',
 'retomar_proposta', 'skill_seed', 'active', null),

(null, 'automacao', 'risk_free_entry', 'reactive',
 '{"voces fazem visita","vem ver aqui","precisa ir no local","fazem levantamento","cobra a visita"}',
 null,
 'A visita tecnica e onde a venda realmente acontece: e o momento em que voce
vira consultor e nao fornecedor de preco.
Qualifique antes de deslocar — o que ele quer resolver, se a obra existe, qual
o prazo e quem participa. Visita para quem so pesquisa preco e prejuizo.
Explique o que acontece no levantamento (medicao, avaliacao de infra, fotos) e
o que ele ja sai sabendo. Isso aumenta muito o comparecimento.
Peca a presenca de quem DECIDE. Levantamento feito so com o operacional vira
proposta que espera meses por uma aprovacao que ninguem defende.',
 '{"atuacao.regiao"}', '{"comercial.prazo_entrega","capacidade.equipe_tecnica"}', '{}', 'escalate',
 'Qualificacao antes do deslocamento + garantir o decisor na visita',
 '{"Ir ao local sem qualificar","Fazer levantamento so com quem nao decide","Nao explicar o que o cliente ganha na visita"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'goal_matching', 'reactive',
 '{"o que voces indicam","qual sistema serve","o que e melhor pro meu caso","preciso resolver","tenho problema com"}',
 null,
 'Aqui voce vira consultor — e o que separa quem vende solucao de quem vende
equipamento.
Antes de indicar, entenda a OPERACAO: o que o ambiente exige, quantas horas
funciona, o que acontece quando para, se ha norma a cumprir, se e obra nova ou
substituicao. A recomendacao certa vem do uso, nao do catalogo.
Depois indique com o motivo tecnico e o impacto pratico ("nesse caso eu usaria
X, porque o ambiente exige Y e isso reduz Z"). Traduza tecnica em consequencia:
o decisor entende parada de producao e conta de luz, nao especificacao.
Nunca empurre a solucao mais cara sem justificativa de uso.',
 '{"solucoes.linhas"}', '{"solucoes.diferencial_tecnico","capacidade.certificacoes"}', '{}', 'escalate',
 'Venda consultiva por operacao + traducao de tecnica em consequencia',
 '{"Indicar pelo catalogo sem entender a operacao","Responder em jargao tecnico para quem decide por numero","Empurrar o mais caro"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'expertise_proof', 'reactive',
 '{"voces ja fizeram","tem referencia","quem instala","tem certificacao","ha quanto tempo atuam","quem e a equipe"}',
 null,
 'Em sistema critico o medo nao e preco: e parar a operacao, obra malfeita e
ficar sem assistencia depois.
Responda com FATOS do DNA — tempo de mercado, certificacoes, equipe tecnica
propria ou terceirizada, e obras de referencia SEMELHANTES a dele. Semelhanca
convence mais que volume: um caso do mesmo tipo de operacao vale por dez
genericos.
Fale de quem executa e de como funciona o suporte depois. Fato tranquiliza;
adjetivo aumenta a desconfianca.',
 '{"capacidade.equipe_tecnica"}',
 '{"capacidade.certificacoes","capacidade.obras_referencia","pos_venda.suporte"}', '{}', 'escalate',
 'Prova por semelhanca (caso parecido vale mais que volume)',
 '{"Responder com adjetivo","Citar obra sem relacao com o caso dele","Omitir que a execucao e terceirizada"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'availability', 'reactive',
 '{"qual o prazo","quanto tempo pra instalar","consegue pra esse mes","tenho urgencia","quando fica pronto"}',
 null,
 'Prazo em obra e compromisso com terceiros: atrasar trava pedreiro, eletricista
e entrega do imovel. Prometer o que a producao nao cumpre custa mais que perder
a venda.
Separe os prazos: quando voce visita, quando entrega a proposta e quanto leva a
execucao apos aprovacao — e diga o que depende de terceiro (importacao, obra
civil, disponibilidade do equipamento).
Urgencia e sinal de compra: priorize o atendimento e ofereca a visita mais
proxima. Mas nao comprometa prazo sem conferir agenda e estoque.',
 '{"comercial.prazo_entrega"}', '{"comercial.prazo_pagamento","atuacao.regiao"}', '{}', 'escalate',
 'Separacao de prazos + urgencia como sinal de prioridade',
 '{"Prometer prazo sem conferir producao e estoque","Nao avisar o que depende de terceiro","Dar prazo unico e generico"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'catalog', 'reactive',
 '{"voces trabalham com","tem essa marca","fazem manutencao","atendem esse tipo","instalam de outra marca"}',
 null,
 'Confirme usando SOMENTE o DNA: linhas, marcas representadas e o que voce
executa. Aceitar servico fora do dominio gera obra problematica e queima
reputacao num mercado onde todo mundo se conhece.
Nao atende? Diga com naturalidade e indique parceiro se houver — honestidade
aqui volta em indicacao.
Atende? Confirme, diga o que costuma influenciar no valor e conduza ao
levantamento. Se ha exclusividade de marca, mencione: e algo que o concorrente
nao pode oferecer.',
 '{"solucoes.linhas"}',
 '{"solucoes.marcas_representadas","pos_venda.manutencao_contrato","atuacao.atende_retrofit"}', '{}', 'escalate',
 'Confirmacao factual + exclusividade como diferencial',
 '{"Aceitar servico que nao domina","Prometer marca sem confirmar representacao","Nao aproveitar para agendar"}',
 'agendar_visita', 'skill_seed', 'active', null),

(null, 'automacao', 'commitment_offer', 'reactive',
 '{"tem contrato de manutencao","voces dao assistencia","e so instalar e pronto","tem suporte depois","garantia como funciona"}',
 null,
 'Contrato de manutencao e a receita recorrente do ramo — e o argumento que
derruba o concorrente que so instala e some.
Explique o que o contrato cobre, a frequencia e o que ele evita: equipamento sem
manutencao perde eficiencia, consome mais e para na pior hora.
Ligue a garantia ao contrato quando for o caso, com honestidade: muitos
fabricantes exigem manutencao periodica para manter a garantia — isso e
argumento tecnico legitimo, nao pressao.
Ofereca no fechamento, nunca depois da instalacao: no calor da compra o cliente
enxerga valor; meses depois, so enxerga custo.',
 '{"pos_venda.manutencao_contrato"}', '{"comercial.garantia","pos_venda.suporte"}', '{}', 'escalate',
 'Recorrencia oferecida no fechamento (nao depois)',
 '{"Deixar o contrato para depois da instalacao","Prometer cobertura que o contrato nao tem","Usar a garantia como ameaca em vez de argumento"}',
 'fechar_contrato', 'skill_seed', 'active', null),

(null, 'automacao', 'objections', 'reactive',
 -- "vou levar para a diretoria" e "vou ver com o financeiro" saíram daqui em
 -- ago/2026: são travamento de decisão, e isso tem entrada própria em
 -- commitment_offer (que já inclui municiar o defensor). Aqui fica o processo
 -- de compra declarado — quem assina, quantos orçamentos, qual parecer falta.
 '{"depende da aprovacao","vou levar pro engenheiro","preciso de tres orcamentos","quem assina o contrato","precisa passar pelo juridico"}',
 null,
 'Em B2B quem fala com voce raramente assina sozinho — e isso e normal, nao
desculpa.
Ajude seu contato a DEFENDER a proposta internamente: pergunte qual sera a
objecao de quem aprova (quase sempre valor, prazo ou risco de parada) e entregue
o material que responde aquilo — proposta clara, conta de retorno, referencias.
Ofereca participar da conversa com o decisor: apresentacao tecnica de 20 minutos
converte muito mais que PDF repassado por terceiro.
Combine retorno com DATA e descubra o rito da empresa (quando o comite se reune,
quando fecha o orcamento). Adaptar-se ao calendario dele encurta o ciclo.',
 '{}', '{"comercial.prazo_pagamento","capacidade.obras_referencia"}', '{}', 'omit',
 'Municiar o defensor interno + acesso ao decisor + calendario da empresa',
 '{"Tratar como enrolacao","Entregar proposta que so voce entende","Nao descobrir quando a verba e definida"}',
 'acessar_decisor', 'skill_seed', 'active', null),

(null, 'automacao', 'retention', 'proactive',
 '{"cliente antigo","ja instalamos para ele","faz tempo que atendemos","equipamento antigo","hora de trocar"}',
 null,
 'A base instalada e o ativo mais subaproveitado deste ramo. Equipamento tem
vida util previsivel — e quem instalou sabe exatamente quando ele vai pedir
troca, retrofit ou ampliacao.
Retome com gancho tecnico e util: revisao preventiva, atualizacao de sistema,
eficiencia energetica, ou o ambiente que ficou para a segunda etapa.
Cliente antigo compra mais rapido, negocia menos e ja confia na equipe. Ainda
assim, a maioria das empresas nunca mais liga depois de entregar.
Nunca use alarmismo ("vai quebrar") — use dado: tempo de uso, consumo,
frequencia de chamado.',
 '{}', '{"pos_venda.manutencao_contrato","solucoes.linhas","atuacao.atende_retrofit"}', '{}', 'omit',
 'Base instalada como pipeline previsivel (vida util e o gatilho)',
 '{"Nunca mais falar com quem ja comprou","Usar medo em vez de dado","Esperar o equipamento quebrar para reaparecer"}',
 'reativar_base', 'skill_seed', 'active', null),

(null, 'automacao', 'reciprocity', 'reactive',
 '{"oi","ola","bom dia","boa tarde","preciso de informacoes","gostaria de um contato"}',
 null,
 'Em B2B tecnico, a primeira resposta ja mostra se voce e fornecedor de preco ou
parceiro tecnico.
Cumprimente, pergunte o que ele quer RESOLVER (nao o que quer comprar) e onde —
duas perguntas curtas qualificam e demonstram competencia.
Responda rapido: em obra e manutencao, quem responde primeiro costuma levar o
trabalho, porque o cliente ja pediu para tres empresas.
Nao comece por catalogo nem por preco.',
 '{}', '{"atuacao.regiao","solucoes.linhas"}', '{}', 'omit',
 'Abertura por problema (nao por produto) + velocidade de resposta',
 '{"Mandar catalogo de imediato","Perguntar so o que ele quer comprar","Demorar horas para responder"}',
 'qualificar', 'skill_seed', 'active', null),

(null, 'automacao', 'ecosystem', 'reactive',
 '{"o engenheiro pediu","meu arquiteto","a construtora","trabalham com projetista","tem parceria"}',
 null,
 'Engenheiro, arquiteto, construtora e integrador sao o canal recorrente deste
ramo: quem esta na especificacao entra em obra atras de obra, com concorrencia
muito menor.
Trate o profissional como parceiro: respeite o projeto, comunique alteracao
antes de executar e nunca passe por cima para negociar direto com o cliente
final — isso queima a fonte para sempre.
Ofereca o que ele mais valoriza: cumprir prazo, nao dar problema na obra dele e
dar suporte tecnico na especificacao.
Se ha politica de parceria, seja transparente.',
 '{}', '{"capacidade.obras_referencia","capacidade.certificacoes"}', '{}', 'omit',
 'Canal de especificacao como pipeline recorrente',
 '{"Passar por cima do projetista","Alterar o projeto sem avisar","Nao apoiar tecnicamente a especificacao"}',
 'cultivar_parceria', 'skill_seed', 'active', null),

(null, 'automacao', 'limits_and_ethics', 'reactive',
 '{"da pra fazer mais simples","tira uma parte","consegue sem projeto","faz mais barato","precisa de art"}',
 null,
 'Reduzir escopo e legitimo; reduzir SEGURANCA ou conformidade, nunca. Em
sistema eletrico, termico e predial ha norma, responsabilidade tecnica e risco
real de acidente.
Se o cliente pede mais barato, seja transparente sobre o que muda: capacidade,
eficiencia, vida util, garantia. Ele decide — com a informacao na mao.
Diga com clareza o que NAO da para abrir mao (dimensionamento minimo,
aterramento, responsavel tecnico). Perder uma venda por isso e mais barato que
responder por um acidente.
Nunca prometa desempenho, economia ou conformidade que nao pode comprovar.',
 '{}', '{"comercial.garantia","capacidade.certificacoes","solucoes.diferencial_tecnico"}',
 '{"Nunca abrir mao de norma tecnica e responsabilidade tecnica"}', 'omit',
 'Transparencia no trade-off + limite inegociavel de seguranca',
 '{"Subdimensionar para fechar o preco","Prometer economia sem calculo","Executar sem responsavel tecnico quando exigido"}',
 'ajustar_escopo', 'skill_seed', 'active', null),

(null, 'automacao', 'ecosystem', 'reactive',
 '{"licitacao","edital","pregao","voces vendem pro governo","tem sicaf","atendem prefeitura"}',
 null,
 'Venda ao setor publico e outro jogo: nao se ganha por relacionamento, ganha-se
por habilitacao em dia, especificacao atendida ao pe da letra e preco calculado
com margem real.
Confirme o cadastro (SICAF) e o porte declarado — ME/EPP tem vantagem legal em
licitacao e muita empresa perde por nao marcar isso.
Antes de disputar, confira ITEM A ITEM se voce atende a especificacao. Afirmar
que atende sem conferir gera desclassificacao ou, pior, contrato impossivel de
cumprir.
Atestado de capacidade tecnica costuma ser o que elimina concorrente — mantenha
os seus organizados.',
 '{"publico.cadastro_sicaf"}',
 '{"publico.porte_declarado","publico.atestados_capacidade","capacidade.certificacoes"}',
 '{"Nunca afirmar atendimento a especificacao sem conferir item a item"}', 'escalate',
 'Habilitacao e conformidade como vantagem competitiva',
 '{"Disputar sem conferir a especificacao","Esquecer a vantagem de ME/EPP","Deixar certidao vencer"}',
 'avaliar_edital', 'skill_seed', 'active', null),

(null, 'automacao', 'commitment_offer', 'reactive',
 '{"vou levar para a diretoria","preciso aprovar internamente","vamos avaliar","e um investimento alto","vou ver com o financeiro","ficou para o proximo orcamento","estamos analisando"}',
 null,
 'Proposta tecnica aprovada tecnicamente e mesmo assim parada quase nunca morre
por preco: morre porque ninguem quer assinar. Quem aprova sabe que se der errado a
conta e dele — parar a operacao, errar o fornecedor, gastar mal o orcamento do ano.
Medo de errar pesa mais que vontade de melhorar.
O erro que piora tudo e mandar mais material tecnico. Para quem ja entendeu, mais
detalhe vira mais risco percebido e mais gente para consultar.
Descubra o que trava de verdade, e pergunte direto: falta verba deste ano, falta
alguem aprovar, ou e receio de a obra parar? Cada uma tem saida diferente, e o
travamento raramente e o que a primeira frase diz.
Depois diminua a decisao. Faseamento resolve mais que desconto: comecar por um
setor, um piloto medido, a etapa critica primeiro. Aprovar um pedaco e infinitamente
mais facil do que aprovar tudo — e o pedaco que funciona aprova o resto sozinho.
Municie o seu defensor interno com o material que ELE precisa para defender la
dentro, nao o que voce gostaria de apresentar.',
 '{"comercial.garantia"}',
 '{"comercial.prazo_entrega","pos_venda.manutencao_contrato","capacidade.obras_referencia","comercial.prazo_pagamento","comercial.ticket_medio"}', '{}', 'escalate',
 'Faseamento e piloto em vez de desconto + municiar quem defende internamente',
 '{"Mandar mais material tecnico para quem ja aprovou tecnicamente","Dar desconto para destravar aprovacao","Aceitar estamos analisando sem descobrir o que trava","Falar so com quem nao assina"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt'),

(null, 'automacao', 'catalog', 'reactive',
 '{"so me manda a proposta","nao precisa de visita agora","prefiro por email","manda o material tecnico","sem reuniao","depois a gente conversa","me passa so o escopo"}',
 null,
 'Boa parte do comprador tecnico prefere estudar sozinho antes de falar com
qualquer fornecedor — e ele compara em silencio. Forcar reuniao com quem pediu
material e o jeito mais rapido de ser descartado sem nem saber por que.
Mande o material que permite ele avancar sem voce: escopo do que voce faz, linhas
atendidas, certificacoes e habilitacoes, prazo tipico e faixa de investimento
quando existir no seu DNA. Preco fechado sem levantamento nao se manda; faixa e
premissas, sim.
Diga com clareza o que MUDA depois do levantamento tecnico. Isso protege voce de
ser comparado por um numero que nao existe e ainda mostra competencia.
Faca no maximo duas perguntas por escrito — as que mudam o escopo (tamanho da
area, situacao do equipamento atual). E deixe a porta aberta com um retorno
combinado, sem cobranca.',
 '{"solucoes.linhas"}',
 '{"capacidade.certificacoes","comercial.ticket_medio","comercial.prazo_entrega","atuacao.regiao","capacidade.obras_referencia"}', '{}', 'escalate',
 'Material que permite avancar sozinho + o que muda depois do levantamento',
 '{"Forcar reuniao para quem pediu material","Mandar preco fechado sem levantamento","Enviar material generico de marketing","Sumir quando ele nao responde de imediato"}',
 'entregar_material', 'skill_seed', 'active', null);
