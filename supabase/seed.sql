-- =============================================
-- ACABOU? — Dados iniciais
-- Execute APÓS o schema.sql
-- =============================================

-- Categorias padrão
INSERT INTO categories (name, icon, sort_order, is_default) VALUES
  ('Alimentos',            '🛒', 1, TRUE),
  ('Limpeza',              '🧹', 2, TRUE),
  ('Higiene',              '🚿', 3, TRUE),
  ('Pet',                  '🐾', 4, TRUE),
  ('Bebê',                 '👶', 5, TRUE),
  ('Farmácia',             '💊', 6, TRUE),
  ('Escritório / Empresa', '🏢', 7, TRUE),
  ('Outros',               '📦', 8, TRUE)
ON CONFLICT DO NOTHING;
