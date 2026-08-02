# COS — Plano de Execução

> A fila de trabalho, em ordem. Marque o que fechar e registre o que aprendeu.
> **Decidido com o fundador em 1º de agosto de 2026.**
>
> Ordem de leitura: `ESTADO_DO_PROJETO.md` → este arquivo.

---

## Onde estamos (2 de agosto de 2026)

- **9 segmentos, 166 entradas curadas.** A `energia_solar` recebeu a **primeira
  correção vinda de especialista do ramo** (contato do fundador, integrador):
  híbrido com bateria/BESS é a onda que se forma, porque o on-grid virou
  commodity e a margem derreteu. Três entradas novas. **É o começo da saída do
  N=1.**
- **Curso completo: 9 de 9 módulos** — 45 lições, 267 min, 122 perguntas, com
  **repescagem espaçada** no ar. A tela funciona e o fundador aprovou a régua
  depois de fazer o Módulo 1.
- **O kit de revisão está com o especialista da indústria** e as respostas do
  de solar estão a caminho.

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

- ✅ **Ruído no ranking resolvido (ago/2026).** Eram três causas somadas, e a
  terceira não estava no diagnóstico original:
  1. **Nenhum termo pesava mais que outro.** "como" valia o mesmo que
     "importado". Entrou frequência inversa: termo raro decide, termo comum
     conta e não decide.
  2. **O gatilho era medido numa direção só.** Contava-se quantas palavras da
     mensagem encostavam na entrada, não **quanto do gatilho a mensagem
     continha**. Com isso *"e se o lote nao sair como a amostra"* (2 de 5
     palavras) empatava com *"o importado e mais barato"* (todas). Agora a nota
     do gatilho é `massa casada × cobertura` — paráfrase quase literal ganha de
     coincidência de vocabulário.
  3. **A prosa decidia.** `strategy` e `answer` somavam sem limite: seis
     palavras banais espalhadas por seis linhas passavam na frente de três
     palavras certas num gatilho. Medido: zerando a prosa, todos os casos iam
     para o 1º lugar. Zerar seria pior (é ela que segura o recall quando
     ninguém escreveu gatilho), então ela **satura** — cresce, tem teto, e
     mantém a ordem entre entradas que só casaram por prosa.
  **Medido, não estimado:** recall **idêntico** (33 gatilhos voltavam vazio
  antes e depois; toda mensagem solta devolve a mesma quantidade) e precisão
  melhor — sobre os **885 gatilhos curados**, a entrada dona vem em 1º em
  **95,5%**, contra 94,1%.
  E o `retrieval_check` deixou de manter uma **cópia** do algoritmo: importa
  `lib/match.ts` direto. A cópia existia com um comentário admitindo o risco de
  divergir, e na primeira vez que o ranking mudou de verdade foi o que quase
  aconteceu.

- ✅ **A limpeza de gatilhos do M3 estava pela metade.** O diagnóstico do
  ranking encontrou o resto: em **academia**, `objections` era dona de "vou
  pensar", "preciso pensar" e "depois eu te falo"; em **clínica**, "vou
  conversar em casa" estava **literalmente idêntico** em duas entradas, e a de
  follow-up pós-orçamento também reivindicava "vou pensar". Dois donos da mesma
  frase é empate por construção — ranking nenhum resolve. Corrigido **no seed
  de cada segmento**, seguindo o desenho já aplicado em `sob_medida`,
  `escola_esportiva` e `automacao`.
  Virou teste: o `retrieval_check` agora varre **todos os gatilhos** e exige que
  cada um traga a própria entrada em 1º (piso de 95%). Os casos escolhidos a mão
  não tinham apontado isso; a varredura cega aponta.

**Aberto:**
- **Contradição de doutrina em `academia`** — decisão de curadoria, não de
  código. A entrada `objections` que hoje isola a dúvida vaga ensina *"devolver
  a pressão de preço (Jim Thomas) + fechamento por alternativa"*, com escola
  `fechamento_classico`. A entrada de indecisão que veio no M3 ensina o oposto
  para o mesmo cliente: **não repetir o argumento, reduzir risco**. O JOLT diz
  que a primeira é o que piora o desfecho em 84% dos casos. Movi só os gatilhos;
  **decidir se a entrada antiga é aposentada ou reescrita é do fundador** — e
  `technique` é user-facing, aparece no Responder e no curso.

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

**Desenho decidido em `COS_Curso.md` (ago/2026).** Em resumo:
- **40 lições de 5–8 min**, não 8 aulas. Microlearning completa 80%+; metade da
  evasão acontece nas duas primeiras semanas.
- **O quiz é o método, não a verificação.** Hattie & Donoghue (242 estudos):
  as duas técnicas mais eficazes são prática distribuída e prática de teste.
- **A teoria é uma só; o exemplo é do ramo; o exercício é da empresa.** A lição
  não tem segmento — puxa o exemplo da biblioteca e o exercício do DNA. É o que
  nenhuma plataforma de curso consegue copiar.
- **Sem vídeo por ora**: caro, impossível de manter atualizado e é o formato
  passivo — o oposto do que a evidência aponta.

- [x] Modelo de dados (`0031`): módulos, lições, perguntas e progresso. Conteúdo
      com `service_role` (é produto vendido — o P0 do `0006` vale aqui igual);
      progresso com RLS por pessoa e empresa.
- [x] Chave de módulo `curso` no entitlements — serve para vender à parte ou
      embutir na mensalidade: muda a cobrança, não o produto.
- [x] **A tela** (`/painel/curso`): grade dos 9 módulos, progresso, botão
      "continuar" que tira a pessoa da paralisia de por onde começar; e a lição
      com prática, quiz e a próxima lição no fim.
