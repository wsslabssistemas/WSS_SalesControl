# ESTADO DO PROJETO — COS (WSS Kairós)
**Última atualização:** 1º de agosto de 2026
**Fabricante:** WSS Labs · **Fundador:** William

> Este documento existe para que qualquer conversa nova possa retomar o projeto
> sem repetir discussões encerradas. **Leia antes de propor qualquer coisa.**
>
> Ordem: este arquivo → `COS_Tese_de_Mercado.md` (por que existe e para quem) →
> `COS_Mapa_de_Segmentos.md` (o que cobrimos) → `../../CLAUDE.md` (as três leis).

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
- **Painel do fabricante** — cross-tenant, custo de IA, margem, **Acesso e
  planos** (teste grátis e liberação de módulos por empresa).

### Segmentos — 7 completos, 116 entradas curadas
| Segmento | Biblioteca | Módulos |
|---|---|---|
| `academia` | 22 | — |
| `barbearia` | 18 | — |
| `escola_esportiva` (natação, lutas, crossfit, pilates, clubes) | 16 | — |
| `clinica` (médica, odonto, estética) | 15 | — |
| `sob_medida` (marcenaria, vidraçaria, serralheria, solar) | 15 | prospecção + licitações |
| `automacao` (predial, climatização, energia) | 15 | prospecção + licitações |
| `distribuidora` (atacado) | 15 | prospecção |

Empresas de demonstração existem para todos (`demo-*`), vinculadas ao fundador —
trocar no seletor do topo do painel.

### Infra
- Migrations `0001`–`0025` aplicadas. RLS em tudo com `tenant_id`.
- `scripts/seed-skills.mjs` · `scripts/seed-knowledge.mjs` ·
  `scripts/criar-tenant-demo.mjs`.
- `SUPABASE_SERVICE_ROLE_KEY` em `apps/web/.env.local` (dá para semear e migrar
  direto daqui). `AI_API_KEY` (Anthropic) na Vercel e local.

---

## 3. Pendências (em ordem de importância)

1. **Itens do edital na tela.** A busca do PNCP casa com o texto completo do
   edital (inclui a lista de itens) — por isso aparecem editais sem a palavra
   visível na descrição, e o fundador estranhou com razão. `getEditalItens`
   (`lib/licitacoes.ts`) já traz os itens marcando quais batem; **falta expor na
   UI** ("por que este edital apareceu").
2. **Segmento `industria`** (8º). Pesquisa do fundador (ago/2026) mapeou o parque
   industrial RS/BR e apontou a indústria B2B como o maior oceano azul: vende
   **através de representante** com "pasta fechada", sem prospecção ativa, e o
   alerta mais valioso é **lojista sem reposição há 90 dias**. Cobre têxtil/
   feltro (caso real: irmã do fundador na Feltros Bandeirantes), calçadista,
   moveleira, metal-mecânica, embalagens, autopeças. **Vantagem: especialista
   real disponível para revisar a curadoria.**
3. **Levantar as técnicas de venda que usamos** — o fundador pediu um estudo das
   influências/mentores por trás da biblioteca e um **parecer honesto** sobre se
   já somos excelência ou o que falta. **Não foi feito.**
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
npm run -w @cos/skill-loader validate     # manifestos (deve dar 7/7)
node scripts/seed-skills.mjs              # recarrega manifestos no banco
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
