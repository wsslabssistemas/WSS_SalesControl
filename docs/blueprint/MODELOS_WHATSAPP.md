# Modelos de mensagem da Meta — os textos para submeter

> **Para que serve este arquivo:** os textos prontos para colar no WhatsApp
> Manager, com a categoria de cada um e o motivo da escolha. A revisão da Meta
> leva de minutos a alguns dias e **o relógio só começa quando o texto é
> submetido** — por isso ele vem antes do código que os envia.
>
> Escrito em 17 de agosto de 2026. Escopo: Be Fitness, WABA `1038933932365273`.

---

## A decisão que governa todos os textos abaixo

**O modelo não vende. Ele abre a janela.**

A regra da Meta separa o produto em dois: dentro de 24h desde a última mensagem
do cliente, texto livre; fora dela, só modelo aprovado. E a fila do Kairós vive
**fora** da janela por definição — ela existe para falar com quem parou de
falar.

A tentação é escrever o argumento comercial dentro do modelo, já que é a única
coisa que sai. É o erro, por três motivos que se somam:

1. **A Meta recataloga.** Material de marketing dentro de um `UTILITY` não é
   rejeitado — é reclassificado em silêncio, e passa a ser cobrado como
   marketing. Descobrir isso na fatura é o padrão da casa: o defeito que se
   apresenta como sucesso.
2. **O texto seria o mesmo para todo mundo.** Um modelo aprovado é fixo; só as
   variáveis mudam. Argumento de venda fixo é exatamente o que a biblioteca
   curada existe para não fazer.
3. **Bloqueio derruba o número.** Marketing tem limite por usuário, adaptativo
   pela taxa de leitura da pessoa. Mensagem que parece propaganda é marcada, e
   o custo não é a mensagem perdida — é a qualidade do número da empresa.

Então cada modelo faz **uma pergunta fácil de responder**. Quando a pessoa
responde, a janela abre, o texto livre é liberado, e aí sim o motor entra com
o DNA e a biblioteca. **O modelo é a chave, não a conversa.**

Isto tem um efeito bom no custo — **com prazo de validade, e o prazo é curto.**
Ver a seção de preço logo abaixo antes de usar "é grátis" em qualquer conta.

---

## ⚠ O PREÇO, E A DATA QUE MUDA A CONTA: 1º DE OUTUBRO DE 2026

Conferido na documentação da Meta em 17/ago/2026. **A tabela de hoje não é a
tabela de daqui a 45 dias**, e a diferença não é de centavos: é a mudança de
"responder é grátis" para "toda mensagem custa".

| O quê | Hoje (ago/2026) | A partir de 1º/out/2026 |
|---|---|---|
| Modelo `MARKETING` | ~R$ 0,31 | igual |
| Modelo `UTILITY` (fora da janela) | ~R$ 0,034 | igual |
| Modelo `UTILITY` **dentro** da janela | **grátis** | **cobrado** |
| Resposta em texto livre (serviço) | **grátis** | **cobrado**, à tarifa de utilidade |

A frase da Meta é literal: *"Any non-template message is charged as of
October 1, 2026."*

**Por que isto importa mais do que o valor.** O argumento de custo do produto
era: o disparo custa, a conversa não — então o valor está na conversa. Em
outubro **a conversa passa a custar**. A tese continua de pé (a conversa é onde
o dinheiro é feito), mas ela deixa de ser gratuita, e todo cálculo de margem
por cliente feito antes de outubro está errado depois dele.

⚠ **A tarifa em REAIS ainda precisa ser conferida na conta.** R$ 0,3125 e
R$ 0,0340 são as tarifas em dólar do Brasil (US$ 0,0625 e US$ 0,0068)
convertidas a R$ 5,00 redondos — não vieram do rate card em reais. A Meta abriu
faturamento em BRL para o Brasil em 1º/jul/2026 (Facebook Brasil), então **a
moeda da WABA decide qual dos dois vale**: em USD o custo oscila com o câmbio;
em BRL vale o rate card da Meta, que só quem tem acesso à conta baixa.
Conferir no Gerenciador de Negócios antes de prometer preço a cliente.

**A ordem de grandeza, que não depende dessa ressalva:** a reativação dos 1.089
custa ~R$ 340 no primeiro toque. A operação corrente (ração de 10 × 3 vendedores
× 22 dias = 660/mês) custa ~R$ 206/mês como marketing e ~R$ 22/mês como
utilidade. **A diferença de 9,2× entre as duas categorias é escrita, não
técnica** — é o texto que decide em qual o modelo cai, e é por isso que a
recategorização silenciosa da Meta é um problema de custo e não de forma.

---

## As regras da Meta que moldam o texto

Conferidas na documentação em 17/ago/2026, não de memória:

