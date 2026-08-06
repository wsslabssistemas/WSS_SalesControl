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
 '{"qual o preço","manda a tabela","quanto custa o metro","qual o valor da peça","me passa os valores","qual o preço por unidade"}',
 null,
 'Preço solto não existe em indústria: o mesmo item tem preço diferente por
quantidade, por cor, por acabamento e por prazo de pagamento. Mandar um número
seco entrega ao comprador exatamente o que ele precisa para te comparar com o
importado numa planilha.
Pergunte primeiro TRÊS coisas: qual item, que volume por pedido e com que
frequência. Sem isso você não está cotando, está chutando.
Depois cote em FAIXA: o preço no lote mínimo e o preço na faixa seguinte. Mostrar
o degrau ("a partir de tanto, cai para tanto") aumenta o pedido sem parecer
empurro, porque o comprador enxerga o ganho dele.
Preço anda junto com condição: prazo de pagamento e frete pesam tanto quanto o
número. Em compra industrial, quem resolve fluxo de caixa ganha pedido.',
 '{"comercial.pedido_minimo","producao.lote_minimo"}',
 '{"comercial.prazo_pagamento","comercial.politica_desconto","comercial.frete"}', '{}', 'escalate',
 'Cotação por faixa de volume, nunca preço solto',
 '{"Dar um preço único sem saber volume","Mandar tabela completa para quem não pediu","Falar preço sem falar prazo de pagamento","Cotar por telefone sem confirmar a especificação"}',
 'levantar_volume', 'skill_seed', 'active', null),

-- ------------------------------------------------------------- OBJECTIONS
(null, 'industria', 'objections', 'reactive',
 '{"o importado é mais barato","o chinês faz por menos","importado sai melhor","compro da china","o preço do importado","importação compensa mais"}',
 null,
 'Esta é a objeção número um da indústria brasileira, e quase sempre é comparação
de preço de tabela contra CUSTO TOTAL. Não brigue no preço por quilo.
Abra a conta inteira do importado: câmbio que oscila entre o pedido e a chegada,
lote de container inteiro (dinheiro parado em estoque), 60 a 90 dias de trânsito,
imposto, despacho, e — o mais caro — a reposição. Faltou material no meio da
produção dele, o importado não repõe em uma semana; você repõe.
Pergunte o que acontece quando chega lote com defeito. Com o importado, ele
discute por e-mail com um fornecedor a doze mil quilômetros. Com você, ele fala
com alguém que atende o telefone e responde pelo lote.
Nunca ataque a escolha dele nem o produto importado. Mostre a conta e deixe o
comprador fazer a matemática — comprador técnico gosta de decidir sozinho.',
 '{"producao.prazo_producao","diferencial.motivo_trocar"}',
 '{"producao.lote_minimo","diferencial.assistencia","producao.capacidade","canal.regioes"}', '{}', 'escalate',
 'Custo total contra preço de tabela + risco de reposição',
 '{"Brigar no preço por quilo","Falar mal do produto importado","Ignorar que o problema real é prazo de reposição","Prometer prazo que a fábrica não cumpre só para ganhar a conta"}',
 'abrir_conta_total', 'skill_seed', 'active', null),

