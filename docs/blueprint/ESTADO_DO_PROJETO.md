# ESTADO DO PROJETO — COS (WSS Kairós)
**Última atualização:** 1º de agosto de 2026
**Fabricante:** WSS Labs · **Fundador:** William

> Este documento existe para que qualquer conversa nova possa retomar o projeto
> sem repetir discussões encerradas. **Leia antes de propor qualquer coisa.**
>
> Ordem: este arquivo → `COS_Tese_de_Mercado.md` (por que existe e para quem) →
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

### Segmentos — 8 completos, 134 entradas curadas
| Segmento | Biblioteca | Módulos |
|---|---|---|
| `academia` | 22 | — |
| `barbearia` | 18 | — |
| `industria` (têxtil/feltro, calçado, moveleira, metal-mecânica, embalagens, autopeças, implementos) | 18 | prospecção + licitações |
| `escola_esportiva` (natação, lutas, crossfit, pilates, clubes) | 16 | — |
| `clinica` (médica, odonto, estética) | 15 | — |
| `sob_medida` (marcenaria, vidraçaria, serralheria, solar) | 15 | prospecção + licitações |
| `automacao` (predial, climatização, energia) | 15 | prospecção + licitações |
| `distribuidora` (atacado) | 15 | prospecção |

Empresas de demonstração existem para todos (`demo-*`), vinculadas ao fundador —
trocar no seletor do topo do painel.

### Infra
- Migrations `0001`–`0026` aplicadas. RLS em tudo com `tenant_id`.
- `scripts/seed-skills.mjs` · `scripts/seed-knowledge.mjs` ·
  `scripts/criar-tenant-demo.mjs`.
- `SUPABASE_SERVICE_ROLE_KEY` em `apps/web/.env.local` (dá para semear e migrar
  direto daqui). `AI_API_KEY` (Anthropic) na Vercel e local.
- **Carga de dado do produto é trabalho do assistente, não do fundador.** Os
  scripts acima e o `mcp__supabase__execute_sql` escrevem no banco direto.
  Depois de semear, confira com um `select` independente (seção 6).

---

## 3. Pendências (em ordem de importância)

1. **Revisão da biblioteca de `industria` pela especialista** (irmã do fundador,
   Feltros Bandeirantes). Manifesto e 18 entradas já **no banco**, com
   `Indústria Demo` criada — a curadoria veio de pesquisa, não de vivência, e é
   essa a diferença entre boa e excelente.
2. **M2 — ligar desfecho à escola.** Com o M1 no ar (abaixo), falta gravar
   `school` em `interactions`/`decisions` e responder *"qual escola converte
   neste segmento, nesta etapa"*. É o único ativo que melhora com escala.
   **Bloqueio real:** ainda há **0 desfechos registrados** — sem uso, não há o
   que medir.
3. **M3 — as entradas que faltam.** **Indecisão (JOLT)** nos 8 segmentos (40 a
   60% das perdas, zero entradas nossas) e o **comprador que não quer conversar**
   (67% do B2B, Gartner 2026 — nossa biblioteca pressupõe conversa em 100% das
   entradas). Depois, qualificação de compra (MEDDIC-lite).
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
- **`seed-knowledge.mjs` tinha dois bugs latentes (corrigidos ago/2026).** Lia só
  o ÚLTIMO `values` do arquivo — na academia, que tem 22 `INSERT` separados,
  carregaria 1 entrada **depois de apagar as 22**. E parseava o rodapé do
  arquivo: as queries de verificação viravam tuplas fantasma (28 lidas onde há
  22). Rode o carregador uma vez em qualquer seed novo antes de confiar nele.
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
node scripts/seed-skills.mjs              # recarrega manifestos no banco
node scripts/seed-knowledge.mjs packages/db/migrations/0026_seed_knowledge_industria.sql
node packages/db/tests/required_facts_industria.mjs   # 0 órfãos, 12/12 categorias
cd apps/web && npm run build              # build limpo
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
