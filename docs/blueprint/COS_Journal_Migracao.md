# JOURNAL — MIGRAÇÃO PARA O COS
### Memória estratégica da construção da plataforma

**Produto:** Commercial Operating System (COS) · **Fabricante:** WSS Labs
**Tipo:** Documento vivo · **Início:** julho de 2026

> Este Journal segue as regras do Journal 2.0: nenhum registro entra sem
> responder o que aprendemos, o que mudou, por que mudou e o que decidimos.
> Ele existe para que a evolução do COS nunca dependa da memória de ninguém.

---

## LINHA DO TEMPO

```
Julho/2026   Protótipo validado no Base44 (Be Fitness)
     ↓
Julho/2026   Decisão de migrar: no-code não gera ativo vendável
     ↓
Julho/2026   Auditoria dos 8 documentos de fundação
     ↓
Julho/2026   Blueprint Parte 1 (fundação técnica)
     ↓
Julho/2026   Blueprint Parte 1 v1.1 (taxonomia + camada proativa)
     ↓
Julho/2026   Blueprint Parte 2 (CIE) — ancorado em dados reais de operação
     ↓
Julho/2026   Primeiro código: banco, RLS e teste de isolamento — 7/7 PASSOU
     ↓
Julho/2026   Skills academia e barbearia carregadas como DADO
     ↓
Julho/2026   Hardening 0006 — P0 fechados (biblioteca server-side, decisions append-only)
     ↓
Julho/2026   Validador de Skill iniciado (RF-02) — achado o 1º required_fact quebrado
```

---

# 01 — VISÃO ESTRATÉGICA

## Registro 001 — Mudança de posicionamento: de sistema para motor

**Antes:** sistema de atendimento comercial para academias.
**Depois:** motor de inteligência comercial multi-tenant, onde academia é
apenas a primeira Skill instalada.

**Motivo:** todo negócio que vende sofre do mesmo problema — conhecimento
comercial que vive na cabeça das pessoas e some quando elas saem. O segmento
muda o vocabulário, não a estrutura.

**Impacto:** o produto vendável passa a ser o núcleo. Módulos deixam de ser
sistemas separados e viram arquivos de configuração.

## Registro 002 — Saída do Base44

**Problema:** o protótipo funciona e está em uso diário, mas não é vendável.
Faltam três coisas estruturais: posse dos arquivos, multi-tenancy real e
controle de custo de IA.

**Decisão:** reconstruir sobre stack próprio. **Não migrar o sistema, mas
extrair a biblioteca comercial** — o código é descartável, a curadoria não.

**Aprendizado registrado:** o ativo do projeto nunca foi o software. É a
biblioteca comercial curada (Girard, Belfort, Hormozi, Tracy aplicados a
contexto real, com objeções, erros comuns e caminhos alternativos). Código se
copia em duas semanas; aquilo, não.

---

# 02 — DECISÕES

## Decisão 001 — Stack

**Contexto:** fundador iniciante, trabalhando sozinho, precisa vender para
várias empresas.

**Alternativas avaliadas:** Next.js + Supabase; Next.js + Neon + auth separado.

**Decisão:** Next.js 15 + TypeScript + Supabase + Vercel, com Drizzle,
pgvector, Inngest, Vercel AI SDK e Hono em rota catch-all.

**Justificativa:** o critério decisivo não foi produtividade, foi **isolamento
de dados**. O Supabase usa Postgres com RLS, o que coloca a regra de isolamento
dentro do banco. Para um fundador sozinho, essa é a diferença entre um bug
chato e um bug fatal. Postgres puro também significa zero aprisionamento — o
oposto do problema que motivou a saída do Base44.

**Status:** ativa. Implementada e testada.

## Decisão 002 — Duas versões de produto: manual e automática

**Contexto:** o fundador quer vender as duas.

**Decisão:** manual (copia-e-cola) primeiro, automática depois.

**Consequência arquitetural inegociável:** o núcleo **não pode saber por onde
a mensagem chegou**. Ele recebe contexto e devolve decisão. Na versão manual
quem entrega é a recepcionista; na automática, a API. Por isso `DecisionInput`
não tem campo de canal.

**Justificativa comercial:** vira escada de preço. Plano de entrada barato e
sem risco técnico; upgrade natural depois que o cliente já viu valor.

## Decisão 003 — WhatsApp só por API oficial

**Alternativas:** provedores não-oficiais (Evolution, Z-API) são baratos e
rápidos de integrar.

