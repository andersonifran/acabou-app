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
import { Bell, Trash2, Shield, FileText, ChevronRight, MessageSquareHeart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentHouse, items, reset, updateItem } = useAppStore();
  const { isPaid } = useSubscription();
  const [activeTab, setActiveTab] = useState<"geral" | "historico" | "lembretes">("geral");
  const [history, setHistory] = useState<(ItemEvent & { profile?: any; item?: any })[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

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

            <p className="text-sm text-gray-500 mb-3">
              Marque itens como recorrentes para receber lembretes automáticos.
            </p>

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    <button
                      onClick={() => toggleRecurring(item.id, !item.is_recurring, item.recurrence_type as RecurrenceType)}
                      disabled={!isPaid}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50",
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

                  {item.is_recurring && (
                    <select
                      value={item.recurrence_type ?? "monthly"}
                      onChange={(e) =>
                        toggleRecurring(item.id, true, e.target.value as RecurrenceType)
                      }
                      disabled={!isPaid}
                      className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700"
                    >
                      {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
