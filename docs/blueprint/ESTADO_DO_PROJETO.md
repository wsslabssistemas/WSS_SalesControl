# ESTADO DO PROJETO — COS (WSS Kairós)
**Última atualização:** 1º de agosto de 2026
**Fabricante:** WSS Labs · **Fundador:** William

> Este documento existe para que qualquer conversa nova possa retomar o projeto
> sem repetir discussões encerradas. **Leia antes de propor qualquer coisa.**
>
> Ordem: este arquivo → **`COS_Plano_de_Execucao.md` (a fila de trabalho e o que
> está congelado)** → `COS_Tese_de_Mercado.md` (por que existe e para quem) →
> `COS_Mapa_de_Segmentos.md` (o que cobrimos) → `COS_Escolas_de_Venda.md` (que
> técnica usamos e o que falta) → `../../CLAUDE.md` (as três leis).

---

## 1. O que estamos construindo

Um **motor de inteligência comercial multi-tenant**. O produto vendável é o
núcleo; os segmentos são **dado** (manifesto YAML), nunca código.

**Origem:** protótipo validado no Base44 na academia do fundador (Be Fitness,
Porto Alegre). A migração existe porque no-code não dá posse, multi-tenancy real
nem controle de custo de IA.

**O ativo real não é o código.** É a **biblioteca curada** — hoje 116 entradas
em 7 segmentos, com técnica de venda aplicada a contexto específico.

**A tese de venda** (pesquisa do fundador, ver `COS_Tese_de_Mercado.md`): o
mercado não sofre de falta de bom atendimento — sofre da **mistura entre
"atendimento" e "técnica de vendas"**. +60% das PMEs brasileiras não usam CRM
estruturado. Não vendemos CRM (caixa vazia que o cliente enche); vendemos **a
técnica que falta**. A maior lacuna é o **follow-up**: em serviços técnicos,
+70% dos orçamentos nunca recebem uma segunda mensagem.

---

## 2. O que está pronto e funcionando

### Núcleo comercial
- **Responder** — cockpit manual (busca na biblioteca) **+ motor de IA** que
  gera resposta ancorada em DNA + biblioteca + histórico + catálogo + agenda,
  e **explica a técnica** ao vendedor.
- **Primeira abordagem** — para prospecção, onde *não existe* mensagem do
  cliente. Usa o retrato público da empresa (CNAE, porte, ano, cidade).
- **Trava anti-invenção** — falta fato no DNA → escala, não redige. Preço e
  estoque só saem do **catálogo**; horário só sai da **agenda**.
- **Escola de venda como dimensão canônica (M1)** — `strategy_map` no manifesto
  diz qual das 9 escolas governa cada categoria **naquele segmento** (barbearia
  fecha por alternativa onde indústria monta oferta: Rackham mostrou que
  pressão derruba conversão em ticket alto). `sales_schools` guarda princípio,
  quando usar, **quando NÃO usar** e a força da evidência de cada uma.
- **Aprender o que converte** — desfecho registrado realimenta o motor.
- **Follow-up** — a tela que cobra o toque, por cadência do manifesto.
- **Recorrência** — quem está no ponto de voltar, com data no dia preferido.
- **Agenda com disponibilidade real** — jornada por empresa **e por
  profissional**, folgas/bloqueios, e o motor **fecha o horário** (`origem=motor`).
- **Contatos, Funil, Gestão** (com Analista de IA), **Equipe**, **DNA**,
  **Onboarding** (escolha de ramo + entrevista), **Tutorial**, **Automação**.
- **Catálogo** — importação de planilha que reconhece as colunas sozinha.
- **Add-ons**: **Oportunidades** (prospecção B2B por CNAE) e **Licitações**
  (PNCP: editais, inteligência, quem ganhou, guia + assistente de IA).
  Cada edital diz **por que apareceu** — qual palavra o trouxe e se ela está no
  objeto ou só na lista de itens, que abre sob demanda com o item destacado.
- **Painel do fabricante** — cross-tenant, custo de IA, margem, **Acesso e
  planos** (teste grátis e liberação de módulos por empresa).
