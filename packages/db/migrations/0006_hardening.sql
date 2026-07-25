-- =====================================================================
-- COS — MIGRATION 0006 : HARDENING (correções P0 da auditoria)
--
-- Fecha os dois furos que bloqueiam qualquer cliente externo:
--
--   P0-1  A biblioteca comercial curada — o ativo do produto — estava
--         legível por qualquer usuário autenticado via PostgREST. Um
--         trial baixava a curadoria inteira, de todos os segmentos.
--
--   P0-2  decisions não era realmente append-only. RLS é row-level; a
--         policy de UPDATE deixava reescrever context_snapshot, rationale
--         e cost_cents. História reescrita = Commercial Memory sem valor.
--
-- Executar na sequência numerada, em todo ambiente. Re-executável:
-- todo objeto é derrubado com IF EXISTS antes de recriado.
-- =====================================================================


-- ---------------------------------------------------------------------
-- P0-1a — skills: o catálogo global deixa de ser legível por authenticated.
--
-- Antes: `for select to authenticated using (true)` — um trial de
-- barbearia baixava o manifesto da academia e de todo segmento.
-- Agora: o autenticado só enxerga a Skill que o seu tenant INSTALOU,
-- via tenant_skills. O catálogo completo fica server-side (service_role
-- ignora RLS); o cliente recebe do servidor só o que precisa.
-- ---------------------------------------------------------------------
drop policy if exists skills_read           on public.skills;
drop policy if exists skills_read_installed on public.skills;

create policy skills_read_installed on public.skills
  for select to authenticated
  using (
    exists (
      select 1
      from public.tenant_skills ts
      where ts.skill_id = skills.id
        and public.is_member_of(ts.tenant_id)
    )
  );


-- ---------------------------------------------------------------------
-- P0-1b — knowledge_entries: a biblioteca GLOBAL curada (tenant_id null)
-- sai do alcance de authenticated.
--
-- Antes: `using (tenant_id is null or is_member_of(tenant_id))` — o ramo
-- `is null` expunha a curadoria inteira a qualquer autenticado.
-- Agora: o autenticado só lê o conhecimento PRÓPRIO do seu tenant. A
-- biblioteca global é lida server-side (service_role), no retrieval; a
-- estratégia nunca chega ao browser.
--
-- A gestão da biblioteca própria do tenant (INSERT/UPDATE/DELETE) segue
-- por knowledge_tenant_write, que não é tocada aqui.
-- ---------------------------------------------------------------------
drop policy if exists knowledge_select     on public.knowledge_entries;
drop policy if exists knowledge_select_own on public.knowledge_entries;

create policy knowledge_select_own on public.knowledge_entries
  for select to authenticated
  using (tenant_id is not null and public.is_member_of(tenant_id));


-- ---------------------------------------------------------------------
-- P0-2 — decisions append-only, em nível de COLUNA.
--
-- RLS não distingue coluna. Um trigger BEFORE UPDATE garante que só
-- outcome, outcome_at e executed_at possam mudar depois da inserção —
-- os três campos que nascem vazios e são preenchidos quando o cliente
-- responde e a ação é executada.
--
-- Vale para TODOS os papéis, inclusive service_role: se um bug do motor
-- tentar reescrever um rationale, o banco recusa. É a verificação
-- estrutural que o prompt não resolve.
--
-- DELETE é deliberadamente permitido: decisions tem ON DELETE CASCADE de
-- tenant/contact, e bloquear DELETE quebraria o direito ao esquecimento
-- (LGPD). Append-only aqui é "não reescreve", não "nunca apaga".
-- ---------------------------------------------------------------------
create or replace function public.decisions_enforce_append_only()
returns trigger
language plpgsql
as $$
begin
  if (to_jsonb(new) - array['outcome','outcome_at','executed_at'])
     is distinct from
     (to_jsonb(old) - array['outcome','outcome_at','executed_at'])
  then
    raise exception
      'decisions e append-only: so outcome, outcome_at e executed_at podem mudar apos a insercao';
  end if;
  return new;
end;
$$;

drop trigger if exists t_decisions_append_only on public.decisions;

create trigger t_decisions_append_only
  before update on public.decisions
  for each row
  execute function public.decisions_enforce_append_only();
