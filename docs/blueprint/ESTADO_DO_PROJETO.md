# ESTADO DO PROJETO — COS (WSS Kairós)
**Última atualização:** 14 de agosto de 2026
**Fabricante:** WSS Labs · **Fundador:** William

> Este documento existe para que qualquer conversa nova possa retomar o projeto
> sem repetir discussões encerradas. **Leia antes de propor qualquer coisa.**
>
> **Entregando a Be Fitness? Vá direto ao `BE_FITNESS_CHECKLIST.md`** — ele é o
> único arquivo com o que falta no piloto, sem o resto do projeto em volta.
>
> Ordem: este arquivo → **`COS_Plano_de_Execucao.md` (a fila de trabalho e o que
> está congelado)** → `COS_Tese_de_Mercado.md` (por que existe e para quem) →
> `COS_Mapa_de_Segmentos.md` (o que cobrimos) → `COS_Escolas_de_Venda.md` (que
> técnica usamos e o que falta) → `../../CLAUDE.md` (as três leis).

---

## 0. ⚠ LEIA ISTO PRIMEIRO — repasse de 14 de agosto de 2026

> Escrito no fim de uma conversa longa, para a próxima começar sabendo. O que
> está aqui é **o que quebrou, o que foi consertado e o que continua aberto** —
> nesta ordem, porque o aberto é o que decide o próximo passo.

### ✅ A SINCRONIZAÇÃO: era TAMANHO — e o limite não era o do Next

O fundador testou o que estava combinado e o resultado separou as hipóteses de
uma vez: **matrículas (86 KB) importou; recebimentos (4,2 MB) não.**

**A causa não era o `bodySizeLimit`.** Ele já estava em 12 MB — e não adiantou,
porque **o teto que recusava é da plataforma**: o corpo de uma requisição para
função serverless na Vercel para em ~4,5 MB, e a configuração do Next é o
limite de cima, não o de baixo. Um número maior ali dá a impressão de que
alguém tratou do assunto. É a mesma forma de engano do `.limit(5000)` uma
seção abaixo, e nas duas vezes o sintoma foi silêncio.

**A correção não é um número maior — é não mandar o arquivo.** `lib/planilha.ts`
foi escrito sem rede e sem banco, de propósito, então roda igual no navegador.
Hoje ele roda lá e o que sobe é o RESULTADO da leitura: os 1.548 pagantes
viram ~200 KB em vez de 4,2 MB. Some o teto, some o parse duplicado (`aplicar`
refaz a previsão) e some a chance de o mesmo defeito voltar quando a base
dobrar. Erro de planilha passou a aparecer na hora, sem ida ao servidor.

**O que NÃO mudou, que é o que importa:** a trava continua no servidor.
`aplicar` refaz a comparação contra o banco e recusa se houver bloqueio. O
navegador manda a leitura de um arquivo que o próprio administrador escolheu —
ele já podia editar o arquivo antes de subir, então não ganhou poder nenhum. O
que ele nunca decide é o que o BANCO diz, e é o confronto dos dois que autoriza.

**Três defeitos vizinhos, achados junto e consertados:**
1. **1.548 UPDATEs em fila indiana estouram o tempo da função** — e função
   interrompida no meio grava parte e some, sem dizer até onde chegou. Agora
   vão 8 em paralelo (`lib/concorrencia.ts`), com `maxDuration` declarado.
2. **Contava eventos, não pessoas.** Quem está nos dois arquivos levava dois
   UPDATEs e era somado duas vezes: "1.800 atualizados" numa base de 1.548. É
   a lei de métrica do `CLAUDE.md` valendo para o recibo de uma gravação.
3. **Recusa do banco era engolida.** `if (!error) gravados++` conta só o
   sucesso: 1.500 gravados com 48 recusados virava "1.500 gravados". Agora a
   falha parcial aparece junto do sucesso.

E uma quarta, na direção conservadora: **linha sem data legível não apaga mais
a vigência que existe**. Quem sai de verdade some da planilha e vira
"encerrou"; data em branco numa linha presente é quase sempre formato que o
leitor não entendeu. Mesma regra do `paraE164BR` — falhar não pode virar
corromper.

**⚠ Falta a confirmação dele com o arquivo grande.** Se ainda não gravar, a
suspeita seguinte é a CHAVE: conferir se `custom.codigo_sistema` de um contato
bate com a coluna `Codigo` da planilha. A sincronização só atualiza quem já
existe no banco — ela não cria contato.

### ⚠ O DEFEITO MAIS INSTRUTIVO DO DIA — e ele já tem trava

O fundador perguntou ao Analista *"o que os vendedores fizeram hoje"* e recebeu
*"o último dia com movimento foi 25/07, faz 20 dias"*. Ele desconfiou —
**"não pode, eles devem ter usado o sistema sim"** — e estava certo: havia 32
interações no dia anterior.

**`.limit(5000)` NÃO PROTEGE.** O teto de 1.000 linhas é do PostgREST, do lado
do servidor, e ele **corta em silêncio**. Havia 1.955 linhas no período;
chegaram 1.000 — e **sem `ORDER BY` as 1.000 são arbitrárias**, nem estáveis
entre chamadas. A IA raciocinou com honestidade perfeita sobre um recorte que
ninguém sabia que existia.

**Ninguém tem como desconfiar de um dado que não apareceu.** Só apareceu
porque o dono conhece a operação de cor.

Oito lugares liam cortado, todos corrigidos com `lerTudo`: Analista, Gestão,
Painel, **Placar da Equipe** (mostrava o desempenho de uma pessoa para os
colegas dela, com número menor que o real e sem como ela contestar), Follow-up,
feed `.ics`, o aprendizado do Responder e a sincronização.

**Trava:** `paginacao_check.mjs`, no CI. Ela cobre também **o caso mais
perigoso, que não tem `.limit()` nenhum** — consulta sem limite parece inocente
e é a mais exposta.

### A varredura terminou: 39 pendências → ZERO (14/ago, mesmo dia)

E a triagem devolveu um resultado incômodo: **26 das 39 não eram leitura
nenhuma.** Eram `insert`, `update` e `delete`, que não devolvem linha para o
PostgREST cortar. **A trava media `.from("tabela")`, não "leitura que pode
voltar cortada"** — e era isso que fazia a dívida parecer grande demais para
resolver. É o mesmo defeito que a trava do `seed-curso.mjs` já teve, e a lição
não mudou: *trava que nasce de um bug concreto tende a medir aquele bug em vez
da propriedade.*

**Corrigido o que ela media, apareceram OITO leituras reais escondidas** —
inclusive:

- **A metade que faltou do defeito ao vivo.** Em Gestão, Analista, Follow-up e
  Placar, as `interactions` foram paginadas naquele dia e os **`contacts`
  não** — e é o array de contatos que dá o DENOMINADOR: leads do período,
  carteira, conversão. Denominador cortado faz a conversão **subir** sozinha,
  que é o erro andando na direção que agrada.
- **O gasto global do mês no painel do fabricante**, que escapava porque a
  consulta VIZINHA usava `.maybeSingle()` — a trava procurava o escape na
  janela inteira, então uma consulta absolvia a outra. Um freio de custo lendo
  menos que o real é o único erro daquela tela que não dá para corrigir depois.
- **O `.ics` assinado no Google/Apple**, o **Funil** (gráfico certo sobre dado
  incompleto), a **Agenda**, a **exportação de contatos** (o arquivo sai com
  cara de completo), o **dedupe do importador** e a **redistribuição de
  carteira quando alguém sai da equipe** (o que passava de 1.000 ficava órfão).

**Hoje a linha de base é 0** e a regra deixa de ser "dívida que não cresce":
é dívida que não existe.

**O que já estava errado HOJE, não amanhã:** `interactions` tem **2.177 linhas**
no banco. A leitura cross-tenant da tela de preços já vinha cortada. Os
`contacts` são 620 — abaixo do teto, então aquelas eram armadilhas armadas
esperando os 9 mil cadastros para disparar todas juntas.

### ⚠ E a trava estava com defeito próprio: CRLF

`paginacao_check` tirava comentário de linha com `/\/\/.*$/`. **`.` não casa
com `\r`**, que o JavaScript trata como terminador de linha — e os arquivos
aqui estão em CRLF. Resultado: **nenhum comentário de linha era apagado**, e a
trava lia comentário como se fosse código. Ela chegou a acusar `.limit(5000)`
numa consulta paginada há dias, porque o `5000` estava no comentário que conta
a história do defeito.

A mesma causa quebrava o `sugestoes_dna_check` INTEIRO no Windows: o bloco de
campos é achado por `/\ndna_sections:\n/`, que não casa com `\r\n`, então ele
terminava com *"nenhum campo de texto encontrado"* — enquanto no CI, que roda
em Linux com LF, passava. Corrigido: hoje ele mede os 229/229 de verdade.

