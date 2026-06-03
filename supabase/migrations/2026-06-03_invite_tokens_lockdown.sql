-- =============================================================
-- FASE 2 — FECHAR LEITURA DE invite_tokens (anti acesso indevido)
-- =============================================================
-- Problema: a policy "invite_tokens_view" permitia SELECT para QUALQUER usuário
-- (USING TRUE). Um usuário logado podia LISTAR TODOS os tokens e entrar em casas
-- pagas sem ter sido convidado (premium de graça + ver lista de estranhos).
--
-- Agora a tela de convite lê o token pelo SERVIDOR (rotas /api/convite/info e
-- /api/convite/aceitar, com admin client). Nenhum código do cliente lê a tabela
-- diretamente, então podemos restringir o SELECT só ao DONO da casa.
--
-- COMO RODAR: Supabase → SQL Editor → cole tudo → Run. Idempotente.
-- IMPORTANTE: rode DEPOIS que o deploy com as rotas novas estiver no ar.

drop policy if exists "invite_tokens_view" on public.invite_tokens;

create policy "invite_tokens_owner_view" on public.invite_tokens
  for select using (
    house_id in (select id from public.houses where owner_id = auth.uid())
  );
