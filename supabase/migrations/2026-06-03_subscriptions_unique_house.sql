-- =============================================================
-- FASE 1 — 1 ASSINATURA POR CASA (UNIQUE) + dedup
-- =============================================================
-- O webhook agora faz UPSERT por house_id (atômico, sem duplicar e garantindo
-- que o cancelamento sempre ache o preapproval). Isso exige uma constraint
-- UNIQUE(house_id) em subscriptions. Antes de criá-la, removemos eventuais
-- duplicatas mantendo a linha mais recente.
--
-- COMO RODAR: Supabase → SQL Editor → cole tudo → Run. Idempotente.

-- 1) Remove duplicatas por house_id, mantendo a mais recente
delete from public.subscriptions s
using public.subscriptions s2
where s.house_id = s2.house_id
  and s.id <> s2.id
  and (
    s.updated_at < s2.updated_at
    or (s.updated_at = s2.updated_at and s.id < s2.id)
  );

-- 2) Garante no máximo 1 assinatura por casa
alter table public.subscriptions drop constraint if exists subscriptions_house_id_unique;
alter table public.subscriptions add constraint subscriptions_house_id_unique unique (house_id);
