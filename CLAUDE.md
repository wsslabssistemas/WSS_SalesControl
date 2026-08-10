# COS — Commercial Operating System

Plataforma de inteligência comercial multi-tenant. **Fabricante:** WSS Labs.
Um núcleo único (CIE) + especializações por segmento (Skills declaradas em dados).

**Leia antes de propor qualquer coisa**, nesta ordem:
`docs/blueprint/ESTADO_DO_PROJETO.md` (o que existe e as armadilhas já pagas) →
`docs/blueprint/COS_Plano_de_Execucao.md` (a fila e **o que está congelado**) →
`docs/blueprint/COS_Escolas_de_Venda.md` (a técnica que o produto vende).
Fundação e histórico: `COS_GRD_Core.md`, `COS_Journal_Migracao.md`.

**Este arquivo guarda o que não muda** — as leis, a stack, as convenções e as
decisões fechadas. **O estado do projeto mora só no `ESTADO_DO_PROJETO.md`.**
Já foram duas fontes; a daqui apodreceu em silêncio e passou meses ensinando
"ainda não existe aplicação" para toda conversa nova. Estado volátil em dois
lugares não fica sincronizado — fica errado no lugar menos visitado.

---

## O que é o produto

O produto vendável é o **núcleo**. Academia foi a primeira Skill instalada; hoje
são nove (academia, barbearia, clínica, distribuidora, automação, escola
esportiva, indústria, sob medida, energia solar). Segmento é **arquivo de
configuração**, não sistema separado.

**O ativo não é o código.** É a biblioteca comercial curada. Código se copia em
duas semanas; a curadoria, não. Toda decisão de arquitetura deve proteger esse ativo.

---

## As três leis (inegociáveis)

1. **O núcleo nunca conhece segmento.** `packages/core/` não importa de
   `packages/skills/` e não contém vocabulário de mercado (aluno, matrícula,
   corte, consulta). Verificável por lint.
2. **Skill é dado, nunca código.** `packages/skills/` só aceita `.yaml`, `.json`,
   `.md`. Nenhum arquivo executável.
3. **Nenhum acesso a dados sem contexto de empresa.** Toda consulta exige
   `tenant_id`. RLS no Postgres é a defesa real, não a aplicação.

Violação das três deve **falhar o build**, não gerar comentário em revisão.

---

## Stack decidida (não reabrir sem motivo novo)

| Tema | Decisão |
|---|---|
| Framework | Next.js 15 + TypeScript |
| Banco | Supabase (Postgres) com RLS |
| Hospedagem | Vercel |
| API | Hono em rota catch-all `/api/[[...route]]` (limite de 12 funções na Vercel) |
| ORM | Drizzle, migrations versionadas em Git |
| Busca semântica | pgvector |
| Jobs de fundo | Inngest (motor proativo não roda em serverless) |
| IA | Vercel AI SDK |
| Cobrança | Por atendimentos/mês. **Nunca por tokens.** |

---

## Convenções do repositório

```
packages/db/migrations/   # schema e dados de produto. Numerados, imutáveis.
packages/db/seeds/        # seeds de demonstração. Local e staging. NUNCA produção.
packages/db/tests/        # verificações com valor esperado escrito no arquivo.
packages/skills/          # manifestos YAML por segmento. Dado puro.
docs/blueprint/           # fundação, Journal, GRD, estado do projeto.
```

São **três categorias**, não duas. Confundi-las é o que faz dado fictício
vazar para produção ou biblioteca faltar em ambiente novo:

| Categoria | Onde | Roda em produção? | O que é |
|---|---|---|---|
| **Migration de schema** | `migrations/` | Sim | DDL. Cria e altera estrutura. |
| **Product seed** | `migrations/` | **Sim** | Dado que *é* o produto: Skills e biblioteca curada. Sem ele o núcleo não funciona. |
| **Demo seed** | `seeds/` | **Nunca** | Tenants e contatos fictícios para desenvolver e demonstrar. |

- Product seed mora em `migrations/` de propósito: precisa rodar **uma vez, em
  todo ambiente**, na mesma sequência numerada do schema. É por isso que
  `0003_seed_skills.sql` e `0004_seed_knowledge_academia.sql` estão lá — o
  prefixo `seed` no nome descreve o conteúdo, não a categoria.
- Demo seed nunca entra na sequência numerada. Se um dia rodar em produção,
  foi erro humano — e por isso existe a regra do prefixo abaixo.
- Todo seed de demonstração usa slug com prefixo `demo-`, para que um `delete`
  jamais alcance um tenant real.
- Todo teste declara o valor esperado em comentário. "Parece certo" não é critério.
- O nome da query salva no Supabase é igual ao nome do arquivo, sem extensão.

---

## Decisões já fechadas (não sugerir o contrário)

