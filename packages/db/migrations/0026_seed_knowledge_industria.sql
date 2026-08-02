-- =====================================================================
-- COS — MIGRATION 0026 : BIBLIOTECA DE INDÚSTRIA E FÁBRICA
--
-- DIAGNÓSTICO (pesquisa do fundador, ago/2026): a indústria brasileira
-- tem herança de gestão de chão de fábrica. Vê tecnologia comercial só
-- como ERP e entrega a venda ao REPRESENTANTE AUTÔNOMO. Produto caro,
-- ciclo longo, aquisição de cliente quase primitiva.
--
-- FUNDAMENTO DO SETOR (vocabulário de quem vende indústria):
--   • PASTA FECHADA: o representante visita sempre a mesma carteira.
--     Loja nova dá trabalho e demora a pagar comissão. A fábrica só
--     cresce quando o cliente antigo cresce.
--   • +90 DIAS SEM REPOR: o cliente não avisa que trocou de fornecedor,
--     ele só para de comprar. É o alerta mais valioso e o mais barato
--     de agir — a relação ainda existe.
--   • SELL-OUT DO LOJISTA: não importa o que ele comprou, importa o que
--     ele conseguiu vender. Estoque encalhado não repõe.
--   • AMOSTRA COM DATA: amostra sem retorno combinado morre na mesa do
--     comprador. Quem envia marca o dia de buscar o parecer.
--   • TIMING: implemento agrícola se decide meses antes da safra;
--     calçado e têxtil, no calendário de coleção. Chegar no mês da
--     compra é chegar tarde.
--   • CONFLITO DE CANAL: passar por cima do representante que atende a
--     conta destrói a relação que sustenta a receita.
--
-- REGRA DA TRAVA ANTI-INVENÇÃO nesta biblioteca:
--   `escalate` quando o fato que falta é NÚMERO ou COMPROMISSO (preço,
--   lote, prazo, capacidade, exclusividade) — inventar ali é o erro caro.
--   `omit` quando o fato que falta é PROVA OPCIONAL (laudo, histórico):
--   a resposta sai sem a prova, nunca com uma prova inventada.
--
-- TESE: aqui não se vende atendimento. Vende-se uma aquisição previsível
-- que não depende do humor do representante.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'industria' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

-- ---------------------------------------------------------------- PRICING
(null, 'industria', 'pricing', 'reactive',
 '{"qual o preco","manda a tabela","quanto custa o metro","qual o valor da peca","me passa os valores","qual o preco por unidade"}',
 null,
 'Preco solto nao existe em industria: o mesmo item tem preco diferente por
quantidade, por cor, por acabamento e por prazo de pagamento. Mandar um numero
seco entrega ao comprador exatamente o que ele precisa para te comparar com o
importado numa planilha.
Pergunte primeiro TRES coisas: qual item, que volume por pedido e com que
frequencia. Sem isso voce nao esta cotando, esta chutando.
Depois cote em FAIXA: o preco no lote minimo e o preco na faixa seguinte. Mostrar
o degrau ("a partir de tanto, cai para tanto") aumenta o pedido sem parecer
empurro, porque o comprador enxerga o ganho dele.
Preco anda junto com condicao: prazo de pagamento e frete pesam tanto quanto o
numero. Em compra industrial, quem resolve fluxo de caixa ganha pedido.',
 '{"comercial.pedido_minimo","producao.lote_minimo"}',
 '{"comercial.prazo_pagamento","comercial.politica_desconto","comercial.frete"}', '{}', 'escalate',
 'Cotacao por faixa de volume, nunca preco solto',
 '{"Dar um preco unico sem saber volume","Mandar tabela completa para quem nao pediu","Falar preco sem falar prazo de pagamento","Cotar por telefone sem confirmar a especificacao"}',
 'levantar_volume', 'skill_seed', 'active', null),

