-- =============================================
-- LIMPEZA: Resetar casas/dados para recomeçar
-- =============================================
-- INSTRUÇÃO: Cole este SQL inteiro no SQL Editor do Supabase e clique "Run"
-- Isso vai:
-- 1. Limpar categorias duplicadas (manter apenas 1 de cada)
-- 2. Deletar TODAS as casas e seus dados (itens, membros, convites, eventos)
-- 3. Deletar subscriptions
-- 4. Manter os usuários/contas intactos (perfis e autenticação preservados)
-- Depois disso, a esposa pode entrar no app e recriar tudo do zero.

-- =============================================
-- PASSO 1: Limpar categorias duplicadas
-- =============================================
-- Mantém apenas a categoria com menor ID de cada nome (a original)
DELETE FROM categories
WHERE id NOT IN (
  SELECT MIN(id) FROM categories GROUP BY name
);

-- =============================================
-- PASSO 2: Deletar todas as subscriptions
-- =============================================
DELETE FROM subscriptions;

-- =============================================
-- PASSO 3: Deletar todas as casas (CASCADE deleta itens, membros, eventos, convites)
-- =============================================
DELETE FROM houses;

-- =============================================
-- PASSO 4: Limpar push_subscriptions (opcional, mantém notificações)
-- =============================================
-- DELETE FROM push_subscriptions;

-- =============================================
-- RESULTADO: Banco limpo, pronto para novos cadastros
-- =============================================
-- Os usuários (auth.users + profiles) continuam existindo.
-- Ao abrir o app, serão redirecionados para o onboarding para criar nova casa.
