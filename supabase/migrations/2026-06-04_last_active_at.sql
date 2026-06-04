-- Atividade do usuário (para o nudge diário de re-engajamento).
-- Atualizada a cada vez que o app é aberto (via /api/ping).
-- Usada pelo cron para NÃO incomodar quem já abriu o app hoje.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);
