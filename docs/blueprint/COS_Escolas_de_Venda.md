# COS — Escolas de Venda

> Levantamento pedido pelo fundador (ago/2026): **quais técnicas de venda nós já
> usamos**, o que a evidência realmente sustenta, e um **parecer honesto** sobre
> se a biblioteca já é excelência ou o que falta.
>
> Serve a dois destinos: decidir o que absorver no motor, e ser a espinha do
> **módulo de curso** de técnicas avançadas.

---

## 1. Inventário — o que a biblioteca já faz hoje

Dado real do banco (ago/2026), não impressão: **134 entradas curadas, 8
segmentos, 12 categorias canônicas.**

Quatro achados, do mais importante para o menor:

**1.1 — Só a `academia` cita autor. Os outros 7 segmentos não citam ninguém.**

A biblioteca da academia (a mais antiga, herdada do Base44) nomeia a escola no
campo `technique`: *"Reduction to the Ridiculous (Tracy)"*, *"Loss Aversion
(Kahneman)"*, *"Reciprocidade (Cialdini)"*, *"Intelligence Gathering (Belfort)"*,
*"Grand Slam Offer (Hormozi)"*, *"Krunch (Jim Thomas)"*, *"Pattern Interrupt
(Robbins)"*.

Os segmentos escritos depois — barbearia, clínica, sob medida, distribuidora,
automação, escola esportiva, indústria — descrevem a técnica **sem nomear a
escola**: *"Entrada por complemento (a fresta, não a substituição)"*, *"Custo
total contra preço unitário"*, *"Antecipar a reposição antes da ruptura"*.

O conteúdo continuou certo; **a rastreabilidade se perdeu**. Não dá para
responder "quanto de SPIN existe na nossa biblioteca?" sem ler as 134 entradas
uma a uma. É por isso que este levantamento precisou ser feito à mão.

**1.2 — 134 entradas, 134 nomes de técnica diferentes.**

Cada entrada inventou o próprio rótulo. Não existe taxonomia: `technique` é texto
livre. E o `CLAUDE.md` diz, na seção de métricas canônicas: *"Toda dimensão de
análise é enum, nunca texto livre."* **Estamos violando nossa própria regra
justamente na dimensão mais valiosa do produto.**

**1.3 — "Aprender o que converte" nunca aprendeu nada.**

As tabelas `interactions` e `decisions` já têm as colunas `technique` e
`outcome`. Hoje no banco: 14 interações, 7 com técnica preenchida (7 valores
distintos), **0 com desfecho registrado**, 0 decisões. Mesmo quando houver
desfecho, cruzar 134 rótulos de texto livre com resultado não produz
aprendizado — produz uma tabela com n=1 em cada linha.

**1.4 — Duas entradas da barbearia estão fora das 12 categorias canônicas.**

`policies` (2 entradas). O validador de Skill exige as 12 exatas **no manifesto**,
mas ninguém valida a **biblioteca**. Passou despercebido desde o `0017`.

### Mapa das escolas já presentes (hoje implícitas)

| Escola | Onde já aparece | Densidade |
|---|---|---|
| **Venda consultiva / SPIN** (Rackham) | Todos os 8 segmentos: "pergunte antes de cotar", "confirme a aplicação", "descubra o volume" | **Alta** |
| **Cialdini** | Reciprocidade (amostra, brinde, indicação), prova social, autoridade técnica | Alta |
| **Cadência / prospecção** (Blount) | Todas as `cadences` dos manifestos + tela de Follow-up | Alta |
| **Carnegie / relacionamento** | Acolhimento, "não ataque a escolha do cliente", preparo da visita | Alta |
| **Voss** | Isolamento da objeção, reformulação, "descubra caro comparado a quê" | Média |
| **Kahneman / aversão à perda** | Barbearia, academia (diluição, risco de perder condição) | Média |
| **Hormozi** | Academia e barbearia (oferta, transparência de preço) | Média (só nos 2 primeiros) |
| **Challenger** (Dixon) | 1 entrada, na academia | **Baixa** |
| **MEDDIC / qualificação de compra** | Parcial: campo `decisor` existe, mas nada sobre orçamento, processo e critério de decisão | **Baixa** |
| **JOLT / indecisão** (Dixon 2022) | **Nenhuma entrada** | **Zero** |
| **Ziglar / Hopkins / fechamento clássico** | Fechamento por alternativa, em quase todos | Média |
| **Aaron Ross / SDR** | Nada — é modelo de operação, não de conversa | Zero (correto) |