-- ------------------------------------------------------------- OBJECTIONS
(null, 'industria', 'objections', 'reactive',
 '{"o importado e mais barato","o chines faz por menos","importado sai melhor","compro da china","o preco do importado","importacao compensa mais"}',
 null,
 'Esta e a objecao numero um da industria brasileira, e quase sempre e comparacao
de preco de tabela contra CUSTO TOTAL. Nao brigue no preco por quilo.
Abra a conta inteira do importado: cambio que oscila entre o pedido e a chegada,
lote de container inteiro (dinheiro parado em estoque), 60 a 90 dias de transito,
imposto, despacho, e — o mais caro — a reposicao. Faltou material no meio da
producao dele, o importado nao repoe em uma semana; voce repoe.
Pergunte o que acontece quando chega lote com defeito. Com o importado, ele
discute por e-mail com um fornecedor a doze mil quilometros. Com voce, ele fala
com alguem que atende o telefone e responde pelo lote.
Nunca ataque a escolha dele nem o produto importado. Mostre a conta e deixe o
comprador fazer a matematica — comprador tecnico gosta de decidir sozinho.',
 '{"producao.prazo_producao","diferencial.motivo_trocar"}',
 '{"producao.lote_minimo","diferencial.assistencia","producao.capacidade","canal.regioes"}', '{}', 'escalate',
 'Custo total contra preco de tabela + risco de reposicao',
 '{"Brigar no preco por quilo","Falar mal do produto importado","Ignorar que o problema real e prazo de reposicao","Prometer prazo que a fabrica nao cumpre so para ganhar a conta"}',
 'abrir_conta_total', 'skill_seed', 'active', null),

(null, 'industria', 'objections', 'reactive',
 '{"ja tenho fornecedor","compro de outra fabrica","estou atendido","tenho contrato com outro","nao preciso trocar","meu fornecedor atende bem"}',
 null,
 'Todo comprador bom JA tem fornecedor. Se nao tivesse, a linha dele estaria
parada. Isso nao e recusa, e o ponto de partida — e nao se pede troca.
Peca para ser SEGUNDA FONTE. Comprador industrial experiente sabe que depender de
um fornecedor unico e risco: quebrou maquina la, parou a producao dele aqui. Ser
a segunda fonte e um pedido pequeno, tecnico e legitimo — e e assim que se entra.
Procure a fresta: um item que costuma atrasar, uma cor ou medida que o atual nao
faz, um lote pequeno que o outro nao aceita produzir. A brecha esta sempre no que
o fornecedor grande considera pouco lucrativo.
Pergunte o que o atual NAO resolve bem — prazo, refugo, atendimento tecnico,
flexibilidade de lote. O comprador conta, desde que voce nao ataque a escolha
dele.',
 '{"diferencial.motivo_trocar"}',
 '{"producao.prazo_producao","producao.desenvolvimento","producao.lote_minimo"}', '{}', 'escalate',
 'Entrada como segunda fonte, nao como substituto',
 '{"Pedir para substituir o fornecedor atual","Falar mal de quem ele escolheu","Nao investigar onde o atual falha","Insistir em volume grande na primeira conversa"}',
 'virar_segunda_fonte', 'skill_seed', 'active', null),

(null, 'industria', 'objections', 'reactive',
 '{"o lote e muito alto","nao consigo comprar essa quantidade","minha loja e pequena","nao giro tudo isso","preciso de menos","o minimo e alto demais"}',
 null,
 'Lote minimo existe por causa de setup de maquina, nao por ganancia — explique
isso em uma frase, sem pedir desculpa. Quem entende por que o minimo existe para
de achar que e negociacao.
Depois, resolva o problema dele de verdade. Caminhos que funcionam em industria:
mix de entrada (o minimo distribuido entre itens, nao todo em um), lote de teste
com prazo maior de pagamento, entrega parcelada do mesmo pedido, ou agrupar com
o proximo pedido de colecao.
Se nada couber, seja honesto: melhor perder um pedido do que produzir um lote que
vai encalhar na loja dele e matar a recompra. Cliente com estoque parado nao volta
— e ainda conta para os outros que o produto nao gira.',
 '{"producao.lote_minimo"}',
 '{"comercial.pedido_minimo","comercial.prazo_pagamento","produto.linhas"}', '{}', 'escalate',
 'Explicar o setup e fracionar o minimo em mix de entrada',
 '{"Baixar o lote sem calcular o setup","Empurrar volume que nao gira na loja dele","Tratar o minimo como tabu e nao explicar por que existe"}',
 'montar_mix_de_entrada', 'skill_seed', 'active', null),

