-- =====================================================================
-- COS — MIGRATION 0047 : COTA DE IA E TETO DE GASTO
--
-- O item que o `COS_Kairos_Vende_Kairos.md` marca como "vem ANTES de
-- qualquer convite", e o único erro daquela lista que não dá para
-- corrigir depois de acontecer.
--
-- O NÚMERO QUE OBRIGA ISTO A EXISTIR (medido em ago/2026, não estimado):
-- R$ 0,20 a R$ 0,26 por resposta com IA. Uma empresa em teste com 100
-- atendimentos/mês custa ~R$ 23. Dez empresas, ~R$ 230. Trinta, ~R$ 690 —
-- por mês, do bolso do fundador, antes de existir a primeira mensalidade.
-- Sucesso comercial viraria prejuízo, e o prejuízo chegaria pelo caminho
-- que parece vitória: mais gente testando.
--
-- **Intenção não segura isso. Só trava estrutural segura.**
--
-- A REGRA, EM UMA FRASE: nenhuma empresa pode gastar mais token do que o
-- fundador decidiu, e o produto NUNCA para de funcionar quando o teto é
-- atingido — ele cai para o cockpit manual, que custa zero e é a origem
-- do produto. Teto que derruba o produto vira empresa de teste que some,
-- e o objetivo do teto é exatamente o contrário.
--
-- POR QUE `tenant_id` É NULO NA LINHA GLOBAL, e não uma tabela separada:
-- é a mesma convenção que `knowledge_entries` já usa para a biblioteca
-- global. Uma tabela só, uma leitura só, e a linha padrão nasce COM A
-- MIGRATION — porque "esqueceu de configurar" não pode ser o mesmo que
-- "sem teto". Política que só existe depois de alguém lembrar de criá-la
-- não é trava, é intenção com nome bonito.
-- =====================================================================

create table if not exists public.ai_limits (
  -- NULO = a linha do FABRICANTE: os padrões que valem para toda empresa
  -- sem regra própria, mais o teto global.
  tenant_id        uuid references public.tenants(id) on delete cascade,

  -- Cota contada em ATENDIMENTOS, não em tokens. É o que a empresa
  -- entende, é o que ela vai pagar depois, e é o que faz o teste vender:
  -- a pessoa sente a diferença entre o modo com IA e o manual, e entende
  -- exatamente pelo que vai pagar.
  respostas_mes    int,

  -- Teto de dinheiro por empresa. Existe ao lado da cota de respostas
  -- porque as duas falham de jeitos diferentes: uma resposta com histórico
  -- gigante custa mais que a média, e a cota de respostas sozinha não vê
  -- isso. Quem estourar primeiro bloqueia.
  teto_mes_cents   int,

  -- Prospecção tem cota PRÓPRIA e DIÁRIA. Gerar abordagem também gasta, e
  -- o risco ali é outro: lote. Cota por dia impede a rajada que queima o
  -- mês inteiro numa tarde.
  prospeccao_dia   int,

  -- Só faz sentido na linha global. A soma é o que quebra o caixa, não a
  -- empresa individual: trinta empresas dentro da própria cota estouram o
  -- bolso do fundador sem que nenhuma delas tenha feito nada de errado.
  teto_global_mes_cents int,

  updated_at       timestamptz not null default now()
);

-- Uma linha por empresa, e UMA única linha global.
create unique index if not exists ux_ai_limits_tenant
  on public.ai_limits(tenant_id) where tenant_id is not null;
create unique index if not exists ux_ai_limits_global
  on public.ai_limits((tenant_id is null)) where tenant_id is null;

-- ---------------------------------------------------------------------
-- RLS
-- Leitura: o membro vê a cota da PRÓPRIA empresa — a tela precisa dizer
-- quanto sobrou, e esconder isso da empresa seria transformar o teto em
-- bug misterioso. A linha global tem `tenant_id` nulo, e `is_member_of`
-- não casa com nulo: ela fica só para o `service_role`.
-- Escrita: nenhuma policy. Só `service_role`, pelo painel do fabricante.
-- Se o cliente pudesse escrever aqui, a trava não seria trava.
-- ---------------------------------------------------------------------
alter table public.ai_limits enable row level security;

drop policy if exists ai_limits_select on public.ai_limits;
create policy ai_limits_select on public.ai_limits
  for select to authenticated
  using (tenant_id is not null and public.is_member_of(tenant_id));

