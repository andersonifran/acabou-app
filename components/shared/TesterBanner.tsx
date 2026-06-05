"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Link de opt-in do teste fechado (Play Console → Teste fechado → Testadores)
const OPT_IN_URL = "https://play.google.com/apps/testing/br.com.acabouapp.www.twa?hl=pt-BR";
const DISMISS_KEY = "tester_banner_dismissed_v1";

/**
 * Banner TEMPORÁRIO de recrutamento de testadores (campanha do teste fechado
 * na Play Store). Convida os usuários atuais a virarem testadores oficiais.
 * Botão profissional (link "por trás") + dispensável. Remover após o lançamento.
 */
export function TesterBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(DISMISS_KEY)) setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="mx-4 mt-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-4 text-white shadow-lg shadow-green-600/25">
      <button
        onClick={dismiss}
        aria-label="Dispensar"
        className="absolute right-2 top-2 p-1 text-white/70 hover:text-white"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3 pr-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/google-play-icon.png" alt="Google Play" width={32} height={32} className="h-8 w-8" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug">
            Ajude o Acabou? a chegar na Google Play!
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-green-50">
            Vire <strong>testador oficial</strong> em 1 minutinho. Sua ajuda
            libera o app pra milhões — e a gente agradece DEMAIS! 💚
          </p>
        </div>
      </div>

      <a
        href={OPT_IN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-50 active:scale-[0.99]"
      >
        {/* Triângulo "play" (vibe Google Play) */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
        Quero ser testador
      </a>

      <p className="mt-1.5 text-center text-[10px] text-green-100">
        🔒 Teste oficial pelo Google Play · leva 1 min
      </p>
    </div>
  );
}
