# COS — Plano de Execução

> A fila de trabalho, em ordem. Marque o que fechar e registre o que aprendeu.
> **Decidido com o fundador em 1º de agosto de 2026.**
>
> Ordem de leitura: `ESTADO_DO_PROJETO.md` → este arquivo.

---

## Onde estamos (7 de agosto de 2026) — leia isto primeiro

**O roteiro do `COS_Kairos_Vende_Kairos.md` FECHOU.** Os seis itens estão no ar:
Skill `software_b2b`, tenant WSS Labs, cota de IA com teto que suspende sozinho,
prospecção por cidade e ramo, fila de envio `wa.me` e preço sugerido.

**A fila de segmentos também fechou**: 15 segmentos, 285 entradas curadas.

**O que a conversa de 6–7/ago entregou**, tudo vindo de uso real na Be Fitness:
próxima ação com data (`0049`), vigência e renovação em três janelas (`0050`),
`perdido` deixou de ser terminal nos 15 manifestos (com `lost` no núcleo),
motor religado após a matrícula, dashboard clicável, placar da equipe com o
piso de amostra, atribuição de carteira em lote, etapa no Responder, aparência
por empresa, página Sobre, proximidade na prospecção, busca por nome no
Responder, responsável no cadastro, guia da automação e tutorial atualizado.

**O erro da conversa, registrado para não repetir:** 19 commits ficaram sem
`push` enquanto o fundador testava no deploy. Ele passou uma conversa inteira
reportando como ausentes coisas prontas. **Commit não é entrega.**

**O que fazer agora**, em ordem: (1) as ações do fundador na §3.1 do
`ESTADO_DO_PROJETO.md`; (2) o M2, com dado segmentado por origem; (3) convidar a
primeira empresa externa, que é o único jeito de sair do N=1.

---

## A noite de 7 para 8 de agosto de 2026

O fundador foi dormir e pediu para eu adiantar o que não dependesse dele.

