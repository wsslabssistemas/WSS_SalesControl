-- =====================================================================
-- COS — MIGRATION 0034 : CURSO — Módulos 2 (Preço e valor) e 3 (Objeção)
--
-- Mesma régua do Módulo 1, aprovada pelo fundador depois de fazer as 5
-- lições: cenário concreto em vez de conceito abstrato, prática que cabe
-- no dia, e pergunta com explicação que ensina no erro.
--
-- A POSIÇÃO DA ALTERNATIVA CORRETA VARIA DESDE A ESCRITA. No Módulo 1 as
-- 16 saíram todas na 1ª opção — erro invisível para quem escreve e óbvio
-- para quem responde. O `seed-curso.mjs` recusa carregar se mais da metade
-- ficar na mesma posição.
--
-- Estes são os dois módulos onde a evasão acontece (50% nas duas primeiras
-- semanas) e onde estão as duas conversas mais frequentes do dia: "quanto
-- custa" e "tá caro".
-- =====================================================================

delete from public.course_questions where lesson_key like 'm2_%' or lesson_key like 'm3_%';
delete from public.course_lessons  where module_key in ('preco_valor', 'objecao');

insert into public.course_lessons (key, module_key, ord, title, minutes, example_category, practice, body) values

-- ============================ MÓDULO 2 — PREÇO E VALOR ================
('m2_l1', 'preco_valor', 1, 'Ninguém acha caro no vazio', 6, 'pricing',
 'Escreva o preço do que você mais vende. Agora escreva, em uma linha, o que ele resolve. Se a segunda linha for mais difícil que a primeira, é aí que a sua venda está travando.',
 'Existe uma frase que todo vendedor já ouviu e quase ninguém interpretou direito: **"tá caro"**.

Caro comparado a quê?

Preço não existe sozinho na cabeça de ninguém. Ele só significa alguma coisa contra uma referência — o concorrente, o que a pessoa pagava antes, o que ela imaginou antes de perguntar, ou o valor que ela atribui ao problema. Quando o cliente diz que está caro, ele está dizendo que **a referência dele é outra**, e não que o seu número é alto.

### O erro que isso provoca

O vendedor ouve "caro" e responde com desconto. Mas se o problema é a referência, o desconto não corrige nada — ele só confirma que o preço era inflado. E ensina o cliente a pedir de novo, sempre.

### O que fazer no lugar

Descobrir a referência antes de defender o número. Uma pergunta resolve:

> *"Caro comparado com o quê? Você chegou a receber outro orçamento?"*

As respostas te dão coisas diferentes, e cada uma pede uma conversa diferente. Se ele comparou com um concorrente, você precisa mostrar o que está incluso em cada proposta. Se ele comparou com o que imaginava, você precisa explicar o que compõe o valor. E se ele comparou com o que tem no bolso agora, não é preço: é **momento** — e isso se resolve com condição de pagamento, não com desconto.

### Ancorar antes de ser ancorado

Quando você entrega o preço sem nenhuma referência ao lado, o cliente inventa a dele. Quando você entrega junto com o que está incluído, com a faixa dos seus projetos ou com o custo de não resolver, você deu a régua.

Quem dá a régua primeiro define a conversa. E dar a régua não é manipulação: é informação que o cliente não tinha como ter sozinho.'),

('m2_l2', 'preco_valor', 2, 'A conta que o cliente não fez', 7, 'pricing',
 'Pegue o problema que o seu produto resolve. Calcule quanto ele custa ao cliente em um ano — em dinheiro, tempo ou retrabalho. Guarde esse número: ele vale mais que qualquer desconto.',
 'Todo cliente compara o seu preço com zero. É o instinto: de um lado o valor que você pediu, do outro "não fazer nada", que parece custar nada.

Só que não fazer nada quase nunca custa nada. **Custa todo mês, em silêncio.**

### O trabalho é tornar visível o que já está sendo pago

O cliente que não organiza o follow-up perde orçamentos que já estavam quase fechados. O que não repõe estoque no dia certo vende menos e ainda perde o cliente para o concorrente. O que continua com a conta de luz cheia paga isso doze vezes por ano, para sempre.

Nada disso aparece numa fatura com o seu nome — e é exatamente por isso que não é percebido.

### Como fazer a conta junto

Não apresente a conta pronta: **construa com ele**. Pergunta a pergunta, com os números dele.

> *"Quantas vezes por mês isso acontece?"*
>
> *"Quanto vale, mais ou menos, cada uma dessas vezes?"*
>
> *"Isso dá quanto num ano?"*

Quando o cliente responde essas três, ele fez a conta. Não foi você que afirmou — o número é dele, e ninguém discute com o próprio número.

### O cuidado que separa isso de manipulação

Use os dados **dele**, não médias de internet. Conta inflada é descoberta na hora e leva junto a sua credibilidade — que é o que estava sustentando o preço.

E se a conta der pequena, seja honesto: às vezes o problema realmente não custa muito, e insistir na venda é vender errado. Cliente que compra o que não precisava não indica, não renova e ainda conta para os outros.'),

('m2_l3', 'preco_valor', 3, 'Desconto é a última carta', 6, 'objections',
 'Liste tudo que você pode ceder numa negociação sem mexer no preço: prazo, forma de pagamento, escopo, frete, brinde, prioridade na agenda. Tenha essa lista pronta antes da próxima conversa difícil.',
 'Quando a pressão de preço aparece, o desconto é a saída mais rápida — e a mais cara. Não pelo dinheiro que você deixa na mesa nessa venda: pelo que ele ensina.

**Desconto na primeira pressão ensina o cliente a pressionar sempre.** Ele aprendeu que o seu preço tem folga, e a próxima negociação já começa de onde a anterior terminou. E se ele indicar você para alguém, indica com a informação de que dá para pedir.

### Ceda condição antes de ceder preço

Quase toda objeção de preço é, na verdade, um problema de **caixa**: a pessoa não tem o valor agora, e não que o valor esteja errado. Isso muda o que resolve:

- prazo de pagamento maior
- parcelamento, entrada menor
- escopo reduzido agora, com ampliação depois
- frete, prioridade de agenda, algo que te custa pouco e vale muito para ele

Todas essas resolvem o problema real **sem** dizer que o preço estava inflado.

### Se for ceder preço, cobre alguma coisa

Desconto de graça vira preço novo. Desconto com contrapartida continua sendo uma negociação: pagamento à vista, fechamento hoje, volume maior, indicação, autorização para usar como referência.

A frase muda tudo. Não é *"consigo fazer por menos"*; é *"consigo esse valor se fecharmos assim"*.

### A pergunta que vale ouro antes de qualquer desconto

> *"Se o preço não fosse um problema, você fecharia hoje?"*

Se a resposta for não, **preço nunca foi a objeção** — e você estava prestes a dar desconto por um motivo que não existia. Aí a conversa é outra, e é sobre ela que fala o próximo módulo.'),

('m2_l4', 'preco_valor', 4, 'Fazer caber sem quebrar o valor', 6, 'risk_free_entry',
 'Desenhe a menor versão do que você vende: a que resolve algo de verdade e cabe no bolso apertado. Se você não tem uma, é ela que está faltando na sua prateleira.',
 'Existe um espaço enorme entre "sim" e "não" que a maioria dos vendedores nunca usa: **o pedido menor**.

Quando o valor não cabe, existem dois caminhos. Baixar o preço do mesmo escopo — que corrói margem e sinaliza que o número era inflado. Ou reduzir o escopo mantendo o padrão: menos itens, uma etapa, um ambiente, um lote de teste.

O segundo é quase sempre melhor, e por um motivo que vai além da margem: **o cliente que começa pequeno e vê funcionar volta para comprar o resto.** O que compra grande com desconto e se arrepende não volta.

### Diminuir o tamanho da decisão

Repare que o problema raramente é o preço em si: é o tamanho do compromisso. Ninguém trava em gastar; trava em **errar**. Um pedido menor não é só mais barato — é mais fácil de decidir, porque o estrago possível é menor.

### As três reduções que funcionam

- **De escopo:** faça uma parte agora, o resto depois. Vale quando o que você vende é divisível.
- **De risco:** garantia clara, começar por um teste, poder cancelar. Vale quando o medo é de não dar certo.
- **De prazo:** diluir no tempo, alinhar a parcela com o que ele já gasta hoje. Vale quando o problema é caixa.

### O que nunca reduzir

**Qualidade escondida.** Trocar o material por um pior sem avisar, para caber no orçamento, é o caminho mais curto para um cliente insatisfeito que fala mal de você — e ele vai comparar com quem pagou o preço cheio.

Se a única forma de caber é entregar menos, diga que está entregando menos, e o que muda. Cliente aceita escopo menor; ninguém aceita ser enganado.'),

('m2_l5', 'preco_valor', 5, 'Perder dói mais que ganhar', 6, 'commitment_offer',
 'Olhe a sua última proposta perdida. Ela dizia o que o cliente ganhava — ou também o que ele continuava perdendo ao não decidir? Reescreva uma frase dela incluindo isso.',
 'Daniel Kahneman ganhou o Nobel de Economia por, entre outras coisas, um achado que atravessa qualquer venda: **as pessoas sentem mais a dor de perder do que o prazer de ganhar o equivalente.**

Perder cem reais incomoda mais do que ganhar cem alegra. Não é opinião — é um dos resultados mais replicados da economia comportamental.

### O que isso muda na sua conversa

A maioria das propostas é escrita só no lado do ganho: *"você vai economizar", "vai vender mais", "vai ganhar tempo"*. Está correto e é fraco.

O mesmo fato dito pelo outro lado pesa mais:

> *"Do jeito que está hoje, você continua pagando isso todo mês."*

Não é uma frase mais agressiva. É a mesma verdade, dita do lado que a cabeça humana escuta melhor.

### Onde isso vira manipulação

Aqui mora a linha, e ela é importante para você ficar do lado certo.

Usar aversão à perda com uma **perda real** é informação: o cliente de fato continua pagando, de fato continua perdendo pedido, de fato perde a condição quando a regra muda no ano que vem.

Inventar a perda é outra coisa. Prazo que não existe, vaga que não vai acabar, promoção que volta na semana seguinte — isso é escassez fabricada, e a evidência é clara de que é o princípio mais fraco de todos os atalhos de persuasão. Funciona uma vez, e cobra caro quando o cliente descobre.

### A regra prática

**Se a perda for verdadeira, mostre. Se você precisou inventar, não precisava.**

Uma venda que só fecha com urgência falsa é uma venda que não deveria fechar — ou um valor que você ainda não conseguiu mostrar. Nos dois casos, o remédio é voltar para a descoberta, não apertar mais.'),

-- ================================ MÓDULO 3 — OBJEÇÃO ==================
('m3_l1', 'objecao', 1, 'Objeção não é não', 6, 'objections',
 'Liste as três objeções que você mais ouve. Ao lado de cada uma, escreva o que ela realmente significa. Você vai perceber que pelo menos uma é pedido de informação disfarçado.',
 'Quem levanta objeção está na conversa. Quem não tem interesse não argumenta — agradece e some.

Essa inversão é a primeira coisa a entender neste módulo: **a objeção é sinal de que a pessoa está considerando.** Ela está tentando resolver a dúvida que falta antes de decidir, e escolheu resolver com você em vez de sozinha.

### Por que ela assusta tanto

Porque parece rejeição. E a reação instintiva a uma rejeição é uma de duas: **defender** ou **desistir**.

Defender vira discussão, e discussão o vendedor nunca ganha — mesmo quando tem razão, ele perde o cliente. Desistir é pior, porque o cliente estava perto.

### O que fazer no lugar

Tratar a objeção como o que ela é: uma informação que você não tinha. Ela te diz exatamente onde está o obstáculo. Sem ela, você estaria adivinhando.

A postura muda tudo. Em vez de responder rápido para tirá-la do caminho, vale ficar **curioso**:

> *"Entendi. Me conta um pouco mais sobre isso."*

Essa frase parece pouco e faz muito: não concorda, não discorda, e faz o cliente explicar. E quase sempre o que vem depois é mais útil que a objeção original.

### As quatro que respondem por quase tudo

Na prática, quase toda objeção cai em uma destas: **preço** (não vejo valor suficiente), **tempo** (não é agora), **confiança** (não sei se dá certo com você) e **autoridade** (não sou eu quem decide).

Repare que só a primeira parece ser sobre você. As outras três são sobre contexto, e nenhuma delas se resolve com argumento de produto.

Saber em qual delas você está é meio caminho — e é disso que trata a próxima aula.'),

('m3_l2', 'objecao', 2, 'A primeira objeção quase nunca é a real', 7, 'objections',
 'Na próxima objeção que você receber, antes de responder, pergunte: "além disso, tem mais alguma coisa te segurando?". Anote o que vem depois — é ali que costuma estar a venda.',
 'O cliente diz que está caro. Você trabalha o preço, faz a conta, mostra o valor, oferece condição — e ele continua sem fechar.

Não é que o seu argumento foi ruim. É que **o preço não era o problema.**

### Por que as pessoas dão a objeção falsa

Não é má-fé. "Tá caro" é socialmente fácil: não ofende ninguém, não exige explicação e encerra a conversa. Dizer *"não confio na sua empresa"*, *"quem decide é meu sócio e ele não quer"* ou *"não entendi metade do que você falou"* é muito mais difícil.

Então a pessoa dá a objeção **educada**, e o vendedor gasta a conversa inteira resolvendo o problema errado.

### Como isolar a objeção real

Antes de responder qualquer coisa, faça a pergunta de isolamento:

> *"Além do preço, tem mais alguma coisa te segurando?"*

Duas coisas podem acontecer.

Se ele disser que não, você isolou: preço é a única pedra, e resolver preço fecha a venda. Vale até confirmar em voz alta — *"então se a gente resolver isso, fechamos?"* — porque agora o compromisso está dito.

Se ele disser que sim e trouxer outra coisa, **você acabou de ganhar a conversa**. A segunda coisa quase sempre é a verdadeira, e você teria gastado a reunião inteira sem saber dela.

### O erro que anula tudo

Fazer a pergunta e responder junto: *"além do preço não tem mais nada, né?"* — isso não é pergunta, é pedido de confirmação, e o cliente concorda por educação.

Pergunte de verdade. E aguente o silêncio que vem depois: é nele que a objeção real aparece.'),

('m3_l3', 'objecao', 3, 'Nomear a emoção baixa a temperatura', 6, 'limits_and_ethics',
 'Escreva três frases de rotulagem para as objeções que você mais ouve. Todas começam com "parece que" ou "pelo jeito". Teste uma na próxima conversa tensa.',
 'Chris Voss negociou reféns pelo FBI por duas décadas. A técnica que ele mais usa não é argumento nenhum — é **nomear em voz alta o que a outra pessoa está sentindo**.

> *"Parece que o prazo é o que mais te preocupa."*
>
> *"Pelo jeito você já se queimou com fornecedor antes."*

Não é concordar. Não é discordar. É mostrar que você entendeu.

### Por que funciona

Uma pessoa tensa gasta energia tentando ser compreendida. Enquanto ela sente que não foi, ela repete, endurece e não escuta o que você diz — porque escutar é perder a chance de ser entendida.

No momento em que o receio dela é dito com clareza, a tensão baixa. Ela não precisa mais defender aquele ponto, e a conversa volta a andar.

### A diferença entre rotular e concordar

*"Você tem razão, está caro mesmo"* — isso é concordar, e agora você tem que sustentar isso.

*"Parece que o valor ficou acima do que você esperava"* — isso é rotular. Você nomeou a percepção sem validar como fato, e abriu espaço para investigar de onde veio.

### Onde isso queima

Rotular emoção que não existe. Se o cliente está tranquilo e você diz *"parece que você está preocupado"*, ele percebe a técnica na hora — e técnica percebida vira desconfiança.

A régua é simples: **só nomeie o que você realmente ouviu.** Rotulagem é atenção transformada em frase, não fórmula para encaixar em qualquer conversa.

Se você não tem certeza do que a pessoa está sentindo, não invente. Pergunte — e volte para a aula anterior.'),

('m3_l4', 'objecao', 4, 'Caro comparado com o quê', 6, 'pricing',
 'Monte a sua comparação item a item: o que a sua proposta inclui e que o orçamento mais barato normalmente não inclui. Cinco linhas bastam. Tenha pronta, porque ela sempre é pedida.',
 'De todas as objeções, essa é a mais frequente e a mais mal respondida: **"achei mais barato com outro"**.

A reação errada tem duas formas, e as duas custam a venda.

**Atacar o concorrente** — *"eles usam material ruim"*. Soa pequeno e defensivo, e ainda faz o cliente defender a escolha que ele estava considerando. Ninguém gosta de ouvir que quase fez besteira.

**Cobrir o preço na hora** — confirma que o seu número tinha folga e joga a conversa para o único critério em que sempre existe alguém mais barato.

### O que fazer: dar a régua

O cliente quase nunca tem como saber se as duas propostas são a mesma coisa. Ele está comparando dois números finais porque é a única coisa que ele consegue comparar sozinho.

Seu trabalho não é atacar a outra proposta: é **ensinar a comparar**.

> *"Pode ser uma boa proposta. Vamos só conferir se estão comparando a mesma coisa: a deles inclui [x], [y] e [z]?"*

Três coisas acontecem. Você não desmereceu ninguém. Você mostrou domínio do que está vendendo. E o cliente vai olhar a outra proposta com uma lista na mão — muitas vezes descobrindo sozinho que a diferença de preço é exatamente o que falta nela.

### Quando o concorrente é mesmo mais barato pelo mesmo escopo

Acontece, e a resposta é honestidade. Diga onde você é diferente — prazo, garantia, atendimento, equipe própria — e deixe o cliente escolher.

Perder uma venda para um concorrente legitimamente mais barato é normal. Perder porque você atacou e pareceu inseguro é evitável, e é o que mais acontece.'),

('m3_l5', 'objecao', 5, 'Já tenho fornecedor', 6, 'objections',
 'Escolha um cliente que hoje compra do concorrente. Escreva qual seria a sua "fresta": o item, a situação ou o problema pelo qual você entraria sem pedir para substituir ninguém.',
 'Essa objeção parece uma porta fechada e é, na verdade, a melhor notícia da conversa: **se ele já tem fornecedor, é porque compra.** Cliente que não compra de ninguém não é cliente.

O erro é tratar como um duelo — pedir que ele troque, ou provar que o atual é ruim. Nos dois casos você está pedindo que a pessoa admita ter feito uma escolha errada, e ninguém faz isso de bom grado.

### Peça a fresta, não a substituição

Ninguém precisa demitir o fornecedor atual para começar a comprar de você. Existem entradas menores e muito mais fáceis de aceitar:

- ser a **segunda opção** para quando o atual não puder atender
- fornecer o item específico que o atual não tem ou costuma atrasar
- atender uma unidade, uma linha, um pedido de teste

Em muitos ramos, ter mais de um fornecedor é boa prática de gestão de risco — então o seu pedido não é um favor, é uma recomendação sensata.

### A pergunta que abre a porta

> *"O que o seu fornecedor atual **não** resolve tão bem?"*

Repare que ela não ataca. Ela convida o cliente a falar, e quase sempre existe alguma coisa: um prazo que escorrega, um item que falta, um atendimento que sumiu.

Essa lacuna é o seu ponto de entrada — e é bem mais fácil ocupar uma lacuna do que derrubar um titular.

### E depois de entrar

Consistência, não conquista. Quem entra por uma fresta e cumpre o combinado três vezes seguidas vira o principal sem precisar pedir. O cliente muda sozinho, e sem ter que admitir nada.');

-- ---------------------------------------------------------------------
-- PERGUNTAS — posição da correta variada desde a escrita.
-- ---------------------------------------------------------------------
insert into public.course_questions (lesson_key, ord, question, options, correct, explanation) values

('m2_l1', 1, 'O que o cliente está dizendo quando fala que está caro?',
 array['Que o seu preço está acima do mercado',
       'Que a referência de comparação dele é outra',
       'Que ele não tem o dinheiro',
       'Que ele quer desconto'],
 1,
 'Preço não existe sozinho: só significa algo contra uma referência. "Caro" diz que a régua dele é outra — descobrir qual é o trabalho, e cada resposta pede uma conversa diferente.'),

('m2_l1', 2, 'Por que responder "caro" com desconto costuma piorar?',
 array['Porque confirma que o preço tinha folga e ensina a pedir de novo',
       'Porque a margem fica apertada demais',
       'Porque o cliente desconfia da qualidade',
       'Porque atrasa o fechamento'],
 0,
 'Se o problema era a referência, o desconto não corrige nada — só sinaliza que o número era inflado. E a próxima negociação começa de onde essa terminou.'),

('m2_l1', 3, 'O cliente diz que comparou com o que tinha no bolso agora. O que isso indica?',
 array['Que o produto não interessa',
       'Que a proposta está mal explicada',
       'Que o problema é momento, e se resolve com condição de pagamento',
       'Que ele quer um concorrente mais barato'],
 2,
 'Não é preço, é caixa. Desconto não resolve caixa; prazo, parcelamento e escopo menor resolvem — sem dizer que o valor estava errado.'),

('m2_l2', 1, 'Com o que o cliente compara o seu preço, por instinto?',
 array['Com o concorrente mais barato',
       'Com o que ele pagou da última vez',
       'Com o orçamento do mês',
       'Com zero — não fazer nada'],
 3,
 'De um lado o valor que você pediu, do outro "não fazer nada", que parece custar nada. Tornar visível o custo que já está sendo pago em silêncio é o trabalho.'),

('m2_l2', 2, 'Qual é o jeito certo de apresentar o custo de não resolver?',
 array['Construir a conta junto com o cliente, com os números dele',
       'Levar a conta pronta com médias do setor',
       'Comparar com o que outros clientes economizaram',
       'Mostrar o cálculo no fim da proposta'],
 0,
 'Quando o cliente responde as perguntas e faz a conta, o número é dele — e ninguém discute com o próprio número. Conta pronta com média de internet é descoberta na hora.'),

('m2_l3', 1, 'Por que dar desconto na primeira pressão é caro além do dinheiro?',
 array['Porque reduz a margem do mês',
       'Porque ensina o cliente a pressionar sempre',
       'Porque atrasa o fechamento',
       'Porque irrita quem pagou o preço cheio'],
 1,
 'Ele aprendeu que o seu preço tem folga. A próxima negociação começa de onde esta terminou — e a indicação dele vem com a informação de que dá para pedir.'),

('m2_l3', 2, 'O que ceder antes de ceder preço?',
 array['Um brinde de baixo custo',
       'Um percentual pequeno, para não parecer inflexível',
       'Condição: prazo, parcelamento, escopo, frete',
       'A garantia estendida'],
 2,
 'Quase toda objeção de preço é problema de caixa. Condição resolve o problema real sem sinalizar que o preço estava inflado.'),

('m2_l3', 3, 'Para que serve perguntar "se o preço não fosse um problema, você fecharia hoje?"',
 array['Para descobrir se preço é mesmo a objeção',
       'Para pressionar o fechamento',
       'Para justificar um desconto maior',
       'Para saber se ele tem autonomia'],
 0,
 'Se a resposta for não, preço nunca foi a objeção — e você estava prestes a dar desconto por um motivo que não existia.'),

('m2_l4', 1, 'Quando o valor não cabe, qual caminho costuma ser melhor?',
 array['Baixar o preço mantendo o escopo',
       'Reduzir o escopo mantendo o padrão',
       'Alongar o prazo de entrega',
       'Oferecer um produto de linha inferior'],
 1,
 'Quem começa pequeno e vê funcionar volta para comprar o resto. Quem compra grande com desconto e se arrepende não volta.'),

('m2_l4', 2, 'O que nunca reduzir para fazer caber no orçamento?',
 array['O escopo entregue agora',
       'O prazo de pagamento',
       'A quantidade de itens',
       'A qualidade, sem avisar'],
 3,
 'Cliente aceita escopo menor; ninguém aceita ser enganado. Se a única forma de caber é entregar menos, diga o que muda.'),

('m2_l4', 3, 'Por que o pedido menor destrava a decisão, além do preço?',
 array['Porque diminui o tamanho do erro possível',
       'Porque cabe no cartão de crédito',
       'Porque exige menos aprovação interna',
       'Porque acelera a entrega'],
 0,
 'Ninguém trava em gastar: trava em errar. Um compromisso menor é mais fácil de decidir porque o estrago possível é menor.'),

('m2_l5', 1, 'O que o achado de Kahneman diz sobre perdas e ganhos?',
 array['Que ganhos previsíveis valem mais que incertos',
       'Que as pessoas evitam decidir sob pressão',
       'Que perder dói mais do que ganhar o equivalente alegra',
       'Que ninguém calcula risco corretamente'],
 2,
 'É um dos resultados mais replicados da economia comportamental. Por isso a mesma verdade dita pelo lado da perda pesa mais que dita pelo lado do ganho.'),

('m2_l5', 2, 'Qual é o limite entre usar aversão à perda e manipular?',
 array['Usar em cliente novo é aceitável; em cliente antigo, não',
       'A perda precisa ser real, não inventada',
       'Só pode ser usada no fechamento',
       'Depende do valor do negócio'],
 1,
 'Perda real é informação: ele de fato continua pagando. Prazo que não existe e vaga que não acaba são escassez fabricada — o atalho mais fraco de todos, e o que mais custa quando é descoberto.'),

('m2_l5', 3, 'A venda só fecha com urgência inventada. O que isso indica?',
 array['Que o valor ainda não foi mostrado — volte para a descoberta',
       'Que o cliente é indeciso por natureza',
       'Que o preço está acima do mercado',
       'Que falta autoridade para decidir'],
 0,
 'Uma venda que precisa de urgência falsa é uma venda que não deveria fechar, ou um valor que você ainda não conseguiu mostrar. Apertar mais não resolve nenhum dos dois.'),

('m3_l1', 1, 'Por que a objeção é um bom sinal?',
 array['Porque dá tempo para apresentar mais argumentos',
       'Porque mostra que o cliente entendeu a proposta',
       'Porque quem não tem interesse não argumenta — agradece e some',
       'Porque indica que o preço está próximo do aceitável'],
 2,
 'Quem levanta objeção está na conversa: está tentando resolver a dúvida que falta antes de decidir, e escolheu resolver com você.'),

('m3_l1', 2, 'Quais são as duas reações instintivas ruins diante de uma objeção?',
 array['Defender ou desistir',
       'Descontar ou adiar',
       'Explicar ou insistir',
       'Perguntar ou ouvir'],
 0,
 'Defender vira discussão — que o vendedor nunca ganha, mesmo com razão. Desistir é pior, porque o cliente estava perto.'),

('m3_l1', 3, 'As objeções caem em quatro grupos. Quantos deles são sobre o seu produto?',
 array['Todos os quatro',
       'Três: preço, tempo e confiança',
       'Dois: preço e confiança',
       'Só um: preço'],
 3,
 'Tempo, confiança e autoridade são sobre contexto, não sobre o que você vende — e nenhum deles se resolve com argumento de produto.'),

('m3_l2', 1, 'Por que o cliente costuma dar uma objeção que não é a real?',
 array['Porque não confia no vendedor',
       'Porque "tá caro" é socialmente fácil e não exige explicação',
       'Porque quer negociar desconto',
       'Porque não entendeu a proposta'],
 1,
 'Não é má-fé. Dizer "não confio na sua empresa" ou "não entendi metade" é muito mais difícil — então vem a objeção educada.'),

('m3_l2', 2, 'Qual é a pergunta de isolamento?',
 array['"O que você achou da proposta?"',
       '"Qual seria o valor ideal para você?"',
       '"Você prefere fechar hoje ou semana que vem?"',
       '"Além do preço, tem mais alguma coisa te segurando?"'],
 3,
 'Se ele disser não, você isolou a única pedra. Se disser sim e trouxer outra coisa, você acabou de descobrir a objeção verdadeira antes de gastar a conversa inteira.'),

('m3_l2', 3, 'Qual erro anula a pergunta de isolamento?',
 array['Fazê-la logo no começo da conversa',
       'Fazê-la por escrito',
       'Responder junto: "além do preço não tem mais nada, né?"',
       'Fazê-la depois de apresentar o preço'],
 2,
 'Pedido de confirmação não é pergunta: o cliente concorda por educação. Pergunte de verdade e aguente o silêncio — é nele que a objeção real aparece.'),

('m3_l3', 1, 'O que é rotular uma emoção?',
 array['Nomear em voz alta o que a outra pessoa parece estar sentindo',
       'Concordar com a preocupação do cliente',
       'Repetir a última frase que ele disse',
       'Perguntar como ele se sente sobre a proposta'],
 0,
 'Não é concordar nem discordar: é mostrar que entendeu. "Parece que o prazo é o que mais te preocupa" nomeia a percepção sem validá-la como fato.'),

('m3_l3', 2, 'Por que nomear a emoção baixa a tensão?',
 array['Porque demonstra empatia profissional',
       'Porque a pessoa para de gastar energia tentando ser compreendida',
       'Porque interrompe o raciocínio dela',
       'Porque transfere a decisão para o vendedor'],
 1,
 'Enquanto sente que não foi entendida, ela repete, endurece e não escuta — porque escutar seria perder a chance de ser entendida.'),

('m3_l3', 3, 'Quando a rotulagem queima a confiança?',
 array['Quando usada mais de uma vez na conversa',
       'Quando usada por escrito',
       'Quando usada com cliente antigo',
       'Quando nomeia uma emoção que não existe'],
 3,
 'Se o cliente está tranquilo e você diz que ele parece preocupado, ele percebe a técnica na hora — e técnica percebida vira desconfiança. Só nomeie o que você realmente ouviu.'),

('m3_l4', 1, 'Por que atacar o concorrente mais barato sai caro?',
 array['Porque o cliente pode repassar o comentário',
       'Porque soa pequeno e faz o cliente defender a escolha dele',
       'Porque revela que você conhece a concorrência',
       'Porque abre espaço para pedirem desconto'],
 1,
 'Ninguém gosta de ouvir que quase fez besteira. Atacar coloca o cliente do lado do concorrente, defendendo a própria decisão.'),

('m3_l4', 2, 'Qual é a resposta certa para "achei mais barato com outro"?',
 array['Cobrir o preço para não perder a venda',
       'Explicar por que o seu produto é superior',
       'Ensinar a comparar item a item, sem desmerecer ninguém',
       'Pedir para ver a outra proposta'],
 2,
 'O cliente compara dois números finais porque é o que ele consegue comparar sozinho. Dar a régua faz ele descobrir que a diferença costuma ser o que falta na outra proposta.'),

('m3_l4', 3, 'E quando o concorrente é mesmo mais barato pelo mesmo escopo?',
 array['Honestidade: diga onde você é diferente e deixe ele escolher',
       'Iguale o preço para não perder o cliente',
       'Ofereça um brinde para compensar',
       'Adie a decisão para reunir mais argumentos'],
 0,
 'Perder para um concorrente legitimamente mais barato é normal. Perder porque você atacou e pareceu inseguro é evitável — e é o que mais acontece.'),

('m3_l5', 1, 'Por que "já tenho fornecedor" é boa notícia?',
 array['Porque mostra que ele conhece o mercado',
       'Porque abre espaço para comparação de preço',
       'Porque significa que ele já compra — quem não compra de ninguém não é cliente',
       'Porque indica que o contrato está perto de vencer'],
 2,
 'A objeção parece porta fechada e é a confirmação de que existe demanda. O erro é transformar em duelo, pedindo que ele admita ter escolhido errado.'),

('m3_l5', 2, 'O que é pedir "a fresta"?',
 array['Entrar por um item, uma unidade ou um pedido de teste',
       'Oferecer preço menor no primeiro pedido',
       'Pedir para participar da próxima concorrência',
       'Propor um contrato de exclusividade futura'],
 0,
 'Ninguém precisa demitir o fornecedor atual para começar a comprar de você. Em muitos ramos ter segunda fonte é boa gestão de risco — o pedido é sensato, não é favor.'),

('m3_l5', 3, 'Qual pergunta abre a porta sem atacar o fornecedor atual?',
 array['"Quanto você paga hoje?"',
       '"O que o seu fornecedor atual não resolve tão bem?"',
       '"Você está satisfeito com ele?"',
       '"Já pensou em trocar de fornecedor?"'],
 1,
 'Ela convida o cliente a falar em vez de defender a escolha. E quase sempre existe uma lacuna — ocupar lacuna é bem mais fácil do que derrubar titular.');
