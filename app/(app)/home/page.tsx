"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { ItemEvent, SHOPPING_LIST_STATUSES, House } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import { buildShoppingListText, buildWhatsAppShareUrl } from "@/lib/utils";
import { ShoppingCart, Bell, ChevronDown, Plus, Check, Zap } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { cn } from "@/lib/utils";

const SELECTED_HOUSE_KEY = "acabou_selected_house";

const PROPERTY_MAP: Record<string, { icon: string; label: string }> = {
  casa:        { icon: "🏠", label: "Casa" },
  apartamento: { icon: "🏢", label: "Apartamento" },
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

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const { items, currentHouse, allHouses, setCurrentHouse, setMembers, setItems, setAddItemModalOpen, setInitialStatus } = useAppStore();

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [recentEvents, setRecentEvents] = useState<(ItemEvent & { profile?: any; item?: any })[]>([]);
  const [reminders, setReminders] = useState<{ id: string; name: string }[]>([]);
  const [showHousePicker, setShowHousePicker] = useState(false);
  const [switchingHouse, setSwitchingHouse] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

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

  function openModal(status: string) {
    setInitialStatus(status);
    setAddItemModalOpen(true);
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

  const actionButtons = [
    {
      label: "Acabou!",
      sublabel: "Precisa repor",
      icon: <IconAcabou />,
      bg: "bg-red-50 border-red-100",
      status: "acabou",
    },
    {
      label: "Está acabando!",
      sublabel: "Já está no fim",
      icon: <IconAcabando />,
      bg: "bg-amber-50 border-amber-100",
      status: "acabando",
    },
    {
      label: "Quero comprar!",
      sublabel: "Adicionar à lista",
      icon: <IconQueroComprar />,
      bg: "bg-blue-50 border-blue-100",
      status: "comprar",
    },
    {
      label: "Comprei!",
      sublabel: "Já comprou o item",
      icon: <IconComprar />,
      bg: "bg-green-50 border-green-100",
      status: "tem",
    },
  ];

  return (
    <div>
      {/* Header com ícone do imóvel + seletor de casas */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0" ref={pickerRef}>
            <button
              onClick={() => allHouses.length > 1 && setShowHousePicker(!showHousePicker)}
              className={cn(
                "flex items-center gap-2 min-w-0",
                allHouses.length > 1 && "cursor-pointer"
              )}
            >
              <span className="text-2xl shrink-0">{propertyInfo.icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h1 className="font-semibold text-gray-900 truncate text-sm leading-tight max-w-[160px] sm:max-w-[220px]">
                    {currentHouse?.name ?? "Minha Casa"}
                  </h1>
                  {allHouses.length > 1 && (
                    <ChevronDown size={16} className={cn("text-gray-400 shrink-0 transition-transform", showHousePicker && "rotate-180")} />
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-tight">{propertyInfo.label} · O que mudou hoje?</p>
              </div>
            </button>

            {/* Dropdown de casas */}
            {showHousePicker && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Suas casas</p>
                {allHouses.map((house) => {
                  const pt = PROPERTY_MAP[(house as any).property_type ?? "casa"] ?? PROPERTY_MAP.casa;
                  return (
                    <button
                      key={house.id}
                      onClick={() => switchHouse(house)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-xl shrink-0">{pt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{house.name}</p>
                        <p className="text-xs text-gray-500">{pt.label}</p>
                      </div>
                      {house.id === currentHouse?.id && (
                        <Check size={16} className="text-green-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
                <div className="border-t border-gray-50 p-2">
                  <Link
                    href="/casa/nova"
                    onClick={() => setShowHousePicker(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                      <Plus size={14} className="text-green-600" />
                    </div>
                    <span className="text-sm font-semibold text-green-700">Adicionar novo local</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <NotificationBell />
            {/* Botão adicionar casa (quando tem só uma) */}
            {allHouses.length <= 1 && (
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
            {/* Banner de plano expirado */}
            {currentHouse?.plan !== "free" && currentHouse?.plan_status === "inactive" && (
              <Link
                href="/planos"
                className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl px-4 py-3.5 hover:from-red-100 hover:to-orange-100 transition-all"
              >
                <div className="w-9 h-9 bg-red-400 rounded-full flex items-center justify-center shrink-0">
                  <Zap size={18} className="text-white fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-red-900 text-sm">Seu plano Família expirou</p>
                  <p className="text-xs text-red-700 mt-0.5">Renove para continuar com itens e membros ilimitados</p>
                </div>
                <ChevronDown size={16} className="text-red-500 shrink-0 -rotate-90" />
              </Link>
            )}

            {/* Banner de upgrade — plano grátis (só mostra para o dono, não para convidados) */}
            {currentHouse?.plan === "free" && (currentHouse as any)?.owner_id === currentUserId && (
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
              <Link href="/despensa" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-amber-200 transition-colors">
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
                {actionButtons.map(({ label, sublabel, icon, bg, status }) => (
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

            {/* Ver lista + WhatsApp */}
            {shoppingCount > 0 && (
              <div className="space-y-2">
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
                <button
                  onClick={() => {
                    const list = shoppingItems.map(i => ({ name: i.name, category: i.category?.name ?? "Outros", note: i.note }));
                    window.open(buildWhatsAppShareUrl(buildShoppingListText(list)), "_blank");
                  }}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1fba59] active:scale-[0.98] text-white font-semibold py-3.5 rounded-2xl transition-all text-sm"
                >
                  <WhatsAppIcon />
                  Mandar lista no WhatsApp
                </button>
              </div>
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
    </div>
  );
}
