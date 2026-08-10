-- 0055 — O PERFIL DO COLEGA É VISÍVEL PARA A EQUIPE
--
-- POR QUE
-- `profiles_self` permite ler apenas o próprio perfil (`id = auth.uid()`).
-- Isso é correto para dado pessoal do usuário — e errado para o único uso que
-- o produto faz da tabela: mostrar QUEM É QUEM na equipe.
--
-- A tela de Equipe lê `memberships` com `user:profiles(full_name, email)`. A
-- junção voltava NULA para todo mundo menos você, e a coluna caía no fallback
-- ("—" ou o e-mail). O dono da empresa não conseguia saber quem era quem na
-- própria equipe, e nenhuma correção do lado do nome resolveria: o nome estava
-- gravado, a tela é que não podia lê-lo.
--
-- Foi por isso que preencher `full_name` de João, Nycolas e Luciana no banco
-- não mudou nada na tela. O sintoma parecia "o nome não salvou"; era "o nome
-- não pode ser lido".
--
-- O QUE ESTA POLICY ABRE, E O QUE ELA NÃO ABRE
-- Abre: nome e e-mail de quem COMPARTILHA UMA EMPRESA ATIVA com você. É
-- exatamente o que a tela de Equipe mostra, e o que qualquer pessoa da equipe
-- já sabe do colega.
--
-- Não abre: perfil de quem está em OUTRA empresa. A Lei 3 continua de pé — o
-- vínculo tem que existir dos dois lados, e ativo. Um teste grátis não enxerga
-- ninguém de fora dele.
--
-- `profiles_self` continua existindo e governando ESCRITA: cada um só altera o
-- próprio perfil. As policies são OR entre si, então esta aqui só amplia o
-- SELECT.

drop policy if exists profiles_da_equipe on public.profiles;

create policy profiles_da_equipe
  on public.profiles for select
  using (
    id = (select auth.uid())
    or exists (
      select 1
        from public.memberships eu
        join public.memberships colega on colega.tenant_id = eu.tenant_id
       where eu.user_id = (select auth.uid())
         and eu.status = 'active'
         and colega.user_id = profiles.id
         and colega.status = 'active'
    )
  );

-- O índice que sustenta a policy. Sem ele, cada linha da tela de Equipe faz
-- uma varredura em `memberships` — barato com 5 pessoas, caro quando uma rede
-- tiver 50 e a consulta rodar a cada carregamento de página.
create index if not exists ix_memberships_user_tenant
  on public.memberships (user_id, tenant_id)
  where status = 'active';