(null, 'industria', 'objections', 'reactive',
 '{"já tenho fornecedor","compro de outra fábrica","estou atendido","tenho contrato com outro","não preciso trocar","meu fornecedor atende bem"}',
 null,
 'Todo comprador bom JÁ tem fornecedor. Se não tivesse, a linha dele estaria
parada. Isso não é recusa, é o ponto de partida — e não se pede troca.
Peça para ser SEGUNDA FONTE. Comprador industrial experiente sabe que depender de
um fornecedor único é risco: quebrou máquina lá, parou a produção dele aqui. Ser
a segunda fonte é um pedido pequeno, técnico e legítimo — e é assim que se entra.
Procure a fresta: um item que costuma atrasar, uma cor ou medida que o atual não
faz, um lote pequeno que o outro não aceita produzir. A brecha está sempre no que
o fornecedor grande considera pouco lucrativo.
Pergunte o que o atual NÃO resolve bem — prazo, refugo, atendimento técnico,
flexibilidade de lote. O comprador conta, desde que você não ataque a escolha
dele.',
 '{"diferencial.motivo_trocar"}',
 '{"producao.prazo_producao","producao.desenvolvimento","producao.lote_minimo"}', '{}', 'escalate',
 'Entrada como segunda fonte, não como substituto',
 '{"Pedir para substituir o fornecedor atual","Falar mal de quem ele escolheu","Não investigar onde o atual falha","Insistir em volume grande na primeira conversa"}',
 'virar_segunda_fonte', 'skill_seed', 'active', null),

(null, 'industria', 'objections', 'reactive',
 '{"o lote é muito alto","não consigo comprar essa quantidade","minha loja é pequena","não giro tudo isso","preciso de menos","o mínimo é alto demais"}',
 null,
 'Lote mínimo existe por causa de setup de máquina, não por ganância — explique
isso em uma frase, sem pedir desculpa. Quem entende por que o mínimo existe para
de achar que é negociação.
Depois, resolva o problema dele de verdade. Caminhos que funcionam em indústria:
mix de entrada (o mínimo distribuído entre itens, não todo em um), lote de teste
com prazo maior de pagamento, entrega parcelada do mesmo pedido, ou agrupar com
o próximo pedido de coleção.
Se nada couber, seja honesto: melhor perder um pedido do que produzir um lote que
vai encalhar na loja dele e matar a recompra. Cliente com estoque parado não volta
— e ainda conta para os outros que o produto não gira.',
 '{"producao.lote_minimo"}',
 '{"comercial.pedido_minimo","comercial.prazo_pagamento","produto.linhas"}', '{}', 'escalate',
 'Explicar o setup e fracionar o mínimo em mix de entrada',
 '{"Baixar o lote sem calcular o setup","Empurrar volume que não gira na loja dele","Tratar o mínimo como tabu e não explicar por que existe"}',
 'montar_mix_de_entrada', 'skill_seed', 'active', null),

(null, 'industria', 'objections', 'reactive',
 '{"está caro","achei salgado","o outro faz mais barato","dá para melhorar o preço","seu preço está alto"}',
 null,
 'Antes de mexer no preço, descubra caro COMPARADO A QUÊ. Quase sempre a
comparação é com uma especificação inferior — gramatura menor, matéria-prima
reciclada, acabamento diferente. Comparar dois números de especificações
diferentes não é comparação, é armadilha.
Traga a conversa para o custo por peça PRODUZIDA, não por metro comprado.
Material que rende mais, que gera menos refugo e que não para a linha por defeito
sai mais barato no fim do mês, mesmo custando mais na entrada. Esse é o número
que o comprador técnico entende e que o comprador de preço nunca calculou.
Se precisar ceder, ceda em CONDIÇÃO antes de ceder em preço: prazo de pagamento,
frete, entrega parcelada. Condição preserva margem e costuma resolver o problema
real, que é caixa.',
 '{"produto.especificacao"}',
 '{"comercial.politica_desconto","comercial.prazo_pagamento","diferencial.motivo_trocar"}', '{}', 'escalate',
 'Custo por peça produzida + ceder condição antes de preço',
 '{"Dar desconto na primeira pressão","Comparar produtos de especificação diferente","Não perguntar com quem ele está comparando"}',
 'defender_margem', 'skill_seed', 'active', null),

