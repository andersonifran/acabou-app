-- =============================================================
-- Respeitar o "Desativar" deliberado de notificações (no SERVIDOR).
--
-- Problema: o handler pushsubscriptionchange (service worker) re-inscreve
-- automaticamente quando o navegador rotaciona a inscrição — e o SW NÃO lê
-- localStorage, então não vê a flag de opt-out do cliente. Resultado: quem
-- desativou DE PROPÓSITO podia ser religado em silêncio.
--
-- Solução: o servidor passa a ser a fonte da verdade. push_opted_out=true bloqueia
-- o re-cadastro AUTOMÁTICO (SW/resync). Só uma reativação DELIBERADA (botão do
-- convite/Configurações, que manda deliberate:true) limpa a flag e salva.
--
-- Rode UMA vez no SQL Editor do Supabase. Idempotente.
-- =============================================================

alter table profiles
  add column if not exists push_opted_out boolean not null default false;
