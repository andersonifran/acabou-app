"use client";

import { useState, useEffect } from "react";
import { X, Search, Plus } from "lucide-react";
import { Item, ItemStatus, Category, STATUS_LABELS, SHOPPING_LIST_STATUSES } from "@/types";
import { cn } from "@/lib/utils";

// Itens sugeridos para busca/onboarding
export const SUGGESTED_ITEMS: { name: string; category: string }[] = [
  // Alimentos
  { name: "Arroz", category: "Alimentos" },
  { name: "Feijão", category: "Alimentos" },
  { name: "Óleo", category: "Alimentos" },
  { name: "Café", category: "Alimentos" },
  { name: "Açúcar", category: "Alimentos" },
  { name: "Sal", category: "Alimentos" },
  { name: "Leite", category: "Alimentos" },
  { name: "Ovos", category: "Alimentos" },
  { name: "Pão", category: "Alimentos" },
  { name: "Manteiga", category: "Alimentos" },
  { name: "Macarrão", category: "Alimentos" },
  { name: "Molho de tomate", category: "Alimentos" },
  { name: "Farinha", category: "Alimentos" },
  { name: "Carne", category: "Alimentos" },
  { name: "Frango", category: "Alimentos" },
  { name: "Queijo", category: "Alimentos" },
  { name: "Presunto", category: "Alimentos" },
  { name: "Frutas", category: "Alimentos" },
  { name: "Verduras", category: "Alimentos" },
  { name: "Legumes", category: "Alimentos" },
  // Limpeza
  { name: "Detergente", category: "Limpeza" },
  { name: "Sabão em pó", category: "Limpeza" },
  { name: "Amaciante", category: "Limpeza" },
  { name: "Água sanitária", category: "Limpeza" },
  { name: "Desinfetante", category: "Limpeza" },
  { name: "Esponja", category: "Limpeza" },
  { name: "Saco de lixo", category: "Limpeza" },
  { name: "Papel toalha", category: "Limpeza" },
  // Higiene
  { name: "Papel higiênico", category: "Higiene" },
  { name: "Sabonete", category: "Higiene" },
  { name: "Shampoo", category: "Higiene" },
  { name: "Condicionador", category: "Higiene" },
  { name: "Creme dental", category: "Higiene" },
  { name: "Escova de dente", category: "Higiene" },
  { name: "Desodorante", category: "Higiene" },
  { name: "Absorvente", category: "Higiene" },
  // Pet
  { name: "Ração", category: "Pet" },
  { name: "Areia do gato", category: "Pet" },
  { name: "Tapete higiênico", category: "Pet" },
  { name: "Petisco", category: "Pet" },
  { name: "Shampoo pet", category: "Pet" },
  // Bebê
  { name: "Fralda", category: "Bebê" },
  { name: "Lenço umedecido", category: "Bebê" },
  { name: "Pomada", category: "Bebê" },
  { name: "Fórmula", category: "Bebê" },
  { name: "Sabonete bebê", category: "Bebê" },
  // Farmácia
  { name: "Curativo", category: "Farmácia" },
  { name: "Álcool", category: "Farmácia" },
  { name: "Algodão", category: "Farmácia" },
  { name: "Termômetro", category: "Farmácia" },
  { name: "Remédio recorrente", category: "Farmácia" },
];

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStatus?: ItemStatus;
  categories: Category[];
  existingItems: Item[];
  onAddItem: (data: {
    name: string;
    category_id: string;
    status: ItemStatus;
    note?: string;
    quantity_text?: string;
  }) => Promise<unknown>;
  onUpdateStatus: (itemId: string, status: ItemStatus) => Promise<void>;
}

