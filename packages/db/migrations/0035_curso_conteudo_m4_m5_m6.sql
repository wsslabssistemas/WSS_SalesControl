-- =====================================================================
-- COS — MIGRATION 0035 : CURSO — Módulos 4, 5 e 6
--
-- 4. O cliente que travou (indecisão) — a maior causa de perda do funil,
--    e a que quase ninguém trata porque é confundida com objeção.
-- 5. Cadência e follow-up — a lacuna que originou o produto: em serviços
--    técnicos, +70% dos orçamentos nunca recebem uma segunda mensagem.
-- 6. Persuasão com ética — os atalhos da decisão humana, cada um com a
--    força de evidência que ele realmente tem. É aqui que o curso se
--    separa do culto ao guru.
--
-- Posição da alternativa correta variada desde a escrita.
-- =====================================================================

delete from public.course_questions where lesson_key like 'm4_%' or lesson_key like 'm5_%' or lesson_key like 'm6_%';
delete from public.course_lessons  where module_key in ('indecisao', 'cadencia', 'persuasao');

insert into public.course_lessons (key, module_key, ord, title, minutes, example_category, practice, body) values

-- ======================= MÓDULO 4 — O CLIENTE QUE TRAVOU ==============
('m4_l1', 'indecisao', 1, 'Ele concordou e não decidiu', 6, 'commitment_offer',
 'Abra seu funil e conte quantos clientes estão parados depois de terem elogiado a proposta. Esse número é o tamanho do seu problema de indecisão — e ele não aparece em relatório nenhum.',
 'Existe uma pesquisa recente que deveria mudar a forma como você olha o seu funil. Matthew Dixon e sua equipe analisaram **2,5 milhões de conversas de venda gravadas**. O achado principal:

**Entre 40% e 60% dos negócios perdidos não vão para o concorrente. Vão para a indecisão.**

O cliente não escolheu outro fornecedor. Ele não escolheu ninguém.

### E tem mais: a maioria queria comprar

Dos negócios que morrem em "não decidi", 44% preferem mesmo ficar como estão. Mas **56% queriam mudar** — entenderam o problema, concordaram com a solução, e travaram assim mesmo.

Esse cliente elogiou a sua proposta. Ele não tinha nenhuma objeção. E não fechou.

### Por que isso é tratado errado

Porque parece objeção, e a gente responde como objeção: mais argumento, mais benefício, mais prova. Só que ele **já concordou** — insistir no argumento é responder uma pergunta que ele não fez.

Indecisão não é falta de convencimento. É **medo de errar**.

### A diferença que decide a conversa

- Se o cliente ainda não vê o problema, é falta de valor: volte para a descoberta.
- Se ele viu, concordou, e mesmo assim adiou, é indecisão: **pare de convencer e comece a reduzir risco.**

São remédios opostos. Aplicar o primeiro no segundo caso é o erro mais caro do funil — e é o que quase todo vendedor faz, com a melhor das intenções.

Este módulo inteiro é sobre o segundo caso.'),

('m4_l2', 'indecisao', 2, 'Os três medos que travam', 6, 'objections',
 'Pegue o último cliente que sumiu depois de elogiar a proposta. Escreva qual dos três medos era o dele. Se não souber, é isso que a próxima mensagem precisa descobrir — não convencer.',
 'Quando alguém trava, quase sempre é um destes três medos. E cada um pede uma resposta diferente.

### 1. Medo de escolher errado

*"E se eu escolher e não for a melhor opção?"*

É o medo de arrependimento. Aparece quando existem várias opções parecidas, ou quando o cliente não tem repertório para comparar. Quanto mais opções você deu, mais forte ele fica.

**O que resolve:** recomendação. Uma, com motivo. É a próxima aula.

### 2. Medo de pagar demais

*"E se der para conseguir melhor em outro lugar?"*

Não é achar caro — é não ter certeza de que é justo. Diferente da objeção de preço, aqui ele não pede desconto: ele adia.

**O que resolve:** transparência sobre o que compõe o valor, e a régua de comparação. Cliente que entende o que está pagando para de procurar.

### 3. Medo de não funcionar

*"E se eu fizer e não resolver?"*

O mais comum em ticket alto e em decisão irreversível. Ele não duvida de você; ele duvida do resultado.

**O que resolve:** reduzir o tamanho e a reversibilidade da decisão — garantia, começar menor, um caso parecido que ele pode ver.

### Como descobrir qual é

Perguntando, sem cobrar decisão:

> *"O que ainda te deixa em dúvida?"*

E aguentando o silêncio. A resposta a essa pergunta vale mais que qualquer argumento novo — porque ela diz qual dos três remédios usar.'),

('m4_l3', 'indecisao', 3, 'Recomende — não ofereça mais opções', 6, 'goal_matching',
 'Escolha um cliente parado. Escreva a frase: "no seu caso eu faria X, por causa de Y". Se você não conseguir escrever, falta descoberta — não falta opção.',
 'O instinto de quem quer ajudar um cliente indeciso é dar mais alternativas. *"Se esse não serve, tenho outros três."*

É o contrário do que ajuda.

### Mais opção trava mais

Quem já está com medo de escolher errado não precisa de mais para comparar: cada opção nova aumenta a chance percebida de errar, e o custo de decidir sobe. A pessoa sai da conversa com mais material e menos decisão.

### O que destrava é assumir posição

> *"Pelo que você me contou, eu faria assim — por causa disto e disto."*

Repare no que essa frase entrega: você usou o que ele disse (então ele foi ouvido), você assumiu um lado (então o risco de escolher passou a ser dividido) e você deu o motivo (então não é opinião solta, é critério).

Cliente travado não quer escolher. Quer ser **orientado por alguém que entende** — e é exatamente para isso que ele procurou um profissional em vez de um catálogo.

### O medo do vendedor

Muita gente evita recomendar por receio de errar a recomendação, ou de parecer que está empurrando o mais caro.

Sobre o primeiro: recomendar com critério explícito não é chute — e se o cliente discordar, ele vai dizer por quê, e você acabou de ganhar informação.

Sobre o segundo: recomende o que faz sentido, mesmo quando for o mais barato. É justamente aí que a recomendação ganha peso, e o cliente lembra disso no próximo pedido.

### Uma opção, um caminho, uma próxima ação

Se precisar oferecer alternativa, ofereça **duas** — nunca cinco. E deixe claro qual você faria.'),

('m4_l4', 'indecisao', 4, 'Diminuir o tamanho da decisão', 6, 'risk_free_entry',
 'Escreva a menor versão possível do seu próximo negócio parado: o que dá para fazer agora, com o menor compromisso, que ainda resolve algo de verdade.',
 'Quando o medo é de errar, existem dois caminhos: convencer que não vai dar errado — difícil, e ninguém acredita — ou **fazer com que errar custe pouco**.

O segundo é mais honesto e funciona muito melhor.

### As quatro formas de encolher a decisão

- **Menos escopo:** um ambiente, uma linha, uma unidade. O resto depois.
- **Menos tempo:** um teste, um período curto, um primeiro lote.
- **Menos irreversibilidade:** garantia clara, possibilidade de ajustar, cancelamento definido.
- **Menos incerteza:** um cliente parecido que ele possa conversar, um caso que ele possa ver.

Nenhuma delas mexe no preço. Todas mexem no **risco percebido**, que é o que realmente está travando.

### Por que isso não é vender menos

Porque quem começa pequeno e vê funcionar volta — e volta sem negociar, porque já sabe o que está comprando. O pedido pequeno não é uma venda menor: é a primeira parcela de uma venda maior, com muito mais chance de acontecer.

Vender grande para quem está com medo costuma terminar em uma de duas: não fecha, ou fecha e se arrepende. A segunda é pior.

### Onde isso vale mais

Quanto **maior e mais irreversível** a compra, mais essa técnica pesa. Um serviço que se refaz em uma semana não assusta ninguém. Uma reforma, um sistema no telhado, uma troca de fornecedor que pode parar a produção — aí o medo é o obstáculo principal, e reduzir preço não toca nele.

### E sempre com data

Encolher a decisão sem marcar o próximo passo só adia o mesmo travamento. Diminua o tamanho **e** combine quando vocês conversam de novo.'),

('m4_l5', 'indecisao', 5, 'O erro que piora tudo', 6, 'commitment_offer',
 'Releia a última mensagem que você mandou para um cliente que sumiu. Ela trazia algo novo ou repetia o que ele já tinha ouvido? Reescreva com um ângulo diferente.',
 'A pesquisa das 2,5 milhões de chamadas encontrou uma coisa que vale como aviso.

Quando o cliente hesitava na hora de fechar, **73% dos vendedores voltavam ao começo** — reapresentavam o problema, reforçavam o valor, repetiam o argumento que já tinha funcionado.

E em **84% dessas vezes, isso aumentou a chance de perder o negócio.**

### Por que repetir piora

Porque para quem já concordou, mais argumento soa como pressão. E pressão, em quem está com medo de errar, confirma o medo: *"se ele está insistindo tanto, deve ter alguma coisa aí"*.

Além disso, reapresentar sinaliza que você não entendeu o que está acontecendo. Ele não discordou de nada — e você respondeu como se ele tivesse discordado.

### O que fazer no lugar

Três movimentos, nesta ordem:

1. **Perguntar o que trava**, sem cobrar decisão. *"O que ainda te deixa em dúvida?"*
2. **Recomendar** um caminho, em vez de abrir mais opções.
3. **Encolher a decisão** e marcar a próxima conversa com data.

Nenhum dos três é argumento novo. Todos os três reduzem risco.

### O sinal de que você está no caminho certo

O cliente volta a falar. Enquanto ele só responde com "vou ver" e "te falo", você ainda está no modo de convencer.

Quando ele diz o que está pesando — mesmo que seja algo que você não esperava — a conversa saiu da paralisia. A partir dali existe um problema concreto, e problema concreto se resolve.

### Fechando o módulo

Indecisão é a maior perda do funil e a menos trabalhada. Ela não se vence com mais convencimento: se vence com **menos risco e mais direção**.'),

-- ==================== MÓDULO 5 — CADÊNCIA E FOLLOW-UP =================
('m5_l1', 'cadencia', 1, 'A venda morre de silêncio', 6, 'commitment_offer',
 'Conte quantos orçamentos você enviou no último mês. Agora conte quantos receberam uma segunda mensagem sua. A diferença entre os dois números é dinheiro parado.',
 'Em serviços técnicos, estima-se que **mais de 70% dos orçamentos nunca recebem uma segunda mensagem**. O profissional visita, mede, monta a proposta, envia — e espera.

Não se perde por preço. Perde-se por silêncio.

### Por que ninguém faz follow-up

Três motivos, e nenhum deles é preguiça.

**Medo de incomodar.** A crença de que insistir afasta. Só que uma mensagem com conteúdo novo não é insistência — é atendimento. O que afasta é a mensagem que só cobra.

**Falta de sistema.** Sem lugar para anotar quem precisa de retorno e quando, o follow-up depende de memória. E memória perde para o dia a dia, sempre.

**Interpretar silêncio como não.** O cliente não respondeu, então "não quis". Quase nunca é isso: ele estava ocupado, esqueceu, ou está esperando alguma coisa que você nem sabe.

### O que o silêncio realmente significa

Quase nada. Ele não é resposta. É a ausência dela.

O cliente que não respondeu não decidiu contra você — ele simplesmente não decidiu. E quem aparece de novo, com algo útil, costuma ser o único que aparece.

### A vantagem é quase indecente

Se a maioria não faz o segundo contato, fazer follow-up organizado já te coloca à frente de quase todo mundo. Não é uma técnica sofisticada: é **constância** onde os outros desistem.

Este módulo é sobre fazer isso sem virar chato — que é a única forma de fazer isso funcionar.'),

('m5_l2', 'cadencia', 2, 'Ângulo novo a cada toque', 6, 'commitment_offer',
 'Escreva três mensagens de retomada para o mesmo orçamento parado, cada uma com um assunto diferente. Você vai perceber que a terceira é a mais difícil — e é a que a maioria nunca manda.',
 'A diferença entre follow-up e perseguição não está na quantidade de mensagens. Está no que cada uma carrega.

**"Oi, conseguiu ver a proposta?"** — três vezes seguidas é perseguição.

Três mensagens com conteúdo diferente é atendimento.

### O que colocar em cada toque

Cada retomada precisa entregar alguma coisa. Algumas fontes que sempre existem:

- **Tirar uma dúvida específica** que costuma aparecer nesse tipo de projeto
- **Uma condição** de pagamento ou escopo que ele ainda não tinha considerado
- **Algo que mudou**: prazo, agenda, uma novidade que se aplica ao caso dele
- **Um caso parecido** que você acabou de entregar
- **Uma pergunta de verdade**: o que faltou para decidir

### A regra de ouro

**Se a mensagem não tem nada além da cobrança, ela ainda não está pronta para ser enviada.**

Isso obriga a pensar antes de mandar — e é justamente esse pensar que separa quem faz follow-up de quem enche o saco.

### Quantos toques

Não existe número mágico, e desconfie de quem promete um. Os números que circulam por aí sobre "o quinto contato" são folclore repetido, sem fonte que se possa checar.

O que se sabe com segurança é mais simples: **quase todo mundo desiste cedo demais**, e uma sequência de três a cinco toques com ângulos diferentes, espaçados em dias e não em horas, cobre a maior parte dos casos sem virar incômodo.

### O detalhe que muda o tom

Escreva como quem está resolvendo, não como quem está esperando. *"Separei uma opção que talvez resolva o valor"* funciona; *"estou no aguardo"* transfere para o cliente uma tarefa que é sua.'),

('m5_l3', 'cadencia', 3, 'Data marcada vence "qualquer coisa me chama"', 5, 'availability',
 'Na próxima conversa que terminar sem fechamento, combine dia e hora do retorno em voz alta. Depois anote. Repare como muda a chance de a conversa continuar.',
 'Toda conversa de venda termina de um jeito. E o jeito mais comum é o pior:

> *"Então tá, qualquer coisa me chama."*

Essa frase parece educada e faz duas coisas ruins. Transfere para o cliente a tarefa de retomar — que é sua. E deixa a venda sem dono, sem data e sem próximo passo.

### O que fazer no lugar

Combinar o retorno em voz alta, com dia:

> *"Vou te ligar quinta às 10h para a gente fechar as dúvidas. Pode ser?"*

Três coisas mudam. Existe um compromisso, ainda que pequeno — e compromisso assumido tem peso. Existe uma data no seu sistema, então não depende de lembrar. E se o cliente disser que quinta não dá, ele te deu uma informação útil de graça.

### Por que isso funciona tão bem

Porque decisão sem data marcada volta a ser adiada — e adiar é sempre a opção mais fácil, já que não exige nada de ninguém.

Marcar não pressiona: dá estrutura. E estrutura é exatamente o que falta para o cliente que quer resolver mas não tem urgência.

### Vale também para o "não agora"

Cliente que disse que vai decidir mais para a frente não é cliente perdido: é cliente **com data**. Registre quando, e apareça antes — com conteúdo, não com cobrança.

Quem chega antes da janela negocia. Quem chega na hora disputa preço com quem já estava lá.

### O básico que quase ninguém faz

Anotar. Sem registro, tudo isso depende de memória, e memória perde para o dia a dia. Não importa se é um sistema ou um caderno — importa que exista.'),

('m5_l4', 'cadencia', 4, 'Responder rápido vale mais que responder bem', 6, 'availability',
 'Meça: quanto tempo, em média, você leva para responder uma mensagem nova? Se não souber, essa é a primeira coisa a descobrir esta semana.',
 'Este é o achado com melhor relação entre esforço e retorno de tudo o que este curso cobre.

Um estudo publicado pela Harvard Business Review analisou **1,25 milhão de contatos comerciais em 2.241 empresas**. O resultado:

- responder dentro de **1 hora** deixa a empresa **7 vezes** mais propensa a qualificar o contato do que responder na hora seguinte;
- e **60 vezes** mais do que responder depois de 24 horas.

### Por que a diferença é tão brutal

Porque a pessoa que acabou de mandar mensagem está pensando no assunto **agora**. Meia hora depois ela está em outra coisa. No dia seguinte, ela já falou com mais três — e quem respondeu primeiro virou a referência de comparação.

Velocidade não é sobre parecer eficiente. É sobre chegar enquanto a decisão ainda está aberta.

### O que "rápido" significa na prática

Não significa ter a resposta completa. Significa **aparecer**.

Uma mensagem curta reconhecendo o contato, com uma pergunta de descoberta, já segura a conversa. O orçamento pode vir depois; o que não pode é o silêncio de um dia.

### Uma ressalva honesta

Os números mais famosos desse tema — aquele "21 vezes mais chance em 5 minutos" — vêm de dados de uma empresa fornecedora, não de estudo independente. A direção está certa e é confirmada pelo estudo da HBR; a precisão dos multiplicadores, não.

Guarde a regra, não a estatística: **a primeira hora vale mais que todo o resto do dia**.

### O que isso exige

Nada de tecnologia. Exige que alguém esteja olhando, e que exista um combinado sobre quem responde o quê. É organização, não ferramenta.'),

('m5_l5', 'cadencia', 5, 'Quando parar', 5, 'retention',
 'Escolha um contato que está há meses sem responder. Escreva a mensagem de encerramento com porta aberta. Mande. Você vai se surpreender com quantos respondem exatamente essa.',
 'Follow-up tem fim. Não saber onde é o fim é o que transforma constância em incômodo — e queima uma relação que poderia render mais adiante.

### O sinal de parar

Não é o número de mensagens. É a **ausência total de reação** em uma sequência com ângulos diferentes. Se você mandou três coisas úteis e diferentes e não veio nada, insistir na mesma linha não vai mudar.

### A mensagem de encerramento

E ela é, curiosamente, a que mais recebe resposta:

> *"Imagino que não seja o momento — e tudo bem. Vou parar de te escrever sobre isso. Se mudar alguma coisa, é só me chamar que retomo de onde paramos."*

Repare no que ela faz. Não cobra. Não culpa. Não é sarcástica — o tom aqui decide tudo. E deixa explícito que a porta continua aberta.

Muita gente responde exatamente essa mensagem, porque ela tira a pressão de responder. E parte das respostas é o motivo real que você não conhecia.

### O "não" é um bom desfecho

Um não dito libera sua agenda e o seu foco. Pior que perder é **não saber que perdeu** e continuar tratando como oportunidade viva um negócio que já morreu — enquanto outro cliente, com chance real, não recebe sua atenção.

### Parar não é apagar

Quem disse não hoje pode ser cliente daqui a seis meses. Registre o motivo e a data, e programe um retorno lá na frente — com um ângulo novo: mudou o preço, mudou a regra, mudou a linha.

Reativação é o contato mais barato que existe: a pessoa já te conhece.

### Fechando o módulo

Constância vence talento, mas constância sem conteúdo vira ruído. A diferença entre as duas está sempre na mesma pergunta: **esta mensagem entrega alguma coisa, ou só cobra?**'),

-- ==================== MÓDULO 6 — PERSUASÃO COM ÉTICA ==================
('m6_l1', 'persuasao', 1, 'Os atalhos da decisão', 6, 'expertise_proof',
 'Lembre da sua última compra acima de mil reais. Qual foi o atalho que pesou: alguém que você confia, prova de que funciona, ou medo de perder a condição?',
 'Robert Cialdini não é vendedor. É pesquisador, e passou anos estudando por que as pessoas dizem sim.

O achado central: ninguém avalia todas as informações antes de cada decisão. **A gente usa atalhos** — regras rápidas que funcionam na maior parte das vezes e economizam energia.

Os principais são: **reciprocidade**, **prova social**, **autoridade**, **compromisso e coerência**, **afinidade**, **unidade** e **escassez**.

### Por que isso importa para quem vende

Porque esses atalhos vão acontecer com ou sem você. O cliente vai olhar quem mais comprou, vai reparar se você parece entender do assunto, vai lembrar se você fez algo por ele antes.

A escolha que você tem não é usar ou não usar. É **usar com verdade ou fabricar**.

### A regra que atravessa este módulo

Cada princípio tem uma versão honesta e uma falsificada:

- prova social real é mostrar quem de fato compra; falsa é inventar depoimento
- autoridade real é registro, tempo de casa, laudo; falsa é diploma de parede
- escassez real é agenda cheia; falsa é promoção que volta na semana seguinte

A versão honesta funciona sempre. A falsificada funciona uma vez — e cobra caro quando é descoberta, porque destrói exatamente o que a sustentava.

### E uma nota que este curso faz questão de dar

Nem todos os princípios têm a mesma força de evidência. Alguns resistiram bem às reavaliações da psicologia; outros ficaram bem menores do que a fama sugere.

As próximas aulas dizem quais são quais. Saber isso é o que separa aplicar técnica de repetir folclore.'),

('m6_l2', 'persuasao', 2, 'Prova social e autoridade', 6, 'expertise_proof',
 'Escreva as três provas mais fortes que você tem hoje: um número, um registro e um cliente que aceitaria conversar. Se faltar alguma, é uma tarefa para este mês.',
 'Destes atalhos, dois são os que mais resistiram às reavaliações: **prova social** e **autoridade**. São os que você deve usar primeiro.

### Prova social

As pessoas olham o que outras parecidas com elas fizeram. Quanto mais parecidas, mais forte.

Por isso *"atendemos mais de 500 empresas"* pesa menos que *"atendo três barbearias aqui no bairro, uma delas na mesma rua"*. Volume impressiona; **semelhança convence**.

Formas que funcionam: um cliente do mesmo ramo que ele pode conversar, um caso parecido com detalhe concreto, um número real de quem já usa.

O que não funciona: depoimento genérico sem nome nem contexto. Todo mundo já entendeu que isso pode ser escrito por qualquer um.

### Autoridade

A pessoa segue quem demonstra competência — e demonstração vale mais que afirmação.

O que demonstra: registro profissional, tempo de mercado, laudo, certificação, e principalmente **corrigir o cliente quando ele está enganado**. Dizer *"o material que você pediu não serve para essa aplicação, o certo é este"* constrói mais autoridade do que qualquer folder.

O que não demonstra: adjetivo. "Somos referência", "qualidade premium", "excelência no atendimento" — palavras que qualquer concorrente também usa não distinguem ninguém.

### O limite

Prova social e autoridade inventadas são o tipo de mentira que sempre aparece. Cliente conversa com cliente; certificação se confere. E o custo não é perder uma venda: é virar a empresa de quem não se pode confiar no que diz.

Se você não tem a prova que o cliente pediu, diga e ofereça a que tem. Isso, em si, já é uma demonstração.'),

('m6_l3', 'persuasao', 3, 'Reciprocidade de verdade', 5, 'reciprocity',
 'O que você pode entregar de valor real antes de vender? Uma análise, um diagnóstico, uma orientação que economiza dinheiro. Escreva o seu — e ofereça esta semana.',
 'Reciprocidade é o impulso de retribuir quem fez algo por você. É um dos motores mais antigos da convivência humana, e funciona em venda como funciona em tudo.

### Onde quase todo mundo erra

Confundindo reciprocidade com brinde.

Caneta, chaveiro e desconto de boas-vindas não geram reciprocidade nenhuma, porque não custaram nada e não resolveram nada. O cliente percebe na hora que é isca.

O que gera é **entregar valor de verdade antes de vender**:

- a análise da conta de luz com o cálculo real
- o diagnóstico do problema, mesmo que a solução não seja com você
- a orientação que evita o cliente gastar errado
- o levantamento técnico que ele não conseguiria fazer sozinho

Repare que todos custam o seu tempo e a sua competência. É por isso que funcionam.

### O paradoxo que vale entender

Quanto **menos** você cobra a retribuição, mais ela vem. Entregar a análise dizendo *"agora que eu fiz isso, vamos fechar?"* anula tudo — vira transação, e transação não gera obrigação nenhuma.

Entregue e siga. A conta se acerta sozinha.

### A ressalva honesta

A reciprocidade é sólida em laboratório e mais irregular fora dele — a força depende muito do que se dá e do contexto. Não conte com ela como técnica de fechamento.

Conte como o que ela é de verdade: **a forma mais rápida de mostrar competência antes de pedir dinheiro.** Mesmo que o cliente não retribua com um pedido, ele retribui com atenção — e atenção já é mais do que a maioria dos concorrentes conseguiu.'),

('m6_l4', 'persuasao', 4, 'Escassez: a mais usada e a mais fraca', 5, 'limits_and_ethics',
 'Procure na sua comunicação alguma urgência que você não consegue provar. Se achar, tire. Ela está te custando mais do que trazendo.',
 'De todos os atalhos, escassez é o mais popular e o que tem a **evidência mais fraca**. Essa combinação deveria acender um alerta.

"Últimas vagas", "só até sexta", "promoção relâmpago" estão em todo lugar justamente porque são fáceis de escrever — e não porque funcionam tanto.

### Por que a versão fabricada custa caro

Porque o cliente confere. A vaga que era a última continua lá na semana seguinte; a promoção que acabava sexta volta na segunda. E quando ele percebe, não perde a confiança só naquela oferta: perde em tudo o que você disser depois.

Você trocou uma venda por uma relação.

### A escassez que funciona é a verdadeira

E ela existe em quase todo negócio:

- agenda que realmente enche em determinada época
- capacidade de produção que tem limite
- condição que muda por uma regra que não é sua — reajuste, mudança de lei, prazo de safra
- material com prazo de reposição longo

Isso não é pressão inventada: é **informação que o cliente precisa para decidir**. E dita sem drama, funciona melhor do que qualquer contagem regressiva.

### O teste de uma linha

**Se você precisou inventar a urgência, é porque ela não existe — e provavelmente o problema é outro.**

Uma venda que só fecha com prazo falso é uma venda em que o valor ainda não ficou claro. Apertar mais não resolve isso; voltar para a descoberta, sim.

### Um efeito colateral que quase ninguém considera

Urgência falsa atrai o cliente errado — o que decide por pressão, negocia até o fim e reclama depois. O cliente que você quer decide por critério, e critério não tem pressa artificial.'),

('m6_l5', 'persuasao', 5, 'O pequeno sim', 6, 'risk_free_entry',
 'Qual é o menor sim que você pode pedir hoje, que não é a compra? Uma visita, uma amostra, uma aula, uma análise. É por ele que a maioria das vendas começa.',
 'As pessoas gostam de ser coerentes com o que já fizeram. Quem deu um passo pequeno numa direção fica mais propenso a dar o próximo naquela mesma direção.

É por isso que a experimental, a amostra, a visita técnica e a análise gratuita funcionam tão bem: não são cortesia, são **o primeiro sim**.

### Como usar bem

Peça o compromisso pequeno que faz sentido para o cliente agora, não o grande que faz sentido para você.

- em vez de "fecha o semestre": *venha na aula experimental quinta às 18h*
- em vez de "aprova o projeto": *me deixa fazer a medição sem compromisso*
- em vez de "faz o pedido de 500 unidades": *leva 50 para testar o giro*

Cada um deles é fácil de aceitar e move a pessoa de "considerando" para "envolvido".

### O detalhe que multiplica

Compromisso **dito em voz alta ou escrito** pesa muito mais que compromisso implícito. Por isso combinar dia e hora vale mais que "aparece qualquer dia" — e por isso confirmar na véspera reduz falta.

### O limite ético, que aqui é bem estreito

Usar o pequeno sim para empurrar alguém a um compromisso que não serve para ele é manipulação, e ela cobra na entrega: cliente que se sentiu levado cancela, reclama e não indica.

A régua: **o pequeno sim precisa ser bom para ele mesmo que o grande nunca aconteça.** A aula experimental tem valor sozinha. A análise da conta tem valor sozinha. Se o primeiro passo só serve para te dar vantagem, é isca — e isca é percebida.

### Fechando o módulo

Nenhum destes atalhos vende sozinho, e nenhum substitui ter algo bom para vender. Eles fazem uma coisa só: **reduzem o atrito de uma decisão que já fazia sentido.** Quando não faz sentido, técnica nenhuma salva — e nem deveria.');

-- ---------------------------------------------------------------------
-- PERGUNTAS
-- ---------------------------------------------------------------------
insert into public.course_questions (lesson_key, ord, question, options, correct, explanation) values

('m4_l1', 1, 'Segundo a pesquisa de 2,5 milhões de conversas, para onde vão 40% a 60% dos negócios perdidos?',
 array['Para o concorrente mais barato',
       'Para a indecisão — o cliente não escolhe ninguém',
       'Para clientes que nunca tiveram orçamento',
       'Para propostas mal apresentadas'],
 1,
 'Ele não escolheu outro fornecedor: não escolheu ninguém. É a maior perda do funil e a que quase não é tratada, porque parece objeção.'),

('m4_l2', 1, 'Como distinguir indecisão de falta de valor?',
 array['Pelo tempo que o cliente demora a responder',
       'Pelo valor do orçamento',
       'Se ele concordou e mesmo assim adiou, é indecisão',
       'Se ele pediu desconto, é indecisão'],
 2,
 'Se ainda não vê o problema, é falta de valor e o caminho é voltar à descoberta. Se viu, concordou e travou, é medo de errar — e o remédio é oposto.'),

('m4_l2', 2, 'Qual pergunta descobre qual dos três medos está travando?',
 array['"O que ainda te deixa em dúvida?"',
       '"Você prefere fechar hoje ou semana que vem?"',
       '"O preço foi o problema?"',
       '"Posso te mandar mais informações?"'],
 0,
 'Ela não cobra decisão e devolve a informação que decide qual remédio usar. E exige aguentar o silêncio depois.'),

('m4_l3', 1, 'Por que oferecer mais opções a um cliente indeciso piora?',
 array['Porque aumenta o tempo da conversa',
       'Porque revela insegurança do vendedor',
       'Porque dilui a margem',
       'Porque cada opção nova aumenta a chance percebida de errar'],
 3,
 'Quem já teme escolher errado não precisa de mais para comparar: o custo de decidir sobe e a pessoa sai com mais material e menos decisão.'),

('m4_l3', 2, 'O que a frase "no seu caso eu faria X, por causa de Y" entrega?',
 array['Que você ouviu, assumiu posição e deu critério',
       'Que você conhece bem o catálogo',
       'Que a decisão é urgente',
       'Que existe uma opção melhor em estoque'],
 0,
 'Cliente travado não quer escolher: quer ser orientado por quem entende. É para isso que procurou um profissional em vez de um catálogo.'),

('m4_l4', 1, 'Qual é a lógica de encolher a decisão?',
 array['Reduzir o preço para caber no orçamento',
       'Fazer com que errar custe pouco, em vez de convencer que não vai dar errado',
       'Adiar o compromisso para o cliente pensar melhor',
       'Dividir a proposta em mais etapas de pagamento'],
 1,
 'Convencer que não vai dar errado é difícil e ninguém acredita. Reduzir o custo do erro é honesto e funciona — e nenhuma das quatro formas mexe no preço.'),

('m4_l4', 2, 'Em que tipo de compra encolher a decisão pesa mais?',
 array['Nas de ticket baixo e recorrentes',
       'Nas que envolvem mais de um decisor',
       'Nas grandes e irreversíveis',
       'Nas feitas por indicação'],
 2,
 'Serviço que se refaz em uma semana não assusta. Reforma, sistema no telhado ou troca de fornecedor que pode parar a produção — aí o medo é o obstáculo principal.'),

('m4_l5', 1, 'O que acontece quando o vendedor repete o argumento para quem hesita?',
 array['O cliente pede mais tempo',
       'Aumenta a chance de perder o negócio em 84% dos casos',
       'O cliente costuma pedir desconto',
       'A conversa volta ao início e recomeça neutra'],
 1,
 '73% dos vendedores voltam ao começo quando o cliente hesita, e em 84% dessas vezes isso piorou o desfecho. Para quem já concordou, mais argumento soa como pressão — e pressão confirma o medo.'),

('m4_l5', 2, 'Qual é o sinal de que a conversa saiu da paralisia?',
 array['O cliente pede uma nova proposta',
       'O cliente pergunta o prazo de entrega',
       'O cliente responde mais rápido',
       'O cliente diz o que está pesando, mesmo que inesperado'],
 3,
 'Enquanto ele só responde "vou ver" e "te falo", você ainda está no modo de convencer. Dito o que trava, existe problema concreto — e problema concreto se resolve.'),

('m5_l1', 1, 'Qual é a principal causa de perda de orçamentos em serviços técnicos?',
 array['O silêncio: mais de 70% nunca recebem uma segunda mensagem',
       'Preço acima do concorrente',
       'Prazo de execução longo',
       'Falta de garantia'],
 0,
 'Não se perde por preço, perde-se por silêncio. E como a maioria não faz o segundo contato, fazer follow-up organizado já coloca você à frente de quase todo mundo.'),

('m5_l1', 2, 'O que o silêncio do cliente significa?',
 array['Que ele fechou com outro',
       'Que o preço ficou alto',
       'Quase nada — ele não decidiu, e ausência de resposta não é resposta',
       'Que ele perdeu o interesse'],
 2,
 'Ele não decidiu contra você: simplesmente não decidiu. Quem aparece de novo, com algo útil, costuma ser o único que aparece.'),

('m5_l2', 1, 'O que separa follow-up de perseguição?',
 array['O intervalo entre as mensagens',
       'O canal usado em cada contato',
       'O tom das mensagens',
       'Cada mensagem entregar algo novo, em vez de só cobrar'],
 3,
 'Três "conseguiu ver a proposta?" é perseguição. Três mensagens com conteúdo diferente é atendimento. Se a mensagem não tem nada além da cobrança, ainda não está pronta.'),

('m5_l2', 2, 'O que a aula diz sobre o número ideal de toques?',
 array['Cinco é o número comprovado',
       'Não existe número mágico; os que circulam são folclore sem fonte',
       'Doze, segundo a pesquisa clássica',
       'Depende exclusivamente do valor do negócio'],
 1,
 'O que se sabe com segurança é que quase todo mundo desiste cedo demais. Três a cinco toques com ângulos diferentes, espaçados em dias, cobrem a maior parte dos casos.'),

('m5_l3', 1, 'Qual é o problema de encerrar com "qualquer coisa me chama"?',
 array['Soa informal demais',
       'Transfere ao cliente a tarefa de retomar e deixa a venda sem data',
       'Dá a impressão de que você está com pressa',
       'Impede um novo contato depois'],
 1,
 'A tarefa de retomar é sua. Sem data, a venda fica sem dono — e adiar é sempre a opção mais fácil, porque não exige nada de ninguém.'),

('m5_l3', 2, 'O cliente diz que vai decidir daqui a três meses. O que fazer?',
 array['Registrar a data e aparecer antes dela, com conteúdo',
       'Considerar perdido e focar em outros',
       'Insistir para antecipar a decisão',
       'Mandar a proposta de novo no mês seguinte'],
 0,
 'Não é cliente perdido: é cliente com data. Quem chega antes da janela negocia; quem chega na hora disputa preço com quem já estava lá.'),

('m5_l4', 1, 'Segundo o estudo da HBR com 1,25 milhão de contatos, responder em 1 hora é quantas vezes melhor que responder depois de 24h?',
 array['3 vezes',
       '7 vezes',
       '21 vezes',
       '60 vezes'],
 3,
 'E 7 vezes melhor que responder na hora seguinte. A pessoa que acabou de mandar mensagem está pensando no assunto agora; no dia seguinte já falou com outros três.'),

('m5_l4', 2, 'O que "responder rápido" significa na prática?',
 array['Ter o orçamento pronto em uma hora',
       'Aparecer — mesmo sem a resposta completa',
       'Ligar em vez de escrever',
       'Responder fora do horário comercial'],
 1,
 'Uma mensagem curta reconhecendo o contato, com uma pergunta de descoberta, já segura a conversa. O orçamento pode vir depois; o silêncio de um dia, não.'),

('m5_l4', 3, 'Por que a aula desconfia do número "21 vezes mais chance em 5 minutos"?',
 array['Porque é antigo demais',
       'Porque vale só para vendas por telefone',
       'Porque vem de dados de uma empresa fornecedora, não de estudo independente',
       'Porque foi contestado por pesquisa posterior'],
 2,
 'A direção está certa e é confirmada pelo estudo da HBR; a precisão dos multiplicadores, não. Guarde a regra, não a estatística.'),

('m5_l5', 1, 'Qual é o sinal de que é hora de parar o follow-up?',
 array['Ausência total de reação a uma sequência com ângulos diferentes',
       'Cinco mensagens sem resposta',
       'O cliente ter pedido para não insistir',
       'Trinta dias sem contato'],
 0,
 'Não é o número de mensagens: é a ausência de reação depois de três coisas úteis e diferentes. Insistir na mesma linha não vai mudar nada.'),

('m5_l5', 2, 'Por que a mensagem de encerramento costuma receber resposta?',
 array['Porque é a mais curta de todas',
       'Porque menciona uma condição especial',
       'Porque é enviada em outro horário',
       'Porque tira a pressão de responder'],
 3,
 'Ela não cobra, não culpa e deixa a porta aberta. Parte das respostas traz o motivo real que você não conhecia.'),

('m5_l5', 3, 'Por que um "não" explícito é um bom desfecho?',
 array['Porque permite pedir indicação',
       'Porque libera agenda e evita tratar como viva uma venda que morreu',
       'Porque encerra o custo de aquisição',
       'Porque melhora a taxa de conversão do relatório'],
 1,
 'Pior que perder é não saber que perdeu — e seguir dando atenção a um negócio morto enquanto outro, com chance real, fica sem.'),

('m6_l1', 1, 'Por que as pessoas usam atalhos para decidir?',
 array['Porque não têm informação suficiente',
       'Porque avaliar tudo em cada decisão é inviável, e os atalhos funcionam na maioria das vezes',
       'Porque confiam demais em vendedores',
       'Porque compram por impulso'],
 1,
 'São regras rápidas que economizam energia. Eles vão acontecer com ou sem você — a escolha do vendedor é usar com verdade ou fabricar.'),

('m6_l1', 2, 'Qual é a diferença entre a versão honesta e a falsificada de cada princípio?',
 array['A honesta funciona sempre; a falsificada funciona uma vez e cobra caro',
       'A honesta é mais lenta',
       'A falsificada é ilegal',
       'A honesta só funciona com cliente antigo'],
 0,
 'Prova social real é quem de fato compra; falsa é depoimento inventado. Quando a fabricação é descoberta, destrói exatamente aquilo que a sustentava.'),

('m6_l2', 1, 'O que torna a prova social mais forte?',
 array['O volume de clientes atendidos',
       'A quantidade de depoimentos',
       'A semelhança entre quem provou e quem decide',
       'O tempo de mercado da empresa'],
 2,
 '"Atendemos 500 empresas" pesa menos que "atendo três barbearias no bairro, uma na mesma rua". Volume impressiona; semelhança convence.'),

('m6_l2', 2, 'O que mais constrói autoridade, segundo a aula?',
 array['Corrigir o cliente quando ele está enganado',
       'Citar prêmios e certificados',
       'Falar com segurança sobre o mercado',
       'Ter site e material bem feitos'],
 0,
 'Dizer "o material que você pediu não serve para essa aplicação" demonstra competência. Adjetivo como "referência" e "excelência" qualquer concorrente também usa.'),

('m6_l3', 1, 'Por que brinde não gera reciprocidade?',
 array['Porque tem custo baixo',
       'Porque não custou nada a você nem resolveu nada para ele',
       'Porque é comum no mercado',
       'Porque o cliente não pediu'],
 1,
 'O que gera é entregar valor de verdade antes de vender — análise, diagnóstico, orientação. Custam seu tempo e sua competência, e é por isso que funcionam.'),

('m6_l3', 2, 'Qual é a ressalva honesta sobre reciprocidade?',
 array['Ela funciona apenas em vendas B2B',
       'Ela é ilegal em alguns setores',
       'Ela exige contrapartida imediata',
       'Ela é sólida em laboratório e mais irregular fora dele'],
 3,
 'Não conte com ela como técnica de fechamento. Conte como a forma mais rápida de mostrar competência antes de pedir dinheiro.'),

('m6_l4', 1, 'O que a evidência diz sobre escassez?',
 array['É o atalho mais popular e o de evidência mais fraca',
       'É o mais eficaz entre todos os princípios',
       'Funciona bem apenas em produtos físicos',
       'Tem a mesma força que autoridade'],
 0,
 'Essa combinação — muito usada, pouco sustentada — deveria acender alerta. Está em todo lugar porque é fácil de escrever, não porque funciona tanto.'),

('m6_l4', 2, 'Qual é o teste de uma linha para urgência?',
 array['Se o cliente reagir, a urgência era real',
       'Se você precisou inventar, ela não existe',
       'Se durar menos de uma semana, é legítima',
       'Se estiver por escrito, pode ser usada'],
 1,
 'Venda que só fecha com prazo falso é venda em que o valor não ficou claro. Apertar mais não resolve; voltar à descoberta, sim.'),

('m6_l4', 3, 'Qual efeito colateral a urgência falsa provoca?',
 array['Aumenta o custo de aquisição',
       'Reduz a margem média',
       'Atrai o cliente que decide por pressão, negocia até o fim e reclama depois',
       'Diminui o volume de indicações qualificadas'],
 2,
 'O cliente que você quer decide por critério — e critério não tem pressa artificial.'),

('m6_l5', 1, 'Por que a aula experimental e a amostra funcionam tão bem?',
 array['Porque reduzem o custo de aquisição',
       'Porque demonstram qualidade do produto',
       'Porque geram reciprocidade imediata',
       'Porque são o primeiro sim, e as pessoas gostam de ser coerentes com o que já fizeram'],
 3,
 'Não são cortesia: movem a pessoa de "considerando" para "envolvido", e o próximo passo na mesma direção fica mais fácil.'),

('m6_l5', 2, 'Qual é a régua ética do pequeno sim?',
 array['Ele precisa ser bom para o cliente mesmo que o grande nunca aconteça',
       'Ele precisa ser gratuito',
       'Ele precisa ter prazo definido',
       'Ele precisa ser oferecido só a clientes qualificados'],
 0,
 'A aula experimental tem valor sozinha; a análise da conta também. Se o primeiro passo só serve para te dar vantagem, é isca — e isca é percebida.');