(null, 'industria', 'objections', 'reactive',
 '{"esta caro","achei salgado","o outro faz mais barato","da para melhorar o preco","seu preco esta alto"}',
 null,
 'Antes de mexer no preco, descubra caro COMPARADO A QUE. Quase sempre a
comparacao e com uma especificacao inferior — gramatura menor, materia-prima
reciclada, acabamento diferente. Comparar dois numeros de especificacoes
diferentes nao e comparacao, e armadilha.
Traga a conversa para o custo por peca PRODUZIDA, nao por metro comprado.
Material que rende mais, que gera menos refugo e que nao para a linha por defeito
sai mais barato no fim do mes, mesmo custando mais na entrada. Esse e o numero
que o comprador tecnico entende e que o comprador de preco nunca calculou.
Se precisar ceder, ceda em CONDICAO antes de ceder em preco: prazo de pagamento,
frete, entrega parcelada. Condicao preserva margem e costuma resolver o problema
real, que e caixa.',
 '{"produto.especificacao"}',
 '{"comercial.politica_desconto","comercial.prazo_pagamento","diferencial.motivo_trocar"}', '{}', 'escalate',
 'Custo por peca produzida + ceder condicao antes de preco',
 '{"Dar desconto na primeira pressao","Comparar produtos de especificacao diferente","Nao perguntar com quem ele esta comparando"}',
 'defender_margem', 'skill_seed', 'active', null),

-- --------------------------------------------------------- RISK_FREE_ENTRY
(null, 'industria', 'risk_free_entry', 'reactive',
 '{"nunca trabalhei com voces","nao conheco a fabrica","e se nao vender","como faco para testar","quero comecar devagar","nao quero arriscar"}',
 null,
 'Esse comprador nao esta duvidando do seu produto: esta com medo de comprar
estoque que nao gira. O medo e legitimo e resolve-se com tamanho, nao com
discurso.
Ofereca a menor entrada que ainda prova o produto: um lote de teste, um mix
enxuto dos itens de maior giro, ou uma cor so. O objetivo do primeiro pedido nao
e faturar, e o produto ganhar prateleira e provar giro na loja dele.
Combine na hora como voces vao MEDIR o teste: em quanto tempo, quantas pecas,
e quando voces conversam de novo. Teste sem data de avaliacao vira estoque
esquecido no fundo do deposito.
Se voce apoia com material de vitrine ou catalogo, ofereca junto — ajuda o giro
a acontecer, que e o que traz o segundo pedido.',
 '{"producao.lote_minimo","comercial.pedido_minimo"}',
 '{"canal.apoio_ao_cliente","comercial.prazo_pagamento","produto.linhas"}', '{}', 'escalate',
 'Pedido de entrada com data de avaliacao combinada',
 '{"Empurrar o mix completo no primeiro pedido","Nao combinar quando avaliar o giro","Prometer recompra de estoque que nao vendeu"}',
 'fechar_pedido_entrada', 'skill_seed', 'active', null),

-- ----------------------------------------------------------- RECIPROCITY
(null, 'industria', 'reciprocity', 'reactive',
 '{"manda uma amostra","tem como mandar mostruario","quero ver o material","posso testar antes","manda catalogo","tem amostra"}',
 null,
 'Pedido de amostra e o sinal de compra mais forte deste segmento — e o mais
desperdicado. Amostra despachada sem combinacao morre na mesa do comprador.
Antes de enviar, combine tres coisas: PARA QUEM vai (comprador, desenvolvimento
ou producao), O QUE vai ser testado (qual maquina, qual aplicacao) e QUANDO voces
falam do resultado. Uma data marcada transforma amostra em etapa; sem ela, vira
brinde.
Envie o que resolve a duvida DELE, nao o mostruario inteiro: amostra demais dilui
a decisao e atrasa o parecer.
Mande a ficha tecnica junto. Em industria quem decide o teste costuma ser tecnico,
e ficha completa poupa uma rodada inteira de perguntas.',
 '{"produto.linhas"}',
 '{"produto.especificacao","canal.apoio_ao_cliente","produto.certificacoes"}', '{}', 'omit',
 'Amostra com destinatario, teste e data de retorno combinados',
 '{"Enviar amostra sem marcar o retorno","Mandar o mostruario inteiro","Nao descobrir quem vai testar","Enviar sem a ficha tecnica"}',
 'agendar_parecer', 'skill_seed', 'active', null),

