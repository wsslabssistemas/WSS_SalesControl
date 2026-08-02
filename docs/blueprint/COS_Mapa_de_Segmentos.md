# COS — Mapa de Segmentos

> O que já cobrimos, o que um segmento novo custa, e a fila do que falta.
> Atualizado jul/2026.

---

## 1. O que já existe (8 manifestos, 8/8 válidos)

| Segmento | Cobre na prática | Biblioteca |
|---|---|---|
| `academia` | Academia, musculação, ginástica | **23 entradas** |
| `barbearia` | Barbearia, barbeiro | **19** |
| `clinica` | Clínica médica, odontologia, **estética**, harmonização, fisioterapia | **16** |
| `sob_medida` | Marcenaria, vidraçaria, serralheria, esquadrias, marmoraria, **energia solar** | **16** |
| `distribuidora` | Atacado e distribuição (alimentos, autopeças, construção, farma, higiene, embalagens, elétrica, agro…) | **17** |
| `automacao` | Automação predial, climatização, refrigeração, energia, monitoramento | **17** |
| `escola_esportiva` | Natação, artes marciais, **crossfit**, **pilates**, tênis, escolinhas, **clubes** | **17** |
| `industria` | Têxtil e feltro, calçadista, moveleira (vendendo a lojista), metal-mecânica, embalagens, autopeças, implementos agrícolas | **20** |

**145 entradas.** Todo segmento tem a entrada de **indecisão** (o cliente que
concordou e travou) e os três B2B têm a do **comprador que quer se servir
sozinho**. Ver `COS_Escolas_de_Venda.md`.

**Um segmento sem biblioteca funciona, mas responde genérico.** O manifesto dá a
estrutura (jornada, campos, DNA, cadências); a **curadoria é o ativo**.

---

## 2. Resposta ao mapeamento pedido pelo fundador

| Ramo perguntado | Situação |
|---|---|
| Clubes, associações | ✅ `escola_esportiva` |
| Academia de luta, crossfit, pilates | ✅ `escola_esportiva` (ou `academia`) |
| Estética | ✅ `clinica` |
| Veterinário | ⚠️ Parcial em `clinica` — mas o decisor é o tutor e há recorrência de vacina/retorno. **Merece manifesto próprio** |
| Salão de beleza | ⚠️ Parcial em `barbearia` — mas o ciclo é outro: química (coloração, progressiva) tem ticket alto, sessão longa e retorno de manutenção com data quase exata. **Merece próprio** |
| Fábricas / indústria | ✅ `industria` (8º segmento, ago/2026) |
| Pet shop (banho e tosa) | ❌ **Novo** — recorrência forte, muito parecido com barbearia |
| Imobiliária | ❌ **Novo** — ciclo longo, ticket altíssimo, visita, financiamento, dois lados (proprietário e comprador) |
| Curso / escola | ❌ **Novo** — matrícula sazonal, turma, evasão, rematrícula |
| Casa de festas / eventos | ❌ **Novo** — data única e disputada, alto ticket, visita ao espaço, sinal |
| Mecânica / oficina | ❌ **Novo** — orçamento após diagnóstico, aprovação, revisão periódica |
| Restaurante | 🚫 **Não recomendado** — é operação de fluxo/balcão, não de funil. Nosso motor não agrega ali (delivery e reservas são outro produto) |

---

## 3. Fila recomendada (por dor × tamanho de mercado)

1. **`salao_beleza`** — mercado enorme, ciclo de recompra forte, química com ticket alto. Aproveita quase tudo de `barbearia`.
2. **`pet`** — banho/tosa é recorrência pura; veterinária puxa `clinica`. Mercado em alta e pouco atendido.
3. **`imobiliaria`** — ticket altíssimo, ciclo longo, follow-up é vida ou morte. Nossa tela de Follow-up brilha.
4. **`oficina`** — o "orçamento e silêncio" de novo, com revisão periódica.
5. **`curso`** — matrícula sazonal e evasão.
6. **`eventos`** — data única gera urgência natural; boa conversão.

**Antes de qualquer um desses:** terminar as bibliotecas de `automacao` e
`escola_esportiva`, que já têm manifesto e estão respondendo genérico.

---

## 3b. Indústria — pesquisa do fundador (ago/2026)

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
