-- =============================================
-- ACABOU? — Migração v2
-- Execute no SQL Editor do Supabase APÓS o schema.sql
-- =============================================

-- 1. Adiciona avatar_url na tabela profiles (se não existir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Adiciona property_type na tabela houses (se não existir)
ALTER TABLE houses ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'casa';

-- 3. Cria tabela de feedbacks dos usuários
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS para feedbacks (só admin lê, qualquer autenticado envia)
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem enviar feedback"
  ON feedbacks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anônimos também podem enviar feedback"
  ON feedbacks FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. Colunas extras para invite_tokens (se não existirem)
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS invitee_name TEXT;
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT 'familiar';
ALTER TABLE invite_tokens ADD COLUMN IF NOT EXISTS relation_label TEXT;

-- 5. Supabase Storage — bucket avatars
-- Execute manualmente no dashboard: Storage → New bucket → "avatars" → Public: ON
-- Ou via SQL:
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars são públicos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Usuário pode fazer upload do próprio avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuário pode atualizar próprio avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
