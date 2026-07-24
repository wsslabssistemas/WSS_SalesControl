# GRD — COS CORE
### Product Requirements Document do motor

**Produto:** Commercial Operating System (COS) · **Fabricante:** WSS Labs
**Versão:** 1.0 · **Status:** base de implementação
**Depende de:** Blueprint Parte 1 v1.1 e Parte 2

---

## 1. Objetivo

Construir o motor de inteligência comercial que serve qualquer segmento sem
alteração de código, com isolamento total entre empresas e custo de IA
controlado por cliente.

**O que este documento cobre:** o núcleo (CIE), o modelo de dados, o contrato
com os módulos, a camada proativa e os critérios de aceite.
**O que não cobre:** telas, onboarding e cobrança (Blueprint Partes 3 e 4).

---

## 2. Problema

Empresas que vendem perdem oportunidades por três razões estruturais:

1. O conhecimento comercial vive nas pessoas e sai com elas
2. O atendimento é reativo — ninguém procura oportunidade, só responde
3. Cada atendente responde de um jeito, e ninguém sabe o que funciona

Sistemas atuais registram dados. Não decidem, não aprendem e não agem.

---

## 3. Usuários

| Papel | Responsabilidade |
|---|---|
| **Fabricante (WSS Labs)** | Publica Skills, acompanha margem por cliente |
| **Owner / Admin** | Preenche o DNA, gerencia biblioteca e equipe, vê indicadores |
| **Manager** | Acompanha equipe, aprova campanhas |
| **Agent** | Atende, executa a fila do dia, registra resultado |
| **Cliente final** | Não acessa o sistema. É atendido pelo canal |

---

## 4. Conceitos do produto

### 4.1 Tenant
A empresa contratante. Toda informação pertence a um tenant e é invisível para
os demais.

### 4.2 Skill
Especialização por segmento, declarada em manifesto YAML. Contém vocabulário,
jornada com fases, campos próprios, seções de DNA, as 12 categorias canônicas,
cadências, regras permanentes e KPIs.

**Requisito duro:** instalar um segmento novo não pode exigir uma linha de código.

### 4.3 Commercial DNA
Os fatos da empresa: preços, horários, catálogo, localização, diferenciais,
políticas, parcerias e notas livres. Versionado.

**Requisito duro:** o que não está no DNA não pode ser afirmado. Fato ausente
gera escalonamento para humano, nunca invenção.

### 4.4 Biblioteca de conhecimento
Entradas com **estratégia** (reutilizável por qualquer empresa do segmento) e
`required_facts` (preenchidos pelo DNA). Entradas globais da Skill têm
`tenant_id` nulo e são herdadas por todos os tenants.

### 4.5 Commercial Memory
Registro de toda decisão com o contexto disponível no momento, a estratégia
escolhida, o motivo, o custo e o resultado observado.

### 4.6 Opportunity
Saída do motor proativo. Sinais internos e externos produzem o mesmo objeto.

**Requisito duro:** `reason` é obrigatório e legível por humano.

---

## 5. Requisitos funcionais

### RF-01 — Isolamento entre empresas ✅ IMPLEMENTADO
Nenhum usuário lê ou escreve dados de tenant onde não tenha vínculo ativo.
A regra vive no banco (RLS), não na aplicação.
**Aceite:** teste automatizado com dois tenants — 7 verificações. *(7/7 PASSOU)*

### RF-02 — Carga e validação de Skill
O sistema carrega manifestos, valida contra schema e recusa manifesto inválido
com mensagem legível.
**Aceite:** duas Skills de segmentos diferentes carregadas e validadas.

### RF-03 — Instalação de Skill em tenant
Ao cadastrar, a empresa escolhe o segmento e recebe automaticamente a jornada,
os campos, as categorias e a biblioteca daquela Skill, com versão fixada.
**Aceite:** dois tenants de segmentos diferentes operando sem código adicional.

### RF-04 — Gestão do DNA
Formulário estruturado pelas seções declaradas na Skill, mais uma seção livre.
Versionado, com histórico preservado.
**Aceite:** editar o DNA cria versão nova sem apagar a anterior.

### RF-05 — Decisão reativa
Dada uma mensagem recebida, o motor:
1. carrega tenant, Skill, DNA, contato e histórico
2. recupera de 4 a 6 trechos da biblioteca por busca semântica
3. classifica intenção, etapa, emoção e objeção *(modelo pequeno)*
4. verifica `required_facts` contra o DNA
5. seleciona estratégia elegível *(código, não modelo)*
6. redige mensagem e racional *(modelo forte)*
7. grava decisão, evento e consumo

**Aceite:** duas chamadas de modelo por decisão; seleção de estratégia
auditável; custo registrado.

### RF-06 — Trava anti-invenção
Faltando qualquer `required_fact`, o motor devolve `escalate` com a lista de
fatos ausentes e **não redige mensagem**.
**Aceite:** teste onde o DNA incompleto impede a resposta.

### RF-07 — Explicabilidade
Toda decisão retorna o racional e a técnica utilizada, com fonte.
**Aceite:** `rationale` é campo obrigatório no tipo de retorno.

