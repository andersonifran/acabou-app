"use client";

import { useState, useRef, useEffect, memo } from "react";
import { Item, ItemStatus } from "@/types";
import { StatusButtons } from "./StatusButtons";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn, truncate } from "@/lib/utils";
import { ChevronDown, ChevronUp, MoreVertical, Pencil, Trash2, Check, X } from "lucide-react";

interface ItemCardProps {
  item: Item;
  onStatusChange: (itemId: string, newStatus: ItemStatus) => Promise<void>;
  onMarkPurchased?: (itemId: string) => void;
  showPurchaseButton?: boolean;
  compact?: boolean;
  onEdit?: (itemId: string, newName: string) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
}

export const ItemCard = memo(function ItemCard({
  item,
  onStatusChange,
  onMarkPurchased,
  showPurchaseButton = false,
  compact = false,
  onEdit,
  onDelete,
}: ItemCardProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Fecha menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Foca input ao entrar no modo de edição
  useEffect(() => {
    if (editMode && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editMode]);

  async function handleStatusChange(status: ItemStatus) {
    if (loading) return;
    setLoading(true);
    try {
      await onStatusChange(item.id, status);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!onEdit || !editName.trim()) return;
    setLoading(true);
    try {
      await onEdit(item.id, editName);
      setEditMode(false);
    } catch {
      setEditName(item.name);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setLoading(true);
    try {
      await onDelete(item.id);
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  }

  const hasActions = !!(onEdit || onDelete);

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-xl border border-gray-100 shadow-sm transition-all",
          loading && "opacity-70"
        )}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              {editMode ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={editInputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") { setEditMode(false); setEditName(item.name); }
                    }}
                    className="flex-1 text-sm font-semibold text-gray-900 border-b-2 border-green-400 bg-transparent outline-none pb-0.5"
                    maxLength={100}
                  />
                  <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700 shrink-0">
                    <Check size={16} strokeWidth={2.5} />
                  </button>
                  <button onClick={() => { setEditMode(false); setEditName(item.name); }} className="text-gray-400 hover:text-gray-600 shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{item.name}</span>
                  {item.is_recurring && (
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      🔄 Recorrente
                    </span>
                  )}
                </div>
              )}
              {item.category && (
                <span className="text-xs text-gray-500 mt-0.5 block">
                  {item.category.icon} {item.category.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!editMode && <StatusBadge status={item.status} />}
              {(item.note || item.quantity_text) && !editMode && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                >
                  {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              )}
              {hasActions && !editMode && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 -mr-1"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-6 z-20 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
                      {onEdit && (
                        <button
                          onClick={() => { setEditMode(true); setMenuOpen(false); }}
                          className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil size={14} className="text-gray-500" />
                          Renomear
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}
                          className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {expanded && (item.note || item.quantity_text) && (
            <div className="mb-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              {item.quantity_text && <span className="font-medium">{item.quantity_text}</span>}
              {item.note && item.quantity_text && " · "}
              {item.note && <span>{item.note}</span>}
            </div>
          )}

          {!compact && !editMode && (
            <StatusButtons
              currentStatus={item.status}
              onChangeStatus={handleStatusChange}
              disabled={loading}
            />
          )}

          {showPurchaseButton && !editMode && (
            <button
              onClick={() => onMarkPurchased?.(item.id)}
              disabled={loading}
              className="mt-3 w-full bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              ✓ Comprado
            </button>
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Excluir item?</h3>
            <p className="text-gray-600 mb-5 text-sm">
              Tem certeza que quer remover <strong>{item.name}</strong> da despensa? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {loading ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
