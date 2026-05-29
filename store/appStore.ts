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
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      userId: state.userId,
      currentHouse: state.currentHouse,
      allHouses: state.allHouses,
      members: state.members,
      items: state.items,
      categories: state.categories,
    }));
  } catch { /* quota cheia ou bloqueado */ }
}

interface AppState {
  // Usuário logado (evita múltiplas chamadas a getUser)
  userId: string | null;
  setUserId: (id: string | null) => void;

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

  // Reset
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const cached = readCache();

  const persistThenSet = (updates: Partial<AppState>) => {
    set(updates as any);
    writeCache(get());
  };

  return {
    userId: cached.userId ?? null,
    setUserId: (id) => persistThenSet({ userId: id }),

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
      writeCache(get());
    },
    addItem: (item) => {
      set((state) => ({ items: [item, ...state.items] }));
      writeCache(get());
    },
    removeItem: (id) => {
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      writeCache(get());
    },

    categories: cached.categories ?? [],
    setCategories: (categories) => persistThenSet({ categories }),

    isAddItemModalOpen: false,
    setAddItemModalOpen: (open) => set({ isAddItemModalOpen: open }),
    initialStatus: null,
    setInitialStatus: (status) => set({ initialStatus: status }),

    reset: () => {
      set({
        userId: null,
        currentHouse: null,
        allHouses: [],
        members: [],
        items: [],
        categories: [],
        isAddItemModalOpen: false,
        initialStatus: null,
      });
      if (typeof window !== "undefined") {
        try { localStorage.removeItem(CACHE_KEY); } catch {}
      }
    },
  };
});