-- ---------------------------------------------------------- AVAILABILITY
(null, 'industria', 'availability', 'reactive',
 '{"para quando fica pronto","qual o prazo de entrega","consegue entregar essa semana","tem pronta entrega","quanto tempo demora","precisa para ontem"}',
 null,
 'Prazo em industria e promessa de producao, nao estimativa simpatica. Prazo dado
para agradar e o que faz perder o cliente no segundo pedido — e o segundo pedido
e onde estava o dinheiro.
Responda com o prazo real a partir da CONFIRMACAO do pedido, e diga o que faz o
relogio comecar a contar: aprovacao de amostra, cor definida, cadastro aprovado,
sinal. Comprador se irrita muito mais com atraso do que com prazo longo.
Se a urgencia e real, negocie escopo em vez de mentir prazo: entrega parcial do
que ja esta em producao, priorizar o item que trava a linha dele, ou uma medida
padrao que sai antes da especial.
Se voce nao consegue a data que ele quer, diga na hora. Perder um pedido por
honestidade custa infinitamente menos do que parar a linha de um cliente novo.',
 '{"producao.prazo_producao"}',
 '{"producao.capacidade","canal.regioes","comercial.frete"}', '{}', 'escalate',
 'Prazo a partir do gatilho de producao + negociar escopo, nunca a data',
 '{"Prometer o prazo que o cliente quer ouvir","Nao dizer o que faz o prazo comecar a contar","Assumir volume acima da capacidade para nao perder o pedido"}',
 'confirmar_prazo_real', 'skill_seed', 'active', null),

-- --------------------------------------------------------------- CATALOG
(null, 'industria', 'catalog', 'reactive',
 '{"qual a gramatura","qual a composicao","que medida tem","serve para minha aplicacao","tem ficha tecnica","qual a resistencia","que material e"}',
 null,
 'Pergunta tecnica se responde com dado, nunca com adjetivo. "Otima qualidade" nao
significa nada para quem vai colocar o material na maquina; gramatura, composicao,
medida e tolerancia significam tudo.
Antes de responder, descubra a APLICACAO: o mesmo item serve num uso e falha em
outro. Vender o produto errado para a aplicacao errada gera devolucao, e
devolucao em industria mata a conta inteira, nao so o pedido.
Se o dado exato nao esta no seu DNA, nao arredonde. Especificacao chutada vira
lote reprovado no recebimento do cliente.
Quando a aplicacao dele nao combina com o item que ele pediu, diga e ofereca o
certo. Corrigir a especificacao do comprador e a coisa que mais constroi
autoridade tecnica nesse mercado.',
 '{"produto.especificacao","produto.linhas"}',
 '{"produto.aplicacoes","produto.certificacoes"}', '{}', 'escalate',
 'Responder com dado tecnico e confirmar a aplicacao antes',
 '{"Responder com adjetivo em vez de numero","Arredondar especificacao","Vender item que nao serve para a aplicacao dele"}',
 'confirmar_aplicacao', 'skill_seed', 'active', null),

(null, 'industria', 'catalog', 'reactive',
 '{"voces fazem sob medida","da para desenvolver um item","preciso de uma cor especifica","fazem exclusivo para mim","aceita projeto especial","tem como personalizar"}',
 null,
 'Pedido de desenvolvimento e a maior oportunidade e a maior armadilha do segmento.
Item exclusivo prende o cliente por anos — e desenvolvimento aceito sem criterio
consome a fabrica inteira para um pedido que nunca se repete.
Nunca prometa desenvolvimento sem confirmar como sua fabrica trata isso: se tem
custo de matriz ou ferramental, se exige volume minimo maior, quanto tempo leva
a amostra e o que acontece se o cliente desistir depois de aprovada.
Qualifique antes de aceitar: qual volume anual esperado, e recorrente ou pedido
unico, e quem valida a aprovacao la dentro. Desenvolvimento so faz sentido com
volume que pague o setup.
Se a fabrica nao faz sob medida, diga cedo e ofereca o mais proximo do padrao —
segurar a expectativa por semanas destroi a confianca.',
 '{"producao.desenvolvimento"}',
 '{"producao.lote_minimo","producao.prazo_producao","produto.especificacao"}', '{}', 'escalate',
 'Qualificar volume e recorrencia antes de aceitar desenvolvimento',
 '{"Prometer exclusivo sem confirmar com a producao","Nao perguntar o volume anual","Ignorar o custo de matriz ou ferramental","Aceitar desenvolvimento para pedido unico"}',
 'qualificar_desenvolvimento', 'skill_seed', 'active', null),