**A regra que fica: trava que dá resultado diferente na máquina de quem
desenvolve e no CI é trava que a pessoa aprende a ignorar** — e a seção 6 deste
documento manda justamente rodar estas verificações localmente. Ao escrever
verificação nova que lê arquivo, normalize a quebra de linha.

### O que foi entregue em 11–14 de agosto

| Entrega | Onde |
|---|---|
| **Fila com quitação e motivo único** — combinado que nunca dava baixa (233 de 251 vencidos, 74 já respondidos) | `lib/fila.ts` |
| **A regra do pretexto** — uma DATA não é um MOTIVO. 257 contatos com `next_action` e ZERO com nota | `lib/fila.ts` |
| **39 etapas mudas ganharam cadência** — 80/80 etapas vivas, 117 passos curados | 15 manifestos |
| **Renovação e recompra saíram do núcleo** para o manifesto (Lei 1) | `lib/renovacao.ts` |
| **Vigência com carimbo de conferência** — o caso Maria Isabel | `lib/renovacao.ts` |
| **O ciclo técnica → desfecho**, desenhado para dizer "ainda não sei" | `lib/aprendizado.ts` |
| **Comparação foto × histórico** com trava de planilha parcial | `lib/sincronizacao.ts` |
| **Leitor de planilha** (CSV e o `.xls` que é HTML), recusa adivinhar a chave | `lib/planilha.ts` |
| **Custo de IA por período** no painel do fabricante | `/painel/admin` |
| **"Gerar acesso"** na Equipe — ninguém mais espera e-mail | `/painel/equipe` |

### Os próximos passos, em ordem

1. **Confirmar a gravação da sincronização com o arquivo grande.** A causa
   (tamanho do corpo) está consertada e no ar; falta o teste dele. Sem isso os
   11 encerramentos e as 3 renovações medidas não entram no banco.
2. ~~**Continuar a varredura de paginação**~~ — **FEITA em 14/ago**: 39 → 0.
3. **Os estados comerciais que faltam**, agora com dado real medido:
   **"fechado sem pagar"** (7 dos 324 matriculados nunca pagaram — a Noeli é o
   caso) e **"atraso fora do hábito"** (a Maria Isabel atrasa 3 dias *sempre* e
   *sempre paga*; cobrá-la no dia 1 seria perseguir quem paga há 3 anos).
4. **Cadência de convênio** — o fundador confirmou que quer o **check-in**, não
   a conversão. Objetivo é FREQUÊNCIA, e isso explica os 9% de resposta do
   convênio contra 54% do WhatsApp: não é conversa de compra.
5. **SMTP** (Resend recomendado) e **motor proativo** — os dois dependem de
   ação dele; ver `COS_Plano_de_Execucao.md` §F1 e §F4.

### Decisões fechadas nesta conversa (não reabrir)

- **NÃO publicar a planilha na web.** São nome, CPF, endereço e telefone de 9
  mil pessoas; "publicar" cria URL acessível sem login e indexável. Conta de
  serviço ou upload.
- **CPF e endereço são descartados na porta** (`DESCARTADAS` em
  `lib/planilha.ts`). O sistema não precisa deles para decidir com quem falar.
- **A planilha é a foto de hoje; o histórico é do banco.** O sistema nunca
  escreve nela. Ausência vira histórico.
- **O sistema deriva a marcação de convênio** cruzando as abas — o fundador
  recusou manter coluna à mão, e tinha razão: trabalho manual recorrente para
  de acontecer e o dado fica errado em silêncio.

---

## 0.1. A ENTRADA DO PRODUTO — 9 e 10 de agosto de 2026

> Dois dias inteiros num só assunto: **fazer uma pessoa de fora conseguir
> entrar.** Vale ler antes de tudo, porque é a área que mais quebrou e a que
> tem o padrão de defeito mais instrutivo do projeto.

### O que passou a existir

`/criar-conta` → `/painel/nova-empresa` (nome, cidade, ramo) → onboarding.
A empresa nasce, a Skill do ramo é instalada e os 30 dias começam sozinhos.
Antes disso a única porta era o fabricante criar a empresa do cliente na mão —
o fundador chamou de **"ritmo anormal"**, e estava certo.

Junto: `/confirme-email`, `/recuperar`, `/definir-senha` (com nome e senha),
`/auth/confirmar`, `/auth/sessao`, e o link do convite com botão de copiar e de
enviar no WhatsApp.

### ⚠ O PADRÃO: todo defeito foi AUSÊNCIA DE SINAL, não erro

Nenhum dos seis apareceu como exceção, log ou tela vermelha. Todos se
apresentaram como sucesso, silêncio ou vazio — e por isso **todos foram
descobertos por uma pessoa de fora tentando usar**, nunca por mim relendo o
código.

| Defeito | Como se apresentou |
|---|---|
| Lista de ramos vazia (RLS de `skills`) | Formulário normal, com um espaço em branco |
| Perfil criado depois do vínculo | Empresa criada **e órfã** |
| Sessão no fragmento da URL | "Não consegui completar o acesso" |
| Conta que já existe | **Sucesso** sem sessão, e a tela pedia confirmação |
| `listMemberships` sem filtro | "Be Fitness" cinco vezes no seletor |
| `profiles_self` | Nome gravado, tela em branco |

**A lição de método:** quando o sintoma é "não acontece nada", a causa quase
nunca está onde o sintoma aparece. Reproduzir a operação contra o banco real e
comparar o MESMO `select` com clientes diferentes achou três deles; ler o
código de novo não achou nenhum.

### A RLS de `skills` pegou TRÊS VEZES

`skills_read_installed` só mostra a Skill **já instalada**. Com o cliente do
usuário, qualquer pergunta sobre segmento não instalado volta **vazia** — sem
erro. Pegou em `listarRamos`, em `listSegments` e em `installSkill`, com
sintoma diferente a cada vez, e a segunda e a terceira estavam **no mesmo
arquivo**.

Corrigir ocorrência não fecha classe. Hoje existe
`skills_client_check.mjs` no CI: um inventário dos 14 pontos que leem a tabela,
classificados em `proprio` (Skill do tenant → cliente do usuário) e `catalogo`
(segmento não instalado → **precisa** de `service_role`). Ponto novo falha até
ser classificado.

### O DNA deixou de ser caixa vazia

Dos 380 campos de DNA dos 15 manifestos, **229 eram texto aberto e nenhum tinha
alternativa**. Hoje **229 de 229** abrem sugestões ao clicar, com "nenhuma
dessas — escrever" e "não sei ainda".

Três regras que protegem a trava anti-invenção, e valem para qualquer campo
novo: **nada vem pré-selecionado**; **"não sei ainda" esvazia** (aproximação
vira fato afirmado, e campo vazio faz o motor escalar, que é o certo); e as
opções são **formato do ramo**, nunca fato daquela empresa.

`sugestoes_dna_check.mjs` no CI: segmento novo não nasce sendo caixa vazia.

### O que ainda morde

- **O e-mail nativo do Supabase é lento e limitado.** Foi ele que travou a
  equipe da Be Fitness por horas. SMTP próprio resolve confirmação,
  recuperação e convite de uma vez.
- **Mas a dependência de e-mail era a falha de projeto, e essa foi fechada.**
  SMTP é a correção do sintoma: enquanto o e-mail for o ÚNICO caminho para
  destravar alguém, o produto tem um ponto único de falha operado por
  terceiro. O convite já tinha a saída (link copiável); quem já era membro e
  esqueceu a senha, não — sobrava "Esqueci minha senha", pelo mesmo canal que
  estava quebrado. Hoje a tela de Equipe tem **"Gerar acesso"** por pessoa.
  A regra do socorro virou botão em vez de procedimento que só eu executo.
- **`NEXT_PUBLIC_SITE_URL` era dependência invisível de três telas de acesso.**
  `criar-conta` e o convite tinham cascata de origem; `confirme-email` e a
  recuperação usavam `?? ""` — e a variável não está no `.env.local`. Origem
  vazia não dá erro: o Supabase manda o link para a "Site URL" padrão dele e a
  pessoa chega na raiz do site, deslogada. Mesma classe do resto desta seção.
  Hoje a cascata é uma só (`lib/site.ts`) e a variável virou opcional.
  Junto: a recuperação **engolia o erro do envio** — a resposta neutra é de
  propósito (anti-enumeração), mas ela também escondia SMTP fora do ar e
  limite de envio estourado. O log de servidor passou a registrar; a mensagem
  na tela continua a mesma.
