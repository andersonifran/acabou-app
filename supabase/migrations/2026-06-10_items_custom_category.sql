-- Etiqueta pessoal opcional para itens da categoria "Outros" (ex.: "Ferramentas",
-- "Remédios", "Pet"). É dado do ITEM — escopo da casa, igual ao `note` — e NÃO
-- toca na tabela GLOBAL `categories` (que é compartilhada por todos). Assim o
-- usuário "explica" o Outros sem poluir a lista de categorias de ninguém.
--
-- Aditiva e NULLABLE: itens existentes ficam com NULL; nada quebra; deploy seguro.
-- IF NOT EXISTS: rodar de novo não dá erro (idempotente).
ALTER TABLE items ADD COLUMN IF NOT EXISTS custom_category TEXT;
