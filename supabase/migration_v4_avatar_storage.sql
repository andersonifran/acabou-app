-- =============================================
-- MIGRAÇÃO V4: Storage Bucket para Avatares
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. Criar bucket público para avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: qualquer usuário autenticado pode fazer upload do seu próprio avatar
-- O arquivo é salvo como {userId}.{ext} na raiz do bucket
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND name LIKE (auth.uid()::text || '.%')
);

-- 3. Policy: qualquer usuário autenticado pode atualizar seu próprio avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE (auth.uid()::text || '.%')
);

-- 4. Policy: qualquer usuário autenticado pode deletar seu próprio avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE (auth.uid()::text || '.%')
);

-- 5. Policy: avatares são públicos (qualquer um pode ver)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
