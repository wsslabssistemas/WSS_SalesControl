-- =====================================================================
-- COS — MIGRATION 0036 : CURSO — Módulos 7, 8 e 9 (fecha as 45 lições)
--
-- 7. Confiança e limite — a única vantagem que o concorrente não copia
--    baixando preço. É também onde entra o princípio que o motor executa
--    sozinho: não se promete o que não se pode cumprir.
-- 8. Fechamento — conduzir a decisão, com o achado do Rackham no centro:
--    pressão aumenta venda pequena e DERRUBA venda grande. Por isso a
--    mesma técnica não serve aos nossos nove segmentos.
-- 9. Na sua operação — o único módulo em que o produto é assunto
--    legítimo: o "como aplicar" no fim de um curso que já entregou valor
--    (COS_Curso.md §8). Sem escola, porque não é escola: é rotina.
--
-- Posição da alternativa correta variada desde a escrita — o carregador
-- recusa acima de 50% na mesma posição.
-- =====================================================================

delete from public.course_questions where lesson_key like 'm7_%' or lesson_key like 'm8_%' or lesson_key like 'm9_%';
delete from public.course_lessons  where module_key in ('relacionamento', 'fechamento', 'operacao');

insert into public.course_lessons (key, module_key, ord, title, minutes, example_category, practice, body) values

