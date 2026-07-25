# ESTADO DO PROJETO — COS
**Última atualização:** 23 de julho de 2026
**Fabricante:** WSS Labs · **Fundador:** William

> Este documento existe para que qualquer conversa nova (com Claude ou com
> outra pessoa) possa retomar o projeto sem repetir discussões já encerradas.
> Leia este arquivo ANTES de propor qualquer coisa.

---

## 1. O que estamos construindo

Um **motor de inteligência comercial multi-tenant**. Não é um sistema para
academias — academia é apenas a primeira Skill instalada sobre o motor.

O produto vendável é o núcleo. Os segmentos (academia, barbearia, salão,
clínica, automação) são especializações declaradas em arquivos de dados.

**Origem:** protótipo validado no Base44 na academia própria do fundador
(Be Fitness, Porto Alegre). O protótipo funciona e está em uso diário.
A migração existe porque no-code não dá posse dos arquivos, multi-tenancy
real nem controle de custo de IA — sem isso não há SaaS vendável.

**O ativo real não é o código.** É a biblioteca comercial curada
(Girard, Belfort, Hormozi, Tracy aplicados a contexto específico).
Código se copia em duas semanas; aquela curadoria, não.

---

## 2. Decisões já tomadas (não reabrir sem motivo novo)

| Tema | Decisão |
|---|---|
| Stack | Next.js 15 + TypeScript + Supabase (Postgres) + Vercel |
| API | Hono em rota catch-all `/api/[[...route]]` — resolve o limite de 12 funções |
| ORM | Drizzle, migrations versionadas em Git |
| Busca semântica | pgvector |
| Jobs de fundo | Inngest (motor proativo não roda em serverless) |
| IA | Vercel AI SDK, para trocar de modelo sem reescrever o motor |
| Nome | **COS** como plataforma, **WSS Labs** como fabricante. "WSS Sales Control" e "Sales Mentor" ficam com o protótipo. Marca isolada em variável de ambiente — trocar depois é editar uma linha |
| WhatsApp | Duas versões de produto: **manual** (copia-e-cola) primeiro, **automática** depois. Quando for automático, só API oficial da Meta — provedor não-oficial arrisca banir o número do cliente pagante |
| Prospecção fria B2C | **Não construir.** Risco de banimento e base legal frágil sob LGPD. Crescimento B2C vem de indicação, reativação e resgate. B2B frio é permitido (dados públicos) |
| Cobrança | Por **atendimentos/mês**, nunca por tokens. Token é custo interno; atendimento é a moeda do negócio do cliente |
| Blueprint | Enxuto e versionado no repositório, não documento de 300 páginas |

---

## 3. As três leis de engenharia

Devem ser verificáveis automaticamente e falhar o build.

1. **O núcleo nunca conhece segmento.** `packages/core/` não importa de
   `packages/skills/` nem contém vocabulário de mercado.
2. **Uma Skill é dado, nunca código.** `packages/skills/` só aceita
   `.yaml`, `.json`, `.md`.
3. **Nenhum acesso a dados sem contexto de empresa.** RLS no banco é a
   defesa real.

---

## 4. O que já está construído e funcionando

Tudo no Supabase, executado pelo SQL Editor. Ainda não existe aplicação.

- [x] `0001_foundation.sql` — 19 tabelas
- [x] `0002_rls.sql` — RLS em todas as tabelas com `tenant_id`
- [x] `isolation_test.sql` — **7 de 7 PASSOU**. Empresa A não lê nem escreve na B
- [x] `0003_seed_skills.sql` — Skills academia e barbearia carregadas
- [x] `0004_seed_knowledge_academia.sql` — 22 entradas (confirmado no banco)
- [x] `demo_tenants.sql` + `dna_coverage_check.sql` — 2 empresas demo; trava de DNA validada
- [x] `0006_hardening.sql` — P0 da auditoria fechados; `hardening_test.sql` 6/6 PASSOU
- [ ] Validador de Skill (RF-02) — em andamento; `required_facts_check.sql` já achou 1 bug real

**Resolvido (jul/2026):** confirmado no banco — 2 / 22 / 2 / 2. O 0004 rodou.
A consulta segue útil como health-check:

```sql
select 'skills' as tabela, count(*) from public.skills
union all select 'knowledge_entries', count(*) from public.knowledge_entries
union all select 'tenants', count(*) from public.tenants
union all select 'commercial_dna', count(*) from public.commercial_dna;
```
Esperado: 2 / 22 / 2 / 2.

---

## 5. Conceitos centrais