- **Ordem de socorro:** quando alguém está travado, **destrave a pessoa
  primeiro** (senha definida pelo admin leva 30 segundos) e conserte a causa
  depois. Em 10/ago isso foi feito ao contrário e custou horas de uma
  funcionária parada.

---

## 1. O que estamos construindo

Um **motor de inteligência comercial multi-tenant**. O produto vendável é o
núcleo; os segmentos são **dado** (manifesto YAML), nunca código.

**Origem:** protótipo validado no Base44 na academia do fundador (Be Fitness,
Porto Alegre). A migração existe porque no-code não dá posse, multi-tenancy real
nem controle de custo de IA.

**O ativo real não é o código.** É a **biblioteca curada** — hoje 285 entradas
em 15 segmentos, com técnica de venda aplicada a contexto específico.

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
- **Escola de venda como dimensão canônica (M1)** — `strategy_map` no manifesto
  diz qual das 9 escolas governa cada categoria **naquele segmento** (barbearia
  fecha por alternativa onde indústria monta oferta: Rackham mostrou que
  pressão derruba conversão em ticket alto). `sales_schools` guarda princípio,
  quando usar, **quando NÃO usar** e a força da evidência de cada uma.
- **Aprender o que converte** — desfecho registrado realimenta o motor.
- **Follow-up** — a tela que cobra o toque, por cadência do manifesto.
- **Recorrência** — quem está no ponto de voltar, com data no dia preferido.
- **Agenda com disponibilidade real** — jornada por empresa **e por
  profissional**, folgas/bloqueios, e o motor **fecha o horário** (`origem=motor`).
- **Contatos, Funil, Gestão** (com Analista de IA), **Equipe**, **DNA**,
  **Onboarding** (escolha de ramo + entrevista), **Tutorial**, **Automação**.
- **Fila de envio** (`/painel/fila`) — os quatro motivos para falar com alguém
  numa lista só, ordenados por **custo de furar**: o combinado (o cliente
  lembra que marcou), o contrato a vencer, o follow-up devido e a recompra.
  Cada pessoa aparece **uma vez**, pelo motivo mais urgente. A mensagem é
  gerada sob demanda e vai pelo `wa.me` com um clique — **a inteligência é
  nossa, o envio é humano.**
- **Próxima ação com data** (`0049`) — a data que o CLIENTE marcou, diferente
  da cadência (régua do ramo) e do "esfriando" (alarme de ausência).
- **Renovação com vigência** (`0050`) — três janelas (60/30/7), e o primeiro
  toque fala do RESULTADO, não de renovação.
- **Placar da equipe** — time primeiro, indivíduo depois, e conversão só vira
  percentual quando a amostra sustenta (piso de 30 leads).
- **Aparência por empresa** (cor e logo) e a página **Sobre**, que continua
  dizendo quem é o fabricante — marca branca completa esconderia quem responde
  pela LGPD.
- **Catálogo** — importação de planilha que reconhece as colunas sozinha.
- **Add-ons**: **Oportunidades** (prospecção B2B por CNAE) e **Licitações**
  (PNCP: editais, inteligência, quem ganhou, guia + assistente de IA).
  Cada edital diz **por que apareceu** — qual palavra o trouxe e se ela está no
  objeto ou só na lista de itens, que abre sob demanda com o item destacado.
- **Painel do fabricante** — cross-tenant, custo de IA, margem, **Acesso e
  planos** (teste grátis e liberação de módulos por empresa) e **Cota de IA**
  (o teto que age sozinho).
- **Cota de IA e teto de gasto** (`0047`) — cota mensal de atendimentos com IA
  por empresa, teto de dinheiro por empresa e **teto global do fabricante**,
  todos com suspensão automática até virar o mês. Quando o teto é atingido a IA
  para e o **cockpit manual continua ilimitado e sem custo**: nenhuma empresa
  fica sem produto. Era o item que o `COS_Kairos_Vende_Kairos.md` marca como
  "vem antes de qualquer convite" — sem ele, sucesso comercial vira prejuízo, e
  é o único erro daquela lista que não dá para corrigir depois de acontecer.
- **Curso completo** — 9 módulos, 45 lições, 122 perguntas, 267 minutos, com
  **repescagem espaçada** (`course_review`: as perguntas voltam em 2 → 5 → 12 →
  30 dias por acerto seguido; errar zera). A teoria é uma só; o exemplo vem da
  biblioteca do segmento da empresa.

### Segmentos — 15 completos, 285 entradas curadas
| Segmento | Biblioteca | Módulos |
|---|---|---|
| `academia` | 23 | — |
| `software_b2b` (o Kairós vendendo o Kairós) | 23 | prospecção |
| `curso` (idiomas, profissionalizante, preparatório, in-company) | 23 | — |
| `energia_solar` (fotovoltaica + **híbrido com bateria**) | 23 | prospecção + licitações |
| `industria` (têxtil/feltro, calçado, moveleira, metal-mecânica, embalagens, autopeças, implementos) | 20 | prospecção + licitações |
| `barbearia` | 19 | — |
| `distribuidora` (atacado) | 17 | prospecção |
| `automacao` (predial, climatização, energia) | 17 | prospecção + licitações |
| `escola_esportiva` (natação, lutas, crossfit, pilates, clubes) | 17 | — |
| `clinica` (médica, odonto, estética) | 16 | — |
| `sob_medida` (marcenaria, vidraçaria, serralheria, solar) | 16 | prospecção + licitações |
| `oficina` (mecânica, elétrica, funilaria, pneus) | 18 | prospecção |
| `salao_beleza` (cabelo, química, unhas, estética rápida) | 19 | — |
| `casa_de_festa` (infantil, formatura, casamento, corporativo) | 17 | — |
| `pet` (banho e tosa, creche, hotel) | 17 | — |

**Todo segmento tem uma entrada de INDECISÃO** (o cliente que concordou e mesmo
assim travou — 40 a 60% das perdas, segundo o JOLT) e os B2B têm a do
**comprador que não quer conversar** (67% do B2B prefere se servir sozinho).

### O critério que decide SE um segmento vira Skill (ago/2026)

Descoberto respondendo uma dúvida do fundador sobre imobiliária — *"se não
teremos acesso aos sites de locação e venda, onde poderíamos ser diferentes?"*.
A dúvida estava certa, e ela expôs uma regra que os 12 segmentos entregues já
seguiam sem estar escrita.

**Uma Skill vale quando as duas coisas valem:**

1. **Os fatos que governam a resposta são DA EMPRESA — poucos, estáveis e
   capazes de caber no DNA.** Hora técnica, lote mínimo, política de peça,
   régua da química, taxa de rolha, intervalo de revisão. É isso que a trava
   anti-invenção verifica; sem isso ela não tem contra o que verificar.
2. **O gargalo do negócio é técnica de conversa, não gestão de inventário.**

**Imobiliária quebra as duas.** O "produto" são centenas de imóveis de
TERCEIROS, que mudam toda semana, e cujos fatos (preço, metragem, condomínio,
IPTU, matrícula) são por unidade — não da empresa. E esses dados já vivem num
CRM imobiliário que a imobiliária tem, com feed para os portais. Seríamos o
**segundo sistema**, e o segundo sistema perde.

**E o add-on que parecia óbvio é o teste que reprova.** Licitações e
Oportunidades funcionam porque trazem **demanda de fora para dentro**: editais
e empresas que o vendedor não tinha. Um feed de portais faz o **contrário** —
leva o inventário de dentro para fora. Isso é logística de publicação, é table
stakes naquele mercado, e construir seria **empatar, não diferenciar**: nos
colocaria a competir no eixo onde somos fracos (inventário) diluindo o eixo
onde somos fortes (técnica).

**Regra do add-on, então:** bom add-on traz demanda de fora para dentro. Add-on
que leva dado de dentro para fora é integração, e quem já faz isso faz melhor.

*Se um dia houver frente imobiliária, o recorte que passa nos dois critérios é o
**corretor autônomo** — carteira pequena, relacionamento é tudo, follow-up é o
buraco e ele não tem CRM. O ticket é pequeno; a decisão é comercial, não
técnica.*

**Regra do segmento novo:** `energia_solar` só existiu porque `sob_medida` dizia
"solar" no nome e **nenhuma das suas entradas falava de solar**. Nome de
manifesto não é cobertura — cobertura é entrada curada. A regra foi aplicada de
novo em `oficina` (ago/2026): antes de escrever, conferi que nenhuma das 166
entradas existentes falava de diagnóstico, peça original, autorização de serviço
ou revisão por quilometragem.

