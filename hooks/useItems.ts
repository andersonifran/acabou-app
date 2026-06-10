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
    async (itemId: string, newStatus: ItemStatus): Promise<boolean> => {
      const { items: cur, currentHouse, userId, setToast } = useAppStore.getState();
      const item = cur.find((i) => i.id === itemId);
      if (!item) return false;
      if (item.status === newStatus) return true; // nada a fazer

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

      // Salva no banco. Captura TUDO — inclusive a FALHA DE REDE ("Failed to
      // fetch"), que antes estourava como unhandled rejection (Sentry). Em
      // qualquer erro: reverte o otimista, avisa o usuário e NÃO re-lança.
      try {
        const { error } = await supabase
          .from("items")
          .update(updatePayload)
          .eq("id", itemId);
        if (error) throw error;
      } catch (e) {
        updateItem(itemId, { status: item.status }); // reverte
        setToast("Sem conexão — não consegui salvar. Tente de novo. 📶");
        console.warn("[changeStatus] falhou:", e);
        return false;
      }

      if (updatePayload.next_reminder_at) {
        updateItem(itemId, { next_reminder_at: updatePayload.next_reminder_at as string });
      }

      // Evento (NÃO-crítico: a notificação vai pelo webhook do banco). try/catch
      // silencioso pra uma falha de rede aqui NÃO virar erro nem reverter o status.
      if (userId && currentHouse) {
        try {
          await supabase.from("item_events").insert({
            house_id: currentHouse.id,
            item_id: itemId,
            user_id: userId,
            event_type: "status_changed",
            old_status: item.status,
            new_status: newStatus,
            source: "app",
          });
        } catch (e) {
          console.warn("[item_events] falhou (ignorado):", e);
        }
      }

      return true;
    },
    [supabase, updateItem]
  );

  const markPurchased = useCallback(
    async (itemId: string): Promise<boolean> => {
      // Captura o status ANTES de mudar (pro evento "purchased").
      const before = useAppStore.getState().items.find((i) => i.id === itemId);
      const ok = await changeStatus(itemId, "tem"); // volta pra Despensa
      if (!ok) return false; // rede falhou → não tenta os secundários

      const { currentHouse, userId } = useAppStore.getState();
      if (!before || !currentHouse) return true;

      // Secundários (evento + data da compra) — não-críticos: try/catch silencioso.
      if (userId) {
        try {
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
        } catch (e) {
          console.warn("[markPurchased] secundário falhou (ignorado):", e);
        }
      }
      return true;
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

      // Evento (não-crítico) — try/catch silencioso pra rede ruim não estourar.
      try {
        await supabase.from("item_events").insert({
          house_id: currentHouse.id,
          item_id: item.id,
          user_id: userId,
          event_type: "created",
          new_status: data.status,
          source: "app",
        });
      } catch (e) {
        console.warn("[createItem] item_events falhou (ignorado):", e);
      }

      return item as Item;
    },
    [supabase, addItem]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      // Otimista: some da lista NA HORA. Captura o original p/ reverter em erro.
      const { setToast } = useAppStore.getState();
      const original = useAppStore.getState().items.find((i) => i.id === itemId);
      removeItem(itemId);

      // Captura TUDO (rede "Failed to fetch" + erro do banco). Sem isto, a
      // rejeição de rede virava unhandled rejection no caminho da despensa.
      try {
        const { error } = await supabase.from("items").delete().eq("id", itemId);
        if (error) throw error;
      } catch (e) {
        if (original) addItem(original); // reverte (re-insere) — o item volta
        setToast("Sem conexão — não consegui excluir. Tente de novo. 📶");
        console.warn("[deleteItem] falhou:", e);
      }
    },
    [supabase, removeItem, addItem]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: string) => {
      const { items: cur, userId, setToast } = useAppStore.getState();
      const item = cur.find((i) => i.id === itemId);
      if (!item) return;

      const trimmed = quantity.trim();
      updateItem(itemId, { quantity_text: trimmed || undefined });

      // Captura TUDO (rede "Failed to fetch" + erro do banco) — antes a rejeição
      // de rede virava unhandled rejection. Em erro: reverte, avisa e NÃO re-lança.
      try {
        const { error } = await supabase
          .from("items")
          .update({ quantity_text: trimmed || null, updated_by: userId })
          .eq("id", itemId);
        if (error) throw error;
      } catch (e) {
        updateItem(itemId, { quantity_text: item.quantity_text });
        setToast("Sem conexão — não consegui salvar. Tente de novo. 📶");
        console.warn("[updateQuantity] falhou:", e);
      }
    },
    [supabase, updateItem]
  );

  const renameItem = useCallback(
    async (itemId: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) throw new Error("Nome inválido");

      // Captura o original ANTES da alteração otimista (pra reverter em erro).
      const { items: cur, userId, setToast } = useAppStore.getState();
      const original = cur.find((i) => i.id === itemId);
      updateItem(itemId, { name: trimmed });

      // Captura TUDO (rede "Failed to fetch" + erro do banco) — antes a rejeição
      // de rede virava unhandled rejection. Em erro: reverte, avisa e NÃO re-lança.
      try {
        const { error } = await supabase
          .from("items")
          .update({ name: trimmed, updated_by: userId })
          .eq("id", itemId);
        if (error) throw error;
      } catch (e) {
        if (original) updateItem(itemId, { name: original.name });
        setToast("Sem conexão — não consegui salvar. Tente de novo. 📶");
        console.warn("[renameItem] falhou:", e);
      }
    },
    [supabase, updateItem]
  );

  const editItem = useCallback(
    async (itemId: string, data: { name: string; note?: string; quantity_text?: string }) => {
      const trimmed = data.name.trim();
      if (!trimmed) throw new Error("Nome inválido");

      // Captura o original ANTES da alteração otimista (pra reverter em erro).
      const { items: cur, userId, setToast } = useAppStore.getState();
      const original = cur.find((i) => i.id === itemId);
      if (!original) return;

      updateItem(itemId, {
        name: trimmed,
        note: data.note?.trim() || undefined,
        quantity_text: data.quantity_text?.trim() || undefined,
      });

      // Captura TUDO (rede "Failed to fetch" + erro do banco) — antes a rejeição
      // de rede virava unhandled rejection. Em erro: reverte, avisa e NÃO re-lança.
      try {
        const { error } = await supabase
          .from("items")
          .update({
            name: trimmed,
            note: data.note?.trim() || null,
            quantity_text: data.quantity_text?.trim() || null,
            updated_by: userId,
          })
          .eq("id", itemId);
        if (error) throw error;
      } catch (e) {
        updateItem(itemId, {
          name: original.name,
          note: original.note,
          quantity_text: original.quantity_text,
        });
        setToast("Sem conexão — não consegui salvar. Tente de novo. 📶");
        console.warn("[editItem] falhou:", e);
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