- **WhatsApp só por API oficial da Meta.** Provedor não-oficial arrisca banir o
  número do cliente pagante.
- **Prospecção fria B2C não será construída.** LGPD e risco de banimento.
  B2B frio com dados públicos é permitido.
- **Vendedor não é tabela.** É um `membership` com papel `agent`.
- **Etapa da jornada é texto validado por manifesto**, não enum no banco — enum
  exigiria migration a cada segmento novo e quebraria a Lei 2.
- **Jornada é grafo**, não linha: avança, pula e retrocede. Por isso existe
  `contact_stage_history` append-only.
- **Separação estratégia/fato.** A biblioteca guarda estratégia com
  `required_facts`; os números vêm de `commercial_dna`.
- **Trava anti-invenção.** Falta fato exigido, o motor devolve `escalate` e
  **não redige**. Prompt não resolve essa classe de erro; verificação estrutural resolve.
- **Três motores reais** (Context, Decision, Memory). Os outros sete "Engines"
  dos documentos fundadores são fronteiras conceituais — não criar pasta para
  honrar documento.

---

## Métricas canônicas (implementar uma vez, consumir em todo lugar)

- Conversão = **convertidos distintos ÷ leads do período**. Nunca ÷ atendimentos.
- Resultado conta **pessoas distintas**, nunca eventos.
- Tempo de resposta em **mediana e p90**, nunca só média.
- Toda dimensão de análise é **enum**, nunca texto livre.

---

## Estado atual — em uma linha

**Não existe checklist aqui de propósito.** O estado vive em
`docs/blueprint/ESTADO_DO_PROJETO.md`, atualizado a cada entrega. Esta seção já
foi uma cópia dele e ficou meses desatualizada — dizendo "ainda não existe
aplicação" enquanto o produto estava no ar.

O mínimo para se situar (confira no `ESTADO_DO_PROJETO.md` antes de usar como
verdade): aplicação Next.js no ar em `kairos.wsslabs.com.br`, migrations
`0001`–`0050` aplicadas, **15 segmentos com 285 entradas curadas**, motor com IA
e trava anti-invenção estrutural, e um módulo de curso com 45 lições.

## Invariantes de segurança conquistadas (não regredir)

Cada uma nasceu de um achado de auditoria e já está corrigida. O que importa
aqui não é o histórico — é **o motivo**, que continua valendo e que é fácil de
desfazer sem perceber.

- **A biblioteca curada não é legível por `authenticated`** (`0006`). O Supabase
  expõe `public` via PostgREST: com a policy antiga, qualquer teste grátis
  baixava a curadoria inteira de todos os segmentos com uma chamada. Hoje o
  `authenticated` lê só o conhecimento do próprio tenant; a biblioteca global é
  `service_role`, com retrieval server-side. **Estratégia nunca chega ao
  browser** — e tela nova que use a biblioteca com o client do usuário volta
  vazia, o que é o comportamento certo.
- **`decisions` é append-only por trigger, não por policy** (`0006`). RLS é
  row-level, não column-level: a policy de UPDATE deixava reescrever
  `context_snapshot`, `rationale` e `cost_cents`. O trigger
  `t_decisions_append_only` só aceita mudança em `outcome`, `outcome_at` e
  `executed_at`, **para todo papel, inclusive `service_role`**. DELETE fica
  livre, por causa da cascata da LGPD.
- **`required_facts` é validado, não confiado** (`required_facts_check.sql` +
  validador no CI). Um typo no caminho deixava a entrada em ESCALA para sempre
  — falha na direção que *parece* segura, e por isso ninguém procura.
- **Um único DNA corrente por tenant** (`0007`), garantido por índice único no
  banco. Teste `dna_single_current_test.sql`.
- **A trava de DNA verifica atualidade, não só presença** (`0029`). Dado de um
  ano atrás passava como PRONTO e era afirmado com a confiança do dado de
  ontem: mentir sem nunca ter inventado.
- **Diagnóstico olha todo mundo; o prefixo `demo-` protege escrita.** O
  `dna_coverage_check` filtrava por `demo-` e voltava vazio para as empresas
  reais — e zero linhas parece "nada errado".
- **`tenants.skill_key` × `tenant_skills` não é contradição**, é papel
  diferente: a junção é o que está instalado (fonte da RLS), a coluna é a ativa.
  A regra única virou teste: `tenant_skill_coherence.sql`.

---

## Auditoria — o que continua aberto

Três itens, todos com motivo registrado para **não** terem sido feitos ainda.
Adiar com motivo escrito é decisão; adiar sem, é esquecimento.

