"use client";

import { useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { Item, ItemStatus, SHOPPING_LIST_STATUSES, RecurrenceType } from "@/types";
import { hapticSuccess } from "@/lib/haptics";
import { getNextReminderDate } from "@/lib/utils";

export function useItems() {
  // `items` (reativo) alimenta a UI + os useMemo. Os SETTERS do Zustand são
  // referências ESTÁVEIS (definidos uma vez), então podem ficar nas deps dos
  // callbacks sem desestabilizá-los.
  const { items, updateItem, addItem, removeItem } = useAppStore();
  const supabase = createClient();

  // Memoizado: só recalcula quando os itens mudam (não a cada render).
  const shoppingListItems = useMemo(
    () => items.filter((i) => SHOPPING_LIST_STATUSES.includes(i.status as any)),
    [items]
  );

  const itemsByCategory = useMemo(
    () =>
      items.reduce<Record<string, Item[]>>((acc, item) => {
        const catName = item.category?.name ?? "Outros";
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(item);
        return acc;
      }, {}),
    [items]
  );

  // IMPORTANTE (performance em lista grande, ex.: empresa com 150–300 itens):
  // os callbacks abaixo NÃO fecham sobre `items`/`currentHouse`/`userId` — eles
  // leem o estado fresco via `useAppStore.getState()` no momento da chamada.
  // Assim ficam com referência ESTÁVEL → o `memo()` do ItemCard segura e mudar
  // 1 item NÃO re-renderiza a lista inteira. A lógica (otimista + reverter) é
  // preservada porque capturamos o ORIGINAL ANTES de alterar.

  const changeStatus = useCallback(
    async (itemId: string, newStatus: ItemStatus) => {
      const { items: cur, currentHouse, userId } = useAppStore.getState();
      const item = cur.find((i) => i.id === itemId);
      if (!item) return;

      // Feedback imediato (otimista) — usa userId já cacheado, sem getUser().
      updateItem(itemId, { status: newStatus });
      hapticSuccess();

      // Item RECORRENTE recomprado (status "tem") → agenda próximo lembrete.
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updated_by: userId,
      };
      if (newStatus === "tem" && item.is_recurring && item.recurrence_type) {
        updatePayload.next_reminder_at = getNextReminderDate(
          item.recurrence_type as RecurrenceType
        ).toISOString();
      }

      const { error } = await supabase
        .from("items")
        .update(updatePayload)
        .eq("id", itemId);

      if (error) {
        // Reverte para o status original (capturado antes).
        updateItem(itemId, { status: item.status });
        throw error;
      }

      if (updatePayload.next_reminder_at) {
        updateItem(itemId, { next_reminder_at: updatePayload.next_reminder_at as string });
      }

      // Registra evento (a notificação ao dono é disparada pelo webhook do banco).
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
      }
    },
    [supabase, updateItem]
  );

  const markPurchased = useCallback(
    async (itemId: string) => {
      // Captura o status ANTES de mudar (pro evento "purchased").
      const before = useAppStore.getState().items.find((i) => i.id === itemId);
      await changeStatus(itemId, "tem");

      const { currentHouse, userId } = useAppStore.getState();
      if (!before || !currentHouse) return;

      if (userId) {
        await supabase.from("item_events").insert({
          house_id: currentHouse.id,
          item_id: itemId,
          user_id: userId,
          event_type: "purchased",
          old_status: before.status,
          new_status: "tem",
          source: "app",
        });

        await supabase
          .from("items")
          .update({ last_purchased_at: new Date().toISOString() })
          .eq("id", itemId);
      }
    },
    [supabase, changeStatus]
  );

  const createItem = useCallback(
    async (data: {
      name: string;
      category_id: string;
      status: ItemStatus;
      note?: string;
      quantity_text?: string;
    }) => {
      const { currentHouse, userId } = useAppStore.getState();
      if (!currentHouse) throw new Error("Nenhuma casa selecionada");
      if (!userId) throw new Error("Não autenticado");

      // Verificação server-side do limite (anti-bypass). A trava REAL é o trigger
      // do banco (enforce_item_limit); isto é só pra mensagem amigável.
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
        if (error.message?.includes("ITEM_LIMIT_REACHED")) {
          throw new Error("Limite de itens atingido. Faça upgrade para o Plano Família.");
        }
        throw error;
      }

      addItem(item as Item);

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
    [supabase, addItem]
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
      const item = useAppStore.getState().items.find((i) => i.id === itemId);
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
    [supabase, updateItem]
  );

  const renameItem = useCallback(
    async (itemId: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) throw new Error("Nome inválido");

      // Captura o original ANTES da alteração otimista (pra reverter em erro).
      const original = useAppStore.getState().items.find((i) => i.id === itemId);
      updateItem(itemId, { name: trimmed });

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("items")
        .update({ name: trimmed, updated_by: user?.id })
        .eq("id", itemId);

      if (error) {
        if (original) updateItem(itemId, { name: original.name });
        throw error;
      }
    },
    [supabase, updateItem]
  );

  const editItem = useCallback(
    async (itemId: string, data: { name: string; note?: string; quantity_text?: string }) => {
      const trimmed = data.name.trim();
      if (!trimmed) throw new Error("Nome inválido");

      // Captura o original ANTES da alteração otimista (pra reverter em erro).
      const original = useAppStore.getState().items.find((i) => i.id === itemId);
      if (!original) return;

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
        updateItem(itemId, {
          name: original.name,
          note: original.note,
          quantity_text: original.quantity_text,
        });
        throw error;
      }
    },
    [supabase, updateItem]
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