**Commercial DNA** — os fatos de cada empresa (preços, horários, catálogo,
parceiros, políticas). Fonte única de verdade. **O que não está no DNA, a IA
não pode afirmar.** Quando falta um fato exigido, o motor escala para humano
em vez de inventar. Isso corrige três bugs reais do protótipo: negar serviço
existente, oferecer "vaga no horário" numa academia de acesso livre, e afirmar
condição errada de pagamento.

**Skill** — manifesto YAML por segmento: vocabulário, jornada (com fases),
campos próprios, seções de DNA, as 12 categorias canônicas, cadências e
regras permanentes. Instalar um segmento novo não pode exigir uma linha de código.

**As 12 categorias canônicas** — obtidas por engenharia reversa da biblioteca
real da Be Fitness. Onze das doze são idênticas em qualquer segmento:
`pricing`, `risk_free_entry`, `availability`, `expertise_proof`, `catalog`,
`goal_matching`, `objections`, `commitment_offer`, `reciprocity`,
`limits_and_ethics`, `retention`, `ecosystem`.

**Separação estratégia/fato** — a biblioteca guarda a estratégia com
`required_facts`; os números vêm do DNA. É isso que faz a segunda academia
receber as 22 entradas funcionando sem reescrever nada.

**Jornada é grafo, não linha** — pode avançar, pular e retroceder. Por isso
existe `contact_stage_history` (append-only): sem ela o estágio anterior é
sobrescrito e a análise se perde.

**Camada proativa** — sinais internos e externos produzem o mesmo objeto
(`Opportunity`), com `reason` obrigatório. Alocação respeita capacidade diária
do vendedor. Anti-saturação via `contact_touch_log`. Supressão LGPD consultada
antes de qualquer envio.

---

## 6. Correções de métrica (achadas no painel real, valem para o produto)

O protótipo mede errado. Definições canônicas obrigatórias:

- **Conversão = convertidos distintos ÷ leads do período.** O protótipo usava
  ÷ atendimentos, o que pune follow-up. Real: 6,5%, não 2,3%.
- **Resultado conta pessoas distintas**, nunca eventos. "8 matrículas" eram
  5 pessoas com registros duplicados.
- **Mediana + p90**, nunca só média. Média de 4,9h escondia 92% respondidos
  em menos de 1 hora e 7 casos esquecidos.
- **Toda dimensão é enum**, nunca texto livre (`TotalPass` e `Totalpass`
  apareciam como origens separadas).
- **Gargalo real:** só 8,3% dos leads aceitam a oferta de entrada, e quem
  aceita converte bem. Conteúdo e motor devem priorizar `risk_free_entry`.

---

## 7. Custo de IA

O protótipo injeta a biblioteca inteira no prompt a cada análise
(~15–20 mil tokens de entrada por atendimento). Quanto melhor a biblioteca,
mais caro fica — o ativo é cobrado como passivo.

Correção: recuperação semântica (4–6 trechos), cache de prefixo,
modelo pequeno para classificar e modelo forte só em fechamento,
e `usage_ledger` por tenant desde a primeira migration.

---

## 8. Aprendizado: seja honesto sobre o limite

Com 11 matrículas por mês, uma empresa sozinha **não** produz aprendizado
estatisticamente válido. Aprendizado real só liga com agregação entre dezenas
de empresas (respeitando privacidade, mínimo de k empresas, opt-out).
Até lá, a Commercial Memory é escrituração honesta. **Não vender "IA que
aprende" antes disso.**

---

## 9. Próximos passos

1. ✓ 0004 confirmado e P0 fechados (0006). Segue: validador de Skill e P1/P2 (0007)
2. Biblioteca da Skill Barbearia (mesma estrutura, conteúdo próprio)
3. Sair do SQL manual: Node + loader e validador de Skill em TypeScript
4. Motor de decisão (Parte 2 do Blueprint)
5. Onboarding com extração de DNA por entrevista — **gargalo de escala do
   produto**, não está em nenhum dos 8 documentos originais

---

## 10. Como trabalhar

- **Claude Code** é o caminho para o código: roda na máquina, lê o repositório,
  executa testes e envia para o GitHub.
- **Claude in Chrome** permite que o Claude leia páginas (GitHub, Supabase)
  no navegador do fundador.
- Neste chat, o Claude **não** consegue ler o GitHub: o site bloqueia acesso
  automatizado.
- **Arquivos do Projeto** persistem entre conversas — é ali que este documento
  e o Blueprint devem ficar.

---

## 11. Critério de pronto do motor

> Duas empresas de segmentos diferentes. Cada uma escolhe o segmento no
> cadastro e recebe sua própria base de conhecimento. Cada uma recebe análise
> contextual baseada no seu DNA e no histórico daquele cliente. Nenhuma
> enxerga uma linha da outra. **E não se escreveu código nenhum entre
> configurar a primeira e a segunda.**