- **Curso completo** — 9 módulos, 45 lições, 122 perguntas, 267 minutos, com
  **repescagem espaçada** (`course_review`: as perguntas voltam em 2 → 5 → 12 →
  30 dias por acerto seguido; errar zera). A teoria é uma só; o exemplo vem da
  biblioteca do segmento da empresa.

### Segmentos — 9 completos, 166 entradas curadas
| Segmento | Biblioteca | Módulos |
|---|---|---|
| `academia` | 23 | — |
| `energia_solar` (fotovoltaica + **híbrido com bateria**) | 21 | prospecção + licitações |
| `industria` (têxtil/feltro, calçado, moveleira, metal-mecânica, embalagens, autopeças, implementos) | 20 | prospecção + licitações |
| `barbearia` | 19 | — |
| `distribuidora` (atacado) | 17 | prospecção |
| `automacao` (predial, climatização, energia) | 17 | prospecção + licitações |
| `escola_esportiva` (natação, lutas, crossfit, pilates, clubes) | 17 | — |
| `clinica` (médica, odonto, estética) | 16 | — |
| `sob_medida` (marcenaria, vidraçaria, serralheria, solar) | 16 | prospecção + licitações |

**Todo segmento tem uma entrada de INDECISÃO** (o cliente que concordou e mesmo
assim travou — 40 a 60% das perdas, segundo o JOLT) e os B2B têm a do
**comprador que não quer conversar** (67% do B2B prefere se servir sozinho).

**Regra do segmento novo:** `energia_solar` só existiu porque `sob_medida` dizia
"solar" no nome e **nenhuma das suas entradas falava de solar**. Nome de
manifesto não é cobertura — cobertura é entrada curada.

Empresas de demonstração existem para todos (`demo-*`), vinculadas ao fundador —
trocar no seletor do topo do painel.

### Infra
- Migrations `0001`–`0037` aplicadas. RLS em tudo com `tenant_id`.
- `scripts/seed-skills.mjs` · `scripts/seed-knowledge.mjs` ·
  `scripts/criar-tenant-demo.mjs`.
- `SUPABASE_SERVICE_ROLE_KEY` em `apps/web/.env.local` (dá para semear e migrar
  direto daqui). `AI_API_KEY` (Anthropic) na Vercel e local.
- **Carga de dado do produto é trabalho do assistente, não do fundador.** Os
  scripts acima e o `mcp__supabase__execute_sql` escrevem no banco direto.
  Depois de semear, confira com um `select` independente (seção 6).

---

## 3. Pendências (em ordem de importância)

> **A fila executável, com o que está congelado por decisão do fundador, mora em
> `COS_Plano_de_Execucao.md`.** Automação (WhatsApp + motor proativo), migração
> dos dados do Base44 e o M2 estão congelados — não reabrir sem motivo novo.
> O item 1 de lá: **5 dos 8 tenants demo não têm DNA**, então as 145 entradas
> curadas nunca foram vistas funcionando.

1. **Revisão da biblioteca de `industria` pela especialista** (irmã do fundador,
   Feltros Bandeirantes). Manifesto e 18 entradas já **no banco**, com
   `Indústria Demo` criada — a curadoria veio de pesquisa, não de vivência, e é
   essa a diferença entre boa e excelente.
2. **M2 — ligar desfecho à escola.** Com o M1 no ar (abaixo), falta gravar
   `school` em `interactions`/`decisions` e responder *"qual escola converte
   neste segmento, nesta etapa"*. É o único ativo que melhora com escala.
   **Bloqueio real:** ainda há **0 desfechos registrados** — sem uso, não há o
   que medir.
3. **M3 — qualificação de compra (MEDDIC-lite).** O que sobrou do M3: orçamento,
   processo de aprovação, critério de decisão e defensor interno. Já temos o
   campo `decisor`; falta o resto. As entradas de **indecisão** e de
   **autosserviço** já estão no ar (ago/2026).
   Decisão fechada: **não criar dimensão de gênero** (evidência fraca; viraria
   estereótipo automatizado). Ver `COS_Escolas_de_Venda.md` §3.
4. **Google Agenda mão dupla** (criar/mover evento). Exige OAuth e ação do
   fundador. O `.ics` de leitura já existe e funciona.
