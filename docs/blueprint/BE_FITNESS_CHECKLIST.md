# Be Fitness — o checklist único

> **Este é o arquivo para olhar agora.** Ele existe porque o estado do piloto
> estava espalhado em quatro documentos e o fundador disse, com razão, que não
> dava para saber o que faltava.
>
> Escopo: **a Be Fitness rodando 100% no modo manual.** Automação, outros
> segmentos e o Kairós vendendo o Kairós estão fora daqui de propósito — cada
> item que não é para agora é ruído para quem está tentando entregar.
>
> Atualizado: 8 de agosto de 2026.

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

---

## ❌ O que falta

| # | O quê | Quem | Estado |
|---|---|---|---|
| 1 | **Subir o teto global de IA** | Fundador | `/painel/admin/cotas` → campo **"Teto GLOBAL (R$/mês)"**. Está R$ 130, **menor que o teto da própria Be Fitness (R$ 156)** — a IA para para todo mundo antes de a cota dela acabar. |
| 2 | **Rodar a migration `0053`** | Fundador | SQL Editor do Supabase. Devolve o telefone a 8 alunos que entraram sem — ver "telefone compartilhado" abaixo. |
| 3 | **Vendedor entrar** | Fundador | Segunda-feira, quando a equipe voltar. |
| 4 | **Remover `teste-a@exemplo.com`** | Fundador | Conta de teste com papel `owner` sobre dado de cliente real. |

### ✅ Fechados em 8/ago/2026

- **Importação dos planos.** 324 contatos criados, 44 atualizados, 0 falhas.
  **328 contatos com data de vencimento** conferidos no banco.
- **Carteira dividida** entre João, Nycolas e Luciana: 199 cada, equilibrada
  também em planos (119/106/103). Rodízio sobre a lista ordenada por nome —
  determinístico, dá para conferir e repetir.
- **Renovação acendeu sozinha**, sem programar nada: ela é derivada de
  `contract_end`. **88 toques devidos hoje** — 5 venceram sem ninguém falar
  (um há 67 dias), 17 na janela de 7 dias, 32 na de 30 e 34 na de 60.
- Equipe cadastrada, logo e cor no painel.

Depois dos quatro acima, a Be Fitness está completa no manual.

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
