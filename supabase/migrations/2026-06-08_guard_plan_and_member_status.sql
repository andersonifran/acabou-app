-- =============================================================
-- BLINDAGEM ANTI-BURLA (08/06/2026)
-- Furo encontrado na auditoria adversarial: a RLS de `houses` e `house_members`
-- deixava o DONO (sessão anon/authenticated, via DevTools) escrever direto nas
-- colunas de PLANO (plan/plan_status/plan_expires_at) e no STATUS dos membros —
-- ou seja, forjar "plano ativo" e "descongelar" convidados SEM PAGAR.
--
-- Correção: triggers que SÓ deixam o SERVIDOR (service_role = admin client usado
-- por webhooks/cron/Play/Mercado Pago) alterar essas colunas. Qualquer tentativa
-- pelo cliente (authenticated/anon) é bloqueada. Updates em OUTRAS colunas (nome,
-- lembrete, etc.) continuam normais — só barra MUDANÇA nas colunas sensíveis.
-- Idempotente (pode rodar de novo sem problema).
-- =============================================================

-- 1) PLANO da casa: só o servidor pode mudar plan / plan_status / plan_expires_at
create or replace function public.guard_house_plan_columns()
returns trigger
language plpgsql
as $$
begin
  if (new.plan            is distinct from old.plan
   or new.plan_status     is distinct from old.plan_status
   or new.plan_expires_at is distinct from old.plan_expires_at)
   and coalesce(auth.role(), '') in ('authenticated', 'anon') then
    raise exception 'Plano da casa so pode ser alterado pelo servidor (assinatura).';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_house_plan on public.houses;
create trigger guard_house_plan
  before update on public.houses
  for each row execute function public.guard_house_plan_columns();

-- 2) STATUS do membro (active/frozen): só o servidor pode mudar
--    (impede o dono de "descongelar" convidados sem renovar o plano)
create or replace function public.guard_member_status_column()
returns trigger
language plpgsql
as $$
begin
  if (new.status is distinct from old.status)
   and coalesce(auth.role(), '') in ('authenticated', 'anon') then
    raise exception 'Status do membro so pode ser alterado pelo servidor.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_member_status on public.house_members;
create trigger guard_member_status
  before update on public.house_members
  for each row execute function public.guard_member_status_column();
