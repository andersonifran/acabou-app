"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { BottomNav } from "@/components/layout/BottomNav";
import { SwipeNavigator } from "@/components/layout/SwipeNavigator";
import { AddItemModal } from "@/components/items/AddItemModal";
import { PlanLimitModal } from "@/components/shared/PlanLimitModal";
import { PWAInstallBanner } from "@/components/shared/PWAInstallBanner";
import { PushPermissionBanner } from "@/components/shared/PushPermissionBanner";
// import { TesterBanner } from "@/components/shared/TesterBanner"; // DESATIVADO 06/06/2026 (ver nota no render)
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
    userId,
    dataSyncComplete,
    reset,
  } = useAppStore();

  // Marca atividade (last_active_at) ao abrir o app — alimenta o nudge diário
  // de re-engajamento (não incomoda quem abriu o app hoje). Fire-and-forget.
  useEffect(() => {
    fetch("/api/ping", { method: "POST" }).catch(() => {});
  }, []);

  const { createItem, changeStatus, editItem } = useItems();
  const { canAddItem, isPaid, isTrialing } = useSubscription();
  const [showPlanLimit, setShowPlanLimit] = useState(false);
  // Convidado cujo dono deixou o plano expirar → membership vira "frozen" (no
  // banco) e a RLS bloqueia o acesso. Mostramos a tela "Acesso pausado".
  const [accessPaused, setAccessPaused] = useState(false);
  // Verifica DIRETAMENTE no localStorage se tem casa — evita depender do timing do Zustand.
  // Isso garante que NUNCA mostramos spinner quando o usuário já estava logado.
  const [isReady, setIsReady] = useState(() => {
    if (typeof window === "undefined") return false;
    if (currentHouse) return true;
    try {
      const raw = localStorage.getItem("acabou-app-cache");
      if (!raw) return false;
      const cached = JSON.parse(raw);
      return !!cached.currentHouse;
    } catch { return false; }
  });

  // Splash de abertura sai com FADE suave (não "pisca" / não parece bug).
  // splashGone remove o overlay do DOM só depois que o fade termina.
  const [splashGone, setSplashGone] = useState(false);
  useEffect(() => {
    if (isReady && !splashGone) {
      const t = setTimeout(() => setSplashGone(true), 320);
      return () => clearTimeout(t);
    }
  }, [isReady, splashGone]);

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

      setUserId(user.id);

      // Busca as casas REAIS do usuário no servidor (fonte da verdade).
      const { data: membersData } = await supabase
        .from("house_members")
        .select("house_id, houses(*)")
        .eq("user_id", user.id)
        .eq("status", "active");

      const houses = (membersData ?? []).map((m: any) => m.houses as House).filter(Boolean);

      // Usuário não tem mais nenhuma casa ATIVA.
      if (houses.length === 0) {
        // Convidado congelado (dono expirou)? → tela "Acesso pausado".
        const { data: frozen } = await supabase
          .from("house_members")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "frozen")
          .limit(1);
        if (frozen && frozen.length > 0) {
          setAccessPaused(true);
          setIsReady(true);
          return;
        }
        reset();
        router.push("/onboarding");
        return;
      }

      setAllHouses(houses);

      // RECONCILIAÇÃO: se a casa do cache não existe mais no servidor
      // (foi deletada), cai numa casa válida — evita "casa fantasma".
      const savedId = localStorage.getItem(SELECTED_HOUSE_KEY);
      const target =
        houses.find((h) => h.id === currentHouse!.id) ??
        houses.find((h) => h.id === savedId) ??
        houses[0];

      await loadHouseData(target.id);
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

        // Convidado congelado (dono deixou o plano expirar)? → "Acesso pausado".
        const { data: frozen } = await supabase
          .from("house_members")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "frozen")
          .limit(1);
        if (frozen && frozen.length > 0) {
          setAccessPaused(true);
          setIsReady(true);
          return;
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

  // Splash de abertura — overlay FIXO (verde do logo + a marca branca) que cobre
  // tudo enquanto carrega e SOME com um fade RÁPIDO quando os dados ficam prontos
  // (sem "pisca" e sem delay perceptível). É renderizado na MESMA posição da
  // árvore antes e depois de "isReady" pra o fade funcionar (não pode "saltar").
  const splashOverlay = !splashGone ? (
    <div
      aria-hidden={isReady}
      style={{
        background:
          "radial-gradient(125% 125% at 50% 42%, #2BA043 0%, #1E9839 46%, #137D2A 80%, #0A5E1D 100%)",
      }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden text-white transition-opacity duration-[280ms] ease-out ${
        isReady ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Ícones flutuantes emoldurando a tela (vida própria) — é animação CSS,
          renderiza junto com o splash, SEM delay nenhum. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
        <span className="absolute left-7 top-24 text-4xl opacity-[0.18] animate-float" style={{ animationDuration: "9s" }}>🛒</span>
        <span className="absolute right-8 top-32 text-3xl opacity-[0.18] animate-float" style={{ animationDuration: "11s", animationDelay: "-2s" }}>☕</span>
        <span className="absolute left-9 bottom-32 text-3xl opacity-[0.18] animate-float" style={{ animationDuration: "10s", animationDelay: "-4s" }}>🍅</span>
        <span className="absolute right-7 bottom-28 text-4xl opacity-[0.18] animate-float" style={{ animationDuration: "12s", animationDelay: "-1s" }}>📦</span>
      </div>
      {/* A marca branca oficial (casa + ? + checklist), SEM o quadrado — centro */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.png"
        alt="Acabou?"
        style={{ width: 200, height: "auto" }}
        className="relative z-10 drop-shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
      />
    </div>
  ) : null;

  // ── BLOQUEIO DE MEMBRO CONVIDADO ────────────────────────────
  // Convites são exclusivos do Plano Família. Se o dono caiu para o
  // grátis (trial/plano expirou), os membros convidados perdem o acesso
  // até o dono renovar. Só bloqueia APÓS confirmar dados com o servidor
  // (dataSyncComplete) para nunca travar um membro de casa paga por engano.
  const isOwnerOfCurrent = !!(userId && currentHouse && (currentHouse as any).owner_id === userId);
  const housePremiumActive = isPaid || isTrialing;
  const blockGuestMember = dataSyncComplete && !!currentHouse && !isOwnerOfCurrent && !housePremiumActive;

  if (blockGuestMember || accessPaused) {
    return (
      <>
      {splashOverlay}
      <div className="min-h-screen app-bg flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl">🔒</div>
        <h1 className="text-xl font-bold text-gray-900">Acesso pausado</h1>
        <p className="text-gray-500 max-w-sm leading-relaxed">
          O acesso compartilhado é um recurso do <strong className="text-gray-700">Plano Família</strong>.
          Peça ao dono desta casa para renovar a assinatura — assim que ele renovar,
          você volta a ter acesso a tudo automaticamente. 💚
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            reset();
            router.push("/login");
            router.refresh();
          }}
          className="mt-2 px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          Sair da conta
        </button>
      </div>
      </>
    );
  }

  // Ordem das abas para navegação por swipe (mesma do BottomNav).
  // Membro convidado vê /configuracoes no lugar de /casa.
  const swipeTabs = isOwnerOfCurrent
    ? ["/home", "/despensa", "/lista", "/casa"]
    : ["/home", "/despensa", "/lista", "/configuracoes"];

  return (
    <>
      {splashOverlay}
      {isReady && (
      <div className="min-h-screen app-bg pb-16">
      {/* Banner de recrutamento de testadores DESATIVADO (06/06/2026): ele
          aparecia pra TODOS os usuários web (inclusive os que vêm do Facebook
          Ads), que NÃO são testadores cadastrados e cairiam num beco sem saída
          na página do Google. Recrutamento agora é só pessoal (família/amigos).
          REATIVAR só quando o app for público + Play Billing 100% funcionando. */}
      <PushPermissionBanner />
      <SwipeNavigator tabs={swipeTabs} disabled={isAddItemModalOpen}>
        {children}
      </SwipeNavigator>

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
      )}
    </>
  );
}