-- ---------------------------------------------------------------------
-- PRODUCT SEED — a linha do fabricante nasce junto com a tabela.
--
-- OS NÚMEROS SÃO DERIVADOS, NÃO CHUTADOS:
--   • 50 respostas/mês por empresa em teste é o que o documento do
--     "Kairós vende o Kairós" já tinha decidido;
--   • R$ 13,00 de teto por empresa = 50 × R$ 0,26, o TETO medido do custo
--     por resposta (não a média — o teto, porque é ele que estoura);
--   • R$ 130,00 de teto global = dez empresas na cota cheia. É o único
--     número aqui que é uma escolha de caixa, e por isso a tela existe:
--     `/painel/admin/cotas` é onde o fundador troca isto sem migration.
--   • 20 abordagens de prospecção por dia.
-- ---------------------------------------------------------------------
insert into public.ai_limits (tenant_id, respostas_mes, teto_mes_cents, prospeccao_dia, teto_global_mes_cents)
select null, 50, 1300, 20, 13000
where not exists (select 1 from public.ai_limits where tenant_id is null);


-- ---------------------------------------------------------------------
-- O CONSUMO, EM UMA CHAMADA SÓ.
--
-- POR QUE É FUNÇÃO E NÃO CONSULTA NO APP: o PostgREST corta em 1.000 linhas
-- SEM AVISAR — a armadilha que já sumiu com 53 interações na canonização das
-- técnicas. Uma empresa ativa passa de mil linhas no `usage_ledger` em poucas
-- semanas, e a partir dali o gasto lido seria MENOR que o real, plausível e
-- silenciosamente errado. Numa trava de custo, ler menos é o pior defeito
-- possível: ela para de travar exatamente quando começa a importar.
--
-- Contagem e soma acontecem no banco, sobre todas as linhas. `stable` porque
-- só lê. Sem `security definer`: quem chama é o `service_role`, do servidor.
--
-- A SEPARAÇÃO DOS BOLSOS ESTÁ AQUI, não no app:
--   • `respostas_mes` conta SÓ `responder_ai` — é o atendimento, a unidade
--     que a empresa entende e que ela vai pagar depois;
--   • `prospeccao_hoje` conta SÓ `primeira_abordagem`, e por DIA;
--   • dinheiro soma TUDO, inclusive Analista e Licitações. Dinheiro é dinheiro.
-- ---------------------------------------------------------------------
create or replace function public.ai_usage_summary(p_tenant uuid)
returns table (
  respostas_mes           int,
  custo_mes_cents         int,
  prospeccao_hoje         int,
  custo_global_mes_cents  int
)
language sql
stable
as $$
  select
    (select count(*)::int from public.usage_ledger
      where tenant_id = p_tenant
        and occurred_at >= date_trunc('month', now())
        and feature = 'responder_ai'),
    (select coalesce(sum(cost_cents), 0)::int from public.usage_ledger
      where tenant_id = p_tenant
        and occurred_at >= date_trunc('month', now())),
    (select count(*)::int from public.usage_ledger
      where tenant_id = p_tenant
        and occurred_at >= date_trunc('day', now())
        and feature = 'primeira_abordagem'),
    (select coalesce(sum(cost_cents), 0)::int from public.usage_ledger
      where occurred_at >= date_trunc('month', now()));
$$;

-- O consumo global é dado do fabricante. Nenhum cliente precisa dele.
revoke all on function public.ai_usage_summary(uuid) from public;
revoke all on function public.ai_usage_summary(uuid) from authenticated;


-- =====================================================================
-- VERIFICAÇÃO 1 — a linha global existe e é única
-- Esperado: 1 linha.
-- =====================================================================
select count(*) as linhas_globais from public.ai_limits where tenant_id is null;


-- =====================================================================
-- VERIFICAÇÃO 2 — consumo do mês corrente por empresa, contra a cota.
-- É a mesma conta que a tela do fabricante faz. Serve para conferir a
-- tela contra o banco sem acreditar na tela.
-- =====================================================================
select t.slug,
       count(*) filter (where u.feature in ('responder_ai','primeira_abordagem')) as respostas,
       sum(u.cost_cents)                                                          as centavos,
       coalesce(l.respostas_mes, g.respostas_mes)                                 as cota_respostas,
       coalesce(l.teto_mes_cents, g.teto_mes_cents)                               as teto_cents
  from public.usage_ledger u
  join public.tenants t on t.id = u.tenant_id
  left join public.ai_limits l on l.tenant_id = t.id
  cross join (select * from public.ai_limits where tenant_id is null) g
 where u.occurred_at >= date_trunc('month', now())
 group by t.slug, l.respostas_mes, g.respostas_mes, l.teto_mes_cents, g.teto_mes_cents
 order by centavos desc nulls last;
