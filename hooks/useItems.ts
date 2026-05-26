"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { Item, ItemStatus, SHOPPING_LIST_STATUSES } from "@/types";

export function useItems() {
  const { items, currentHouse, updateItem, addItem, removeItem } = useAppStore();
  const supabase = createClient();

  const shoppingListItems = items.filter((i) =>
    SHOPPING_LIST_STATUSES.includes(i.status as any)
  );

  const itemsByCategory = items.reduce<Record<string, Item[]>>((acc, item) => {
    const catName = item.category?.name ?? "Outros";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(item);
    return acc;
  }, {});

  const changeStatus = useCallback(
    async (itemId: string, newStatus: ItemStatus) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      // Pega o usuário uma única vez
      const { data: { user } } = await supabase.auth.getUser();

      // Atualiza otimisticamente
      updateItem(itemId, { status: newStatus });

      const { error } = await supabase
        .from("items")
        .update({ status: newStatus, updated_by: user?.id })
        .eq("id", itemId);

      if (error) {
        // Reverte em caso de erro
        updateItem(itemId, { status: item.status });
        throw error;
      }

      // Registra evento
      if (user && currentHouse) {
        await supabase.from("item_events").insert({
          house_id: currentHouse.id,
          item_id: itemId,
          user_id: user.id,
          event_type: "status_changed",
          old_status: item.status,
          new_status: newStatus,
          source: "app",
        });

        // Notifica o dono da casa se item ficou "acabou" ou "acabando"
        if (newStatus === "acabou" || newStatus === "acabando") {
          fetch("/api/push/notify-item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemName: item.name,
              newStatus,
              houseId: currentHouse.id,
            }),
          }).catch(() => {}); // fire-and-forget
        }
      }
    },
    [items, currentHouse, supabase, updateItem]
  );

  const markPurchased = useCallback(
    async (itemId: string) => {
      await changeStatus(itemId, "tem");

      const item = items.find((i) => i.id === itemId);
      if (!item || !currentHouse) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("item_events").insert({
          house_id: currentHouse.id,
          item_id: itemId,
          user_id: user.id,
          event_type: "purchased",
          old_status: item.status,
          new_status: "tem",
          source: "app",
        });

        // Atualiza last_purchased_at
        await supabase
          .from("items")
          .update({ last_purchased_at: new Date().toISOString() })
          .eq("id", itemId);
      }
    },
    [items, currentHouse, supabase, changeStatus]
  );

  const createItem = useCallback(
    async (data: {
      name: string;
      category_id: string;
      status: ItemStatus;
      note?: string;
      quantity_text?: string;
    }) => {
      if (!currentHouse) throw new Error("Nenhuma casa selecionada");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: item, error } = await supabase
        .from("items")
        .insert({
          ...data,
          house_id: currentHouse.id,
          created_by: user.id,
          updated_by: user.id,
          source: "app",
        })
        .select("*, category:categories(*)")
        .single();

      if (error) throw error;

      addItem(item as Item);

      // Registra evento
      await supabase.from("item_events").insert({
        house_id: currentHouse.id,
        item_id: item.id,
        user_id: user.id,
        event_type: "created",
        new_status: data.status,
        source: "app",
      });

      return item as Item;
    },
    [currentHouse, supabase, addItem]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      const { error } = await supabase.from("items").delete().eq("id", itemId);
      if (error) throw error;
      removeItem(itemId);
    },
    [supabase, removeItem]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const trimmed = quantity.trim();
      updateItem(itemId, { quantity_text: trimmed || undefined });

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("items")
        .update({ quantity_text: trimmed || null, updated_by: user?.id })
        .eq("id", itemId);

      if (error) {
        updateItem(itemId, { quantity_text: item.quantity_text });
        throw error;
      }
    },
    [items, supabase, updateItem]
  );

  const renameItem = useCallback(
    async (itemId: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) throw new Error("Nome inválido");

      updateItem(itemId, { name: trimmed });

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("items")
        .update({ name: trimmed, updated_by: user?.id })
        .eq("id", itemId);

      if (error) {
        // Reverte
        const original = items.find((i) => i.id === itemId);
        if (original) updateItem(itemId, { name: original.name });
        throw error;
      }
    },
    [items, supabase, updateItem]
  );

  return {
    items,
    shoppingListItems,
    itemsByCategory,
    changeStatus,
    markPurchased,
    createItem,
    deleteItem,
    renameItem,
    updateQuantity,
  };
}
