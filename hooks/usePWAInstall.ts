"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

function checkIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // Android / Desktop Chrome
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari
  if ((window.navigator as any).standalone === true) return true;
  // TWA (Trusted Web Activity)
  if (document.referrer.includes("android-app://")) return true;
  return false;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Se já está no modo standalone, o app está instalado
    if (checkIsStandalone()) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed) { setIsDismissed(true); return; }

    // Lê o prompt capturado globalmente antes do React montar
    const globalPrompt = (window as any).__pwaPrompt as BeforeInstallPromptEvent | null;
    if (globalPrompt) { setInstallPrompt(globalPrompt); setIsInstallable(true); }

    // Escuta caso o evento chegue depois
    const handler = () => {
      const p = (window as any).__pwaPrompt as BeforeInstallPromptEvent | null;
      if (p) { setInstallPrompt(p); setIsInstallable(true); }
    };
    window.addEventListener("pwa-prompt-ready", handler);

    // Escuta o evento de app instalado (Chrome dispara quando o usuário instala)
    const onInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      // Salva flag para não mostrar mais
      localStorage.setItem("pwa-installed", "1");
    };
    window.addEventListener("appinstalled", onInstalled);

    // Escuta mudança no display-mode (quando o app é aberto como standalone depois de instalar)
    const mql = window.matchMedia("(display-mode: standalone)");
    const onDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) onInstalled();
    };
    mql.addEventListener("change", onDisplayChange);

    // Verifica se já foi marcado como instalado antes
    if (localStorage.getItem("pwa-installed") === "1") {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("pwa-prompt-ready", handler);
      window.removeEventListener("appinstalled", onInstalled);
      mql.removeEventListener("change", onDisplayChange);
    };
  }, []);

  const showInstallPrompt = async () => {
    const prompt = installPrompt ?? ((window as any).__pwaPrompt as BeforeInstallPromptEvent | null);
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      localStorage.setItem("pwa-installed", "1");
    }
  };

  const dismiss = () => {
    localStorage.setItem("pwa-banner-dismissed", "1");
    setIsDismissed(true);
    setIsInstallable(false);
  };

  return {
    isInstallable: isInstallable && !isDismissed && !isInstalled,
    isInstalled,
    showInstallPrompt,
    dismiss,
  };
}
