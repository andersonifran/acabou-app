"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { BottomNav } from "@/components/layout/BottomNav";
import { AddItemModal } from "@/components/items/AddItemModal";
import { PWAInstallBanner } from "@/components/shared/PWAInstallBanner";
import { PushPermissionBanner } from "@/components/shared/PushPermissionBanner";
import { useItems } from "@/hooks/useItems";
import { ItemStatus, House } from "@/types";

const SELECTED_HOUSE_KEY = "acabou_selected_house";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const {
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
  } = useAppStore();

  const { createItem, changeStatus } = useItems();

  async function loadHouseData(houseId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: houseData } = await supabase
      .from("houses")
      .select("*")
      .eq("id", houseId)
      .single();

    if (!houseData) return;
    setCurrentHouse(houseData as House);

    // Membros
    const { data: membersData } = await supabase
      .from("house_members")
      .select("*, profile:profiles(*)")
      .eq("house_id", houseId)
      .eq("status", "active");
    if (membersData) setMembers(membersData as any);

    // Itens
    const { data: itemsData } = await supabase
      .from("items")
      .select("*, category:categories(*)")
      .eq("house_id", houseId)
      .order("name");
    if (itemsData) setItems(itemsData as any);

    // Salva preferência
    localStorage.setItem(SELECTED_HOUSE_KEY, houseId);
  }

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Categorias
      const { data: cats } = await supabase.from("categories").select("*").eq("is_default", true).order("sort_order");
      if (cats) setCategories(cats);

      // Todas as casas do usuário
      const { data: membersData } = await supabase
        .from("house_members")
        .select("house_id, houses(*)")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (!membersData || membersData.length === 0) {
        router.push("/onboarding");
        return;
      }

      const houses = membersData.map((m: any) => m.houses as House).filter(Boolean);
      setAllHouses(houses);

      // Seleciona a casa (última usada ou a primeira)
      const savedId = localStorage.getItem(SELECTED_HOUSE_KEY);
      const selectedHouse = houses.find(h => h.id === savedId) ?? houses[0];

      await loadHouseData(selectedHouse.id);
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
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
        onAddItem={createItem}
        onUpdateStatus={changeStatus}
      />
    </div>
  );
}
