-- Adicionar "trialing" como plan_status válido na tabela houses
ALTER TABLE houses DROP CONSTRAINT IF EXISTS houses_plan_status_check;
ALTER TABLE houses ADD CONSTRAINT houses_plan_status_check
  CHECK (plan_status IN ('active', 'inactive', 'cancelled', 'past_due', 'trialing'));

-- Adicionar coluna plan_expires_at se não existir (pode já existir)
ALTER TABLE houses ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- Adicionar property_type se não existir
ALTER TABLE houses ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'casa';

-- Adicionar reminder_enabled/reminder_time se não existir
ALTER TABLE houses ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE houses ADD COLUMN IF NOT EXISTS reminder_time TEXT DEFAULT '18:00';
