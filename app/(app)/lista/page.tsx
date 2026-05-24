"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { useItems } from "@/hooks/useItems";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/shared/EmptyState";
import { Item } from "@/types";
import { buildShoppingListText, buildWhatsAppShareUrl } from "@/lib/utils";
import { Check, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

// Textos dinâmicos por tipo de local
const LOCATION_COPY: Record<string, { question: string; confirm: string; done: string }> = {
  casa:        { question: 'Colocar este item como "Tem em casa"?',     confirm: "Sim, tem em casa",     done: "Sua casa está em dia." },
  apartamento: { question: 'Colocar este item como "Tem no apê"?',      confirm: "Sim, tem no apê",      done: "Seu apê está em dia." },
  praia:       { question: 'Colocar este item como "Tem na praia"?',    confirm: "Sim, tem na praia",    done: "Sua praia está em dia." },
  veraneio:    { question: 'Colocar este item como "Tem no veraneio"?', confirm: "Sim, tem no veraneio", done: "Seu veraneio está em dia." },
  empresa:     { question: 'Colocar este item como "Tem na empresa"?',  confirm: "Sim, tem na empresa",  done: "Sua empresa está em dia." },
  outro:       { question: 'Colocar este item como "Tem no local"?',    confirm: "Sim, tem no local",    done: "Seu local está em dia." },
};

export default function ListaPage() {
  const { currentHouse, setAddItemModalOpen, setInitialStatus } = useAppStore();
  const propertyType = (currentHouse as any)?.property_type ?? "casa";
  const copy = LOCATION_COPY[propertyType] ?? LOCATION_COPY.casa;
  const { shoppingListItems, changeStatus, markPurchased } = useItems();
  const supabase = createClient();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(false);
  const [showPurchasedModal, setShowPurchasedModal] = useState<string | null>(null);

  // Agrupar por categoria
  const byCategory = shoppingListItems.reduce<Record<string, Item[]>>((acc, item) => {
    const cat = item.category?.name ?? "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleItemPurchased(itemId: string) {
    setShowPurchasedModal(itemId);
  }

  async function confirmPurchased(putAsHas: boolean) {
    if (!showPurchasedModal) return;
    if (putAsHas) {
      await markPurchased(showPurchasedModal);
    }
    setShowPurchasedModal(null);
  }

  async function finishShopping() {
    if (checkedIds.size === 0) return;
    setFinishing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentHouse) return;

      // Marcar todos os itens checados como "tem"
      const promises = Array.from(checkedIds).map((id) =>
        supabase
          .from("items")
          .update({ status: "tem", updated_by: user.id, last_purchased_at: new Date().toISOString() })
          .eq("id", id)
      );
      await Promise.all(promises);

      // Registrar sessão de compra
      await supabase.from("shopping_sessions").insert({
        house_id: currentHouse.id,
        user_id: user.id,
        status: "finished",
        items_count: checkedIds.size,
        finished_at: new Date().toISOString(),
      });

      // Registrar eventos
      for (const id of checkedIds) {
        const item = shoppingListItems.find((i) => i.id === id);
        if (item) {
          await supabase.from("item_events").insert({
            house_id: currentHouse.id,
            item_id: id,
            user_id: user.id,
            event_type: "purchased",
            old_status: item.status,
            new_status: "tem",
            source: "app",
          });
        }
      }

      setDone(true);
      setCheckedIds(new Set());
      // Atualiza items no store
      window.location.reload();
    } finally {
      setFinishing(false);
    }
  }

  function shareOnWhatsApp() {
    const itemsForShare = shoppingListItems.map((i) => ({
      name: i.name,
      category: i.category?.name ?? "Outros",
      note: i.note,
    }));
    const text = buildShoppingListText(itemsForShare);
    window.open(buildWhatsAppShareUrl(text), "_blank");
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Compra atualizada.</h2>
        <p className="text-gray-500">{copy.done}</p>
        <button
          onClick={() => setDone(false)}
          className="mt-8 bg-green-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-green-700 transition-colors"
        >
          Ver despensa
        </button>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Lista de Compras"
        subtitle={`${shoppingListItems.length} ${shoppingListItems.length === 1 ? "item" : "itens"}`}
        right={undefined}
      />

      <div className="max-w-lg mx-auto px-4 py-4">
        {shoppingListItems.length === 0 ? (
          <EmptyState
            icon="✅"
            title="Lista vazia"
            description="Nenhum item para comprar. Quando algo acabar ou estiver acabando, vai aparecer aqui."
            action={
              <button
                onClick={() => { setInitialStatus("comprar"); setAddItemModalOpen(true); }}
                className="bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
              >
                Adicionar à lista
              </button>
            }
          />
        ) : (
          <>
            {/* Botão WhatsApp destacado */}
            <button
              onClick={shareOnWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1fba59] active:scale-[0.98] text-white font-bold py-4 rounded-2xl shadow-md shadow-green-200 transition-all mb-5 text-base"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Compartilhar lista no WhatsApp
            </button>

            <div className="space-y-5">
              {Object.entries(byCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, catItems]) => (
                <div key={category}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                    {catItems[0].category?.icon} {category}
                  </p>
                  <div className="space-y-2">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3.5 transition-all",
                          checkedIds.has(item.id) && "opacity-60 bg-green-50 border-green-100"
                        )}
                      >
                        <button
                          onClick={() => toggleCheck(item.id)}
                          className="shrink-0 text-gray-300 hover:text-green-600 transition-colors"
                        >
                          {checkedIds.has(item.id) ? (
                            <CheckSquare size={22} className="text-green-600" />
                          ) : (
                            <Square size={22} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-medium text-gray-900", checkedIds.has(item.id) && "line-through text-gray-500")}>
                            {item.name}
                          </p>
                          {(item.note || item.quantity_text) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.quantity_text}
                              {item.quantity_text && item.note && " · "}
                              {item.note}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleItemPurchased(item.id)}
                          className="shrink-0 text-xs bg-green-100 text-green-700 font-medium px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors"
                        >
                          Comprado
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {checkedIds.size > 0 && (
              <div className="fixed bottom-20 left-0 right-0 px-4">
                <div className="max-w-lg mx-auto">
                  <button
                    onClick={finishShopping}
                    disabled={finishing}
                    className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-60 text-base"
                  >
                    {finishing
                      ? "Finalizando..."
                      : `✓ Finalizar compra (${checkedIds.size} ${checkedIds.size === 1 ? "item" : "itens"})`}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: item comprado */}
      {showPurchasedModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Item comprado! ✅</h3>
            <p className="text-gray-600 mb-5">{copy.question}</p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmPurchased(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold"
              >
                Não agora
              </button>
              <button
                onClick={() => confirmPurchased(true)}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
              >
                {copy.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
