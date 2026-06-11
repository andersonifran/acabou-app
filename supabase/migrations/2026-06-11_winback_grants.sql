-- =============================================================
-- ANTI-FARM DO WIN-BACK (+7 dias de volta) — UMA vez por pessoa, PRA SEMPRE.
-- =============================================================
-- O e-mail de reconquista "+7 dias grátis de volta" só pode ser concedido UMA
-- vez por usuário. Se a pessoa RECEBEU e NÃO assinou, NUNCA mais recebe — nem
-- apagando a conta e recriando com o mesmo e-mail (ou +alias / pontos no gmail).
--
-- Espelha o anti-farm de trial (2026-06-09_trial_grants): um marcador no perfil
-- (winback_granted_at) + uma tabela de HASH do e-mail (sem PII, LGPD-friendly)
-- que a EXCLUSÃO da conta NÃO apaga. A concessão é 100% no SERVIDOR (rota admin
-- reengage_winback, via service_role). Os +7 dias são por DATA (plan_expires_at)
-- → o cron RECONGELA depois. Regra de ouro mantida: pay-or-frozen.
--
-- COMO RODAR: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- =============================================================

-- Marcador permanente no perfil: quando recebeu o win-back (null = nunca recebeu).
alter table public.profiles add column if not exists winback_granted_at timestamptz;

-- Registro durável por HASH do e-mail normalizado (sobrevive a apagar/recriar).
create table if not exists public.winback_grants (
  email_hash text primary key,
  created_at timestamptz not null default now()
);

-- RLS ligado e SEM policy de propósito: só o service_role (rotas do servidor)
-- acessa. authenticated/anon NÃO leem nem escrevem (idêntico ao trial_grants).
alter table public.winback_grants enable row level security;
