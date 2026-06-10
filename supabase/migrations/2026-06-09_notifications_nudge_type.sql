-- =============================================================
-- Permite type = 'nudge' na tabela notifications.
--
-- BUG: o CHECK original (push-notifications.sql) só aceitava
--   ('item_change','reminder','invite','system').
-- O cron de re-engajamento insere type='nudge' → o INSERT FALHAVA em silêncio
-- (constraint violada). Resultado: os registros in-app do nudge NUNCA gravaram
-- e a dedup do nudge (que consulta type='nudge') nunca funcionou. O push até
-- saía (o código antigo ignorava o erro), mas sem histórico nem dedup.
--
-- Idempotente: dropa o constraint antigo (qualquer que seja o nome) e recria
-- com 'nudge' incluído. Rode UMA vez no SQL Editor do Supabase.
-- =============================================================

alter table notifications drop constraint if exists notifications_type_check;

alter table notifications
  add constraint notifications_type_check
  check (type in ('item_change', 'reminder', 'invite', 'system', 'nudge'));