**Decisão:** quando chegar a versão automática, apenas API oficial da Meta.

**Justificativa:** provedor não-oficial arrisca **banir o número do cliente
pagante**. Tolerável no negócio próprio; inaceitável em software vendido.
Uma academia que perde o canal de vendas por causa do sistema não só cancela,
como fala mal.

## Decisão 004 — Prospecção fria B2C não será construída

**Decisão:** o COS não oferece disparo frio para pessoa física. B2B frio, com
dados públicos, é permitido.

**Justificativa dupla:** banimento por denúncia no WhatsApp e base legal
frágil sob LGPD para marketing direto a quem nunca teve relação. Em B2C o
crescimento vem de indicação, reativação e resgate — que convertem mais e não
queimam o canal.

**Revisar:** antes de qualquer mudança, consultar advogado. Não é opinião
jurídica.

## Decisão 005 — Cobrança por atendimentos, nunca por tokens

**Contexto:** o fundador propôs mostrar "mensalidade + custo de IA" separados.

**Decisão:** cobrar por faixa de atendimentos/mês, com excedente por atendimento.

**Justificativa:** cobrar IA visível cria três problemas — conta imprevisível
trava venda, o cliente passa a economizar justamente o uso que gera valor, e o
produto vira revenda de token comparável ao preço da API. Atendimento é a moeda
do negócio do cliente e sobe junto com o custo real.

## Decisão 006 — Blueprint enxuto, não documento de 300 páginas

**Contexto:** havia proposta de um Master Blueprint de 150 a 300 páginas antes
de escrever código.

**Decisão:** Blueprint de 40 a 60 páginas, em Markdown, versionado dentro do
repositório, entregue em partes.

**Justificativa:** documento desse tamanho leva semanas e envelhece na terceira
semana de implementação. Planta baixa precisa acompanhar a obra.

## Decisão 007 — Vendedor não é tabela

**Problema observado no protótipo:** nomes digitados à mão criavam "vendedores
fantasma" que apareciam no relatório e não podiam ser excluídos.

**Decisão:** vendedor é um `membership` (vínculo usuário ↔ empresa) com papel
`agent`. O problema deixa de ser possível por construção.

## Decisão 008 — Etapa da jornada é texto validado por manifesto

**Alternativa rejeitada:** enum no banco.

**Justificativa:** enum obrigaria uma migration a cada segmento novo, o que
quebraria a Lei 2 (Skill é dado). A jornada vem do manifesto da Skill.

## Decisão 009 — Jornada é grafo, não linha

**Contexto:** o fundador observou que o cliente pode pular ou voltar etapas.

**Decisão:** permitir avanço, salto e regressão, com `contact_stage_history`
append-only.

**Justificativa:** o campo de etapa guarda só o estado atual. Sem histórico é
impossível responder quanto tempo alguém ficou parado na proposta ou quantos
leads regridem depois do orçamento.

## Decisão 010 — Separação estratégia/fato na biblioteca

