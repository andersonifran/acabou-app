"use client";

import { useState, useEffect } from "react";
import { X, Search, Plus } from "lucide-react";
import { Item, ItemStatus, Category, STATUS_LABELS, SHOPPING_LIST_STATUSES } from "@/types";
import { cn } from "@/lib/utils";
import { SUGGESTED_ITEMS } from "@/lib/item-catalog";
import { recordItemUse, getLearnedItems, type LearnedItem } from "@/lib/learned-items";

// Tira acento + maiúscula → "Açúcar" e "acucar" viram a mesma coisa.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Pontua um texto contra a busca: exato(100) > começa-com(80) > palavra-começa(60) > contém(40).
function scoreField(field: string, q: string): number {
  const f = normalize(field);
  if (f === q) return 100;
  if (f.startsWith(q)) return 80;
  if (f.split(/\s+/).some((w) => w.startsWith(q))) return 60;
  if (f.includes(q)) return 40;
  return 0;
}

// Relevância do item. REGRA: match no NOME sempre ganha de match só por APELIDO
// (senão "cloro" mostrava "Água sanitária" — apelido — na frente de "Cloro para
// piscina" — nome). Apelido ainda funciona, mas ranqueia abaixo de qualquer nome.
function matchScore(name: string, extraAliases: string[] | undefined, query: string): number {
  const q = normalize(query);
  if (!q) return 1; // sem busca → tudo passa (neutro)
  const nameScore = scoreField(name, q);
  if (nameScore > 0) return nameScore;
  let aliasScore = 0;
  for (const a of extraAliases ?? []) aliasScore = Math.max(aliasScore, scoreField(a, q));
  return aliasScore > 0 ? Math.max(15, aliasScore - 25) : 0;
}

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
  onUpdateItem?: (itemId: string, data: { name: string; note?: string; quantity_text?: string }) => Promise<void>;
}

