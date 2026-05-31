"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { BottomNav } from "@/components/layout/BottomNav";
import { AddItemModal } from "@/components/items/AddItemModal";
import { PlanLimitModal } from "@/components/shared/PlanLimitModal";
import { PWAInstallBanner } from "@/components/shared/PWAInstallBanner";
import { PushPermissionBanner } from "@/components/shared/PushPermissionBanner";
import { useItems } from "@/hooks/useItems";
import { useSubscription } from "@/hooks/useSubscription";
import { ItemStatus, House } from "@/types";

const SELECTED_HOUSE_KEY = "acabou_selected_house";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const {
    setUserId,
    setCurrentHouse,
    setAllHouses,
    setMembers,
    setItems,
    setCategories,
    isAddItemModalOpen,
    setAddItemModalOpen,
    initialStatus,
    items,
    categories,
    currentHouse,
    setDataSyncComplete,
    setProfile,
  } = useAppStore();

  const { createItem, changeStatus, editItem } = useItems();
  const { canAddItem } = useSubscription();
  const [showPlanLimit, setShowPlanLimit] = useState(false);
  // Se o store já tem casa carregada, considera pronto imediatamente.
  // Isso evita o flash de "Carregando..." ao trocar entre abas.
  const [isReady, setIsReady] = useState(!!currentHouse);

  async function loadHouseData(houseId: string) {
    const { data: { user } } = await supabase.auth.getUser();

    // Carrega casa + membros + itens + perfil EM PARALELO (performance)
    const [houseResult, membersResult, itemsResult, profileResult] = await Promise.all([
      supabase.from("houses").select("*").eq("id", houseId).single(),
      supabase.from("house_members").select("*, profile:profiles(*)").eq("house_id", houseId).eq("status", "active"),
      supabase.from("items").select("*, category:categories(*)").eq("house_id", houseId).order("name"),
      user
        ? supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (houseResult.data) setCurrentHouse(houseResult.data as House);
    if (membersResult.data) setMembers(membersResult.data as any);
    if (itemsResult.data) setItems(itemsResult.data as any);
    if (profileResult.data) {
      setProfile((profileResult.data as any).full_name ?? "", (profileResult.data as any).avatar_url ?? "");
    }

    localStorage.setItem(SELECTED_HOUSE_KEY, houseId);
  }

  useEffect(() => {
    // Se já tem casa no cache (localStorage), renderiza imediatamente
    // e atualiza dados em BACKGROUND — sem bloquear a UI.
    if (currentHouse) {
      refreshInBackground();
      return;
    }

    async function refreshInBackground() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Atualiza a casa atual em segundo plano (sem mexer em isReady)
      await loadHouseData(currentHouse!.id);
      // Marca que os dados foram confirmados com o servidor
      // (banners de plano podem agora confiar nos dados)
      setDataSyncComplete(true);
    }

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Salva userId no store (evita chamadas repetidas de getUser em hooks)
      setUserId(user.id);

      // Carrega categorias E casas EM PARALELO (performance)
      const [catsResult, membersResult] = await Promise.all([
        supabase.from("categories").select("*").eq("is_default", true).order("sort_order"),
        supabase.from("house_members").select("house_id, houses(*)").eq("user_id", user.id).eq("status", "active"),
      ]);

      if (catsResult.data) setCategories(catsResult.data);
      const membersData = membersResult.data;

      if (!membersData || membersData.length === 0) {
        // Verifica se há convite pendente no localStorage (Google OAuth perde query params)
        const pendingInvite = localStorage.getItem("acabou_pending_invite");
        if (pendingInvite) {
          try {
            const res = await fetch("/api/criar-perfil", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
                phone: null,
                conviteToken: pendingInvite,
              }),
            });

            localStorage.removeItem("acabou_pending_invite");

            if (res.ok) {
              const result = await res.json();
              if (result.houseId) {
                // Convite aceito! Recarrega para entrar na casa
                console.log("[AppLayout] ✅ Convite pendente aceito via localStorage:", result.houseId);
                window.location.reload();
                return;
              }
            }
          } catch (err) {
            console.error("[AppLayout] Erro ao aceitar convite pendente:", err);
            localStorage.removeItem("acabou_pending_invite");
          }
        }

        router.push("/onboarding");
        return;
      }

      const houses = membersData.map((m: any) => m.houses as House).filter(Boolean);
      setAllHouses(houses);

      // Seleciona a casa (última usada ou a primeira)
      const savedId = localStorage.getItem(SELECTED_HOUSE_KEY);
      const selectedHouse = houses.find(h => h.id === savedId) ?? houses[0];

      await loadHouseData(selectedHouse.id);
      setDataSyncComplete(true);
      setIsReady(true);
    }

    loadData();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen app-bg flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-green-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg pb-16">
      <PushPermissionBanner />
      {children}

      <BottomNav />
      <PWAInstallBanner />

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setAddItemModalOpen(false)}
        initialStatus={(initialStatus as ItemStatus) ?? "acabou"}
        categories={categories}
        existingItems={items}
        onAddItem={async (data) => {
          if (!canAddItem) {
            setAddItemModalOpen(false);
            setShowPlanLimit(true);
            return;
          }
          return createItem(data);
        }}
        onUpdateStatus={changeStatus}
        onUpdateItem={editItem}
      />

      <PlanLimitModal
        isOpen={showPlanLimit}
        onClose={() => setShowPlanLimit(false)}
        reason="items"
      />
    </div>
  );
}