export function AddItemModal({
  isOpen,
  onClose,
  initialStatus = "acabou",
  categories,
  existingItems,
  onAddItem,
  onUpdateStatus,
}: AddItemModalProps) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"search" | "create">("search");
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newStatus, setNewStatus] = useState<ItemStatus>(initialStatus);
  const [newNote, setNewNote] = useState("");
  const [newQty, setNewQty] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setMode("search");
      setNewName("");
      setNewStatus(initialStatus);
      setNewNote("");
      setNewQty("");
      if (categories.length > 0) setNewCategoryId(categories[0].id);
    }
  }, [isOpen, initialStatus, categories]);

  const filteredExisting = existingItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSuggested = SUGGESTED_ITEMS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      !existingItems.some((e) => e.name.toLowerCase() === s.name.toLowerCase())
  );

  async function handleSelectExisting(item: Item) {
    setLoading(true);
    try {
      await onUpdateStatus(item.id, initialStatus);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFromSuggested(suggested: { name: string; category: string }) {
    const cat = categories.find((c) => c.name === suggested.category) ?? categories[0];
    setLoading(true);
    try {
      await onAddItem({
        name: suggested.name,
        category_id: cat?.id ?? "",
        status: initialStatus,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !newCategoryId) return;
    setLoading(true);
    try {
      await onAddItem({
        name: newName.trim(),
        category_id: newCategoryId,
        status: newStatus,
        note: newNote || undefined,
        quantity_text: newQty || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const statusLabel: Record<ItemStatus, string> = {
    tem: "Tem em casa",
    acabando: "Está acabando",
    acabou: "Acabou",
    comprar: "Quero comprar",
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end justify-center px-0">
      <div className="w-full max-w-lg bg-white rounded-t-2xl shadow-xl max-h-[88vh] flex flex-col pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-lg text-gray-900">
              {mode === "search" ? "Qual item?" : "Novo item"}
            </h2>
            <p className="text-sm text-gray-500">
              Marcando como:{" "}
              <span className="font-medium text-gray-700">{statusLabel[initialStatus]}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
            <X size={22} />
          </button>
        </div>

        {mode === "search" ? (
          <>
            {/* Busca */}
            <div className="px-5 py-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 text-gray-900"
                />
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
              {/* Existentes */}
              {filteredExisting.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
                    Na sua despensa
                  </p>
                  <div className="space-y-2">
                    {filteredExisting.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectExisting(item)}
                        disabled={loading}
                        className="w-full text-left bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-xl px-4 py-3 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{item.name}</span>
                        {item.category && (
                          <span className="ml-2 text-sm text-gray-400">
                            {item.category.icon} {item.category.name}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugeridos */}
              {filteredSuggested.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
                    Sugestões
                  </p>
                  <div className="space-y-2">
                    {filteredSuggested.slice(0, 10).map((s) => (
                      <button
                        key={s.name}
                        onClick={() => handleCreateFromSuggested(s)}
                        disabled={loading}
                        className="w-full text-left bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 rounded-xl px-4 py-3 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{s.name}</span>
                        <span className="ml-2 text-sm text-gray-400">{s.category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Criar novo */}
              <button
                onClick={() => { setNewName(search); setMode("create"); }}
                className="w-full flex items-center gap-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl px-4 py-3 transition-colors"
              >
                <Plus size={20} className="text-green-600 shrink-0" />
                <span className="font-medium text-green-700">
                  {search ? `Criar "${search}"` : "Criar novo item"}
                </span>
              </button>
            </div>
          </>
        ) : (
          /* Formulário de criação */
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome do item *
              </label>
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Café, Detergente..."
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Categoria *
              </label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 text-gray-900"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(["tem", "acabando", "acabou", "comprar"] as ItemStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-medium border transition-all",
                      newStatus === s
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-green-300"
                    )}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Observação / Quantidade{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ex: 2 pacotes, marca X, sem lactose..."
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 text-gray-900"
              />
            </div>

            <div className="flex gap-3 pb-2">
              <button
                onClick={() => setMode("search")}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold"
              >
                Voltar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || !newCategoryId || loading}
                className="flex-1 py-3.5 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-50 hover:bg-green-700 transition-colors"
              >
                {loading ? "Salvando..." : "Adicionar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