-- -------------------------------------------------------- EXPERTISE_PROOF
(null, 'industria', 'expertise_proof', 'reactive',
 '{"ha quanto tempo voces existem","quem mais compra de voces","voces tem certificacao","tem laudo","podem comprovar","e uma fabrica seria"}',
 null,
 'Comprador industrial nao esta sendo desconfiado, esta gerenciando risco: se o
fornecedor falhar, a linha dele para e a culpa e de quem aprovou o cadastro.
Prova que funciona neste mercado, em ordem: tempo de fabrica, laudo e certificacao
do que ele vai usar, segmentos que voce ja atende e capacidade instalada. Numero
verificavel vale mais que adjetivo.
Nunca cite nome de cliente sem autorizacao — em industria isso circula rapido e
queima a relacao. Diga o segmento e o porte ("atendemos tres redes de calcado no
Sul"), nao a marca.
Se voce nao tem a certificacao que ele pediu, diga e mostre o que tem no lugar
(ensaio proprio, laudo de terceiro, amostra para ele testar). Inventar
certificacao e o unico erro irreversivel dessa conversa.',
 '{}',
 '{"diferencial.tempo_de_fabrica","produto.certificacoes","producao.capacidade","produto.aplicacoes"}', '{}', 'omit',
 'Prova verificavel: tempo, laudo e segmento — nunca nome de cliente',
 '{"Citar cliente sem autorizacao","Afirmar certificacao que nao tem","Responder com adjetivo em vez de numero"}',
 'enviar_prova_tecnica', 'skill_seed', 'active', null),

-- ---------------------------------------------------------- GOAL_MATCHING
(null, 'industria', 'goal_matching', 'reactive',
 '{"o que voces recomendam para minha loja","qual linha serve para mim","o que vende mais","por onde comeco","que mix voces sugerem"}',
 null,
 'A pergunta parece sobre produto, mas e sobre o negocio dele. O mix certo muda
completamente conforme o tipo de canal.
Loja de bairro precisa de giro rapido e pouco capital parado: poucos itens, os de
maior saida, reposicao frequente. Rede ou franquia precisa de padronizacao,
volume constante e prazo confiavel — ali o argumento e capacidade, nao novidade.
Industria que compra como insumo decide por especificacao e continuidade de lote:
ela nao pode trocar de material no meio da producao. Especificador e arquiteto nao
compram, INDICAM: para eles o que importa e ficha tecnica, amostra e certificacao.
Pergunte para quem ele vende e o que ja gira bem na casa dele. Recomendar mix sem
saber o publico dele e chute, e chute em industria vira estoque encalhado — que e
o que impede o segundo pedido.',
 '{"produto.linhas"}',
 '{"produto.aplicacoes","producao.lote_minimo","canal.apoio_ao_cliente"}', '{}', 'escalate',
 'Mix pelo tipo de canal e pelo publico dele, nao pelo seu catalogo',
 '{"Recomendar o mesmo mix para todo cliente","Nao perguntar para quem ele vende","Empurrar lancamento para quem precisa de giro"}',
 'montar_mix_de_entrada', 'skill_seed', 'active', null),

(null, 'industria', 'goal_matching', 'proactive',
 '{"safra","colecao","quando comprar","proxima temporada","planejamento do ano","vou comprar mais para frente","deixa para depois"}',
 null,
 'Em industria o timing decide mais que o argumento. Implemento agricola se decide
meses antes da safra; calcado e textil se decidem no calendario de colecao; obra
compra na fase da obra. Quem chega no mes da compra chega depois de a decisao ter
sido tomada.
Quando o cliente diz que compra mais para frente, isso NAO e um nao — e a data
mais valiosa que ele podia ter te dado. Errado e sumir e voltar no mes da compra;
certo e marcar a janela e aparecer antes dela, com conteudo util e nao com
cobranca.
Registre o gatilho (safra, colecao, obra) e programe os toques para antes da
janela abrir. Nesses toques traga o que ajuda o planejamento dele: prazo de
producao para ele reservar capacidade, novidade da linha, condicao de pedido
antecipado.
Quem chega antes negocia; quem chega na hora disputa preco com quem ja estava la.',
 '{}',
 '{"producao.prazo_producao","produto.linhas","comercial.prazo_pagamento"}', '{}', 'omit',
 'Marcar a janela e nutrir antes dela abrir',
 '{"Sumir ate o mes da compra","Tratar o adiamento como recusa","Nao registrar qual e o gatilho de compra","Voltar so para cobrar decisao"}',
 'marcar_janela', 'skill_seed', 'active', 'challenger'),

-- ------------------------------------------------------- COMMITMENT_OFFER
(null, 'industria', 'commitment_offer', 'reactive',
 '{"quero exclusividade","posso ser o unico na cidade","voces vendem para meu concorrente","tem contrato de fornecimento","da para reservar producao","quero condicao de volume"}',
 null,
 'Pedido de exclusividade e pedido de compromisso — e compromisso se troca, nao se
da. Exclusividade concedida de graca custa caro: voce fecha uma regiao inteira em
troca de nada e descobre um ano depois que o cliente nao girou.
Nunca prometa territorio, reserva de producao ou condicao especial que a fabrica
nao tenha declarado. Se a politica nao existe no DNA, escale para quem decide em
vez de improvisar — esse improviso vira processo.
Quando existe politica, troque por algo mensuravel: volume anual, previsao de
pedidos, ponto de venda para a sua marca ou prazo de contrato. Exclusividade com
meta e parceria; sem meta e refem.
Reserva de capacidade e o compromisso mais barato de dar e o mais valioso de
receber em epoca de pico — e prende o cliente sem fechar sua regiao.',
 '{"canal.exclusividade"}',
 '{"comercial.politica_desconto","producao.capacidade","canal.regioes"}', '{}', 'escalate',
 'Compromisso se troca por volume mensuravel, nunca se da',
 '{"Prometer exclusividade sem politica da fabrica","Fechar regiao sem meta de volume","Conceder condicao especial no calor da negociacao"}',
 'formalizar_contrapartida', 'skill_seed', 'active', null),

-- -------------------------------------------------------------- RETENTION
(null, 'industria', 'retention', 'proactive',
 '{"faz tempo que nao compra","parou de pedir","nao repoe ha meses","sumiu","cliente inativo","nao faz pedido desde"}',
 null,
 'ESTA E A ENTRADA MAIS IMPORTANTE DO SEGMENTO. Cliente de industria nao manda
comunicado dizendo que trocou de fornecedor — ele simplesmente para de comprar.
Quando passa de 90 dias sem repor, alguem ja entrou no lugar ou o estoque dele
encalhou. Nos dois casos, quanto antes voce falar, mais barato e resolver.
NAO abra cobrando pedido. Abra perguntando como GIROU o ultimo: o que vendeu
melhor, o que sobrou, se teve reclamacao de acabamento ou de lote. Essa pergunta
te da o diagnostico e ainda soa como cuidado, nao como cobranca.
As tres causas reais, e o que fazer com cada uma: estoque parado (ajude a girar
antes de vender de novo — sugira acao de ponto de venda, nunca empurre volume);
problema no produto ou no atendimento (peca detalhe, resolva e volte com a
solucao na mao); concorrente entrou (descubra com o que — preco, prazo, novidade —
antes de reagir; reagir no escuro so entrega margem).
Se o motivo foi falha sua, reconheca direto e traga o que mudou. Cliente resgatado
com problema resolvido costuma ficar mais tempo que cliente que nunca reclamou.',
 '{}',
 '{"produto.linhas","canal.apoio_ao_cliente","diferencial.assistencia","comercial.prazo_pagamento"}', '{}', 'omit',
 'Diagnostico pelo giro antes de qualquer oferta',
 '{"Abrir cobrando pedido","Dar desconto antes de descobrir a causa","Empurrar volume para quem esta com estoque parado","Deixar passar de 90 dias sem falar nada"}',
 'reativar_conta', 'skill_seed', 'active', null),

(null, 'industria', 'retention', 'proactive',
 '{"reposicao","proximo pedido","ta na hora de repor","acabou o estoque","recompra","quando pedir de novo"}',
 null,
 'A venda em industria nao termina no pedido, termina na REPOSICAO. E a reposicao
nao acontece porque o cliente lembrou: acontece porque alguem chegou no momento
certo, antes de o estoque dele zerar.
Chegar depois do estoque acabar significa que a loja ficou dias sem o seu produto
— e cliente final que nao encontra compra o do concorrente. Ruptura na prateleira
dele e perda dupla: ele nao vende e ainda descobre que da para viver sem voce.
Antes de falar, revise em tres minutos: o que ele comprou da ultima vez, quanto
tempo faz, o que costuma repetir e o que ficou combinado. Chegar sem isso e ser
tirador de pedido, e tirador de pedido e o primeiro a ser substituido por um
portal de compras.
Abra pela reposicao do que ele mais gira, nao pelo lancamento. Novidade entra
depois que o pedido base esta fechado — e ai ela vira acrescimo, nao risco.',
 '{}',
 '{"produto.linhas","producao.prazo_producao","comercial.prazo_pagamento"}', '{}', 'omit',
 'Antecipar a reposicao antes da ruptura, com preparo de 3 minutos',
 '{"Esperar o cliente pedir","Chegar sem revisar o ultimo pedido","Abrir pelo lancamento em vez do carro-chefe","Ignorar o ciclo declarado do cliente"}',
 'fechar_reposicao', 'skill_seed', 'active', null),

-- -------------------------------------------------------------- ECOSYSTEM
(null, 'industria', 'ecosystem', 'reactive',
 '{"posso comprar direto da fabrica","quero falar direto com voces","o representante nao me atende","compro sem representante","quem atende minha regiao","tem representante aqui"}',
 null,
 'Cuidado: aqui se decide a receita de anos. A carteira do representante e o ativo
que sustenta a fabrica, e passar por cima dele para ganhar um pedido destroi a
relacao que traz os proximos cem.
Se a conta ja tem representante, encaminhe — e faca isso valorizando quem atende,
nao pedindo desculpa. Ao mesmo tempo, leve o pedido a serio: quando o cliente
reclama que nao e atendido, o problema e real e precisa chegar a quem coordena o
canal. Ignorar a reclamacao e como perder a conta duas vezes.
Se a regiao esta descoberta, a venda direta e legitima — confirme antes como a
fabrica trata isso, para nao criar conflito depois.
Nunca discuta comissao, politica interna ou desempenho de representante com o
cliente. Nada disso e assunto dele, e vira fofoca que volta contra voce.',
 '{"canal.forma_de_venda"}',
 '{"canal.regioes","canal.exclusividade"}', '{}', 'escalate',
 'Respeitar o canal e tratar a reclamacao como informacao, nao como desculpa',
 '{"Vender por cima do representante da conta","Discutir comissao com o cliente","Ignorar reclamacao de falta de atendimento","Prometer atendimento direto sem confirmar a politica"}',
 'encaminhar_ao_canal', 'skill_seed', 'active', null),

-- ------------------------------------------------------- LIMITS_AND_ETHICS
(null, 'industria', 'limits_and_ethics', 'reactive',
 '{"garante que aguenta","voces asseguram o prazo","e certificado","pode garantir que nao falha","assina que entrega","tem garantia disso"}',
 null,
 'Em industria, palavra dada vira especificacao em contrato e laudo em processo. O
que voce afirma aqui pode ser cobrado em juizo, e pode parar a linha de producao
de outra empresa.
Nunca afirme certificacao, ensaio, norma ou desempenho que a empresa nao tenha
declarado. Nunca prometa prazo, capacidade ou lote fora do que esta no DNA. Nunca
garanta comportamento do material em aplicacao que voce nao testou — quem
responde por isso e o laudo, nao o vendedor.
Falta o dado? Diga que vai confirmar com a fabrica e volte com a resposta. Essa
frase nao enfraquece a venda: em compra tecnica, vendedor que confirma antes de
afirmar e exatamente o que o comprador procura, porque e ele quem assina o risco
la dentro.
Prometer o que a fabrica nao entrega nao perde um pedido — perde o cadastro de
fornecedor, e cadastro reprovado nao se recupera.',
 '{}',
 '{"produto.certificacoes","producao.capacidade","producao.prazo_producao"}', '{}', 'omit',
 'Confirmar antes de afirmar — o limite protege o cadastro de fornecedor',
 '{"Afirmar norma ou laudo que nao existe","Garantir desempenho em aplicacao nao testada","Prometer prazo acima da capacidade","Improvisar resposta tecnica para nao parecer despreparado"}',
 'confirmar_com_a_fabrica', 'skill_seed', 'active', null),

(null, 'industria', 'commitment_offer', 'reactive',
 '{"vou pensar","preciso aprovar o cadastro","vou ver com desenvolvimento","e se o lote nao sair como a amostra","vou aguardar a proxima colecao","depois eu falo","ainda estamos avaliando"}',
 null,
 'Comprador que aprovou a amostra e mesmo assim nao fecha nao esta em duvida sobre
o produto: esta com medo de trocar de fornecedor. Se o lote sair diferente da
amostra, quem aprovou o cadastro responde pela linha parada. O risco pessoal dele
e maior que a economia que voce oferece.
Nao mande mais amostra nem mais argumento. Para quem ja aprovou tecnicamente,
insistir na qualidade e ruido — e sinal de que voce nao entendeu o que trava.
Pergunte o que precisa acontecer para o cadastro andar. Quase sempre a resposta e
concreta e resolvivel: um documento, um laudo, uma visita de auditoria, um prazo
de teste industrial. Isso nao e enrolacao, e processo.
Diminua o compromisso: primeiro lote pequeno, uma cor ou uma medida so, entrar como
SEGUNDA FONTE ao lado do fornecedor atual em vez de substituir. Ninguem precisa
apostar a producao inteira em voce agora — e essa frase, dita em voz alta, destrava
mais que qualquer desconto.
Tire risco com o que for verdade: como funciona a troca se o lote vier fora da
especificacao, quem responde, em quanto tempo. Garantia de lote vale mais que
preco melhor para quem tem medo de parar a linha.',
 '{"producao.lote_minimo"}',
 '{"diferencial.assistencia","comercial.prazo_pagamento","producao.prazo_producao","produto.certificacoes"}', '{}', 'escalate',
 'Diminuir o compromisso (lote menor, segunda fonte) e resolver o processo de cadastro',
 '{"Mandar mais amostra para quem ja aprovou","Insistir na qualidade do produto","Dar desconto para acelerar cadastro","Tratar o processo interno dele como desculpa"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt'),

(null, 'industria', 'catalog', 'reactive',
 '{"so me manda a ficha tecnica","nao precisa ligar","prefiro por escrito","manda o material","nao quero reuniao","me passa os dados","depois eu vejo sozinho"}',
 null,
 'O comprador industrial costuma querer estudar sozinho: comparar ficha com ficha,
levar para o desenvolvimento, decidir sem vendedor no ouvido. Insistir em ligacao
com quem pediu material por escrito e o caminho curto para ser eliminado em
silencio.
Mande a ficha COMPLETA — composicao, gramatura, medidas, tolerancia, certificacoes
— junto com lote minimo e prazo de producao. Material pela metade para obrigar
contato e um truque velho, e comprador tecnico reconhece na hora.
Duas perguntas por escrito bastam, e so as que mudam a cotacao: qual aplicacao e
que volume. A aplicacao evita que ele teste o item errado e devolva o lote, o que
custaria a conta inteira.
Ofereca amostra em vez de reuniao: para quem quer decidir sozinho, amostra na
bancada vale mais que qualquer conversa. E deixe combinado um retorno leve, sem
cobranca.',
 '{"produto.especificacao"}',
 '{"produto.certificacoes","producao.lote_minimo","producao.prazo_producao","produto.aplicacoes"}', '{}', 'escalate',
 'Ficha completa + duas perguntas por escrito + amostra no lugar de reuniao',
 '{"Insistir em ligacao com quem pediu por escrito","Mandar ficha incompleta para forcar contato","Enviar material sem lote minimo e prazo","Nao perguntar a aplicacao e aceitar o teste errado"}',
 'entregar_material', 'skill_seed', 'active', null);
