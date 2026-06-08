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
import { CasaEmDiaBadge } from "@/components/shared/CasaEmDiaBadge";
import { LocationIcon } from "@/components/shared/LocationIcon";
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

// Botões de ação — ícones 3D (public/acoes/). A borda colorida do card
// mantém o "semáforo" de status (vermelho/âmbar/azul/verde).
const ACTION_BUTTONS = [
  { label: "Acabou!", sublabel: "Precisa repor", img: "/acoes/acao-acabou.png", bg: "bg-white border-red-200 shadow-sm", status: "acabou" },
  { label: "Está acabando!", sublabel: "Já está no fim", img: "/acoes/acao-acabando.png", bg: "bg-white border-amber-200 shadow-sm", status: "acabando" },
  { label: "Quero comprar!", sublabel: "Adicionar à lista", img: "/acoes/acao-comprar.png", bg: "bg-white border-blue-200 shadow-sm", status: "comprar" },
  { label: "Comprei!", sublabel: "Já comprou o item", img: "/acoes/acao-comprei.png", bg: "bg-white border-green-300 shadow-sm", status: "tem" },
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
  const [planLimitReason, setPlanLimitReason] = useState<"items" | "members" | "houses">("items");
  const [confirmDeleteHouseId, setConfirmDeleteHouseId] = useState<string | null>(null);
  const [deletingHouse, setDeletingHouse] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { canAddItem, isPaid, isTrialing, trialDaysLeft, trialExpired, isFrozen } = useSubscription();

  // "Novo local" só é liberado no plano pago. No grátis/expirado, abre o paywall
  // contextual (modal limpo) em vez de mandar pra página de planos poluída.
  function handleNovoLocal() {
    setShowHousePicker(false);
    if (isPaid) {
      router.push("/casa/nova");
    } else {
      setPlanLimitReason("houses");
      setShowPlanLimit(true);
    }
  }
  const { canManageItems, isOwner: isRoleOwner, loaded: roleLoaded } = useRole();

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
      router.replace("/lista"); // aba → replace (não empilha histórico)
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
    router.replace(`/despensa?filtro=${status}`); // aba → replace (não empilha histórico)
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
              <LocationIcon type={(currentHouse as any)?.property_type ?? "casa"} size={40} className="shrink-0" />
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
                              <LocationIcon
                                type={(house as any).property_type ?? "casa"}
                                size={42}
                                className={cn("shrink-0 transition-transform", isActive && "scale-110")}
                              />
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
                    <button
                      onClick={handleNovoLocal}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Plus size={15} className="text-green-600" />
                      </div>
                      <span className="text-sm font-bold text-green-700">Adicionar novo local</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <NotificationBell />
            {/* Botão adicionar casa (quando tem só uma) — só para dono */}
            {isRoleOwner && allHouses.length <= 1 && (
              <button
                onClick={handleNovoLocal}
                className="flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-green-100 transition-colors"
              >
                <Plus size={14} />
                Novo local
              </button>
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
            {/* Humor da casa — Sacolino reage: em dia (joinha) ou alerta (tem itens) */}
            <CasaEmDiaBadge
              shoppingCount={shoppingCount}
              ready={dataSyncComplete}
              propertyType={(currentHouse as any)?.property_type ?? "casa"}
            />

            {/* Banners de plano: só renderiza apos dados confirmados com o servidor.
                Isso evita flash de banner com info desatualizada do cache */}
            {dataSyncComplete && (
              <>
            {/* Banner de trial ativo */}
            {isTrialing && isRoleOwner && (
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
            {trialExpired && !isFrozen && roleLoaded && !isRoleOwner && (
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
            {isFrozen && isRoleOwner && (
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
            {isFrozen && roleLoaded && !isRoleOwner && (
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
            {!isTrialing && !trialExpired && currentHouse?.plan === "free" && currentHouse?.plan_status !== "inactive" && isRoleOwner && (
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
              <Link href="/lista" replace className="bg-white rounded-2xl border border-green-200 shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/acoes/contador-comprar.png" alt="" aria-hidden="true" draggable={false} className="w-8 h-8 object-contain select-none pointer-events-none" />
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Ver lista →</span>
                </div>
                <p className="text-3xl font-black text-green-600">{shoppingCount}</p>
                <p className="text-sm text-gray-500 font-medium">Para comprar</p>
              </Link>
              <Link href="/despensa?filtro=acabando" replace className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/acoes/contador-acabando.png" alt="" aria-hidden="true" draggable={false} className="w-8 h-8 object-contain select-none pointer-events-none" />
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Ver itens →</span>
                </div>
                <p className="text-3xl font-black text-amber-500">{endingCount}</p>
                <p className="text-sm text-gray-500 font-medium">Acabando</p>
              </Link>
            </div>

            {/* Botões de ação */}
            <div>
              <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">
                O que aconteceu?
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ACTION_BUTTONS.map(({ label, sublabel, img, bg, status }) => (
                  <button
                    key={status}
                    onClick={() => openModal(status)}
                    className={`flex flex-col items-start p-4 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.97] text-left ${bg}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" aria-hidden="true" draggable={false} className="w-12 h-12 object-contain mb-2 select-none pointer-events-none" />
                    <span className="font-black text-gray-900 text-sm leading-tight">{label}</span>
                    <span className="text-xs text-gray-400 mt-0.5 leading-tight">{sublabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ver lista de compras */}
            {shoppingCount > 0 && (
              <Link
                href="/lista"
                replace
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
        reason={planLimitReason}
      />
    </div>
  );
}
