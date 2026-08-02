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

- [ ] **DNA de demonstração para os 5 segmentos sem DNA.** Vai em
      `packages/db/seeds/` (demo seed, nunca em produção), com dado plausível e
      declaradamente fictício.
- [ ] **Rodar mensagens reais nos 8 segmentos** — preço, objeção, indecisão,
      autosserviço, recompra — e ler o que o motor devolve.
- [ ] **Corrigir o que sair errado.** Suspeitas a confirmar: prompt longo demais
      com a biblioteca inteira, escola errada escolhida, escalada em excesso,
      resposta genérica onde a entrada era específica.
- [ ] **Registrar o resultado por segmento** neste arquivo — é a primeira
      medida real de qualidade que o projeto vai ter.

### 2. Fechar a auditoria pendente

**Por que agora:** é a lista do `CLAUDE.md` marcada como "corrigir antes de
qualquer cliente externo". Tudo aqui é código, não depende do fundador.

- [ ] **DNA sem `updated_at` por seção.** A trava verifica presença, não
      atualidade: DNA de um ano atrás passa como PRONTA. É o furo com maior
      chance de fazer o motor afirmar preço velho.
- [ ] **Dinheiro como string** no DNA (`"R$ 169,00"`). Inteiro em centavos +
      moeda, como já manda o `lib/money.ts`.
- [ ] **`tenants.skill_key` × `tenant_skills`.** O schema se contradiz sobre uma
      ou várias Skills por empresa. Decidir antes do primeiro cliente externo.
- [ ] **Filtro `demo-` do `dna_coverage_check.sql`.** Hoje volta vazio porque
      `be-fitness` e `academia-nova` não têm o prefixo — a checagem é um no-op.
      **É diagnóstico, não a trava de runtime** (essa é `required_facts` +
      `on_missing_facts`, e funciona). Decisão de dado do fundador: renomear os
      slugs ou ajustar o filtro.
- [ ] **Telefone em E.164** (código de país e 9º dígito). Hoje normaliza só
      dígitos — pega duplicidade, mas não é formato oficial.

### 3. Skill `energia_solar`

**Por que:** o fundador perguntou e a resposta honesta é que hoje **não
atendemos**. `sob_medida` diz "solar" no nome e tem `energia_solar` como opção de
campo, mas **nenhuma das 16 entradas fala de solar** — o vendedor teria funil sem
técnica. Mercado grande, funil já existe, custo é só curadoria.

- [ ] Manifesto próprio (não remendar `sob_medida`: o DNA de solar —
      `conta_de_luz`, `payback`, `financiamento`, `homologacao` — poluiria o DNA
      de quem faz armário).
- [ ] ~15 entradas curadas com o que é específico: conta de luz como dado de
      entrada, simulação de payback, financiamento dentro da venda, homologação
      na concessionária, Lei 14.300 e a cobrança gradual do fio B, garantia de 25
      anos do painel contra 10 do inversor.
- [ ] Empresa demo + DNA de demonstração.

### 4. Kit de revisão da biblioteca de indústria

**Por que:** a curadoria veio de pesquisa, não de vivência — é a distância entre
boa e excelente. A especialista (Feltros Bandeirantes) revisa quando puder; o que
depende de nós é **deixar fácil**.

- [ ] Exportar as 20 entradas em formato legível por quem não é técnico
      (uma página por entrada: gatilho, o que o sistema responderia, o que evitar).
- [ ] Perguntas dirigidas: o que está errado, o que falta, o que ninguém diria
      assim no ramo.

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
