"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { ItemEvent, SHOPPING_LIST_STATUSES, House } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { ShoppingCart, Bell, ChevronDown, Plus, Check, Zap, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { PlanLimitModal } from "@/components/shared/PlanLimitModal";
import { useSubscription } from "@/hooks/useSubscription";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

const SELECTED_HOUSE_KEY = "acabou_selected_house";

const PROPERTY_MAP: Record<string, { icon: string; label: string }> = {
  casa:        { icon: "🏠", label: "Casa" },
  apartamento: { icon: "🏢", label: "Apê" },
  praia:       { icon: "🏖️", label: "Praia" },
  veraneio:    { icon: "🌲", label: "Veraneio" },
  empresa:     { icon: "💼", label: "Empresa" },
  outro:       { icon: "📍", label: "Outro" },
};

// Ícones SVG inline para os botões de ação
function IconAcabou() {
  // Caixinha aberta/vazia com X vermelho no canto
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill="#fee2e2"/>
      {/* Corpo da caixa (frente) */}
      <rect x="7" y="16" width="18" height="11" rx="1.5" fill="#fecaca" fillOpacity="0.5" stroke="#ef4444" strokeWidth="1.8"/>
      {/* Abas abertas da caixa */}
      <path d="M7 16L9.5 11H16" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M25 16L22.5 11H16" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Linha central do topo (vinco da caixa) */}
      <line x1="16" y1="11" x2="16" y2="16" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Badge X vermelho no canto superior direito */}
      <circle cx="25" cy="8" r="5.5" fill="#ef4444"/>
      <path d="M22.8 5.8L27.2 10.2M27.2 5.8L22.8 10.2" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconAcabando() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill="#fef3c7"/>
      <circle cx="16" cy="17" r="7" stroke="#f59e0b" strokeWidth="2"/>
      <path d="M16 13v4l2.5 2.5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 8l2 2M22 8l-2 2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconQueroComprar() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill="#dbeafe"/>
      <path d="M8 9h2l2.5 9h9l2-6H11" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14" cy="21.5" r="1.5" fill="#3b82f6"/>
      <circle cx="20" cy="21.5" r="1.5" fill="#3b82f6"/>
      <line x1="20" y1="6" x2="20" y2="12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
      <line x1="17" y1="9" x2="23" y2="9" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function IconComprar() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill="#dcfce7"/>
      <circle cx="16" cy="16" r="8" stroke="#22c55e" strokeWidth="2"/>
      <path d="M12 16l3 3 5-6" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Constante fora do componente — evita re-criação a cada render
