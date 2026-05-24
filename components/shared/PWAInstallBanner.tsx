"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

// Detecta iOS (iPhone, iPad, iPod)
function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Detecta se já está instalado como PWA (standalone)
function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as any).standalone === true;
}

export function PWAInstallBanner() {
  const { isInstallable, showInstallPrompt, dismiss } = usePWAInstall();
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [iosStep, setIosStep] = useState(0);

  useEffect(() => {
    // Mostra o banner iOS só se: for iOS + não instalado + não dispensado antes
    const dismissed = localStorage.getItem("pwa-ios-dismissed");
    if (isIOS() && !isStandalone() && !dismissed) {
      // Aguarda 3s para não mostrar imediatamente ao abrir
      const t = setTimeout(() => setShowIOSBanner(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  function dismissIOS() {
    localStorage.setItem("pwa-ios-dismissed", "1");
    setShowIOSBanner(false);
  }

  // ── Banner iOS — instrução manual ──────────────────────────
  if (showIOSBanner) {
    const steps = [
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        ),
        text: 'Toque em "Compartilhar" (ícone ↑ na barra do Safari)',
      },
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        ),
        text: 'Selecione "Adicionar à Tela de Início"',
      },
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ),
        text: 'Toque em "Adicionar" — pronto! 🎉',
      },
    ];

    return (
      <div className="fixed bottom-20 left-4 right-4 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Download size={16} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Instale o Acabou?</p>
                <p className="text-green-100 text-xs">Acesse direto da tela inicial</p>
              </div>
            </div>
            <button onClick={dismissIOS} className="text-white/70 hover:text-white p-1">
              <X size={18} />
            </button>
          </div>

          {/* Passos */}
          <div className="px-4 py-3 space-y-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all ${
                  i === iosStep ? "opacity-100" : i < iosStep ? "opacity-40" : "opacity-30"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  i < iosStep ? "bg-green-100 text-green-600" : i === iosStep ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {i < iosStep ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-tight">{step.text}</p>
              </div>
            ))}
          </div>

          {/* Botões de navegação */}
          <div className="px-4 pb-4 flex gap-2">
            {iosStep < steps.length - 1 ? (
              <button
                onClick={() => setIosStep((s) => s + 1)}
                className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-green-700 transition-colors"
              >
                Próximo passo →
              </button>
            ) : (
              <button
                onClick={dismissIOS}
                className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-green-700 transition-colors"
              >
                ✅ Entendido!
              </button>
            )}
            <button
              onClick={dismissIOS}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Banner Android / Desktop Chrome ───────────────────────
  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-green-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl shrink-0">
            <Download size={20} />
          </div>
          <div>
            <p className="font-bold text-sm">Instale o Acabou?</p>
            <p className="text-xs text-green-100 leading-tight">
              Acesse direto da sua tela inicial, como um app
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={showInstallPrompt}
            className="bg-white text-green-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-green-50 transition-colors"
          >
            Instalar
          </button>
          <button onClick={dismiss} className="text-white/70 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
