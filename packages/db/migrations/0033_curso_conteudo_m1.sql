-- =====================================================================
-- COS — MIGRATION 0033 : CURSO — grade completa + Módulo 1 escrito
--
-- Os 9 módulos entram todos (é a grade que o aluno vê, e ver o caminho
-- inteiro sustenta a decisão de começar). Só o Módulo 1 tem lições por
-- enquanto — a tela mostra "em breve" no resto, sem fingir conteúdo.
--
-- ORDEM DOS MÓDULOS: não é a ordem das escolas, é a ordem do DIA do
-- vendedor. Descoberta vem primeiro porque toda conversa começa ali;
-- preço vem em segundo porque é a pergunta que mais chega. O melhor
-- conteúdo vai no começo de propósito: 50% da evasão acontece nas duas
-- primeiras semanas, e quem passa dos primeiros 30% tem 75% de chance de
-- terminar.
--
-- O TEXTO É USER-FACING — com acento, ao contrário dos seeds de
-- biblioteca, que são anotação interna do motor.
-- =====================================================================

delete from public.course_questions where lesson_key like 'm1_%';
delete from public.course_lessons  where module_key = 'descoberta';
delete from public.course_modules;

insert into public.course_modules (key, ord, title, subtitle, school_key) values
('descoberta',    1, 'Descoberta',                'Perguntar vende mais que falar. A base de tudo.',                'consultiva_spin'),
('preco_valor',   2, 'Preço e valor',             'O que fazer quando a primeira pergunta é quanto custa.',          'oferta_valor'),
('objecao',       3, 'Objeção',                   'Descobrir a pedra real antes de tentar tirá-la.',                 'negociacao_voss'),
('indecisao',     4, 'O cliente que travou',      'Ele concordou e não decidiu. É a maior perda, e não é objeção.',  'indecisao_jolt'),
('cadencia',      5, 'Cadência e follow-up',      'A venda que morre de silêncio — e como não deixar.',              'cadencia_blount'),
('persuasao',     6, 'Persuasão com ética',       'Os atalhos da decisão humana, e quais têm evidência de verdade.', 'persuasao_cialdini'),
('relacionamento',7, 'Confiança e limite',        'Acolher sem prometer. O que nunca se diz para ganhar um pedido.', 'relacionamento_carnegie'),
('fechamento',    8, 'Fechamento',                'Conduzir a decisão — e por que pressionar derruba venda grande.', 'fechamento_classico'),
('operacao',      9, 'Na sua operação',           'Transformar o que você aprendeu em rotina que não depende de memória.', null);

-- ---------------------------------------------------------------------
-- MÓDULO 1 — DESCOBERTA
-- `example_category` diz de qual categoria da biblioteca a tela puxa o
-- exemplo do SEGMENTO da empresa. É o que faz a mesma lição falar de corte
-- de cabelo para a barbearia e de gramatura para a indústria.
-- ---------------------------------------------------------------------
insert into public.course_lessons (key, module_key, ord, title, minutes, example_category, practice, body) values