**Biblioteca nova nasce COM ACENTO (decisão, ago/2026) — e a dívida das nove
antigas foi paga.** As nove primeiras foram escritas em ASCII, quando
`technique`, `strategy` e `trigger_questions` eram anotação interna do motor.
Não são mais: o Responder mostra a técnica ao vendedor e o exercício do curso
mostra o gatilho ao aluno **como mensagem de cliente**.

As nove foram acentuadas (ago/2026): **+4.573 acentos**, 13,2% a 16,4% das
palavras acentuadas — a mesma densidade das quatro novas (14,8% a 17,5%).
Três coisas fizeram isso ser seguro num arquivo de curadoria:

- **A invariante.** Tirando os acentos do resultado, ele tem que ser idêntico ao
  original. Nenhuma palavra some, nenhuma vírgula anda, nenhuma frase é
  "melhorada" no caminho — e o diff fechou em 1.739 linhas trocadas por 1.739.
  Sem essa trava, passar um script por 200 KB de curadoria é aposta.
- **O casamento não se mexeu**, por construção: `toks()` em `lib/match.ts`
  normaliza para NFD e remove diacrítico antes de comparar, então o fluxo de
  termos é o mesmo. Medido depois: `retrieval_check` 51/51 e 96,7% dos 1.261
  gatilhos, iguais.
- **Homógrafo não se automatiza.** `é/e`, `está/esta`, `dá/da`, `fábrica/fabrica`,
  `análise/analise` dependem de contexto. Um classificador treinado no português
  já escrito no repositório foi medido por validação cruzada **antes** de
  aplicar: 82% em `e/é` — reprovado, e as ~2.600 ocorrências foram decididas uma
  a uma. O número existe porque medir antes é mais barato que descobrir depois.

**A trava:** `packages/db/tests/acentuacao_check.mjs`, no CI. Ela conhece 444
palavras que este repositório só escreve com acento e reprova qualquer uma delas
sem acento na prosa das bibliotecas e dos manifestos. Fica de fora o que é
**contrato** — `'clinica'` é `skill_key`, `options: [preco, prazo]` são as opções
canônicas, `pricing.range` é caminho de fato — e ficam de fora os 59 homógrafos,
de propósito: verificador que chuta contexto reprova texto certo até alguém
desligar a trava. Testada quebrando um arquivo de propósito.

Achado no caminho: dois `label` de manifesto (`"Quem puxa a decisao"`, em
`energia_solar` e `sob_medida`) estavam sem acento **na tela do cliente**. Foi a
trava que apontou.

Empresas de demonstração existem para todos (`demo-*`), vinculadas ao fundador —
trocar no seletor do topo do painel.

### Infra
- Migrations `0001`–`0050` aplicadas. RLS em tudo com `tenant_id`.
- `scripts/seed-skills.mjs` · `scripts/seed-knowledge.mjs` ·
  `scripts/criar-tenant-demo.mjs`.
- `SUPABASE_SERVICE_ROLE_KEY` em `apps/web/.env.local` (dá para semear e migrar
  direto daqui). `AI_API_KEY` (Anthropic) na Vercel e local.
- **Carga de dado do produto é trabalho do assistente, não do fundador.** Os
  scripts acima e o `mcp__supabase__execute_sql` escrevem no banco direto.
  Depois de semear, confira com um `select` independente (seção 6).

---

## 2.9 ⚠ A REGRA QUE CUSTOU UMA CONVERSA INTEIRA — `git push`

**Commit não é entrega. O fundador testa no deploy da Vercel, que builda do
GitHub.** Em ago/2026 eu acumulei **19 commits sem push** e ele passou uma
conversa inteira reportando como ausentes coisas que estavam prontas — dashboard
clicável, aparência, fila, próxima ação. Do lado dele, o produto simplesmente
não tinha mudado.

**Depois de cada entrega: `git push origin main`.** E ao ouvir "isso não está
aí", a primeira coisa a conferir é `git status -sb` — antes de reabrir o código.

---

## 3. Pendências — o quadro inteiro (ago/2026)

> Esta seção foi reescrita porque tinha apodrecido: dizia "0 desfechos" com 846
> no banco e "5 dos 8 demos sem DNA" com todos preenchidos. Item de estado que
> ninguém confere vira mentira com aparência de documentação.
>
> A fila executável e o que está **congelado por decisão** moram em
> `COS_Plano_de_Execucao.md`.

### 3.0 ⚠ O BLOQUEIO DA BE FITNESS QUE NINGUÉM TINHA VISTO (8/ago/2026)

O fundador disse que quer focar em **aumentar a taxa de renovação**. Conferido
no banco na mesma hora, e o resultado muda a prioridade:

| Dos 273 contatos da Be Fitness | |
|---|---|
| com `contract_end` (data de vencimento) | **0** |
| com `owner_id` (responsável) | **0** |

**A tela de Renovação lê `contract_end`. Com zero preenchido ela abre vazia** —
e as três janelas (60/30/7) do `0050` não têm o que disparar. O placar por
vendedor e a carteira leem `owner_id`, mesma história. O piloto do Base44 não
tinha esses campos, então a importação não teve o que trazer.

O importador **já reconhece** as colunas de vigência e converte data pt-BR
corretamente (`03/08/2026` vira 3 de agosto, não 8 de março —
`importacao_test.mjs`). **O que falta é a planilha**, que o fundador vai mandar.
É o item de maior retorno da lista inteira: é ele que transforma o produto de
"responde bem" em "aumenta renovação".

### 3.1 Depende do fundador — não dá para eu fazer

| O quê | Por que só ele |
|---|---|
| **Be Fitness: agenda** | Sem regra de disponibilidade **o motor não fecha horário** — diz "vou confirmar". O DNA tem o horário como TEXTO; converter no chute seria inventar compromisso. ~10 min |
| **Be Fitness: papel dos recepcionistas** | Cadastrar os três como `agent` em Equipe. Sem isso não há carteira por vendedor nem placar. ~5 min |
| **Be Fitness: ICP de prospecção** | Está com CNAE de instalação elétrica e "climatização" — resíduo de teste. Para academia o alvo é **convênio corporativo** (ver 3.4) |
| **WSS Labs: 6 campos de DNA** | Preço, duração do teste, o que acontece ao fim, prazo de implantação, exportação/retenção e contrato. Enquanto vazios **o motor escala** — comportamento correto, e a prova de que a trava vale na própria casa |
| **Revisão de `industria`** | A especialista (Feltros Bandeirantes). Kit pronto em `revisao/` |
| **Meta Business** | Cinco requisitos listados em `/painel/automacao`. Exige login, CNPJ e aceite em nome dele |
| **Google Agenda mão dupla** | OAuth. O `.ics` de leitura já funciona |
| **Domínio** | Apontar o Kairós para o domínio da WSS Labs |

### 3.2 Congelado por decisão — não reabrir sem motivo novo

- **Automação** (WhatsApp Cloud API + motor proativo agendado). Automatizar
  antes de provar que a resposta manual é boa é otimizar a coisa errada.
- **Volume da prospecção** (base própria do dump da Receita). Custo e esforço
  altos para um gargalo que hoje não é o gargalo.

### 3.3 Fila técnica — comigo

**A fila de 7 itens de ago/2026 foi toda entregue** (placar, atribuição em
lote, etapa no Responder, aparência+Sobre, proximidade, tutorial, fila `wa.me`),
e com ela o roteiro do "Kairós vende o Kairós" fechou. O que resta:

1. **M2 — escola × desfecho.** Destravado: os 846 desfechos do piloto existem.
   Mas a regra do fundador vale — **segmentar por ORIGEM e declarar o n** antes
   de qualquer leitura. Convênio tem 15% de perda contra 46% do WhatsApp.
2. **Carga dos 3.000 contatos com controle de custo** (ver 3.5).
3. **Volume da prospecção** — a fonte pública devolve ~20 por chamada.
4. ~~**Telefone em E.164**~~ — **FEITO em 8/ago/2026**, junto com a camada de
   envio, que era o gatilho combinado. Detalhe na seção 3.6.
5. **Auditoria ainda adiada com motivo**: dinheiro como string no DNA (junto
   com o primeiro relatório que precise), `embedding` sem índice ANN (interage
   mal com RLS).

### 3.6 A camada de envio e o E.164 (8/ago/2026)

O fundador pediu a camada de envio antes de escolher o canal — decisão certa,
porque a escolha do canal ficou mais difícil, não menos: **ele não tem CNPJ da
WSS Labs, só da Be Fitness.** A verificação da Meta sairia no CNPJ da academia,
o que resolve o piloto e não resolve o produto (o Kairós vendendo o Kairós
precisaria de outro remetente).

