# COS — O Kairós vendendo o Kairós

> O módulo que falta: a WSS Labs usando o próprio produto para vender o
> próprio produto. Decidido com o fundador em ago/2026, respondendo às
> quatro perguntas que ele levantou — mapeamento, pessoa certa, custo de
> token e WhatsApp.
>
> Leia antes: `ESTADO_DO_PROJETO.md` e `COS_Plano_de_Execucao.md`.

---

## 1. Sim, é um segmento — e ele passa no nosso próprio critério

O critério que descartou a imobiliária (ver `ESTADO_DO_PROJETO.md`): uma
Skill vale quando **os fatos são da empresa, poucos e estáveis**, e quando
**o gargalo é técnica de conversa, não gestão de inventário**.

Vender o Kairós passa nos dois com folga. Os fatos são nossos e cabem numa
página: preço, o que cada módulo faz, o que o teste inclui, prazo de
implantação, o que o produto **não** faz. E o gargalo é inteiramente de
conversa — não existe inventário para administrar.

Então nasce a Skill `software_b2b`, e a WSS Labs vira um tenant como
qualquer outro. Isso tem uma consequência que vale mais que o módulo:
**somos obrigados a usar o que vendemos**, todo dia, com dinheiro real em
jogo. Nenhum outro mecanismo encontra tanto defeito tão rápido.

---

## 2. O mapeamento — e por que ele já existe

O fundador imaginou Google Maps: achar as empresas, achar o WhatsApp,
abrir conversa. A intuição está certa; a ferramenta não precisa ser essa.

**O mapeamento já está construído.** O módulo **Oportunidades** prospecta
por CNAE com dado público da Receita — e CNAE **é** o segmento. Filtrar
por cidade e por ramo é literalmente o que ele faz hoje.

Google Maps (Places API) traria telefone e avaliação, mas é **pago por
requisição**, tem restrição de uso e de armazenamento nos termos, e
resolveria algo que o dado público já resolve. Fica como complemento
eventual, nunca como base.

**A regra de escopo que o fundador definiu é a decisão certa:** começar
por **uma cidade e um segmento** — Porto Alegre, academias. Não é
limitação de infraestrutura, é limitação de **caixa**, e ela protege o
projeto. Busca em nível Brasil geraria uma lista que ninguém consegue
trabalhar e um custo que ninguém consegue pagar.

---

## 3. A pessoa certa — a pergunta mais afiada

Ele está certo: quem atende o WhatsApp da academia muitas vezes é
recepcionista, não quem decide. Três respostas honestas.

**a) Em micro e pequena empresa, o problema é menor do que parece.** Na
academia de bairro, na oficina, no salão, o número público costuma ser do
dono ou de quem fala por ele. O porteiro existe mais em empresa média.

**b) Não se contorna o porteiro — pergunta-se.** É a mesma técnica do
MEDDIC-lite que já está no produto: descobrir cedo quem decide, sem
constrangimento. *"Você é quem cuida da parte comercial aí, ou consigo
falar com quem cuida?"* Perguntar no primeiro contato é natural;
descobrir depois da proposta pronta é tarde demais.

**c) A primeira mensagem não vende — qualifica.** Tentar fechar com quem
não decide queima o contato e o número. O objetivo do primeiro toque é
descobrir com quem se está falando e conseguir o encaminhamento.

Nada disso é código novo: são entradas de biblioteca da Skill
`software_b2b`, e os campos `decisor`, `processo_decisao` e
`defensor_interno` já existem no núcleo.

---

## 4. O custo de token — o teto precisa ser estrutural

**É o ponto mais importante que ele levantou, e ele está certo: quem paga
o token, no início, é ele.**

Número **medido** em ago/2026, não estimado: **R$ 0,20 a R$ 0,26 por
resposta com IA**.

