-- =====================================================================
-- COS — MIGRATION 0022 : BIBLIOTECA DE DISTRIBUIDORA E ATACADO
--
-- DIAGNÓSTICO (pesquisa jul/2026): o vendedor de distribuidora virou
-- "TIRADOR DE PEDIDO" — anota o que o cliente já ia comprar, sem
-- cross-sell, sem inteligência de churn e sem preparo de visita.
--
-- FUNDAMENTO DO SETOR (vocabulário real do trade):
--   • POSITIVAÇÃO: em quantos clientes da carteira o vendedor de fato
--     registrou pedido. É o que separa "visitou" de "vendeu".
--   • RUPTURA: produto em falta na prateleira do cliente. Em item de
--     Curva A é perda dupla — ele não vende e ainda compra do concorrente.
--   • SELL-IN x SELL-OUT: vender volume que o cliente não gira trava a
--     próxima compra. Acompanhar o giro é o que sustenta a recompra.
--   • CURVA ABC: poucos itens sustentam o faturamento. A = nunca faltar,
--     B = ganhar margem, C = girar ou reavaliar.
--   • PREPARO DA VISITA: 3 a 5 minutos revendo último pedido, mix habitual,
--     frequência, títulos em aberto e o que ficou combinado. Sem isso, é
--     tirador de pedido.
--
--   • O TIPO MUDA A CONVERSA: alimentos vive de validade e giro; autopeças
--     de urgência e código de peça; construção de volume e entrega em obra;
--     farma de rastreabilidade e regulação.
--
-- TESE: aqui a venda não termina no pedido — termina na RECOMPRA.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'distribuidora' and tenant_id is null and source = 'skill_seed';

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values