- [x] **O exemplo do ramo, funcionando.** Provado com dado: a mesma lição
      ("A pergunta de impacto") mostra *"tá caro"* na barbearia e
      *"o importado é mais barato"* na indústria. Uma lição, nove ramos.
- [x] **Módulo 1 completo** — 5 lições, 16 perguntas.
- [x] **Módulos 2 a 9** (`0034`, `0035`, `0036`). 45 lições, 122 perguntas,
      267 minutos. A ordem seguiu o dia do vendedor, não a ordem das escolas:
      2 (Preço e valor) e 3 (Objeção) primeiro porque é onde a evasão acontece
      e onde está a pergunta que mais chega; 9 (Na sua operação) por último
      porque é o único lugar em que o produto é assunto legítimo.
- [x] **Repescagem espaçada** (`0037`). O segundo achado da meta-análise, que
      quase nenhum curso faz.
      **O dado NÃO estava todo lá, ao contrário do que este plano dizia.**
      `course_progress.answers` responde *o que a pessoa errou naquela lição* —
      e é por isso que a repescagem sabe por onde começar. O que faltava é o
      agendamento: quando a questão volta e quantos acertos seguidos ela já
      teve **fora** do contexto da lição. Forçar isso em `answers` teria dois
      efeitos ruins: o campo é reescrito a cada vez que a lição é refeita, e a
      nota da lição é calculada a partir dele — acerto de repescagem gravado
      ali falsificaria a nota de uma prova que ninguém refez. Daí a tabela
      `course_review`, com `streak` e `due_at` por questão.
      Intervalos 2 → 5 → 12 → 30 dias por acerto seguido; errar zera e traz de
      volta amanhã; carência de 2 dias depois da lição, porque repescar no
      mesmo dia é repetir, não espaçar; no máximo 2 perguntas da mesma lição
      por sessão, para não virar reconhecimento de contexto.
      A regra é **função pura** (`lib/repescagem.ts`), testada com relógio de
      mentira — `repescagem_test.mjs`, 13/13, **no CI**, porque não precisa de
      banco. O motivo de existir teste aqui: espaçamento quebrado se parece
      exatamente com "ainda não chegou a hora" — a tela continua funcionando e
      metade do método simplesmente não acontece.

- [x] **Ciclo na posição da resposta (achado do fundador, ago/2026).** Fazendo o
      curso, ele viu que a certa **andava uma casa a cada pergunta** — 1, 2, 3,
      4, 1, 2, 3, 4 — pelo Módulo 1 inteiro. O Módulo 7 tinha o mesmo defeito
      com outro ciclo, `(2,3,1,4)`. A trava de distribuição deixou passar
      porque rotação perfeita dá 25% em cada posição.
      Corrigido nos dois lados: a trava agora procura **ciclo** (períodos 2 a 5,
      teto 60% contra ~25% do acaso) e mede **por módulo**, não só por arquivo.
      Com o teto justo, mais dois módulos caíram (`cadencia` 63%, `operacao`
      64%) e foram reembaralhados também.
      As alternativas dos 4 módulos afetados foram reposicionadas com semente
      fixa, e a verificação foi feita contra o banco: **o texto da resposta
      certa é idêntico nas 43 perguntas mexidas** — só a ordem mudou. Maior
      ciclo do curso inteiro hoje: 50%.
      Junto, uma explicação que se referia a posição ("a primeira faz ele
      calcular") foi reescrita — ela já estava errada antes, apontando para a
      primeira quando a certa estava na quarta.

**Decisões de implementação que valem registro:**
- **A correção é no servidor, uma pergunta por vez.** O gabarito nunca vai ao
  browser — senão bastaria abrir o inspetor e a prática de recuperação viraria
  adivinhação. A explicação aparece logo depois de responder, inclusive quando
  erra.
- **Ao errar, a resposta certa não é revelada.** Quem errou lê a explicação e
  entende o porquê; entregar a alternativa correta de bandeja desliga o
  esforço de recuperação, que é justamente o que ensina.
- **Sem dependência de markdown.** `lib/markdown.ts` tem 40 linhas, zero
  imports e é testável em Node puro (`curso_render_test.mjs`, contra o texto
  real das lições). Nada de `dangerouslySetInnerHTML`.

### 6. Depois disso

- [ ] **Qualificação de compra (MEDDIC-lite)** — orçamento, processo de
      aprovação, critério de decisão e defensor interno. Já temos `decisor`.
- [ ] **Fila de segmentos**: salão de beleza, pet, imobiliária, oficina, curso,
      eventos. (Restaurante segue descartado.)
- [ ] **Google Agenda mão dupla** — exige OAuth e ação do fundador.
- [x] **Preço sugerido** (`/painel/admin/precos`). Ver o registro em §5 do curso — o "score de potencial" pedido não era construível: ele dependia de conversão observada, e há 0 desfechos. Entregue a versão medida: piso pelo custo de IA, sugestão pelo porte observado, e RECUSA declarada quando a janela não sustenta. Hoje as 10 empresas caem na recusa — que é a resposta certa.

---

## O limite que nenhum item acima resolve

**A validação continua N=1.** A tese da Skill só está provada quando uma segunda
empresa, **de outro segmento**, rodar no mesmo núcleo sem ninguém escrever
código. Isso não depende de código nosso — depende de colocar uma empresa real
para usar. Enquanto não acontecer, o produto é uma hipótese bem construída.

Com a automação congelada, o caminho mais curto para essa prova é o cockpit
manual: copiar e colar funciona, e é suficiente para uma primeira empresa
externa usar de verdade.
