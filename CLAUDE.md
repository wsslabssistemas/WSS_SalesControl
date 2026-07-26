# COS — Commercial Operating System

Plataforma de inteligência comercial multi-tenant. **Fabricante:** WSS Labs.
Um núcleo único (CIE) + especializações por segmento (Skills declaradas em dados).

**Leia antes de propor qualquer coisa:** `docs/blueprint/ESTADO_DO_PROJETO.md`,
`docs/blueprint/COS_Journal_Migracao.md`, `docs/blueprint/COS_GRD_Core.md`.

---

## O que é o produto

O produto vendável é o **núcleo**. Academia é apenas a primeira Skill instalada.
Segmentos (academia, barbearia, clínica, estética) são arquivos de configuração,
não sistemas separados.

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

## Estado atual

Banco no Supabase, executado manualmente pelo SQL Editor. **Ainda não existe aplicação.**

- [x] `0001_foundation.sql` — 19 tabelas
- [x] `0002_rls.sql` — RLS em todas as tabelas com `tenant_id`
- [x] `isolation_test.sql` — 7/7 PASSOU
- [x] `0003_seed_skills.sql` — Skills academia e barbearia
- [x] `0004_seed_knowledge_academia.sql` — 22 entradas
- [x] `demo_tenants.sql` + `dna_coverage_check.sql` — trava validada:
      Be Fitness 22/22 PRONTA, Academia Nova 7/22 PRONTA e 15 ESCALA
- [x] `0006_hardening.sql` — P0 corrigidos + `hardening_test.sql` 6/6 PASSOU
- [x] Validador de Skill (RF-02) — `packages/skill-loader`, 7/7 testes; academia e barbearia válidos
- [x] `required_facts_check.sql` — cruza `required_facts` × `dna_sections` (achou 1 bug)
- [x] `0007_dna_single_current.sql` — um DNA corrente por tenant; teste 2/2 PASSOU
- [x] `0008_manifest_reciprocity_academia.sql` — fecha o `reciprocity.gift`; órfãos: 0
- [x] CI (`.github/workflows/ci.yml`) — valida manifestos a cada push
- [x] App `apps/web` — Next.js 15 + Hono (`/api`) + Supabase; esqueleto navegável (modelo manual)
- [x] Login (Supabase Auth: senha + Google/OAuth) + contexto de empresa; telas DNA (cobertura), Funil, Equipe — falta 1º login real
- [x] Contatos — módulo completo: lista (busca+filtro+paginação), detalhe, edição, exclusão (soft), duplicidade por telefone normalizado; formulário Skill-driven. No ar em wss-kairos.vercel.app
- [x] Edição de DNA (RF-04) — `0009_save_dna` versionado (teste 3/3); editor por tipo de campo (texto, valor, sim/não, lista, tabela em grade)
- [x] Funil interativo (etapa → lista) + mover contato entre etapas (histórico da jornada)
- [x] Equipe — convidar vendedor (link de senha, via service_role), trocar papel, remover com transferência de contatos (`0010_user_by_email`)
- [x] Agenda/alertas — toques calculados das fases da jornada (offset_days do manifesto) + data de início editável no contato
- [x] Contatos: aviso de duplicidade antes de salvar, botão WhatsApp, caixa de data na semana experimental
- [x] Painel do fabricante (`/painel/admin`) — cross-tenant via service_role, gated por `PLATFORM_ADMIN_EMAILS`; empresas, atividade e custo de IA (`usage_ledger`)
- [x] Inicio vira painel (números, toques de hoje, funil, atalhos)
- [x] Equipe com desempenho (cadastros, em aberto, matrículas) + taxa de conversão no funil — etapa "ganha" no manifesto (`0011`, `won`)
- [x] Responder (console manual, SEM IA) — cola a mensagem → casa com a biblioteca por palavra-chave (`lib/match`) → resposta pronta pra copiar
- [x] Biblioteca WSS importada no banco (86 respostas + 9 réguas de Relacionamento Ativo, `source=tenant`, coluna `answer`) — ativo, não commitado
- [x] Fabricante financeiro (`0012_tenant_payments`) — registrar pagamentos por empresa; painel mostra recebido, custo de IA e margem (dado só do fabricante)
- [ ] **Visual profissional** (redesign, paleta do logo, referências mundiais) + logo em `apps/web/public/logo.png`
- [ ] **App instalável (PWA)** — PC e celular
- [ ] Versão automática: IA que adapta ao contexto (paga) + anti-bloqueio + canais (WhatsApp Cloud API, Facebook Pages) + dashboard de tokens — roteiro na memória `roadmap-expandido`
- [ ] Questionário de onboarding; calendário na agenda; configurações
- [ ] Instalação de Skill em tenant (RF-03)
- [ ] Motor de decisão (RF-05)