| Regra | Consequência prática |
|---|---|
| Nome em minúsculas, números e `_` | `reativacao_ex_aluno`, nunca `Reativação` |
| Idioma `pt_BR` | Um modelo por idioma; não existe "genérico" |
| Corpo até 1024 caracteres; rodapé até 60 | Os daqui usam menos de 300 |
| **O corpo não pode começar nem terminar com variável** | Por isso todos começam com "Oi," e terminam em pergunta |
| **Duas variáveis não podem ser vizinhas** | Sempre há texto entre `{{1}}` e `{{2}}` |
| Exemplo obrigatório para cada variável | Estão na tabela de cada modelo |
| **O valor da variável não pode ter quebra de linha, tabulação nem mais de 4 espaços seguidos** | ⚠ Trava de envio — ver "O que o código precisa conferir" |
| Marketing tem limite por usuário, adaptativo | Erro **`131049`**. **Não reenviar antes de 24h** — insistir vira bloqueio temporário de entrega |

### Utility × Marketing, e por que não adianta discutir

`UTILITY` é o que responde a uma ação ou a um acordo do próprio cliente:
confirmação, atualização de status, aviso sobre algo que ele contratou.
`MARKETING` é o resto — e a documentação nomeia "re-engagement" e "win-back"
explicitamente.

Ou seja: **reativação, recompra e follow-up são marketing e não há redação que
mude isso.** Tentar disfarçar de utility só entrega a recategorização sem
aviso. Os dois que têm caso legítimo de utility são o `combinado` (data que o
cliente marcou) e a `renovacao` (contrato que ele assinou).

---

## Os modelos

### 1. `combinado_retorno` — `UTILITY`

O cliente marcou uma data. Estamos cumprindo o que **ele** combinou, o que é a
definição de utility.

```
Oi, {{1}}! Aqui é da {{2}}.

Você tinha combinado com a gente de retomar o contato por volta de {{3}}.
Estou passando para saber se ainda faz sentido para você seguirmos com isso.
```

| Variável | O que é | Exemplo para a Meta |
|---|---|---|
| `{{1}}` | Primeiro nome do contato | `Marcelo` |
| `{{2}}` | Nome da empresa | `Be Fitness` |
| `{{3}}` | A data combinada, por extenso | `12 de agosto` |

---

### 2. `renovacao_vencimento` — `UTILITY`

Aviso sobre um contrato que a pessoa assinou, com data real. É o mais seguro
dos cinco, e o mais barato.

⚠ **Este modelo é só a JANELA DE 7 DIAS** (`condicao`, em `lib/renovacao.ts`).
As janelas de 60 e 30 dias não cabem num modelo: a de 60 pede para *perguntar o
que o contrato já entregou* e a de 30 retoma *o ganho que ele mesmo disse* —
as duas dependem do que a pessoa respondeu antes, e um modelo é texto fixo.
Elas continuam saindo pela fila manual, com texto livre.

```
Oi, {{1}}! Aqui é da {{2}}.

Seu plano vence em {{3}}. Queria confirmar com você antes da data para não
deixar passar: quer seguir com a gente no próximo ciclo?
```

| Variável | O que é | Exemplo para a Meta |
|---|---|---|
| `{{1}}` | Primeiro nome | `Fabiana` |
| `{{2}}` | Nome da empresa | `Be Fitness` |
| `{{3}}` | Data de vencimento por extenso | `24 de agosto` |

---

### 3. `followup_retomada` — `MARKETING`

Conversa que morreu sem resposta. **8 de cada 9 perdas medidas no piloto são
silêncio** — este é o modelo que ataca a maior perda conhecida.

A segunda metade da pergunta não é gentileza: oferecer a saída reduz bloqueio,
e bloqueio é o que derruba a qualidade do número.

```
Oi, {{1}}! Aqui é da {{2}}.

A gente começou uma conversa por aqui e eu acabei ficando sem a sua resposta.
Você ainda quer que eu te ajude com isso, ou prefere que eu deixe para um
outro momento?
```

| Variável | O que é | Exemplo para a Meta |
|---|---|---|
| `{{1}}` | Primeiro nome | `Nycolas` |
| `{{2}}` | Nome da empresa | `Be Fitness` |

---

### 4. `recompra_retorno` — `MARKETING`

O ciclo do cliente venceu. **Sem número inventado:** "faz um tempo" em vez de
"faz 47 dias", porque a data do último atendimento vem da planilha importada e
errar isso é ser específico e falso na frente do cliente.

```
Oi, {{1}}! Aqui é da {{2}}.

Faz um tempo desde o seu último atendimento com a gente e eu lembrei de você.
Quer que eu veja um horário para esta semana?
```

| Variável | O que é | Exemplo para a Meta |
|---|---|---|
| `{{1}}` | Primeiro nome | `Esther` |
| `{{2}}` | Nome da empresa | `Be Fitness` |

---

### 5. `reativacao_ex_aluno` — `MARKETING`

**O modelo dos 1.089.** É o de maior volume e o de maior risco: fala com quem
não é cliente há meses ou anos, e é o único que pode, sozinho, queimar o número.

Três decisões dentro do texto:

- **"Sem compromisso"** — porque a pessoa saiu, e cobrança de volta é o que faz
  bloquear.
- **A saída explícita na própria pergunta.** Com 1.089 disparos, a taxa de
  bloqueio importa mais que a taxa de resposta. Quem responde "não" custa uma
  mensagem; quem bloqueia custa a entrega de todos os outros.
- **Nenhuma afirmação sobre quando ela saiu, nem sobre o que mudou na
  academia.** Não temos os dois fatos com confiança para 1.089 pessoas.

```
Oi, {{1}}! Aqui é da {{2}}.

Você já treinou com a gente em algum momento e acabou parando. Sem compromisso
nenhum: quer que eu te conte como está a academia hoje, ou prefere que eu não
te chame mais por aqui?
```

| Variável | O que é | Exemplo para a Meta |
|---|---|---|
| `{{1}}` | Primeiro nome | `Volmar` |
| `{{2}}` | Nome da empresa | `Be Fitness` |

⚠ **Isto não vai ser disparado de uma vez.** A ração de 10/dia (`lib/racao.ts`)
já é o teto, e a reativação é o último motivo em prioridade justamente para não
afogar a operação corrente. 1.089 pessoas a 10/dia por vendedor é uma campanha
de meses — que é o ritmo certo, não uma limitação a contornar.

---

## ❌ O que eu me recuso a escrever: o modelo de `lembrete`

Existe um sexto motivo na fila e ele **não vai ter modelo**.

`lembrete` é uma data marcada na ficha **sem ninguém ter anotado o porquê**.
Um modelo é texto fixo, e escrever um texto fixo para "não sei por que estamos
falando com você" só pode produzir uma de duas coisas: uma mensagem vaga o
bastante para ser inútil, ou um pretexto inventado.

E o pretexto inventado é o defeito exato que a casa já pagou: `next_action`
chegou preenchido em 257 contatos com rótulos de fluxo do sistema antigo, que
não são invalidados quando a pessoa muda de etapa. Um modelo alimentado por ali
escreveria *"vamos continuar nossa conversa para eu entender o que você
procura?"* para a Noeli, que é aluna matriculada desde julho. **Fluente e errado
é o pior defeito possível numa mensagem que sai no nome da academia.**

É a trava anti-invenção aplicada ao canal: falta o fato exigido — o motivo —
então o motor não redige. O `lembrete` continua na fila manual, onde uma pessoa
abre a ficha, lê o histórico e decide. Que é o comportamento certo.

---

## O que o código precisa conferir antes de cada envio

Nenhum destes é opcional, e três deles são a mesma classe de defeito que já
custou caro aqui — a escrita que falha em silêncio.

1. **Fato faltando, envio não sai.** `renovacao_vencimento` sem data de
   vencimento e `combinado_retorno` sem data combinada **não são enviados** —
   não existe valor padrão aceitável para essas variáveis. É a trava
   anti-invenção, e ela vale para o canal como vale para o motor.
2. **Higienizar o valor da variável.** Quebra de linha, tabulação ou mais de 4
   espaços seguidos fazem a Meta recusar a mensagem. Nomes vindos da planilha da
   academia têm espaço duplo e nome inteiro em caixa alta — o primeiro nome
   precisa ser derivado e limpo, e **derivar não pode gravar** (mesma regra do
   `paraE164BR`).
3. **Ler o erro da resposta.** `131049` é limite por usuário e **não** é falha
   nossa: a pessoa fica para depois, sem reenvio antes de 24h. Tratar isso como
   erro genérico e reenviar é o caminho para bloqueio de entrega.
4. **Registrar o envio como interação.** Modelo enviado é toque dado — se não
   entrar em `interactions`, a cadência não quita e a pessoa volta na fila
   amanhã, que é o defeito do `combinado` de novo.
5. **O nome do modelo é por empresa.** Modelos vivem na WABA do cliente. A
   ligação motivo → nome do modelo mora junto da credencial, em
   `tenant_secrets`, nunca em `tenants.settings`.

---

## A ordem de submissão

1. **Forma de pagamento na Meta primeiro.** Sem ela, mensagem iniciada pela
   empresa não sai — e modelo aprovado sem forma de pagamento é aprovação que
   não entrega nada.
2. **Submeter os cinco de uma vez.** A revisão é por modelo e corre em
   paralelo; submeter um de cada vez multiplica a espera sem reduzir risco.
3. **Trocar o nome de exibição antes de disparar.** Hoje sai "Be Fitness2" para
   quem recebe. Numa reativação, o nome do remetente é a única coisa que a
   pessoa lê antes de decidir se abre ou bloqueia — e "Be Fitness2" parece
   número clonado.
4. **Se algum voltar recategorizado**, não reescrever para tentar de novo. A
   recategorização muda o preço, não a entrega. Reescrever para caber em
   `UTILITY` é como o texto vira propaganda disfarçada, que é o que a Meta
   está medindo.