('m1_l1', 'descoberta', 1, 'Quem pergunta mais, vende mais', 6, 'goal_matching',
 'Pegue a última conversa que você teve com um cliente. Conte quantas perguntas você fez antes de falar do que vende. Se foram menos de três, você apresentou — não descobriu.',
 'Existe uma pesquisa que quase ninguém em vendas leu, e ela é a mais séria já feita no assunto. Nos anos 80, Neil Rackham e sua equipe observaram **35 mil visitas de venda reais**, em 12 países, ao longo de mais de uma década. Não perguntaram o que os vendedores achavam que faziam: assistiram ao que eles faziam.

O resultado contrariou o senso comum da época — e ainda contraria o de hoje.

**Os vendedores de melhor desempenho falavam menos e perguntavam mais.**

Não um pouco mais. A diferença estava concentrada em um tipo específico de pergunta, e a gente chega nela na terceira aula. Por enquanto, guarde o essencial: o vendedor mediano trata a conversa como uma **apresentação** — ele sabe o que vende e quer contar. O vendedor de alto desempenho trata como uma **investigação** — ele precisa descobrir o que a pessoa quer resolver antes de dizer qualquer coisa.

### Por que isso é tão difícil na prática

Porque perguntar parece perda de tempo. O cliente pergunta o preço, você sabe o preço, e responder parece a coisa mais eficiente do mundo. Só que responder direto entrega o controle da conversa: a partir dali, você está sendo comparado por um número, sem que ninguém saiba o que aquele número resolve.

E tem um segundo motivo, mais incômodo: perguntar exige aguentar um silêncio. Falar preenche o vazio e alivia a tensão do vendedor — não a do cliente.

### O que muda a partir de hoje

Uma regra simples, que vale para qualquer ramo: **antes de dizer o que você vende, descubra o que a pessoa quer resolver.** Não é gentileza nem enrolação. É o que permite recomendar em vez de listar — e recomendação fecha, lista faz o cliente pensar.

Nas próximas quatro aulas você vai aprender exatamente quais perguntas fazer, em que ordem, e qual delas faz o cliente sentir urgência sozinho.'),

('m1_l2', 'descoberta', 2, 'As quatro perguntas, sem jargão', 7, 'goal_matching',
 'Escolha um cliente que está parado no seu funil. Escreva UMA pergunta de cada tipo para ele. Não precisa mandar ainda — só escrever já muda o que você vai falar.',
 'A pesquisa do Rackham organizou as perguntas em quatro tipos, na ordem em que funcionam. O nome original é uma sigla em inglês; vamos direto ao que importa.

### 1. Situação — onde a pessoa está

São perguntas de contexto: como funciona hoje, o que já usa, há quanto tempo, quem participa da decisão.

**A armadilha:** é o tipo mais fácil de fazer e o mais fácil de exagerar. Vendedor inseguro faz dez perguntas de situação seguidas e transforma a conversa em interrogatório. O cliente sente que está preenchendo formulário — e formulário ninguém gosta de preencher.

**Regra:** faça as poucas que você **não consegue descobrir sozinho**. Se dá para ver no site dele, no cadastro ou na conta que ele mandou, não pergunte.

### 2. Problema — o que incomoda

Aqui a conversa começa de verdade: o que não está funcionando, o que dá retrabalho, o que ele gostaria que fosse diferente.

Sem esta pergunta, não existe venda — existe atendimento. Se você não sabe qual é o problema, qualquer coisa que você ofereça é chute bem-intencionado.

### 3. Impacto — o que esse problema custa

É a pergunta que separa os melhores. E ela tem uma aula inteira só para ela, a próxima.

### 4. Ganho — o que muda se resolver

Aqui você deixa o cliente descrever o benefício com as palavras dele, em vez de você descrevê-lo com as suas. *"Se isso deixasse de acontecer, o que mudaria na sua semana?"*

Quando o cliente responde essa pergunta, ele não está ouvindo um argumento de venda: ele está **construindo** o argumento. E ninguém discute com a própria conclusão.

### A ordem importa

Situação prepara. Problema abre. Impacto cria urgência. Ganho fecha o raciocínio. Pular direto para o ganho — *"imagina como seria bom se..."* — soa como propaganda, porque ainda não existe problema estabelecido para ser resolvido.'),

('m1_l3', 'descoberta', 3, 'A pergunta de impacto', 7, 'objections',
 'Pegue o problema mais comum que seus clientes têm. Escreva três perguntas de impacto diferentes para ele — uma sobre dinheiro, uma sobre tempo, uma sobre consequência para outra pessoa.',
 'Esta é a aula mais importante do módulo.

Quando Rackham comparou os melhores vendedores com os medianos, a diferença não estava em fazer mais perguntas em geral. Estava concentrada em **um tipo**: as perguntas que fazem o cliente perceber o tamanho do próprio problema.

### A diferença, na prática

Um cliente diz: *"às vezes falta produto aqui."*

O vendedor mediano ouve isso como um sinal de compra e parte para a solução: *"a gente entrega em 48 horas, isso não ia acontecer."*

O vendedor de alto desempenho ouve isso como o **começo** da conversa:

> *"E quando falta, o que acontece? O cliente espera ou compra do concorrente?"*
>
> *"Isso aconteceu quantas vezes esse mês?"*
>
> *"Quando ele compra do concorrente uma vez, ele volta na semana seguinte?"*

Perceba: nenhuma dessas frases fala do que ele vende. Todas fazem o cliente **calcular**.

### Por que funciona

Porque a urgência que o vendedor cria é sempre suspeita, e a urgência que o cliente chega sozinho é dele. Quando a pessoa termina de responder essas três perguntas, ela concluiu — com as próprias contas — que o problema custa mais do que ela imaginava. Você não precisou convencer de nada.

### Onde quase todo mundo erra

**Fazer a pergunta de impacto e responder junto.** *"E quando falta produto o senhor perde venda, né?"* — isso não é pergunta, é afirmação com ponto de interrogação. O cliente concorda por educação e não calcula nada.

Pergunte e **fique quieto**. O silêncio depois de uma boa pergunta de impacto é onde a venda acontece.

### Um limite honesto

Pergunta de impacto usada em excesso vira crueldade: ficar cutucando a dor de alguém que já entendeu o problema é manipulação, e o cliente sente. Duas ou três bastam. Quando ele demonstrar que percebeu o tamanho da coisa, **pare e ajude**.'),

('m1_l4', 'descoberta', 4, 'Quando ele abre perguntando o preço', 6, 'pricing',
 'Escreva a sua ponte: a frase que você vai usar da próxima vez que alguém abrir com "quanto custa". Ela precisa caber em duas linhas e terminar com uma pergunta.',
 'A conversa mais comum do seu dia começa errada: a primeira mensagem do cliente é **"quanto custa?"**.

Você tem três saídas, e duas são ruins.

### Saída 1: responder o número seco

Parece transparência, e é o que a maioria faz. O problema é o que acontece depois: o cliente agradece e some. Ele não sumiu por causa do preço — sumiu porque nada foi construído. Ele tem um número e nenhum motivo.

### Saída 2: fugir do preço

*"Depende de vários fatores, precisaria entender melhor..."* — enrolação é percebida na hora e destrói a confiança. Quem foge do preço parece caro **e** parece escorregadio.

### Saída 3: a ponte

Responder alguma coisa verdadeira sobre preço **e** devolver uma pergunta que faça a conversa andar.

> *"Depende do que você precisa — trabalho na faixa de X a Y. Para eu te dizer onde você cai: [pergunta de descoberta]?"*

Três coisas acontecem aí. Você não fugiu (deu uma faixa real). Você não entregou o controle (a conversa continua com você). E você transformou uma pergunta fechada em uma aberta.

### O que colocar na faixa

Só o que for verdade e estiver cadastrado. Faixa inventada para parecer barato é o pior negócio do mundo: você ganha a resposta e perde na hora de fechar, quando o número real aparece.

### Quando responder o número direto está certo

Existe um caso: **ticket baixo e decisão rápida**. Se a pessoa pergunta o preço de um serviço simples, que ela vai decidir em trinta segundos, investigar é atrito puro. Responda, e emende com o próximo passo concreto — um horário, uma data.

A regra que separa os dois casos: **quanto maior a decisão, mais cara é a resposta seca.** Você vai ver por quê no módulo de fechamento.'),

('m1_l5', 'descoberta', 5, 'Ouvir é técnica, não educação', 6, 'reciprocity',
 'Na próxima conversa, depois que o cliente terminar de falar, conte até dois antes de responder. Repare no que ele acrescenta nesse intervalo.',
 'Você pode fazer as perguntas certas e ainda assim perder tudo o que elas trouxeram. Ouvir bem não é boa educação: é uma habilidade com técnica própria, e ela tem três partes.

### 1. O silêncio de dois segundos

Depois que o cliente termina uma frase, espere. Quase sempre ele **completa** — e o que vem no complemento costuma ser mais verdadeiro que a primeira resposta.

A primeira resposta é a versão pronta; a segunda é a real. *"Tá caro."* … *"…quer dizer, não é caro, é que eu não esperava fechar isso esse mês."* São dois problemas completamente diferentes, e o segundo é o que dá para resolver.

### 2. Confirmar antes de responder

Antes de trazer sua solução, devolva o que você entendeu:

> *"Deixa eu ver se entendi: o problema não é o preço em si, é o momento. É isso?"*

Duas coisas acontecem. Se você entendeu errado, descobre agora e não depois de uma proposta inteira construída em cima da premissa errada. E se acertou, o cliente sente que **foi ouvido** — o que baixa a guarda mais que qualquer argumento.

Essa técnica tem nome no mundo da negociação, e você vai vê-la de novo, com mais profundidade, no módulo de objeção.

### 3. Anotar, sempre

Não é sobre memória. É sobre a próxima conversa.

O vendedor que abre a conversa seguinte com *"e aquele problema do galpão, resolveu?"* já venceu metade da concorrência — porque quase ninguém faz isso. O cliente não lembra do que você vende; ele lembra que você lembrou dele.

### Fechando o módulo

Descoberta não é uma etapa que acontece uma vez, no começo. É um jeito de conduzir a conversa inteira: perguntar antes de afirmar, ouvir antes de responder, confirmar antes de propor.

No próximo módulo a gente vai para a pergunta que mais chega no seu WhatsApp — o preço — e para o que fazer quando ela vem antes de tudo.');

-- ---------------------------------------------------------------------
-- PERGUNTAS — 3 a 4 por lição. Não são verificação: são o método.
-- A meta-análise de Hattie & Donoghue (242 estudos) aponta prática de
-- teste e prática distribuída como as duas técnicas mais eficazes que
-- existem. A explicação aparece DEPOIS de responder, porque errar com
-- explicação ensina mais do que acertar sem.
-- ---------------------------------------------------------------------
insert into public.course_questions (lesson_key, ord, question, options, correct, explanation) values

('m1_l1', 1, 'O que a pesquisa de Neil Rackham encontrou ao observar 35 mil visitas de venda?',
 array['Que os melhores vendedores tinham mais tempo de casa',
       'Que os melhores vendedores falavam menos e perguntavam mais',
       'Que os melhores vendedores insistiam mais no fechamento',
       'Que os melhores vendedores conheciam melhor o produto'],
 1,
 'O achado contrariou o senso comum: a diferença não estava em apresentar melhor, estava em investigar. Vendedor mediano trata a conversa como apresentação; o de alto desempenho, como investigação.'),

('m1_l1', 2, 'Por que responder o preço imediatamente costuma custar a venda?',
 array['Porque demonstra que você não tem confiança no produto',
       'Porque o cliente sempre acha caro',
       'Porque o cliente passa a te comparar por um número, sem saber o que ele resolve',
       'Porque preço deve ser sempre negociado pessoalmente'],
 2,
 'Não é sobre esconder preço — é sobre controle da conversa. Sem um problema estabelecido, o número não tem contra o que ser comparado, e o cliente decide pelo único critério que sobrou.'),

('m1_l1', 3, 'Segundo a aula, por que perguntar é difícil na prática?',
 array['Porque o cliente se irrita com perguntas',
       'Porque exige aguentar o silêncio, e falar alivia a tensão do vendedor',
       'Porque expõe que o vendedor não conhece o produto',
       'Porque toma tempo demais da conversa'],
 1,
 'Falar preenche o vazio e acalma quem está vendendo — não quem está comprando. Reconhecer isso é o primeiro passo para mudar.'),

('m1_l2', 1, 'Qual é o erro mais comum com as perguntas de situação?',
 array['Usá-las com clientes que já compram de você',
       'Anotar as respostas durante a conversa',
       'Fazê-las antes das perguntas de problema',
       'Fazer muitas seguidas, transformando a conversa em interrogatório'],
 3,
 'São as mais fáceis de fazer e as mais fáceis de exagerar. A regra: faça só as que você não consegue descobrir sozinho — se está no site, no cadastro ou na conta que ele mandou, não pergunte.'),

('m1_l2', 2, 'Por que a pergunta de ganho é poderosa?',
 array['Porque o cliente constrói o argumento com as próprias palavras',
       'Porque evita falar de preço',
       'Porque permite apresentar mais benefícios de uma vez',
       'Porque encurta a conversa'],
 0,
 'Ninguém discute com a própria conclusão. Quando o cliente descreve o benefício, ele deixa de ouvir um argumento e passa a formulá-lo.'),

('m1_l2', 3, 'Por que não se deve pular direto para a pergunta de ganho?',
 array['Porque o cliente ainda não confia em você',
       'Porque ela só funciona por telefone',
       'Porque é a pergunta mais difícil de responder',
       'Porque sem um problema estabelecido, ela soa como propaganda'],
 3,
 'A ordem tem função: situação prepara, problema abre, impacto cria urgência, ganho fecha o raciocínio. "Imagina como seria bom se..." sem problema estabelecido é anúncio, não descoberta.'),

('m1_l3', 1, 'O que caracteriza uma pergunta de impacto?',
 array['Ela confirma se o cliente tem orçamento',
       'Ela apresenta a solução de forma indireta',
       'Ela faz o cliente calcular o que o problema custa a ele',
       'Ela cria urgência mencionando prazo ou promoção'],
 2,
 'A pergunta de impacto não fala do que você vende. Ela faz o cliente somar as consequências — e a urgência a que ele chega sozinho é a única que ele não desconfia.'),

('m1_l3', 2, 'Um cliente diz "às vezes falta produto aqui". Qual é a melhor resposta?',
 array['"E quando falta, o cliente espera ou compra do concorrente?"',
       '"Posso te mandar nossa tabela para comparar?"',
       '"Todo mundo tem esse problema hoje em dia."',
       '"A gente entrega em 48 horas, isso não aconteceria."'],
 0,
 -- Explicação NUNCA se refere a posição ("a primeira", "as outras três"): a
 -- ordem das alternativas muda, e a explicação passa a mentir sem ninguém
 -- perceber. Esta já estava errada — dizia "a primeira" para uma resposta que
 -- estava na quarta.
 'Responder com prazo de entrega parte para a solução antes de o cliente perceber o tamanho do problema. Perguntar o que acontece quando falta faz ele calcular — e é aí que a urgência nasce.'),

('m1_l3', 3, 'Qual é o erro mais comum ao fazer uma pergunta de impacto?',
 array['Responder junto com ela ("o senhor perde venda, né?")',
       'Fazê-la por escrito em vez de por telefone',
       'Fazer duas perguntas de impacto na mesma conversa',
       'Fazê-la logo no primeiro contato'],
 0,
 'Afirmação com ponto de interrogação não é pergunta: o cliente concorda por educação e não calcula nada. Pergunte e fique quieto — o silêncio depois é onde a venda acontece.'),

('m1_l3', 4, 'Quando parar de fazer perguntas de impacto?',
 array['Depois de exatamente cinco perguntas',
       'Nunca — quanto mais dor, melhor',
       'Quando o cliente perguntar o preço',
       'Quando o cliente demonstrar que percebeu o tamanho do problema'],
 3,
 'Cutucar a dor de quem já entendeu vira manipulação, e o cliente sente. Duas ou três bastam; quando ele percebe, o trabalho passa a ser ajudar.'),

('m1_l4', 1, 'Qual é o problema de fugir da pergunta de preço?',
 array['Você perde a chance de dar desconto',
       'A conversa fica longa demais',
       'O cliente entende que o produto é premium',
       'Você parece caro e escorregadio ao mesmo tempo'],
 3,
 'Enrolação é percebida na hora. Fugir do preço não protege a margem — destrói a confiança, que é o que sustenta a margem.'),

('m1_l4', 2, 'O que é a "ponte" ensinada na aula?',
 array['Adiar o preço até a visita técnica',
       'Dar o preço mais baixo da tabela para não perder o contato',
       'Dar algo verdadeiro sobre preço e devolver uma pergunta de descoberta',
       'Perguntar quanto o cliente pretende gastar'],
 2,
 'A ponte faz três coisas ao mesmo tempo: não foge, não entrega o controle da conversa e transforma uma pergunta fechada em aberta.'),

('m1_l4', 3, 'Em que situação responder o preço direto está certo?',
 array['Ticket baixo e decisão rápida, emendando com o próximo passo',
       'Sempre que o cliente insistir duas vezes',
       'Quando o cliente veio por indicação',
       'Quando o preço é competitivo'],
 0,
 'Investigar uma decisão de trinta segundos é atrito. A regra que separa os casos: quanto maior a decisão, mais cara é a resposta seca.'),

('m1_l5', 1, 'Por que esperar dois segundos depois que o cliente fala?',
 array['Porque dá tempo de pensar na resposta',
       'Porque evita interromper',
       'Porque ele costuma completar, e o complemento é mais verdadeiro',
       'Porque demonstra respeito'],
 2,
 'A resposta que vem na hora é a versão pronta; a que vem depois do silêncio é a real. "Tá caro" vira "na verdade não esperava fechar esse mês" — e são dois problemas diferentes, com soluções diferentes.'),

('m1_l5', 2, 'Para que serve confirmar o que você entendeu antes de responder?',
 array['Para ganhar tempo na negociação',
       'Para corrigir o entendimento antes de construir uma proposta errada',
       'Para demonstrar atenção ao cliente',
       'Para registrar no sistema com precisão'],
 1,
 'Se você entendeu errado, descobre agora e não depois de uma proposta inteira em cima da premissa errada. E se acertou, o cliente sente que foi ouvido — o que baixa a guarda mais que argumento.'),

('m1_l5', 3, 'Por que anotar o que o cliente disse importa tanto?',
 array['Porque ajuda a lembrar o preço combinado',
       'Porque abrir a próxima conversa com o assunto dele vence a concorrência',
       'Porque protege juridicamente em caso de disputa',
       'Porque o gestor precisa acompanhar'],
 1,
 'O cliente não lembra do que você vende; ele lembra que você lembrou dele. E quase ninguém faz isso — por isso é vantagem barata.');
