-- =============================================================
-- Controle do e-mail de RECONQUISTA de notificações (push desligado).
--
-- Marca QUANDO o usuário recebeu o e-mail "ligue as notificações", pra enviar
-- no máximo UMA vez (sem spam). Null = nunca recebeu (elegível).
--
-- Rode UMA vez no SQL Editor do Supabase. Idempotente (IF NOT EXISTS).
-- =============================================================

alter table profiles
  add column if not exists push_reengage_at timestamptz;