-- --------------------------------------------------------- RISK_FREE_ENTRY
(null, 'industria', 'risk_free_entry', 'reactive',
 '{"nunca trabalhei com vocês","não conheço a fábrica","e se não vender","como faço para testar","quero começar devagar","não quero arriscar"}',
 null,
 'Esse comprador não está duvidando do seu produto: está com medo de comprar
estoque que não gira. O medo é legítimo e resolve-se com tamanho, não com
discurso.
Ofereça a menor entrada que ainda prova o produto: um lote de teste, um mix
enxuto dos itens de maior giro, ou uma cor só. O objetivo do primeiro pedido não
é faturar, é o produto ganhar prateleira e provar giro na loja dele.
Combine na hora como vocês vão MEDIR o teste: em quanto tempo, quantas peças,
e quando vocês conversam de novo. Teste sem data de avaliação vira estoque
esquecido no fundo do depósito.
Se você apoia com material de vitrine ou catálogo, ofereça junto — ajuda o giro
a acontecer, que é o que traz o segundo pedido.',
 '{"producao.lote_minimo","comercial.pedido_minimo"}',
 '{"canal.apoio_ao_cliente","comercial.prazo_pagamento","produto.linhas"}', '{}', 'escalate',
 'Pedido de entrada com data de avaliação combinada',
 '{"Empurrar o mix completo no primeiro pedido","Não combinar quando avaliar o giro","Prometer recompra de estoque que não vendeu"}',
 'fechar_pedido_entrada', 'skill_seed', 'active', null),

-- ----------------------------------------------------------- RECIPROCITY
(null, 'industria', 'reciprocity', 'reactive',
 '{"manda uma amostra","tem como mandar mostruário","quero ver o material","posso testar antes","manda catálogo","tem amostra"}',
 null,
 'Pedido de amostra é o sinal de compra mais forte deste segmento — é o mais
desperdiçado. Amostra despachada sem combinação morre na mesa do comprador.
Antes de enviar, combine três coisas: PARA QUEM vai (comprador, desenvolvimento
ou produção), O QUE vai ser testado (qual máquina, qual aplicação) e QUANDO vocês
falam do resultado. Uma data marcada transforma amostra em etapa; sem ela, vira
brinde.
Envie o que resolve a dúvida DELE, não o mostruário inteiro: amostra demais dilui
a decisão e atrasa o parecer.
Mande a ficha técnica junto. Em indústria quem decide o teste costuma ser técnico,
e ficha completa poupa uma rodada inteira de perguntas.',
 '{"produto.linhas"}',
 '{"produto.especificacao","canal.apoio_ao_cliente","produto.certificacoes"}', '{}', 'omit',
 'Amostra com destinatário, teste e data de retorno combinados',
 '{"Enviar amostra sem marcar o retorno","Mandar o mostruário inteiro","Não descobrir quem vai testar","Enviar sem a ficha técnica"}',
 'agendar_parecer', 'skill_seed', 'active', null),

-- ---------------------------------------------------------- AVAILABILITY
(null, 'industria', 'availability', 'reactive',
 '{"para quando fica pronto","qual o prazo de entrega","consegue entregar essa semana","tem pronta entrega","quanto tempo demora","precisa para ontem"}',
 null,
 'Prazo em indústria é promessa de produção, não estimativa simpática. Prazo dado
para agradar é o que faz perder o cliente no segundo pedido — e o segundo pedido
é onde estava o dinheiro.
Responda com o prazo real a partir da CONFIRMAÇÃO do pedido, e diga o que faz o
relógio começar a contar: aprovação de amostra, cor definida, cadastro aprovado,
sinal. Comprador se irrita muito mais com atraso do que com prazo longo.
Se a urgência é real, negocie escopo em vez de mentir prazo: entrega parcial do
que já está em produção, priorizar o item que trava a linha dele, ou uma medida
padrão que sai antes da especial.
Se você não consegue a data que ele quer, diga na hora. Perder um pedido por
honestidade custa infinitamente menos do que parar a linha de um cliente novo.',
 '{"producao.prazo_producao"}',
 '{"producao.capacidade","canal.regioes","comercial.frete"}', '{}', 'escalate',
 'Prazo a partir do gatilho de produção + negociar escopo, nunca a data',
 '{"Prometer o prazo que o cliente quer ouvir","Não dizer o que faz o prazo começar a contar","Assumir volume acima da capacidade para não perder o pedido"}',
 'confirmar_prazo_real', 'skill_seed', 'active', null),