`lib/envio.ts` é a porta única. Antes disso, seis telas montavam `wa.me` cada
uma do seu jeito. **Ela não finge que os dois modos são iguais**: o resultado
diz o MODO — `humano` (link para alguém clicar) ou `automatico` (id do
provedor). Achatar num `enviar()` que devolve `true` esconderia a diferença que
mais importa hoje: quem aperta enviar é uma pessoa.

O provedor da Cloud API está escrito contra a documentação e **nunca foi
executado contra a API real**. Fica desligado por padrão (`WHATSAPP_CANAL`).
Quando houver credencial, a primeira mensagem vai para o próprio número.

**E.164 destravado por escopo, não por pressa.** O motivo do adiamento era
"normalizar no chute corrompe número de cliente". O que mudou: um país só, com
as regras da Anatel, que são fechadas — celular é DDD + 9 dígitos começando em
9, fixo é DDD + 8 começando em 2-5, e a lista de DDDs é finita. O **comprimento
desambigua sozinho**.

**A regra que mantém o motivo do adiamento válido:** `paraE164BR` **deriva e
nunca grava**. `contacts.phone` continua sendo o que a pessoa digitou. Se a
derivação errar, o pior é uma mensagem não sair — não um cadastro destruído.
Falhar ≠ corromper.

**Bug de corrupção que estava no ar:** `oportunidades` decidia por
`d.startsWith("55")`, e **DDD 55 é Santa Maria/RS**. O celular 55 98765-4321
era lido como "já tem código de país" e virava número truncado — em silêncio, e
no estado da primeira empresa real do produto.

**Medido na base real** (`scripts/diagnostico-telefones.mjs`, leitura paginada
porque o PostgREST corta em 1.000 linhas sem avisar): dos 273 contatos, **154
saem direto, 107 (39%) são celular antigo sem o nono dígito, 12 não têm
conserto**. Como 39% dependem de uma **interpretação**, o aviso aparece na fila
para quem vai clicar, não só no log. O diagnóstico achou dois casos que ninguém
tinha visto: um contato com o DDD digitado duas vezes e um número francês na
base.

### 3.4 Descoberto conversando (ago/2026) — prospecção em B2C local

O fundador perguntou como uma academia prospecta sem lista, "a não ser varrer as
empresas próximas oferecendo convênio". **A intuição está certa e expõe uma
lacuna do produto.**

Prospecção fria B2C é proibida (LGPD, decisão fechada). Mas academia, salão,
clínica e escola **prospectam B2B**: empresas vizinhas para convênio
corporativo. Isso é dado público, é permitido, e o módulo Oportunidades já faz
exatamente isso — só que os manifestos B2C-local têm `capabilities: []`, então
ele nem aparece.

**O que falta não é código de prospecção: é o recorte.** Para convênio, o filtro
útil é CNAE de empresa com muitos funcionários **por raio de distância**, não por
ramo do cliente final. Fica registrado como decisão a tomar, não como tarefa
começada.

### 3.5 O caso dos 3.000 contatos — custo e risco

O fundador entregou aos 3 recepcionistas uma lista de 3.000+ contatos para
cadastrar e mensagear. Duas contas que precisam estar na mesa:

- **Cadastrar não custa nada.** Importar contato não gasta IA.
- **Gerar uma resposta com IA por contato custa ~R$ 780** (3.000 × R$ 0,26), de
  uma vez. Com duas ou três trocas por conversa, passa de R$ 2.000.
- **O risco maior não é o custo, é o número.** Três pessoas disparando centenas
  de mensagens em poucos dias é o padrão que faz o WhatsApp banir — mesmo com
  envio manual, mesmo para base própria. O número da academia é o ativo.

**O formato que gasta pouco e não queima o número:** o grosso da lista vai pelo
**modo manual**, que é ilimitado e custa zero; a IA entra em quem RESPONDE, que
é onde ela vale. E a lista se divide por situação (quem sumiu, quem nunca
converteu, quem é recompra) em vez de virar um disparo só — que é exatamente o
que Follow-up e Recorrência já fazem, com ritmo diário em vez de rajada.

---

## 3.5 O piloto real entrou (ago/2026) — o que ele mudou

O piloto do Base44 (BeFitness Sales Mentor) foi importado:
**273 contatos, 2.105 interações, 846 desfechos**. O COS tinha zero até
então, e era o bloqueio que mais aparecia. `scripts/importar-base44.mjs`
(simula por padrão) e `scripts/canonizar-tecnicas.mjs`.

**O número que interessa** — pessoas distintas, 15 dias de operação:

| desfecho | pessoas |
|---|---|
| perdeu por **silêncio** | **194** |
| respondeu | 99 |
| avançou de etapa | 45 |
| perdeu por **decisão** | **56** |
| ganhou | 14 |

Perde-se **3,5× mais gente por falta de follow-up do que por objeção**. É a
tese do produto medida na academia do fundador, não em blog.

**Duas mudanças estruturais que o dado real forçou:**
- `0044` — a enum de desfecho era estreita (um único `sumiu`) e violava a
  Lei 1 (`matriculou` é vocabulário de academia). Virou canônica e de
  processo: `respondeu | avancou | ganhou | perdeu_decisao |
  perdeu_silencio`. Feito no único momento em que era de graça: zero
  desfechos gravados.
- `0045` — `interactions.schools` é **array**. O M2 previa uma escola
  singular; o dado mostrou que cada atendimento usa 3 ou 4 juntas, e
  creditar o desfecho a uma só seria inventar atribuição.

**As 9 escolas absorveram 100% dos 898 rótulos do piloto** (Belfort,
Girard, Tracy, Cardone, Hormozi, Kahneman, Jim Thomas). A taxonomia do M1
aguentou dado de campo — é a primeira validação externa dela.

### ⚠ A regra que eu quebrei e fica escrita

**Não concluir nada sobre escola × conversão ainda.** Eu apresentei um
ranking de "qual escola converte" e o fundador derrubou com dois
argumentos, os dois certos:

1. **Origem contamina o denominador.** Contato de convênio
   (TotalPass/Gympass) tem 15% de perda contra 46% do WhatsApp — ele não
   está comprando plano, está usando um benefício que já paga. Somar as
   duas origens numa taxa só mede coisas diferentes.
2. **A amostra não sustenta.** 15 dias, 14 pessoas que fecharam. Cialdini
   "liderou" com 1 fechamento em 53 pessoas.

**Antes de qualquer leitura de escola: segmentar por origem e declarar o
n.** Tabela bonita com n pequeno é o folclore que este produto existe para
não repetir — e ela é mais perigosa vinda de nós, porque tem cara de dado.

Hipótese aberta, para medir quando houver volume: `cadencia_blount`
progrediu 6% (o pior) com 157 de 183 pessoas sumindo. Pode ser que o
follow-up esteja sendo usado **tarde**, em quem já esfriou — o teste é o
tempo entre o contato e o primeiro toque de retomada.

---

## 4. Armadilhas já descobertas (não repetir)

- **`tenant_skills`**: a RLS de `skills` exige o vínculo. Gravar só
  `tenants.skill_key` faz o painel abrir **sem etapas e sem origens**. Use
  sempre a RPC `install_skill(tenant, skill_key)`. Já derrubou a Barbearia Demo
  e as 5 demos criadas depois.
  **E pegou de novo em 9/ago/2026, do outro lado da mesma regra.** A tela de
  criar empresa listava os ramos com o cliente do USUÁRIO — e quem está criando
  a PRIMEIRA empresa não tem vínculo, então a lista vinha com **zero linhas**.
  A primeira pessoa de fora do produto (Feltros Bandeirantes) travou ali: viu
  nome e cidade, um vazio onde deviam estar os 15 ramos, e o servidor
  respondendo *"escolha o ramo"* para uma escolha que não existia na tela.
  Ela descreveu como *"coloquei o nome e ele continuou pedindo o nome"*.
  **Catálogo de segmento é dado de produto, não de tenant: leia com
  `service_role`** — e só `key` e `name`, porque o `manifest` carrega a
  biblioteca de estratégia (`0006`).
  A lição de método: os logs da Vercel não ajudaram (1 requisição em 24h) e
  "nenhum erro de runtime" não provava nada. Quem resolveu foi rodar a operação
  inteira contra o banco real e depois comparar o **mesmo SELECT com os dois
  clientes**.
- **Unicidade de `skills` é `(key, version)`**, não `key`.
- **PNCP derruba rajadas** — 28 chamadas simultâneas, 24 falham. Use `getJson`
  (retry) + `mapLimit`. `tam_pagina` até 100 funciona; paginação funciona;
  **a busca textual ignora filtro de data**.
