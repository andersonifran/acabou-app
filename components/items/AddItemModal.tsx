"use client";

import { useState, useEffect } from "react";
import { X, Search, Plus } from "lucide-react";
import { Item, ItemStatus, Category, STATUS_LABELS, SHOPPING_LIST_STATUSES } from "@/types";
import { cn } from "@/lib/utils";

// Itens sugeridos para busca — unifica todos os tipos de local.
// aliases = como as pessoas costumam DIGITAR (apelidos/sem acento/marcas), pra
// busca achar mesmo escrito diferente.
export const SUGGESTED_ITEMS: { name: string; category: string; aliases?: string[] }[] = [
  // ── Alimentos ──
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
  { name: "Batata", category: "Alimentos" },
  { name: "Cebola", category: "Alimentos" },
  { name: "Alho", category: "Alimentos" },
  // ── Limpeza ──
  { name: "Detergente", category: "Limpeza" },
  { name: "Sabão em pó", category: "Limpeza" },
  { name: "Amaciante", category: "Limpeza" },
  { name: "Água sanitária", category: "Limpeza" },
  { name: "Desinfetante", category: "Limpeza" },
  { name: "Esponja", category: "Limpeza" },
  { name: "Saco de lixo", category: "Limpeza" },
  { name: "Papel toalha", category: "Limpeza" },
  { name: "Multiuso", category: "Limpeza" },
  { name: "Rodo", category: "Limpeza" },
  { name: "Vassoura", category: "Limpeza" },
  { name: "Luva de borracha", category: "Limpeza" },
  // ── Higiene ──
  { name: "Papel higiênico", category: "Higiene" },
  { name: "Sabonete", category: "Higiene" },
  { name: "Shampoo", category: "Higiene" },
  { name: "Condicionador", category: "Higiene" },
  { name: "Creme dental", category: "Higiene" },
  { name: "Escova de dente", category: "Higiene" },
  { name: "Desodorante", category: "Higiene" },
  { name: "Absorvente", category: "Higiene" },
  // ── Pet ──
  { name: "Ração", category: "Pet" },
  { name: "Areia do gato", category: "Pet" },
  { name: "Tapete higiênico", category: "Pet" },
  { name: "Petisco", category: "Pet" },
  { name: "Shampoo pet", category: "Pet" },
  // ── Bebê ──
  { name: "Fralda", category: "Bebê" },
  { name: "Lenço umedecido", category: "Bebê" },
  { name: "Pomada", category: "Bebê" },
  { name: "Fórmula", category: "Bebê" },
  { name: "Sabonete bebê", category: "Bebê" },
  // ── Farmácia ──
  { name: "Curativo", category: "Farmácia" },
  { name: "Álcool", category: "Farmácia" },
  { name: "Algodão", category: "Farmácia" },
  { name: "Termômetro", category: "Farmácia" },
  { name: "Remédio recorrente", category: "Farmácia" },
  // ── Bebidas (Praia / Veraneio) ──
  { name: "Cerveja", category: "Bebidas" },
  { name: "Água mineral", category: "Bebidas" },
  { name: "Refrigerante", category: "Bebidas" },
  { name: "Suco", category: "Bebidas" },
  { name: "Água de coco", category: "Bebidas" },
  { name: "Gelo", category: "Bebidas" },
  // ── Churrasqueira ──
  { name: "Carvão", category: "Churrasqueira" },
  { name: "Linguiça", category: "Churrasqueira" },
  { name: "Costelinha", category: "Churrasqueira" },
  { name: "Farofa", category: "Churrasqueira" },
  { name: "Vinagrete", category: "Churrasqueira" },
  { name: "Pão de alho", category: "Churrasqueira" },
  { name: "Sal grosso", category: "Churrasqueira" },
  { name: "Milho", category: "Churrasqueira" },
  { name: "Mandioca", category: "Churrasqueira" },
  // ── Descartáveis ──
  { name: "Copo descartável", category: "Descartáveis" },
  { name: "Prato descartável", category: "Descartáveis" },
  { name: "Garfo descartável", category: "Descartáveis" },
  { name: "Guardanapo", category: "Descartáveis" },
  { name: "Palito", category: "Descartáveis" },
  { name: "Toalha umedecida", category: "Descartáveis" },
  { name: "Canudinho", category: "Descartáveis" },
  // ── Praia essencial ──
  { name: "Protetor solar", category: "Praia essencial" },
  { name: "Repelente", category: "Praia essencial" },
  { name: "Protetor labial", category: "Praia essencial" },
  { name: "Óculos de sol", category: "Praia essencial" },
  { name: "Toalha de praia", category: "Praia essencial" },
  { name: "Chinelo", category: "Praia essencial" },
  // ── Escritório / Empresa ──
  { name: "Cápsula de café", category: "Escritório / Empresa" },
  { name: "Adoçante", category: "Escritório / Empresa" },
  { name: "Leite em pó", category: "Escritório / Empresa" },
  { name: "Chá", category: "Escritório / Empresa" },
  { name: "Biscoito", category: "Escritório / Empresa" },
  { name: "Bala / Bombom", category: "Escritório / Empresa" },
  { name: "Achocolatado", category: "Escritório / Empresa" },
  { name: "Suco de caixinha", category: "Escritório / Empresa" },
  { name: "Caneta", category: "Escritório / Empresa" },
  { name: "Folha A4", category: "Escritório / Empresa" },
  { name: "Post-it", category: "Escritório / Empresa" },
  { name: "Grampo", category: "Escritório / Empresa" },
  { name: "Clipe", category: "Escritório / Empresa" },
  { name: "Fita adesiva", category: "Escritório / Empresa" },
  { name: "Pilha AA", category: "Escritório / Empresa" },
  { name: "Pilha AAA", category: "Escritório / Empresa" },
  { name: "Toner impressora", category: "Escritório / Empresa" },
  { name: "Envelope", category: "Escritório / Empresa" },
  { name: "Sabonete líquido", category: "Escritório / Empresa" },
  { name: "Álcool gel", category: "Escritório / Empresa" },
  { name: "Desodorizador", category: "Escritório / Empresa" },
  { name: "Copo descartável (empresa)", category: "Escritório / Empresa" },
  { name: "Papel toalha (empresa)", category: "Escritório / Empresa" },
  { name: "Garrafa de água", category: "Escritório / Empresa" },
  // ── Utilidades ──
  { name: "Pilha", category: "Utilidades" },
  { name: "Vela", category: "Utilidades" },
  { name: "Isqueiro", category: "Utilidades" },
  { name: "Fósforo", category: "Utilidades" },
  { name: "Lâmpada", category: "Utilidades" },
  // ── Mais alimentos comuns ──
  { name: "Iogurte", category: "Alimentos" },
  { name: "Margarina", category: "Alimentos" },
  { name: "Requeijão", category: "Alimentos", aliases: ["catupiry"] },
  { name: "Biscoito", category: "Alimentos", aliases: ["bolacha"] },
  { name: "Maionese", category: "Alimentos" },
  { name: "Ketchup", category: "Alimentos", aliases: ["catchup"] },
  { name: "Mostarda", category: "Alimentos" },
  { name: "Atum", category: "Alimentos" },
  { name: "Sardinha", category: "Alimentos" },
  { name: "Milho em lata", category: "Alimentos" },
  { name: "Ervilha", category: "Alimentos" },
  { name: "Extrato de tomate", category: "Alimentos", aliases: ["massa de tomate"] },
  { name: "Aveia", category: "Alimentos" },
  { name: "Tapioca", category: "Alimentos" },
  { name: "Fubá", category: "Alimentos" },
  { name: "Azeite", category: "Alimentos" },
  { name: "Vinagre", category: "Alimentos" },
  { name: "Tempero pronto", category: "Alimentos", aliases: ["caldo", "tempero"] },
  { name: "Achocolatado em pó", category: "Alimentos", aliases: ["nescau", "toddy"] },
  { name: "Gelatina", category: "Alimentos" },
  { name: "Tomate", category: "Alimentos" },
  { name: "Banana", category: "Alimentos" },
  { name: "Maçã", category: "Alimentos" },
  { name: "Cenoura", category: "Alimentos" },
  { name: "Linguiça toscana", category: "Alimentos" },
  { name: "Salsicha", category: "Alimentos" },
  // ── Mais limpeza ──
  { name: "Lustra móveis", category: "Limpeza" },
  { name: "Limpa vidro", category: "Limpeza" },
  { name: "Desengordurante", category: "Limpeza" },
  { name: "Pano de chão", category: "Limpeza" },
  { name: "Pano de prato", category: "Limpeza" },
  { name: "Inseticida", category: "Limpeza" },
  { name: "Sabão líquido", category: "Limpeza" },
  // ── Mais higiene ──
  { name: "Fio dental", category: "Higiene" },
  { name: "Cotonete", category: "Higiene" },
  { name: "Lâmina de barbear", category: "Higiene", aliases: ["gilete", "aparelho de barbear"] },
  { name: "Espuma de barbear", category: "Higiene" },
  { name: "Hidratante", category: "Higiene" },
  { name: "Enxaguante bucal", category: "Higiene", aliases: ["listerine"] },
];

