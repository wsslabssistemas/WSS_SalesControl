# COS — Plano de Execução

> A fila de trabalho, em ordem. Marque o que fechar e registre o que aprendeu.
> **Decidido com o fundador em 1º de agosto de 2026.**
>
> Ordem de leitura: `ESTADO_DO_PROJETO.md` → este arquivo.

---

## O que está CONGELADO por decisão (não reabrir sem motivo novo)

Um plano vale tanto pelo que exclui quanto pelo que inclui. Estes itens são
importantes e **não são agora**:

| Congelado | Por quê |
|---|---|
| **Migrar os dados da Be Fitness do Base44** | Decisão do fundador. Trabalho grande, valor de aprendizado baixo — o que falta provar não está nesses dados. |
| **Automação (WhatsApp Cloud API + motor proativo agendado)** | Decisão do fundador: automatizar antes de provar que a resposta manual é boa é otimizar a coisa errada. Depende de conta Meta e amarra o produto num canal antes da hora. |
| **M2 — ligar desfecho a escola** | Bloqueado por dado, não por código: **0 desfechos registrados**. Sem uso real não há o que medir. |
| **Volume da prospecção (base própria da Receita)** | Custo e esforço altos para um gargalo que hoje não é o gargalo. |

Quando a automação voltar, ela entra na ordem: canal de envio → motor proativo
agendado → cobrança automática.

---

## A fila

### 1. Prova do motor ponta a ponta — **o que fazer primeiro**

**Por que é o primeiro:** hoje existem **145 entradas curadas que ninguém nunca
viu funcionando**. Pior: em **5 dos 8 segmentos demo não há DNA nenhum**
(clínica, distribuidora, escola esportiva, indústria, sob medida), e sem DNA a
trava anti-invenção escala em tudo — o motor não redige. Curadoria que nunca
rodou é hipótese, não ativo. E até anteontem a biblioteca dos segmentos sequer
chegava ao motor.

- [x] **DNA de demonstração para os 5 segmentos sem DNA.**
      `packages/db/seeds/demo_dna.sql` + `scripts/seed-demo-dna.mjs`. Dado
      fictício, `source = 'demo_seed'` (migration `0028`) para o registro se
      identificar sozinho, além do prefixo `demo-` no slug.
- [x] **Teste determinístico da escolha de técnica** —
      `packages/db/tests/retrieval_check.mjs`, 22 casos com valor esperado
      escrito. Roda de graça, sem IA: mede o que decide a qualidade antes de
      qualquer token. **22/22, todos em 1º lugar.**
- [x] **Bateria com IA** — `scripts/provar-motor.mjs`, 8 mensagens reais.
      Resultado abaixo.

### O que a prova mostrou (ago/2026)

**Funcionou:**
- **A trava segura de verdade.** "Conseguem entregar 3 mil metros até sexta?"
  → o motor deu o prazo real (20 dias úteis), explicou o que faz o relógio
  começar a contar e ofereceu negociar escopo. Não prometeu a data.
- **A escola é respeitada e citada**, com o "não usar quando" junto: *"não se
  usa fechamento por pressão aqui porque é venda de ciclo longo"*.
- **Indecisão ≠ objeção**, na prática: *"o cliente não travou por preço — ele já
  disse que gostou"*. É o M3 fazendo efeito.
- **Autosserviço respeitado**: quem pediu por escrito recebeu ficha completa,
  duas perguntas por escrito e amostra — nenhuma insistência em ligar.
- Nenhum fato inventado e **nenhuma etapa de jornada inexistente** citada.

**Falhas encontradas e corrigidas na hora:**
1. **`custa` e `custam` eram palavras ignoradas** em `lib/match`. "Quanto custa
   um implante?" virava só `["implante"]` e casava com catálogo em vez de preço
   — a pergunta mais comum do funil perdia a palavra que a define.
2. **A curadoria antiga tinha se apropriado dos gatilhos de indecisão.** Em
   `sob_medida`, `escola_esportiva` e `automacao`, entradas de `objections`
   escritas antes do M3 carregavam "vou pensar", "vou falar com meu marido",
   "vou levar para a diretoria" — e empatavam com a entrada de indecisão. Os
   gatilhos foram para o dono certo.
3. **`free_notes` existia em 4 dos 8 manifestos.** Diferença arbitrária;
   uniformizado.

**Decidido depois da prova:**

