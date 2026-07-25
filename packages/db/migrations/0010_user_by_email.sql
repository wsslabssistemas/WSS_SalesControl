-- =====================================================================
-- COS — MIGRATION 0010 : localizar usuário por e-mail (uso admin)
--
-- Ao convidar um vendedor que já tem conta, o servidor precisa achar o id
-- dele por e-mail para criar o vínculo (membership). auth.users não é exposto
-- via PostgREST; esta função dá o acesso mínimo, e SÓ para service_role
-- (o cliente admin server-side). Nunca para authenticated/anon.
-- Re-executável.
-- =====================================================================

create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke all on function public.get_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.get_user_id_by_email(text) to service_role;
