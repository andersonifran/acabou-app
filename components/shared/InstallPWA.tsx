"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detecta iOS (Safari não dispara beforeinstallprompt)
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // Captura evento de instalação (Chrome/Edge/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setShown(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Mostrar dica iOS após 3s na página
  useEffect(() => {
    if (isIOS && !dismissed) {
      const t = setTimeout(() => setShown(true), 3000);
      return () => clearTimeout(t);
    }
  }, [isIOS, dismissed]);

  if (isInstalled || dismissed || !shown) return null;

  async function handleInstall() {
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setPrompt(null);
      setShown(false);
    }
  }

  // Banner iOS com instrução
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
        <span className="text-2xl">📲</span>
        <div className="flex-1">
          <p className="font-bold text-sm mb-0.5">Instale o Acabou? no seu iPhone</p>
          <p className="text-gray-300 text-xs leading-relaxed">
            Toque em <strong>Compartilhar</strong> <span className="text-base">⎙</span> e depois em{" "}
            <strong>"Adicionar à Tela de Início"</strong>
          </p>
        </div>
        <button onClick={() => { setDismissed(true); setShown(false); }} className="text-gray-400 hover:text-white p-1 -mt-1">
          <X size={18} />
        </button>
      </div>
    );
  }

  // Banner Chrome/Android/Desktop
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm mx-auto">
      <span className="text-2xl">📲</span>
      <div className="flex-1">
        <p className="font-bold text-sm mb-0.5">Instalar Acabou?</p>
        <p className="text-gray-300 text-xs">Funciona offline · Acesso rápido</p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-green-500 hover:bg-green-400 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5"
      >
        <Download size={14} />
        Instalar
      </button>
      <button onClick={() => { setDismissed(true); setShown(false); }} className="text-gray-400 hover:text-white p-1">
        <X size={16} />
      </button>
    </div>
  );
}

// Botão estático para a landing page
export function InstallButton({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    const ua = navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isInstalled) {
    return (
      <span className={`inline-flex items-center gap-2 text-green-600 font-semibold text-sm ${className}`}>
        ✅ Aplicativo já instalado
      </span>
    );
  }

  async function handleClick() {
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
    } else if (isIOS) {
      setShowIOSHint(true);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
      >
        <Download size={16} />
        Instalar no celular / PC
      </button>
      {showIOSHint && (
        <p className="text-green-200 text-xs mt-2 text-center">
          No Safari: toque em <strong>⎙ Compartilhar</strong> → <strong>"Adicionar à Tela de Início"</strong>
        </p>
      )}
    </div>
  );
}
