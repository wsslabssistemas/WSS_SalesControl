-- 0054 — O PERFIL NASCE COM O USUÁRIO
--
-- POR QUE
-- `memberships.user_id` referencia `profiles(id)`. Mas criar conta no Supabase
-- cria linha em `auth.users` e mais nada — o perfil dependia de cada caminho
-- do código lembrar de fazer o `upsert` ANTES de qualquer vínculo.
--
-- Dois caminhos existem hoje e só um lembrava. O convite (`equipe/actions.ts`)
-- criava o perfil primeiro; o cadastro próprio, não. Resultado: os dois
-- primeiros clientes externos do produto criaram a empresa e o vínculo
-- estourou na chave estrangeira — deixando a empresa ÓRFÃ, criada e sem dono.
--
-- Corrigir a ordem naquele arquivo resolve o caso. **Não resolve a classe.**
-- O terceiro caminho que alguém escrever vai esquecer de novo, e o sintoma
-- aparece só quando um usuário novo de verdade tenta — que é o pior momento
-- possível para descobrir.
--
-- Com o gatilho, a garantia deixa de depender de disciplina: todo usuário tem
-- perfil no instante em que existe, e a chave estrangeira não tem como falhar.
--
-- POR QUE `security definer`
-- O gatilho roda no contexto de quem inseriu em `auth.users` — que é o GoTrue,
-- sem permissão sobre `public.profiles`. Sem `security definer` o cadastro
-- inteiro falharia, o que seria trocar um bug silencioso por um barulhento.
--
-- POR QUE `on conflict do nothing`
-- O código continua fazendo `upsert` de perfil em alguns caminhos (e isso é
-- bom: mantém `full_name` e `email` em dia). O gatilho não pode brigar com
-- eles.

create or replace function public.criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    -- O nome vem do que a pessoa digitou no cadastro. Sem ele, o e-mail serve
    -- de rótulo: perfil sem nome nenhum aparece em branco na tela de Equipe.
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists t_criar_perfil_do_usuario on auth.users;
create trigger t_criar_perfil_do_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_do_usuario();

-- REPARA QUEM JÁ ESTAVA SEM PERFIL. São as contas criadas entre a entrada
-- própria existir e este gatilho: elas conseguem entrar, mas não conseguiriam
-- criar empresa nenhuma.
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', u.email)
  from auth.users u
 where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
