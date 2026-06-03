-- =============================================================
-- C1 — TRAVA DE LIMITE DE ITENS NO BANCO (anti-burla)
-- =============================================================
-- Problema: os itens eram inseridos direto pelo navegador (anon key + sessão),
-- e a RLS só checava "é membro da casa", nunca o plano. Qualquer um abria o
-- DevTools e inseria itens ilimitados de graça. A checagem em /api/verificar-limite
-- era só consultiva (e ainda falhava aberto). Esta trigger impõe o limite NO
-- POSTGRES — vale para QUALQUER caminho de inserção (até DevTools).
--
-- Regra: plano grátis (ou pago/trial expirado/congelado) = no máximo 10 itens.
-- Plano pago/trial ATIVO = ilimitado. A lógica de "plano efetivo" espelha
-- exatamente o hook useSubscription (trial expirado / pago expirado = congela).
--
-- COMO RODAR: Supabase → SQL Editor → cole tudo → Run. É idempotente
-- (pode rodar de novo sem problema).

create or replace function public.enforce_item_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan     text;
  v_status   text;
  v_expires  timestamptz;
  v_count    integer;
  v_trial_expired boolean;
  v_paid_expired  boolean;
  v_is_paid  boolean;
  free_max   constant integer := 10;  -- PLAN_LIMITS.free.max_items
begin
  select plan, plan_status, plan_expires_at
    into v_plan, v_status, v_expires
    from public.houses
   where id = NEW.house_id;

  -- Mesma lógica de expiração do useSubscription:
  v_trial_expired := (v_status = 'trialing')
                     and (v_expires is not null and v_expires < now());
  v_paid_expired  := (v_status is distinct from 'trialing')
                     and (v_status = 'inactive'
                          or (v_expires is not null and v_expires < now()));

  v_is_paid := (v_plan in ('monthly','yearly'))
               and not (v_trial_expired or v_paid_expired);

  -- Plano pago/trial ativo = ilimitado.
  if v_is_paid then
    return NEW;
  end if;

  -- Grátis / congelado: trava em free_max itens.
  select count(*) into v_count from public.items where house_id = NEW.house_id;
  if v_count >= free_max then
    raise exception 'ITEM_LIMIT_REACHED: plano gratis permite no maximo % itens', free_max
      using errcode = 'P0001';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_enforce_item_limit on public.items;
create trigger trg_enforce_item_limit
  before insert on public.items
  for each row execute function public.enforce_item_limit();