5. **Kairós vender a si mesmo** — falta canal de envio (WhatsApp Cloud API),
   motor proativo agendado e **score de potencial → preço sugerido**.
6. **Volume da prospecção** — hoje é amostra (~20–80). Opções: exportação paga
   (~R$0,01/empresa) ou base própria do dump da Receita.
7. Fila de segmentos novos: salão de beleza, pet, imobiliária, oficina, curso,
   eventos. **Restaurante descartado** (operação de fluxo, não de funil).

---

## 4. Armadilhas já descobertas (não repetir)

- **`tenant_skills`**: a RLS de `skills` exige o vínculo. Gravar só
  `tenants.skill_key` faz o painel abrir **sem etapas e sem origens**. Use
  sempre a RPC `install_skill(tenant, skill_key)`. Já derrubou a Barbearia Demo
  e as 5 demos criadas depois.
- **Unicidade de `skills` é `(key, version)`**, não `key`.
- **PNCP derruba rajadas** — 28 chamadas simultâneas, 24 falham. Use `getJson`
  (retry) + `mapLimit`. `tam_pagina` até 100 funciona; paginação funciona;
  **a busca textual ignora filtro de data**.
- **A biblioteca curada não chegava ao motor.** Até ago/2026 o Responder lia só
  `source='tenant'`. Os 134 registros dos 8 segmentos estavam no banco e **nunca
  alimentavam a IA** — efeito colateral do P0 do `0006`, que fechou a leitura
  global para `authenticated` e previa "retrieval server-side" que ninguém
  implementou. Corrigido: `ai-actions` busca a biblioteca do segmento com
  `service_role` (estratégia não vai ao browser). **Se criar tela nova que use a
  biblioteca, lembre: com o client do usuário ela volta vazia.**
- **Correção de dado vai no SEED, nunca em `UPDATE` de migration.**
  `seed-knowledge.mjs` recarrega com DELETE + INSERT: qualquer conserto feito
  por `UPDATE` numa migration posterior evapora na primeira recarga, e um
  ambiente novo nasce com o erro. A primeira versão do `0027` fazia isso com a
  escola de venda — virou dado explícito na 17ª coluna dos seeds. **O
  repositório é a verdade; o banco é só onde ela é executada.**
- **Um `;` perdido no meio do seed some com entradas, em silêncio.** O `0017` da
  barbearia tinha um: encerrava o INSERT na 16ª tupla e deixava 3 órfãs. SQL
  inválido que ninguém percebeu, porque o carregador só lê menos e não reclama.
  O `library_check` agora reproduz o corte do carregador e falha quando o número
  lido difere do número de entradas do arquivo (trava testada com o arquivo
  quebrado de propósito).
- **`seed-knowledge.mjs` tinha dois bugs latentes (corrigidos ago/2026).** Lia só
  o ÚLTIMO `values` do arquivo — na academia, que tem 22 `INSERT` separados,
  carregaria 1 entrada **depois de apagar as 22**. E parseava o rodapé do
  arquivo: as queries de verificação viravam tuplas fantasma (28 lidas onde há
  22). Rode o carregador uma vez em qualquer seed novo antes de confiar nele.
- **Entrada nova vai no seed DO PRÓPRIO SEGMENTO, nunca em arquivo separado.**
  `seed-knowledge.mjs` recarrega com DELETE de tudo do `skill_key` antes do
  INSERT. Criei o `0036` só com 3 entradas de solar e ele **apagou as 18
  originais** — a regra já estava escrita aqui e eu mesmo violei. Fundido no
  `0030`. Se precisar acrescentar assunto novo a um segmento, **edite o seed
  dele**.
