-- =============================================================
-- BLINDAGEM ANTI-BURLA #2 (11/06/2026) — FECHA O FURO DE INSERT
--
-- A blindagem de 08/06 (guard_house_plan / guard_member_status) era SÓ
-- `BEFORE UPDATE`. Auditoria adversarial (red team) achou que o cliente
-- (authenticated/anon, via DevTools + anon key pública) ainda conseguia
-- INSERIR uma casa nova JÁ premium e ganhar acesso ilimitado de graça,
-- pulando o trial:
--   supabase.from('houses').insert({ owner_id: meuUid,
--       plan:'yearly', plan_status:'active', plan_expires_at:'2099-...' })
--   + house_members.insert({ ..., status:'active' })
-- Causa: a policy `houses_owner_manage` é FOR ALL USING(owner_id=auth.uid())
-- SEM `WITH CHECK`, e os gatilhos NÃO disparavam no INSERT. Depois disso o
-- `enforce_item_limit` lê plan=yearly/2099 → itens ilimitados, e os crons
-- (que filtram plan_expires_at < now) nunca olham uma casa com vencimento 2099.
--
-- FIX: os gatilhos passam a rodar `BEFORE INSERT OR UPDATE`. No INSERT, o
-- CLIENTE não pode criar casa paga/trial nem membro já ATIVO — isso só vem do
-- SERVIDOR (service_role: /api/criar-casa, webhooks Play/MP, cron), que é
-- ISENTO (auth.role() não é authenticated/anon). Todo o fluxo legítimo é
-- server-side → NADA quebra: o trial de 14 dias continua (criar-casa usa
-- createAdminClient). Idempotente — pode rodar de novo sem problema.
-- =============================================================

-- 1) PLANO da casa: bloqueia o CLIENTE de ALTERAR (update) E de criar casa
--    já paga/trial (insert). Só o servidor (service_role) define plano.
create or replace function public.guard_house_plan_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      -- Casa nova criada pelo cliente NÃO pode nascer paga nem em trial:
      -- plano pago/trial só vem do servidor (/api/criar-casa, assinatura).
      if new.plan is distinct from 'free'
         or new.plan_status = 'trialing'
         or new.plan_expires_at is not null then
        raise exception 'Plano da casa so pode ser definido pelo servidor (assinatura).';
      end if;
    else -- UPDATE
      if new.plan            is distinct from old.plan
       or new.plan_status     is distinct from old.plan_status
       or new.plan_expires_at is distinct from old.plan_expires_at then
        raise exception 'Plano da casa so pode ser alterado pelo servidor (assinatura).';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_house_plan on public.houses;
create trigger guard_house_plan
  before insert or update on public.houses
  for each row execute function public.guard_house_plan_columns();

-- 2) STATUS do membro: bloqueia o cliente de descongelar (update) E de inserir
--    um membro já ATIVO (insert) — adesão ativa só vem do servidor (aceitar
--    convite, criar-casa). Sem isso, dava pra forjar acesso ativo numa casa.
create or replace function public.guard_member_status_column()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      if new.status = 'active' then
        raise exception 'Membro so pode ser ativado pelo servidor.';
      end if;
    else -- UPDATE
      if new.status is distinct from old.status then
        raise exception 'Status do membro so pode ser alterado pelo servidor.';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_member_status on public.house_members;
create trigger guard_member_status
  before insert or update on public.house_members
  for each row execute function public.guard_member_status_column();
