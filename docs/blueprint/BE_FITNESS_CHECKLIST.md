# Be Fitness — o checklist único

> **Este é o arquivo para olhar agora.** Ele existe porque o estado do piloto
> estava espalhado em quatro documentos e o fundador disse, com razão, que não
> dava para saber o que faltava.
>
> Escopo: **a Be Fitness rodando 100% no modo manual.** Automação, outros
> segmentos e o Kairós vendendo o Kairós estão fora daqui de propósito — cada
> item que não é para agora é ruído para quem está tentando entregar.
>
> Atualizado: 22 de agosto de 2026.

---

## A decisão que organiza tudo

**Terminar a Be Fitness no manual antes de qualquer outra coisa.** Depois, uma
empresa real de outro segmento. Só então automação.

O motivo de o manual vir primeiro já estava registrado: automatizar antes de
provar que a resposta manual é boa é otimizar a coisa errada.

---

## O número que muda a percepção do tamanho

Extraído dos relatórios do sistema da academia em 8/ago/2026, com a contagem
conferida contra o total que o próprio relatório declara (392 = 392):

| | |
|---|---|
| Cadastros já feitos desde 2023 | **9.158** |
| **Planos vigentes hoje** | **327** |
| Vencem nos próximos 30 dias | **54** |
| Contratos vencidos | 5 |
| Treino avulso / semana experimental (sem vigência) | 36 |

**A operação comercial da Be Fitness são ~330 pessoas, não 9 mil.** Os 9.158
são histórico — base de reativação, que é outro assunto e outro ritmo.

⚠️ **`cadastros ativos` do sistema da academia NÃO significa "tem plano".**
Os rodapés declaram 9.158 e 9.151: o filtro "Situação: Ativos" descarta 7
pessoas. Ele quer dizer "cadastro não excluído". Importar confiando nele
transformaria 9.151 pessoas em alunas.

---

## ✅ O que já está pronto

- Motor de resposta com IA, ancorado no DNA e na biblioteca, com **trava
  anti-invenção** estrutural.
- Biblioteca de academia: 23 situações curadas.
- **DNA completo** (23/23 seções). É o que faz o motor responder com os fatos
  da casa em vez de escalar.
- **Agenda por turno** — a janela é o horário de funcionamento, e o motor
  oferece "quinta de manhã" em vez de "quinta às 6h30".
- **Fila de envio** com os quatro motivos, ordenada por custo de furar.
- Follow-up, recorrência, contatos, funil, gestão, placar, catálogo.
- **Curso** com 45 lições.
- 273 contatos, 2.105 interações e 846 desfechos do piloto importados.
- **Equipe cadastrada**: João, Nycolas e Luciana como `agent`.
- **Aparência**: logo e cor da academia no painel.
- **E.164 brasileiro** — mensagem sai para o número certo, inclusive DDD 55.
- Login por e-mail e senha, com convite que termina em criar senha e
  recuperação de acesso.
- **"Gerar acesso" na tela de Equipe** (10/ago) — um botão por pessoa que
  devolve um link de criar senha na hora, para copiar ou mandar no WhatsApp.
  **Ninguém mais fica parado esperando e-mail.** Existe porque o único caminho
  de quem já era membro e esqueceu a senha era "Esqueci minha senha", que sai
  pelo mesmo e-mail nativo que estava falhando: a saída da pessoa dependia do
  canal quebrado, e destravá-la exigia eu gerar o link na mão.

---

## 🟡 A SINCRONIZAÇÃO — era TAMANHO, e o conserto está no ar (14/ago)

**O teste do fundador separou as hipóteses:** o arquivo de matrículas (86 KB)
importou; o de recebimentos (4,2 MB) não. Era tamanho, e não a lógica do botão.

**O que era:** a tela mandava o TEXTO INTEIRO do arquivo para o servidor. O
corpo de uma requisição para função serverless na Vercel tem teto de
plataforma que o `serverActions.bodySizeLimit` do Next **não move** — subir
aquele número para 12 MB não resolveu nada, porque quem recusava era a camada
de baixo. E recusava **sem mensagem na tela**, que é como "não está salvando"
se apresenta.

**O que passou a ser:** o arquivo é lido *e interpretado* no navegador, e só o
RESULTADO sobe — os 1.548 pagantes viram ~200 KB em vez de 4,2 MB. O arquivo
em si nunca sai do computador dele. Como efeito, erro de planilha (coluna
faltando) aparece na hora, sem ida ao servidor.