// Apelidos extras por NOME (sem precisar editar cada item acima). Cobre como as
// pessoas digitam de verdade (marcas, "pasta de dente", sem acento já é tratado).
const NAME_ALIASES: Record<string, string[]> = {
  "Creme dental": ["pasta de dente", "pasta dental"],
  "Papel higiênico": ["papel hig"],
  "Refrigerante": ["refri", "coca cola", "guarana"],
  "Sabão em pó": ["omo", "sabao po"],
  "Amaciante": ["downy", "comfort"],
  "Molho de tomate": ["molho tomate"],
  "Detergente": ["ype", "limpol"],
  "Água sanitária": ["candida", "agua sanitaria", "cloro"],
  "Papel toalha": ["papel cozinha"],
};

// Tira acento + maiúscula → "Açúcar" e "acucar" viram a mesma coisa.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Pontua a relevância (0 = não casa). Começa-com > palavra-começa > contém.
// Busca no nome + apelidos do item, tudo sem acento.
function matchScore(name: string, extraAliases: string[] | undefined, query: string): number {
  const q = normalize(query);
  if (!q) return 1; // sem busca → tudo passa (neutro)
  const fields = [name, ...(extraAliases ?? []), ...(NAME_ALIASES[name] ?? [])].map(normalize);
  let score = 0;
  for (const f of fields) {
    if (f === q) score = Math.max(score, 100);
    else if (f.startsWith(q)) score = Math.max(score, 80);
    else if (f.split(/\s+/).some((w) => w.startsWith(q))) score = Math.max(score, 60);
    else if (f.includes(q)) score = Math.max(score, 40);
  }
  return score;
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

  const filteredSuggested = SUGGESTED_ITEMS
    .map((s) => ({ s, score: matchScore(s.name, s.aliases, search) }))
    .filter(
      (x) =>
        x.score > 0 &&
        !existingItems.some((e) => normalize(e.name) === normalize(x.s.name))
    )
    .sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name, "pt-BR"))
    .map((x) => x.s);

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
      ? SUGGESTED_ITEMS.map((s) => ({ s, score: matchScore(s.name, s.aliases, newName) }))
          .filter((x) => x.score >= 40 && normalize(x.s.name) !== normalize(newName))
          .sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name, "pt-BR"))
          .slice(0, 5)
          .map((x) => x.s)
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
