-- =============================================
-- MIGRAÇÃO V3: Gerenciamento completo de membros
-- Execute este SQL no SQL Editor do Supabase
-- =============================================

-- 1. Adiciona colunas de gerenciamento no house_members
-- display_name: nome que o dono pode editar (ex: "Maria da Limpeza")
-- member_type: tipo de membro (familiar / funcionario)
-- relation_label: parentesco ou cargo (ex: "Cônjuge", "Diarista")
ALTER TABLE house_members ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE house_members ADD COLUMN IF NOT EXISTS member_type TEXT DEFAULT 'familiar';
ALTER TABLE house_members ADD COLUMN IF NOT EXISTS relation_label TEXT;

-- 2. Copia dados existentes dos invite_tokens para house_members (se houver)
UPDATE house_members hm
SET
  display_name = COALESCE(hm.display_name, it.invitee_name),
  member_type = COALESCE(hm.member_type, it.member_type, 'familiar'),
  relation_label = COALESCE(hm.relation_label, it.relation_label)
FROM invite_tokens it
WHERE it.house_id = hm.house_id
  AND it.used_at IS NOT NULL
  AND hm.role = 'member';

-- 3. Política RLS: membros podem ver perfis de outros membros da MESMA casa
-- (necessário para membros convidados verem o perfil do dono e dos outros membros)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_house_members_view') THEN
    CREATE POLICY "profiles_house_members_view" ON profiles
      FOR SELECT USING (
        user_id IN (
          SELECT hm2.user_id FROM house_members hm2
          WHERE hm2.house_id IN (
            SELECT hm3.house_id FROM house_members hm3
            WHERE hm3.user_id = auth.uid() AND hm3.status = 'active'
          )
          AND hm2.status = 'active'
        )
      );
  END IF;
END $$;
