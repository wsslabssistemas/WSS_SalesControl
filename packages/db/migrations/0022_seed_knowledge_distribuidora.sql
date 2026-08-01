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
   on_missing_facts, technique, common_errors, next_objective, source, status)
values

(null, 'distribuidora', 'pricing', 'reactive',
 '{"qual o preco","manda a tabela","quanto custa","qual o valor","tem tabela de precos","me passa os valores"}',
 null,
 'Mandar a tabela inteira e o erro classico: o cliente compara so o item mais
caro com o concorrente e a conversa vira leilao.
Pergunte primeiro O QUE ele trabalha e o volume — assim voce cota o mix certo e
ja ancora na faixa de quantidade que melhora o preco.
Informe o preco dos itens que interessam a ELE, junto com pedido minimo e prazo
de pagamento: em distribuicao, condicao pesa tanto quanto valor.
Se ha tabela por volume, mostre a proxima faixa ("com mais X unidades voce cai
para tal preco") — isso aumenta o pedido sem parecer empurro.',
 '{"comercial.pedido_minimo","comercial.prazo_pagamento"}',
 '{"comercial.politica_desconto","comercial.tabela_por_volume","linhas.produtos"}', '{}', 'escalate',
 'Cotacao por mix + ancoragem na proxima faixa de volume',
 '{"Mandar a tabela inteira sem saber o que ele vende","Falar preco sem falar condicao de pagamento","Perder a chance de subir o pedido com a faixa de volume"}',
 'montar_pedido', 'skill_seed', 'active'),

(null, 'distribuidora', 'objections', 'reactive',
 '{"ja tenho fornecedor","compro de outro","tenho representante","estou bem atendido","nao preciso trocar"}',
 null,
 'Quase todo cliente JA tem fornecedor — se nao tivesse, nao seria um bom
cliente. Isso nao e recusa, e o ponto de partida.
NUNCA fale mal do fornecedor atual: o cliente escolheu aquilo e criticar soa
como criticar a escolha dele.
Nao peca para substituir ninguem. Peca uma FRESTA: um item que costuma faltar,
uma linha que o atual nao tem, ou um pedido de entrada pequeno para testar o
atendimento. Distribuidor entra por complemento e cresce por consistencia.
Pergunte o que o atual NAO resolve bem (prazo, ruptura, atraso, mix) — a brecha
esta sempre ai, e o cliente conta se voce nao atacar.',
 '{"diferencial.motivo_trocar"}', '{"linhas.exclusividades","logistica.prazo_entrega","comercial.pedido_minimo"}', '{}', 'escalate',
 'Entrada por complemento (a fresta, nao a substituicao)',
 '{"Falar mal do fornecedor atual","Pedir para substituir tudo de uma vez","Nao investigar o que o atual deixa a desejar"}',
 'primeiro_pedido', 'skill_seed', 'active'),

(null, 'distribuidora', 'objections', 'reactive',
 '{"ta caro","o outro faz mais barato","seu preco ta alto","consigo por menos"}',
 null,
 'Em distribuicao, preco raramente e comparado sozinho — o que decide e o CUSTO
TOTAL: prazo de pagamento, frete, pedido minimo, prazo de entrega e ruptura.
Um produto dois por cento mais barato que atrasa e deixa a prateleira vazia sai
muito mais caro.
Nao baixe na primeira. Abra a conta completa e mostre onde voce ganha: rota
propria, entrega no dia certo, reposicao rapida, sem pedido minimo alto.
Se precisar ceder, ceda em CONDICAO (prazo, frete) antes de ceder em preco —
condicao preserva sua margem e resolve o problema real, que quase sempre e
fluxo de caixa.',
 '{"logistica.prazo_entrega"}',
 '{"comercial.prazo_pagamento","logistica.frete","comercial.politica_desconto","diferencial.motivo_trocar"}', '{}', 'escalate',
 'Custo total contra preco unitario + ceder condicao antes de preco',
 '{"Dar desconto direto na primeira pressao","Comparar so o preco do item","Ignorar que o problema real costuma ser prazo de pagamento"}',
 'defender_margem', 'skill_seed', 'active'),

(null, 'distribuidora', 'objections', 'reactive',
 '{"pedido minimo alto","nao consigo esse valor","e muito produto","nao tenho espaco","nao vou girar tudo isso"}',
 null,
 'Pedido minimo alto trava cliente pequeno — e cliente pequeno bem atendido vira
cliente grande.
Antes de flexibilizar, monte o pedido com o que ELE GIRA: e melhor um pedido
menor que vende todo do que um grande que empaca. Volume que nao gira nao
retorna — o cliente fica com estoque parado e nao recompra.
Mostre as saidas reais: completar com itens de giro rapido, agrupar com a
proxima entrega da rota, ou combinar frequencia menor com pedido maior.
Se a politica permite entrada reduzida no primeiro pedido, use — o objetivo do
primeiro pedido nao e faturar, e comecar a relacao.',
 '{"comercial.pedido_minimo"}', '{"logistica.dias_de_rota","linhas.produtos","logistica.frete"}', '{}', 'escalate',
 'Montar pelo giro do cliente (sell-out) em vez de empurrar volume',
 '{"Empurrar volume para bater o minimo: trava a recompra","Recusar o cliente pequeno sem tentar montar o mix","Nao usar a rota para viabilizar o pedido"}',
 'primeiro_pedido', 'skill_seed', 'active'),

(null, 'distribuidora', 'catalog', 'reactive',
 '{"voces tem","trabalham com","tem essa marca","tem esse item","qual o codigo","tem em estoque"}',
 null,
 'Responda com EXATIDAO consultando o catalogo: item, marca, embalagem e
disponibilidade. Dizer que tem o que nao tem gera pedido cancelado e queima a
confianca de vez.
Nao tem? Ofereca o equivalente explicando a diferenca tecnica (marca, gramatura,
medida) — e seja claro que e substituto, nunca finja ser o mesmo.
Em autopecas e itens tecnicos, CONFIRME o codigo antes de faturar: peca errada
volta, custa frete dobrado e perde o cliente.
Aproveite a pergunta para oferecer o complemento natural do item — e o momento
mais legitimo de cross-sell.',
 '{"linhas.produtos"}', '{"linhas.marcas","linhas.exclusividades","logistica.prazo_entrega"}', '{}', 'escalate',
 'Exatidao de catalogo + substituto transparente + complemento natural',
 '{"Dizer que tem sem confirmar estoque","Mandar similar como se fosse o mesmo item","Nao confirmar codigo em peca tecnica"}',
 'montar_pedido', 'skill_seed', 'active'),

(null, 'distribuidora', 'goal_matching', 'reactive',
 '{"o que voce indica","o que vende mais","o que devo levar","primeira compra","monta um mix pra mim"}',
 null,
 'Pedido de indicacao e a chance de virar consultor do negocio dele — e o que
separa o parceiro do tirador de pedido.
Monte o mix pelo PERFIL do estabelecimento: o que vende num mercadinho de bairro
nao e o que vende num restaurante ou numa oficina. Comece pelos itens de giro
alto (Curva A), que garantem que ele venda e volte, e acrescente um ou dois
itens de margem melhor.
Explique o porque de cada item — cliente que entende o mix repete o pedido
sozinho. Nao empurre item parado no SEU estoque: ele nao gira no dele tambem, e
voce perde a recompra.',
 '{"linhas.produtos"}', '{"linhas.marcas","comercial.pedido_minimo"}', '{}', 'escalate',
 'Mix por perfil do PDV, comecando por giro (Curva A)',
 '{"Empurrar o que esta encalhado no seu estoque","Indicar o mesmo mix para todo tipo de cliente","Nao explicar por que aquele mix"}',
 'montar_pedido', 'skill_seed', 'active'),

(null, 'distribuidora', 'availability', 'reactive',
 '{"quando entrega","qual o prazo","entrega na minha regiao","que dia passa","tem entrega hoje","frete"}',
 null,
 'Prazo e rota sao o principal diferencial competitivo em distribuicao — muitas
vezes pesam mais que preco, porque prateleira vazia e prejuizo imediato.
Informe o dia de rota da regiao dele e o prazo real. Nunca prometa entrega que a
logistica nao cumpre: atraso em distribuicao nao gera reclamacao, gera troca de
fornecedor.
Diga a regra de frete com clareza (quem paga, a partir de quanto e gratis) —
frete surpresa e uma das maiores causas de pedido cancelado.
Use a rota como fechamento: "passo na sua regiao quinta, fecho seu pedido ate
quarta?" cria prazo natural sem pressao.',
 '{"logistica.prazo_entrega","logistica.regiao_atendida"}', '{"logistica.dias_de_rota","logistica.frete"}', '{}', 'escalate',
 'Rota como gatilho de fechamento (prazo natural, sem pressao)',
 '{"Prometer entrega fora da rota","Nao avisar sobre frete e o cliente descobrir na nota","Dar prazo generico sem olhar a regiao"}',
 'fechar_pedido', 'skill_seed', 'active'),

(null, 'distribuidora', 'retention', 'proactive',
 '{"faz tempo que nao compra","cliente parou","nao pede ha semanas","sumiu","reduziu o pedido"}',
 null,
 'ESTA E A ENTRADA MAIS IMPORTANTE DO SEGMENTO. Cliente de distribuicao nao
avisa que trocou de fornecedor — ele simplesmente para de pedir, ou reduz aos
poucos. Quando voce percebe, ja perdeu.
Queda no pedido e sinal de alerta ANTES da perda: pode ser ruptura sua, atraso,
preco de concorrente ou problema no caixa dele.
Retome sem cobranca e com pergunta direta: o que mudou? A resposta quase sempre
revela algo que voce consegue resolver.
Traga um gancho concreto — item que ele sempre leva de volta ao estoque, uma
condicao para o retorno, ou a rota da semana. Nunca so "e ai, vai querer?".',
 '{}', '{"linhas.produtos","comercial.prazo_pagamento","logistica.dias_de_rota"}', '{}', 'omit',
 'Churn preventivo: agir na QUEDA do pedido, nao na perda consumada',
 '{"Esperar o cliente sumir de vez para agir","Cobrar a ausencia","Mandar so \"vai querer alguma coisa?\" sem gancho"}',
 'reativar_cliente', 'skill_seed', 'active'),

(null, 'distribuidora', 'commitment_offer', 'proactive',
 '{"recompra","reposicao","proximo pedido","ta na hora de repor","acabou o estoque"}',
 null,
 'A venda em distribuicao nao termina no pedido — termina na RECOMPRA. E a
recompra se antecipa, nao se espera.
Calcule quando o estoque dele deve estar acabando pelo ultimo pedido e pela
frequencia, e chame ANTES de faltar. Chegar depois da ruptura significa que ele
ja comprou do concorrente para nao ficar sem.
Use o historico como prova de atencao: "no ultimo pedido voce levou X, deve
estar no fim — quer repor junto com a rota de quinta?".
Aproveite a reposicao para introduzir UM item novo. Nunca mais de um: cliente
testa pouco por vez, e item novo empurrado em excesso vira estoque parado.',
 '{}', '{"logistica.dias_de_rota","linhas.produtos","comercial.tabela_por_volume"}', '{}', 'omit',
 'Antecipacao da reposicao + introducao de UM item novo por vez',
 '{"Esperar o cliente ligar quando faltar","Chamar sem olhar o que ele levou antes","Empurrar varios itens novos de uma vez"}',
 'recompra', 'skill_seed', 'active'),

(null, 'distribuidora', 'expertise_proof', 'reactive',
 '{"quem e voces","ha quanto tempo","atende quem","voces sao confiaveis","quem mais compra de voces"}',
 null,
 'Confianca em distribuicao se prova com REGULARIDADE, nao com discurso: tempo
de mercado, clientes parecidos com ele na regiao, e o fato de a rota nunca
falhar.
Cite tipos de cliente semelhantes (sem expor nomes que nao autorizaram) —
"atendemos varios mercados de bairro aqui na zona sul" vale mais que adjetivo.
Se voce tem exclusividade de alguma marca, e um argumento forte: e algo que o
concorrente nao pode oferecer.
Reforce o pos-venda: quem resolve quando falta, quem troca quando vem errado. E
isso que o lojista teme na hora de mudar de fornecedor.',
 '{}', '{"linhas.exclusividades","diferencial.suporte","logistica.dias_de_rota"}', '{}', 'omit',
 'Prova por regularidade e semelhanca (nao por adjetivo)',
 '{"Responder com adjetivo (\"somos os melhores\")","Expor nome de cliente sem autorizacao","Nao falar do pos-venda, que e o medo real"}',
 'primeiro_pedido', 'skill_seed', 'active'),

(null, 'distribuidora', 'commitment_offer', 'reactive',
 '{"tem contrato","fecho tudo com voces","se eu comprar mais","desconto por volume","quero ser exclusivo"}',
 null,
 'Cliente falando em volume ou contrato ja decidiu confiar — agora e desenhar a
condicao sem entregar a margem inteira.
Troque volume por COMPROMISSO: melhor condicao vinculada a frequencia ou a um
mix acordado, nao a um desconto solto. Desconto sem contrapartida vira o novo
preco de tabela dele para sempre.
Se ha politica por volume, mostre a conta fechada: quanto ele economiza no mes
comprando na faixa maior.
Formalize o que foi combinado (mix, frequencia, condicao) — acordo verbal em
distribuicao gera atrito no primeiro pedido diferente.',
 '{"comercial.politica_desconto"}', '{"comercial.tabela_por_volume","comercial.prazo_pagamento"}', '{}', 'escalate',
 'Condicao vinculada a compromisso (nunca desconto solto)',
 '{"Dar desconto sem contrapartida de frequencia ou mix","Nao registrar o combinado","Prometer exclusividade sem poder cumprir"}',
 'fechar_acordo', 'skill_seed', 'active'),

(null, 'distribuidora', 'limits_and_ethics', 'reactive',
 '{"tem validade curta","produto vencendo","garantia","veio errado","produto avariado","troca"}',
 null,
 'Validade, avaria e troca sao o teste de carater do fornecedor — e o que o
lojista lembra na hora de decidir com quem fica.
Seja transparente sobre validade ANTES de faturar: item com prazo curto so deve
ir com o cliente sabendo e com condicao compativel. Empurrar produto perto do
vencimento resolve seu estoque e destroi a relacao.
Em problema de entrega ou avaria, resolva rapido e sem discutir culpa. O custo
de uma troca e menor que o de perder a carteira.
Nunca prometa troca, garantia ou prazo de validade que a empresa nao pratica.
Em alimentos e farma, respeite integralmente as exigencias de rastreabilidade.',
 '{}', '{"diferencial.suporte","logistica.prazo_entrega"}',
 '{"Nunca empurrar produto proximo do vencimento sem informar"}', 'omit',
 'Transparencia de validade e resolucao rapida de avaria',
 '{"Empurrar item vencendo para girar estoque","Discutir culpa em vez de resolver","Prometer troca que a empresa nao faz"}',
 'resolver_problema', 'skill_seed', 'active'),

(null, 'distribuidora', 'reciprocity', 'reactive',
 '{"oi","ola","bom dia","boa tarde","boa noite","tudo bem","voce e o representante"}',
 null,
 'Antes de abrir a conversa, gaste tres minutos revendo o cliente: ultimo pedido,
o que ele mais leva, com que frequencia compra, se tem titulo em aberto e o que
ficou combinado da ultima vez.
Abrir com "vai querer alguma coisa?" e o que transforma vendedor em tirador de
pedido — e a pergunta que mais destroi ticket medio no setor.
Abra mostrando que voce lembra dele e ja com uma sugestao concreta baseada no
historico. Isso muda a conversa de "anotar pedido" para "cuidar do estoque
dele".',
 '{}', '{"linhas.produtos","logistica.dias_de_rota"}', '{}', 'omit',
 'Preparo da visita (3 a 5 min de historico antes de falar)',
 '{"Abrir com \"vai querer alguma coisa?\"","Falar sem olhar o historico do cliente","Ignorar titulo em aberto e criar constrangimento depois"}',
 'montar_pedido', 'skill_seed', 'active'),

(null, 'distribuidora', 'ecosystem', 'reactive',
 '{"tem material de divulgacao","expositor","ajuda na loja","como expor","promocao pro meu cliente"}',
 null,
 'Ajudar o cliente a VENDER e o que garante sua recompra: o giro dele
(sell-out) e o que determina o proximo pedido, nao a sua vontade.
Se a empresa tem material de ponto de venda, expositor ou apoio de campanha,
ofereca — e o investimento com melhor retorno em distribuicao.
Mesmo sem material, voce pode dar orientacao de exposicao e de precificacao: o
que costuma girar mais, onde posicionar, qual margem praticar. Isso e
consultoria gratuita que fideliza.
Nunca prometa material ou verba que a empresa nao tem.',
 '{}', '{"diferencial.suporte","linhas.marcas"}', '{}', 'omit',
 'Apoio ao sell-out (quem ajuda o cliente a vender, recompra sempre)',
 '{"Focar so no proprio pedido e ignorar o giro do cliente","Prometer material que a empresa nao fornece","Nao orientar sobre exposicao e margem"}',
 'apoiar_giro', 'skill_seed', 'active'),

(null, 'distribuidora', 'risk_free_entry', 'reactive',
 '{"nunca comprei de voces","quero testar","como faco pra comprar","primeira compra","preciso me cadastrar"}',
 null,
 'Primeira compra e sobre reduzir risco, nao sobre faturar. O lojista teme
receber errado, atrasado ou ficar com produto que nao gira.
Explique o caminho completo e simples: cadastro, o que precisa (documento,
inscricao), pedido minimo, prazo e quando a rota passa. Burocracia mal explicada
mata mais primeiro pedido que preco.
Sugira um pedido de entrada enxuto, com itens de giro rapido — ele vende,
confia e volta. Primeira venda grande com giro ruim mata a segunda.
Combine o acompanhamento: voltar depois da primeira entrega para ver como
girou. E isso que transforma teste em carteira.',
 '{"comercial.pedido_minimo"}', '{"logistica.dias_de_rota","logistica.prazo_entrega","comercial.prazo_pagamento"}', '{}', 'escalate',
 'Pedido de entrada por giro + acompanhamento pos-primeira-entrega',
 '{"Explicar cadastro de forma burocratica e perder o cliente","Fazer primeira venda grande que nao gira","Nao voltar depois da primeira entrega"}',
 'primeiro_pedido', 'skill_seed', 'active');
