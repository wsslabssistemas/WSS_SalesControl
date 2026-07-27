# COS — Prospecção Proativa & Dados Públicos (estratégia)

> Estudo estratégico (jul/2026). Resposta ao pedido do fundador: módulo proativo
> + prospecção + APIs públicas (licitações, Maps), pensado como negócio, não como
> feature solta. **Nada aqui é decisão fechada** — é a base para decidir.

---

## 1. Tese

O valor não está no Google Maps. Está na **base de CNPJ da Receita Federal**:
pública, gratuita, e — o ponto — **B2B**, que é o único frio que as nossas
regras permitem (CLAUDE.md: "B2B frio com dados públicos é permitido; B2C frio
não será construído"). Maps é **enriquecimento caro e pontual** por cima dela,
não a fonte.

Isso vira dois módulos vendáveis à parte, não uma feature de todo plano:
**Kairós Prospecção** (empresas-alvo por segmento+região) e **Kairós Licitações**
(monitor de editais). Ambos só fazem sentido para quem **capta ativo** — é por
isso que o onboarding já captura a **postura** (recebe / vai atrás / ambos).

---

## 2. As fontes (o que cada uma entrega)

| Fonte | Custo | O que dá | Uso |
|---|---|---|---|
| **CNPJ dados abertos (Receita)** | Grátis (dump mensal ~5GB, ou serviço espelho) | TODA empresa do Brasil por **CNAE (segmento) + município**, porte, capital social, data de abertura, situação cadastral, sócios, telefone/e-mail parciais | **Base da prospecção**: listar alvos por segmento+região |
| **BrasilAPI / OpenCNPJ** | Grátis, por CNPJ | Consulta cadastral pontual de 1 CNPJ (JSON, sem chave) | Enriquecer/validar um alvo específico |
| **Google Places** | Pago (franquia mensal por SKU; ~US$5–17/1k depois) | Site, WhatsApp, horário, avaliações, foto | Enriquecer **só os alvos marcados** (controla custo) |
| **PNCP (Portal Nacional de Contratações Públicas)** | Grátis, sem login (Swagger aberto) | Editais, contratos, atas de registro de preço, plano anual de contratações | **Monitor de licitações** por segmento/região |
| **Portal da Transparência** | Grátis (chave por e-mail; 90 req/min) | Despesas, convênios, contratos, a quem o governo paga | Inteligência: "quem já vende o que eu vendo, e pra quem" |

**Insight forte:** cruzando CNPJ (empresas do segmento-alvo) com Transparência/PNCP
(quem já fornece para o governo), dá para dizer a um cliente B2B: *"estas 40
empresas da sua região compram o que você vende — e estas 8 já fornecem pro
poder público"*. Isso é o "de quem compram" que o fundador pediu, com dado real.

---

## 3. Como cada cliente usa (depende da postura, não do segmento no núcleo)

- **Distribuidor / indústria / fornecedor de insumos (capta ativo):** lista de
  empresas-alvo por CNAE+região (ex.: todas as academias de Porto Alegre para um
  fornecedor de suplementos). Empresa aberta há pouco = vai comprar equipamento.
  Vira **Oportunidade** no funil → manual (Responder) ou automático.
- **Quem vende pro governo:** "editais abertos do meu segmento/UF", alerta de
  novo edital, concorrentes que já ganham. É quase um produto por si só.
- **B2C local (academia, barbearia, estética):** prospecção fria de pessoas é
  **proibida** (LGPD). O valor aqui NÃO é prospectar — é o atendimento inbound
  que já temos. Maps serve só para **inteligência de concorrência** (quantos
  concorrentes no bairro, nota, preço), nunca para abordar pessoas.

Conclusão: o módulo é para **postura ativa/B2B**. Não empurrar para B2C.

---

## 4. Arquitetura (respeita as três leis)

- O **núcleo continua sem saber de segmento**. Prospecção é uma **capability**
  que a Skill/plano declara em dado — ex.: no manifesto,
  `prospecting: { enabled: true, cnae_targets: [...], region: "regional|nacional" }`.
- Dados públicos entram como **fonte externa**, nunca viram o ativo. O ativo
  segue sendo a **biblioteca curada** + o DNA. Prospecção só **abastece o funil**
  com contatos; o motor (que já existe) faz a abordagem.
- Nova entidade: `opportunities` (empresa-alvo mapeada) → quando o cliente age,
  vira `contact`. Fila separada para não sujar a base real com alvos não
  trabalhados.
- Enriquecimento Places é **sob demanda** (só no alvo que o cliente abriu), com
  teto por empresa via `usage_ledger` — mesma trava de custo do motor de IA.

---

## 5. Empacotamento e preço (a pergunta central)

**Não é feature de todo plano.** É **add-on / subproduto**, por dois motivos:
1. **Custo variável real** (Places pago, processamento do dataset).
2. **Só serve a quem capta** — cobrar de um B2C-espera seria vender o que ele não usa.

Modelo proposto (alinhado a "cobrança por uso, nunca custo fixo absorvido"):
- **Kairós Prospecção** — mensalidade do add-on + cota de empresas mapeadas/
  enriquecidas; excedente por uso.
- **Kairós Licitações** — mensalidade do add-on (monitor + alertas por segmento/UF).
- Franquia grátis pequena para experimentar (on-ramp), teto por uso para não sangrar.

---

## 6. Apps nativos (celular e PC)

**Já temos um PWA que instala nos dois.** No celular (Android: banner; iOS:
Adicionar à Tela) e no PC (Chrome/Edge → "Instalar app" → janela própria com
ícone). Ou seja, "baixar no PC e no celular" **já funciona** na prática.

O que o PWA **não** dá: vitrine na App Store / Play Store (descoberta + confiança)
e **notificações push** boas no iOS. Para isso, embrulha-se o **mesmo** app web:
- **Capacitor** → iOS/Android (Play Store, App Store). Reaproveita 100% da UI.
- **Tauri** → desktop `.exe`/`.dmg`/`.deb` (leve; Electron é a alternativa pesada).
- Custo: Apple US$99/ano, Google Play US$25 (única vez), + assinatura/revisão.

**Recomendação e o gancho:** ficar no PWA agora. O gatilho para virar nativo é o
**push** — e quem cria a necessidade de push é justamente o **módulo proativo**
("novo edital!", "lead esfriando há 7 dias!"). Então a sequência natural é:
módulo proativo primeiro → depois embrulhar em Capacitor para entregar os alertas
como notificação. O app nativo passa a ser **justificado pelo módulo**, não um
custo à toa.

---

## 7. Referências de mercado (a categoria existe e é paga)

- **Prospecção B2B por CNPJ:** Econodata, Speedio, Cortex, Casa dos Dados,
  ÍndiceCNPJ. Validam que "empresas-alvo por segmento+região" é produto pago.
- **Monitor de licitações:** ConLicitação, Effecti, Alerta Licitação, Licitar
  Digital. Validam o add-on de editais.

Nosso diferencial: não vendemos a lista solta — **entregamos o alvo já dentro do
cockpit**, com o motor que sabe o que falar. A lista é commodity; a abordagem
ancorada na biblioteca curada é o ativo.

---

## 8. Riscos

- **LGPD:** manter estritamente B2B (dado público de empresa). Zero pessoa física
  fria. Registrar base legal (legítimo interesse B2B) e opt-out.
- **Custo Places:** só enriquecer sob demanda; nunca varrer em massa.
- **Qualidade do dado:** telefone/e-mail da Receita é incompleto e desatualizado;
  Places cobre o gap, mas com custo. Ser honesto na cobertura.
- **Escopo:** "mundial" não existe para B2B local — só **regional/nacional**.

---

## 9. Sequência recomendada

1. **Base grátis primeiro:** ingestão do dataset CNPJ (por CNAE+município) →
   entidade `opportunities` → lista de alvos no cockpit. Prova o valor sem custo.
2. **Enriquecimento Places sob demanda** no alvo aberto (com teto).
3. **Kairós Licitações** (PNCP) como segundo add-on.
4. **Capacitor/Tauri** quando o push dos alertas justificar o app nativo.

Decisão do fundador pendente: confirmar o empacotamento (add-on pago à parte) e
qual módulo vem primeiro — **Prospecção (CNPJ)** ou **Licitações (PNCP)**.
