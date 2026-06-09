-- =============================================================
-- ANTI-FARM DE TRIAL DURÁVEL — sobrevive à EXCLUSÃO da conta
-- =============================================================
-- PROBLEMA (reportado): o trial_used ficava em `profiles`, que é APAGADO ao
-- excluir a conta (app/api/excluir-conta). Recriar com o MESMO email (via Google
-- OU cadastro normal) gerava um user_id NOVO → trial_used=false, 0 casas, 0
-- memberships → o app concedia os 14 dias DE NOVO = farm de trial.
--
-- SOLUÇÃO: registrar um HASH (SHA-256) do email NORMALIZADO numa tabela que a
-- exclusão da conta NÃO apaga. Guardamos só o HASH (sem PII / sem o email em si
-- — LGPD-friendly: serve só pra detectar duplicata, não identifica a pessoa).
-- A checagem/gravação é 100% no SERVIDOR (criar-casa, via service_role).
--
-- COMO RODAR: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- DEPOIS (uma vez), faça o BACKFILL dos usuários atuais:
--   GET /api/admin/trials?acao=backfill_trial_grants&key=<PLAY_RTDN_SECRET>

create table if not exists public.trial_grants (
  email_hash text primary key,
  created_at timestamptz not null default now()
);

-- RLS ligado e SEM policy de propósito: com isso, authenticated/anon NÃO leem
-- nem escrevem. Só o service_role (admin client das rotas do servidor) acessa.
alter table public.trial_grants enable row level security;