-- --------------------------------------------------------------- CATALOG
(null, 'industria', 'catalog', 'reactive',
 '{"qual a gramatura","qual a composição","que medida tem","serve para minha aplicação","tem ficha técnica","qual a resistência","que material é"}',
 null,
 'Pergunta técnica se responde com dado, nunca com adjetivo. "Ótima qualidade" não
significa nada para quem vai colocar o material na máquina; gramatura, composição,
medida e tolerância significam tudo.
Antes de responder, descubra a APLICAÇÃO: o mesmo item serve num uso e falha em
outro. Vender o produto errado para a aplicação errada gera devolução, e
devolução em indústria mata a conta inteira, não só o pedido.
Se o dado exato não está no seu DNA, não arredonde. Especificação chutada vira
lote reprovado no recebimento do cliente.
Quando a aplicação dele não combina com o item que ele pediu, diga e ofereça o
certo. Corrigir a especificação do comprador é a coisa que mais constrói
autoridade técnica nesse mercado.',
 '{"produto.especificacao","produto.linhas"}',
 '{"produto.aplicacoes","produto.certificacoes"}', '{}', 'escalate',
 'Responder com dado técnico e confirmar a aplicação antes',
 '{"Responder com adjetivo em vez de número","Arredondar especificação","Vender item que não serve para a aplicação dele"}',
 'confirmar_aplicacao', 'skill_seed', 'active', null),

(null, 'industria', 'catalog', 'reactive',
 '{"vocês fazem sob medida","dá para desenvolver um item","preciso de uma cor específica","fazem exclusivo para mim","aceita projeto especial","tem como personalizar"}',
 null,
 'Pedido de desenvolvimento é a maior oportunidade e a maior armadilha do segmento.
Item exclusivo prende o cliente por anos — e desenvolvimento aceito sem critério
consome a fábrica inteira para um pedido que nunca se repete.
Nunca prometa desenvolvimento sem confirmar como sua fábrica trata isso: se tem
custo de matriz ou ferramental, se exige volume mínimo maior, quanto tempo leva
a amostra e o que acontece se o cliente desistir depois de aprovada.
Qualifique antes de aceitar: qual volume anual esperado, é recorrente ou pedido
único, e quem valida a aprovação lá dentro. Desenvolvimento só faz sentido com
volume que pague o setup.
Se a fábrica não faz sob medida, diga cedo e ofereça o mais próximo do padrão —
segurar a expectativa por semanas destrói a confiança.',
 '{"producao.desenvolvimento"}',
 '{"producao.lote_minimo","producao.prazo_producao","produto.especificacao"}', '{}', 'escalate',
 'Qualificar volume e recorrência antes de aceitar desenvolvimento',
 '{"Prometer exclusivo sem confirmar com a produção","Não perguntar o volume anual","Ignorar o custo de matriz ou ferramental","Aceitar desenvolvimento para pedido único"}',
 'qualificar_desenvolvimento', 'skill_seed', 'active', null),