### RF-08 — Jornada mutável
Avanço, salto e regressão permitidos. Toda mudança gravada em histórico
append-only com motivo e origem (sistema, agente ou detecção da IA).
**Aceite:** consulta responde quanto tempo um contato ficou em cada etapa.

### RF-09 — Detecção de sinais
Rotina periódica identifica sinais internos (inatividade, renovação, fase de
trial, ausência de contato) e externos (registros públicos).
**Aceite:** sinal gera oportunidade com `reason` preenchido.

### RF-10 — Priorização e alocação
Score calculado em código: valor potencial × probabilidade × urgência ×
decaimento. Alocação respeita capacidade diária configurável por tenant, com
reserva para atendimento reativo. Excedente retorna à fila.
**Aceite:** vendedor recebe lista dimensionada para o dia; nada se perde.

### RF-11 — Anti-saturação e supressão
Antes de qualquer envio proativo: consulta à lista de supressão, janela mínima
entre toques e teto mensal por pessoa.
**Aceite:** envio para identificador suprimido é bloqueado no motor.

### RF-12 — Cadências
Sequências declaradas no manifesto da Skill, com passos, intenção por passo,
condições de parada e limite de tentativas.
**Aceite:** cadência avança sozinha e para no evento correto.

### RF-13 — Campanhas de coorte
Seleção por perfil (ex.: conveniados, ex-clientes, ativos), mensagem revisada
e aprovada em lote pelo gestor. Tela separada da fila individual.
**Aceite:** campanha respeita as mesmas regras de supressão e saturação.

### RF-14 — Registro de resultado
Toda decisão pode receber desfecho. Resultado atualiza etapa e próxima ação.
Prazo previsto e execução real são carimbos separados.
**Aceite:** é possível medir aderência à cadência.

### RF-15 — Métricas canônicas
Implementadas uma única vez e consumidas por todas as telas:
- conversão = convertidos distintos ÷ leads do período
- taxa de trial e conversão do trial
- tempo de resposta em mediana e p90
- toda dimensão de análise é enum

**Aceite:** nenhuma métrica de resultado usa contagem de eventos.

### RF-16 — Consumo e margem
Todo uso de IA grava tokens, modelo e custo por tenant. Alerta em 80% da cota,
degradação suave em 100%, alerta de anomalia contra a média móvel.
**Aceite:** painel interno mostra margem por cliente.

---

## 6. Requisitos não funcionais

| Requisito | Definição |
|---|---|
| Multi-tenant | Isolamento no banco, obrigatório em toda tabela |
| Modular | Núcleo sem conhecimento de segmento |
| Auditável | Toda decisão preserva o contexto do momento |
| Explicável | Racional obrigatório |
| Seguro | LGPD, supressão, criptografia, chave de serviço só em jobs |
| API first | Todo recurso acessível por API |
| Multilíngue | Preparado, não obrigatório na v1 |
| Resiliente | Sem provedor de IA, o sistema continua priorizando e alertando |
| Observável | Custo, latência e erro por tenant |

---

## 7. Restrições

| Restrição | Consequência |
|---|---|
| Limite de funções na Vercel | Rota catch-all única com Hono |
| Serverless não roda de madrugada | Motor proativo em Inngest |
| Custo de IA é a margem | Recuperação semântica, cache e roteamento de modelo |
| Fundador trabalha sozinho | Fronteiras verificáveis por lint e teste |
| Validação é N=1 | Segunda empresa externa é critério de pronto |

---

## 8. Fora do escopo da v1

- Integração automática com WhatsApp, Instagram e Facebook
- Prospecção fria para pessoa física
- Aprendizado agregado entre empresas
- Marketplace, AI Workers autônomos, COS University
- Aplicativo do gestor

---

## 9. As três leis de engenharia

1. **O núcleo nunca conhece segmento** — verificado por lint e por busca de
   vocabulário proibido
2. **Skill é dado, nunca código** — verificado por extensão de arquivo
3. **Nenhum acesso a dados sem contexto de tenant** — verificado por RLS e lint

Falham o build.

---

## 10. Critério de pronto do motor

> Duas empresas de segmentos diferentes. Cada uma escolhe o segmento no
> cadastro e recebe sua própria base de conhecimento. Cada uma cola uma
> conversa e recebe análise contextual baseada no seu DNA e no histórico
> daquele cliente. Nenhuma enxerga uma linha da outra. **E não se escreveu
> código nenhum entre configurar a primeira e a segunda.**

---

## 11. Estado atual

| Requisito | Situação |
|---|---|
| RF-01 Isolamento | ✅ Implementado e testado (7/7) |
| RF-02 Carga de Skill | 🟡 Manifestos prontos, validador pendente |
| RF-03 Instalação | 🟡 Feita por SQL, falta aplicação |
| RF-04 DNA | 🟡 Estrutura pronta, falta interface |
| RF-05 a RF-16 | ⬜ Não iniciados |

**Pendência imediata:** executar `0004_seed_knowledge_academia.sql`
(`knowledge_entries` está com 0 registros) e reexecutar `0005`.
