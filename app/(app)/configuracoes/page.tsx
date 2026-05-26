"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { Header } from "@/components/layout/Header";
import { ItemEvent, ItemStatus, RECURRENCE_LABELS, RecurrenceType } from "@/types";
import { useItems } from "@/hooks/useItems";
import { useSubscription } from "@/hooks/useSubscription";
import { formatRelativeTime, getNextReminderDate } from "@/lib/utils";
import { Bell, BellRing, Trash2, Shield, FileText, ChevronRight, MessageSquareHeart, Clock, Smartphone, Plus, Pencil, X, Check as CheckIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentHouse, items, categories, reset, updateItem } = useAppStore();
  const { isPaid } = useSubscription();
  const { renameItem, deleteItem, createItem } = useItems();
  const [activeTab, setActiveTab] = useState<"geral" | "historico" | "lembretes" | "notificacoes">("geral");
  const [history, setHistory] = useState<(ItemEvent & { profile?: any; item?: any })[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(currentHouse?.reminder_enabled ?? false);
  const [reminderTime, setReminderTime] = useState(currentHouse?.reminder_time ?? "18:00");
  const [savingReminder, setSavingReminder] = useState(false);
  const push = usePushNotifications();

  // Lembretes: estados de edição
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  async function loadHistory() {
    if (historyLoaded || !currentHouse) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from("item_events")
      .select("*, profile:profiles(full_name), item:items(name)")
      .eq("house_id", currentHouse.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setHistory(data as any);
    setHistoryLoaded(true);
    setLoadingHistory(false);
  }

  async function toggleRecurring(itemId: string, enabled: boolean, recurrenceType?: RecurrenceType) {
    const updates: any = { is_recurring: enabled };
    if (enabled && recurrenceType) {
      updates.recurrence_type = recurrenceType;
      updates.next_reminder_at = getNextReminderDate(recurrenceType).toISOString();
    }

    await supabase.from("items").update(updates).eq("id", itemId);
    updateItem(itemId, updates);
  }

  async function saveReminderSettings(enabled: boolean, time: string) {
    if (!currentHouse) return;
    setSavingReminder(true);
    setReminderEnabled(enabled);
    setReminderTime(time);
    await supabase
      .from("houses")
      .update({ reminder_enabled: enabled, reminder_time: time })
      .eq("id", currentHouse.id);
    setSavingReminder(false);
  }

  // Lembretes: funções de edição
  async function handleRenameItem(itemId: string) {
    const trimmed = editingName.trim();
    if (!trimmed) { setEditingItemId(null); return; }
    try {
      await renameItem(itemId, trimmed);
    } catch { /* reverted by hook */ }
    setEditingItemId(null);
    setEditingName("");
  }

  async function handleDeleteItemFromReminders(itemId: string) {
    try {
      await deleteItem(itemId);
    } catch (err) {
      console.error("Erro ao excluir item:", err);
    }
    setDeletingItemId(null);
  }

  async function handleAddReminderItem() {
    const trimmed = newItemName.trim();
    if (!trimmed || !currentHouse) return;
    setAddingItem(true);
    try {
      // Usa a primeira categoria disponível (Alimentos por padrão)
      const defaultCat = categories.find(c => c.name === "Alimentos") ?? categories[0];
      if (!defaultCat) return;
      await createItem({
        name: trimmed,
        category_id: defaultCat.id,
        status: "tem" as ItemStatus,
      });
      setNewItemName("");
      setShowAddItem(false);
    } catch (err) {
      console.error("Erro ao adicionar item:", err);
    }
    setAddingItem(false);
  }

  async function handleDeleteAccount() {
    if (!confirm("Tem certeza? Isso vai excluir sua conta permanentemente.")) return;
    await supabase.auth.signOut();
    reset();
    router.push("/");
    router.refresh();
  }

  function eventLabel(event: any): string {
    const name = event.profile?.full_name?.split(" ")[0] ?? "Alguém";
    const item = event.item?.name ?? "item";
    switch (event.event_type) {
      case "status_changed":
        if (event.new_status === "acabou") return `${name} marcou ${item} como "Acabou"`;
        if (event.new_status === "acabando") return `${name} marcou ${item} como "Está acabando"`;
        if (event.new_status === "tem") return `${name} marcou ${item} como "Tem em casa"`;
        if (event.new_status === "comprar") return `${name} adicionou ${item} à lista`;
        return `${name} atualizou ${item}`;
      case "purchased":
        return `${name} comprou ${item}`;
      case "created":
        return `${name} adicionou ${item}`;
      default:
        return `${name} atualizou ${item}`;
    }
  }

  return (
    <div>
      <Header title="Configurações" showBack />

      {/* Abas */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto flex">
          {[
            { key: "geral", label: "Geral" },
            { key: "notificacoes", label: "Notificações" },
            { key: "historico", label: "Histórico" },
            { key: "lembretes", label: "Lembretes" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key as any);
                if (key === "historico") loadHistory();
              }}
              className={cn(
                "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === key
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Aba: Geral */}
        {activeTab === "geral" && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Link href="/planos" className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50">
                <p className="font-medium text-gray-900 text-sm">Ver planos</p>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              <Link href="/feedback" className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <MessageSquareHeart size={16} className="text-green-500" />
                  <p className="font-medium text-gray-900 text-sm">Enviar feedback</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              <Link href="/privacidade" className="flex items-center justify-between px-5 py-4 border-b border-gray-50 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gray-500" />
                  <p className="font-medium text-gray-900 text-sm">Política de Privacidade</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
              <Link href="/termos" className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" />
                  <p className="font-medium text-gray-900 text-sm">Termos de Uso</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            </div>

            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors font-medium text-sm"
            >
              <Trash2 size={16} />
              Excluir minha conta
            </button>
            <p className="text-xs text-gray-400 text-center">
              Ao excluir sua conta, todos os seus dados serão removidos permanentemente.
            </p>
          </div>
        )}

        {/* Aba: Notificações (push + lembrete diário) */}
        {activeTab === "notificacoes" && (
          <div className="space-y-4">
            {/* Push Notifications - GRÁTIS */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <Smartphone size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Notificações no celular</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Receba um alerta quando alguém da família marcar um item como acabou
                  </p>
                </div>
              </div>

              {push.isDenied ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs text-red-700">
                    Notificações foram bloqueadas no navegador. Vá nas configurações do navegador para permitir.
                  </p>
                </div>
              ) : !push.isSupported ? (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-500">
                    Seu navegador não suporta notificações push. Tente no Chrome ou Edge.
                  </p>
                </div>
              ) : push.isSubscribed ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-green-700 font-medium">Ativado</span>
                  </div>
                  <button
                    onClick={push.unsubscribe}
                    className="text-xs text-gray-500 underline hover:text-gray-700"
                  >
                    Desativar
                  </button>
                </div>
              ) : (
                <button
                  onClick={push.subscribe}
                  className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                >
                  Ativar notificações
                </button>
              )}

              {push.error && (
                <p className="text-xs text-red-500 mt-2">{push.error}</p>
              )}
            </div>

            {/* Lembrete diário - PAGO */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">Lembrete diário</h3>
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">PREMIUM</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Receba um lembrete no horário que escolher para ir às compras
                  </p>
                </div>
              </div>

              {!isPaid ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs text-amber-800">
                    Disponível no <strong>Plano Família</strong>.{" "}
                    <Link href="/planos" className="underline font-semibold">Assinar</Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Ativar lembrete</span>
                    <button
                      onClick={() => saveReminderSettings(!reminderEnabled, reminderTime)}
                      disabled={savingReminder}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50",
                        reminderEnabled ? "bg-green-600" : "bg-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          reminderEnabled ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {reminderEnabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Horário</span>
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => saveReminderSettings(true, e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700"
                      />
                    </div>
                  )}

                  {reminderEnabled && !push.isSubscribed && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-xs text-amber-800">
                        ⚠️ Ative as notificações push acima para receber o lembrete no celular.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba: Histórico */}
        {activeTab === "historico" && (
          <div>
            {!isPaid && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
                <p className="text-sm text-amber-800">
                  O histórico completo está disponível no <strong>Plano Família</strong>.{" "}
                  <Link href="/planos" className="underline font-semibold">Ver planos</Link>
                </p>
              </div>
            )}

            {loadingHistory ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-200 border-t-green-600" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Nenhuma atividade registrada.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {history.map((event) => (
                  <div key={event.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-700">{eventLabel(event)}</p>
                    <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(event.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba: Lembretes */}
        {activeTab === "lembretes" && (
          <div>
            {!isPaid && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
                <p className="text-sm text-amber-800">
                  Lembretes recorrentes são do <strong>Plano Família</strong>.{" "}
                  <Link href="/planos" className="underline font-semibold">Assinar</Link>
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                Marque itens como recorrentes para receber lembretes automáticos.
              </p>
              {isPaid && (
                <button
                  onClick={() => setShowAddItem(!showAddItem)}
                  className="shrink-0 ml-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            {/* Formulário inline para adicionar novo item */}
            {showAddItem && isPaid && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold text-green-800 mb-2">Adicionar novo item</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddReminderItem()}
                    placeholder="Ex: Café especial, Ração do Rex..."
                    className="flex-1 bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoFocus
                  />
                  <button
                    onClick={handleAddReminderItem}
                    disabled={addingItem || !newItemName.trim()}
                    className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {addingItem ? "..." : "Adicionar"}
                  </button>
                  <button
                    onClick={() => { setShowAddItem(false); setNewItemName(""); }}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Agrupado por categoria */}
            {(() => {
              const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
                const catName = item.category?.name ?? "Outros";
                const catIcon = item.category?.icon ?? "📦";
                const key = `${catIcon} ${catName}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
              }, {});

              return Object.entries(grouped).map(([catLabel, catItems]) => (
                <div key={catLabel} className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                    {catLabel}
                  </p>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                    {catItems.map((item) => (
                      <div key={item.id} className="px-4 py-3">
                        {/* Confirmação de exclusão */}
                        {deletingItemId === item.id ? (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-red-600">Excluir <strong>{item.name}</strong>?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteItemFromReminders(item.id)}
                                className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-600"
                              >
                                Sim, excluir
                              </button>
                              <button
                                onClick={() => setDeletingItemId(null)}
                                className="text-xs text-gray-500 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              {/* Nome — editável */}
                              {editingItemId === item.id ? (
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleRenameItem(item.id);
                                      if (e.key === "Escape") { setEditingItemId(null); setEditingName(""); }
                                    }}
                                    className="flex-1 min-w-0 bg-gray-50 border border-green-300 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleRenameItem(item.id)}
                                    className="text-green-600 hover:text-green-700 p-1"
                                  >
                                    <CheckIcon size={16} />
                                  </button>
                                  <button
                                    onClick={() => { setEditingItemId(null); setEditingName(""); }}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                                  {isPaid && (
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button
                                        onClick={() => { setEditingItemId(item.id); setEditingName(item.name); }}
                                        className="text-gray-300 hover:text-green-600 p-1 transition-colors"
                                        title="Renomear"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        onClick={() => setDeletingItemId(item.id)}
                                        className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                                        title="Excluir"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Toggle recorrente */}
                              <button
                                onClick={() => toggleRecurring(item.id, !item.is_recurring, item.recurrence_type as RecurrenceType)}
                                disabled={!isPaid}
                                className={cn(
                                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 shrink-0",
                                  item.is_recurring ? "bg-green-600" : "bg-gray-200"
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                    item.is_recurring ? "translate-x-6" : "translate-x-1"
                                  )}
                                />
                              </button>
                            </div>

                            {/* Seletor de frequência */}
                            {item.is_recurring && (
                              <select
                                value={item.recurrence_type ?? "monthly"}
                                onChange={(e) =>
                                  toggleRecurring(item.id, true, e.target.value as RecurrenceType)
                                }
                                disabled={!isPaid}
                                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 mt-2"
                              >
                                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}

            {items.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <BellRing size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum item na despensa ainda.</p>
                <p className="text-xs mt-1">Adicione itens pela Despensa ou pelo botão + acima.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
