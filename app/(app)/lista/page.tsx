"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { useItems } from "@/hooks/useItems";
import { useSubscription } from "@/hooks/useSubscription";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlanLimitModal } from "@/components/shared/PlanLimitModal";
import { Item, SHOPPING_LIST_STATUSES } from "@/types";
import { buildShoppingListText, buildWhatsAppShareUrl } from "@/lib/utils";
import { CheckSquare, Square, ClipboardList } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { Confetti } from "@/components/shared/Confetti";
import { Mascote } from "@/components/shared/Mascote";
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
  const router = useRouter();
  const { currentHouse, setAddItemModalOpen, setInitialStatus } = useAppStore();
  const propertyType = (currentHouse as any)?.property_type ?? "casa";
  const copy = LOCATION_COPY[propertyType] ?? LOCATION_COPY.casa;
  const { shoppingListItems, changeStatus, markPurchased, deleteItem, items } = useItems();
  const supabase = createClient();
  const { setItems } = useAppStore();
  const setToast = useAppStore((s) => s.setToast);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(false);
  const [showPurchasedModal, setShowPurchasedModal] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showPlanLimit, setShowPlanLimit] = useState(false);
  const [partialMsg, setPartialMsg] = useState<string | null>(null);
  const { canAddItem, isPaid } = useSubscription();

  // Toast de "compra parcial" some sozinho
  useEffect(() => {
    if (!partialMsg) return;
    const t = setTimeout(() => setPartialMsg(null), 2800);
    return () => clearTimeout(t);
  }, [partialMsg]);

  // Agrupar por categoria (memoizado: só recalcula quando a lista muda)
  const byCategory = useMemo(
    () =>
      shoppingListItems.reduce<Record<string, Item[]>>((acc, item) => {
        const cat = item.category?.name ?? "Outros";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {}),
    [shoppingListItems]
  );

  // Desejos = itens com status "desejo" (lista de sonhos), à parte do mercado.
  const wishItems = useMemo(() => items.filter((i) => i.status === "desejo"), [items]);

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
    if (!showPurchasedModal || purchasing) return; // guarda contra double-submit
    // Era o último item da lista? Então a compra "zerou" → momento de celebrar.
    const wasLast =
      shoppingListItems.length === 1 && shoppingListItems[0].id === showPurchasedModal;
    setPurchasing(true);
    try {
      if (putAsHas) {
        const ok = await markPurchased(showPurchasedModal);
        if (!ok) {
          // Rede falhou — markPurchased já reverteu e avisou. Fecha sem comemorar.
          setShowPurchasedModal(null);
          return;
        }
      }
      setShowPurchasedModal(null);
      if (putAsHas && wasLast) {
        hapticSuccess();
        setDone(true);
      }
    } finally {
      setPurchasing(false);
    }
  }

  // "Realizei!" um desejo → conclui (sai da lista de desejos) com comemoração.
  async function realizarDesejo(itemId: string) {
    const item = wishItems.find((i) => i.id === itemId);
    await deleteItem(itemId);
    hapticSuccess();
    setToast(item ? `🎉 "${item.name}" realizado! Parabéns 💜` : "🎉 Desejo realizado! 💜");
  }

  async function finishShopping() {
    if (checkedIds.size === 0) return;
    setFinishing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !currentHouse) return;

      const ids = Array.from(checkedIds);
      const nowISO = new Date().toISOString();

      // 1) CRÍTICO: marca os itens como "tem" no banco. Se a REDE cair aqui, o
      //    Promise.all rejeita → cai no catch (avisa, não estoura como antes).
      await Promise.all(
        ids.map((id) =>
          supabase
            .from("items")
            .update({ status: "tem", updated_by: user.id, last_purchased_at: nowISO })
            .eq("id", id)
        )
      );

      // 2) UI: atualiza o store (o passo crítico passou).
      const updatedItems = items.map((item) =>
        checkedIds.has(item.id)
          ? { ...item, status: "tem" as const, last_purchased_at: nowISO }
          : item
      );
      setItems(updatedItems);

      // 3) SECUNDÁRIOS (sessão de compra + eventos) — NÃO-críticos: try/catch
      //    silencioso pra uma falha de rede aqui NÃO reverter a compra nem estourar.
      try {
        await supabase.from("shopping_sessions").insert({
          house_id: currentHouse.id,
          user_id: user.id,
          status: "finished",
          items_count: ids.length,
          finished_at: nowISO,
        });
        for (const id of ids) {
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
      } catch (e) {
        console.warn("[finishShopping] secundário falhou (ignorado):", e);
      }

      // Só comemora com confete se a lista ZEROU (tudo comprado).
      // Compra parcial = toast sutil, sem festa (ainda há itens pendentes).
      // Conta o que SOBRA a partir do estado JÁ atualizado (updatedItems), não do
      // closure antigo (shoppingListItems) — à prova de corrida quando outro
      // membro mexe na lista ao mesmo tempo.
      const boughtCount = ids.length;
      const remaining = updatedItems.filter((i) =>
        SHOPPING_LIST_STATUSES.includes(i.status as any)
      ).length;
      const willBeEmpty = remaining === 0;
      setCheckedIds(new Set());
      hapticSuccess();

      if (willBeEmpty) {
        setDone(true);
      } else {
        setPartialMsg(
          `✓ ${boughtCount} ${boughtCount === 1 ? "item comprado" : "itens comprados"} · faltam ${remaining} na lista`
        );
      }
    } catch (e) {
      // Rede caiu no passo crítico → avisa e mantém os itens na lista (sem estourar).
      setToast("Sem conexão — não consegui finalizar. Tente de novo. 📶");
      console.warn("[finishShopping] falhou:", e);
    } finally {
      setFinishing(false);
    }
  }

  function shareOnWhatsApp() {
    // Compartilhar a lista pelo WhatsApp é recurso do Plano Família.
    // Usuário grátis vê o botão, mas é direcionado para assinar.
    if (!isPaid) {
      router.push("/planos?recurso=whatsapp");
      return;
    }
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
        <Mascote mood="comemorando" size={168} className="mb-4 drop-shadow-lg" />
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
        icon={<ClipboardList size={20} />}
        title="Lista de Compras"
        subtitle={`${shoppingListItems.length} ${shoppingListItems.length === 1 ? "item" : "itens"}`}
        right={undefined}
      />

      <div className="max-w-lg mx-auto px-4 py-4">
        {shoppingListItems.length === 0 && wishItems.length === 0 ? (
          <EmptyState
            image="/lista-vazia.png"
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
            {shoppingListItems.length > 0 ? (
              <>
                {/* Botão WhatsApp — recurso do Plano Família */}
                <button
                  onClick={shareOnWhatsApp}
                  className={cn(
                    "w-full flex items-center justify-center gap-2.5 active:scale-[0.98] text-white font-bold py-4 rounded-2xl shadow-md transition-all mb-5 text-base",
                    isPaid
                      ? "bg-[#25D366] hover:bg-[#1fba59] shadow-green-200"
                      : "bg-[#25D366]/80 shadow-green-100"
                  )}
                >
                  <WhatsAppIcon size={22} />
                  Compartilhar lista no WhatsApp
                  {!isPaid && (
                    <span className="inline-flex items-center gap-1 bg-white/25 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                      🔒 Família
                    </span>
                  )}
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
                              <p className={cn("font-medium text-gray-900 break-words", checkedIds.has(item.id) && "line-through text-gray-500")}>
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
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Nenhum item pra comprar agora. 🎉</p>
              </div>
            )}

            {/* Seção "Meus desejos" — lista de sonhos, SEPARADA do mercado da semana */}
            {wishItems.length > 0 && (
              <div className={cn(shoppingListItems.length > 0 ? "mt-8 pt-6 border-t border-gray-100" : "mt-2")}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-base">💭</span>
                  <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide">Meus desejos</p>
                </div>
                <div className="space-y-2">
                  {wishItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-white rounded-xl border border-purple-100 shadow-sm px-4 py-3.5"
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                        <span className="text-base">💜</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 break-words">{item.name}</p>
                        {(item.note || item.quantity_text) && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.quantity_text}
                            {item.quantity_text && item.note && " · "}
                            {item.note}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => realizarDesejo(item.id)}
                        className="shrink-0 text-xs bg-purple-100 text-purple-700 font-semibold px-3 py-1.5 rounded-full hover:bg-purple-200 active:scale-90 transition-all"
                      >
                        Realizei!
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {checkedIds.size > 0 && (
              <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 px-4">
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
                disabled={purchasing}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold disabled:opacity-60"
              >
                Não agora
              </button>
              <button
                onClick={() => confirmPurchased(true)}
                disabled={purchasing}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
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