**Entregue:**
- **Agenda da academia.** O diagnóstico antigo ("falta regra de
  disponibilidade") era raso: o manifesto `academia` não tinha bloco
  `scheduling:` nenhum, e a agenda estava desligada **no ramo inteiro**.
  Cadastrar horário não teria resolvido. Ligada, com a janela vinda do
  `weekly_hours` do DNA.
- **Turno em vez de hora** (`offer_by_turno`), decisão dele. Com a janela de
  06:30 às 22:00 o motor oferecia "06:30" três dias seguidos — resposta
  válida e inútil. `turno_test.mjs` 16/16.
- **Logo por arquivo** (`0051`). A tela pedia endereço https, o que presume
  hospedagem que academia de bairro não tem. E o save **mentia**: nunca
  conferia o erro do update, então dizia "salva" para gravação que não
  aconteceu.
- **Camada de envio + E.164** — ver §3.6 do `ESTADO_DO_PROJETO.md`. Achou um
  bug de corrupção de número no ar (DDD 55).
- **Documentação conferida.** `COS_Mapa_de_Segmentos.md` estava congelado em
  julho ("8 manifestos, 145 entradas") e é lido por toda conversa nova.

**O achado que muda a prioridade:** os 273 contatos da Be Fitness têm **zero
data de vencimento e zero responsável**. A tela de Renovação — o que ele disse
querer priorizar — abre vazia. Ver §3.0 do `ESTADO_DO_PROJETO.md`.

---

## Onde estávamos (2 de agosto de 2026)

- **9 segmentos, 166 entradas curadas.** A `energia_solar` recebeu a **primeira
  correção vinda de especialista do ramo** (contato do fundador, integrador):
  híbrido com bateria/BESS é a onda que se forma, porque o on-grid virou
  commodity e a margem derreteu. Três entradas novas. **É o começo da saída do
  N=1.**
- **Curso completo: 9 de 9 módulos** — 45 lições, 267 min, 122 perguntas, com
  **repescagem espaçada** no ar. A tela funciona e o fundador aprovou a régua
  depois de fazer o Módulo 1.
- **A revisão de `energia_solar` VOLTOU** (ago/2026) — integrador do RS,
  engenheiro, trabalha por indicação. É a segunda devolutiva de especialista e a
  mais substantiva até hoje: **inverteu uma etapa da jornada**, discriminou
  prazos que estavam agregados num só, e trouxe a pergunta que ele recebe toda
  semana e que a biblioteca não tinha. Detalhe abaixo, no item 3.
- **O kit de revisão da indústria segue com a especialista.**

## O que está CONGELADO por decisão (não reabrir sem motivo novo)

Um plano vale tanto pelo que exclui quanto pelo que inclui. Estes itens são
importantes e **não são agora**:

| Congelado | Por quê |
|---|---|
| ~~**Migrar os dados da Be Fitness do Base44**~~ | **DESCONGELADO e FEITO (ago/2026).** O motivo original ("valor de aprendizado baixo") deixou de valer quando a empresa externa virou incerta: sem ela, o piloto passou a ser a única fonte de uso real. E ele trouxe mais do que se esperava — ver abaixo. |
| ~~**Automação (WhatsApp Cloud API + motor proativo agendado)**~~ | **DESCONGELADA PARA A BE FITNESS em 8/ago/2026**, por decisão do fundador — e só para ela. O motivo original ("automatizar antes de provar que a resposta manual é boa") deixou de valer: o cockpit manual rodou, o piloto entrou e a tese se sustentou. A verificação da Meta sai no **CNPJ da Be Fitness**, que é o único que existe. Para o Kairós vender a si mesmo, o remetente segue indefinido. Ver §7. |
| ~~**M2 — ligar desfecho a escola**~~ | **DESTRAVADO em ago/2026.** O piloto do Base44 entrou: 273 contatos e 2.105 interações da Be Fitness, com **846 desfechos registrados**. Deixou de ser bloqueio de dado. |
| **Volume da prospecção (base própria da Receita)** | Custo e esforço altos para um gargalo que hoje não é o gargalo. |

Quando a automação voltar, ela entra na ordem: canal de envio → motor proativo
agendado → cobrança automática.

---

## A fila pedida em 11/ago/2026 — Feltros, SMTP e a pergunta da autonomia

> Aberta pelo fundador depois de conversar com a **Jeniffer (Feltros
> Bandeira)**, a primeira empresa externa de outro segmento — a que tira o
> projeto do N=1. Está no topo do arquivo de propósito: é a fila corrente.

### F1. SMTP próprio — **decisão tomada, falta a conta**

Pesquisado em 11/ago. Dois candidatos, e a escolha depende de uma troca:

| | Limite grátis | Marca no e-mail |
|---|---|---|
| **Resend** | 3.000/mês, **100/dia**, 1 domínio | Não injeta rodapé |
| **Brevo** | ~9.000/mês, **300/dia**, para sempre | **Carimba "Sent with Brevo"** no plano grátis; tirar custa ~US$ 9/mês |

**Recomendado: Resend.** O volume real é confirmação de conta, recuperação de
senha e convite — hoje, 7 pessoas em 4 empresas. 100/dia sobra, e são e-mails
que saem com a cara do Kairós para a equipe de um cliente pagante: carimbo de
terceiro ali é o tipo de detalhe que faz uma empresa duvidar do produto.
Brevo entra se um dia houver rajada acima de 100/dia (onboarding de equipe
grande), e aí o carimbo é o preço do volume.

**O que trava:** criar a conta e colar a chave — é do fundador. Depois disso a
configuração é Supabase → Authentication → Emails → SMTP Settings, e vale subir
o *rate limit* em Auth → Rate Limits, que é o teto real do e-mail nativo.
Lembrete: **isso já não bloqueia mais a equipe** — o botão "Gerar acesso" da
tela de Equipe resolve quem já é membro. O SMTP resolve quem chega de fora e
não tem a quem pedir link.

### F2. Feltros Bandeira — o que a Jeniffer precisa

Site com os produtos: <https://www.feltrosbandeira.com.br/produtos/>

**F2.1 — Preço é CALCULADO, não consultado.** A planilha que ela usa tem
**custo por KG do fornecedor** (ETRURIA, OBER, BENEDETE, BRAPE, RATEX), e o
preço ao cliente sai de uma fórmula:

```
(tamanho da peça + apara) × gramatura × custo/kg × TM
```

com duas variáveis que o sistema não pode inventar: **a apara é diferente por
feltro** e **a TM não é sempre a mesma**.

Isto é uma capacidade nova, não um catálogo. O catálogo de hoje guarda preço;
aqui o preço não existe até alguém informar a medida. O desenho que respeita a
trava anti-invenção: **fórmula declarada no manifesto do segmento** (dado, não
código), **insumos no catálogo** (custo/kg, gramatura, apara por produto), e
**a TM como fato do DNA** com carimbo de atualidade — TM velha é o caso do
`0029`: número de um mês atrás afirmado com a confiança do de hoje.
Falta qualquer um dos fatos → **escalar, não estimar**.

> ⚠ **RISCO QUE VEM JUNTO, e é o mais grave desta frente: a planilha é CUSTO
> DE FORNECEDOR.** A trava anti-invenção impede inventar; ela **não impede
> vazar**. Custo por kg da ETRURIA numa resposta ao cliente é dano comercial
> direto e irreversível. Se este dado entrar, entra como insumo de cálculo
> **que nunca pode ser citado** — e isso precisa de teste próprio, não de
> instrução no prompt.

**F2.2 — Google Sheets em tempo real: é possível, sim.** A planilha publicada
gera um CSV que o sistema lê a cada consulta, ou a API do Sheets com conta de
serviço. Sem OAuth do usuário nos dois casos.
**Mas a pergunta certa não é se dá — é se deve.** Ler direto significa que uma
célula errada às 23h vira preço errado ao cliente às 23h01, sem ninguém
revisar. O formato que resolve os dois lados: **importar da planilha e mostrar
o que mudou antes de valer** (o importador de catálogo já reconhece colunas
sozinho), com botão de "sincronizar agora". Ela edita onde já edita; o sistema
não obedece cegamente.
Detalhe visto na foto: a planilha tem **correções à caneta por cima dos
valores impressos**. Isso é o mesmo alerta do relatório da academia — *planilha
é LOG, não cadastro*. Antes de ligar qualquer coisa, a versão digital precisa
ser a verdade.

**F2.3 — A triagem dela já é uma técnica, e o sistema deve saber fazê-la.**
Mensagem que ela manda hoje pede nome, empresa, telefone, e-mail,
cidade/estado, **aplicação**, **medidas/espessura/densidade** e como chegou.
O motivo é preciso e vale como regra do segmento: *"com cliente que não sabe o
que quer, nem sabe pra que serve o feltro, eu perco tempo até conseguir falar
com o usuário"*. Isso é **qualificação por aplicação**, e é exatamente o que a
biblioteca de `industria` deve cobrir — hoje ela tem 20 entradas e nenhuma
trata "o cliente não sabe o que pedir" como situação própria.

**F2.4 — O gargalo dela é tempo de resposta, não técnica.** *"Perco cliente
porque não consigo responder a tempo."* O fundador leu certo: **manual
primeiro, ajustado ao uso dela; automação depois.** É a mesma ordem que já
está congelada por decisão, e agora com uma segunda empresa confirmando.

**F2.5 — Áudio.** Cliente manda áudio. Só faz sentido no modo automático
(transcrição no recebimento). Fica registrado, não começado.

### F3. Custo de IA por período — ✅ FEITO (11/ago)

Painel do fabricante com **Este mês / Mês passado / Total desde sempre**.
A margem só aparece no total, de propósito: recebido e consumo não caem no
mesmo mês, e subtrair o custo de agosto do recebido de sempre dá um número
com cara de margem que não é margem de nada.

### F4. ⚠ A PERGUNTA DA AUTONOMIA — o que falta para o sistema trabalhar sozinho

O fundador perguntou: *se hoje tivéssemos o modo automático, a IA conseguiria
mapear cada cliente, cada necessidade, cada categoria, e fazer o trabalho que
hoje é humano?* E completou certo: se não, **deixar as ligações prontas
agora**.

**A resposta honesta é: hoje, NÃO — e o que falta não é modelo melhor.**
Medido em 11/ago, item por item.

#### O que JÁ está pronto (mais do que se imaginava)

| Peça | Estado |
|---|---|
| **Receber mensagem e CADASTRAR o lead** | ✅ Pronto. O webhook confere assinatura HMAC, resolve a empresa pelo `phone_number_id` (nunca pelo pacote), acha o contato em qualquer formato de telefone, **cria o contato se for gente nova**, e dedupe por `external_id` contra o reenvio da Meta. Falta só a credencial. |
| **Saber QUEM contatar** | ✅ Pronto (11/ago). Fila com quitação e dedução: uma pessoa, um motivo. |
| **Escrever com técnica** | ✅ Pronto. DNA + biblioteca curada + escola de venda. |
| **Não inventar** | ✅ Pronto e estrutural. `escalate` é comportamento certo, não falha. |
| **Não estourar o caixa** | ✅ Pronto. Cota e teto suspendem sozinhos. |
| **Enviar** | ⚠️ Escrito, **nunca executado** contra a API real. |

#### O que FALTA — em ordem de quanto trava

1. **⚠ COBERTURA DE MOTIVO — o item nº 1, e é curadoria, não código.**
   Das 80 etapas vivas dos 15 segmentos, **39 (49%) não declaram cadência
   nenhuma**. Nelas o motor cai em *"Sem cadência declarada para esta etapa:
   retome com um ângulo novo"* — texto do núcleo, igual para academia e para
   indústria. **Automatizar com metade das etapas mudas é mandar mensagem sem
   assunto, em escala** — e é exatamente o defeito da Noeli multiplicado por
   598 contatos. As mudas são quase sempre as mesmas: *Primeiro contato,
   Descoberta/Qualificação, Proposta, Negociação* — ou seja, **o miolo da
   venda**, não a borda.

2. **Prosa de venda dentro do núcleo (Lei 1 vazando).** `renovacao` e
   `recompra` têm o texto do toque escrito em português fixo em
   `lib/renovacao.ts` e `lib/fila.ts`. "Contrato a vencer" serve para plano de
   academia e mente para contrato de fornecimento da indústria ou evento
   contratado de casa de festa. Tem que ir para o manifesto, como a cadência
   já vai.

3. **Nada dispara sozinho.** Não existe motor proativo agendado (Inngest). Hoje
   a fila só se move quando um humano abre a tela.

4. **Janela de 24 horas da Meta.** Fora dela, só template aprovado — e o motor
   não sabe disso. É restrição de plataforma, não de código: nenhuma
   engenharia nossa remove.

5. **Áudio e imagem entram como `ignorados`** (fica no log, de propósito, para
   "o cliente respondeu e ninguém viu" ser número e não silêncio). A Jeniffer
   já disse que recebe áudio. Precisa de transcrição no recebimento.

6. **Desfecho é registrado por humano.** Sem ele o sistema não aprende sozinho
   — continua escriturando, que é o limite já escrito no `CLAUDE.md`.

7. **Remetente indefinido.** Só existe CNPJ da Be Fitness. Ver §7.

#### A ordem que isso impõe

**1 e 2 vêm antes de qualquer automação, e podem ser feitos agora** — não
dependem da Meta, de CNPJ nem de credencial. São exatamente as "ligações
prontas" que o fundador pediu: quando o canal abrir, o motor já sabe o porquê
de cada contato em cada etapa de cada ramo. Fazer na ordem inversa (canal
primeiro) entrega um robô fluente que não sabe o assunto — o pior resultado
possível, porque parece que funciona.

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

### 1.5. Acentuação das 9 bibliotecas antigas — ✅ FEITO (ago/2026)

A dívida registrada quando `oficina` virou a primeira biblioteca com acento.
**+4.573 acentos** nas nove, com a densidade batendo a das quatro novas.
O detalhe do método, da invariante que protegeu a curadoria e da trava de CI
(`acentuacao_check.mjs`) está no `ESTADO_DO_PROJETO.md`. Em uma linha: a
automação fez o que é regra, o classificador foi **medido e reprovado** no
`e/é`, e os homógrafos foram decididos a mão.

### 1.6. Contradição de doutrina em `academia` — ✅ RESOLVIDA (ago/2026)

**Decisão do fundador: reescrever, não aposentar.** A contradição era de
**rótulo, não de texto** — e isso só ficou claro ao abrir as duas entradas.

O `technique` da entrada de dúvida vaga dizia *"Devolver a pressão de preço
(Jim Thomas) + fechamento por alternativa"*, com escola `fechamento_classico`.
Mentia em três frentes: **nenhum gatilho dela cita preço** (são *"não sei se
vale a pena"*, *"não era bem o que eu procurava"*), a entrada de preço já existe
ao lado (`oferta_valor`, "Diluir o valor no dia a dia (Tracy)"), e o **texto**
da entrada sempre ensinou descoberta. Era resto do desenho pré-M3, de quando ela
era dona de "vou pensar".

Virou `'Isolar a objeção não dita — uma pergunta antes de qualquer oferta'`,
escola `consultiva_spin`.

**Por que não foi aposentada:** o primeiro passo do JOLT é **julgar**. Quem
ainda não viu valor volta para a descoberta — que é o que esta entrada faz.
Quem viu valor e travou vai para a de indecisão, cuja estratégia e cujo
`next_objective` (`reduzir_risco`) são o remédio da *outra* doença. Fundir as
duas daria remédio certo para doença errada. A separação virou **par de teste**
no `retrieval_check` (52/52), porque é a distinção que o produto vende.

**Achado no caminho, na mesma faixa de defeito.** `academia` é a biblioteca que
veio do Base44, e ela ainda carregava inglês na tela: **14 dos 15
`next_objective` distintos** (`schedule_visit`, `isolate_objection`,
`capture_value_statement`…) e **4 rótulos de `technique`** (`Reassurance`,
`Benefit stacking`, `Ecosystem value`). Os dois campos aparecem para o vendedor
no Responder e para o aluno no exercício do curso — `next_objective` vira
literalmente *"Minha resposta leva ao próximo passo: isolate objection"*.
Traduzidos. Só `reduzir_risco`, escrito no M3, já estava em português.

### A prova com IA dos 4 segmentos novos (ago/2026) — passou

`provar-motor.mjs` ganhou 11 casos, um por entrada que DEFINE cada
segmento novo. **11 de 11 escolheram a entrada e a escola certas**, nenhum
inventou fato e nenhum escalou indevidamente. Custo real: **R$ 2,58** — a
estimativa de R$ 15 estava alta porque o custo por resposta caiu.

O que interessa mais que o acerto: **as quatro RECUSAS funcionaram.**
- salão — *"já fiz henê, dá para fazer progressiva?"* → acolheu, explicou o
  corte químico e ofereceu o teste de mecha, sem assustar;
- pet — *"a vacina está vencida, posso deixar?"* → recusou pelo cuidado com
  o animal DELE e ofereceu banho individual como alternativa;
- casa de festa — *"dá para segurar o sábado sem pagar?"* → recusou com
  afeto e ofereceu prazo declarado;
- oficina — *"trocaram o que eu não pedi"* → não se defendeu, assumiu a
  política e prometeu a peça de volta.

Recusar bem é a coisa mais difícil de escrever e a que mais protege o
cliente pagante. Era a maior dúvida sobre curadoria feita por pesquisa, e
ela se sustentou.

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

### A REVISÃO DO ESPECIALISTA (ago/2026) — o que ela mudou

Segunda devolutiva de especialista do projeto, e a que mais mexeu em estrutura.
Ele respondeu as 18 situações e as 5 perguntas de fechamento. O que entrou:

**1. A jornada estava na ordem errada — e isso é dinheiro do cliente.**
Antes: fecha → compra o kit → instala → homologa. Ele inverteu na prática e
explicou por quê: as concessionárias passaram a analisar o **fluxo de inversão**
na rede, e podem **limitar a potência** do sistema ou **exigir subestação**. Quem
comprou antes fica com kit errado e dinheiro parado, e a culpa cai no integrador
mesmo não sendo dele. *"Hoje eu sempre homologo o projeto primeiro, e depois o
cliente compra os materiais."* Virou a etapa `homologacao` **antes** de
`em_execucao`, com as fases de protocolo, acompanhamento e parecer de acesso.

**2. Existe um atalho legítimo, e ele tem número.** Consumo local até a potência
da aprovação simplificada sai praticamente certo; acima disso entra análise de
fluxo. O limite virou campo de DNA (`limite_fast_track`) em vez de ficar
escondido na cabeça de quem vende.

**3. "Peça a conta" estava incompleto: é a MÉDIA DE 12 MESES.** Solar se
dimensiona por média porque gera mais no verão para abastecer o inverno, e o
histórico dos 12 meses vem discriminado na própria fatura. Dimensionar pelo mês
que a pessoa mandou erra a potência para cima ou para baixo. Ele ainda acrescenta
**30% a 50% de folga**, porque o consumo cresce depois de instalar — e agora tem
carro elétrico e híbrido plug-in no meio.

**4. Um relógio virou quatro, com prazo cada um:** análise do projeto 10 a 30
dias · entrega do kit 10 a 20 dias · instalação · vistoria em até 5 dias úteis
depois de solicitada. Estavam agregados em "prazo de homologação", que é
justamente o que faz o cliente ligar cobrando.

**5. A pergunta que ele recebe TODA SEMANA e que não existia: autoconsumo
remoto.** Gerar numa unidade e abater em outra, em percentual, desde que mesmo
CPF ou CNPJ. Destrava projeto que parecia inviável — apartamento sem telhado com
casa de praia, comércio com telhado ruim e galpão bom. **Entrada nova.**

**6. O padrão de entrada de energia limita a geração**, e não estava em lugar
nenhum. Virou `hard_rule`: não prometer potência sem conferir o padrão.

**7. Consumo alto é BOM para vender** — o investimento é maior e o payback é mais
rápido. Contra-intuitivo, e o oposto do que um vendedor sem vivência assume.

**8. Argumentos verificáveis que substituíram genéricos:** o aumento real da
tarifa (RGE +14% e +16% aprovado; CEEE +21,8%, muito acima da inflação) no lugar
de "a energia sobe todo ano"; e "no fim de 2022 os kits custavam 50% mais que
hoje" para quem quer esperar baratear.

**9. Comparar proposta é sincronizar potência.** Orientar o cliente a igualar
potência de módulos e de inversor entre os orçamentos — *"comparar laranja com
laranja"*. É a régua que ele dá ao cliente, e ela favorece quem dimensionou
certo.

**10. Créditos duram 60 meses e ACOMPANHAM o titular** para outra unidade. Muda a
resposta de "e se eu mudar de casa" e a de imóvel alugado.

**11. Silêncio pós-proposta tem prazo e frase:** três dias, e *"o que está
faltando para fecharmos?"*. E o diagnóstico honesto das duas hipóteses — ou só
queria o preço para fechar com outro, ou está vendo como pagar.

**12. Falta uma etapa na entrega: ativar o monitoramento** e ensinar o app. É
como se confere se a geração bate com o que foi prometido — virou fase de
`em_execucao`.

**13. O que faz perder confiança na hora:** não olhar os pontos técnicos básicos
na visita (entrada de energia, telhado, sombras). *"Se o cliente recebeu outro
que viu e falou, provavelmente já era pra ti."*

Resultado: **23 entradas** (eram 21), jornada com etapa nova, 6 campos de DNA
novos, 4 `hard_rules` novas e 8 técnicas reescritas. `retrieval_check` 39/39.

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

- [x] **Qualificação de compra (MEDDIC-lite)** — FEITO (`lib/qualificacao.ts`, `qualificacao_test.mjs` 12/12 no CI). O checkbox ficou aberto por engano. — orçamento, processo de
      aprovação, critério de decisão e defensor interno. Já temos `decisor`.
- [x] **Fila de segmentos — FECHADA.** ~~oficina~~ ✅ (10º) · ~~salão de beleza~~ ✅ (11º) ·
      ~~casa de festa~~ ✅ (12º) · ~~pet~~ ✅ (13º) · ~~curso~~ ✅ (14º, ago/2026).

      **`curso` (14º) — idiomas, profissionalizante, preparatório, in-company.**
      Era "o de menor distância" da fila, e por isso a checagem de cobertura
      foi feita ANTES de escrever, contra as 239 entradas das treze
      bibliotecas: `escola_esportiva` já cobre turma, horário, matrícula,
      professor, decisão compartilhada e evasão — a camada **operacional** —
      e **nenhuma das 239** falava de certificação, reconhecimento,
      empregabilidade, teste de nível, carga horária, aproveitamento de
      estudos, calendário de turmas ou turma de empresa.

      **A diferença de fundo, que manda na biblioteca inteira:** aqui o
      produto é uma **promessa de transformação futura**. A barbearia entrega
      o corte na hora; o curso entrega em 6, 12 ou 24 meses. Daí três coisas:
      1. **A prova não é a estrutura, é o resultado de quem já saiu.**
      2. **O risco percebido não é o preço, é "e se eu não terminar?"** — e
         quem já tentou antes e desistiu carrega isso na primeira mensagem,
         sem dizer. Virou entrada própria, com escola `consultiva_spin`
         (diagnosticar a desistência anterior), e é a objeção que quase
         ninguém trata porque chega disfarçada de conversa fiada.
      3. **A promessa fácil é a mais cara.** As duas entradas que definem o
         segmento são de `limits_and_ethics` e as duas são RECUSA:
         *"é reconhecido pelo MEC?"* e *"com esse curso eu consigo emprego?"*.
         São as perguntas que mais chegam e as duas mentiras mais comuns do
         ramo — o equivalente ao "conta zero" do solar. Curso livre **não tem
         e não precisa ter** reconhecimento do MEC (o MEC reconhece graduação
         e pós; técnico é o Conselho Estadual, via SISTEC), e dizer que tem
         para vender é propaganda enganosa que o aluno descobre no primeiro
         concurso — já com o curso pago.

      Três decisões de estrutura que valem registro:
      - **`pricing` é `consultiva_spin`, não `oferta_valor`** como na
        academia — pelo mesmo motivo que separou salão de barbearia: o preço
        do curso não é um número, é uma **trilha**, e só o teste de nível diz
        quantos módulos faltam. Cotar por mensagem vende a trilha errada e
        cria o cancelamento do segundo mês.
      - **`matriculado` é `won` e NÃO é terminal.** A conversão é a matrícula
        (é ali que o dinheiro entra), mas etapa terminal desliga o motor — a
        armadilha que já custou a recompra da barbearia. Aqui seria pior: a
        evasão acontece **depois** da matrícula, e é ela que decide se o
        contrato de 12 meses vira receita de 12 meses ou de 3. `trancado`
        também é não-terminal, porque quem trancou é o lead mais barato que
        existe.
      - **Ganhou o bloco de qualificação do M3**, que o próprio M3 tinha
        reservado a segmentos com processo de compra. Curso entra pelos dois
        lados: no B2C não é decisão instantânea (contrato de 6 a 24 meses,
        financiamento, quase sempre uma segunda pessoa), e o in-company é B2B
        puro, com RH, gestor e verba de treinamento.

      Entregue: manifesto (**14/14 válidos**), **23 entradas nas 12
      categorias**, `Escola de Curso Demo` + DNA (46 campos, 18 obrigatórios),
      7 casos no `retrieval_check` (**59/59**, 96,6% dos 1.390 gatilhos) e o
      exercício do curso montando **8 situações distintas** para o segmento.
      **Provado com IA** (4 casos, R$ 1,04): as duas recusas funcionaram —
      o motor negou o MEC explicando o que o certificado de curso livre
      realmente comprova, e recusou a promessa de emprego trocando-a por
      carga horária e caso verificável. Nenhum fato inventado.
      **Imobiliária DESCARTADA (ago/2026)**, por dúvida do fundador que se
      confirmou: os fatos que governam a resposta são de imóveis de terceiros,
      não da empresa, e já vivem num CRM que a imobiliária tem. Seríamos o
      segundo sistema. O critério completo está no `ESTADO_DO_PROJETO.md`.
      **Eventos genéricos também sai:** virou `casa_de_festa`, que é o recorte
      com dono, data e recompra. (Restaurante segue descartado.)

      **`salao_beleza` (ago/2026) — o primeiro escrito depois de PESQUISA
      dirigida, a pedido do fundador.** A pesquisa mudou o desenho em cinco
      pontos que eu não teria acertado por dedução:
      1. **O preço da química não é um número, é uma régua.** Progressiva varia
         por comprimento e volume — cotar por mensagem é criar o conflito do dia
         do atendimento. Por isso `pricing` aqui é `consultiva_spin` e na
         **barbearia é `oferta_valor`**: mesma pergunta, escolas opostas. É a
         melhor prova até hoje de que o `strategy_map` por segmento não é
         enfeite.
      2. **O histórico químico é dado de SEGURANÇA.** Química sobre química
         incompatível causa corte químico — o fio quebra. Henê é incompatível
         com alisamento; formol e glutaraldeído são proibidos pela Anvisa e
         ainda circulam. Virou a entrada mais importante da biblioteca, e é a
         **primeira em 11 segmentos em que a resposta comercial certa pode ser
         RECUSAR o serviço**.
      3. **No-show custa a tarde, não a hora.** Faltas de última hora consomem
         10% a 20% da receita do setor, e uma química perdida leva 3 a 5 horas
         de cadeira. Sinal derruba no-show em 60% a 80% — virou entrada própria.
      4. **A cliente é fiel à pessoa: 72% acompanham o profissional** quando ele
         troca de salão. Não é problema de RH, é a fragilidade do negócio — e
         gerou a entrada de transferência de carteira com continuidade
         registrada.
      5. **A expectativa chega em forma de foto**, e o cabelo dela não chega lá
         em uma sessão. Alinhar antes é conversa comercial, não técnica.
      Contexto de mercado: o Brasil é o 3º maior mercado de beleza do mundo,
      ~500 novos MEIs do setor por dia. E o modelo de trabalho tem lei própria —
      **Lei do Salão Parceiro (13.352/2016)**, com cota-parte fora da receita
      bruta do salão.
      **Checagem de cobertura feita ANTES**, contra as 19 entradas da barbearia:
      ela já cobre agenda, confirmação, remarcação, vínculo com profissional,
      recompra, preço direto e "não gostei do corte" — e não cobre nada dos
      cinco pontos acima.
      Entregue: manifesto (11/11), **19 entradas nas 12 categorias**, Salão Demo
      + DNA (31 campos), 7 casos no `retrieval_check` (**37/37**, 96,2% dos 1.072
      gatilhos) e 9 situações distintas no exercício do curso.

      **Fontes da pesquisa:** [Beauty Fair — 72% acompanham o
      profissional](https://negociosdebeleza.beautyfair.com.br/72-dos-clientes-acompanham-seus-cabeleireiros-quando-eles-mudam-de-salao/) ·
      [Sebrae — Lei Salão Parceiro](https://agenciasebrae.com.br/economia-e-politica/lei-salao-parceiro-tudo-o-que-donos-e-profissionais-da-beleza-precisam-saber/) ·
      [ABIHPEC — Panorama do Setor 2026](https://abihpec.org.br/site2019/wp-content/uploads/2026/02/Panorama-do-Setor-de-Beleza-e-Cuidados-Pessoais_23.02.26_Port.pdf) ·
      [Incompatibilidade química e corte
      químico](https://universo.salonline.com.br/compatibilidade-de-substancias-dos-cabelos-alisados/) ·
      [Belio — no-show em salão](https://blog.belio.com.br/artigos/como-reduzir-no-shows-salao-beleza/)
      **`oficina` primeiro por dois motivos:** é a maior distância do que já
      existia (nada cobria diagnóstico, peça original, autorização de serviço
      nem revisão por quilometragem) e é o caso mais puro da tese do produto —
      o orçamento aprovado no balcão que some.
      Quatro achados que o setor tem e nenhum outro segmento tinha:
      **o cliente traz sintoma, não pedido**; **o diagnóstico é o produto** e
      quase todo mundo dá de graça; **a objeção nº 1 não é preço**, é "meu primo
      disse que é só a vela"; e **existe lei do lado de quem trabalha certo** —
      o CDC exige orçamento prévio discriminado (art. 40), obriga peça original
      ou de mesma especificação salvo autorização (art. 21) e dá 90 dias de
      garantia ao serviço (art. 26). Isso virou `hard_rules`, não folclore.
      Entregue completo: manifesto (10/10 válidos), **18 entradas nas 12
      categorias** com a de indecisão, `Oficina Demo` + DNA de demonstração
      (33 campos, 14 obrigatórios), 6 casos no `retrieval_check` (**30/30**) e o
      exercício do curso montando **9 situações distintas** para o segmento.
- [ ] **Google Agenda mão dupla** — exige OAuth e ação do fundador.
- [x] **Preço sugerido** (`/painel/admin/precos`). Ver o registro em §5 do curso — o "score de potencial" pedido não era construível: ele dependia de conversão observada, e **na época havia 0 desfechos**. Entregue a versão medida: piso pelo custo de IA, sugestão pelo porte observado, e RECUSA declarada quando a janela não sustenta. Hoje as 10 empresas caem na recusa — que é a resposta certa.
      **Revisitar:** o piloto trouxe 846 desfechos. O bloqueio de dado caiu, mas
      a regra do fundador continua valendo — segmentar por origem e declarar o
      n antes de transformar desfecho em score. Vai junto com o M2, não antes.

---

## O limite que nenhum item acima resolve

**A validação continua N=1.** A tese da Skill só está provada quando uma segunda
empresa, **de outro segmento**, rodar no mesmo núcleo sem ninguém escrever
código. Isso não depende de código nosso — depende de colocar uma empresa real
para usar. Enquanto não acontecer, o produto é uma hipótese bem construída.

Com a automação congelada, o caminho mais curto para essa prova é o cockpit
manual: copiar e colar funciona, e é suficiente para uma primeira empresa
externa usar de verdade.

---

## 7. Automação da Be Fitness (descongelada em 8/ago/2026)

**A decisão:** automatizar a Be Fitness pela **API oficial da Meta**, verificada
no CNPJ da academia. O Kairós vendendo o Kairós fica para depois, porque **não
existe CNPJ da WSS Labs** — e é isso, não preferência técnica, que separa os
dois casos.

### Sobre n8n (e ferramentas do tipo)

Perguntado pelo fundador. A resposta curta: **n8n não é um canal de WhatsApp.**
É um orquestrador — ele agenda e encadeia passos. Para falar com o WhatsApp,
o nó dele chama ou a Cloud API oficial (mesma conta Meta, mesmo CNPJ, mesma
burocracia) ou um provedor não-oficial (mesmo risco de banimento). **Ele não
contorna a pergunta que importa; só a move de lugar.**

E há um custo próprio, que é o que decide contra: n8n seria um **terceiro
sistema**, com lógica de negócio morando num fluxo visual que **não está no Git,
não tem teste e não conhece** a trava anti-invenção, a cota de IA, a RLS nem a
biblioteca curada. O `CLAUDE.md` diz que o repositório é a verdade; metade das
regras num fluxo que só existe dentro de uma ferramenta é o oposto disso.

Para o pedaço que o n8n de fato resolve — **agendar o motor proativo** — a
stack já decidiu **Inngest**, que roda com o mesmo código, no mesmo repositório,
com os mesmos testes.

*Onde ele seria legítimo:* cola de integração pontual que o fundador queira
montar sozinho, sem código, fora do caminho crítico. Não para o motor.

### O que já está pronto (sem credencial nenhuma)

- **`lib/envio.ts`** — a porta única. O canal troca sem mexer em tela.
- **`lib/whatsapp-webhook.ts` + a rota no catch-all Hono** — recebe mensagem,
  confere assinatura, acha a empresa pelo `phone_number_id` **no nosso
  cadastro**, casa o contato nos quatro formatos de telefone da base, cadastra
  quem é novo e grava como `customer_message`. `webhook_test.mjs` 41/41.
- **`0052`** — `external_id` com índice único parcial: a Meta reenvia, e sem
  isso a mensagem contaria duas vezes na métrica que cobra.
- **E.164 brasileiro**, com o bug de DDD 55 corrigido.

### ⚠ O que a janela de 24 horas revelou, e que muda o trabalho

Responder quem escreveu nas últimas 24h é **texto livre e sem cobrança**.
Fora disso, só **modelo aprovado pela Meta**, e cobrado.

O Responder quase sempre cabe na janela. **A fila, não** — ela existe
justamente para falar com quem parou de falar. Follow-up, recompra e renovação
são, por definição, fora da janela.

**Ou seja: o coração do produto é o caso que exige modelo aprovado.** Isso não
é código, é cadastro na Meta, e cada modelo é revisado por eles. Os quatro que
a fila precisa correspondem aos quatro motivos dela: combinado, renovação,
follow-up e recompra.

### O que falta, e de quem é

| O quê | De quem |
|---|---|
| Conta Meta Business no CNPJ da Be Fitness + número dedicado | Fundador |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` na Vercel | Fundador |
| Gravar o `phone_number_id` em `tenants.settings.whatsapp` | Eu, com o número em mãos |
| Submeter os 4 modelos de mensagem | Fundador (texto por mim) |
| Enviar pelo canal oficial a partir da fila | Eu, depois da credencial |
| Motor proativo agendado (Inngest) | Eu — não depende da Meta |

**A primeira mensagem pelo canal oficial vai para o número do próprio fundador.**
O provedor da Cloud API está escrito contra a documentação e nunca foi
executado contra a API real.