(null, 'distribuidora', 'pricing', 'reactive',
 '{"qual o preço","manda a tabela","quanto custa","qual o valor","tem tabela de preços","me passa os valores"}',
 null,
 'Mandar a tabela inteira é o erro clássico: o cliente compara só o item mais
caro com o concorrente e a conversa vira leilão.
Pergunte primeiro O QUE ele trabalha e o volume — assim você cota o mix certo e
já ancora na faixa de quantidade que melhora o preço.
Informe o preço dos itens que interessam a ELE, junto com pedido mínimo e prazo
de pagamento: em distribuição, condição pesa tanto quanto valor.
Se há tabela por volume, mostre a próxima faixa ("com mais X unidades você cai
para tal preço") — isso aumenta o pedido sem parecer empurro.',
 '{"comercial.pedido_minimo","comercial.prazo_pagamento"}',
 '{"comercial.politica_desconto","comercial.tabela_por_volume","linhas.produtos"}', '{}', 'escalate',
 'Cotação por mix + ancoragem na próxima faixa de volume',
 '{"Mandar a tabela inteira sem saber o que ele vende","Falar preço sem falar condição de pagamento","Perder a chance de subir o pedido com a faixa de volume"}',
 'montar_pedido', 'skill_seed', 'active', null),

(null, 'distribuidora', 'objections', 'reactive',
 '{"já tenho fornecedor","compro de outro","tenho representante","estou bem atendido","não preciso trocar"}',
 null,
 'Quase todo cliente JÁ tem fornecedor — se não tivesse, não seria um bom
cliente. Isso não é recusa, é o ponto de partida.
NUNCA fale mal do fornecedor atual: o cliente escolheu aquilo e criticar soa
como criticar a escolha dele.
Não peça para substituir ninguém. Peça uma FRESTA: um item que costuma faltar,
uma linha que o atual não tem, ou um pedido de entrada pequeno para testar o
atendimento. Distribuidor entra por complemento e cresce por consistência.
Pergunte o que o atual NÃO resolve bem (prazo, ruptura, atraso, mix) — a brecha
está sempre aí, e o cliente conta se você não atacar.',
 '{"diferencial.motivo_trocar"}', '{"linhas.exclusividades","logistica.prazo_entrega","comercial.pedido_minimo"}', '{}', 'escalate',
 'Entrada por complemento (a fresta, não a substituição)',
 '{"Falar mal do fornecedor atual","Pedir para substituir tudo de uma vez","Não investigar o que o atual deixa a desejar"}',
 'primeiro_pedido', 'skill_seed', 'active', null),

(null, 'distribuidora', 'objections', 'reactive',
 '{"tá caro","o outro faz mais barato","seu preço tá alto","consigo por menos"}',
 null,
 'Em distribuição, preço raramente é comparado sozinho — o que decide é o CUSTO
TOTAL: prazo de pagamento, frete, pedido mínimo, prazo de entrega e ruptura.
Um produto dois por cento mais barato que atrasa e deixa a prateleira vazia sai
muito mais caro.
Não baixe na primeira. Abra a conta completa e mostre onde você ganha: rota
própria, entrega no dia certo, reposição rápida, sem pedido mínimo alto.
Se precisar ceder, ceda em CONDIÇÃO (prazo, frete) antes de ceder em preço —
condição preserva sua margem e resolve o problema real, que quase sempre é
fluxo de caixa.',
 '{"logistica.prazo_entrega"}',
 '{"comercial.prazo_pagamento","logistica.frete","comercial.politica_desconto","diferencial.motivo_trocar"}', '{}', 'escalate',
 'Custo total contra preço unitário + ceder condição antes de preço',
 '{"Dar desconto direto na primeira pressão","Comparar só o preço do item","Ignorar que o problema real costuma ser prazo de pagamento"}',
 'defender_margem', 'skill_seed', 'active', null),

(null, 'distribuidora', 'objections', 'reactive',
 '{"pedido mínimo alto","não consigo esse valor","é muito produto","não tenho espaço","não vou girar tudo isso"}',
 null,
 'Pedido mínimo alto trava cliente pequeno — e cliente pequeno bem atendido vira
cliente grande.
Antes de flexibilizar, monte o pedido com o que ELE GIRA: é melhor um pedido
menor que vende todo do que um grande que empaca. Volume que não gira não
retorna — o cliente fica com estoque parado e não recompra.
Mostre as saídas reais: completar com itens de giro rápido, agrupar com a
próxima entrega da rota, ou combinar frequência menor com pedido maior.
Se a política permite entrada reduzida no primeiro pedido, use — o objetivo do
primeiro pedido não é faturar, é começar a relação.',
 '{"comercial.pedido_minimo"}', '{"logistica.dias_de_rota","linhas.produtos","logistica.frete"}', '{}', 'escalate',
 'Montar pelo giro do cliente (sell-out) em vez de empurrar volume',
 '{"Empurrar volume para bater o mínimo: trava a recompra","Recusar o cliente pequeno sem tentar montar o mix","Não usar a rota para viabilizar o pedido"}',
 'primeiro_pedido', 'skill_seed', 'active', null),

(null, 'distribuidora', 'catalog', 'reactive',
 '{"vocês têm","trabalham com","tem essa marca","tem esse item","qual o código","tem em estoque"}',
 null,
 'Responda com EXATIDÃO consultando o catálogo: item, marca, embalagem e
disponibilidade. Dizer que tem o que não tem gera pedido cancelado e queima a
confiança de vez.
Não tem? Ofereça o equivalente explicando a diferença técnica (marca, gramatura,
medida) — e seja claro que é substituto, nunca finja ser o mesmo.
Em autopeças e itens técnicos, CONFIRME o código antes de faturar: peça errada
volta, custa frete dobrado e perde o cliente.
Aproveite a pergunta para oferecer o complemento natural do item — é o momento
mais legítimo de cross-sell.',
 '{"linhas.produtos"}', '{"linhas.marcas","linhas.exclusividades","logistica.prazo_entrega"}', '{}', 'escalate',
 'Exatidão de catálogo + substituto transparente + complemento natural',
 '{"Dizer que tem sem confirmar estoque","Mandar similar como se fosse o mesmo item","Não confirmar código em peça técnica"}',
 'montar_pedido', 'skill_seed', 'active', null),

(null, 'distribuidora', 'goal_matching', 'reactive',
 '{"o que você indica","o que vende mais","o que devo levar","primeira compra","monta um mix pra mim"}',
 null,
 'Pedido de indicação é a chance de virar consultor do negócio dele — é o que
separa o parceiro do tirador de pedido.
Monte o mix pelo PERFIL do estabelecimento: o que vende num mercadinho de bairro
não é o que vende num restaurante ou numa oficina. Comece pelos itens de giro
alto (Curva A), que garantem que ele venda e volte, e acrescente um ou dois
itens de margem melhor.
Explique o porquê de cada item — cliente que entende o mix repete o pedido
sozinho. Não empurre item parado no SEU estoque: ele não gira no dele também, e
você perde a recompra.',
 '{"linhas.produtos"}', '{"linhas.marcas","comercial.pedido_minimo"}', '{}', 'escalate',
 'Mix por perfil do PDV, começando por giro (Curva A)',
 '{"Empurrar o que está encalhado no seu estoque","Indicar o mesmo mix para todo tipo de cliente","Não explicar por que aquele mix"}',
 'montar_pedido', 'skill_seed', 'active', null),

(null, 'distribuidora', 'availability', 'reactive',
 '{"quando entrega","qual o prazo","entrega na minha região","que dia passa","tem entrega hoje","frete"}',
 null,
 'Prazo e rota são o principal diferencial competitivo em distribuição — muitas
vezes pesam mais que preço, porque prateleira vazia é prejuízo imediato.
Informe o dia de rota da região dele e o prazo real. Nunca prometa entrega que a
logística não cumpre: atraso em distribuição não gera reclamação, gera troca de
fornecedor.
Diga a regra de frete com clareza (quem paga, a partir de quanto é grátis) —
frete surpresa é uma das maiores causas de pedido cancelado.
Use a rota como fechamento: "passo na sua região quinta, fecho seu pedido até
quarta?" cria prazo natural sem pressão.',
 '{"logistica.prazo_entrega","logistica.regiao_atendida"}', '{"logistica.dias_de_rota","logistica.frete"}', '{}', 'escalate',
 'Rota como gatilho de fechamento (prazo natural, sem pressão)',
 '{"Prometer entrega fora da rota","Não avisar sobre frete e o cliente descobrir na nota","Dar prazo genérico sem olhar a região"}',
 'fechar_pedido', 'skill_seed', 'active', null),

(null, 'distribuidora', 'retention', 'proactive',
 '{"faz tempo que não compra","cliente parou","não pede há semanas","sumiu","reduziu o pedido"}',
 null,
 'ESTA É A ENTRADA MAIS IMPORTANTE DO SEGMENTO. Cliente de distribuição não
avisa que trocou de fornecedor — ele simplesmente para de pedir, ou reduz aos
poucos. Quando você percebe, já perdeu.
Queda no pedido é sinal de alerta ANTES da perda: pode ser ruptura sua, atraso,
preço de concorrente ou problema no caixa dele.
Retome sem cobrança e com pergunta direta: o que mudou? A resposta quase sempre
revela algo que você consegue resolver.
Traga um gancho concreto — item que ele sempre leva de volta ao estoque, uma
condição para o retorno, ou a rota da semana. Nunca só "e aí, vai querer?".',
 '{}', '{"linhas.produtos","comercial.prazo_pagamento","logistica.dias_de_rota"}', '{}', 'omit',
 'Churn preventivo: agir na QUEDA do pedido, não na perda consumada',
 '{"Esperar o cliente sumir de vez para agir","Cobrar a ausência","Mandar só \"vai querer alguma coisa?\" sem gancho"}',
 'reativar_cliente', 'skill_seed', 'active', null),

(null, 'distribuidora', 'commitment_offer', 'proactive',
 '{"recompra","reposição","próximo pedido","tá na hora de repor","acabou o estoque"}',
 null,
 'A venda em distribuição não termina no pedido — termina na RECOMPRA. E a
recompra se antecipa, não se espera.
Calcule quando o estoque dele deve estar acabando pelo último pedido e pela
frequência, e chame ANTES de faltar. Chegar depois da ruptura significa que ele
já comprou do concorrente para não ficar sem.
Use o histórico como prova de atenção: "no último pedido você levou X, deve
estar no fim — quer repor junto com a rota de quinta?".
Aproveite a reposição para introduzir UM item novo. Nunca mais de um: cliente
testa pouco por vez, e item novo empurrado em excesso vira estoque parado.',
 '{}', '{"logistica.dias_de_rota","linhas.produtos","comercial.tabela_por_volume"}', '{}', 'omit',
 'Antecipação da reposição + introdução de UM item novo por vez',
 '{"Esperar o cliente ligar quando faltar","Chamar sem olhar o que ele levou antes","Empurrar vários itens novos de uma vez"}',
 'recompra', 'skill_seed', 'active', null),

(null, 'distribuidora', 'expertise_proof', 'reactive',
 '{"quem é vocês","há quanto tempo","atende quem","vocês são confiáveis","quem mais compra de vocês"}',
 null,
 'Confiança em distribuição se prova com REGULARIDADE, não com discurso: tempo
de mercado, clientes parecidos com ele na região, e o fato de a rota nunca
falhar.
Cite tipos de cliente semelhantes (sem expor nomes que não autorizaram) —
"atendemos vários mercados de bairro aqui na zona sul" vale mais que adjetivo.
Se você tem exclusividade de alguma marca, é um argumento forte: é algo que o
concorrente não pode oferecer.
Reforce o pós-venda: quem resolve quando falta, quem troca quando vem errado. É
isso que o lojista teme na hora de mudar de fornecedor.',
 '{}', '{"linhas.exclusividades","diferencial.suporte","logistica.dias_de_rota"}', '{}', 'omit',
 'Prova por regularidade e semelhança (não por adjetivo)',
 '{"Responder com adjetivo (\"somos os melhores\")","Expor nome de cliente sem autorização","Não falar do pós-venda, que é o medo real"}',
 'primeiro_pedido', 'skill_seed', 'active', null),

(null, 'distribuidora', 'commitment_offer', 'reactive',
 '{"tem contrato","fecho tudo com vocês","se eu comprar mais","desconto por volume","quero ser exclusivo"}',
 null,
 'Cliente falando em volume ou contrato já decidiu confiar — agora é desenhar a
condição sem entregar a margem inteira.
Troque volume por COMPROMISSO: melhor condição vinculada a frequência ou a um
mix acordado, não a um desconto solto. Desconto sem contrapartida vira o novo
preço de tabela dele para sempre.
Se há política por volume, mostre a conta fechada: quanto ele economiza no mês
comprando na faixa maior.
Formalize o que foi combinado (mix, frequência, condição) — acordo verbal em
distribuição gera atrito no primeiro pedido diferente.',
 '{"comercial.politica_desconto"}', '{"comercial.tabela_por_volume","comercial.prazo_pagamento"}', '{}', 'escalate',
 'Condição vinculada a compromisso (nunca desconto solto)',
 '{"Dar desconto sem contrapartida de frequência ou mix","Não registrar o combinado","Prometer exclusividade sem poder cumprir"}',
 'fechar_acordo', 'skill_seed', 'active', null),

(null, 'distribuidora', 'limits_and_ethics', 'reactive',
 '{"tem validade curta","produto vencendo","garantia","veio errado","produto avariado","troca"}',
 null,
 'Validade, avaria e troca são o teste de caráter do fornecedor — é o que o
lojista lembra na hora de decidir com quem fica.
Seja transparente sobre validade ANTES de faturar: item com prazo curto só deve
ir com o cliente sabendo e com condição compatível. Empurrar produto perto do
vencimento resolve seu estoque e destrói a relação.
Em problema de entrega ou avaria, resolva rápido e sem discutir culpa. O custo
de uma troca é menor que o de perder a carteira.
Nunca prometa troca, garantia ou prazo de validade que a empresa não pratica.
Em alimentos e farma, respeite integralmente as exigências de rastreabilidade.',
 '{}', '{"diferencial.suporte","logistica.prazo_entrega"}',
 '{"Nunca empurrar produto próximo do vencimento sem informar"}', 'omit',
 'Transparência de validade e resolução rápida de avaria',
 '{"Empurrar item vencendo para girar estoque","Discutir culpa em vez de resolver","Prometer troca que a empresa não faz"}',
 'resolver_problema', 'skill_seed', 'active', null),

(null, 'distribuidora', 'reciprocity', 'reactive',
 '{"oi","ola","bom dia","boa tarde","boa noite","tudo bem","você é o representante"}',
 null,
 'Antes de abrir a conversa, gaste três minutos revendo o cliente: último pedido,
o que ele mais leva, com que frequência compra, se tem título em aberto e o que
ficou combinado da última vez.
Abrir com "vai querer alguma coisa?" é o que transforma vendedor em tirador de
pedido — é a pergunta que mais destrói ticket médio no setor.
Abra mostrando que você lembra dele e já com uma sugestão concreta baseada no
histórico. Isso muda a conversa de "anotar pedido" para "cuidar do estoque
dele".',
 '{}', '{"linhas.produtos","logistica.dias_de_rota"}', '{}', 'omit',
 'Preparo da visita (3 a 5 min de histórico antes de falar)',
 '{"Abrir com \"vai querer alguma coisa?\"","Falar sem olhar o histórico do cliente","Ignorar título em aberto e criar constrangimento depois"}',
 'montar_pedido', 'skill_seed', 'active', null),

(null, 'distribuidora', 'ecosystem', 'reactive',
 '{"tem material de divulgação","expositor","ajuda na loja","como expor","promoção pro meu cliente"}',
 null,
 'Ajudar o cliente a VENDER é o que garante sua recompra: o giro dele
(sell-out) é o que determina o próximo pedido, não a sua vontade.
Se a empresa tem material de ponto de venda, expositor ou apoio de campanha,
ofereça — é o investimento com melhor retorno em distribuição.
Mesmo sem material, você pode dar orientação de exposição e de precificacao: o
que costuma girar mais, onde posicionar, qual margem praticar. Isso é
consultoria gratuita que fideliza.
Nunca prometa material ou verba que a empresa não tem.',
 '{}', '{"diferencial.suporte","linhas.marcas"}', '{}', 'omit',
 'Apoio ao sell-out (quem ajuda o cliente a vender, recompra sempre)',
 '{"Focar só no próprio pedido e ignorar o giro do cliente","Prometer material que a empresa não fornece","Não orientar sobre exposição e margem"}',
 'apoiar_giro', 'skill_seed', 'active', null),

(null, 'distribuidora', 'risk_free_entry', 'reactive',
 '{"nunca comprei de vocês","quero testar","como faço pra comprar","primeira compra","preciso me cadastrar"}',
 null,
 'Primeira compra é sobre reduzir risco, não sobre faturar. O lojista teme
receber errado, atrasado ou ficar com produto que não gira.
Explique o caminho completo e simples: cadastro, o que precisa (documento,
inscrição), pedido mínimo, prazo e quando a rota passa. Burocracia mal explicada
mata mais primeiro pedido que preço.
Sugira um pedido de entrada enxuto, com itens de giro rápido — ele vende,
confia e volta. Primeira venda grande com giro ruim mata a segunda.
Combine o acompanhamento: voltar depois da primeira entrega para ver como
girou. É isso que transforma teste em carteira.',
 '{"comercial.pedido_minimo"}', '{"logistica.dias_de_rota","logistica.prazo_entrega","comercial.prazo_pagamento"}', '{}', 'escalate',
 'Pedido de entrada por giro + acompanhamento pós-primeira-entrega',
 '{"Explicar cadastro de forma burocrática e perder o cliente","Fazer primeira venda grande que não gira","Não voltar depois da primeira entrega"}',
 'primeiro_pedido', 'skill_seed', 'active', null),

(null, 'distribuidora', 'commitment_offer', 'reactive',
 '{"vou pensar","depois eu peço","preciso ver com o sócio","não sei se vai girar","vou aguardar","deixa eu ver o estoque","semana que vem eu falo"}',
 null,
 'O lojista que já gostou do mix e mesmo assim adia não está duvidando de você:
está com medo de comprar o que não gira. Capital parado na prateleira é o pesadelo
dele, e ninguém quer explicar ao sócio uma compra encalhada.
Não insista no argumento do produto. Ele já concordou — repetir soa como empurro
e confirma o medo de estar sendo empurrado.
RECOMENDE um pedido, não um catálogo. "Começa só com estes três itens" resolve o
travamento; "escolhe o que quiser" o mantém.
Tire o risco com o que for verdade na casa: pedido de entrada menor que o normal,
prazo de pagamento maior que o primeiro giro, reposição rápida porque você passa
toda semana na rota. O argumento que destrava é simples: ele não precisa acertar
o volume de primeira, porque você volta.
Combine quando vocês conversam de novo, de preferência amarrado na sua rota. Data
vaga em distribuição vira cliente esquecido.',
 '{"comercial.pedido_minimo"}',
 '{"comercial.prazo_pagamento","logistica.prazo_entrega","logistica.dias_de_rota","linhas.produtos"}', '{}', 'escalate',
 'Recomendar um pedido mínimo real e apoiar no giro, não no argumento',
 '{"Repetir as qualidades do produto","Mandar a tabela inteira de novo","Dar desconto sem descobrir o medo de encalhe","Deixar o retorno sem data e sem rota"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt'),

(null, 'distribuidora', 'catalog', 'reactive',
 '{"só me manda a tabela","não precisa ligar","prefiro por escrito","manda no whatsapp","sem visita por enquanto","não quero reunião","depois eu vejo sozinho"}',
 null,
 'Uma parte grande dos compradores hoje prefere resolver sozinho, sem vendedor no
meio — e isso NÃO é desinteresse. Insistir em visita ou ligação com quem pediu
material por escrito é a forma mais rápida de perder a conta.
Entregue o que ele pediu, completo e organizado: os itens que interessam, com
pedido mínimo, prazo de pagamento e dia de rota. Material incompleto obriga a
conversar, e obrigar a conversar é exatamente o que ele não quer.
Faça no máximo DUAS perguntas junto, por escrito, e só as que mudam a cotação (o
que ele já vende, que volume). Perguntar por escrito respeita o tempo dele e ainda
te dá a qualificação.
Deixe a porta aberta sem cobrar: diga que fica a disposição e combine um retorno
leve. Quem compra sozinho volta quando precisa — desde que você não tenha enchido
o saco antes.',
 '{"linhas.produtos"}',
 '{"comercial.pedido_minimo","comercial.prazo_pagamento","logistica.dias_de_rota","logistica.prazo_entrega"}', '{}', 'escalate',
 'Servir quem quer decidir sozinho: material completo + duas perguntas por escrito',
 '{"Insistir em visita para quem pediu material","Mandar material incompleto para forçar conversa","Ligar depois de ele pedir por escrito","Sumir por achar que não há interesse"}',
 'entregar_material', 'skill_seed', 'active', null);
