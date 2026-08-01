# COS — Mapa de Segmentos

> O que já cobrimos, o que um segmento novo custa, e a fila do que falta.
> Atualizado jul/2026.

---

## 1. O que já existe (7 manifestos, 7/7 válidos)

| Segmento | Cobre na prática | Biblioteca |
|---|---|---|
| `academia` | Academia, musculação, ginástica | **22 entradas** |
| `barbearia` | Barbearia, barbeiro | **18** |
| `clinica` | Clínica médica, odontologia, **estética**, harmonização, fisioterapia | **15** |
| `sob_medida` | Marcenaria, vidraçaria, serralheria, esquadrias, marmoraria, **energia solar** | **15** |
| `distribuidora` | Atacado e distribuição (alimentos, autopeças, construção, farma, higiene, embalagens, elétrica, agro…) | **15** |
| `automacao` | Automação predial, climatização, refrigeração, energia, monitoramento | *manifesto pronto* |
| `escola_esportiva` | Natação, artes marciais, **crossfit**, **pilates**, tênis, escolinhas, **clubes** | *manifesto pronto* |

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
| Fábricas / indústria | ⚠️ Parcial em `automacao` e `distribuidora` |
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