---

## Auditoria pendente — corrigir antes de qualquer cliente externo

**P0 — Biblioteca legível por qualquer usuário autenticado. ✅ RESOLVIDO (0006).**
A policy de `knowledge_entries` permitia `tenant_id is null` para todo
`authenticated`. Como o Supabase expõe `public` via PostgREST, qualquer trial
baixava a curadoria inteira de todos os segmentos. Mesmo problema em `skills`.
Correção aplicada: `authenticated` só lê o conhecimento do próprio tenant e
a Skill que instalou; a biblioteca global fica com `service_role` (retrieval
server-side). Estratégia nunca chega ao browser.

**P0 — `decisions` não é append-only. ✅ RESOLVIDO (0006).**
RLS é row-level, não column-level. A policy de UPDATE permitia reescrever
`context_snapshot`, `rationale` e `cost_cents`. Correção aplicada: trigger
`t_decisions_append_only` só aceita alteração em `outcome`, `outcome_at`,
`executed_at` — para todo papel, inclusive `service_role`. DELETE fica livre
(cascata LGPD).

**P1 — `required_facts` é contrato sem validação. ✅ RESOLVIDO.**
Typo em caminho deixava a entrada em ESCALA para sempre, falhando na direção que
parece segura. Agora `required_facts_check.sql` cruza todo `required_facts`
contra as `dna_sections` do manifesto, e o validador de manifesto (RF-02,
`packages/skill-loader`) roda no CI. O check achou um caso real —
`reciprocity.gift` — corrigido no `0008` (a categoria `reciprocity` ganhou
seção de DNA; o dado da Be Fitness já a assumia).

**Achado (jul/2026) — dado de demonstração sem prefixo `demo-`.** Os tenants
`be-fitness` e `academia-nova` no banco não têm o prefixo `demo-` exigido pela
convenção. Efeito colateral: `dna_coverage_check.sql` filtra `slug like 'demo-%'`
e volta VAZIO — a trava de cobertura é hoje um no-op contra o dado real. Decisão
do fundador (Be Fitness é empresa real): renomear os slugs para `demo-` ou
ajustar o filtro do check. Não resolvido por ser decisão de dado do fundador.

**P1 — A trava verifica presença, não validade nem atualidade.** DNA
desatualizado passa como PRONTA. Falta `updated_at` por seção.

**P1 — Telefone não normalizado.** O índice único é sobre texto cru;
`(51) 98251-2270` e `5551982512270` passam os dois. Correção: E.164.

**P1 — Podem existir dois DNAs correntes. ✅ RESOLVIDO (0007).**
`ix_dna_tenant_current` virou `unique` — o banco garante um único DNA corrente
por tenant. Teste: `dna_single_current_test.sql` 2/2.

**P2 — Dinheiro como string de exibição** no DNA (`"R$ 169,00"`). Impede
qualquer análise por faixa de preço. Correção: inteiro em centavos + moeda.

**P2 — Schema se contradiz sobre Skills por tenant.** `tenants.skill_key` é
uma; `tenant_skills` é tabela de junção. Decidir antes do primeiro cliente externo.

**P2 — `embedding vector(1536)` sem índice.** E índice ANN + RLS interagem mal:
o índice devolve top-k e o RLS filtra depois. Reforça o retrieval server-side.

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

---

## Como trabalhar comigo

- Antes de escrever código, diga o que vai fazer e por quê. Discordar é bem-vindo.
- Nada de código spaghetti e nada de `override` para contornar um problema —
  se a solução precisa de gambiarra, a modelagem está errada.
- Erros: aponte, corrija, siga. Sem rodeio e sem se desculpar demais.
- Prefira a correção estrutural à correção de prompt.
- O repositório é a verdade. O Supabase é só onde ela é executada.