const ACTION_BUTTONS = [
  { label: "Acabou!", sublabel: "Precisa repor", icon: <IconAcabou />, bg: "bg-red-50 border-red-100", status: "acabou" },
  { label: "Está acabando!", sublabel: "Já está no fim", icon: <IconAcabando />, bg: "bg-amber-50 border-amber-100", status: "acabando" },
  { label: "Quero comprar!", sublabel: "Adicionar à lista", icon: <IconQueroComprar />, bg: "bg-blue-50 border-blue-100", status: "comprar" },
  { label: "Comprei!", sublabel: "Já comprou o item", icon: <IconComprar />, bg: "bg-green-50 border-green-100", status: "tem" },
];

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const { items, currentHouse, allHouses, setCurrentHouse, setAllHouses, setMembers, setItems, setAddItemModalOpen, setInitialStatus, dataSyncComplete } = useAppStore();

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [recentEvents, setRecentEvents] = useState<(ItemEvent & { profile?: any; item?: any })[]>([]);
  const [reminders, setReminders] = useState<{ id: string; name: string }[]>([]);
  const [showHousePicker, setShowHousePicker] = useState(false);
  const [switchingHouse, setSwitchingHouse] = useState(false);
  const [showPlanLimit, setShowPlanLimit] = useState(false);
  const [confirmDeleteHouseId, setConfirmDeleteHouseId] = useState<string | null>(null);
  const [deletingHouse, setDeletingHouse] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { canAddItem, isTrialing, trialDaysLeft, trialExpired, isFrozen } = useSubscription();
  const { canManageItems, isOwner: isRoleOwner } = useRole();

  const shoppingItems = items.filter((i) => SHOPPING_LIST_STATUSES.includes(i.status as any));
  const shoppingCount = shoppingItems.length;
  const endingCount = items.filter((i) => i.status === "acabando").length;

  const propertyInfo = PROPERTY_MAP[(currentHouse as any)?.property_type ?? "casa"] ?? PROPERTY_MAP.casa;

  // Fecha picker ao clicar fora
  useEffect(() => {
    if (!showHousePicker) return;
    function close(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowHousePicker(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showHousePicker]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!currentHouse) return;
    loadEvents();
    loadReminders();
  }, [currentHouse]);

  async function loadEvents() {
    const { data } = await supabase
      .from("item_events")
      .select("*, profile:profiles(full_name), item:items(name)")
      .eq("house_id", currentHouse!.id)
      .order("created_at", { ascending: false })
      .limit(8);
    if (data) setRecentEvents(data as any);
  }

  async function loadReminders() {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("items")
      .select("id, name")
      .eq("house_id", currentHouse!.id)
      .eq("is_recurring", true)
      .lte("next_reminder_at", now)
      .neq("status", "acabou")
      .neq("status", "comprar");
    if (data) setReminders(data);
  }

  async function switchHouse(house: House) {
    if (house.id === currentHouse?.id) { setShowHousePicker(false); return; }
    setSwitchingHouse(true);
    setShowHousePicker(false);

    // Recarrega dados da casa selecionada
    setCurrentHouse(house);
    localStorage.setItem(SELECTED_HOUSE_KEY, house.id);

    const { data: membersData } = await supabase
      .from("house_members").select("*, profile:profiles(*)")
      .eq("house_id", house.id).eq("status", "active");
    if (membersData) setMembers(membersData as any);

    const { data: itemsData } = await supabase
      .from("items").select("*, category:categories(*)")
      .eq("house_id", house.id).order("name");
    if (itemsData) setItems(itemsData as any);

    setSwitchingHouse(false);
  }

  async function handleDeleteHouse(houseId: string) {
    if (allHouses.length <= 1) return;
    setDeletingHouse(true);
    try {
      await supabase.from("item_events").delete().eq("house_id", houseId);
      await supabase.from("items").delete().eq("house_id", houseId);
      await supabase.from("invite_tokens").delete().eq("house_id", houseId);
      await supabase.from("house_members").delete().eq("house_id", houseId);
      await supabase.from("subscriptions").delete().eq("house_id", houseId);
      await supabase.from("houses").delete().eq("id", houseId);

      const remaining = allHouses.filter(h => h.id !== houseId);
      setAllHouses(remaining);

      // Se excluiu a casa ativa, troca para outra
      if (currentHouse?.id === houseId && remaining.length > 0) {
        await switchHouse(remaining[0]);
      }
    } catch (err) {
      console.error("Erro ao excluir local:", err);
      alert("Erro ao excluir local. Tente novamente.");
    } finally {
      setDeletingHouse(false);
      setConfirmDeleteHouseId(null);
      setShowHousePicker(false);
    }
  }

  function openModal(status: string) {
    // "Comprei!" → vai direto para a lista de compras (para marcar itens como comprados)
    if (status === "tem") {
      router.push("/lista");
      return;
    }

    // "Quero comprar!" → abre modal de buscar/adicionar item para TODOS os usuários
    // (membros podem buscar itens existentes e mudar status para "comprar")
    if (status === "comprar") {
      setInitialStatus(status);
      setAddItemModalOpen(true);
      return;
    }

    // "Acabou!" e "Está acabando!" → navega para despensa filtrada pelo status
    // Assim o usuário vê os itens relevantes e pode gerenciá-los
    router.push(`/despensa?filtro=${status}`);
  }

  function eventLabel(event: any): string {
    const name = event.profile?.full_name?.split(" ")[0] ?? "Alguém";
    const item = event.item?.name ?? "item";
    switch (event.event_type) {
      case "status_changed":
        if (event.new_status === "acabou") return `${name} marcou ${item} como "Acabou"`;
        if (event.new_status === "acabando") return `${name} marcou ${item} como "Acabando"`;
        if (event.new_status === "tem") return `${name} repôs ${item}`;
        if (event.new_status === "comprar") return `${name} adicionou ${item} à lista`;
        return `${name} atualizou ${item}`;
      case "purchased": return `${name} comprou ${item}`;
      case "created": return `${name} adicionou ${item}`;
      default: return `${name} atualizou ${item}`;
    }
  }

  return (
    <div>
      {/* Header com ícone do imóvel + seletor de casas */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0" ref={pickerRef}>
            <button
              onClick={() => allHouses.length > 1 && setShowHousePicker(!showHousePicker)}
              className={cn(
                "flex items-center gap-3 min-w-0",
                allHouses.length > 1 && "cursor-pointer"
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <span className="text-xl leading-none">{propertyInfo.icon}</span>
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-gray-900 truncate text-[15px] leading-snug max-w-[45vw] sm:max-w-[240px]">
                    {currentHouse?.name ?? "Minha Casa"}
                  </h1>
                  {allHouses.length > 1 && (
                    <ChevronDown size={14} className={cn("text-gray-400 shrink-0 transition-transform", showHousePicker && "rotate-180")} />
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-snug mt-0.5 truncate">{propertyInfo.label} · O que mudou hoje?</p>
              </div>
            </button>

            {/* Dropdown de casas */}
            {showHousePicker && (
              <div className="absolute top-full left-0 mt-2 w-[min(90vw,320px)] bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden">
                <p className="px-4 pt-3.5 pb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seus locais</p>
                <div className="max-h-[280px] overflow-y-auto">
                  {allHouses.map((house) => {
                    const pt = PROPERTY_MAP[(house as any).property_type ?? "casa"] ?? PROPERTY_MAP.casa;
                    const isActive = house.id === currentHouse?.id;
                    const isConfirmingDelete = confirmDeleteHouseId === house.id;

                    return (
                      <div key={house.id} className="relative">
                        {isConfirmingDelete ? (
                          /* Confirmação de exclusão inline */
                          <div className="px-4 py-3 bg-red-50 border-y border-red-100">
                            <p className="text-sm text-red-700 font-medium mb-2.5">
                              Excluir <strong>{house.name}</strong> e todos os itens?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteHouse(house.id)}
                                disabled={deletingHouse}
                                className="flex-1 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                              >
                                {deletingHouse ? "Excluindo..." : "Sim, excluir"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteHouseId(null)}
                                className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                            <button
                              onClick={() => switchHouse(house)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                isActive ? "bg-green-50 ring-2 ring-green-200" : "bg-gray-50"
                              )}>
                                <span className="text-lg leading-none">{pt.icon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm truncate leading-snug",
                                  isActive ? "font-bold text-green-700" : "font-medium text-gray-900"
                                )}>{house.name}</p>
                                <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{pt.label}</p>
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              {isActive && (
                                <Check size={16} className="text-green-600" />
                              )}
                              {/* Botão excluir — só dono, e se tem mais de 1 casa */}
                              {isRoleOwner && allHouses.length > 1 && !isActive && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteHouseId(house.id); }}
                                  className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                                  title="Excluir local"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isRoleOwner && (
                  <div className="border-t border-gray-100 p-2">
                    <Link
                      href="/casa/nova"
                      onClick={() => setShowHousePicker(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Plus size={15} className="text-green-600" />
                      </div>
                      <span className="text-sm font-bold text-green-700">Adicionar novo local</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <NotificationBell />
            {/* Botão adicionar casa (quando tem só uma) — só para dono */}
            {isRoleOwner && allHouses.length <= 1 && (
              <Link
                href="/casa/nova"
                className="flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
              >
                <Plus size={14} />
                Novo local
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">

        {/* Loading ao trocar de casa */}
        {switchingHouse && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        )}

        {!switchingHouse && (
          <>
            {/* Banners de plano: só renderiza apos dados confirmados com o servidor.
                Isso evita flash de banner com info desatualizada do cache */}
            {dataSyncComplete && (
              <>
            {/* Banner de trial ativo */}
            {isTrialing && (currentHouse as any)?.owner_id === currentUserId && (
              <Link
                href="/planos"
                className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-4 py-3.5 hover:from-blue-100 hover:to-indigo-100 transition-all"
              >
                <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                  <Zap size={18} className="text-white fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-blue-900 text-sm">
                    Teste grátis — {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">Aproveite todos os recursos do Plano Família. Assine para não perder!</p>
                </div>
                <ChevronDown size={16} className="text-blue-500 shrink-0 -rotate-90" />
              </Link>
            )}

            {/* Banner de trial expirado para MEMBROS (dono já vê via isFrozen) */}
            {trialExpired && !isFrozen && (currentHouse as any)?.owner_id !== currentUserId && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 py-3.5">
                <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-lg">⏰</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 text-sm">Teste grátis encerrado</p>
                  <p className="text-xs text-amber-700 mt-0.5">Peça ao dono da casa para assinar o Plano Família.</p>
                </div>
              </div>
            )}

            {/* Banner de plano congelado — DONO vê com botão de assinar */}
            {isFrozen && (currentHouse as any)?.owner_id === currentUserId && (
              <Link
                href="/planos"
                className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl px-4 py-3.5 hover:from-red-100 hover:to-orange-100 transition-all"
              >
                <div className="w-9 h-9 bg-red-400 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-lg">🔒</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-red-900 text-sm">Conta congelada</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    {trialExpired
                      ? "Seu teste grátis acabou. Assine para desbloquear tudo."
                      : "Seu plano expirou. Renove para desbloquear itens, convites e mais."
                    }
                  </p>
                </div>
                <ChevronDown size={16} className="text-red-500 shrink-0 -rotate-90" />
              </Link>
            )}

            {/* Banner de plano congelado — MEMBRO convidado vê aviso diferente */}
            {isFrozen && (currentHouse as any)?.owner_id !== currentUserId && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 py-3.5">
                <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-lg">🔒</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 text-sm">Recursos limitados</p>
                  <p className="text-xs text-amber-700 mt-0.5">O plano desta casa expirou. Peça ao dono para renovar a assinatura e desbloquear todos os recursos.</p>
                </div>
              </div>
            )}

            {/* Banner de upgrade — plano grátis sem trial (só mostra para o dono) */}
            {!isTrialing && !trialExpired && currentHouse?.plan === "free" && currentHouse?.plan_status !== "inactive" && (currentHouse as any)?.owner_id === currentUserId && (
              <Link
                href="/planos"
                className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 py-3.5 hover:from-amber-100 hover:to-orange-100 transition-all"
              >
                <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center shrink-0">
                  <Zap size={18} className="text-white fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 text-sm">Upgrade para o Plano Família</p>
                  <p className="text-xs text-amber-700 mt-0.5">Locais ilimitados · Pessoas ilimitadas · R$ 4,99/mês</p>
                </div>
                <ChevronDown size={16} className="text-amber-500 shrink-0 -rotate-90" />
              </Link>
            )}
              </>
            )}

            {/* Lembretes recorrentes */}
            {reminders.length > 0 && (
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell size={16} className="text-purple-600" />
                  <p className="text-sm font-semibold text-purple-800">Lembrete</p>
                </div>
                {reminders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5">
                    <p className="text-sm text-purple-700">
                      Você costuma comprar <strong>{r.name}</strong>
                    </p>
                    <button
                      onClick={() => openModal("comprar")}
                      className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-full font-medium ml-3 shrink-0"
                    >
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/lista" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-green-200 transition-colors">
                <p className="text-3xl font-bold text-green-600">{shoppingCount}</p>
                <p className="text-sm text-gray-600 mt-1">Para comprar</p>
              </Link>
              <Link href="/despensa?filtro=acabando" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-amber-200 transition-colors">
                <p className="text-3xl font-bold text-amber-500">{endingCount}</p>
                <p className="text-sm text-gray-600 mt-1">Acabando</p>
              </Link>
            </div>

            {/* Botões de ação */}
            <div>
              <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">
                O que aconteceu?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ACTION_BUTTONS.map(({ label, sublabel, icon, bg, status }) => (
                  <button
                    key={status}
                    onClick={() => openModal(status)}
                    className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] text-left ${bg}`}
                  >
                    <div className="mb-3">{icon}</div>
                    <span className="font-bold text-gray-900 text-sm leading-tight">{label}</span>
                    <span className="text-xs text-gray-500 mt-0.5 leading-tight min-h-[32px]">{sublabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ver lista de compras */}
            {shoppingCount > 0 && (
              <Link
                href="/lista"
                className="flex items-center justify-between bg-green-600 text-white rounded-2xl px-5 py-4 hover:bg-green-700 transition-colors"
              >
                <div>
                  <p className="font-semibold">Ver lista de compras</p>
                  <p className="text-green-100 text-sm">
                    {shoppingCount} {shoppingCount === 1 ? "item" : "itens"} para comprar
                  </p>
                </div>
                <ShoppingCart size={24} className="text-green-200" />
              </Link>
            )}

            {/* Atividade recente */}
            {recentEvents.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">
                  Últimas atualizações
                </p>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {recentEvents.slice(0, 6).map((event) => (
                    <div key={event.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-700">{eventLabel(event)}</p>
                      <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(event.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PlanLimitModal
        isOpen={showPlanLimit}
        onClose={() => setShowPlanLimit(false)}
        reason="items"
      />
    </div>
  );
}
