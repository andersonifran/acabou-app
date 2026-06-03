-- =============================================================
-- A1 — STATUS 'frozen' PARA CONGELAR CONVIDADOS (anti-burla)
-- =============================================================
-- Problema: quando o plano do dono expirava, os membros CONVIDADOS continuavam
-- com acesso premium de graça — o bloqueio era só visual (cliente). A RLS libera
-- tudo para membros com status='active', sem olhar o plano.
--
-- Solução: novo status 'frozen'. O cron rebaixa convidados (role<>owner) para
-- 'frozen' na expiração; o webhook os restaura para 'active' na renovação. Como
-- a RLS exige 'active', um membro 'frozen' é bloqueado AUTOMATICAMENTE no banco
-- (não dá pra burlar pelo cliente) — sem precisar reescrever nenhuma política.
--
-- COMO RODAR: Supabase → SQL Editor → cole tudo → Run. Idempotente.

-- Remove o CHECK atual de status (qualquer que seja o nome) e recria com 'frozen'
do $$
declare c text;
begin
  select conname into c
    from pg_constraint
   where conrelid = 'public.house_members'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%status%';
  if c is not null then
    execute format('alter table public.house_members drop constraint %I', c);
  end if;
end $$;

alter table public.house_members
  add constraint house_members_status_check
  check (status in ('active', 'invited', 'removed', 'frozen'));
