-- =============================================================
-- ANTI-FARM DE TRIAL — marcador permanente no perfil
-- =============================================================
-- Problema: o trial de 7 dias era decidido por "primeira casa do usuário".
-- Mas se a pessoa apaga a casa e cria outra, os registros somem (cascade) e o
-- app "esquece" — poderia farmar trial em ciclo. E convidado virando dono
-- também não deve ganhar trial.
--
-- Solução: coluna trial_used em profiles (sobrevive a apagar/recriar casa).
-- O trial só é concedido uma única vez por conta, e nunca para quem já foi
-- membro/convidado de outra casa.
--
-- COMO RODAR: Supabase → SQL Editor → cole tudo → Run. Idempotente.

alter table public.profiles
  add column if not exists trial_used boolean not null default false;

-- Backfill: quem JÁ possui qualquer casa já usou (ou está usando) seu trial,
-- então marca como usado para não farmar depois.
update public.profiles p
   set trial_used = true
 where exists (select 1 from public.houses h where h.owner_id = p.user_id);