**Junto, três coisas que iam morder depois:**
- As gravações vão **em paralelo limitado**: 1.548 UPDATEs em fila indiana
  estouram o tempo da função, e função interrompida grava metade e some.
- **Conta pessoas distintas**, não eventos: quem está nos dois arquivos era
  contado duas vezes e a tela diria "1.800 atualizados" numa base de 1.548.
- **Recusa do banco aparece.** Antes só o sucesso era contado: 1.500 gravados
  com 48 recusados era relatado como 1.500 gravados.

**⚠ Falta o teste dele com o arquivo grande.** Se ainda não gravar, a próxima
suspeita continua sendo a CHAVE: conferir se `custom.codigo_sistema` de um
contato bate com a coluna `Codigo` da planilha — a sincronização só atualiza
quem já existe, ela não cria contato.

**O que está medido e esperando para entrar no banco** (rodado contra o
arquivo real, sem gravar): 12 entraram · **3 renovaram** · 4 ajuste de data ·
**11 encerraram**. E dos recebimentos: 1.548 pagantes, R$ 1.548.051 de
faturamento histórico, atraso habitual por pessoa.

---

## 🟢 O CANAL OFICIAL ESTÁ NO AR (17/ago)

Envia e recebe, provado com mensagem real. O número **+55 51 9419-3412** está
CLOUD_API, conectado e verificado; o token é permanente; a mensagem que entra
cria o contato, atribui dono e fica registrada sozinha.

⚠ **O número da recepção (+55 51 8251-2270) não foi tocado e não pode ser** —
número registrado na plataforma sai do aplicativo do WhatsApp, e a equipe perde
o que usa hoje.

**🟢 O CANAL ESTA COMPLETO (21/ago).** Modelos aprovados e colados em
Automacao, cartao cadastrado na Meta, motor com gatilho no GitHub Actions
(rodou com sucesso), simulacao com veredito por pessoa, aba de responder pelo
numero oficial, e o aprendizado por correcao do vendedor.

**O QUE FALTA PARA A PRIMEIRA CAMPANHA — atualizado em 22/ago:**

1. ✅ **A oferta de retorno foi DECIDIDA** (22/ago): a adesao existe **so no
   plano recorrente**, e **quem ja foi aluno e isento**. Virou campo no
   manifesto de academia (`pricing.joining_fee`), com a decisao como uma das
   opcoes prontas.
   ⚠ **Falta ELE marcar a opcao** em `/painel/dna/editar` → *Planos e valores*
   → *Taxa de adesao* → **"So no plano recorrente, e quem ja foi aluno e
   isento"**. Enquanto nao estiver la, a trava anti-invencao esta certa em nao
   afirmar isso — e o vendedor responde de cabeca, que e o que ela existe para
   evitar.
2. **Trocar o nome de exibicao** na Meta — ainda sai "Be Fitness2" para quem
   recebe. Numa reativacao e a unica coisa que a pessoa le antes de decidir se
   abre ou bloqueia. **Passo 10 do guia da aba Automacao.**
3. **Publicar o app** na Meta. **Passo 11 do guia**, com os tres campos que
   destravam a chave (politica de privacidade, icone, categoria).

**E a peca minha esta PRONTA (22/ago):** o recorte por data. Em Automacao,
**"Reativacao: so quem saiu nos ultimos (dias)"**, padrao **90**. A simulacao
agrupa numa linha so quem o recorte barrou, com a contagem — some e que nao
pode. Zero libera o acervo inteiro, e ai e decisao tomada, nao esquecimento.

⚠ **E A AUTOMACAO NAO RESPONDE O CLIENTE.** Quando alguem responder ao modelo,
quem escreve de volta e uma PESSOA, pela aba Canal oficial. A IA nao envia
resposta sozinha — esse caminho nao existe e nao deve existir antes de haver
medicao (hoje: `decisions = 0`).

**Decisão de operação:** o número novo cuida dos EX-ALUNOS; a recepção segue no
número antigo. Separação por público, não por ferramenta — o conflito real é
dois números falando com a mesma pessoa.

**Isso virou código em 17/ago** (`lib/roteamento.ts`): cada motivo da fila
escolhe por qual número sai, em Automação. O padrão manda só a `reativacao`
pelo número oficial — é o único motivo que fala com quem não é cliente. E o
custo cai do mesmo lado: o `wa.me` não passa pela Meta, então a operação de
todo dia continua de graça.

