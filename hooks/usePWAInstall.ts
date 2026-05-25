"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed) { setIsDismissed(true); return; }
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Lê o prompt capturado globalmente antes do React montar
    const globalPrompt = (window as any).__pwaPrompt as BeforeInstallPromptEvent | null;
    if (globalPrompt) { setInstallPrompt(globalPrompt); setIsInstallable(true); }

    // Escuta caso o evento chegue depois
    const handler = () => {
      const p = (window as any).__pwaPrompt as BeforeInstallPromptEvent | null;
      if (p) { setInstallPrompt(p); setIsInstallable(true); }
    };
    window.addEventListener("pwa-prompt-ready", handler);
    return () => window.removeEventListener("pwa-prompt-ready", handler);
  }, []);

  const showInstallPrompt = async () => {
    const prompt = installPrompt ?? ((window as any).__pwaPrompt as BeforeInstallPromptEvent | null);
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstallable(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem("pwa-banner-dismissed", "1");
    setIsDismissed(true);
    setIsInstallable(false);
  };

  return { isInstallable: isInstallable && !isDismissed, showInstallPrompt, dismiss };
}