-- -------------------------------------------------------- EXPERTISE_PROOF
(null, 'industria', 'expertise_proof', 'reactive',
 '{"há quanto tempo vocês existem","quem mais compra de vocês","vocês têm certificação","tem laudo","podem comprovar","é uma fábrica séria"}',
 null,
 'Comprador industrial não está sendo desconfiado, está gerenciando risco: se o
fornecedor falhar, a linha dele para e a culpa é de quem aprovou o cadastro.
Prova que funciona neste mercado, em ordem: tempo de fábrica, laudo e certificação
do que ele vai usar, segmentos que você já atende e capacidade instalada. Número
verificável vale mais que adjetivo.
Nunca cite nome de cliente sem autorização — em indústria isso circula rápido e
queima a relação. Diga o segmento e o porte ("atendemos três redes de calçado no
Sul"), não a marca.
Se você não tem a certificação que ele pediu, diga e mostre o que tem no lugar
(ensaio próprio, laudo de terceiro, amostra para ele testar). Inventar
certificação é o único erro irreversível dessa conversa.',
 '{}',
 '{"diferencial.tempo_de_fabrica","produto.certificacoes","producao.capacidade","produto.aplicacoes"}', '{}', 'omit',
 'Prova verificável: tempo, laudo e segmento — nunca nome de cliente',
 '{"Citar cliente sem autorização","Afirmar certificação que não tem","Responder com adjetivo em vez de número"}',
 'enviar_prova_tecnica', 'skill_seed', 'active', null),

-- ---------------------------------------------------------- GOAL_MATCHING
(null, 'industria', 'goal_matching', 'reactive',
 '{"o que vocês recomendam para minha loja","qual linha serve para mim","o que vende mais","por onde começo","que mix vocês sugerem"}',
 null,
 'A pergunta parece sobre produto, mas é sobre o negócio dele. O mix certo muda
completamente conforme o tipo de canal.
Loja de bairro precisa de giro rápido e pouco capital parado: poucos itens, os de
maior saída, reposição frequente. Rede ou franquia precisa de padronização,
volume constante e prazo confiável — ali o argumento é capacidade, não novidade.
Indústria que compra como insumo decide por especificação e continuidade de lote:
ela não pode trocar de material no meio da produção. Especificador e arquiteto não
compram, INDICAM: para eles o que importa é ficha técnica, amostra e certificação.
Pergunte para quem ele vende e o que já gira bem na casa dele. Recomendar mix sem
saber o público dele é chute, e chute em indústria vira estoque encalhado — que é
o que impede o segundo pedido.',
 '{"produto.linhas"}',
 '{"produto.aplicacoes","producao.lote_minimo","canal.apoio_ao_cliente"}', '{}', 'escalate',
 'Mix pelo tipo de canal e pelo público dele, não pelo seu catálogo',
 '{"Recomendar o mesmo mix para todo cliente","Não perguntar para quem ele vende","Empurrar lançamento para quem precisa de giro"}',
 'montar_mix_de_entrada', 'skill_seed', 'active', null),

(null, 'industria', 'goal_matching', 'proactive',
 '{"safra","coleção","quando comprar","próxima temporada","planejamento do ano","vou comprar mais para frente","deixa para depois"}',
 null,
 'Em indústria o timing decide mais que o argumento. Implemento agrícola se decide
meses antes da safra; calçado e têxtil se decidem no calendário de coleção; obra
compra na fase da obra. Quem chega no mês da compra chega depois de a decisão ter
sido tomada.
Quando o cliente diz que compra mais para frente, isso NÃO é um não — é a data
mais valiosa que ele podia ter te dado. Errado é sumir e voltar no mês da compra;
certo é marcar a janela e aparecer antes dela, com conteúdo útil e não com
cobrança.
Registre o gatilho (safra, coleção, obra) e programe os toques para antes da
janela abrir. Nesses toques traga o que ajuda o planejamento dele: prazo de
produção para ele reservar capacidade, novidade da linha, condição de pedido
antecipado.
Quem chega antes negocia; quem chega na hora disputa preço com quem já estava lá.',
 '{}',
 '{"producao.prazo_producao","produto.linhas","comercial.prazo_pagamento"}', '{}', 'omit',
 'Marcar a janela e nutrir antes dela abrir',
 '{"Sumir até o mês da compra","Tratar o adiamento como recusa","Não registrar qual é o gatilho de compra","Voltar só para cobrar decisão"}',
 'marcar_janela', 'skill_seed', 'active', 'challenger'),

-- ------------------------------------------------------- COMMITMENT_OFFER
(null, 'industria', 'commitment_offer', 'reactive',
 '{"quero exclusividade","posso ser o único na cidade","vocês vendem para meu concorrente","tem contrato de fornecimento","dá para reservar produção","quero condição de volume"}',
 null,
 'Pedido de exclusividade é pedido de compromisso — e compromisso se troca, não se
dá. Exclusividade concedida de graça custa caro: você fecha uma região inteira em
troca de nada e descobre um ano depois que o cliente não girou.
Nunca prometa território, reserva de produção ou condição especial que a fábrica
não tenha declarado. Se a política não existe no DNA, escale para quem decide em
vez de improvisar — esse improviso vira processo.
Quando existe política, troque por algo mensurável: volume anual, previsão de
pedidos, ponto de venda para a sua marca ou prazo de contrato. Exclusividade com
meta é parceria; sem meta é refém.
Reserva de capacidade é o compromisso mais barato de dar e o mais valioso de
receber em época de pico — e prende o cliente sem fechar sua região.',
 '{"canal.exclusividade"}',
 '{"comercial.politica_desconto","producao.capacidade","canal.regioes"}', '{}', 'escalate',
 'Compromisso se troca por volume mensurável, nunca se dá',
 '{"Prometer exclusividade sem política da fábrica","Fechar região sem meta de volume","Conceder condição especial no calor da negociação"}',
 'formalizar_contrapartida', 'skill_seed', 'active', null),

-- -------------------------------------------------------------- RETENTION
(null, 'industria', 'retention', 'proactive',
 '{"faz tempo que não compra","parou de pedir","não repõe há meses","sumiu","cliente inativo","não faz pedido desde"}',
 null,
 'ESTA É A ENTRADA MAIS IMPORTANTE DO SEGMENTO. Cliente de indústria não manda
comunicado dizendo que trocou de fornecedor — ele simplesmente para de comprar.
Quando passa de 90 dias sem repor, alguém já entrou no lugar ou o estoque dele
encalhou. Nos dois casos, quanto antes você falar, mais barato é resolver.
NÃO abra cobrando pedido. Abra perguntando como GIROU o último: o que vendeu
melhor, o que sobrou, se teve reclamação de acabamento ou de lote. Essa pergunta
te dá o diagnóstico e ainda soa como cuidado, não como cobrança.
As três causas reais, e o que fazer com cada uma: estoque parado (ajude a girar
antes de vender de novo — sugira ação de ponto de venda, nunca empurre volume);
problema no produto ou no atendimento (peça detalhe, resolva e volte com a
solução na mão); concorrente entrou (descubra com o que — preço, prazo, novidade —
antes de reagir; reagir no escuro só entrega margem).
Se o motivo foi falha sua, reconheça direto e traga o que mudou. Cliente resgatado
com problema resolvido costuma ficar mais tempo que cliente que nunca reclamou.',
 '{}',
 '{"produto.linhas","canal.apoio_ao_cliente","diferencial.assistencia","comercial.prazo_pagamento"}', '{}', 'omit',
 'Diagnóstico pelo giro antes de qualquer oferta',
 '{"Abrir cobrando pedido","Dar desconto antes de descobrir a causa","Empurrar volume para quem está com estoque parado","Deixar passar de 90 dias sem falar nada"}',
 'reativar_conta', 'skill_seed', 'active', null),

(null, 'industria', 'retention', 'proactive',
 '{"reposição","próximo pedido","tá na hora de repor","acabou o estoque","recompra","quando pedir de novo"}',
 null,
 'A venda em indústria não termina no pedido, termina na REPOSIÇÃO. E a reposição
não acontece porque o cliente lembrou: acontece porque alguém chegou no momento
certo, antes de o estoque dele zerar.
Chegar depois do estoque acabar significa que a loja ficou dias sem o seu produto
— e cliente final que não encontra compra o do concorrente. Ruptura na prateleira
dele é perda dupla: ele não vende e ainda descobre que dá para viver sem você.
Antes de falar, revise em três minutos: o que ele comprou da última vez, quanto
tempo faz, o que costuma repetir e o que ficou combinado. Chegar sem isso é ser
tirador de pedido, e tirador de pedido é o primeiro a ser substituído por um
portal de compras.
Abra pela reposição do que ele mais gira, não pelo lançamento. Novidade entra
depois que o pedido base está fechado — e aí ela vira acréscimo, não risco.',
 '{}',
 '{"produto.linhas","producao.prazo_producao","comercial.prazo_pagamento"}', '{}', 'omit',
 'Antecipar a reposição antes da ruptura, com preparo de 3 minutos',
 '{"Esperar o cliente pedir","Chegar sem revisar o último pedido","Abrir pelo lançamento em vez do carro-chefe","Ignorar o ciclo declarado do cliente"}',
 'fechar_reposicao', 'skill_seed', 'active', null),

-- -------------------------------------------------------------- ECOSYSTEM
(null, 'industria', 'ecosystem', 'reactive',
 '{"posso comprar direto da fábrica","quero falar direto com vocês","o representante não me atende","compro sem representante","quem atende minha região","tem representante aqui"}',
 null,
 'Cuidado: aqui se decide a receita de anos. A carteira do representante é o ativo
que sustenta a fábrica, e passar por cima dele para ganhar um pedido destrói a
relação que traz os próximos cem.
Se a conta já tem representante, encaminhe — e faça isso valorizando quem atende,
não pedindo desculpa. Ao mesmo tempo, leve o pedido a sério: quando o cliente
reclama que não é atendido, o problema é real e precisa chegar a quem coordena o
canal. Ignorar a reclamação é como perder a conta duas vezes.
Se a região está descoberta, a venda direta é legítima — confirme antes como a
fábrica trata isso, para não criar conflito depois.
Nunca discuta comissão, política interna ou desempenho de representante com o
cliente. Nada disso é assunto dele, e vira fofoca que volta contra você.',
 '{"canal.forma_de_venda"}',
 '{"canal.regioes","canal.exclusividade"}', '{}', 'escalate',
 'Respeitar o canal e tratar a reclamação como informação, não como desculpa',
 '{"Vender por cima do representante da conta","Discutir comissão com o cliente","Ignorar reclamação de falta de atendimento","Prometer atendimento direto sem confirmar a política"}',
 'encaminhar_ao_canal', 'skill_seed', 'active', null),

-- ------------------------------------------------------- LIMITS_AND_ETHICS
(null, 'industria', 'limits_and_ethics', 'reactive',
 '{"garante que aguenta","vocês asseguram o prazo","é certificado","pode garantir que não falha","assina que entrega","tem garantia disso"}',
 null,
 'Em indústria, palavra dada vira especificação em contrato e laudo em processo. O
que você afirma aqui pode ser cobrado em juízo, e pode parar a linha de produção
de outra empresa.
Nunca afirme certificação, ensaio, norma ou desempenho que a empresa não tenha
declarado. Nunca prometa prazo, capacidade ou lote fora do que está no DNA. Nunca
garanta comportamento do material em aplicação que você não testou — quem
responde por isso é o laudo, não o vendedor.
Falta o dado? Diga que vai confirmar com a fábrica e volte com a resposta. Essa
frase não enfraquece a venda: em compra técnica, vendedor que confirma antes de
afirmar é exatamente o que o comprador procura, porque é ele quem assina o risco
lá dentro.
Prometer o que a fábrica não entrega não perde um pedido — perde o cadastro de
fornecedor, e cadastro reprovado não se recupera.',
 '{}',
 '{"produto.certificacoes","producao.capacidade","producao.prazo_producao"}', '{}', 'omit',
 'Confirmar antes de afirmar — o limite protege o cadastro de fornecedor',
 '{"Afirmar norma ou laudo que não existe","Garantir desempenho em aplicação não testada","Prometer prazo acima da capacidade","Improvisar resposta técnica para não parecer despreparado"}',
 'confirmar_com_a_fabrica', 'skill_seed', 'active', null),

(null, 'industria', 'commitment_offer', 'reactive',
 '{"vou pensar","preciso aprovar o cadastro","vou ver com desenvolvimento","e se o lote não sair como a amostra","vou aguardar a próxima coleção","depois eu falo","ainda estamos avaliando"}',
 null,
 'Comprador que aprovou a amostra e mesmo assim não fecha não está em dúvida sobre
o produto: está com medo de trocar de fornecedor. Se o lote sair diferente da
amostra, quem aprovou o cadastro responde pela linha parada. O risco pessoal dele
é maior que a economia que você oferece.
Não mande mais amostra nem mais argumento. Para quem já aprovou tecnicamente,
insistir na qualidade é ruído — é sinal de que você não entendeu o que trava.
Pergunte o que precisa acontecer para o cadastro andar. Quase sempre a resposta é
concreta e resolvível: um documento, um laudo, uma visita de auditoria, um prazo
de teste industrial. Isso não é enrolação, é processo.
Diminua o compromisso: primeiro lote pequeno, uma cor ou uma medida só, entrar como
SEGUNDA FONTE ao lado do fornecedor atual em vez de substituir. Ninguém precisa
apostar a produção inteira em você agora — e essa frase, dita em voz alta, destrava
mais que qualquer desconto.
Tire risco com o que for verdade: como funciona a troca se o lote vier fora da
especificação, quem responde, em quanto tempo. Garantia de lote vale mais que
preço melhor para quem tem medo de parar a linha.',
 '{"producao.lote_minimo"}',
 '{"diferencial.assistencia","comercial.prazo_pagamento","producao.prazo_producao","produto.certificacoes"}', '{}', 'escalate',
 'Diminuir o compromisso (lote menor, segunda fonte) e resolver o processo de cadastro',
 '{"Mandar mais amostra para quem já aprovou","Insistir na qualidade do produto","Dar desconto para acelerar cadastro","Tratar o processo interno dele como desculpa"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt'),

(null, 'industria', 'catalog', 'reactive',
 '{"só me manda a ficha técnica","não precisa ligar","prefiro por escrito","manda o material","não quero reunião","me passa os dados","depois eu vejo sozinho"}',
 null,
 'O comprador industrial costuma querer estudar sozinho: comparar ficha com ficha,
levar para o desenvolvimento, decidir sem vendedor no ouvido. Insistir em ligação
com quem pediu material por escrito é o caminho curto para ser eliminado em
silêncio.
Mande a ficha COMPLETA — composição, gramatura, medidas, tolerância, certificações
— junto com lote mínimo e prazo de produção. Material pela metade para obrigar
contato é um truque velho, e comprador técnico reconhece na hora.
Duas perguntas por escrito bastam, e só as que mudam a cotação: qual aplicação e
que volume. A aplicação evita que ele teste o item errado e devolva o lote, o que
custaria a conta inteira.
Ofereça amostra em vez de reunião: para quem quer decidir sozinho, amostra na
bancada vale mais que qualquer conversa. E deixe combinado um retorno leve, sem
cobrança.',
 '{"produto.especificacao"}',
 '{"produto.certificacoes","producao.lote_minimo","producao.prazo_producao","produto.aplicacoes"}', '{}', 'escalate',
 'Ficha completa + duas perguntas por escrito + amostra no lugar de reunião',
 '{"Insistir em ligação com quem pediu por escrito","Mandar ficha incompleta para forçar contato","Enviar material sem lote mínimo e prazo","Não perguntar a aplicação e aceitar o teste errado"}',
 'entregar_material', 'skill_seed', 'active', null);
