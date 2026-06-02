"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { useItems } from "@/hooks/useItems";
import { useSubscription } from "@/hooks/useSubscription";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlanLimitModal } from "@/components/shared/PlanLimitModal";
import { Item } from "@/types";
import { buildShoppingListText, buildWhatsAppShareUrl } from "@/lib/utils";
import { Check, CheckSquare, Square } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { Confetti } from "@/components/shared/Confetti";
import { hapticSuccess } from "@/lib/haptics";
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
  const { shoppingListItems, changeStatus, markPurchased, items } = useItems();
  const supabase = createClient();
  const { setItems } = useAppStore();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(false);
  const [showPurchasedModal, setShowPurchasedModal] = useState<string | null>(null);
  const [showPlanLimit, setShowPlanLimit] = useState(false);
  const [partialMsg, setPartialMsg] = useState<string | null>(null);
  const { canAddItem } = useSubscription();

  // Toast de "compra parcial" some sozinho
  useEffect(() => {
    if (!partialMsg) return;
    const t = setTimeout(() => setPartialMsg(null), 2800);
    return () => clearTimeout(t);
  }, [partialMsg]);

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
    // Era o último item da lista? Então a compra "zerou" → momento de celebrar.
    const wasLast =
      shoppingListItems.length === 1 && shoppingListItems[0].id === showPurchasedModal;
    if (putAsHas) {
      await markPurchased(showPurchasedModal);
    }
    setShowPurchasedModal(null);
    if (putAsHas && wasLast) {
      hapticSuccess();
      setDone(true);
    }
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

      // Atualiza items no store sem recarregar a página
      const updatedItems = items.map((item) =>
        checkedIds.has(item.id)
          ? { ...item, status: "tem" as const, last_purchased_at: new Date().toISOString() }
          : item
      );
      setItems(updatedItems);

      // Só comemora com confete se a lista ZEROU (tudo comprado).
      // Compra parcial = toast sutil, sem festa (ainda há itens pendentes).
      const boughtCount = checkedIds.size;
      const willBeEmpty = boughtCount >= shoppingListItems.length;
      setCheckedIds(new Set());
      hapticSuccess();

      if (willBeEmpty) {
        setDone(true);
      } else {
        const remaining = shoppingListItems.length - boughtCount;
        setPartialMsg(
          `✓ ${boughtCount} ${boughtCount === 1 ? "item comprado" : "itens comprados"} · faltam ${remaining} na lista`
        );
      }
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center app-bg">
        <Confetti />
        <div className="w-24 h-24 rounded-full bg-green-600 flex items-center justify-center mb-6 shadow-xl shadow-green-300/40 animate-success-pop">
          <Check size={52} className="text-white" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Compra finalizada! 🎉</h2>
        <p className="text-gray-500 max-w-xs leading-relaxed">{copy.done}</p>
        <p className="text-sm text-gray-400 mt-2">Todos os itens foram atualizados.</p>
        <button
          onClick={() => setDone(false)}
          className="mt-8 bg-green-600 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-200"
        >
          Voltar para a despensa
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
            mascot="done"
            title="Tudo em dia! 🎉"
            description="Nenhum item para comprar agora. Quando algo acabar, é só marcar e aparece aqui automaticamente."
            action={
              <button
                onClick={() => { if (!canAddItem) { setShowPlanLimit(true); return; } setInitialStatus("comprar"); setAddItemModalOpen(true); }}
                className="bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
              >
                Adicionar item à lista
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
              <WhatsAppIcon size={22} />
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
                          className="shrink-0 text-xs bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-full hover:bg-green-200 active:scale-90 transition-all"
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

      {/* Toast de compra parcial — sutil, some sozinho */}
      {partialMsg && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-[55] pointer-events-none">
          <div className="max-w-lg mx-auto">
            <div className="animate-toast-up bg-gray-900 text-white text-sm font-semibold px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2">
              {partialMsg}
            </div>
          </div>
        </div>
      )}

      <PlanLimitModal
        isOpen={showPlanLimit}
        onClose={() => setShowPlanLimit(false)}
        reason="items"
      />
    </div>
  );
}