export function AddItemModal({
  isOpen,
  onClose,
  initialStatus = "acabou",
  categories,
  existingItems,
  onAddItem,
  onUpdateStatus,
  onUpdateItem,
}: AddItemModalProps) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"search" | "create">("search");
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newStatus, setNewStatus] = useState<ItemStatus>(initialStatus);
  const [newNote, setNewNote] = useState("");
  const [newQty, setNewQty] = useState("");
  const [loading, setLoading] = useState(false);
  // Item existente sendo editado (null = criando item novo)
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  // Mostra o autocomplete embaixo do campo "Nome do item" (só enquanto digita).
  const [showNameSug, setShowNameSug] = useState(false);
  // Itens que o usuário aprende a usar (entre TODAS as casas) — carregados ao abrir.
  const [learned, setLearned] = useState<LearnedItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setMode("search");
      setNewName("");
      setNewStatus(initialStatus);
      setNewNote("");
      setNewQty("");
      setEditingItem(null);
      setShowNameSug(false);
      setLearned(getLearnedItems());
      if (categories.length > 0) setNewCategoryId(categories[0].id);
    }
  }, [isOpen, initialStatus, categories]);

  // Botão "voltar" do celular fecha o modal (em vez de sair do app).
  // Empurra um estado no histórico ao abrir; o back dispara popstate → fecha.
  useEffect(() => {
    if (!isOpen) return;
    const onPopState = () => onClose();
    window.history.pushState({ acabouModal: "addItem" }, "");
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      // Se foi fechado manualmente (X/seleção), remove o estado extra do histórico
      if ((window.history.state as any)?.acabouModal === "addItem") {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  // Busca inteligente: sem acento + ranking (começa-com aparece primeiro).
  const filteredExisting = existingItems
    .map((item) => ({ item, score: matchScore(item.name, undefined, search) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, "pt-BR"))
    .map((x) => x.item);

  // Pool de sugestões = catálogo + itens que VOCÊ já usou e não estão no catálogo
  // (aprende entre todas as suas casas). E um mapa de uso pra ranquear.
  const learnedByName = new Map(learned.map((l) => [normalize(l.name), l]));
  const catalogNorm = new Set(SUGGESTED_ITEMS.map((s) => normalize(s.name)));
  const suggestionPool: { name: string; category: string; aliases?: string[] }[] = [
    ...SUGGESTED_ITEMS,
    ...learned
      .filter((l) => !catalogNorm.has(normalize(l.name)))
      .map((l) => ({ name: l.name, category: l.category })),
  ];

  // Ranqueia o pool por uma busca: relevância + boost de quem você MAIS usa.
  function rankPool(query: string) {
    return suggestionPool
      .map((s) => {
        const base = matchScore(s.name, s.aliases, query);
        if (base === 0) return { s, score: 0 };
        const used = learnedByName.get(normalize(s.name));
        const boost = used ? Math.min(18, 6 + used.count * 2) : 0; // mais usado = mais alto
        return { s, score: base + boost };
      })
      .filter(
        (x) =>
          x.score > 0 && !existingItems.some((e) => normalize(e.name) === normalize(x.s.name))
      )
      .sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name, "pt-BR"))
      .map((x) => x.s);
  }

  const filteredSuggested = rankPool(search);

  // Clicar num item existente abre o formulário pré-preenchido,
  // para o usuário revisar/ajustar status e observação antes de confirmar.
  function handleSelectExisting(item: Item) {
    setEditingItem(item);
    setNewName(item.name);
    setNewCategoryId(item.category_id);
    setNewStatus(initialStatus);
    setNewNote(item.note ?? "");
    setNewQty(item.quantity_text ?? "");
    setShowNameSug(false);
    setMode("create");
  }

  function handleSelectFromSuggested(suggested: { name: string; category: string }) {
    const cat = categories.find((c) => c.name === suggested.category);
    setEditingItem(null);
    setNewName(suggested.name);
    setNewCategoryId(cat?.id ?? categories[0]?.id ?? "");
    setNewStatus(initialStatus);
    setNewNote("");
    setNewQty("");
    setShowNameSug(false);
    setMode("create");
  }

  // Sugestões enquanto digita o NOME (só quando criando item novo). Auto-completa
  // o nome + já escolhe a categoria certa ao tocar.
  const nameSuggestions =
    showNameSug && newName.trim() && !editingItem
      ? rankPool(newName).filter((s) => normalize(s.name) !== normalize(newName)).slice(0, 5)
      : [];

  function pickNameSuggestion(s: { name: string; category: string }) {
    const cat = categories.find((c) => c.name === s.category);
    setNewName(s.name);
    if (cat) setNewCategoryId(cat.id);
    setShowNameSug(false);
  }

  async function handleCreate() {
    if (!newName.trim() || !newCategoryId) return;
    setLoading(true);
    try {
      if (editingItem) {
        // Item existente: atualiza status + nome/observação/quantidade
        await onUpdateStatus(editingItem.id, newStatus);
        if (onUpdateItem) {
          await onUpdateItem(editingItem.id, {
            name: newName.trim(),
            note: newNote || undefined,
            quantity_text: newQty || undefined,
          });
        }
      } else {
        // Item novo
        await onAddItem({
          name: newName.trim(),
          category_id: newCategoryId,
          status: newStatus,
          note: newNote || undefined,
          quantity_text: newQty || undefined,
        });
      }
      // Aprende: registra o uso (alimenta sugestões entre casas + ranking).
      const catName = categories.find((c) => c.id === newCategoryId)?.name ?? "";
      recordItemUse(newName.trim(), catName);
      onClose();
    } catch (err: any) {
      // Sem isto, um erro de rede/limite deixava o modal travado e mudo.
      alert(err?.message ?? "Não consegui salvar agora. Verifique a conexão e tente de novo. 🙏");
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
    <div className="fixed inset-0 z-[45] bg-black/40 flex items-end justify-center px-0 pb-16">
      {/* z-[45] (abaixo do rodapé z-50) + pb-16 → sheet senta ACIMA do rodapé,
          que continua visível e firme (visual mais profissional). */}
      <div className="w-full max-w-lg bg-white rounded-t-2xl shadow-xl max-h-[82vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-lg text-gray-900">
              {mode === "search" ? "Qual item?" : editingItem ? "Editar item" : "Novo item"}
            </h2>
            <p className="text-sm text-gray-500">
              Marcando como:{" "}
              <span className="font-medium text-gray-700">{statusLabel[mode === "create" ? newStatus : initialStatus]}</span>
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
                  type="text"
                  placeholder="Buscar item..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 text-gray-900"
                />
              </div>
            </div>

            {/* Criar novo item — fixo no topo, sempre visível e intuitivo */}
            <div className="px-5 pb-2">
              <button
                onClick={() => { setNewName(search); setMode("create"); }}
                className="w-full flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3.5 transition-colors shadow-sm shadow-green-200"
              >
                <Plus size={20} className="shrink-0" />
                <span className="font-bold">
                  {search.trim() ? `Criar "${search.trim()}"` : "Criar novo item"}
                </span>
              </button>
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
                        onClick={() => handleSelectFromSuggested(s)}
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

              {/* Mensagem quando não há resultados na busca */}
              {search.trim() && filteredExisting.length === 0 && filteredSuggested.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Nenhum item encontrado. Use o botão <strong className="text-green-600">Criar "{search.trim()}"</strong> acima. 👆
                </p>
              )}
            </div>
          </>
        ) : (
          /* Formulário de criação */
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome do item *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setShowNameSug(true); }}
                onFocus={() => setShowNameSug(true)}
                placeholder="Ex: Café, Detergente..."
                autoComplete="off"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 text-gray-900"
              />
              {/* Autocomplete: aparece flutuando sobre os campos de baixo (não
                  empurra o formulário) — fecha ao escolher. */}
              {nameSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                  {nameSuggestions.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => pickNameSuggestion(s)}
                      className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-gray-50 last:border-b-0 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{s.name}</span>
                      <span className="ml-2 text-sm text-gray-400">{s.category}</span>
                    </button>
                  ))}
                </div>
              )}
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
                      "py-2.5 rounded-xl text-sm font-medium border transition-all duration-100 active:scale-[0.94]",
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
                onClick={() => { setEditingItem(null); setMode("search"); }}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold"
              >
                Voltar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || !newCategoryId || loading}
                className="flex-1 py-3.5 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-50 hover:bg-green-700 transition-colors"
              >
                {loading ? "Salvando..." : editingItem ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
