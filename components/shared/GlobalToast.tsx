"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";

/**
 * Toast global (ex.: "Sem conexão — tente de novo"). Lê do store (setToast) e
 * some sozinho. Usado pra avisar falhas tratadas (rede) sem estourar erro.
 */
export function GlobalToast() {
  const toast = useAppStore((s) => s.toast);
  const setToast = useAppStore((s) => s.setToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div className="fixed left-0 right-0 bottom-24 z-[150] flex justify-center px-4 pointer-events-none">
      <div className="animate-toast-up bg-gray-900 text-white text-sm font-semibold px-5 py-3.5 rounded-2xl shadow-xl max-w-xs text-center">
        {toast}
      </div>
    </div>
  );
}
