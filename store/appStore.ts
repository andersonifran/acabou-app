"use client";

import { create } from "zustand";
import { House, Item, HouseMember, Category } from "@/types";

const CACHE_KEY = "acabou-app-cache";

// Lê o cache do localStorage no primeiro render (eager).
// Garante que o store ja inicia com dados antes do primeiro paint.
function readCache(): Partial<AppState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeCache(state: AppState) {
  if (typeof window === "undefined") return;

  const payload = {
    userId: state.userId,
    profileName: state.profileName,
    profileAvatar: state.profileAvatar,
    profileEmail: state.profileEmail,
    profilePhone: state.profilePhone,
    currentHouse: state.currentHouse,
    allHouses: state.allHouses,
    members: state.members,
    items: state.items,
    categories: state.categories,
  };

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Quota cheia. Limpa o cache antigo e salva versao reduzida
    // (so o essencial pra UI renderizar sem flash) — itens/eventos
    // podem ser recarregados em background.
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        userId: state.userId,
        profileName: state.profileName,
        profileAvatar: state.profileAvatar,
        currentHouse: state.currentHouse,
        allHouses: state.allHouses,
        categories: state.categories,
      }));
    } catch { /* desiste silenciosamente */ }
  }
}

interface AppState {
  // Usuário logado (evita múltiplas chamadas a getUser)
  userId: string | null;
  setUserId: (id: string | null) => void;

  // Perfil do usuário (cacheado para exibir nome/avatar instantaneamente)
  profileName: string;
  profileAvatar: string;
  setProfile: (name: string, avatar: string) => void;

  // Contato do perfil (email/telefone) — cacheado p/ Configurações abrir
  // instantânea, sem "fade-in" do email. Limpo no reset() (logout) → sem vazar.
  profileEmail: string;
  profilePhone: string;
  setProfileContact: (email: string, phone: string) => void;

  // Indica se os dados ja foram confirmados com o servidor nesta sessao
  // (usado para esconder banners de plano enquanto dados sao do cache stale)
  dataSyncComplete: boolean;
  setDataSyncComplete: (v: boolean) => void;

  // Casa atual
  currentHouse: House | null;
  setCurrentHouse: (house: House | null) => void;

  // Todas as casas do usuário
  allHouses: House[];
  setAllHouses: (houses: House[]) => void;

  // Membros da casa
  members: HouseMember[];
  setMembers: (members: HouseMember[]) => void;

  // Itens
  items: Item[];
  setItems: (items: Item[]) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;

  // Categorias
  categories: Category[];
  setCategories: (categories: Category[]) => void;

  // UI
  isAddItemModalOpen: boolean;
  setAddItemModalOpen: (open: boolean) => void;
  initialStatus: string | null;
  setInitialStatus: (status: string | null) => void;

  // Toast global (ex.: "sem conexão") — some sozinho
  toast: string | null;
  setToast: (msg: string | null) => void;

  // Reset
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const cached = readCache();

  const persistThenSet = (updates: Partial<AppState>) => {
    set(updates as any);
    writeCache(get());
  };

  // writeCache com debounce: em ações rápidas (tocar vários itens seguidos),
  // junta tudo numa gravação só em vez de serializar o estado inteiro a cada
  // toque (isso causava "travadinha" na main thread). Flush ao sair do app.
  let cacheTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleWriteCache = () => {
    if (typeof window === "undefined") return;
    if (cacheTimer) clearTimeout(cacheTimer);
    cacheTimer = setTimeout(() => { cacheTimer = null; writeCache(get()); }, 400);
  };
  if (typeof window !== "undefined") {
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && cacheTimer) {
        clearTimeout(cacheTimer);
        cacheTimer = null;
        writeCache(get());
      }
    });
  }

  return {
    userId: cached.userId ?? null,
    setUserId: (id) => persistThenSet({ userId: id }),

    profileName: cached.profileName ?? "",
    profileAvatar: cached.profileAvatar ?? "",
    setProfile: (name, avatar) => persistThenSet({ profileName: name, profileAvatar: avatar }),

    profileEmail: cached.profileEmail ?? "",
    profilePhone: cached.profilePhone ?? "",
    setProfileContact: (email, phone) => persistThenSet({ profileEmail: email, profilePhone: phone }),

    // dataSyncComplete inicia false: enquanto nao confirmar com o servidor,
    // banners de plano ficam escondidos para evitar flash de info errada
    dataSyncComplete: false,
    setDataSyncComplete: (v) => set({ dataSyncComplete: v }),

    currentHouse: cached.currentHouse ?? null,
    setCurrentHouse: (house) => persistThenSet({ currentHouse: house }),

    allHouses: cached.allHouses ?? [],
    setAllHouses: (houses) => persistThenSet({ allHouses: houses }),

    members: cached.members ?? [],
    setMembers: (members) => persistThenSet({ members }),

    items: cached.items ?? [],
    setItems: (items) => persistThenSet({ items }),
    updateItem: (id, updates) => {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      }));
      scheduleWriteCache();
    },
    addItem: (item) => {
      set((state) => ({ items: [item, ...state.items] }));
      scheduleWriteCache();
    },
    removeItem: (id) => {
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      scheduleWriteCache();
    },

    categories: cached.categories ?? [],
    setCategories: (categories) => persistThenSet({ categories }),

    isAddItemModalOpen: false,
    setAddItemModalOpen: (open) => set({ isAddItemModalOpen: open }),
    initialStatus: null,
    setInitialStatus: (status) => set({ initialStatus: status }),

    toast: null,
    setToast: (msg) => set({ toast: msg }),

    reset: () => {
      set({
        userId: null,
        profileName: "",
        profileAvatar: "",
        profileEmail: "",
        profilePhone: "",
        currentHouse: null,
        allHouses: [],
        members: [],
        items: [],
        categories: [],
        isAddItemModalOpen: false,
        initialStatus: null,
        dataSyncComplete: false,
        toast: null, // não vaza toast entre contas no mesmo aparelho (app de família)
      });
      if (typeof window !== "undefined") {
        try { localStorage.removeItem(CACHE_KEY); } catch {}
      }
    },
  };
});