- **A biblioteca curada não chegava ao motor.** Até ago/2026 o Responder lia só
  `source='tenant'`. Os 134 registros dos 8 segmentos estavam no banco e **nunca
  alimentavam a IA** — efeito colateral do P0 do `0006`, que fechou a leitura
  global para `authenticated` e previa "retrieval server-side" que ninguém
  implementou. Corrigido: `ai-actions` busca a biblioteca do segmento com
  `service_role` (estratégia não vai ao browser). **Se criar tela nova que use a
  biblioteca, lembre: com o client do usuário ela volta vazia.**
- **Correção de dado vai no SEED, nunca em `UPDATE` de migration.**
  `seed-knowledge.mjs` recarrega com DELETE + INSERT: qualquer conserto feito
  por `UPDATE` numa migration posterior evapora na primeira recarga, e um
  ambiente novo nasce com o erro. A primeira versão do `0027` fazia isso com a
  escola de venda — virou dado explícito na 17ª coluna dos seeds. **O
  repositório é a verdade; o banco é só onde ela é executada.**
- **Um `;` perdido no meio do seed some com entradas, em silêncio.** O `0017` da
  barbearia tinha um: encerrava o INSERT na 16ª tupla e deixava 3 órfãs. SQL
  inválido que ninguém percebeu, porque o carregador só lê menos e não reclama.
  O `library_check` agora reproduz o corte do carregador e falha quando o número
  lido difere do número de entradas do arquivo (trava testada com o arquivo
  quebrado de propósito).
- **`seed-knowledge.mjs` tinha dois bugs latentes (corrigidos ago/2026).** Lia só
  o ÚLTIMO `values` do arquivo — na academia, que tem 22 `INSERT` separados,
  carregaria 1 entrada **depois de apagar as 22**. E parseava o rodapé do
  arquivo: as queries de verificação viravam tuplas fantasma (28 lidas onde há
  22). Rode o carregador uma vez em qualquer seed novo antes de confiar nele.
- **Entrada nova vai no seed DO PRÓPRIO SEGMENTO, nunca em arquivo separado.**
  `seed-knowledge.mjs` recarrega com DELETE de tudo do `skill_key` antes do
  INSERT. Criei o `0036` só com 3 entradas de solar e ele **apagou as 18
  originais** — a regra já estava escrita aqui e eu mesmo violei. Fundido no
  `0030`. Se precisar acrescentar assunto novo a um segmento, **edite o seed
  dele**.
- **`technique` é USER-FACING — e `next_objective` também.** Os dois aparecem no
  Responder e no curso. A biblioteca da academia veio do Base44 com rótulos em
  inglês ("Hot Button", "Puppy Dog Close") e o fundador leu isso na tela.
  Traduzidos em ago/2026 mantendo o autor entre parênteses — creditar a escola é
  o método; o que não pode é o vendedor ler inglês.
  **A primeira passada não terminou o serviço:** em ago/2026 ainda havia 4
  rótulos de `technique` com inglês dentro (`Reassurance`, `Benefit stacking`,
  `Ecosystem value`) e **14 dos 15 `next_objective`** da academia em inglês.
  `next_objective` parece chave de máquina e não é: `lib/exercicio.ts` troca o
  `_` por espaço e mostra ao aluno *"Minha resposta leva ao próximo passo:
  isolate objection"*. Nenhum código casa com esses valores — são texto.
  **Ao criar entrada nova, os dois campos são para ser lidos.**
- **Rótulo pode contradizer o texto da própria entrada, e o rótulo é o que o
  vendedor obedece.** A entrada de dúvida vaga da academia ensinava descoberta
  no `strategy` e mandava *"devolver a pressão de preço"* no `technique`, com
  escola `fechamento_classico` — resto de quando ela era dona de "vou pensar".
  Nada quebrava: o `library_check` valida categoria, escola e fatos, não
  coerência entre campos. Ao mexer nos gatilhos de uma entrada, **releia o
  rótulo**: ele foi escrito para os gatilhos antigos.
- **Progresso de repescagem não pode morar em `course_progress.answers`.** O
  campo é reescrito quando a lição é refeita e é a base do cálculo da nota —
  gravar acerto de revisão ali infla a nota de uma prova que ninguém refez, e o
  número deixa de significar o que diz significar. O agendamento é por
  QUESTÃO, não por lição: chave diferente, tabela diferente (`course_review`,
  `0037`). O plano de execução afirmava que "o dado já é guardado desde o
  `0031`" — era meia verdade: o *erro* estava lá, o *quando volta* não.
- **O DELETE de recarga só pode alcançar o que o próprio arquivo reinsere.**
  Custou o curso inteiro (ago/2026). `seed-curso.mjs` apagava
  `course_modules` pelas chaves declaradas no arquivo — e o `0033` declara os
  **nove** módulos, porque a grade completa é o que o aluno vê desde o primeiro
  dia. Como `course_lessons.module_key` tem `on delete cascade`, recarregar
  **só o `0033`** apagava em cascata as 45 lições e as 122 perguntas de todos os
  módulos e reinseria as 5 do módulo 1. O comando saía **com três ✓ verdes** —
  os números do que ele inseriu estavam certos — enquanto oito módulos viravam
  "em breve" na tela. Quem pegou foi o fundador, abrindo o curso.
  Duas correções: módulo agora é **upsert** (registro de grade é compartilhado
  entre arquivos, ele se atualiza, não se apaga), e o carregador passou a
  imprimir **o curso inteiro** ao final, não só o que acabou de escrever.
  A lição maior é a segunda: **relatório que só mostra o que a operação
  escreveu não enxerga o que ela derrubou ao lado.** Toda carga destrutiva
  precisa conferir o conjunto, não a própria saída.
  Verificado nos vizinhos: `seed-skills.mjs` faz update-or-insert (sem delete);
  `seed-knowledge.mjs` apaga por `skill_key` e reinsere tudo daquele
  `skill_key` do mesmo arquivo — dentro da regra.
- **A posição da alternativa correta não pode ser PREVISÍVEL — e distribuição
  não prova isso.** A trava do `seed-curso.mjs` foi escrita duas vezes, e a
  primeira versão media a coisa errada.
  *1ª vez:* as 16 primeiras perguntas saíram todas com a certa na 1ª opção. A
  trava passou a exigir distribuição (máximo metade na mesma posição).
  *2ª vez:* o fundador pegou de novo, e o padrão era outro — a certa **andava
  uma casa a cada pergunta** (1, 2, 3, 4, 1, 2, 3, 4…) pelo módulo inteiro. A
  trava de distribuição não só deixou passar: uma rotação perfeita dá **25% em
  cada posição**, o número mais saudável possível. Ela media o sintoma do
  primeiro erro, não a propriedade que importa.
  Hoje a trava mede **ciclo**: para períodos de 2 a 5, quanto a certa se repete
  em relação a *p* perguntas atrás. O acaso bate ~25%; o teto é 60%. E mede
  **por módulo além do arquivo** — um arquivo com três módulos dilui o ciclo de
  um deles até ele sumir na média, e o aluno vive um módulo por vez.
  A lição geral: **quando uma trava nasce de um bug concreto, ela tende a medir
  aquele bug em vez da propriedade.** "Variar de cabeça" vira ritmo, e ritmo é
  ainda mais fácil de decorar do que posição fixa.
- **Explicação de pergunta nunca se refere a posição.** "A primeira faz ele
  calcular", "as outras três" — a ordem das alternativas muda e a explicação
  passa a mentir sem ninguém perceber. Uma delas já estava errada antes de
  qualquer reordenação: dizia "a primeira" para uma resposta que estava na
  quarta. Referencie pelo **conteúdo** da alternativa.
- **Policy `FOR ALL` roda em toda LEITURA.** Uma policy de escrita marcada como
  `ALL` também é avaliada em cada `SELECT` — então `memberships`,
  `commercial_dna` e `knowledge_entries` pagavam `is_admin_of` **além** de
  `is_member_of` em toda leitura, nos três caminhos mais quentes do sistema.
  Corrigido no `0032` separando em INSERT/UPDATE/DELETE. **Otimizar RLS é onde
  mais se afrouxa segurança sem perceber** — por isso existe
  `rls_shape_test.sql`: leitura por membro, escrita por admin, 3/3.
- **`auth.uid()` sem `select` é reavaliado POR LINHA.** Numa policy, escrever
  `auth.uid()` cru faz o Postgres executar a função para cada linha avaliada.
  Com 50 contatos ninguém nota; com 50 mil, a consulta desaba. Sempre
  `(select auth.uid())`.
