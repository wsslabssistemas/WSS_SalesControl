# COS — Segmentos e Jogadas

> Este documento é **curadoria** — parte do ativo, não do código. Lista os
> módulos-alvo e as jogadas proativas de cada um. Cresce com o negócio.
> A escolha de quais entram e em que ordem é do fundador; a engenharia só
> garante que cada módulo novo entre sem código.

## Como ler

- **Módulo** = um tipo de negócio, instalado como dado (manifesto + biblioteca).
- **Onda** = ordem de ataque, por proximidade ao padrão já validado (B2C local).
- **Jogada** = uma ação proativa concreta que aumenta a lucratividade do módulo.
  Cada jogada vira dado: um tipo de **sinal** + uma **oportunidade** + uma **cadência**.

## Fronteira (Journal, Aprendizado 004)

B2C local primeiro — ticket baixo, ciclo de dias, um decisor, WhatsApp, recompra.
É onde a tese está provada e onde o mesmo motor serve tudo trocando só o módulo.
O B2B de ciclo longo (meses, vários decisores, proposta técnica) é **outra engine**:
decisão futura consciente, não v1. Mirar os dois de uma vez produz núcleo genérico.

---

## Ondas de módulos

### Onda 1 — cabem hoje (mesma mecânica da Be Fitness)

academia / estúdio · barbearia / salão · estética · odontologia / consultório ·
fisioterapia · escola de idiomas / curso livre · autoescola ·
petshop / veterinária · estúdio de tatuagem · personal / nutricionista autônomo ·
escolinhas (natação, luta, música, dança)

### Onda 2 — cabem com adaptação (ciclo maior, ainda um decisor)

imobiliária de locação · corretor de seguros · agência de turismo ·
buffet e casa de festas infantil

### Onda 3 — outra engine (decisão futura, ver Fronteira)

automação industrial · SaaS · licitações · integradores

---

## Jogadas proativas

Template de cada jogada: **dado capturado → sinal → oportunidade (com motivo) → cadência.**

### Casa de festas infantil — recorrência anual

- **Captura na reserva:** data do evento, aniversariante, idade, contato, ticket.
- **Sinal recorrente:** ~N dias antes da mesma época no ano seguinte.
- **Oportunidade:** "reservar de novo — mesma época do ano passado". Motivo obrigatório.
- **Variante de baixa procura:** se a data provável cai em dia fraco (fato do DNA),
  sugerir esse dia com condição melhor — enche a agenda ociosa.
- **Limite:** só para quem já contratou/falou. Não é lista fria (ver Regras).

### (novas jogadas entram aqui)

- Dado capturado:
- Sinal:
- Oportunidade + motivo:
- Cadência:

---

## Regras de proatividade (cross-cutting, valem para todo módulo)

Instinto do fundador, correto e já modelado: **pacing configurável** — quantidade
e intervalo entre envios — com um **modo mais agressivo opcional por tenant**.
As peças existem: `contact_touch_log`, `suppression_list`, janela mínima, teto mensal.

**Não-negociáveis — protegem o número do cliente pagante:**

1. Modo automático **só por API oficial da Meta**. Pacing não substitui isso:
   provedor não-oficial bane o número mesmo devagar. (Journal, Decisão 003)
2. "Agressivo" é configurável **dentro das regras de qualidade da Meta**. Excesso
   derruba o *quality rating* e bane até na API oficial. Não é botão de "arriscar tudo":
   é um teto que o cliente escolhe dentro de um limite que ele não pode furar.
3. **Opt-out e supressão** são consultados antes de todo envio. (LGPD)
4. **Capacidade do vendedor** é respeitada. Lista que ignora capacidade é lista
   ignorada — a morte silenciosa do recurso. (Journal, Aprendizado 013)

---

## Timing e memória

Todo cadastro e toda ação — além do histórico da conversa — alimentam o cálculo do
**próximo contato: quando e sobre o quê**. O sistema agenda a próxima janela como
lembrete/oportunidade. Base no modelo de dados: `signals` + `opportunities` +
`contact_touch_log` + `interactions`.

**Requisito honesto:** o motor proativo **não é retroativo**. Ele só fala 30 dias
antes se capturou o dado na entrada. Por isso o onboarding e a captura disciplinada
são o gargalo real do produto, não o motor. (Journal, Aprendizado 006)

---

## Módulos à parte (não são segmento de empresa)

- **Licitações** — mapear licitações públicas: concorrentes, vencedores, tipo de
  negócio, produtos, cadência de abertura por setor, e mais. Dado público →
  prospecção B2B permitida (Journal, Decisão 004). É da família B2B (Onda 3):
  outra engine, decisão futura. Anexável a um módulo de empresa (ex.: Mercato
  Automação). Fonte: APIs públicas de compras/licitações.

## Ferramentas auxiliares (add-ons pagos, escolhidos na contratação)

Não são Skills de segmento — são opções pagas que aparecem **no momento da
contratação**, para o cliente montar o produto e aumentar o ticket:

- **CRM avançado** (o núcleo já tem a base; esta é a versão parruda).
- **Financeiro** — previsão de custos, despesas, receita, comparativos.
- **Integrações com ERPs de API aberta** — TOTVS (usado por muita empresa do
  perfil da Mercato) e outros, para o cliente puxar base de clientes, produtos e
  cadastros. Pesquisar quais têm API aberta e valem integração.
- **Curso de vendas** — aperfeiçoar o vendedor no trato pessoal com o cliente,
  usando as técnicas avançadas da própria biblioteca como referência. Se vamos
  vender, precisa ser bom e ter **várias horas**. Produção de conteúdo (não só
  código); fase mais adiante. Ganho de consistência: o curso ensina exatamente o
  que o motor aplica.
- (pesquisar outras ferramentas de venda)

Regra de produto: as auxiliares aparecem como opção na tela de contratação.

**Tutorial no sistema** (parte do produto, não add-on): explicar como usar o
COS. Também serve de onboarding do vendedor no modelo manual.

## Go-to-market

- **Auto-venda (dogfooding):** a WSS Labs usa o próprio COS para vender COS —
  mapear via **Google Maps + segmento** empresas candidatas (B2B, dado público →
  permitido). O fundador é o primeiro cliente do produto.
- **30 dias grátis:** porta de entrada. Testar o sistema, achar melhorias, e o
  cliente, vendo resultado, converte com menos atrito.

## Jogada — Barbearia / salão: frequência de corte

- **Captura:** data do último corte + frequência habitual do cliente (ex.: 15 dias).
- **Sinal:** chegou a janela habitual daquele cliente.
- **Oportunidade:** lembrar o cliente. Manual → vendedor envia mensagem específica
  do banco. Automático → o sistema envia sozinho.
- Mesmo padrão da casa de festas: **recorrência temporal**. É a dor real do
  segmento — ninguém controla isso hoje.

## Pesquisa pendente (fazer depois de travar os segmentos)

Pesquisar a fundo cada segmento escolhido: dificuldades, dores, pontos fortes e
ideias de melhoria — sempre ligado a **captação, vendas, receita e modelo de
trabalho**. Cada achado vira jogada ou campo de captura. Não iniciar antes da
lista de segmentos estar fechada.
