"use client";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { useItems } from "@/hooks/useItems";
import { ItemCard } from "@/components/items/ItemCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Header } from "@/components/layout/Header";
import { Item, ItemStatus, STATUS_LABELS } from "@/types";
import { Plus, Search, X, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterStatus = "todos" | ItemStatus;

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "tem", label: "Tem" },
  { value: "acabando", label: "Acabando" },
  { value: "acabou", label: "Acabou" },
  { value: "comprar", label: "Comprar" },
];

export default function DespensaPage() {
  const { setAddItemModalOpen, setInitialStatus } = useAppStore();
  const { items, itemsByCategory, changeStatus, deleteItem, renameItem } = useItems();
  const [filter, setFilter] = useState<FilterStatus>("todos");
  const [search, setSearch] = useState("");

  const filtered = items.filter((item) => {
    const matchStatus = filter === "todos" || item.status === filter;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredByCategory = filtered.reduce<Record<string, Item[]>>((acc, item) => {
    const cat = item.category?.name ?? "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  function openAdd() {
    setInitialStatus("acabou");
    setAddItemModalOpen(true);
  }

  return (
    <div>
      <Header
        title="Despensa"
        subtitle={`${items.length} itens`}
        right={
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            <Plus size={16} />
            Adicionar
          </button>
        }
      />

      <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
        {/* Busca */}
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar item..."
            className="w-full pl-10 pr-10 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 text-gray-900 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtros de status */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {filterOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-all shrink-0",
                filter === value
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="📦"
            title={search ? "Nenhum item encontrado" : "Sua despensa está vazia"}
            description={
              search
                ? `Nenhum item com "${search}"`
                : "Comece adicionando o que você já tem em casa. Depois é só marcar quando acabar!"
            }
            action={
              !search ? (
                <button
                  onClick={openAdd}
                  className="bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
                >
                  Adicionar primeiro item
                </button>
              ) : undefined
            }
          />
        ) : (
          Object.entries(filteredByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, catItems]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {catItems[0].category?.icon} {category} ({catItems.length})
              </p>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={changeStatus}
                    onEdit={renameItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}
