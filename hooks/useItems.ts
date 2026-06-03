"use client";

import { useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { Item, ItemStatus, SHOPPING_LIST_STATUSES } from "@/types";
import { hapticSuccess } from "@/lib/haptics";

// Debounce de notificações: evita enviar notificação quando usuário
// toca acidentalmente e reverte o status rapidamente
const notifyTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function useItems() {
  const { items, currentHouse, updateItem, addItem, removeItem, userId } = useAppStore();
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

      // FEEDBACK IMEDIATO primeiro (sem esperar a rede) — usa o userId já
      // cacheado no store (setado pelo layout), eliminando o getUser() que
      // travava o toque.
      updateItem(itemId, { status: newStatus });
      hapticSuccess();

      const { error } = await supabase
        .from("items")
        .update({ status: newStatus, updated_by: userId })
        .eq("id", itemId);

      if (error) {
        // Reverte em caso de erro
        updateItem(itemId, { status: item.status });
        throw error;
      }

      // Registra evento
      if (userId && currentHouse) {
        await supabase.from("item_events").insert({
          house_id: currentHouse.id,
          item_id: itemId,
          user_id: userId,
          event_type: "status_changed",
          old_status: item.status,
          new_status: newStatus,
          source: "app",
        });

        // Notifica o dono da casa se item ficou "acabou" ou "acabando"
        // Debounce de 3s: se o usuário mudar o status de novo antes de 3s,
        // cancela a notificação anterior (evita falsos positivos por toque acidental)
        if (newStatus === "acabou" || newStatus === "acabando") {
          const timerKey = itemId;
          // Cancela timer anterior se existir
          const prev = notifyTimers.get(timerKey);
          if (prev) clearTimeout(prev);

          const timer = setTimeout(() => {
            notifyTimers.delete(timerKey);
            fetch("/api/push/notify-item", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                itemName: item.name,
                newStatus,
                houseId: currentHouse.id,
              }),
            }).catch(() => {});
          }, 3000);
          notifyTimers.set(timerKey, timer);
        } else {
          // Se voltou para "tem" ou "comprar", cancela notificação pendente
          const prev = notifyTimers.get(itemId);
          if (prev) {
            clearTimeout(prev);
            notifyTimers.delete(itemId);
          }
        }
      }
    },
    [items, currentHouse, supabase, updateItem, userId]
  );

  const markPurchased = useCallback(
    async (itemId: string) => {
      await changeStatus(itemId, "tem");

      const item = items.find((i) => i.id === itemId);
      if (!item || !currentHouse) return;

      if (userId) {
        await supabase.from("item_events").insert({
          house_id: currentHouse.id,
          item_id: itemId,
          user_id: userId,
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
    [items, currentHouse, supabase, changeStatus, userId]
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
      if (!userId) throw new Error("Não autenticado");

      // Verificação server-side do limite de itens (anti-bypass)
      try {
        const checkRes = await fetch("/api/verificar-limite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ houseId: currentHouse.id }),
        });
        const checkData = await checkRes.json();
        if (!checkData.allowed) {
          throw new Error(checkData.reason ?? "Limite de itens atingido. Faça upgrade para o Plano Família.");
        }
      } catch (err: any) {
        if (err.message?.includes("Limite")) throw err;
        // Se a API falhar (rede), continua (fallback para client-side check que já existe)
        console.warn("[createItem] Verificação server-side falhou, usando client-side:", err);
      }

      const { data: item, error } = await supabase
        .from("items")
        .insert({
          ...data,
          house_id: currentHouse.id,
          created_by: userId,
          updated_by: userId,
          source: "app",
        })
        .select("*, category:categories(*)")
        .single();

      if (error) {
        // A trava de limite vive no banco (trigger enforce_item_limit).
        // Traduz a rejeição para uma mensagem amigável → a UI abre o upgrade.
        if (error.message?.includes("ITEM_LIMIT_REACHED")) {
          throw new Error("Limite de itens atingido. Faça upgrade para o Plano Família.");
        }
        throw error;
      }

      addItem(item as Item);

      // Registra evento
      await supabase.from("item_events").insert({
        house_id: currentHouse.id,
        item_id: item.id,
        user_id: userId,
        event_type: "created",
        new_status: data.status,
        source: "app",
      });

      return item as Item;
    },
    [currentHouse, supabase, addItem, userId]
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

  const editItem = useCallback(
    async (itemId: string, data: { name: string; note?: string; quantity_text?: string }) => {
      const trimmed = data.name.trim();
      if (!trimmed) throw new Error("Nome inválido");

      const original = items.find((i) => i.id === itemId);
      if (!original) return;

      // Atualiza otimisticamente
      updateItem(itemId, {
        name: trimmed,
        note: data.note?.trim() || undefined,
        quantity_text: data.quantity_text?.trim() || undefined,
      });

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("items")
        .update({
          name: trimmed,
          note: data.note?.trim() || null,
          quantity_text: data.quantity_text?.trim() || null,
          updated_by: user?.id,
        })
        .eq("id", itemId);

      if (error) {
        // Reverte
        updateItem(itemId, {
          name: original.name,
          note: original.note,
          quantity_text: original.quantity_text,
        });
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
    editItem,
    updateQuantity,
  };
}