- **`technique` é USER-FACING.** Aparece no Responder e no curso. A biblioteca
  da academia veio do Base44 com rótulos em inglês ("Hot Button", "Puppy Dog
  Close") e o fundador leu isso na tela. Traduzidos em ago/2026 mantendo o
  autor entre parênteses — creditar a escola é o método; o que não pode é o
  vendedor ler inglês. **Ao criar entrada nova, o rótulo é para ser lido.**
- **Progresso de repescagem não pode morar em `course_progress.answers`.** O
  campo é reescrito quando a lição é refeita e é a base do cálculo da nota —
  gravar acerto de revisão ali infla a nota de uma prova que ninguém refez, e o
  número deixa de significar o que diz significar. O agendamento é por
  QUESTÃO, não por lição: chave diferente, tabela diferente (`course_review`,
  `0037`). O plano de execução afirmava que "o dado já é guardado desde o
  `0031`" — era meia verdade: o *erro* estava lá, o *quando volta* não.
- **A posição da alternativa correta não pode ser PREVISÍVEL — e distribuição
  não prova isso.** A trava do `seed-curso.mjs` foi escrita duas vezes, e a
  primeira versão media a coisa errada.
  *1ª vez:* as 16 primeiras perguntas saíram todas com a certa na 1ª opção. A
  trava passou a exigir distribuição (máximo metade na mesma posição).
  *2ª vez:* o fundador pegou de novo, e o padrão era outro — a certa **andava
  uma casa a cada pergunta** (1, 2, 3, 4, 1, 2, 3, 4…) pelo módulo inteiro. A
  trava de distribuição não só deixou passar: uma rotação perfeita dá **25% em
  cada posição**, o número mais saudável possível. Ela media o sintoma do
  primeiro erro, não a propriedade que importa.
  Hoje a trava mede **ciclo**: para períodos de 2 a 5, quanto a certa se repete
  em relação a *p* perguntas atrás. O acaso bate ~25%; o teto é 60%. E mede
  **por módulo além do arquivo** — um arquivo com três módulos dilui o ciclo de
  um deles até ele sumir na média, e o aluno vive um módulo por vez.
  A lição geral: **quando uma trava nasce de um bug concreto, ela tende a medir
  aquele bug em vez da propriedade.** "Variar de cabeça" vira ritmo, e ritmo é
  ainda mais fácil de decorar do que posição fixa.
- **Explicação de pergunta nunca se refere a posição.** "A primeira faz ele
  calcular", "as outras três" — a ordem das alternativas muda e a explicação
  passa a mentir sem ninguém perceber. Uma delas já estava errada antes de
  qualquer reordenação: dizia "a primeira" para uma resposta que estava na
  quarta. Referencie pelo **conteúdo** da alternativa.
- **Policy `FOR ALL` roda em toda LEITURA.** Uma policy de escrita marcada como
  `ALL` também é avaliada em cada `SELECT` — então `memberships`,
  `commercial_dna` e `knowledge_entries` pagavam `is_admin_of` **além** de
  `is_member_of` em toda leitura, nos três caminhos mais quentes do sistema.
  Corrigido no `0032` separando em INSERT/UPDATE/DELETE. **Otimizar RLS é onde
  mais se afrouxa segurança sem perceber** — por isso existe
  `rls_shape_test.sql`: leitura por membro, escrita por admin, 3/3.
- **`auth.uid()` sem `select` é reavaliado POR LINHA.** Numa policy, escrever
  `auth.uid()` cru faz o Postgres executar a função para cada linha avaliada.
  Com 50 contatos ninguém nota; com 50 mil, a consulta desaba. Sempre
  `(select auth.uid())`.
- **Etapa terminal desliga motor.** `computeDueTouches` (follow-up) e
  `computeDue` (recompra) pulam etapas `terminal`. Efeito descoberto em ago/2026:
  a barbearia tinha "Cliente recorrente" terminal, então **a carteira fiel nunca
  aparecia na recompra** — no segmento cuja tese é recompra. Corrigido em
  `stagesWithoutRecurrence`: etapa `won` continua recebendo recompra. Ao desenhar
  segmento novo: **cadência declarada em etapa terminal é dado morto.** Por isso
  `industria` tem "Sem reposição" **não-terminal**.
- **Itens do PNCP**: `GET /api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens`
  devolve um **array puro** com `descricao`, `quantidade`, `unidadeMedida`,
  `valorUnitarioEstimado` (verificado ago/2026). Buscar sob demanda, um edital
  por vez — puxar os itens de 100 editais de uma vez é a rajada que o PNCP corta.
- **Dois donos do mesmo gatilho é empate por construção.** Quando duas entradas
  do mesmo segmento reivindicam a mesma frase, nenhum ajuste de ranking
  desempata — e o efeito é silencioso, porque a errada vence com aparência de
  resultado normal. Aconteceu em `academia` ("vou pensar" em `objections` e na
  de indecisão) e em `clinica` ("vou conversar em casa" literalmente idêntico em
  duas). Agora o `retrieval_check` varre **todos os gatilhos curados** e exige
  que cada um traga a própria entrada em 1º (piso 95%; medido 95,5% de 885).
- **A prosa não pode decidir o 1º lugar.** `strategy` e `answer` são textos
  longos; somando sem teto, uma entrada que *fala do assunto* passava na frente
  da que *responde a pergunta*. Em `lib/match.ts` a prosa satura. Zerá-la seria
  pior: é ela que segura o recall quando ninguém escreveu gatilho para aquela
  pergunta. **Ao mexer no casamento, meça as duas coisas** — precisão sobre os
  gatilhos curados e recall sobre mensagens que não são gatilho de ninguém.
  Melhorar uma às custas da outra parece progresso e não é.
- **Teste não guarda cópia do algoritmo.** O `retrieval_check` mantinha uma
  reimplementação "fiel" de `lib/match.ts`, com um comentário admitindo que
  divergiria. Divergiu na primeira mudança real. O Node lê TypeScript direto:
  o teste importa o arquivo do app.
- **`knowledge_entries.on_missing_facts`** só aceita `escalate` ou `omit`.
- **As 12 categorias canônicas são fixas** — o validador barra qualquer outra.
  O label muda por segmento; a chave, não.
- **Chaves de campo do DNA são contrato** com `required_facts`. Traduza `label`
  e `help`, **nunca a chave**.
- **Lei 1 vaza fácil**: já apareceu "Atendimento/Serviço" (vocabulário de
  barbearia) em automação, e `"contato"` chumbado como etapa inicial. Se é
  específico de mercado, tem que vir do manifesto.

---

## 5. Como o fundador trabalha

- Merge direto na `main`, sem PR. CI valida os manifestos a cada push.
- Ele **testa no deploy** (`wss-kairos.vercel.app`) e reporta com precisão —
  vários bugs reais vieram dele. Leve a sério e **verifique no código**.
- Quer honestidade sobre limites, não otimismo. Diga o que falta.
- Peça o que exige ação dele (chaves, contas, OAuth) só quando indispensável.
- Tudo em português do Brasil, inclusive o texto do produto.

---

## 6. Verificações rápidas de sanidade

```bash
npm run -w @cos/skill-loader validate     # manifestos (deve dar 8/8)
node packages/db/tests/library_check.mjs  # bibliotecas: categoria, escola, fatos
node packages/db/tests/demo_dna_check.mjs # DNA de demonstração × manifestos
node packages/db/tests/retrieval_check.mjs # escolha de técnica: 22/22 (precisa do banco)
node packages/db/tests/repescagem_test.mjs # espaçamento do curso: 13/13 (sem banco)
node packages/db/tests/curso_render_test.mjs # 45 lições renderizam (precisa do banco)
node scripts/seed-curso.mjs packages/db/migrations/0036_curso_conteudo_m7_m8_m9.sql
node scripts/seed-skills.mjs              # recarrega manifestos no banco
node scripts/seed-demo-dna.mjs            # DNA das empresas demo
cd apps/web && npm run build              # build limpo
```

Levar a biblioteca para quem vive o ramo revisar (gera em `revisao/`):
```bash
node scripts/kit-revisao.mjs industria     # .html para ler, .csv para responder
```

A prova do motor com IA (custa tokens, ~R$ 0,25 por resposta):
```bash
node scripts/provar-motor.mjs             # 8 mensagens reais nos segmentos
node scripts/provar-motor.mjs industria   # só um segmento
```

Fatos órfãos no banco (deve voltar vazio):
```sql
with e as (select distinct skill_key, unnest(required_facts) c
             from knowledge_entries where tenant_id is null and source='skill_seed'),
     d as (select k.key sk, (s->>'key')||'.'||(f->>'key') c
             from skills k, jsonb_array_elements(k.manifest->'dna_sections') s,
                  jsonb_array_elements(coalesce(s->'fields','[]'::jsonb)) f)
select e.* from e left join d on d.sk=e.skill_key and d.c=e.c where d.c is null;
```