**Problema:** nas entradas originais, conhecimento comercial e fatos da empresa
estavam fundidos no mesmo texto ("planos a partir de R$ 99... mas antes deixa
eu entender teu objetivo").

**Decisão:** a entrada guarda a **estratégia** com `required_facts`; os números
vêm do `commercial_dna`.

**Impacto:** é o que permite a segunda academia receber as entradas funcionando
em 30 minutos de onboarding, sem reescrever nada. **É o modelo de negócio
virando código.**

## Decisão 011 — Trava anti-invenção

**Problema:** três bugs reais do protótipo — negar a terapia holística que
existe, oferecer "vaga no teu horário" numa academia de acesso livre, e afirmar
que o recorrente não usa limite do cartão.

**Causa raiz comum:** o modelo respondeu de memória sobre fatos não declarados.

**Decisão:** entre a classificação e a redação existe verificação de código.
Se falta fato exigido, o motor devolve `escalate` e **não redige**.

**Aprendizado:** prompt não resolve essa classe de erro. Verificação estrutural
resolve.

## Decisão 012 — Nome do produto

**Decisão:** COS como plataforma, WSS Labs como fabricante. "WSS Sales Control"
e "Sales Mentor" ficam com o protótipo.

**Justificativa:** "Control" é a palavra de CRM, e os documentos de fundação
dizem em várias páginas que o COS não é isso. A marca fica isolada em variável
de ambiente — trocar depois custa uma linha.

## Decisão 013 — Hardening P0 antes de cliente externo

**Contexto:** a auditoria apontou dois P0 que bloqueiam qualquer cliente externo.

**Decisão (migration 0006):** (1) a biblioteca curada sai do alcance de
`authenticated` — `skills` só via Skill instalada, `knowledge_entries` só o
conhecimento do próprio tenant; a biblioteca global fica com `service_role`
(retrieval server-side). (2) `decisions` vira append-only de verdade por trigger
de coluna: só `outcome`, `outcome_at`, `executed_at` mudam depois da inserção,
para todo papel inclusive `service_role`.

**Justificativa:** RLS é row-level — não protege coluna nem esconde a linha
global de quem tem SELECT. A defesa real é estrutural, não de aplicação. DELETE
segue livre em `decisions` (cascata LGPD): append-only é "não reescreve", não
"nunca apaga".

**Status:** ativa. Aplicada e provada — `hardening_test.sql` 6/6 PASSOU.

---

# 03 — APRENDIZADOS

## Aprendizado 001 — Os documentos descrevem uma empresa de 50 engenheiros

O GRD original lista dez "Engines". Na v1, oito deles são o mesmo prompt com
contexto diferente. Criar dez pastas para honrar o documento produziria
arquitetura vazia — a forma mais cara de spaghetti.

**Correção:** três motores reais (Context, Decision, Memory). Os outros são
fronteiras conceituais, promovidas a módulo só quando houver dor concreta.

## Aprendizado 002 — Dois princípios da fundação estavam em conflito

O Princípio 21 (inteligência compartilhada) versus o 22 (privacidade
inegociável). Não se resolve com boa intenção: dado bruto isolado por tenant e
camada separada de agregados anônimos, com mínimo de k empresas.

## Aprendizado 003 — Um princípio era incompatível com o stack

O Princípio 12 ("trabalhar mesmo quando ninguém está trabalhando") exige
processo rodando de madrugada. Vercel é serverless efêmero. Proatividade real
exige cron + fila + worker. Não é detalhe de implementação; é peça de
arquitetura que os documentos não previam.

## Aprendizado 004 — O roadmap misturava dois produtos

Academia, barbearia, salão e clínica são o mesmo produto: B2C local, ticket
baixo, ciclo de dias, um decisor, WhatsApp. Automação industrial, SaaS e
licitações são outro: B2B, ciclo de meses, vários decisores, proposta técnica.
Servir os dois com a mesma Skill engine no ano 2 produziria um núcleo genérico
e ruim.

## Aprendizado 005 — A validação é N=1

Be Fitness é do próprio fundador. Toda a fundação de 5 anos se apoia numa
validação onde ele é o cliente, o vendedor e o produto. **O conceito de Skill
só está provado quando uma segunda empresa, com dados diferentes, roda no mesmo
núcleo sem ninguém escrever código.**

## Aprendizado 006 — O gargalo do produto é o onboarding

Tudo que faz o protótipo funcionar são dados digitados à mão ao longo de
semanas. Se cada cliente novo exigir isso, o produto não escala e a mensalidade
não paga o tempo do fundador. **O extrator de DNA por entrevista é tão crítico
quanto o CIE, e não está em nenhum dos 8 documentos originais.**

## Aprendizado 007 — As 12 categorias são universais

Por engenharia reversa da biblioteca real, onze das doze categorias são
idênticas em qualquer segmento. A biblioteca escrita pensando só em academia
já tinha um esqueleto genérico dentro. **É a prova empírica da tese do COS.**

## Aprendizado 008 — O painel media errado

Descobertas nos dados reais de julho/2026:

- Conversão calculada sobre atendimentos (2,3%) em vez de leads (6,5%). A
  métrica principal punia o follow-up, que é o comportamento que o sistema
  existe para provocar.
- "8 matrículas" eram 5 pessoas: contagem de eventos, não de pessoas.
- Média de 4,9h de resposta escondia 92% respondidos em menos de 1 hora e
  7 casos esquecidos. Média mente em distribuição com cauda longa.
- `TotalPass` e `Totalpass` apareciam como origens diferentes.

**Consequência para o produto:** quando isso virar SaaS, o erro deixa de ser um
incômodo interno e passa a ser um cliente decidindo errado por causa do software.

## Aprendizado 009 — O funil quebra antes do trial

169 leads → 23 visitas → 14 trials → 11 matrículas. Praticamente toda a
biblioteca conduz para a experiência gratuita, e só 8,3% dos leads chegam lá.
Quem chega converte bem. **O gargalo é o aceite do trial, não a conversão dele.**

## Aprendizado 010 — O ativo era cobrado como passivo

O protótipo injeta a biblioteca inteira no prompt a cada análise. Quanto melhor
a biblioteca fica, mais caro cada atendimento custa. Recuperação semântica
corta cerca de 70% e desacopla custo de tamanho da biblioteca.

## Aprendizado 011 — Não existe "IA que aprende" ainda

Com 11 matrículas por mês, uma empresa sozinha não produz aprendizado
estatisticamente válido. Só liga com agregação entre dezenas de empresas.
Até lá, a Commercial Memory é escrituração honesta. Prometer aprendizado antes
disso seria o "IA por marketing" que o próprio Compromisso da Bible proíbe.

## Aprendizado 012 — Três tipos de dado no mesmo campo

No protótipo, "conversa do cliente" guardava mensagem real, anotação do vendedor
para a IA, e mensagens que o próprio sistema iniciou. Isso quebra o aprendizado
silenciosamente e polui a busca semântica.

**Correção:** `input_kind` com três valores. Só mensagem real entra em embedding
e em métrica de resposta.

## Aprendizado 013 — Proatividade sem capacidade é lista ignorada

Agenda real: quarta 21 compromissos, quinta 44, sexta 18, com três vendedores
e 20 retornos atrasados. As regras automáticas agendavam sem noção de
capacidade. **Um motor proativo que ignora capacidade produz uma lista que o
vendedor aprende a ignorar** — é a morte silenciosa do recurso.

## Aprendizado 014 — Campanha e fila são telas diferentes

Oportunidade por sinal é fila individual priorizada (o dia do vendedor).
Campanha de coorte é lote revisado e aprovado pelo gestor. Misturar as duas foi
o que deixou a lista de clientes do protótipo ilegível.

## Aprendizado 015 — `required_facts` sem validação já tinha vítima

A auditoria previu (P1) que um caminho com typo em `required_facts` deixaria a
entrada em ESCALA para sempre. Ao construir o validador, o cruzamento contra o
manifesto achou o primeiro caso real: a entrada de categoria `reciprocity` exige
`reciprocity.gift`, mas `reciprocity` é categoria, não seção de DNA — nenhum DNA
satisfaz. A entrada nunca redige.

**Aprendizado:** o contrato `required_facts → dna_sections` precisa de verificação
automática (`required_facts_check.sql`), não de revisão humana. Falhar na direção
segura é o pior tipo de falha: não gera erro, só silêncio.

---

# 04 — HIPÓTESES EM ABERTO

| Hipótese | Como validar | Status |
|---|---|---|
| Uma Skill nova entra sem código | Instalar barbearia e operar sem tocar no núcleo | Manifesto pronto, falta biblioteca |
| Onboarding de DNA cabe em 30 min | Cronometrar com uma empresa real que não seja a Be Fitness | Não iniciado |
| O aceite do trial melhora com conteúdo dedicado | Medir taxa de trial antes e depois | Não iniciado |
| Empresa paga por atendimentos sem atrito | Primeira venda externa | Não iniciado |

---

# 05 — O QUE NÃO ENTRA NESTE JOURNAL

Discussões sem aprendizado. Decisões sem justificativa. Ideias repetidas.
Problemas sem contexto. Informações temporárias.

---

# 06 — REGISTRO DE EXECUÇÃO

| Data | Entrega | Resultado |
|---|---|---|
| jul/2026 | `0001_foundation.sql` | 19 tabelas criadas |
| jul/2026 | `0002_rls.sql` | RLS em todas as tabelas com `tenant_id` |
| jul/2026 | `isolation_test.sql` | **7 de 7 PASSOU** |
| jul/2026 | `0003_seed_skills.sql` | 2 Skills carregadas |
| jul/2026 | `0004_seed_knowledge_academia.sql` | 22 entradas — confirmado no banco (22) |
| jul/2026 | `demo_tenants.sql` + `dna_coverage_check.sql` | 2 empresas demo; trava de DNA validada |
| jul/2026 | `0006_hardening.sql` | P0 fechados; `hardening_test.sql` 6/6 PASSOU |
| jul/2026 | `required_facts_check.sql` | achou 1 caminho quebrado: `reciprocity.gift` |

**Incidente registrado:** o teste de isolamento falhou na primeira execução por
falta de permissão na tabela temporária de resultados. O erro foi útil: mostrou
o RLS bloqueando uma escrita não autorizada, que é exatamente o comportamento
esperado.