-- ==================== MÓDULO 7 — CONFIANÇA E LIMITE ===================
('m7_l1', 'relacionamento', 1, 'Confiança não se pede, se demonstra', 6, 'goal_matching',
 'Na próxima conversa, antes de falar do que você vende, repita para o cliente uma coisa que ele disse — com as palavras dele. Repare no que muda no tom da resposta.',
 'Dale Carnegie escreveu há quase noventa anos e continua valendo por um motivo simples: ele não descreveu um mercado, descreveu gente. E gente não mudou tanto.

O ponto central é incômodo para quem vende: **a confiança precisa existir antes do momento em que você vai precisar dela.** Ninguém constrói confiança no instante de pedir a decisão. Quem tenta, parece exatamente o que está fazendo.

### As três coisas que constroem

**Interesse de verdade.** Perguntar sobre o que ele faz, e principalmente **lembrar na próxima vez**. Quase ninguém faz isso, e é por isso que funciona tão bem.

**Consistência.** A mesma pergunta recebe a mesma resposta hoje e daqui a duas semanas, com você ou com o seu colega. Cliente que ouve dois preços diferentes da mesma empresa para de acreditar nos dois.

**Limite declarado.** Dizer o que você não faz, antes de ser perguntado, é o sinal mais barato de honestidade que existe — e o mais raro.

### Acolher antes de processar

Tem cliente que chega com medo: de dor, de gastar errado, de ser passado para trás. Se a primeira coisa que ele encontra é um questionário, ele fecha.

Acolhimento não é enrolação nem simpatia forçada. É reconhecer o que a pessoa trouxe antes de encaixá-la no seu processo:

> *"Entendi. Isso incomoda mesmo. Deixa eu te fazer duas perguntas para eu entender direito o seu caso."*

Levou quatro segundos e mudou a conversa inteira.

### O que destrói mais rápido

Pressa, script decorado e falar mais do que ouvir. Os três dizem a mesma coisa ao cliente: *você é o próximo da fila*.

Confiança é lenta de construir e instantânea de perder. Este módulo é sobre os dois lados disso.'),

('m7_l2', 'relacionamento', 2, 'Nunca ataque a escolha do cliente', 6, 'objections',
 'Lembre da última vez que um cliente contou uma escolha ruim que fez. Reescreva o que você respondeu, agora começando por reconhecer a lógica que ele teve na época.',
 'Uma hora o cliente vai contar que comprou de outro, que fez com o mais barato, que escolheu o material errado. E vai contar exatamente para você.

O instinto é mostrar que foi um erro. É o pior movimento possível.

### Por que sai caro

Porque criticar a escolha é criticar quem escolheu. A pessoa não ouve *"aquele produto é ruim"*: ela ouve *"você foi enganado"* ou *"você não entende disso"*. E ninguém compra de quem acabou de fazer você se sentir bobo.

Pior: ele passa a defender a decisão antiga em vez de olhar a nova. Você criou um adversário dentro da conversa que não precisava existir.

### O que fazer no lugar

Reconheça a lógica que ele tinha na época — quase sempre existe uma — e só então traga a informação nova, sem adjetivo:

> *"Faz sentido, na época era o que estava disponível. O que costuma aparecer nesse tipo de instalação depois de uns dois anos é isto aqui — e é justamente onde a gente trabalha diferente."*

Repare: nenhum julgamento, um fato concreto, e a porta aberta.

### Quando ele está tecnicamente errado

Aí você corrige — mas corrige **o dado**, não a pessoa. *"Esse modelo aguenta até tal ponto; acima disso ele falha"* é informação. *"Quem te vendeu isso te enganou"* é uma opinião que só cria constrangimento.

Corrigir com fato constrói autoridade, como você viu no módulo de persuasão. Corrigir com julgamento destrói a relação que a autoridade serviria.

### E o concorrente

Vale a mesma regra, por um motivo prático: falar mal do concorrente é falar mal do cliente que o escolheu. Compare escopo, prazo e o que está incluído. Deixe a conclusão para ele — que é onde ela pesa mais.'),

('m7_l3', 'relacionamento', 3, 'A promessa que fecha hoje e custa amanhã', 6, 'limits_and_ethics',
 'Liste as três coisas que você mais promete e que não dependem só de você. Para cada uma, escreva a versão honesta: o que você garante e o que você não controla.',
 'Existe uma frase que fecha vendas e destrói empresas: **"consigo, sim."**

Dita sobre o prazo que depende de terceiro. Sobre o resultado que ninguém controla. Sobre a condição que não é sua para dar.

### Por que todo mundo faz

Porque no instante do fechamento, dizer sim é o caminho mais curto, e o problema só aparece semanas depois. A tentação não é falta de caráter: é a distância entre o alívio de agora e a conta que vem depois.

### A conta que vem depois

Cancelamento, retrabalho, desconto para acalmar, reclamação pública, e a indicação que nunca vai acontecer. Somando tudo, a venda salva pela promessa costuma sair mais cara do que a venda perdida.

Você não ganhou um cliente. Você adiantou uma perda e ainda pagou juros.

### A versão que funciona

Prometa o que você controla e diga em voz alta o que não controla — junto com o que você faz a respeito:

> *"A minha parte leva oito dias. Depois disso entra a aprovação da concessionária, que costuma levar de trinta a sessenta dias e não depende de mim. Eu te dou posição toda sexta, mesmo quando não tiver novidade."*

Isso não perde venda. Perde o cliente que ia cancelar de qualquer jeito — e ganha o que estava justamente procurando alguém que não enrolasse.

### A regra em uma linha

**A mesma informação dita antes é confiança; dita depois é justificativa.**

O cliente que sabia do risco aceita o risco. O que descobre depois se sente enganado, mesmo quando ninguém mentiu.

Sistema nenhum resolve isso sozinho — o nosso se recusa a afirmar preço e prazo que não estejam cadastrados justamente porque a regra é anterior a qualquer ferramenta. Mas quem escreve a mensagem é você.'),

('m7_l4', 'relacionamento', 4, 'Não sei — e por que isso constrói autoridade', 5, 'expertise_proof',
 'Na próxima pergunta que você não souber responder na hora, responda com a frase completa: não sei, descubro e te falo até tal dia e hora. Depois cumpra. É o exercício inteiro.',
 'Quase todo vendedor tem medo de dizer que não sabe. A crença é que admitir desconhecimento derruba a autoridade.

Acontece o contrário — desde que a frase venha inteira.

### A frase completa

*"Não sei"* sozinho é abandono. O que constrói é:

> *"Não sei te responder com precisão agora. Vou confirmar e te falo até amanhã às dez."*

E aí cumprir. O cliente acabou de receber duas informações valiosas: que você não inventa e que você faz o que diz. As duas juntas valem mais do que qualquer resposta chutada — e chute em ficha técnica cobra caro na entrega.

### Dizer não ao serviço que não é seu

Existe o pedido que você faria mal: fora da sua especialidade, do seu prazo, do seu tamanho.

Aceitar por não querer perder a venda é o começo de uma entrega ruim, e entrega ruim custa mais que a margem que ela traz — em tempo, em reputação e no cliente que não volta.

Recusar e indicar quem faz melhor parece perder. Na prática você ganha três coisas: a confiança de quem perguntou, a chance real de ele voltar com o que **é** seu, e a indicação de quem você indicou.

### O cliente errado também existe

O que quer prazo impossível, escopo que não fecha, ou preço que só funciona se você trabalhar de graça. Vender para ele é assinar um problema.

Um não dito com respeito e um motivo — *"para o que você precisa, no prazo que você tem, não sou eu"* — mantém a porta aberta. Um sim forçado a fecha para sempre.

### O resumo do módulo até aqui

Confiança se ganha declarando limite: o que você não sabe, o que você não faz, o que você não controla. É contraintuitivo, e é o que separa fornecedor de vendedor.'),

('m7_l5', 'relacionamento', 5, 'Depois do sim começa o resto', 6, 'retention',
 'Escolha um cliente atendido nas últimas duas semanas. Mande uma mensagem que não venda nada: pergunte como ficou. Anote quantos respondem.',
 'O silêncio mais caro de uma empresa não é o do orçamento parado. É o que vem **depois** do pagamento.

O cliente que fechou está no momento de maior atenção que ele vai ter com você — e é justamente quando quase todo mundo desaparece para atender o próximo.

### O cliente não compara com o combinado

Ele compara com o que imaginou. E o que ele imaginou você não controla — a menos que você diga.

Por isso vale repetir o combinado por escrito depois do sim: o que vai acontecer, em que ordem, em quanto tempo, e o que pode atrasar. Parece burocracia; é a prevenção mais barata de conflito que existe.

### Notícia antes da pergunta

A espera com informação é curta; a espera sem informação é eterna. Um recado curto avisando que está em andamento vale mais que uma explicação longa depois da cobrança.

E quando algo der errado — vai dar — quem avisa antes está resolvendo. Quem avisa depois de ser perguntado está se justificando. **O fato é o mesmo; a leitura é oposta.**

### O problema bem resolvido vende mais que o serviço perfeito

Parece injusto, e é assim mesmo: cliente que teve um problema tratado rápido e sem discussão costuma virar defensor mais fiel do que aquele em que tudo correu liso.

Ninguém indica um fornecedor por ele ter feito o combinado. Indica por ele ter aparecido quando complicou.

### Pedir indicação sem constrangimento

Logo depois de uma entrega boa, e de forma específica. *"Se souber de alguém"* não gera nada. **"Você conhece alguém com o mesmo problema que você tinha?"** gera, porque dá à pessoa uma busca concreta para fazer na cabeça.

### Fechando o módulo

Preço se copia em uma tarde. Prazo se iguala. Confiança é a única coisa que o concorrente não consegue igualar baixando alguma coisa — porque ela leva tempo, e tempo ninguém compra.'),

-- ======================== MÓDULO 8 — FECHAMENTO =======================
('m8_l1', 'fechamento', 1, 'Fechar é conduzir, não empurrar', 6, 'commitment_offer',
 'Classifique o seu produto: a decisão do seu cliente acontece em minutos ou em semanas? A resposta define qual metade deste módulo é a sua.',
 'Voltamos à pesquisa das 35 mil visitas de venda, porque ela tem um segundo achado — e é o que quase todo treinamento de vendas ignora.

Rackham testou as técnicas clássicas de fechamento, aquelas de apostila: pressão, prazo, alternativa forçada. O resultado dividiu o mercado em dois.

**Em venda pequena, fechar forte aumenta a taxa de sucesso. Em venda grande, reduz.**

Não é uma questão de estilo. Quanto maior o valor e mais longa a decisão, **mais a pressão derruba a conversão**.

### Por que a mesma técnica se inverte

Em compra pequena o custo do erro é pequeno. Um empurrãozinho resolve a dúvida, porque errar sai barato e dá para corrigir amanhã.

Em compra grande a pressão faz o oposto: ela **aumenta a sensação de risco**. Se a pessoa está com medo de errar e você aperta, ela lê o aperto como sinal de que tem alguma coisa errada. A saída mais segura passa a ser adiar — e adiar é sempre uma opção disponível.

É o mesmo mecanismo do módulo sobre indecisão, visto do outro lado.

### O que isso significa na prática

Duas conclusões, e nenhuma delas é "não feche":

- Se o seu ticket é baixo e a decisão é rápida, fechar direto é serviço prestado. Investigar demais é atrito.
- Se o seu ticket é alto e a decisão leva semanas, o seu fechamento é outro: reduzir risco e combinar o próximo passo concreto.

### O que fechar realmente é

Não é convencer no último minuto. É **pedir uma decisão clara na hora certa**, depois de ter feito o trabalho que sustenta a decisão.

Fechamento bom quase não parece fechamento. Ele só nomeia o que já ficou combinado durante a conversa.'),

('m8_l2', 'fechamento', 2, 'Os sinais de que ele já decidiu', 5, 'availability',
 'Na próxima conversa, preste atenção ao momento em que o cliente muda de "vocês" para "a gente". É o sinal mais claro que existe — e o mais fácil de perder.',
 'Muita venda é perdida depois do sim. O cliente já tinha decidido, o vendedor não percebeu e continuou vendendo — até reabrir uma dúvida que estava fechada.

Os sinais são conhecidos e quase todos aparecem em forma de pergunta.

### O que olhar

- **Pergunta operacional:** quanto tempo demora, vocês parcelam, atende sábado, precisa de quê da minha parte. Quem pergunta como funciona já está imaginando funcionando.
- **Troca de pronome:** *"quando a gente instalar"*, *"aí eu deixo o espaço livre"*. Ele já se colocou dentro.
- **Chamar outra pessoa:** mostrar para o sócio, para o cônjuge, para o técnico. Não é dúvida, é validação.
- **Pedir detalhe pequeno:** cor, horário, nota fiscal, forma de pagamento. Ninguém discute detalhe de uma coisa que vai recusar.

### O erro que custa a venda

Continuar apresentando. Cada argumento novo depois do sinal de compra abre uma porta que já estava fechada — e alguma delas vai dar em objeção.

Existe um instinto ruim aqui: o de provar que a decisão foi acertada, listando mais vantagens. Para quem já decidiu, isso soa como se você estivesse tentando convencer alguém que ainda duvida. E ele começa a duvidar.

### O que fazer quando o sinal aparece

Pare de apresentar e faça a pergunta do próximo passo. Simples assim.

> *"Então a gente faz o seguinte: eu reservo quinta às nove. Fecha para você?"*

### Uma ressalva honesta

Nem todo sinal é um sim. Tem quem pergunte prazo por curiosidade. Mas **todo sinal é permissão para perguntar** — e perguntar cedo demais custa muito menos que perguntar tarde demais.'),

('m8_l3', 'fechamento', 3, 'Pedir. Simplesmente pedir.', 6, 'commitment_offer',
 'Escreva a sua frase de pedido para o serviço que você mais vende. Uma frase, com uma ação concreta e uma data. Decore. Use na próxima conversa que chegar ao fim.',
 'A causa mais comum de não fechar não é objeção, preço nem concorrente.

**É não pedir.**

O vendedor apresenta bem, responde tudo, o cliente gosta — e a conversa termina com *"qualquer coisa me chama"*. Você já viu essa frase no módulo de cadência. Ela é ruim como follow-up e é pior ainda como fechamento.

### Por que ninguém pede

Por medo do não. Enquanto ninguém pergunta, a venda continua "em andamento", e em andamento é confortável.

Só que a venda que ninguém pediu não fica parada: ela esfria. E o não que você evitou hoje volta em duas semanas como silêncio, que é a mesma perda sem a informação.

### Como se pede

Com uma pergunta que exige uma resposta. A diferença é gritante:

- *"O que você acha?"* aceita "vou ver" e não move nada.
- *"Fecha para você a gente começar na segunda?"* exige sim, não, ou um motivo — e motivo é matéria-prima.

### Fechamento por alternativa, com cuidado

Duas opções concretas em vez de sim ou não: *"prefere quinta às nove ou sexta às três?"*. Funciona bem em decisão rápida e agenda.

Duas ressalvas. A primeira: as opções precisam ser **de verdade** diferentes; alternativa fabricada é percebida na hora e queima a confiança. A segunda: em venda grande, essa técnica é a tal da pressão que derruba conversão. Use onde a decisão é curta.

### Depois de pedir, cale a boca

É a parte mais difícil da aula.

Feito o pedido, silêncio. Quem fala primeiro quase sempre negocia contra si mesmo — emenda um desconto que ninguém pediu, oferece um prazo que ninguém cobrou, ou enfraquece a própria proposta para preencher o vazio.

O cliente está pensando. Deixe ele pensar.'),

('m8_l4', 'fechamento', 4, 'Venda grande fecha por avanço', 6, 'goal_matching',
 'Antes da sua próxima reunião ou visita, escreva qual avanço você vai pedir ao final. Uma coisa concreta, com data. Se não souber qual é, a conversa já começou sem destino.',
 'Em ciclo longo, quase nenhuma conversa termina em sim ou não. Termina em uma de duas coisas — e saber diferenciar muda o seu funil inteiro.

### Continuação: parece progresso, não é

A conversa foi boa, o cliente elogiou, pediu para mandar por e-mail, disse que vai olhar com calma. Nada mudou. Nenhuma data existe, nenhum compromisso foi assumido, nada saiu do lugar.

É o resultado mais comum das visitas — e o mais enganoso, porque **sai da reunião com sensação de vitória**. O vendedor volta satisfeito e o negócio ficou exatamente onde estava.

### Avanço: alguma coisa concreta mudou

Uma ação combinada, com data, que move o negócio adiante:

- visita técnica ou medição marcada no dia
- amostra enviada com a data em que ele vai testar
- conversa marcada com quem realmente decide
- primeiro lote de teste aprovado
- documento que ele ficou de mandar até quinta

Repare que alguns avanços são tarefa **dele**. Isso é proposital: compromisso que exige esforço do cliente é o melhor termômetro de interesse que existe. Quem não faz a parte pequena não ia fazer a grande.

### Como usar isso amanhã

Antes de cada conversa, decida qual avanço você vai pedir no fim. Uma frase, escrita, definida antes.

Sem isso a conversa termina onde o cliente parou de falar — e o cliente não tem obrigação nenhuma de conduzir o processo de venda para você.

### O efeito no seu funil

Se você contar contatos, o funil parece cheio e nada acontece. Se você contar **avanços**, ele fica menor e verdadeiro.

Funil honesto é menor. E funil menor com data em tudo fecha mais do que funil grande cheio de "gostou muito".'),

('m8_l5', 'fechamento', 5, 'Quando o sim depende de outra pessoa', 6, 'ecosystem',
 'Pegue os três negócios mais importantes parados hoje. Para cada um, escreva quem mais precisa dizer sim. Se você não souber, essa é a próxima pergunta a fazer.',
 'Sócio, cônjuge, diretoria, engenharia, comitê. Uma hora aparece a frase: *"vou falar com..."*.

Quase todo vendedor trata isso como desculpa educada. Na maior parte das vezes não é: é o processo real de decisão daquela empresa ou daquela casa, e ele existia antes de você chegar.

### O erro de tratar como objeção

Insistir com quem não decide não acelera nada — só gasta a paciência de quem estava disposto a te ajudar. E colocar a pessoa contra o processo dela é pedir para ela escolher entre você e o chefe. Você não ganha essa.

### Descubra cedo, não no fim

A pergunta certa é simples e cabe no começo da conversa, sem constrangimento:

> *"Além de você, quem mais participa dessa decisão? E como vocês costumam resolver esse tipo de compra?"*

Perguntar isso no primeiro contato é natural. Perguntar depois da proposta pronta soa como desconfiança — e você descobre tarde o que mudaria tudo.

### Dê munição a quem vai te defender

Quem gostou da sua proposta vai apresentá-la numa sala onde você não estará, de memória, com pressa, para alguém que não ouviu nada do que você falou.

Facilite: uma página curta, os números na frente, e a resposta pronta para as duas ou três perguntas que o outro certamente vai fazer — quanto custa por mês, o que acontece se der errado, por que não o mais barato.

Você não está fechando com ele. Está **preparando o defensor**.

### O melhor movimento

Quando der, proponha falar com os dois juntos:

> *"Faz sentido eu explicar direto para ele numa call de quinze minutos, para você não ter que repetir a parte técnica?"*

Costuma ser aceito, porque tira trabalho de quem já está do seu lado.

### Fechando o módulo

Fechar não é vencer o cliente. É fazer a decisão acontecer — dele, com informação, no tempo que ela precisa.'),

-- ====================== MÓDULO 9 — NA SUA OPERAÇÃO ====================
('m9_l1', 'operacao', 1, 'Escreva o que só está na sua cabeça', 6, 'pricing',
 'Liste as dez perguntas que mais chegam e responda por escrito, com número. As que você não conseguir responder são exatamente as que estão sendo improvisadas hoje.',
 'Toda empresa tem um conjunto de fatos que decide as vendas e que nunca foi escrito: a faixa de preço real, o prazo que se cumpre de verdade, a garantia, o pedido mínimo, o que não se faz de jeito nenhum.

Enquanto isso mora na cabeça de uma pessoa, três coisas acontecem.

### 1. Cada um responde uma coisa

Dois vendedores dão prazos diferentes para a mesma pergunta. O cliente conversa com os dois — ou conversa hoje e de novo em quinze dias — e percebe. A partir dali ele desconfia de tudo, inclusive do que estava certo.

### 2. Quem não sabe, inventa

Quase nunca por má fé: por pressa, para não deixar o cliente sem resposta. E a promessa improvisada volta como problema de entrega, exatamente como no módulo anterior.

### 3. A empresa depende de uma pessoa

Se quem sabe está de férias, doente ou saiu, o atendimento cai junto. Conhecimento que não foi escrito não é ativo da empresa: é um risco com nome e sobrenome.

### O que escrever

Comece pelo que o cliente pergunta, não pelo que é bonito num manual:

- faixa de preço por serviço ou linha, com o que está incluído
- prazo real, do pedido à entrega, contando o que depende de terceiro
- garantia: o que cobre, por quanto tempo, o que não cobre
- condições de pagamento e o mínimo que compensa
- o que você **não** faz — a lista mais útil e a mais esquecida

### Data de validade

Preço e prazo vencem. Fato de um ano atrás afirmado com a confiança do dado de ontem é mentir sem nunca ter inventado nada.

Marque quando cada resposta foi revista. Revisão que ninguém agenda ninguém faz — e no dia em que o custo subiu, o dado velho já foi para o cliente.'),

('m9_l2', 'operacao', 2, 'A lista de quem espera resposta', 5, 'availability',
 'Escolha o horário fixo dos seus quinze minutos de retomada. Amanhã, no horário, abra a lista. Fazer isso três dias seguidos já muda o mês.',
 'O follow-up não falha por falta de vontade. Falha por falta de lista.

Ninguém decide abandonar um orçamento. Simplesmente chega segunda-feira, chegam quatro coisas urgentes, e o cliente de quinta some da memória. Memória perde para o dia a dia — sempre, com todo mundo.

### O sistema mínimo

Não importa se é planilha, caderno ou software. Importam três colunas:

- **quem** é a pessoa
- **o que** ficou combinado da última vez
- **quando** você volta a falar com ela

A terceira é a que quase ninguém preenche, e é a única que faz o resto funcionar.

### Quinze minutos, sempre no mesmo horário

Rotina que depende de sobrar tempo não acontece, porque nunca sobra. Escolha um horário fixo — começo da manhã costuma funcionar melhor, antes de o dia decidir por você — e trate como compromisso marcado.

Quinze minutos por dia dão cinco horas por mês de retomada. É mais do que a maioria dos concorrentes faz no ano.

### A regra que segura tudo

**Toda conversa termina com uma data no sistema.** Toda.

Se não tem data, não está na lista. E o que não está na lista não existe: vira aquela sensação incômoda de que tinha alguém para retornar, que aparece sempre no domingo à noite e nunca na segunda de manhã.

### O sinal de que está funcionando

Você para de ser pego de surpresa. Nenhum cliente reaparece dizendo *"mandei mensagem semana passada"*, e nenhum orçamento morre porque ninguém lembrou.

Não é sofisticado. É o básico que quase ninguém faz — e é por isso que fazer basta para ficar à frente.'),

('m9_l3', 'operacao', 3, 'Registre o desfecho, inclusive o não', 6, 'retention',
 'Pegue os cinco últimos negócios que não fecharam. Escreva o motivo de cada um em uma palavra só. Se você não souber, essa é a informação que está faltando na sua empresa.',
 'Quase toda empresa sabe quanto vendeu. Quase nenhuma sabe **por que não vendeu o resto** — e é aí que está a informação que faz o próximo mês ser diferente.

Sem desfecho registrado, o aprendizado vira anedota: a gente lembra do cliente que reclamou do preço e esquece dos oito que sumiram calados. A memória guarda o que foi marcante, não o que foi frequente.

### O que registrar

Três coisas, e nenhuma delas dá trabalho:

- **ganhou ou perdeu**
- **o motivo**, escolhido de uma lista curta
- **a data**

### Por que o motivo tem que ser lista fechada

Porque texto livre não se soma. Se um escreve "achou caro", outro "preço alto" e outro "orçamento acima do concorrente", no fim do mês você tem três casos isolados em vez de um padrão.

Uma lista curta resolve: preço, prazo, escopo, escolheu concorrente, não era o momento, sumiu. Seis palavras que cabem em qualquer negócio e que somam.

### A surpresa que quase sempre aparece

Quem começa a registrar costuma descobrir que perde muito menos por preço do que imaginava. O que aparece no lugar são **silêncio** e **indecisão** — os dois temas dos módulos 4 e 5, e os dois que se resolvem sem baixar um centavo.

Enquanto a explicação é "o mercado está difícil", não há o que corrigir. Quando o número diz que metade sumiu depois do orçamento, a correção é óbvia e barata.

### Registrar o não é o mais valioso

Dá menos prazer e ensina mais. O sim confirma o que você já achava; o não é a única coisa que corrige o que você acha.'),

('m9_l4', 'operacao', 4, 'Os quatro números que valem a pena', 6, 'goal_matching',
 'Calcule hoje só o primeiro número: quantas pessoas diferentes chegaram no mês passado e quantas fecharam. Se der trabalho demais para descobrir, esse já é o primeiro achado.',
 'Medir tudo uma vez não serve para nada. Medir pouco, sempre, muda a operação. Quatro números bastam.

### 1. Conversão, em pessoas

Pessoas diferentes que fecharam, dividido por pessoas diferentes que chegaram no período.

O erro clássico é dividir por atendimentos. Quem voltou quatro vezes antes de decidir vira quatro no denominador e derruba um índice que na verdade estava bom. **Resultado se conta em gente, não em conversa.**

### 2. Tempo até a primeira resposta

O número mais barato de melhorar de todos, e você viu o porquê no módulo de cadência.

Duas medidas, nunca uma: a **mediana** — o caso do meio — e o **pior caso**, o atendimento mais lento entre cada dez. A média sozinha esconde o cliente que esperou dois dias, porque três respostas em cinco minutos apagam ele na conta.

### 3. Quantos orçamentos receberam um segundo contato

De cada dez propostas enviadas, quantas tiveram uma segunda mensagem sua?

É o número que revela o buraco mais comum do funil e o mais rápido de consertar — não depende de contratar ninguém nem de comprar nada.

### 4. Retorno

Quantos clientes voltaram dentro do intervalo esperado do seu negócio. Em alguns ramos isso é recompra; em outros, renovação ou manutenção. Em todos, é o cliente mais barato que existe.

### Como usar

Um número por mês, sempre do mesmo jeito, anotado no mesmo lugar. A comparação com o mês anterior vale mais do que a precisão do cálculo.

E cuidado com a armadilha: número que ninguém olha é trabalho jogado fora. Melhor acompanhar dois de verdade do que ter quatro num relatório que ninguém abre.'),

('m9_l5', 'operacao', 5, 'Os primeiros trinta dias', 6, 'commitment_offer',
 'Escolha UMA das quatro semanas abaixo para começar amanhã. Escreva no papel qual é e cole onde você trabalha. Uma coisa feita por trinta dias vence cinco começadas.',
 'Curso não muda resultado. Rotina muda.

Você acabou de ver quarenta e cinco lições. Se tentar aplicar tudo na segunda-feira, na quarta já voltou ao que fazia antes — é assim com todo mundo, e não é falta de disciplina: é excesso de frente aberta.

Então aqui está o plano mínimo, em quatro semanas, na ordem em que dá mais retorno.

### Semana 1 — velocidade e data

Duas coisas só:

- responder todo contato novo **dentro de uma hora**, mesmo que seja para dizer que vai responder direito mais tarde
- terminar **toda** conversa com uma data combinada em voz alta

São as duas mudanças com maior efeito e menor custo do curso inteiro.

### Semana 2 — os fatos por escrito

Preço, prazo, garantia, o que você não faz. E as três perguntas de descoberta que você vai usar sempre, antes de falar do que vende.

### Semana 3 — a lista

Quinze minutos por dia, no mesmo horário, retomando quem está parado. Cada mensagem com um ângulo novo — nunca só a cobrança.

### Semana 4 — o desfecho

Registrar ganhou ou perdeu e o motivo, de todos. No fim da semana, olhar os números e ver o que apareceu.

### O que esperar

Nada espetacular no primeiro mês. O que muda primeiro é a sensação de controle: some aquela lista invisível de gente que você deveria ter retornado.

O resultado vem depois, e vem de onde você não esperava — dos clientes que teriam sumido em silêncio.

### Fechando o curso

Se ficar uma frase só, que seja esta: **o que separa quem vende bem não é técnica nova. É constância no básico que todo mundo conhece e quase ninguém faz.**

Perguntar antes de falar. Aparecer de novo com algo útil. Não prometer o que não se pode cumprir. Pedir a decisão. Anotar o que aconteceu.

Cinco coisas. Nenhuma delas é segredo. Todas elas são raras.');

-- ---------------------------------------------------------------------
-- PERGUNTAS — 3 por lição. A correta muda de posição de propósito: quem
-- percebe padrão acerta sem ler, e aí não existe prática de recuperação,
-- que é o método do curso.
-- ---------------------------------------------------------------------
insert into public.course_questions (lesson_key, ord, question, options, correct, explanation) values

('m7_l1', 1, 'Quando a confiança precisa ser construída?',
 array['Durante a negociação de preço',
       'No momento de apresentar a proposta',
       'Antes do momento em que você vai precisar dela',
       'Depois da primeira entrega bem feita'],
 2,
 'Ninguém constrói confiança no instante de pedir a decisão — quem tenta parece exatamente o que está fazendo. Ela é anterior, e por isso se constrói em conversa que ainda não vende nada.'),

('m7_l1', 2, 'Por que declarar o que você NÃO faz constrói confiança?',
 array['Porque posiciona a empresa como especialista',
       'Porque é o sinal mais barato de honestidade, e o mais raro',
       'Porque encurta a conversa',
       'Porque evita reclamação futura por contrato'],
 1,
 'Dizer o limite antes de ser perguntado custa uma frase e diz ao cliente que você não vai empurrar o que não serve. Quase ninguém faz — é por isso que funciona.'),

('m7_l1', 3, 'O que acontece quando o cliente com medo encontra um questionário logo de cara?',
 array['Ele fecha, porque foi processado antes de ser acolhido',
       'Ele passa a confiar mais na organização da empresa',
       'Ele responde e a conversa flui normalmente',
       'Ele pede para falar com outra pessoa'],
 0,
 'Acolher não é simpatia forçada: é reconhecer o que a pessoa trouxe antes de encaixá-la no seu processo. Leva quatro segundos e muda a conversa inteira.'),

('m7_l2', 1, 'Por que criticar a escolha anterior do cliente sai caro?',
 array['Porque atrasa a apresentação da proposta',
       'Porque ele ouve que foi enganado, e passa a defender a decisão antiga',
       'Porque expõe o concorrente a uma acusação injusta',
       'Porque a informação técnica costuma estar errada'],
 1,
 'Criticar a escolha é criticar quem escolheu. Você cria um adversário dentro da conversa e ele para de olhar a opção nova para defender a velha.'),

('m7_l2', 2, 'O cliente afirma algo tecnicamente errado. O que fazer?',
 array['Corrigir o dado, não a pessoa',
       'Pedir que ele confirme com o fornecedor anterior',
       'Deixar passar para não criar atrito',
       'Concordar e ajustar a proposta ao entendimento dele'],
 0,
 '"Esse modelo aguenta até tal ponto" é informação e constrói autoridade. "Quem te vendeu isso te enganou" é julgamento e destrói a relação que a autoridade serviria.'),

('m7_l2', 3, 'Por que falar mal do concorrente é arriscado?',
 array['Porque pode gerar processo por concorrência desleal',
       'Porque revela que você acompanha os preços dele',
       'Porque é falar mal do cliente que escolheu aquele concorrente',
       'Porque o cliente costuma repassar a fala'],
 2,
 'Compare escopo, prazo e o que está incluído — e deixe a conclusão para o cliente, que é onde ela pesa mais.'),

('m7_l3', 1, 'Por que a promessa que não se pode cumprir sai mais cara que a venda perdida?',
 array['Porque cancelamento, retrabalho e a indicação que não vem custam mais que a margem',
       'Porque obriga a dar desconto na próxima compra',
       'Porque exige refazer a proposta inteira',
       'Porque o cliente costuma acionar a garantia'],
 0,
 'Você não ganhou um cliente: adiantou uma perda e ainda pagou juros. O alívio é agora e a conta vem semanas depois — é por isso que a tentação é tão forte.'),

('m7_l3', 2, 'Qual é a versão honesta de um prazo que depende de terceiro?',
 array['Dar o prazo do concorrente como referência',
       'Dar o prazo mais longo possível para ter folga',
       'Não citar prazo até ter a confirmação',
       'Dizer o que você controla, o que não controla e como vai comunicar'],
 3,
 'Isso não perde venda: perde o cliente que ia cancelar de qualquer jeito, e ganha o que estava procurando alguém que não enrolasse.'),

('m7_l3', 3, 'Qual é a regra sobre o momento de dar uma informação difícil?',
 array['Só depois do fechamento, para não atrapalhar a decisão',
       'Sempre por escrito, nunca em conversa',
       'A mesma informação dita antes é confiança; dita depois é justificativa',
       'Apenas se o cliente perguntar diretamente'],
 2,
 'O cliente que sabia do risco aceita o risco. O que descobre depois se sente enganado, mesmo quando ninguém mentiu.'),

('m7_l4', 1, 'Qual é a forma correta de dizer que não sabe?',
 array['Repassar a pergunta para outra pessoa da equipe',
       '"Não sei" — e mudar de assunto',
       'Dar uma estimativa aproximada para não travar a conversa',
       'Não sei, vou confirmar e te respondo até tal dia e hora — e cumprir'],
 3,
 '"Não sei" sozinho é abandono. Com prazo e cumprimento, o cliente recebe duas informações valiosas: que você não inventa e que faz o que diz.'),

('m7_l4', 2, 'Por que recusar um serviço que não é sua especialidade costuma compensar?',
 array['Porque o cliente aceita pagar mais depois',
       'Porque entrega ruim custa mais que a margem, e a recusa gera confiança e indicação',
       'Porque evita responsabilidade legal',
       'Porque libera agenda para clientes maiores'],
 1,
 'Recusar e indicar quem faz melhor parece perder. Na prática ganha três coisas: a confiança de quem perguntou, a chance de ele voltar com o que é seu, e a indicação de quem você indicou.'),

('m7_l4', 3, 'O que o módulo diz sobre o cliente que quer prazo impossível e preço inviável?',
 array['Aceitar uma vez para criar relacionamento',
       'Aceitar e ajustar o escopo silenciosamente',
       'Repassar para um parceiro sem avisar',
       'Um não com respeito e motivo mantém a porta aberta; um sim forçado a fecha'],
 3,
 'Vender para ele é assinar um problema. "Para o que você precisa, no prazo que você tem, não sou eu" preserva a relação para a próxima.'),

('m7_l5', 1, 'Com o que o cliente compara a entrega que recebeu?',
 array['Com o que a concorrência costuma entregar',
       'Com a entrega anterior do mesmo fornecedor',
       'Com o que ele imaginou, e não com o que foi combinado',
       'Com o preço que pagou'],
 2,
 'Por isso vale repetir o combinado por escrito depois do sim: o que vai acontecer, em que ordem, em quanto tempo e o que pode atrasar. É a prevenção de conflito mais barata que existe.'),

('m7_l5', 2, 'Qual é a diferença entre avisar antes e avisar depois de um problema?',
 array['Nenhuma, desde que o problema seja resolvido',
       'Quem avisa antes está resolvendo; quem avisa depois está se justificando',
       'Avisar depois soa mais profissional, porque já traz a solução',
       'Avisar antes gera ansiedade desnecessária no cliente'],
 1,
 'O fato é o mesmo; a leitura é oposta. E a espera com informação é curta, enquanto a espera sem informação é eterna.'),

('m7_l5', 3, 'Qual pedido de indicação funciona melhor?',
 array['Você conhece alguém com o mesmo problema que você tinha?',
       'Deixa uma avaliação para nós, por favor',
       'Se souber de alguém, indica a gente',
       'Compartilha nosso contato nos seus grupos'],
 0,
 'A pergunta específica dá à pessoa uma busca concreta para fazer na cabeça. "Se souber de alguém" não gera nada porque não pede nada.'),

('m8_l1', 1, 'O que a pesquisa do Rackham encontrou sobre técnicas de fechamento agressivo?',
 array['Funcionam melhor com clientes recorrentes',
       'Funcionam igual em qualquer ticket, muda só o tom',
       'Aumentam a venda pequena e reduzem a venda grande',
       'Só funcionam quando há prazo real de promoção'],
 2,
 'Não é questão de estilo: quanto maior o valor e mais longa a decisão, mais a pressão derruba a conversão. É por isso que a mesma técnica não serve a todos os ramos.'),

('m8_l1', 2, 'Por que a pressão funciona ao contrário em compra grande?',
 array['Porque o cliente tem mais opções para comparar',
       'Porque ela aumenta a sensação de risco, e adiar vira a saída segura',
       'Porque envolve mais gente na decisão',
       'Porque o prazo de entrega é maior'],
 1,
 'Se a pessoa já teme errar e você aperta, ela lê o aperto como sinal de que tem algo errado. É o mesmo mecanismo da indecisão, visto do outro lado.'),

('m8_l1', 3, 'O que fechar realmente significa?',
 array['Convencer no último minuto quem ainda tem dúvida',
       'Criar um motivo para decidir hoje',
       'Apresentar a melhor condição possível no fim da conversa',
       'Pedir uma decisão clara na hora certa, depois do trabalho que a sustenta'],
 3,
 'Fechamento bom quase não parece fechamento: ele só nomeia o que já ficou combinado durante a conversa.'),

('m8_l2', 1, 'Qual destes é um sinal claro de que o cliente já decidiu?',
 array['Ele muda o pronome: "quando a gente instalar"',
       'Ele pergunta se existe desconto',
       'Ele elogia a apresentação',
       'Ele pede a proposta por escrito'],
 0,
 'Pergunta operacional, troca de pronome, chamar outra pessoa para ver e pedir detalhe pequeno — ninguém discute detalhe de uma coisa que vai recusar.'),

('m8_l2', 2, 'Qual é o erro que custa a venda depois do sinal de compra?',
 array['Perguntar sobre o prazo de decisão',
       'Continuar apresentando e reabrir dúvidas já fechadas',
       'Encaminhar a proposta por escrito',
       'Confirmar a forma de pagamento'],
 1,
 'Cada argumento novo depois do sinal abre uma porta que estava fechada. Para quem já decidiu, insistir soa como se você duvidasse — e ele começa a duvidar junto.'),

('m8_l2', 3, 'Nem todo sinal de compra é um sim. O que a aula conclui disso?',
 array['Que é melhor esperar o cliente pedir para fechar',
       'Que o sinal só vale quando vem acompanhado de pergunta sobre preço',
       'Que convém confirmar o interesse antes de qualquer proposta de próximo passo',
       'Que todo sinal é permissão para perguntar, e perguntar cedo custa menos que tarde'],
 3,
 'Tem quem pergunte prazo por curiosidade. Mas o custo de perguntar cedo demais é uma resposta negativa; o de perguntar tarde demais é a venda.'),

('m8_l3', 1, 'Qual é a causa mais comum de não fechar?',
 array['Preço acima do concorrente',
       'Falta de argumentos técnicos',
       'Concorrência mais agressiva',
       'Não pedir a decisão'],
 3,
 'A venda que ninguém pediu não fica parada: ela esfria. O não que você evitou hoje volta em duas semanas como silêncio — a mesma perda, sem a informação.'),

('m8_l3', 2, 'Qual pergunta de fechamento exige uma resposta de verdade?',
 array['"Fecha para você a gente começar na segunda?"',
       '"O que você acha?"',
       '"Faz sentido para você?"',
       '"Quer pensar com calma?"'],
 0,
 'As outras aceitam "vou ver" e não movem nada. A primeira exige sim, não ou um motivo — e motivo é matéria-prima.'),

('m8_l3', 3, 'O que fazer depois de pedir a decisão?',
 array['Reforçar o principal benefício',
       'Oferecer uma condição melhor para ajudar',
       'Ficar em silêncio e deixar o cliente pensar',
       'Perguntar se ficou alguma dúvida'],
 2,
 'Quem fala primeiro quase sempre negocia contra si mesmo: emenda um desconto que ninguém pediu ou enfraquece a própria proposta para preencher o vazio.'),

('m8_l4', 1, 'O cliente elogia a proposta e pede para você mandar por e-mail. O que aconteceu?',
 array['Um avanço, porque ele demonstrou interesse',
       'Uma continuação: nada mudou, nenhuma data existe',
       'Um sinal de compra',
       'Uma objeção disfarçada'],
 1,
 'É o resultado mais comum das visitas e o mais enganoso, porque sai da reunião com sensação de vitória — e o negócio ficou exatamente onde estava.'),

('m8_l4', 2, 'Por que um avanço que exige tarefa do cliente vale mais?',
 array['Porque economiza o seu tempo',
       'Porque divide a responsabilidade do resultado',
       'Porque compromisso que exige esforço dele é o melhor termômetro de interesse',
       'Porque acelera a aprovação interna'],
 2,
 'Quem não faz a parte pequena não ia fazer a grande. É informação de graça sobre a chance real do negócio.'),

('m8_l4', 3, 'O que muda quando você conta avanços em vez de contatos?',
 array['O funil fica maior e mais previsível',
       'O tempo médio de fechamento aumenta',
       'A taxa de resposta melhora',
       'O funil fica menor e verdadeiro'],
 3,
 'Funil honesto é menor. E funil menor com data em tudo fecha mais do que funil grande cheio de "gostou muito".'),

('m8_l5', 1, 'O cliente diz que precisa falar com o sócio. Como tratar?',
 array['Como o processo real de decisão, que existia antes de você chegar',
       'Como objeção educada, insistindo com quem está na frente',
       'Como sinal de que o valor não ficou claro',
       'Como fim da negociação, aguardando o retorno'],
 0,
 'Insistir com quem não decide só gasta a paciência de quem estava disposto a ajudar — e colocar a pessoa contra o processo dela é pedir para ela escolher entre você e o chefe.'),

('m8_l5', 2, 'Quando perguntar quem mais participa da decisão?',
 array['Depois de apresentar a proposta',
       'No começo da conversa, junto com as perguntas de contexto',
       'Somente se o cliente mencionar outra pessoa',
       'Na hora de pedir o fechamento'],
 1,
 'No primeiro contato é natural. Depois da proposta pronta soa como desconfiança — e você descobre tarde o que mudaria tudo.'),

('m8_l5', 3, 'Por que preparar uma página curta para quem vai defender sua proposta internamente?',
 array['Para formalizar a negociação',
       'Para deixar registro do que foi combinado',
       'Porque ela será apresentada de memória, com pressa, para quem não ouviu nada',
       'Para acelerar a emissão da nota fiscal'],
 2,
 'Você não está fechando com ele: está preparando o defensor. Números na frente e a resposta pronta para as perguntas que o outro certamente vai fazer.'),

('m9_l1', 1, 'O que acontece quando os fatos da empresa só existem na cabeça de uma pessoa?',
 array['O atendimento fica mais personalizado',
       'Cada um responde uma coisa, quem não sabe inventa, e a empresa depende de uma pessoa',
       'A informação fica mais atualizada, porque não depende de revisão',
       'Somente o treinamento de novos vendedores é afetado'],
 1,
 'Conhecimento que não foi escrito não é ativo da empresa: é um risco com nome e sobrenome.'),

('m9_l1', 2, 'Qual lista é a mais útil e a mais esquecida?',
 array['O que você NÃO faz',
       'Os clientes atendidos por ramo',
       'Os diferenciais em relação ao concorrente',
       'As formas de pagamento aceitas'],
 0,
 'Declarar o limite antes de ser perguntado é o sinal mais barato de honestidade — e evita a venda que ia virar entrega ruim.'),

('m9_l1', 3, 'Por que marcar quando cada fato foi revisado?',
 array['Para poder desfazer alterações erradas',
       'Porque dado velho afirmado com confiança de dado novo é mentir sem inventar',
       'Para cumprir exigência contábil',
       'Para saber quem escreveu cada informação'],
 1,
 'Preço e prazo vencem. Revisão que ninguém agenda ninguém faz — e no dia em que o custo subiu, o dado velho já foi para o cliente.'),

('m9_l2', 1, 'Por que o follow-up falha na prática?',
 array['Porque o vendedor não tem autonomia para negociar',
       'Por falta de argumento novo para usar',
       'Por falta de lista: memória perde para o dia a dia',
       'Porque o cliente se incomoda com a insistência'],
 2,
 'Ninguém decide abandonar um orçamento. Chega segunda, chegam quatro urgências, e o cliente de quinta some da memória.'),

('m9_l2', 2, 'Qual das três colunas quase ninguém preenche?',
 array['Quem é a pessoa',
       'Quando você volta a falar com ela',
       'Qual o valor do orçamento',
       'O que ficou combinado'],
 1,
 'É a única que faz o resto funcionar. Sem data, não está na lista — e o que não está na lista vira aquela sensação incômoda de domingo à noite.'),

('m9_l2', 3, 'Por que a retomada precisa de horário fixo?',
 array['Porque facilita a divisão de tarefas entre a equipe',
       'Porque permite medir a produtividade do vendedor',
       'Porque o cliente responde melhor sempre no mesmo horário',
       'Porque rotina que depende de sobrar tempo não acontece, já que nunca sobra'],
 3,
 'Quinze minutos por dia dão cinco horas por mês de retomada — mais do que a maioria dos concorrentes faz no ano. Mas só se for compromisso marcado, não sobra de agenda.'),

('m9_l3', 1, 'Por que o motivo da perda precisa vir de uma lista fechada?',
 array['Porque texto livre não se soma: viram casos isolados em vez de padrão',
       'Para facilitar a auditoria dos registros',
       'Para o cliente não ver o texto escrito',
       'Para proteger o vendedor de cobrança injusta'],
 0,
 '"Achou caro", "preço alto" e "acima do concorrente" são a mesma coisa escrita de três jeitos. Seis palavras fechadas somam; texto livre, não.'),

('m9_l3', 2, 'O que costuma aparecer quando uma empresa começa a registrar o motivo das perdas?',
 array['Que perde muito menos por preço do que imaginava',
       'Que o concorrente é sempre o mesmo',
       'Que os melhores clientes vêm de indicação',
       'Que o problema está na qualidade da entrega'],
 0,
 'No lugar do preço aparecem silêncio e indecisão — os dois temas dos módulos 4 e 5, e os dois que se resolvem sem baixar um centavo.'),

('m9_l3', 3, 'Por que registrar o não é mais valioso que registrar o sim?',
 array['Porque é exigido para o cálculo de comissão',
       'Porque o sim já está no faturamento',
       'Porque o sim confirma o que você já achava; o não corrige',
       'Porque permite reabordar o cliente depois'],
 2,
 'Dá menos prazer e ensina mais. Enquanto a explicação for "o mercado está difícil", não há o que corrigir.'),

('m9_l4', 1, 'Como se calcula conversão corretamente?',
 array['Faturamento dividido pelo número de propostas',
       'Fechamentos divididos por atendimentos do período',
       'Pessoas distintas que fecharam divididas por pessoas distintas que chegaram',
       'Fechamentos divididos por orçamentos enviados'],
 2,
 'Quem voltou quatro vezes antes de decidir vira quatro no denominador e derruba um índice que estava bom. Resultado se conta em gente, não em conversa.'),

('m9_l4', 2, 'Por que não usar só a média no tempo de resposta?',
 array['Porque não permite comparação entre vendedores',
       'Porque ela varia demais entre os meses',
       'Porque a média é difícil de calcular sem sistema',
       'Porque ela esconde o cliente que esperou dois dias'],
 3,
 'Três respostas em cinco minutos apagam da conta o atendimento que demorou. Por isso mediana e pior caso, nunca só a média.'),

('m9_l4', 3, 'Qual número revela o buraco mais comum do funil e é o mais rápido de consertar?',
 array['A taxa de retorno dos clientes antigos',
       'O ticket médio por vendedor',
       'A proporção de orçamentos que receberam um segundo contato',
       'O tempo médio de fechamento'],
 2,
 'Não depende de contratar ninguém nem de comprar nada — depende de existir uma lista e quinze minutos por dia.'),

('m9_l5', 1, 'Por que o plano de trinta dias começa por velocidade e data combinada?',
 array['Porque preparam o terreno para o registro de desfecho',
       'Porque são as duas mudanças de maior efeito e menor custo do curso',
       'Porque são as mais fáceis de medir',
       'Porque não exigem conversa com o cliente'],
 1,
 'Responder dentro de uma hora e terminar toda conversa com data combinada não custam nada e mexem no que mais pesa: o silêncio.'),

('m9_l5', 2, 'Qual é a orientação sobre quantas mudanças começar de uma vez?',
 array['Uma, feita por trinta dias, em vez de cinco começadas',
       'Todas, aproveitando a motivação do fim do curso',
       'Depende do tamanho da equipe',
       'Duas por semana, para acelerar o resultado'],
 0,
 'Tentar tudo na segunda-feira leva de volta ao antigo na quarta. Não é falta de disciplina: é excesso de frente aberta.'),

('m9_l5', 3, 'Qual é a frase que fecha o curso?',
 array['Vender é ajudar alguém a decidir',
       'O cliente decide por emoção e justifica por razão',
       'Quem fala menos e pergunta mais vende mais',
       'O que separa quem vende bem não é técnica nova: é constância no básico'],
 3,
 'Perguntar antes de falar, aparecer de novo com algo útil, não prometer o que não se pode cumprir, pedir a decisão, anotar o que aconteceu. Cinco coisas, nenhuma secreta, todas raras.');
