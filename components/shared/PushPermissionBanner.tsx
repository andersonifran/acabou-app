"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, X } from "lucide-react";

export function PushPermissionBanner() {
  const { state, subscribe, isSupported } = usePushNotifications();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // A HOME tem um card PERMANENTE de ativar (não some) → lá o banner não aparece,
  // pra não duplicar. Nas outras telas o banner segue como nudge leve (3 dias).
  if (pathname === "/home") return null;

  // Não mostra se: não suportado, já inscrito, negado, ou dispensado
  if (!isSupported || state !== "prompt" || dismissed) return null;

  // Verifica se já dispensou recentemente (não mostrar toda hora)
  if (typeof window !== "undefined") {
    const lastDismissed = localStorage.getItem("push_banner_dismissed");
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 3) return null; // Espera 3 dias antes de mostrar de novo
    }
  }

  async function handleEnable() {
    setLoading(true);
    await subscribe();
    setLoading(false);
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("push_banner_dismissed", Date.now().toString());
  }

  return (
    <div className="mx-4 mt-3 bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
        <Bell size={20} className="text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Não perca nada importante 🔔</p>
        <p className="text-xs text-gray-600 mt-0.5">
          Te avisamos na hora de comprar e quando algo estiver acabando.
        </p>
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-full hover:bg-green-700 transition-transform duration-100 disabled:opacity-50 active:scale-[0.95]"
          >
            {loading ? "Ativando..." : "Ativar"}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-transform duration-100 active:scale-[0.96]"
          >
            Agora não
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="p-1 text-gray-400 hover:text-gray-600">
        <X size={16} />
      </button>
    </div>
  );
}