---

## 2. As escolas — o mental de cada uma e a força da evidência

O que interessa não é o nome do autor: é **qual problema cada escola resolve** e
**quanto a evidência sustenta**. Onde a evidência é fraca, dizemos.

### Neil Rackham — SPIN ⭐ a base
35 mil visitas de venda observadas em 12 países ao longo de ~12 anos. É a
pesquisa mais séria já feita em vendas.

**O que quase todo mundo resume errado:** o achado não é "faça perguntas". São
dois, e o segundo é o mais útil para nós:

1. Perguntas de **implicação** (o que esse problema te custa) separam os melhores
   vendedores dos medianos.
2. **Técnicas de fechamento agressivo funcionam em venda pequena e atrapalham em
   venda grande.** Quanto maior o ticket, mais fechamento por pressão reduz a
   taxa de sucesso.

**Consequência direta para o COS:** a mesma técnica não serve aos nossos 8
segmentos. Barbearia (ticket R$50, decisão em segundos) e indústria (ticket de
dezenas de milhares, decisão em meses) exigem escolas opostas no fechamento.
Isso é exatamente o que o manifesto deveria declarar — e hoje não declara.

### Robert Cialdini — os 7 princípios ⭐ com ressalvas por princípio
O núcleo resistiu bem à crise de replicação da psicologia social, mas **não em
bloco**:

- **Sólidos:** autoridade e prova social (em contexto específico).
- **Médio:** *door-in-the-face* replicou em 2021, sob condições específicas.
- **Fracos:** *foot-in-the-door* tem efeito real mas pequeno (r ≈ 0,17, uma
  fração do que o folclore sugere); reciprocidade fora do laboratório é menos
  robusta; **escassez fabricada é o princípio mais fraco de todos**.

