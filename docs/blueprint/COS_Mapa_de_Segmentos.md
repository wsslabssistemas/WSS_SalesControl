# COS — Mapa de Segmentos

> O que cobrimos, o que um segmento novo custa, e por que a fila fechou.
> Atualizado 8/ago/2026.

---

## 1. O que já existe (15 manifestos, 15/15 válidos — 285 entradas)

> **Atualizado em 8 de agosto de 2026.** Este documento ficou congelado em
> julho dizendo "8 manifestos, 145 entradas" enquanto a fila fechava em 15 —
> e ele está na ordem de leitura do `ESTADO_DO_PROJETO.md`, então toda
> conversa nova o lia como verdade. Número de estado em documento que ninguém
> confere apodrece; o conferido roda com `library_check.mjs`.

| Segmento | Cobre na prática | Biblioteca | Módulos |
|---|---|---|---|
| `academia` | Academia, musculação, ginástica | **23** | — |
| `software_b2b` | O Kairós vendendo o Kairós | **23** | prospecção |
| `curso` | Idiomas, profissionalizante, preparatório, in-company | **23** | — |
| `energia_solar` | Integradora fotovoltaica + híbrido com bateria | **23** | prospecção + licitações |
| `industria` | Têxtil e feltro, calçadista, moveleira, metal-mecânica, embalagens, autopeças, implementos | **20** | prospecção + licitações |
| `barbearia` | Barbearia, barbeiro | **19** | — |
| `salao_beleza` | Cabelo, química, unhas, estética rápida | **19** | — |
| `oficina` | Mecânica, elétrica, funilaria, pneus | **18** | prospecção |
| `distribuidora` | Atacado e distribuição | **17** | prospecção |
| `automacao` | Automação predial, climatização, energia, monitoramento | **17** | prospecção + licitações |
| `escola_esportiva` | Natação, lutas, crossfit, pilates, tênis, clubes | **17** | — |
| `casa_de_festa` | Infantil, formatura, casamento, corporativo | **17** | — |
| `pet` | Banho e tosa, creche, hotel | **17** | — |
| `clinica` | Médica, odontologia, estética, harmonização, fisioterapia | **16** | — |
| `sob_medida` | Marcenaria, vidraçaria, serralheria, marmoraria | **16** | prospecção + licitações |

**285 entradas.** Todo segmento tem a entrada de **indecisão** (o cliente que
concordou e travou — 40 a 60% das perdas, segundo o JOLT) e os B2B têm a do
**comprador que quer se servir sozinho** (67% do B2B prefere se servir).

**Um segmento sem biblioteca funciona, mas responde genérico.** O manifesto dá a
estrutura (jornada, campos, DNA, cadências); a **curadoria é o ativo**.

---

## 2. A fila FECHOU — e o que ficou de fora, com motivo

Os seis ramos que este documento listava como "novo" foram todos decididos:

| Ramo | Desfecho |
|---|---|
| Salão de beleza | ✅ `salao_beleza` — e provou que `strategy_map` por segmento não é enfeite: preço aqui é `consultiva_spin`, na barbearia é `oferta_valor` |
| Pet shop | ✅ `pet` |
| Curso / escola | ✅ `curso` — e as duas entradas que o definem são RECUSA (MEC e promessa de emprego) |
| Casa de festas | ✅ `casa_de_festa` — o recorte com dono, data e recompra |
| Mecânica / oficina | ✅ `oficina` — o caso mais puro da tese: o orçamento aprovado no balcão que some |
| **Imobiliária** | 🚫 **DESCARTADA** (ago/2026) — ver abaixo |
| Restaurante | 🚫 Segue descartado — operação de fluxo, não de funil |

### O critério que a imobiliária expôs

A dúvida do fundador — *"se não teremos acesso aos sites de locação e venda,
onde poderíamos ser diferentes?"* — estava certa, e revelou uma regra que os
segmentos entregues já seguiam sem estar escrita.

**Uma Skill vale quando as duas coisas valem:**

1. **Os fatos que governam a resposta são DA EMPRESA** — poucos, estáveis, e
   capazes de caber no DNA. É contra isso que a trava anti-invenção verifica;
   sem isso ela não tem o que verificar.
2. **O gargalo do negócio é técnica de conversa, não gestão de inventário.**

Imobiliária quebra as duas: o "produto" são centenas de imóveis de TERCEIROS,
que mudam toda semana, e cujos fatos são por unidade. Esses dados já vivem num
CRM imobiliário com feed para os portais — seríamos o **segundo sistema**, e o
segundo sistema perde.

**E a regra do add-on que veio junto:** bom add-on traz demanda **de fora para
dentro** (Licitações e Oportunidades fazem isso). Add-on que leva dado de dentro
para fora é integração, e quem já faz isso faz melhor — construir seria empatar,
não diferenciar.

*Se um dia houver frente imobiliária, o recorte que passa nos dois critérios é o
**corretor autônomo**: carteira pequena, relacionamento é tudo, follow-up é o
buraco, e ele não tem CRM.*

### A regra do segmento novo