**A aba "Canal oficial" existe** (`/painel/conversas`) e mostra o que saiu, o
que chegou e **o que falhou**. Ela nasceu de um achado: a Meta já mandava
`sent`, `delivered`, `read` e `failed` desde que o webhook existe, e a rota
**descartava o array inteiro**. Numa campanha paga, `failed` é dinheiro gasto
sem conversa — invisível até agora.

---

## ❌ O que falta — 10 de agosto de 2026, fim do dia

### Suas

| # | O quê | Onde |
|---|---|---|
| 1 | **Subir o teto global de IA** | Aba **Fabricante**, primeiro bloco. Está **R$ 130**; a soma dos tetos das 4 empresas reais é **R$ 195** (Be Fitness R$ 156 + R$ 13 × 3). **Não bloqueia nada hoje** — a trava só nega quando o GASTO acumulado do mês alcança o teto, e o gasto é zero. Ela morde em ~500 respostas, antes de a Be Fitness chegar ao teto dela. |
| 2 | **SMTP próprio no Supabase** | O e-mail nativo é lento e limitado. Resend ou Brevo, ~10 min. **Já não trava mais a equipe** — ver "Gerar acesso" abaixo. Continua valendo para quem chega de fora e não tem a quem pedir link: confirmação de cadastro e "esqueci minha senha" de conta nova. |
| 3 | **Decidir sobre `teste-a@exemplo.com`** | É `owner` da Be Fitness ("Usuário A" na tela de Equipe), com acesso a 598 cadastros reais. |
| 4 | **A equipe usar** | Os três estão com senha definida e acesso funcionando. |

### Minhas, e o que cada uma espera

| O quê | Espera |
|---|---|
| Ligar os botões de assinatura | Links do Mercado Pago |
| Cálculo de preço por porte e segmento | Você fechar a base de preço |
| Completar o DNA do Kairós | Faixa de mensalidade, exportação de dados e contrato |
| Aplicar a revisão da Feltros na biblioteca de indústria | Nada — posso fazer |
| Motor proativo agendado (Inngest) | Nada — não depende da Meta |
| DNA da Feltros | `scripts/dna-feltros.mjs` está pronto e falha até ela criar a empresa |

---

## ⚠ O número que importa mais que a lista — CORRIGIDO em 18/ago/2026

**A versão anterior desta seção estava ERRADA, e o erro é o mais instrutivo do
projeto.** Ela dizia: *"`decisions` = 0. Em toda a plataforma, nenhuma resposta
com IA foi gerada para um cliente real."*

Isso é falso. O fundador contestou — *"já medimos sim, é a versão manual"* — e
a conferência no banco deu razão a ele:

| | |
|---|---|
| Chamadas de IA na Be Fitness (`responder_ai`) | **161**, de 26/jul a 18/ago |
| Saídas registradas no período | **548**, para **227 pessoas distintas** |
| Mudanças de etapa no período | 25 |
| **Vendas registradas no período** | **0** |
| Linhas em `decisions` | 0 — **porque NADA escreve nessa tabela** |

**`decisions` está vazia porque nenhuma linha de código insere nela.** A tabela
nasceu no `0001` e nunca ganhou escritor. Ou seja: o "número que importa mais
que a lista" era **um campo vazio com aparência de medição** — exatamente a
classe de defeito que este projeto documenta em todo lugar, cometida no
documento que existe para evitá-la.

**O que de fato falta não é a IA falar — ela fala há três semanas. É o
DESFECHO.** 548 toques, 227 pessoas, e zero venda registrada. Ou nada
converteu, ou as vendas acontecem e ninguém registra (mais provável:
`services_rendered` depende de alguém preencher à mão).

Sem desfecho, não dá para dizer se a IA é boa nem se a operação está
funcionando — e essa cegueira **já existe hoje**, com humano no meio. Ela não é
argumento contra automatizar; é o item que precisa ser resolvido de qualquer
jeito, automatizando ou não.

⚠ **E a lição de método:** eu afirmei ao fundador um número que não tinha
conferido, apoiado num documento que também não tinha. Ele desconfiou porque
conhece a operação. É a segunda vez — a primeira foi o Analista dizendo que
fazia 20 dias que ninguém usava o sistema, quando havia 32 interações no dia
anterior. **Número que ninguém consegue contestar é o mais perigoso que
existe.**