**Consequência para o COS:** nossa regra de nunca inventar escassez ("urgência
honesta pela vaga", em escola esportiva) não é só ética — é a leitura correta da
evidência. Escassez falsa é a técnica mais popular e a menos sustentada.

### Matthew Dixon — Challenger e, principalmente, JOLT ⭐⭐ a maior lacuna
O **Challenger** (2011) diz que em venda complexa o vendedor que ensina e
desafia supera o que só constrói relacionamento. Base: dados proprietários da
CEB. Crítica legítima: é universalista demais — nem todo cliente quer ser
"educado", e o dado é do fornecedor da metodologia.

O **JOLT Effect** (2022) é mais recente e, para nós, mais importante: análise de
**2,5 milhões de chamadas gravadas**. Achados:

- **40% a 60% dos negócios perdidos não são perdidos para o concorrente — são
  perdidos para a indecisão.**
- Dos que morrem em "não decidi": 44% preferem o status quo, mas **56% queriam
  mudar e travaram por medo de errar.**
- E o erro que quase todo vendedor comete: quando o cliente trava na hora de
  assinar, **73% dos vendedores voltam ao começo** para provar de novo que o
  problema existe. Em **84% dos casos isso aumenta a chance de perder.**

**Isso descreve o cliente que some depois do orçamento** — o buraco que é a nossa
tese de venda inteira. E nós tratamos esse cliente como "objeção" ou "silêncio",
quando a pesquisa diz que é **medo de errar**, e que insistir no argumento piora.
**Não temos uma única entrada sobre isso em 134.**

### Chris Voss — rotulagem, espelhamento, perguntas calibradas ⭐
Experiência de campo (FBI) mais do que estudo controlado; a base acadêmica
correlata é a literatura de *perspective-taking* em negociação, que sustenta a
direção. Vale para objeção e negociação difícil: nomear a emoção ("parece que o
prazo é o que mais te preocupa") baixa a temperatura antes de qualquer argumento.
Já usamos sem creditar.

### Jeb Blount — prospecção e cadência ⭐
Disciplina, constância, pipeline. **É a escola que o nosso produto mais
materializou**: cadências no manifesto, tela de Follow-up, toques com ângulo
diferente. Aqui já somos bons.

Ressalva de honestidade: as estatísticas que circulam ("80% das vendas acontecem
entre o 5º e o 12º contato") são folclore de blog sem fonte rastreável. **A
direção é sólida, os números específicos não são.** O que tem pesquisa de
verdade é a velocidade de resposta (abaixo).

### Dale Carnegie — relacionamento ⭐
Antigo e ainda válido porque descreve gente, não mercado. É a base do nosso
"acolhimento antes de processo" e do "nunca ataque a escolha do cliente".

### Ziglar, Hopkins, Tracy — fechamento clássico
Excelentes para **treinar humano**; perigosos como base de motor, porque a maior
parte do arsenal é fechamento por pressão — que, segundo Rackham, **destrói taxa
de conversão em ticket alto**. Uso recomendado: curso sim, motor com parcimônia
e só em segmento de ticket baixo e decisão rápida.

### Velocidade de resposta — o dado mais acionável de todos
Estudo original (Oldroyd/InsideSales, ~2007): contato em até 5 minutos = 21× mais
chance de qualificar. **Ressalva honesta:** é dado de plataforma de fornecedor,
não ensaio controlado. Mas a validação acadêmica veio depois — HBR 2011,
**1,25 milhão de leads em 2.241 empresas**: responder dentro de 1 hora torna a
empresa 7× mais propensa a qualificar do que esperar mais uma hora, e **60× mais
do que esperar 24 horas**.

Esse é o achado com melhor relação evidência/esforço do documento inteiro, e o
mais fácil de instrumentar: nós já medimos tempo de resposta em mediana e p90.

### Aaron Ross — modelo de operação
Especialização de papéis (SDR/closer). Não é técnica de conversa: é desenho de
time. Relevante para o **Kairós vender a si mesmo**; irrelevante para a barbearia
de bairro com dois barbeiros.

### Belfort e Cardone — a ressalva do fundador está certa
Técnica útil embrulhada em estilo pessoal e pressão. Detalhe: **nossa biblioteca
de academia já cita Belfort uma vez** ("Intelligence Gathering", em `pricing`) —
essa é aceitável (qualificar antes de cotar), mas é sinal de que a curadoria
herdada do Base44 nunca passou por um crivo de escola. Passar.

---

## 3. Perfil, gênero e geração — o parecer que você pediu

Você pediu pesquisa sobre como mulheres, homens e o público mais jovem gostam de
ser tratados. Pesquisei. **O resultado honesto é desconfortável e importante:**

### O que a evidência sustenta mal
A literatura de "estilos de decisão de compra por gênero" existe, mas é fraca:
amostras de conveniência, quase toda em varejo B2C, efeitos médios pequenos e
conclusões que se parecem demais com o senso comum que já se queria confirmar
("mulher pesquisa mais e gosta de comprar, homem quer resolver rápido").
Transformar isso em regra de motor produziria **estereótipo automatizado**: o
sistema trataria uma engenheira de manutenção como se ela quisesse conversa
social e um comprador industrial como se quisesse eficiência — errando os dois na
mesma tacada.

Há ainda o risco prático: um sistema multi-tenant que adapta discurso por gênero
é passivo de constrangimento com cliente e de questionamento legal, para um ganho
marginal e não comprovado.

**Recomendação: não criar dimensão de gênero no COS.** Nem campo, nem regra, nem
biblioteca. Isso não é cautela política — é a leitura correta da força da
evidência.

### O que a evidência sustenta bem (e é mais útil)

**1. Papel na decisão** — quem usa, quem decide, quem paga e quem veta. Isso tem
base sólida (é o núcleo de SPIN e de MEDDIC) e **nós já modelamos**: o campo
`decisor` existe em automação, clínica, indústria; escola esportiva já trata o
responsável como decisor e a criança como usuária. É a versão útil de "perfil" —
e é observável, não presumida.

**2. Geração, via canal — com dado forte e recente.** Gartner (mar/2026): **67%
dos compradores B2B preferem uma experiência sem vendedor** (era 61% em 2025), e
a preferência é **mais forte entre millennials e Gen Z**, que já são maioria dos
comitês de compra. **45% usaram IA** na última compra.

Consequência direta e incômoda para nós: em `industria`, `distribuidora` e
`automacao`, uma parcela grande do comprador **não quer conversar** — quer ficha
técnica, preço de referência e prazo, sozinho, agora. Nossa biblioteca inteira
pressupõe conversa. Não temos uma entrada sequer para "o cliente quer se servir
sozinho" — e a resposta certa não é forçar a conversa, é **entregar o material e
deixar a porta aberta**, ganhando velocidade em vez de atrito.

**3. Adaptação ao comportamento observado, não ao tipo presumido.** Tipologias
(DISC e semelhantes) são ferramenta de **treinamento**, não de motor: a
literatura promocional é abundante e a validação independente é rala. O que
funciona é adaptar ao que a pessoa **fez**: respondeu em 2 minutos ou em 2 dias;
escreveu três linhas ou três palavras; pediu link ou pediu ligação; perguntou
preço primeiro ou especificação primeiro. **Tudo isso nós já temos registrado** —
e não usamos.

### Público × segmento — onde a diferença é real
Onde a adaptação tem base é no **contexto de compra**, e aí a diferença é enorme:

| Contexto | Quem decide | O que muda na conversa |
|---|---|---|
| B2C local, ticket baixo (barbearia) | A própria pessoa, em segundos | Atrito zero, duas opções, fechar na hora. Fechamento clássico funciona |
| B2C família (escola esportiva) | Responsável decide, criança usa | Falar com dois públicos na mesma mensagem: segurança para quem paga, vontade para quem vai |
| B2C saúde (clínica) | A pessoa, com medo | Acolher antes de qualificar; pressão destrói confiança |
| B2C alto ticket (sob medida) | Casal, com orçamento e prazo | Ciclo longo, follow-up é o produto, indecisão é o inimigo |
| B2B revenda (distribuidora, indústria) | Comprador + quem usa + quem paga | Custo total, giro, segunda fonte. Pressão de fechamento reduz conversão |
| B2B técnico/público (automação) | Comitê, engenharia, licitação | Prova técnica, conformidade, defensor interno |

Isso **não** é perfil de pessoa. É perfil de **decisão** — e é exatamente o que
uma Skill deveria declarar.

---

## 4. Parecer honesto: já somos excelência?

**Não. Somos incomuns e bons; não somos excelentes ainda.** E a distância não é
de conteúdo — é de estrutura.

### Onde já estamos acima do mercado
- **Trava anti-invenção.** Não conheço concorrente de PME que se recuse a
  responder por falta de fato. Quase todos preferem alucinar bonito.
- **A técnica é explicada ao vendedor.** O produto ensina enquanto opera — é meio
  caminho do módulo de curso.
- **Vocabulário real por segmento.** "Positivação", "curva ABC", "lote mínimo",
  "pasta fechada" não saem de ChatGPT genérico; saem de pesquisa dirigida.
- **Follow-up como produto.** A maior lacuna do mercado brasileiro virou tela.

### Onde não somos
1. **A escolha da estratégia é por palavra-chave, não por diagnóstico.**
   `lib/match` pontua sobreposição de tokens. Funciona e tem recall alto — mas
   não é inteligência comercial, é busca. O motor de IA melhora isso, e ainda
   assim ninguém decide *qual escola* aplicar.
2. **A técnica é texto livre.** 134 rótulos distintos para 134 entradas. Não dá
   para medir, comparar nem aprender.
3. **Nenhum desfecho registrado até hoje.** A "Commercial Memory" é, por
   enquanto, uma promessa com a tabela vazia — como o próprio `CLAUDE.md` admite.
4. **Indecisão não é tratada.** A causa de 40–60% das perdas não tem uma linha na
   biblioteca.
5. **O comprador que não quer falar não é atendido.** 67% do B2B, e nós
   pressupomos conversa em 100% das entradas.
6. **Validação N=1.** Continua valendo: uma empresa do próprio fundador não prova
   a tese.

**Veredito:** a biblioteca é um ativo real e difícil de copiar. O motor ainda não
é excelência porque **não escolhe, não mede e não aprende** — e essas três coisas
são o mesmo problema, resolvido pela mesma mudança.

---

## 5. O que absorver — proposta em 3 movimentos

Sua ideia do "Motor de Estratégias" está certa. Ela não precisa de metodologia
nova: precisa de **uma dimensão que hoje é texto virar dado**.

### M1 — Escola como taxonomia canônica ✅ **FEITO (ago/2026)**

Entregue com uma mudança de desenho vinda da segunda pesquisa do fundador: a
escola é declarada **por situação**, não só por entrada. `strategy_map` no
manifesto mapeia as 12 categorias → escola, **por segmento** — e a resolução no
motor é `entrada.school ?? strategy_map[categoria]`, com override só na exceção
(16 de 134). Prova de que o mapa diferencia: `commitment_offer` resolve para
`fechamento_classico` na barbearia e `oferta_valor` na indústria.

**Onde mora cada coisa** (a primeira versão errou isto e foi refeita): o padrão
por categoria fica no `strategy_map` do manifesto; o override de uma entrada fica
na **17ª coluna do próprio seed**; a migration só cria estrutura e dicionário.
A tentação era resolver o override com `UPDATE` por texto numa migration — some
na primeira recarga da biblioteca e faz ambiente novo nascer errado. Dos 16
overrides inferidos assim, **5 eram redundantes** (repetiam o mapa do segmento);
sobraram 11 explícitos.

Junto vieram três coisas que o M1 destravou:
- `sales_schools`: as 9 escolas com princípio, quando usar, **quando NÃO usar** e
  força da evidência. O motor recebe o "não usar quando" como regra.
- `library_check.mjs` no CI: valida a **biblioteca** (categoria, escola, fatos,
  strategy_map). Achou de cara o `commitment_offer.best_value` órfão da academia
  — mesmo bug do `reciprocity.gift` do `0008`, invisível porque estava em
  `optional_facts` e a query do banco só olhava `required_facts`.
- **A biblioteca curada passou a chegar ao motor.** Estava no banco desde sempre
  e o Responder só lia `source='tenant'`.

O texto abaixo é o desenho original, mantido como registro.
Um enum fechado no núcleo, gravado em cada entrada da biblioteca:

`consultiva_spin` · `persuasao_cialdini` · `negociacao_voss` · `challenger` ·
`indecisao_jolt` · `cadencia_blount` · `relacionamento_carnegie` ·
`fechamento_classico` · `oferta_valor`

Nove escolas, não trinta. **É dado, não código** — e não fere a Lei 1: "escola de
venda" é vocabulário de *técnica*, que é o produto; não é vocabulário de
*segmento* (aluno, matrícula, corte). O validador passa a exigir `school` válida
em toda entrada — e, de quebra, passa a validar a **categoria da biblioteca**,
que hoje ninguém checa (foi assim que `policies` entrou na barbearia).

Junto, um seed `sales_schools`: uma linha por escola com o princípio, **quando
usar, quando NÃO usar e a força da evidência**. É o "mental dos autores" que você
pediu, em formato que o motor lê e o curso reaproveita.

### M2 — Ligar desfecho a escola (a promessa cumprida)
`interactions.technique` (texto livre) ganha ao lado `school` (enum). Aí
"Aprender o que converte" vira uma pergunta respondível: **"qual escola converte
neste segmento, nesta etapa?"** — pessoas distintas, mediana e p90, como manda a
regra de métricas canônicas.

É aqui que mora a defesa competitiva real. Biblioteca boa qualquer um contrata um
consultor e escreve em seis meses. **Um acervo de qual escola converte, por
segmento, com desfecho medido, ninguém copia sem ter os dados** — e ele cresce
sozinho a cada empresa nova. É o único ativo do COS que fica melhor com escala.

### M3 — As entradas que faltam (conteúdo novo, em ordem de retorno)
1. **Indecisão (JOLT)** — em todos os 8 segmentos. O cliente que quer, mas trava:
   não repetir o argumento (piora em 84% dos casos), e sim **reduzir o risco
   percebido** — recomendação pessoal em vez de mais opções, escopo menor,
   garantia, decisão reversível. É a maior lacuna e a de maior valor.
2. **O comprador que não quer conversar** — nos 3 segmentos B2B. Entregar ficha,
   faixa de preço e prazo sem forçar reunião.
3. **Qualificação de compra (MEDDIC-lite)** — orçamento, processo, critério de
   decisão e defensor interno. Já temos `decisor`; falta o resto.

### M4 — opcional, depois: a matriz que você desenhou
Sua tabela ("cliente quer preço → Cialdini + SPIN") vira **dado**: matriz
`situação × escola` no manifesto, e o motor passa a dizer *"apliquei
descoberta consultiva + prova de autoridade porque o contato perguntou preço
antes de descrever o problema"*. Só faz sentido **depois** de M1 — sem taxonomia,
a matriz não tem em que se apoiar.

### O que NÃO fazer
- **Não criar 13ª categoria.** As 12 são invariante provada; escola é dimensão
  ortogonal, não categoria nova.
- **Não criar dimensão de gênero.** Seção 3.
- **Não copiar texto dos autores.** Princípio é livre; texto é do autor. Nossa
  biblioteca é escrita do zero e assim continua — inclusive no curso.
- **Não trocar a curadoria por prompt.** Correção estrutural, não de prompt.

---

## 6. Para o módulo de curso — a espinha

O mesmo acervo serve de currículo, e o **diferencial do nosso curso** já apareceu
nesta pesquisa: quase todo curso de vendas do mercado é culto ao guru. O nosso
pode ser o único que ensina **com nota de evidência** — dizendo o que é pesquisa
séria (Rackham, JOLT, HBR sobre resposta rápida), o que é sólido só em parte
(Cialdini por princípio) e o que é folclore repetido (os números mágicos de
follow-up, escassez fabricada).

| Aula | Escola | O que o aluno leva |
|---|---|---|
| 1 | Consultiva/SPIN | Pergunta de implicação; por que fechar forte derruba venda grande |
| 2 | Cialdini | Os 7 princípios com a evidência de cada um, e por que escassez falsa é o pior atalho |
| 3 | Carnegie/Voss | Acolher, rotular a emoção, isolar a objeção real |
| 4 | JOLT | O cliente não sumiu: ele travou. Como reduzir risco em vez de insistir |
| 5 | Blount | Cadência, disciplina e o custo real do silêncio |
| 6 | Velocidade | O dado do HBR e como virar rotina |
| 7 | Challenger/B2B | Ensinar o cliente, defensor interno, comitê |
| 8 | Ética e limite | Por que a trava anti-invenção vende mais do que a promessa |

---

## 7. Fontes

- [Huthwaite — a pesquisa por trás do SPIN](https://www.huthwaiteinternational.com/blog/neil-rackham-research-spin)
- [Neil Rackham atualiza o SPIN](https://www.inflexion-point.com/blog/neil-rackham-reveals-the-changing-face-of-selling-and-updates-spin)
- [The JOLT Effect — indecisão do cliente](https://www.jolteffect.com/blog/what-is-the-jolt-effect) · [o que é indecisão](https://www.jolteffect.com/blog/whatiscustomerindecision) · [Challenger: perder para a indecisão](https://challengerinc.com/losing-to-customer-indecision/)
- [Challenger — o debate sobre a metodologia](https://uplandsoftware.com/altify/resources/blog/the-challenger-sale-debate-is-it-missing-the-point/)
- [Cialdini 40 anos depois (Forbes)](https://www.forbes.com/sites/rogerdooley/2024/05/14/robert-cialdinis-principles-of-influence-have-held-up-for-40-years-heres-why/) · [o que sobrevive à crise de replicação](https://atticusli.com/replication-crisis/)
- [Gartner — 67% dos compradores B2B preferem experiência sem vendedor (mar/2026)](https://www.gartner.com/en/newsroom/press-releases/2026-03-09-gartner-sales-survey-finds-67-percent-of-b2b-buyers-prefer-a-rep-free-experience) · [61% em 2025](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-sales-survey-finds-61-percent-of-b2b-buyers-prefer-a-rep-free-buying-experience)
- [Estudos de tempo de resposta: MIT/InsideSales e HBR](https://ainora.lt/blog/lead-response-time-statistics-every-study-2026)
- [Diferenças de gênero em decisão de compra (exemplo da literatura)](https://link.springer.com/article/10.1007/s10796-018-9831-1)
