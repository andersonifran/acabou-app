"use client";

import { create } from "zustand";
import { House, Item, HouseMember, Category } from "@/types";

interface AppState {
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

export const useAppStore = create<AppState>((set) => ({
  currentHouse: null,
  setCurrentHouse: (house) => set({ currentHouse: house }),

  allHouses: [],
  setAllHouses: (houses) => set({ allHouses: houses }),

  members: [],
  setMembers: (members) => set({ members }),

  items: [],
  setItems: (items) => set({ items }),
  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  categories: [],
  setCategories: (categories) => set({ categories }),

  isAddItemModalOpen: false,
  setAddItemModalOpen: (open) => set({ isAddItemModalOpen: open }),
  initialStatus: null,
  setInitialStatus: (status) => set({ initialStatus: status }),

  reset: () =>
    set({
      currentHouse: null,
      allHouses: [],
      members: [],
      items: [],
      categories: [],
      isAddItemModalOpen: false,
      initialStatus: null,
    }),
}));
