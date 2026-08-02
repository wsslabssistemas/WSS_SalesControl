# COS — Módulo Curso

> Como o curso vai ser construído, por que assim, e o que a evidência sustenta.
> Decidido com o fundador em 2 de agosto de 2026.
>
> Leia junto: `COS_Escolas_de_Venda.md` (o conteúdo já existe lá em espinha).

---

## 1. O que o fundador pediu

Um módulo vendável à parte (como Licitações e Oportunidades), de excelência —
"que ganhe o cliente no visual, no conteúdo e na aplicação". Não pode ser
massivo nem chato. Prova de 3 a 5 perguntas ao fim de cada tópico. E a pergunta
que mudou o projeto: **dá para moldar os exemplos ao ramo do cliente?**

---

## 2. Antes de tudo: o folclore que não vamos repetir

A estatística mais citada em treinamento corporativo — *"retém-se 75% do que se
pratica contra 5% do que se assiste"* — vem da **pirâmide de aprendizagem** da
National Training Laboratories e **nunca teve base empírica**. Ela circula há
décadas porque é conveniente.

A direção está certa; a prova é outra, e é melhor: a meta-análise de **Hattie e
Donoghue** (242 estudos, 1.619 efeitos, 169.179 participantes) concluiu que as
duas técnicas mais eficazes de todas são **prática distribuída** (espaçamento) e
**prática de teste** (recuperação).

Consequência direta: **o quiz que o fundador pediu não é verificação, é o
método.** E ele fica ainda mais forte se as perguntas voltarem espaçadas nos
módulos seguintes, em vez de morrerem no fim do tópico.

Isto é coerente com o que já decidimos em `COS_Escolas_de_Venda.md`: ensinar com
**nota de evidência**, separando pesquisa séria de folclore repetido. Se o curso
repetisse a pirâmide, ele contradiria a própria tese do produto.

---

## 3. "8 aulas é pouco?" — sim, mas o problema não é a quantidade

É a **unidade**. O que a evidência de cursos online mostra:

| Achado | Consequência para nós |
|---|---|
| MOOC gratuito completa 5–15%; curso pago, ~60%; **microlearning (<2h), 80%+** | Muitas unidades curtas, não poucas longas |
| **50% da evasão acontece nas duas primeiras semanas**; 30% já na primeira | A primeira semana decide tudo |
| Quem passa dos **primeiros 30%** tem 75% de chance de terminar | Investir o melhor conteúdo no começo, não no fim |
| Motivos de abandono: falta de tempo (38%), perda de motivação (25%) | Aula que exige 40 minutos livres não é feita |
| Prática logo no início reduz evasão em 22% | Praticar na aula 1, não na aula 8 |

**Estrutura decidida: 8 módulos × 5 lições = 40 lições de 5 a 8 minutos.**

São as 8 escolas que já estão em `sales_schools`, mais o fechamento. Ninguém
encara um bloco de duas horas; todo mundo encara 6 minutos. E "40 aulas" tem
outro peso comercial que "8 aulas" — sem inflar conteúdo, apenas cortando na
unidade certa.

---

## 4. A resposta que muda o produto: **sim, molda ao ramo**

E não é adaptação cosmética. Nós temos o que nenhuma plataforma de curso tem:

- **163 entradas curadas por segmento** — os exemplos reais do ramo dele;
- **9 escolas com quando usar, quando NÃO usar e força da evidência**;
- **o `strategy_map` do segmento** — qual escola governa cada situação ali;
- **o DNA da empresa** — preço, prazo, garantia, lote mínimo REAIS.

Então a arquitetura é: **a teoria é uma só; o exemplo é do ramo; o exercício é
da empresa.**

A mesma lição sobre "pergunta de implicação" mostra, para a barbearia, um
cliente perguntando preço de corte; para a indústria, um comprador comparando
com o importado. Sem escrever nove versões de cada lição — o exemplo é buscado
da biblioteca do segmento no momento de renderizar.

