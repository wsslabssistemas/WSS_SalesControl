-- =====================================================================
-- COS — MIGRATION 0032 : desempenho de RLS e índices que faltavam
--
-- ORIGEM: o fundador perguntou se o sistema aguenta muita gente mexendo ao
-- mesmo tempo. Em vez de responder por impressão, rodamos o analisador de
-- desempenho do Postgres. Ele apontou três coisas — todas baratas agora e
-- caras depois, porque só aparecem COM carga.
--
-- 1. `auth.uid()` REAVALIADO POR LINHA (auth_rls_initplan)
--    Numa policy, `auth.uid()` sem `select` é executado uma vez PARA CADA
--    LINHA avaliada. Com 50 contatos ninguém nota; com 50 mil, a mesma
--    consulta fica ordens de grandeza mais lenta. Envolver em
--    `(select auth.uid())` faz o Postgres calcular UMA vez e reusar.
--    Afetava `profiles` e `course_progress` (esta última criada ontem —
--    entrou com o defeito e sai antes de ter usuário).
--
-- 2. CHAVE ESTRANGEIRA SEM ÍNDICE
--    `contact_stage_history.tenant_id` e `contact_touch_log.tenant_id` são
--    filtrados em toda consulta multi-tenant e não tinham índice. Sem ele,
--    cada leitura vira varredura da tabela inteira — e essas duas tabelas
--    são append-only, então só crescem.
--
-- 3. DUAS POLICIES PERMISSIVAS PARA O MESMO SELECT
--    `memberships` tinha `memberships_select` (FOR SELECT) e
--    `memberships_admin_write` (FOR ALL). Como ALL inclui SELECT, toda
--    leitura de membership executava as DUAS funções — `is_member_of` e
--    `is_admin_of`. E `memberships` é lida em TODA página, porque é ela que
--    diz qual empresa está ativa. Era o caminho mais quente do sistema
--    pagando o dobro.
--
--    A correção NÃO afrouxa nada: a policy de escrita passa a valer só para
--    INSERT/UPDATE/DELETE, que é o que ela sempre quis dizer. Quem lê
--    continua limitado a `is_member_of`.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. auth.uid() uma vez por consulta, não por linha
-- ---------------------------------------------------------------------
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists course_progress_own on public.course_progress;
create policy course_progress_own on public.course_progress
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = course_progress.tenant_id
        and m.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.memberships m
      where m.tenant_id = course_progress.tenant_id
        and m.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 2. Índices nas chaves que a RLS filtra em toda leitura
-- ---------------------------------------------------------------------
create index if not exists ix_stage_history_tenant on public.contact_stage_history(tenant_id);
create index if not exists ix_touch_log_tenant     on public.contact_touch_log(tenant_id);
-- `owner_id` é filtrado sempre que a tela mostra "meus contatos" ou mede
-- desempenho por vendedor.
create index if not exists ix_contacts_owner       on public.contacts(owner_id);

-- ---------------------------------------------------------------------
-- 3. A policy de escrita para de rodar em toda leitura
--
-- Postgres não aceita `alter policy ... for`, então recria. O `using` é
-- exatamente o mesmo — muda só o comando ao qual ela se aplica.
-- ---------------------------------------------------------------------
drop policy if exists memberships_admin_write on public.memberships;

create policy memberships_admin_insert on public.memberships
  for insert with check (public.is_admin_of(tenant_id));

create policy memberships_admin_update on public.memberships
  for update using (public.is_admin_of(tenant_id))
             with check (public.is_admin_of(tenant_id));

create policy memberships_admin_delete on public.memberships
  for delete using (public.is_admin_of(tenant_id));

-- O mesmo padrão em `commercial_dna` e `knowledge_entries` — as duas tabelas
-- lidas em TODA geração de resposta. A policy de escrita era FOR ALL e por
-- isso rodava `is_admin_of` em cada leitura, além do `is_member_of` da policy
-- de leitura. Nada muda no que é permitido: só para de cobrar duas vezes.
drop policy if exists dna_admin_write on public.commercial_dna;
create policy dna_admin_insert on public.commercial_dna
  for insert with check (public.is_admin_of(tenant_id));
create policy dna_admin_update on public.commercial_dna
  for update using (public.is_admin_of(tenant_id)) with check (public.is_admin_of(tenant_id));
create policy dna_admin_delete on public.commercial_dna
  for delete using (public.is_admin_of(tenant_id));

drop policy if exists knowledge_tenant_write on public.knowledge_entries;
create policy knowledge_tenant_insert on public.knowledge_entries
  for insert with check (tenant_id is not null and public.is_admin_of(tenant_id));
create policy knowledge_tenant_update on public.knowledge_entries
  for update using (tenant_id is not null and public.is_admin_of(tenant_id))
             with check (tenant_id is not null and public.is_admin_of(tenant_id));
create policy knowledge_tenant_delete on public.knowledge_entries
  for delete using (tenant_id is not null and public.is_admin_of(tenant_id));

-- ---------------------------------------------------------------------
-- 4. Endurecimento de baixo custo (analisador de segurança)
--
-- `install_skill` NÃO era um buraco: ela já verifica por dentro se quem
-- chama administra a empresa, então chamada anônima falha com exceção.
-- Mas continuava exposta em `/rest/v1/rpc/install_skill` para o papel
-- `anon`. Tirar o EXECUTE de quem nunca deveria chamar é defesa em
-- profundidade e custa nada — a verificação interna continua sendo a
-- defesa real.
--
-- `search_path` mutável em função de trigger permite, em teoria, que um
-- schema no caminho de busca sequestre uma chamada. Fixar é uma linha.
-- ---------------------------------------------------------------------
revoke execute on function public.install_skill(uuid, text) from anon;

alter function public.touch_updated_at() set search_path = public, pg_temp;
alter function public.decisions_enforce_append_only() set search_path = public, pg_temp;

-- Verificação. Esperado: em `memberships`, SELECT só com `is_member_of`;
-- escrita (INSERT/UPDATE/DELETE) com `is_admin_of`. Nada afrouxado.
select policyname, cmd
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by cmd, policyname;