| cenário | custo mensal, do bolso dele |
|---|---|
| 1 empresa em teste, 100 atendimentos/mês | ~R$ 23 |
| 10 empresas em teste | ~R$ 230 |
| 30 empresas em teste | ~R$ 690 |

Trinta empresas testando de graça custam mais que a mensalidade de várias
delas juntas. **Intenção não segura isso — só trava estrutural segura.**

### O desenho que resolve

**1. O modo manual é ilimitado e custa ZERO.** O cockpit que casa a
mensagem com a biblioteca por palavra-chave não gasta token nenhum. Ele é
a origem do produto e continua sendo o piso: **nenhuma empresa fica sem
produto quando o teto de IA é atingido** — ela volta ao modo que sempre
funcionou.

**2. A IA tem cota por empresa, contada em atendimentos.** No teste, algo
como 50 respostas com IA no mês. Passou disso, o manual segue e a tela
avisa. Isso também **vende**: a pessoa sente a diferença entre os dois
modos e entende exatamente pelo que vai pagar.

**3. Teto de gasto por empresa e teto global do fabricante**, com
suspensão automática da IA até virar o mês. O `usage_ledger` e o painel do
fabricante já medem o custo por empresa; falta o teto que **age sozinho**.

**4. A prospecção tem cota própria**, porque gerar abordagem também gasta:
N abordagens por dia, nunca por lote.

**A regra em uma frase:** *nenhuma empresa pode gastar mais token do que o
fundador decidiu, e o produto nunca para de funcionar quando o teto é
atingido.*

---

## 5. WhatsApp e Meta — a resposta honesta

O fundador tem só Instagram, não tem Facebook, achou o Meta confuso e não
conseguiu automatizar pelo Base44. Três verdades:

**a) A WhatsApp Cloud API exige conta Meta Business.** Não exige uma
*página* do Facebook com conteúdo, mas exige o portfólio de negócios, a
verificação da empresa, um número dedicado e templates aprovados para
falar fora da janela de 24 horas. Instagram profissional normalmente já
está ligado a um Meta Business — então a base pode já existir. Mas o
caminho é burocrático mesmo: **a dificuldade que ele sentiu não foi
impressão.**

**b) Eu não tenho acesso para configurar o Meta**, e nem deveria: exige
login, documento da empresa e aceite de termos em nome dele.

**c) E não é indispensável agora.** A automação de envio segue
**congelada**, e ganhou um motivo novo: sem Meta configurado e sem caixa
para token, automatizar seria construir o gargalo antes de existir funil.

### O meio-termo que entrega quase tudo sem Meta

**Fila de envio com um toque.** O motor proativo decide *quem* contatar e
*o que* dizer; a mensagem cai numa fila; o fundador (ou o vendedor) abre e
envia pelo `wa.me` com um clique. Sem API, sem template aprovado, sem
risco de banimento do número — e com a parte difícil, que é *quem* e *o
quê*, já resolvida.

É o mesmo princípio do cockpit manual, aplicado ao contato ativo: **a
inteligência é nossa, o envio é humano.** Quando o volume justificar a dor
do Meta, a fila vira automática sem reescrever nada.

---

## 6. O que construir, em ordem

1. **Skill `software_b2b`** — manifesto e biblioteca de quem vende sistema
   para PME. Custa curadoria, não código.
2. **Tenant WSS Labs** com DNA próprio: preço, módulos, o que o teste
   inclui, o que o produto não faz.
3. **Cota de IA por empresa + teto de gasto que suspende sozinho.**
4. **Filtro de prospecção por cidade + segmento**, começando em Porto
   Alegre / academias.
5. **Fila de envio com um toque** (`wa.me`), sem Meta.
6. **Score de potencial → preço sugerido** — já existe em
   `/painel/admin/precos`, e passa a receber dado real conforme os testes
   rodarem.

**O item 3 vem antes de qualquer convite.** Sem ele, sucesso comercial
vira prejuízo — e é o único erro desta lista que não dá para corrigir
depois de acontecer.