- ✅ **A trava anti-invenção virou estrutural** (`lib/facts.ts`). Era 100%
  prompt: pedíamos ao modelo que escalasse e confiávamos no julgamento dele,
  enquanto `required_facts` — o contrato curado há meses — era buscado do banco
  e **nunca usado**. Agora o código cruza o exigido com o DNA e **a trava tem a
  palavra final**: o modelo pode escalar por conta própria, mas não pode deixar
  de escalar.
  **Regra do veto, calibrada em campo:** só a entrada que GOVERNA a resposta (a
  que casou melhor) trava; as 3 primeiras apenas informam o que não pode ser
  afirmado. Sem isso o motor se recusava a dizer a faixa de preço que tinha no
  DNA porque uma entrada vizinha exigia a tabela de planos — escalada indevida
  mata o produto tão rápido quanto invenção.
  Teste: `packages/db/tests/facts_lock_test.mjs`.
- ✅ **Custo mantido como está.** Decisão do fundador: o vendedor provavelmente
  não lê a explicação (ele testou isso na academia), mas **vendemos o oposto do
  atalho** — o produto que ensina precisa ensinar de verdade, inclusive quando
  ninguém lê. Fica registrado o número: ~R$ 0,25 por resposta, ~R$ 125/mês por
  empresa a 500 atendimentos.
  *Opção parada para o futuro, sem urgência:* gerar os campos de ensino só
  quando o vendedor clicar "por quê?" — preserva o discurso e corta o custo.

**Aberto:**
- **Ruído no ranking**: em "o importado sai mais barato", a entrada de indecisão
  ficou em 1º porque a mensagem continha "aprovou". Inofensivo hoje (as 8
  primeiras entram no contexto), mas piora conforme a biblioteca cresce — e
  agora importa mais, porque a 1ª entrada é quem veta.

### 2. Fechar a auditoria pendente

**Por que agora:** é a lista do `CLAUDE.md` marcada como "corrigir antes de
qualquer cliente externo". Tudo aqui é código, não depende do fundador.

- [x] **DNA sem `updated_at` por seção.** Resolvido no `0029`:
      `section_updated_at` carimba **por seção**, e o carimbo sobrevive ao
      versionamento — salvar sem mudar não renova a data, senão abrir-e-salvar
      viraria "revisão" e o alarme desligaria sozinho. A regra é função pura
      (`dna_section_stamps`), testada em `dna_freshness_test.sql` (5/5). A tela
      de DNA mostra a idade por seção e alerta acima de 6 meses.
- [ ] **Dinheiro como string** no DNA (`"R$ 169,00"`). Inteiro em centavos +
      moeda, como já manda o `lib/money.ts`.
      **Adiado com motivo:** mexe no editor de DNA, nos seeds, no prompt e no
      dado já gravado das empresas reais — e o ganho (análise por faixa de
      preço) é de um relatório que ainda não existe. Fazer junto com o primeiro
      relatório que precise disso, não antes.
- [x] **`tenants.skill_key` × `tenant_skills`.** Não era contradição, era papel
      diferente: a junção é o que está **instalado** (fonte da RLS), a coluna é a
      Skill **ativa** (evita join em toda página). A regra única que precisa
      valer virou teste — *a ativa tem que estar entre as instaladas* —
      `tenant_skill_coherence.sql`, 9/9 coerentes.
- [x] **Filtro `demo-` do `dna_coverage_check.sql`.** Resolvido sem mexer nos
      dados do fundador: **o prefixo protege escrita, diagnóstico é leitura e
      olha todo mundo**, cada empresa contra a biblioteca do próprio segmento.
      Ao cruzar com o `facts_lock_test` as duas checagens discordaram e a culpa
      era do SQL: entradas **sem** fato exigido (as de indecisão) geravam linha
      nula no `left join` e eram contadas como ESCALA — quem não exige nada
      aparecia como bloqueado. Hoje: Be Fitness 23/23 PRONTA, Academia Nova
      7/23, demos 0 em escala.
- [ ] **Telefone em E.164** (código de país e 9º dígito). Hoje normaliza só
      dígitos — pega duplicidade, que é o que importava.
      **Adiado com motivo:** E.164 de verdade precisa de biblioteca de
      telefonia; normalizar no chute corrompe número de cliente, e número
      corrompido não se recupera. Fazer quando houver envio por WhatsApp (a
      API exige o formato) — ou seja, junto com a automação, hoje congelada.

### 3. Skill `energia_solar`

**Por que:** o fundador perguntou e a resposta honesta é que hoje **não
atendemos**. `sob_medida` diz "solar" no nome e tem `energia_solar` como opção de
campo, mas **nenhuma das 16 entradas fala de solar** — o vendedor teria funil sem
técnica. Mercado grande, funil já existe, custo é só curadoria.

- [x] Manifesto próprio, **9/9 válidos**. Jornada com uma etapa que nenhum outro
      segmento tem: **`em_execucao`, não-terminal** — é onde o cliente já pagou e
      espera semanas pela concessionária, e onde a reputação se ganha ou se perde.
