"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";

/**
 * Toast global. Lê do store (setToast) e some sozinho. Usado pra avisar falhas
 * tratadas (rede) E pra confirmar ações (ex.: "🛒 X entrou na sua Lista" com um
 * botão "Ver" que leva pra Lista). A AÇÃO é opcional → avisos de erro seguem só
 * texto, sem botão (retrocompatível).
 */
export function GlobalToast() {
  const toast = useAppStore((s) => s.toast);
  const toastAction = useAppStore((s) => s.toastAction);
  const setToast = useAppStore((s) => s.setToast);
  const router = useRouter();

  useEffect(() => {
    if (!toast) return;
    // Toast com ação ("Ver") fica um pouco mais no ar (dá tempo de tocar).
    const t = setTimeout(() => setToast(null), toastAction ? 5000 : 3500);
    return () => clearTimeout(t);
  }, [toast, toastAction, setToast]);

  if (!toast) return null;

  return (
    <div className="fixed left-0 right-0 bottom-24 z-[150] flex justify-center px-4 pointer-events-none">
      <div className="animate-toast-up bg-gray-900 text-white text-sm font-semibold px-5 py-3.5 rounded-2xl shadow-xl max-w-xs flex items-center gap-3">
        <span className={"flex-1 leading-snug " + (toastAction ? "text-left" : "text-center")}>
          {toast}
        </span>
        {toastAction && (
          <button
            onClick={() => {
              router.push(toastAction.href);
              setToast(null);
            }}
            className="shrink-0 bg-white/15 hover:bg-white/25 text-white font-bold px-3 py-1.5 rounded-xl pointer-events-auto transition-transform duration-100 active:scale-95"
          >
            {toastAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
