"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { useItems } from "@/hooks/useItems";
import { useSubscription } from "@/hooks/useSubscription";
import { useRole } from "@/hooks/useRole";
import { ItemCard } from "@/components/items/ItemCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PlanLimitModal } from "@/components/shared/PlanLimitModal";
import { Header } from "@/components/layout/Header";
import { Item, ItemStatus, STATUS_LABELS } from "@/types";
import { Plus, Search, X, Share2, Zap, Pencil, Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type FilterStatus = "todos" | ItemStatus;

// A DESPENSA mostra só o que VOCÊ TEM em casa: "Tem" e "Acabando" (ainda tem um
// pouco). "Acabou" e "Comprar" saem da despensa e moram só na Lista de Compras.
const DESPENSA_STATUSES: ItemStatus[] = ["tem", "acabando"];

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "tem", label: "Tem" },
  { value: "acabando", label: "Acabando" },
];

export default function DespensaPage() {
  return (
    <Suspense fallback={null}>
      <DespensaContent />
    </Suspense>
  );
}

function DespensaContent() {
  const searchParams = useSearchParams();
  const { setAddItemModalOpen, setInitialStatus } = useAppStore();
  const { items, itemsByCategory, changeStatus, deleteItem, renameItem, editItem } = useItems();
  const { canAddItem, isPaid, itemCount, itemsRemaining, limits } = useSubscription();
  const { canManageItems, canEditCategories } = useRole();
  // Valida o ?filtro= JÁ no estado inicial — se vier um status que não existe na
  // despensa (ex.: ?filtro=acabou), cai pra "todos" em vez de tela vazia.
  const rawFilter = searchParams.get("filtro") as FilterStatus;
  const initialFilter: FilterStatus = filterOptions.some((f) => f.value === rawFilter)
    ? rawFilter
    : "todos";
  const [filter, setFilter] = useState<FilterStatus>(initialFilter);
  const [search, setSearch] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const { categories, setCategories } = useAppStore();
  const setToast = useAppStore((s) => s.setToast);

  // Ao marcar "Acabou"/"Comprar" na Despensa, o item SAI dela (vai pra Lista).
  // Avisa pra onde foi, pra não parecer que "sumiu". Estável (useCallback) pra
  // não quebrar o memo do ItemCard em lista grande.
  const handleDespensaStatus = useCallback(
    async (itemId: string, newStatus: ItemStatus) => {
      const ok = await changeStatus(itemId, newStatus);
      if (ok && (newStatus === "acabou" || newStatus === "comprar")) {
        setToast("Foi pra Lista de Compras 🛒");
      }
    },
    [changeStatus, setToast]
  );

  // Renomear CATEGORIA está desativado (mexia na categoria global de todos).
  // Renomear ITENS continua normal. Reativar quando houver categoria por casa.
  const CATEGORY_RENAME_ENABLED = false;

  async function handleRenameCategory(catId: string) {
    const trimmed = editingCatName.trim();
    if (!trimmed || savingCat) return;
    setSavingCat(true);
    try {
      const res = await fetch("/api/categories/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: catId, newName: trimmed }),
      });
      if (res.ok) {
        // Atualiza categorias no store
        setCategories(categories.map(c => c.id === catId ? { ...c, name: trimmed } : c));
        setEditingCat(null);
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao renomear categoria");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setSavingCat(false);
    }
  }

  // Sincroniza filtro quando URL muda (ex: vindo da Home). Sem param → preserva
  // o filtro atual (não reseta). Param inválido (ex.: link velho ?filtro=acabou)
  // → cai em "todos" em vez de deixar um filtro fantasma fora de sincronia.
  useEffect(() => {
    const urlFilter = searchParams.get("filtro");
    if (!urlFilter) return;
    const valid = filterOptions.some((f) => f.value === urlFilter);
    setFilter(valid ? (urlFilter as FilterStatus) : "todos");
  }, [searchParams]);
  const [showPlanLimit, setShowPlanLimit] = useState(false);

  // Memoizado: só refiltra quando itens/filtro/busca mudam (não a cada render).
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        // Só Tem + Acabando entram na Despensa (Acabou/Comprar vão pra Lista).
        if (!DESPENSA_STATUSES.includes(item.status)) return false;
        const matchStatus = filter === "todos" || item.status === filter;
        const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      }),
    [items, filter, search]
  );

  const filteredByCategory = useMemo(
    () =>
      filtered.reduce<Record<string, Item[]>>((acc, item) => {
        const cat = item.category?.name ?? "Outros";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {}),
    [filtered]
  );

  // Contagem da DESPENSA (só Tem + Acabando), independente da busca/filtro — pro
  // header bater com o que está visível (Acabou/Comprar saíram pra Lista).
  const despensaCount = useMemo(
    () => items.filter((i) => DESPENSA_STATUSES.includes(i.status)).length,
    [items]
  );

  function openAdd() {
    if (!canAddItem) {
      setShowPlanLimit(true);
      return;
    }
    // Adicionando pela Despensa → padrão "Tem em casa" (está abastecendo).
    // O usuário pode trocar o status no formulário.
    setInitialStatus("tem");
    setAddItemModalOpen(true);
  }

  return (
    <div>
      <Header
        icon={<Package size={20} />}
        title="Despensa"
        subtitle={isPaid ? `${despensaCount} itens` : `${itemCount}/${limits.max_items} itens`}
        right={
          canManageItems ? (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              <Plus size={16} />
              Adicionar
            </button>
          ) : undefined
        }
      />

      <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
        {/* Aviso de limite se perto ou no máximo */}
        {!isPaid && itemsRemaining <= 5 && itemsRemaining > 0 && (
          <Link href="/planos" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Zap size={16} className="text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              Restam <strong>{itemsRemaining} {itemsRemaining === 1 ? "item" : "itens"}</strong> no plano grátis. <span className="underline font-semibold">Faça upgrade</span> para itens ilimitados.
            </p>
          </Link>
        )}
        {!isPaid && itemsRemaining === 0 && (
          <Link href="/planos" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <Zap size={16} className="text-red-600 shrink-0" />
            <p className="text-xs text-red-800">
              Você atingiu o <strong>limite de {limits.max_items} itens</strong>. <span className="underline font-bold">Assine o Plano Família</span> para adicionar sem limites.
            </p>
          </Link>
        )}

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

        {/* Filtros de status — grid fixo sem scroll */}
        <div className="grid grid-cols-5 gap-1.5">
          {filterOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ease-out active:scale-[0.93] text-center",
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
            mascot={
              search ? "search"
              : items.length > 0 ? "done"
              : "happy"
            }
            title={
              search
                ? "Nenhum item encontrado"
                : items.length > 0 && filter === "acabando"
                ? "Tudo em dia por aqui!"
                : items.length > 0 && filter === "acabou"
                ? "Nada acabou, parabéns!"
                : items.length > 0 && filter === "comprar"
                ? "Lista de compras zerada!"
                : items.length > 0 && filter === "tem"
                ? "Nenhum item como 'Tem'"
                : "Sua despensa está vazia"
            }
            description={
              search
                ? `Nenhum item com "${search}"`
                : items.length > 0 && filter === "acabando"
                ? "Aproveite! Nenhum item está acabando. Mas vale uma revisão rápida na despensa. 😉"
                : items.length > 0 && filter === "acabou"
                ? "Ótimo controle! Sua casa está bem abastecida. Continue assim! 💚"
                : items.length > 0 && filter === "comprar"
                ? "Não há nada na fila de compras agora. Quando faltar algo, vai aparecer aqui."
                : items.length > 0 && filter === "tem"
                ? "Marque um item como 'Tem em casa' para ele aparecer aqui."
                : "Comece adicionando o que você já tem em casa. Depois é só marcar quando acabar!"
            }
            action={
              !search && items.length === 0 ? (
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
          Object.entries(filteredByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([category, catItems]) => {
            const catId = catItems[0].category?.id;
            const isEditingThis = editingCat === catId;
            return (
            <div key={category}>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                {isEditingThis ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs">{catItems[0].category?.icon}</span>
                    <input
                      autoFocus
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && catId) handleRenameCategory(catId);
                        if (e.key === "Escape") setEditingCat(null);
                      }}
                      className="flex-1 text-xs font-semibold text-gray-700 uppercase tracking-wide bg-white border-b-2 border-green-400 outline-none pb-0.5"
                      maxLength={40}
                    />
                    <button
                      onClick={() => catId && handleRenameCategory(catId)}
                      disabled={savingCat}
                      className="text-green-600 hover:text-green-700 p-0.5"
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => setEditingCat(null)}
                      className="text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {catItems[0].category?.icon} {category} ({catItems.length})
                    </p>
                    {CATEGORY_RENAME_ENABLED && canEditCategories && catId && (
                      <button
                        onClick={() => { setEditingCat(catId); setEditingCatName(category); }}
                        className="text-gray-300 hover:text-gray-500 transition-colors p-0.5"
                        title="Renomear categoria"
                      >
                        <Pencil size={11} />
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleDespensaStatus}
                    onEdit={canManageItems ? renameItem : undefined}
                    onEditFull={canManageItems ? editItem : undefined}
                    onDelete={canManageItems ? deleteItem : undefined}
                  />
                ))}
              </div>
            </div>
          );})
        )}
        {/* Banner de upgrade discreto para grátis */}
        {!isPaid && items.length > 0 && (
          <Link
            href="/planos"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-4 py-3.5 hover:from-green-100 hover:to-emerald-100 transition-all mt-2"
          >
            <Zap size={14} className="text-green-600" />
            <p className="text-xs text-green-800 font-semibold">
              Plano Família: itens ilimitados, convites, lembretes e mais — <span className="underline">a partir de R$ 3,32/mês</span>
            </p>
          </Link>
        )}

        <div className="h-4" />
      </div>

      <PlanLimitModal
        isOpen={showPlanLimit}
        onClose={() => setShowPlanLimit(false)}
        reason="items"
      />
    </div>
  );
}