`energia_solar` só existiu porque `sob_medida` dizia "solar" no nome e **nenhuma
das suas entradas falava de solar**. Nome de manifesto não é cobertura —
cobertura é entrada curada. A regra virou procedimento: antes de escrever um
segmento novo, conferir contra as entradas existentes o que de fato não está
coberto. Foi assim em `oficina` (166 entradas conferidas) e em `curso` (239).

---

## 3. Indústria — pesquisa do fundador (ago/2026)

Levantamento do parque industrial gaúcho e brasileiro, com o diagnóstico de onde
há mais espaço para inteligência comercial.

**Clusters do RS:** metal-mecânico e automotivo (Serra — Caxias: Randon,
Marcopolo, Agrale, Tramontina); calçadista e coureiro (Vale do Sinos — Novo
Hamburgo, Campo Bom, Parobé); mobiliário (Bento Gonçalves, Lagoa Vermelha —
Todeschini, Florense, Kappesberg); máquinas e implementos agrícolas (Noroeste —
Santa Rosa, Passo Fundo, Não-Me-Toque: Stara, Kepler Weber, John Deere).

**O diagnóstico central:** a indústria tem herança de gestão focada no chão de
fábrica. Vê tecnologia comercial apenas como **ERP** (nota fiscal e estoque) e
**deixa a venda na mão de representantes autônomos**. Produto caro, ciclo longo,
aquisição de cliente quase primitiva.

**As três dores nomeadas:**
1. **Máquinas e implementos agrícolas** — equipamento de R$100 mil a R$2 milhões,
   mas perde-se o timing porque o representante demorou no follow-up ou não
   nutriu o produtor nos meses que antecedem a safra. O ERP legado guarda o
   histórico de compras que ninguém usa para prever a próxima.
2. **Moveleira** — depende de lojista, arquiteto e franquia. A jornada é visual,
   mas a captação e o acompanhamento do parceiro B2B são reativos.
3. **Calçadista e têxtil** — representante com **"pasta de clientes" fechada**,
   visitando sempre as mesmas lojas, sem prospecção de novas boutiques ou redes.
   O alerta mais valioso seria **lojista há +90 dias sem reposição**.

**Conclusão do fundador (adotada):** o argumento de venda para a indústria não é
"melhorar seu atendimento", é **"construir uma máquina previsível de aquisição
que não depende do humor do representante"**.

**Decisão:** criar o manifesto **`industria`** (8º segmento). Cobre têxtil e
feltro, calçadista, moveleira (vendendo para lojista), metal-mecânica,
embalagens, alimentos industrializados e autopeças — todos vendem B2B para
revenda, através de representante. O que os separa de `distribuidora` é
justamente o **canal indireto** e a especificação técnica do produto.

**Vantagem estratégica:** a irmã do fundador trabalha na Feltros Bandeirantes —
há **especialista real disponível** para revisar a curadoria, que é o que leva
uma biblioteca de *boa* para *excelente*.

**Executado (ago/2026):** manifesto `industria` + **18 entradas** curadas
(`0026_seed_knowledge_industria.sql`), 12/12 categorias. O que o manifesto
modela e nenhum outro segmento tinha:

- **Amostra é etapa da jornada**, não detalhe — com cadência própria (chegada em
  3 dias, parecer em 10). Em têxtil, calçado e embalagem nada avança antes do
  teste na mão de quem decide.
- **"Sem reposição" não é etapa terminal.** É trabalho em aberto com cadência de
  reativação — o alerta de +90 dias que a pesquisa apontou como o mais valioso.
- **`ciclo_reposicao` no contato** alimenta o motor de recompra (trimestral = 90
  dias), que é de onde sai o aviso antes de o cliente sumir.
- **Conflito de canal** é entrada da biblioteca: o representante que atende a
  conta é ativo, não obstáculo. Vender por cima dele destrói a receita.

**Falta a revisão da especialista** — a biblioteca é boa por pesquisa, não
excelente por vivência. É exatamente a distância descrita na seção 5.

## 4. Quanto custa um segmento novo (a economia da coisa)

| Etapa | Esforço | Quem faz |
|---|---|---|
| Pesquisa do ramo | 2–4 buscas dirigidas | IA |
| Manifesto (`.yaml`) | ~200 linhas de dado | IA |
| Validar + semear | 2 comandos | IA |
| **Biblioteca curada (15–22 entradas)** | **É o trabalho real** | IA + revisão do fundador |
| Revisão de quem vive o ramo | horas | **Fundador ou especialista** |

**Nenhuma linha do núcleo muda.** É a Lei 1 se pagando: o custo de um segmento
novo é curadoria, não engenharia. Por isso a fila acima é viável.

---

## 5. Limite honesto

A curadoria hoje é feita por pesquisa (fontes do setor, cursos, blogs
especializados, dados de mercado). Isso produz uma biblioteca **boa**, mas o
salto para **excelente** vem de quem vive o ramo revisar — um barbeiro, um
dentista, um representante de distribuidora. O sistema está preparado para
isso: a empresa pode adicionar as próprias entradas (`source = tenant`) sem
tocar na biblioteca do segmento.
