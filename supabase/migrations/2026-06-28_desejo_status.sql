-- =============================================================
-- STATUS "desejo" — Lista de Desejos / sonhos de compra (28/06/2026)
--
-- Adiciona 'desejo' como status VÁLIDO de item, SEM mexer nos existentes
-- ('tem','acabando','acabou','comprar' continuam iguais). É tudo ADITIVO →
-- nada do que já funciona muda.
--
-- Por quê: o botão "Desejo de compras!" da Início cria itens com status
-- 'desejo', que aparecem numa seção SEPARADA "Meus desejos" na Lista (não se
-- misturam com o mercado da semana). A coluna items.status tem um CHECK que só
-- aceitava os 4 antigos → sem isto, criar um desejo dá erro.
--
-- ROBUSTO: acha e remove QUALQUER check de status (seja qual for o nome) antes
-- de recriar — assim funciona mesmo se o nome do constraint for diferente.
-- Idempotente: pode rodar de novo sem problema. Rodar no Supabase SQL Editor.
-- =============================================================

-- 1) items.status → passa a aceitar 'desejo'
do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public' and rel.relname = 'items'
      and con.contype = 'c' and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.items drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.items add constraint items_status_check
  check (status in ('tem', 'acabando', 'acabou', 'comprar', 'desejo'));

-- 2) item_events.old_status / new_status → também aceitam 'desejo'
do $$
declare r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public' and rel.relname = 'item_events'
      and con.contype = 'c' and pg_get_constraintdef(con.oid) ilike '%status%'
  loop
    execute format('alter table public.item_events drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.item_events add constraint item_events_old_status_check
  check (old_status in ('tem', 'acabando', 'acabou', 'comprar', 'desejo'));
alter table public.item_events add constraint item_events_new_status_check
  check (new_status in ('tem', 'acabando', 'acabou', 'comprar', 'desejo'));