- **Etapa terminal desliga motor.** `computeDueTouches` (follow-up) e
  `computeDue` (recompra) pulam etapas `terminal`. Efeito descoberto em ago/2026:
  a barbearia tinha "Cliente recorrente" terminal, então **a carteira fiel nunca
  aparecia na recompra** — no segmento cuja tese é recompra. Corrigido em
  `stagesWithoutRecurrence`: etapa `won` continua recebendo recompra. Ao desenhar
  segmento novo: **cadência declarada em etapa terminal é dado morto.** Por isso
  `industria` tem "Sem reposição" **não-terminal**.
- **Itens do PNCP**: `GET /api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens`
  devolve um **array puro** com `descricao`, `quantidade`, `unidadeMedida`,
  `valorUnitarioEstimado` (verificado ago/2026). Buscar sob demanda, um edital
  por vez — puxar os itens de 100 editais de uma vez é a rajada que o PNCP corta.
- **O PostgREST corta em 1.000 linhas sem avisar.** Uma consulta com 1.053
  registros volta com 1.000, sem erro e sem aviso — o número chega
  plausível e menor. Aconteceu na canonização das técnicas e 53 interações
  sumiram em silêncio. Toda leitura que possa passar de mil linhas precisa
  de `.range()` paginado. Limite que não reclama é o pior tipo.
