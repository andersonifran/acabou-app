-- =============================================
-- ACABOU? — Schema completo do banco de dados
-- Execute no SQL Editor do Supabase
-- =============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELAS
-- =============================================

-- Perfis de usuário (criado automaticamente após signup)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Casas
CREATE TABLE IF NOT EXISTS houses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'yearly')) NOT NULL,
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('active', 'inactive', 'cancelled', 'past_due')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Membros da casa
CREATE TABLE IF NOT EXISTS house_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'removed')) NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(house_id, user_id)
);

-- Categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Itens da despensa
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'tem' CHECK (status IN ('tem', 'acabando', 'acabou', 'comprar')) NOT NULL,
  note TEXT,
  quantity_text TEXT,
  is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
  recurrence_type TEXT CHECK (recurrence_type IN ('weekly', 'biweekly', 'monthly', 'bimonthly')),
  next_reminder_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  last_purchased_at TIMESTAMPTZ,
  source TEXT DEFAULT 'app' CHECK (source IN ('app', 'whatsapp', 'web')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Histórico de eventos
CREATE TABLE IF NOT EXISTS item_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_type TEXT NOT NULL,
  old_status TEXT CHECK (old_status IN ('tem', 'acabando', 'acabou', 'comprar')),
  new_status TEXT CHECK (new_status IN ('tem', 'acabando', 'acabou', 'comprar')),
  note TEXT,
  source TEXT DEFAULT 'app' CHECK (source IN ('app', 'whatsapp', 'web')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Sessões de compra
CREATE TABLE IF NOT EXISTS shopping_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'finished')) NOT NULL,
  items_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  finished_at TIMESTAMPTZ
);

-- Assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due')),
  provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tokens de convite
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- TRIGGERS — atualizar updated_at automaticamente
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER houses_updated_at BEFORE UPDATE ON houses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- TRIGGER — criar profile automaticamente após signup
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário vê/edita apenas o próprio perfil
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- Houses: usuário vê casas onde é membro
CREATE POLICY "houses_member_view" ON houses
  FOR SELECT USING (
    id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "houses_owner_manage" ON houses
  FOR ALL USING (owner_id = auth.uid());

-- House members: membros da casa podem ver outros membros
CREATE POLICY "house_members_view" ON house_members
  FOR SELECT USING (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "house_members_owner_manage" ON house_members
  FOR ALL USING (
    house_id IN (
      SELECT id FROM houses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "house_members_admin_invite" ON house_members
  FOR INSERT WITH CHECK (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- Categories: leitura pública (são categorias padrão do sistema)
CREATE POLICY "categories_read" ON categories
  FOR SELECT USING (TRUE);

-- Items: membros da casa podem ver e editar
CREATE POLICY "items_member_access" ON items
  FOR ALL USING (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Item events: membros da casa podem ver
CREATE POLICY "item_events_member_view" ON item_events
  FOR SELECT USING (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "item_events_member_insert" ON item_events
  FOR INSERT WITH CHECK (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Shopping sessions: membros da casa
CREATE POLICY "shopping_sessions_member" ON shopping_sessions
  FOR ALL USING (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Subscriptions: dono da casa
CREATE POLICY "subscriptions_owner" ON subscriptions
  FOR ALL USING (
    house_id IN (
      SELECT id FROM houses WHERE owner_id = auth.uid()
    )
  );

-- Invite tokens: membros admin+ podem criar; qualquer um pode ler para aceitar convite
CREATE POLICY "invite_tokens_view" ON invite_tokens
  FOR SELECT USING (TRUE);

CREATE POLICY "invite_tokens_create" ON invite_tokens
  FOR INSERT WITH CHECK (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "invite_tokens_owner_delete" ON invite_tokens
  FOR DELETE USING (
    house_id IN (
      SELECT id FROM houses WHERE owner_id = auth.uid()
    )
  );

-- =============================================
-- ÍNDICES para performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_house_members_user ON house_members(user_id);
CREATE INDEX IF NOT EXISTS idx_house_members_house ON house_members(house_id);
CREATE INDEX IF NOT EXISTS idx_items_house ON items(house_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_item_events_house ON item_events(house_id);
CREATE INDEX IF NOT EXISTS idx_item_events_created ON item_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_reminder ON items(next_reminder_at) WHERE next_reminder_at IS NOT NULL;