- ~~**P1 — Telefone não está em E.164.**~~ **Fechado em ago/2026**, junto com a
  camada de envio — que era exatamente o gatilho combinado. Destravou por
  **escopo**: um país só, com as regras da Anatel, que são fechadas, então o
  comprimento desambigua sem biblioteca de telefonia e sem chute. A regra que
  preservou a preocupação original: `paraE164BR` **deriva e nunca grava**, então
  derivação errada faz mensagem não sair em vez de destruir cadastro.
  Ver `ESTADO_DO_PROJETO.md` §3.6.
- **P2 — Dinheiro como string de exibição no DNA** (`"R$ 169,00"`), o que impede
  análise por faixa de preço. Correção: inteiro em centavos + moeda, como já faz
  `lib/money.ts`. Mexe no editor, nos seeds, no prompt e no dado já gravado das
  empresas reais, e o ganho é um relatório que ainda não existe. Fazer junto com
  o primeiro relatório que precise disso.
- **P2 — `embedding vector(1536)` sem índice.** E índice ANN interage mal com
  RLS: o índice devolve top-k e o RLS filtra depois, então o resultado pode vir
  curto sem erro nenhum. Reforça a decisão do retrieval server-side.

---

## Limites que precisam de honestidade

- **A validação é N=1.** Be Fitness é do próprio fundador. A tese da Skill só
  está provada quando uma segunda empresa, **de outro segmento**, rodar no mesmo
  núcleo sem ninguém escrever código.
- **Não existe "IA que aprende" ainda.** Com 11 matrículas/mês, uma empresa não
  produz aprendizado estatisticamente válido. Até haver agregação entre dezenas
  de empresas, a Commercial Memory é escrituração honesta. Não vender o contrário.
- **O gargalo do produto é o onboarding**, não o motor. O extrator de DNA por
  entrevista é tão crítico quanto o CIE e não está em nenhum documento fundador.
- **Zero desfecho registrado é o bloqueio que mais aparece.** Já travou o M2
  (qual escola converte) e o score de potencial do preço sugerido. Antes de
  desenhar qualquer coisa que dependa de "o que converteu", confira se existe
  desfecho no banco — e, se não existir, **entregue a versão medida e declare a
  recusa** em vez de estimar. Número inventado com aparência de número é pior
  que campo vazio: campo vazio ninguém usa para decidir.

---

## A classe de defeito que mais custou (ago/2026)

Seis defeitos seguidos na entrada do produto, e **nenhum apareceu como erro**.
Todos se apresentaram como sucesso, silêncio ou lista vazia — e por isso todos
foram descobertos por uma pessoa de fora tentando usar, nunca relendo código.

- **RLS que devolve vazio não é erro.** `skills_read_installed` só mostra a
  Skill instalada; com o cliente do usuário, perguntar sobre segmento não
  instalado volta zero linhas, sem aviso. Pegou **três vezes**, com sintoma
  diferente a cada uma. Guardado por `skills_client_check.mjs`.
- **Sucesso pode significar fracasso.** O Supabase responde "ok, sem sessão"
  quando o e-mail já tem conta — de propósito, para a tela não virar
  verificador de cadastro. Ler isso como "precisa confirmar" mandou uma
  vendedora esperar um e-mail que não existia.
- **Ordem de chamada é invariante escondida.** `memberships.user_id` referencia
  `profiles`, e criar conta não cria perfil. Corrigir a ordem resolve o caso; o
  gatilho do `0054` resolve a classe.
- **RLS não é filtro de negócio.** Ela responde "o que você PODE ver", nunca "o
  que esta tela QUER ver". `listMemberships` sem `user_id` mostrava a mesma
  empresa uma vez por membro.

**Método que funcionou, e o que não funcionou:** reproduzir a operação contra o
banco real e comparar o mesmo `select` com clientes diferentes achou metade
deles. Reler o código não achou nenhum. Log de plataforma também não — a Vercel
registrou uma requisição em 24 horas.

**E a ordem do socorro:** quando uma pessoa está travada, destrave a pessoa
primeiro e conserte a causa depois. Em 10/ago isso foi feito ao contrário e
custou horas de uma funcionária parada enquanto a causa raiz era investigada.

---

## Como trabalhar comigo

- Antes de escrever código, diga o que vai fazer e por quê. Discordar é bem-vindo.
- Nada de código spaghetti e nada de `override` para contornar um problema —
  se a solução precisa de gambiarra, a modelagem está errada.
- Erros: aponte, corrija, siga. Sem rodeio e sem se desculpar demais.
- Prefira a correção estrutural à correção de prompt.
- O repositório é a verdade. O Supabase é só onde ela é executada.
- **`git push` depois de cada entrega.** Ele testa no deploy da Vercel, que
  builda do GitHub — commit local é invisível para ele. Em ago/2026 isso custou
  uma conversa inteira: 19 commits parados, e ele reportando como ausentes
  coisas prontas. Ao ouvir "isso não está aí", confira `git status -sb` antes
  de reabrir o código.