E o exercício final de cada módulo é o que nenhum curso consegue fazer:
**uma mensagem real, respondida com o DNA da empresa dele.** O aluno escreve a
resposta, e o sistema compara com o que a biblioteca recomenda naquela situação
— mostrando a escola aplicada e o que ele deixou passar.

Curso genérico ensina teoria. Este ensina **a venda da empresa de quem está
assistindo**. É a Lei 1 pagando dividendo de novo: o núcleo não sabe o que é
barbearia; o manifesto e a biblioteca sabem.

---

## 5. Visual e ritmo — sem ser massivo

O que a evidência sustenta (e o que rejeitamos):

- **Progresso visível e pequenas vitórias.** No Duolingo, usuários com 7+ dias
  de sequência retêm 2,4× mais. Mas a unidade tem que ser **significativa**:
  sequência que se ganha com um toque não vale nada, e recruta quem não liga.
  Nossa unidade = **uma lição concluída com a prática feita**.
- **Prática já na primeira lição** (reduz evasão em 22%).
- **Nada de vídeo, ao menos por ora.** Vídeo é caro de produzir, impossível de
  manter atualizado (o Fio B muda todo ano; o preço do DNA muda), e é o formato
  **passivo** — justamente o oposto do que a meta-análise aponta. Texto curto +
  cenário interativo + prática é mais barato, mais rápido de corrigir e mais
  eficaz. Se um dia entrar vídeo, entra como complemento, não como espinha.
- **Sem certificado antes de existir aluno.** Ninguém paga por diploma de curso
  que ninguém fez ainda.

---

## 6. O que vamos construir (nesta ordem)

1. **Modelo de dados** — o curso é **conteúdo, como a biblioteca**: mora em
   migration numerada, não em código. Lições, perguntas e progresso.
2. **Módulo `curso` no entitlements** — a infra já existe (`prospeccao`,
   `licitacoes`): oferta por segmento, liberação por empresa, teste grátis. Serve
   tanto para vender à parte quanto para embutir na mensalidade — é uma chave,
   não um produto separado.
3. **As 40 lições**, começando pelos módulos 1 a 3 (é onde a evasão acontece).
4. **A tela** — uma lição por vez, prática ao fim, progresso visível.
5. **O exercício com DNA da empresa** — a parte que ninguém copia.
6. **Repescagem espaçada** — perguntas de módulos anteriores voltando. É o
   segundo achado da meta-análise e quase nenhum curso faz.

---

## 7. Conectores — a resposta honesta

**Nada é necessário.** O curso vive dentro do painel, com os dados que já temos.
O maior diferencial (moldar ao ramo e ao DNA) não depende de ferramenta externa
nenhuma — depende do ativo que já está no banco.

Dois conectores **já disponíveis** poderiam ajudar depois, nenhum agora:

| Conector | Para quê | Quando |
|---|---|---|
| **Canva** | Ilustração de conceito, capa de módulo, certificado | Só se o visual pedir arte que CSS não resolve |
| **Pagamentos** (link de cobrança) | Vender o curso à parte da mensalidade | Quando houver o primeiro comprador |

O que **realmente** faria diferença não é conector: é **uma gravação de conversa
real de venda** de cada segmento. Isso vira cenário de exercício com uma
fidelidade que pesquisa nenhuma alcança — e depende do fundador, não de API.

---

## 8. Limite honesto

Curso é produto novo, com custo de manutenção próprio: cada mudança de
regulação, de escola ou de biblioteca vira lição desatualizada. E o projeto
ainda não tem **um cliente externo usando o produto principal**. Construir o
curso antes disso é apostar que ele vende sozinho.

A decisão de seguir mesmo assim é do fundador e está registrada. O mitigador é
a arquitetura: o curso **lê** a biblioteca e o DNA em vez de duplicá-los, então
melhorar a curadoria melhora o curso de graça — e não cria uma segunda verdade
para manter.