---

## As três empresas reais

| Empresa | Ramo | Estado |
|---|---|---|
| **Be Fitness** | academia | 598 contatos, 328 com vencimento (**81 vencem em 60 dias, 9 já vencidos**), todos com responsável. DNA 10/10 seções. Equipe com acesso. |
| **Darvil Engenharia** (Luis) | energia solar | Entrou. **DNA vazio** — 23 campos com sugestão esperando. Teste até 08/09. |
| **Feltros Bandeira** (Jeniffer) | indústria | **Já criou a empresa** (`feltros-bandeira`, indústria) — conferido no banco em 10/ago. **DNA vazio.** |
| **WSS Kairós** | software_b2b | A do fabricante. Renomeada a partir de "WSS Labs". |

### ⚠ Telefone compartilhado — o que a importação descobriu

324 inserções falharam de primeira no índice único `(tenant_id, phone)`. A causa
não era dado sujo: **12 telefones pertencem a duas pessoas diferentes, e as duas
são alunas pagantes** — casais e famílias (Fabiana e Francisco Lagoas; Esther
Arndt e Volmar Rosa da Costa). Em academia de bairro isso é rotina.

O índice afirmava "um telefone, uma pessoa", e isso é **falso no mundo que o
produto modela**. A `0053` troca a chave de identidade para o **código do
sistema da academia**, que é o identificador de verdade, e deixa o telefone
indexado sem ser único.

Enquanto ela não roda, 8 pessoas entraram **sem telefone**, com o número
guardado em `custom.telefone_compartilhado`. Elas aparecem na fila com o aviso
"sem telefone válido" — falha visível, que alguém conserta. Deixá-las de fora
seria pior: aluno pagante sumindo da renovação em silêncio.

Depois da migration, rodar o importador de novo devolve o telefone a elas.

---

## O que NÃO entra agora (e por quê)

- **Importar os 9.158 cadastros.** Eles entrariam todos na etapa inicial e
  virariam 9 mil pendências de follow-up no primeiro dia — três recepcionistas
  não fazem isso, e uma fila impossível é uma fila que ninguém abre. Reativação
  de base fria é campanha deliberada, com recorte e ritmo próprios, não o
  trabalho diário.
- **Automação por WhatsApp.** Congelada até o manual estar provado.
- **Segmento novo.** A fila de 15 já está escrita; o que falta é validação
  externa, e escrever o 16º não aproxima disso.

---

## Armadilhas específicas deste piloto

- **`teste-a@exemplo.com` é `owner` da Be Fitness.** Conta de teste com acesso
  total a dado de cliente real. Remover quando sobrar um minuto.
- **A planilha do sistema da academia é um LOG, não um cadastro.** A mesma
  pessoa aparece várias vezes (um contrato por linha). Para vigência vale o
  contrato de **maior data de fim** — importar linha a linha criaria duplicata.
- **O botão "exportar CSV" do sistema devolve PDF.** Os arquivos `.csv`
  enviados eram PDF por dentro, byte a byte iguais aos `.pdf`. Dá para extrair
  por coordenada, mas planilha de verdade é mais seguro.
- **O `Código` do sistema da academia é a chave de reconciliação.** Ele fica em
  `contacts.custom.codigo_sistema` na importação, e é por ele que a atualização
  semanal vai casar sem duplicar.

---

## Como manter atualizado enquanto não há API

O sistema da academia não expõe API (pedido feito ao fornecedor em ago/2026).
Até haver, a atualização é por planilha:

1. Baixar o relatório de mensalidades do sistema da academia (sai em PDF; o
   botão "exportar CSV" também devolve PDF).
2. `python scripts/extrair-relatorio-academia.py <arquivo.pdf> planos.csv`
   — lê por COORDENADA, não por texto corrido, e **falha se a contagem não
   bater com o total que o rodapé do relatório declara**.
3. `node scripts/importar-planos.mjs planos.csv --tenant be-fitness` — simula.
4. Conferir os números e rodar de novo com `--aplicar`.

O script **preserva etapa e histórico** de quem já existe: só acrescenta plano
e vigência. Sobrescrever a jornada apagaria os 846 desfechos do piloto, que são
a única base de aprendizado real do produto.