- [x] **18 entradas curadas** (`0030`), com o que é específico do ramo.
- [x] **Solar Demo** + DNA de demonstração (28 campos, 14 obrigatórios).

**A pesquisa mudou o desenho em quatro pontos:**
1. **A conta de luz é o dado de entrada.** Sem ela não há dimensionamento nem
   payback. A entrada de preço não cota — pede a conta.
2. **O cliente nunca zera a conta.** O custo de disponibilidade continua
   (30 kWh mono, 50 bi, 100 tri). É a promessa mais comum do setor e a que mais
   gera processo — virou `hard_rule` do manifesto **e** a entrada mais
   importante da biblioteca.
3. **Entre instalar e economizar existem 40 a 100 dias** de homologação (REN
   1.059/2023). O prazo é da concessionária, a ansiedade é do cliente e a culpa
   cai no instalador. Daí a cadência `pos_venda`, que dá posição antes de ele
   perguntar.
4. **O relógio regulatório corre contra a espera.** O Fio B é progressivo (60%
   em 2026, 75% em 2027, 90% em 2028) e trava na homologação. É a única urgência
   **real** deste mercado — e por isso a entrada "vou esperar baratear" pode
   usá-la sem inventar escassez.

**Provado com IA:** perguntado "fica zero?", o motor respondeu que **não zera**,
explicou o custo mínimo por padrão de ligação e pediu a conta. A entrada fez
exatamente o que foi escrita para fazer.

### 4. Kit de revisão da biblioteca de indústria

**Por que:** a curadoria veio de pesquisa, não de vivência — é a distância entre
boa e excelente. A especialista (Feltros Bandeirantes) revisa quando puder; o que
depende de nós é **deixar fácil**.

- [x] **`scripts/kit-revisao.mjs <segmento>`** gera o kit direto do banco, em
      dois formatos, porque servem a momentos diferentes:
      **`.html`** para LER (abre no celular, uma tela por situação, imprimível)
      e **`.csv`** para RESPONDER (planilha volta; PDF comentado não volta).
      Saída em `revisao/`, fora do Git — é resultado, não fonte.
- [x] Por situação, três perguntas fechadas: *está certo no dia a dia? · o que
      falta ou está errado? · como **você** diria?*
- [x] E cinco perguntas de fechamento que valem mais que as 20 anteriores:
      **A.** que pergunta o cliente faz toda semana e não está aqui;
      **B.** o que faz o comprador perder a confiança na hora;
      **C.** o que soa como "gente de fora falando";
      **D.** falta ou sobra etapa na jornada;
      **E.** falta alguma informação no cadastro do cliente.
      As D e E fazem a especialista revisar a **estrutura**, não só o texto.

**Uma decisão de integridade:** o texto interno é ASCII sem acento, e ficaria
mais bonito reescrito por IA. Não foi — ela precisa revisar o que o sistema
**realmente diz**, não uma paráfrase. O kit explica isso em uma linha e pede
para julgar o conteúdo, não a forma.

Gerado também para `energia_solar` (18 situações): a Skill nasceu de pesquisa e
tem o mesmo limite.

### 5. Módulo de curso

**Por que:** o conteúdo já existe (`COS_Escolas_de_Venda.md` tem a espinha de 8
aulas). Falta forma. É linha de receita nova que reaproveita o ativo — e o
diferencial já está definido: ensinar **com nota de evidência**, separando
pesquisa séria de folclore repetido.

- [ ] Decidir o formato (dentro do painel? material à parte? ao vivo?).
- [ ] Aula piloto para validar antes de produzir as 8.

### 6. Depois disso

- [ ] **Qualificação de compra (MEDDIC-lite)** — orçamento, processo de
      aprovação, critério de decisão e defensor interno. Já temos `decisor`.
- [ ] **Fila de segmentos**: salão de beleza, pet, imobiliária, oficina, curso,
      eventos. (Restaurante segue descartado.)
- [ ] **Google Agenda mão dupla** — exige OAuth e ação do fundador.
- [ ] **Score de potencial → preço sugerido**, para o Kairós vender a si mesmo.

---

## O limite que nenhum item acima resolve

**A validação continua N=1.** A tese da Skill só está provada quando uma segunda
empresa, **de outro segmento**, rodar no mesmo núcleo sem ninguém escrever
código. Isso não depende de código nosso — depende de colocar uma empresa real
para usar. Enquanto não acontecer, o produto é uma hipótese bem construída.

Com a automação congelada, o caminho mais curto para essa prova é o cockpit
manual: copiar e colar funciona, e é suficiente para uma primeira empresa
externa usar de verdade.