- **Biblioteca própria de empresa tem seed, mas ele NÃO vai para o Git.**
  ✅ Resolvido (ago/2026): `scripts/exportar-biblioteca-tenant.mjs` gera o
  arquivo e `seed-knowledge.mjs --tenant <slug>` recarrega. A ida e volta
  está provada com as 95 entradas da Be Fitness.
  **O arquivo mora em `private/`, que está no .gitignore, e o motivo é
  duro: o repositório é PÚBLICO.** Esta biblioteca é o ativo que o
  `CLAUDE.md` manda proteger — "código se copia em duas semanas; a
  curadoria, não". Commitar entregaria de graça a única coisa difícil de
  copiar. Se um dia o repositório virar privado, basta mover o arquivo
  para `packages/db/migrations/`: o formato já é o mesmo.
  Com o seed no lugar, os **rótulos em inglês foram traduzidos** (27 nomes
  de técnica + 58 frases descritivas com "CTA", "reassurance", "benefit
  stacking"). Hoje: 0 em inglês. O autor ficou entre parênteses — creditar
  a escola é o método; o que não pode é o vendedor ler inglês na tela.
- **Dois donos do mesmo gatilho é empate por construção.** Quando duas entradas
  do mesmo segmento reivindicam a mesma frase, nenhum ajuste de ranking
  desempata — e o efeito é silencioso, porque a errada vence com aparência de
  resultado normal. Aconteceu em `academia` ("vou pensar" em `objections` e na
  de indecisão) e em `clinica` ("vou conversar em casa" literalmente idêntico em
  duas). Agora o `retrieval_check` varre **todos os gatilhos curados** e exige
  que cada um traga a própria entrada em 1º (piso 95%; medido 95,5% de 885).
- **A prosa não pode decidir o 1º lugar.** `strategy` e `answer` são textos
  longos; somando sem teto, uma entrada que *fala do assunto* passava na frente
  da que *responde a pergunta*. Em `lib/match.ts` a prosa satura. Zerá-la seria
  pior: é ela que segura o recall quando ninguém escreveu gatilho para aquela
  pergunta. **Ao mexer no casamento, meça as duas coisas** — precisão sobre os
  gatilhos curados e recall sobre mensagens que não são gatilho de ninguém.
  Melhorar uma às custas da outra parece progresso e não é.
- **Teste não guarda cópia do algoritmo.** O `retrieval_check` mantinha uma
  reimplementação "fiel" de `lib/match.ts`, com um comentário admitindo que
  divergiria. Divergiu na primeira mudança real. O Node lê TypeScript direto:
  o teste importa o arquivo do app.
- **Toque que não QUITA fica devido para sempre — e o `combinado` não quitava.**
  Descoberto pelo fundador conferindo a Be Fitness (10/ago): uma aluna já
  matriculada no "Você combinou de voltar", **depois de já ter respondido**.
  Três causas somadas, e a que ele suspeitou (a régua de 30/60/90) era só a
  terceira:
  1. `next_action_at` é **data fixa e nada a limpava**. Vencida uma vez, a
     pessoa ficava na fila para sempre — no motivo de prioridade 1, que
     **mascara os outros três**. Os outros já quitavam: a cadência compara o
     último contato com o vencimento do passo, e recompra e "esfriando" são
     calculadas A PARTIR do último contato. Medido: **233 de 251 combinados
     vencidos, 74 com a pessoa já tendo respondido depois da data**.
  2. A regra "uma pessoa, um motivo" existia, mas **só dentro de
     `/painel/fila`** — a montagem morava no componente. O Painel inicial
     montava **cinco listas próprias** sem dedução nenhuma.
  3. **`phases` e `cadence` são a mesma régua declarada duas vezes** no
     manifesto (`convertido` da academia: 4 fases 7/30/60/90 **e** a cadência
     `pos_matricula` com os mesmos 4 passos). `computeDueTouches` lê a cadência
     e quita; `computeAlerts` lia as fases e emitia **uma linha por fase
     vencida, sem quitação** — 313 matriculadas × 2 fases passadas.

  Hoje `construirFila` em `lib/fila.ts` é a fonte única, e a regra é uma só:
  **o toque só é devido se ninguém falou com a pessoa depois que ele venceu**
  — qualquer direção, porque o toque existe para a conversa acontecer, e se
  ela aconteceu o motivo foi cumprido. **A quitação é derivada do histórico,
  nunca gravada**: `next_action_at` continua sendo o que o vendedor escreveu,
  então um envio que falhe adia a baixa em vez de destruir o compromisso —
  mesma regra do `paraE164BR`. Guardado por `fila_test.mjs` (14/14, testado
  quebrando a regra de propósito).
  **Regra que fica: fila é lógica, não é tela.** Lista de quem contatar que
  não passa por `construirFila` vai divergir — e em silêncio, porque duas
  listas erradas parecem duas listas.
- **⚠ UMA DATA NÃO É UM MOTIVO — a regra do pretexto (ago/2026).** Esta é a
  decisão de produto mais importante da fila, e ela nasceu de uma pergunta do
  fundador, não de um bug: vendo a **Noeli da Silva** — matriculada desde
  22/jul, plano trimestral até jan/2027 — sob o rótulo "Você combinou de
  voltar", ele perguntou *"se o sistema fosse 100% automático, ele abordaria
  com qual pretexto? saberia o real motivo?"*.
  **A resposta honesta era não — e ele escreveria mesmo assim.** Existia uma
  data (24/jul) e um rótulo herdado do Base44 (*"Continuar conversa e
  descobrir necessidades"*, escrito quando ela ainda era lead). A IA viraria
  isso numa mensagem simpática de descoberta para quem é aluna há 19 dias.
  **Fluente e errado é o pior defeito possível** numa mensagem que sai no nome
  da academia — e não dispara alarme nenhum.
  Medido: **257 contatos com `next_action` preenchido e ZERO com
  `next_action_note`**, e o rótulo **não é invalidado na mudança de etapa** (11
  pessoas em "Parou de responder" com "Continuar descoberta", uma matriculada
  com "Acompanhamento do trial"). A fila lia `next_action_note` e caía num
  texto genérico — os 163 combinados devidos da Be Fitness eram 163 rótulos de
  fluxo apresentados como compromisso com o cliente.
  **A separação que resolve, e que vale para o dia da automação:**
  - **MOTIVO é DERIVADO do estado** — etapa, dias na etapa, vigência, régua do
    ramo. Recalculado a cada abertura, então **não envelhece**.
  - **PRETEXTO só vem de fato escrito por alguém** (`next_action_note`) **ou
    da régua curada**. Texto de procedência desconhecida vira **anotação**,
    exibida como citação e mandada à IA com a ordem explícita de não usar como
    pretexto.
  Sem nota, o combinado vira `lembrete` — motivo de **menor** prioridade, para
  não mascarar quem sabe o porquê. Na Noeli o motivo passou a ser o certo: a
  cadência `pos_matricula` do dia 7 (*"Primeira semana: como foi vir, e o que
  já mudou na rotina"*), vencida há 12 dias e nunca feita. **16 dos 17
  matriculados na fila** estavam nessa situação.
  É a trava anti-invenção um nível acima: lá o motor não inventa o preço,
  aqui não inventa o assunto. Guardado por `fila_test.mjs` (20/20).
- **Recusa educada da IA pode ser prompt incompleto, não falta de dado.** O
  Analista de Gestão respondeu *"não tenho dado de hoje… não posso inventar
  essa granularidade"* a um pedido de relatório diário. A recusa estava certa
  e a premissa errada: `interactions.occurred_at` tem hora e **já vinha na
  consulta** — era somada num total do período antes de chegar ao prompt.
  **O sintoma foi uma recusa educada, e recusa educada parece limite do
  produto, não defeito.** Ao ouvir "não tenho esse dado", conferir se o motor
  não tem ou se quem monta o prompt não mandou.
- **Folga de profissional só existe onde se agenda profissional.** A seção da
  Agenda era mostrada em todo segmento; para academia é cadastro que não muda
  nada, e cadastro que não muda nada ensina a ignorar a tela. O manifesto já
  declarava a diferença: `scheduling.offer_by_turno: true` é literalmente
  "aqui não se marca hora com pessoa". A tela passou a obedecer o dado — Lei 1.
- **⚠ VIGÊNCIA É FOTOGRAFIA, NÃO FATO VIVO — o caso Maria Isabel (13/ago).**
  O fundador viu **Maria Isabel Ferreira Garcia** na fila como "contrato a
  vencer" e avisou: *ela já renovou*. **A fila não errou** — reportou
  fielmente o que o banco dizia (11/fev → 10/ago, semestral, vencido há 3
  dias). O banco é que afirmava uma **fotografia da importação** com a
  confiança de um fato vivo.
  O sistema da academia **não tem API**; a vigência entra por planilha e cada
  renovação vira **linha nova** lá. Entre duas importações, todo
  `contract_end` envelhece em silêncio — o mesmo defeito que o `0029` corrigiu
  no DNA, só que aqui a mentira sai **numa mensagem para o cliente**.
  **A regra:** um vencimento só pode ser AFIRMADO se a fonte foi conferida
  DEPOIS da data de fim (`custom.contrato_conferido_em`, carimbado pelo
  importador). Sem isso o motivo vira *"Vencimento não confirmado"* e o texto
  manda perguntar, com ordem explícita de não afirmar que venceu.
  **O erro é assimétrico, e é ele que decide a regra:** dizer "venceu" para
  quem renovou é constrangedor e faz o cliente duvidar do sistema inteiro;
  perguntar para quem realmente venceu custa uma frase.
  Hoje os **16 vencidos da Be Fitness** viram "não confirmado" — nenhum tem
  carimbo, porque ele só passa a existir na próxima importação. Isso é o
  sistema dizendo a verdade sobre o que sabe. `renovacao_test.mjs` 17/17.
- **⚠ O CICLO TÉCNICA → DESFECHO ESTÁ FECHADO (ago/2026), e ele foi desenhado
  para dizer "ainda não sei".** 846 interações do piloto já tinham escola E
  desfecho no banco e **nenhuma linha de código lia isso** — o motor aplicava
  técnica curada por opinião e nunca descobria se funcionou nesta casa.
  **A objeção do fundador definiu o desenho:** *"ele usou a técnica 1x e
  conseguiu, vai seguir só nessa? teria que ter dado suficiente."* O banco
  prova que ele estava certo — contando fechamento puro, `challenger` lidera
  com **7,1% em UM fechamento de 14 usos** e `negociacao_voss` some com 0% em
  55, sendo escola de negociação, etapa que pouca gente alcança.
  Quatro defeitos do desenho ingênuo, os quatro tratados em `lib/aprendizado.ts`:
  **amostra** (piso de 30 + intervalo de 95%; abaixo dele a taxa é `null`, e
  `null` ≠ zero), **atribuição** (`schools` é array — ~2,4 escolas por
  atendimento; mede-se presença contra a base, nunca crédito exclusivo),
  **origem** (recorte obrigatório: convênio tem **9%** de resposta contra
  **54%** do WhatsApp) e **caça-níqueis** (`deveExplorar` — se o motor sempre
  usa o vencedor, o dado sobre as outras congela, e ele pode ter vencido por
  sorte; a exploração cai com a amostra mas **nunca zera**).
  **Mede RESPOSTA, não fechamento**: fechamento são 14 eventos; resposta são
  centenas — e é o que a tese pede, porque a perda medida é silêncio.
  `perdeu_decisao` conta como sucesso: quem disse "não" respondeu, e juntar o
  "não" com o silêncio esconde a única coisa que tem conserto.
  **A leitura real da Be Fitness** (n=846, base 46% ±3): consultiva_spin 66%
  ▲, relacionamento_carnegie 58% ▲, cadencia_blount **24% ▼** (metade da
  base — confirma a hipótese de ago/2026 de que o follow-up é usado tarde),
  negociacao_voss 27% ▼, challenger *não sei*. **Recortado por WhatsApp o
  sinal fica mais forte, não mais fraco**: spin 76%, cialdini 73%, blount 25%.
  **"Acima"/"abaixo" só aparece quando os intervalos não se tocam**, e a tela
  ordena por VOLUME — a primeira linha de uma lista é lida como recomendação,
  esteja escrito o que estiver ao lado. A biblioteca continua decidindo; o
  que volta ao prompt se declara *"observação, não instrução"*, e é `null` na
  maior parte das vezes. `aprendizado_test.mjs` 16/16, testada quebrando o
  piso e a ordenação.
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
- Ele **testa no deploy** (`kairos.wsslabs.com.br`) e reporta com precisão —
  vários bugs reais vieram dele. Leve a sério e **verifique no código**.
- Quer honestidade sobre limites, não otimismo. Diga o que falta.
- Peça o que exige ação dele (chaves, contas, OAuth) só quando indispensável.
- Tudo em português do Brasil, inclusive o texto do produto.

---

## 6. Verificações rápidas de sanidade

```bash
npm run -w @cos/skill-loader validate     # manifestos (deve dar 15/15)
node packages/db/tests/library_check.mjs  # bibliotecas: categoria, escola, fatos
node packages/db/tests/demo_dna_check.mjs # DNA de demonstração × manifestos
node packages/db/tests/retrieval_check.mjs # escolha de técnica: 65/65 + 96,6% de 1.515 gatilhos (precisa do banco)
node packages/db/tests/repescagem_test.mjs # espaçamento do curso: 13/13 (sem banco)
node packages/db/tests/acentuacao_check.mjs # acento na prosa curada (sem banco)
node packages/db/tests/cota_test.mjs       # cota de IA e teto: 23/23
node packages/db/tests/renovacao_test.mjs  # janelas 60/30/7: 11/11
node packages/db/tests/placar_test.mjs     # o piso de amostra: 12/12
node packages/db/tests/importacao_test.mjs # colunas e data pt-BR: 19/19
node packages/db/tests/cnae_test.mjs       # alvos de prospecção: 9/9
node packages/db/tests/proximidade_test.mjs # bairro e CEP: 10/10
node packages/db/tests/telefone_test.mjs   # E.164 brasileiro: 30/30
node packages/db/tests/turno_test.mjs      # turno em vez de hora: 16/16
node packages/db/tests/cadencia_check.mjs   # nenhuma etapa viva muda: 80/80 (sem banco)
node packages/db/tests/aprendizado_test.mjs # o ciclo tecnica-desfecho, e o silencio: 16/16
node packages/db/tests/sincronizacao_test.mjs # foto x historico, e a trava da planilha parcial: 15/15
node packages/db/tests/planilha_test.mjs   # leitor de aba: recusa adivinhar a chave: 14/14
node packages/db/tests/paginacao_check.mjs # o corte silencioso do PostgREST (linha de base: 0)
node packages/db/tests/sugestoes_dna_check.mjs # campo aberto de DNA sem sugestão: 229/229
node scripts/diagnostico-aprendizado.mjs be-fitness  # o que funciona nesta casa (nao escreve)
node packages/db/tests/fila_test.mjs       # quitacao, motivo unico e a regra do pretexto: 20/20
node packages/db/tests/aparencia_test.mjs  # cor e logo aceitas: 12/12
node packages/db/tests/curso_render_test.mjs # 45 lições renderizam (precisa do banco)
node scripts/seed-curso.mjs packages/db/migrations/0036_curso_conteudo_m7_m8_m9.sql
node scripts/seed-skills.mjs              # recarrega manifestos no banco
node scripts/seed-demo-dna.mjs            # DNA das empresas demo
cd apps/web && npm run build              # build limpo
```

Levar a biblioteca para quem vive o ramo revisar (gera em `revisao/`):
```bash
node scripts/kit-revisao.mjs industria     # .html para ler, .csv para responder
```

Antes de qualquer importação grande de contatos (não escreve nada):
```bash
node scripts/diagnostico-telefones.mjs be-fitness  # quantos telefones saem, quantos não
```

A prova do motor com IA (custa tokens, ~R$ 0,25 por resposta):
```bash
node scripts/provar-motor.mjs             # 8 mensagens reais nos segmentos
node scripts/provar-motor.mjs industria   # só um segmento
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
