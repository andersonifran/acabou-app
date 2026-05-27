-- =============================================
-- MIGRAÇÃO: Corrigir Membros(0) + Notificações + Limpar testes
-- Execute este SQL no SQL Editor do Supabase
-- =============================================

-- 1. Adiciona avatar_url ao profiles (se não existir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Cria tabela notifications (se não existir)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Habilita RLS nas novas tabelas
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS para notifications — usuário vê/edita/deleta apenas as suas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_own') THEN
    CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- 5. CRÍTICO: Permite que o DONO da casa veja perfis dos membros convidados
-- SEM isso, o dono não consegue ver os nomes/avatares dos membros na aba Casa
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_house_owner_view') THEN
    CREATE POLICY "profiles_house_owner_view" ON profiles
      FOR SELECT USING (
        user_id IN (
          SELECT hm.user_id FROM house_members hm
          WHERE hm.house_id IN (
            SELECT h.id FROM houses h WHERE h.owner_id = auth.uid()
          )
          AND hm.status = 'active'
        )
      );
  END IF;
END $$;

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 7. Adiciona colunas extras no invite_tokens (usadas pelo modal de convite)
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS invitee_name TEXT;
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS member_type TEXT;
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS relation_label TEXT;

-- 8. Adiciona colunas extras no houses
ALTER TABLE houses ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'casa';
ALTER TABLE houses ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- =============================================
-- 9. LIMPAR CONVITES DE TESTE
-- Remove TODOS os membros convidados e tokens
-- (o dono NÃO é afetado, apenas role='member')
-- =============================================
DELETE FROM house_members WHERE role = 'member';
DELETE FROM invite_tokens;
DELETE FROM notifications;
