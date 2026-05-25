"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Loader2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "pwa-install-state";
const MAX_DISMISSALS = 3;       // Para de mostrar após 3 fechamentos
const COOLDOWN_HOURS = 24;      // Volta após 24h se fechou menos de 3x

export function InstallPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Já instalado como PWA — nunca mostra
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Checa histórico de fechamentos
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { count, lastDismissed } = JSON.parse(stored);
        if (count >= MAX_DISMISSALS) return; // Fechou 3x — respeita e para
        const hoursSince = (Date.now() - lastDismissed) / 1000 / 3600;
        if (hoursSince < COOLDOWN_HOURS) return; // Ainda em cooldown de 24h
      }
    } catch {}

    // Detecta dispositivo
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    const android = /android/i.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    // Verifica se já capturamos o prompt globalmente (antes do React montar)
    if ((window as any).__pwaPrompt) {
      setPrompt((window as any).__pwaPrompt);
    }
    if ((window as any).__pwaInstalled) {
      setIsInstalled(true);
      return;
    }

    // Também escuta caso dispare depois do React montar
    const handler = () => {
      if ((window as any).__pwaPrompt) {
        setPrompt((window as any).__pwaPrompt);
      }
    };
    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("pwa-prompt-ready", handler);
    window.addEventListener("pwa-installed", installedHandler);

    // Mostra após 4s (deixa o usuário ler o headline)
    const timer = setTimeout(() => setVisible(true), 4000);

    // Também mostra quando rola 60% da página (engajamento)
    const handleScroll = () => {
      const scrollPct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      if (scrollPct > 0.6) {
        setVisible(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("pwa-prompt-ready", handler);
      window.removeEventListener("pwa-installed", installedHandler);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    setShowIOSSteps(false);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const { count = 0 } = stored ? JSON.parse(stored) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        count: count + 1,
        lastDismissed: Date.now(),
      }));
    } catch {}
  }

  async function handleInstall() {
    // Re-checa o prompt global a cada clique (pode ter chegado depois da montagem)
    const currentPrompt = prompt ?? ((window as any).__pwaPrompt as BeforeInstallPromptEvent | null);
    if (!currentPrompt) setPrompt(currentPrompt);

    if (currentPrompt) {
      setInstalling(true);
      try {
        await currentPrompt.prompt();
        const { outcome } = await currentPrompt.userChoice;
        if (outcome === "accepted") {
          setIsInstalled(true);
          setVisible(false);
        }
      } finally {
        setInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSSteps(true);
    } else {
      // Android: mostra spinner por 1s enquanto tenta, depois some
      setInstalling(true);
      setTimeout(() => setInstalling(false), 1000);
    }
  }

  if (isInstalled || !visible) return null;

  // ── iOS: passo a passo ─────────────────────────────────────
  if (showIOSSteps) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-green-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-white" />
              <p className="font-bold text-white text-sm">Como instalar no iPhone</p>
            </div>
            <button onClick={dismiss} className="text-white/70 hover:text-white p-1">
              <X size={18} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {[
              { n: 1, text: 'Toque em "Compartilhar" ⎙ na barra do Safari' },
              { n: 2, text: 'Selecione "Adicionar à Tela de Início"' },
              { n: 3, text: 'Toque em "Adicionar" — pronto! 🎉' },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {step.n}
                </div>
                <p className="text-sm text-gray-700">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={dismiss}
              className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-green-700 transition-colors"
            >
              ✅ Entendido, vou instalar!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Banner principal ────────────────────────────────────────
  const buttonLabel = prompt
    ? "Instalar agora — é grátis"
    : isIOS
    ? "Ver como instalar no iPhone →"
    : "Instalar agora — é grátis";

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-green-600 text-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header com X */}
        <div className="flex items-start justify-between px-4 pt-4 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <Smartphone size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Instale o Acabou? grátis</p>
              <p className="text-green-100 text-xs mt-0.5 leading-tight">
                Acesso rápido · Funciona offline
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-white/50 hover:text-white p-1 -mr-1 transition-colors"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Benefícios rápidos — só no desktop */}
        <div className="hidden sm:flex px-4 pt-3 pb-0 gap-3 text-xs text-green-100">
          <span>📲 Como app nativo</span>
          <span>📴 Offline</span>
          <span>💬 Compartilha pelo Zap</span>
        </div>

        {/* Botão CTA */}
        <div className="p-4 pt-3">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full bg-white text-green-700 font-bold py-2.5 sm:py-3 rounded-xl text-sm hover:bg-green-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-80"
          >
            {installing
              ? <><Loader2 size={16} className="animate-spin" /> Instalando...</>
              : <><Download size={16} /> {buttonLabel}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Botão estático para o CTA da landing page ──────────────────
export function InstallButton({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    const ua = navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream);

    // Lê o prompt capturado globalmente antes do React montar
    if ((window as any).__pwaPrompt) {
      setPrompt((window as any).__pwaPrompt);
    }
    if ((window as any).__pwaInstalled) {
      setIsInstalled(true);
      return;
    }

    const handler = () => {
      if ((window as any).__pwaPrompt) setPrompt((window as any).__pwaPrompt);
    };
    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("pwa-prompt-ready", handler);
    window.addEventListener("pwa-installed", installedHandler);
    return () => {
      window.removeEventListener("pwa-prompt-ready", handler);
      window.removeEventListener("pwa-installed", installedHandler);
    };
  }, []);

  if (isInstalled) {
    return (
      <span className={`inline-flex items-center gap-2 text-green-200 font-semibold text-sm ${className}`}>
        ✅ Aplicativo já instalado
      </span>
    );
  }

  async function handleClick() {
    const currentPrompt = prompt ?? ((window as any).__pwaPrompt as BeforeInstallPromptEvent | null);
    if (currentPrompt && !prompt) setPrompt(currentPrompt);

    if (currentPrompt) {
      setInstalling(true);
      try {
        await currentPrompt.prompt();
        const { outcome } = await currentPrompt.userChoice;
        if (outcome === "accepted") setIsInstalled(true);
      } finally {
        setInstalling(false);
      }
    } else {
      setInstalling(true);
      setTimeout(() => setInstalling(false), 800);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={installing}
        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm active:scale-95 disabled:opacity-70"
      >
        {installing
          ? <><Loader2 size={16} className="animate-spin" /> Instalando...</>
          : <><Download size={16} /> Instalar no celular / PC</>
        }
      </button>
    </div>
  );
}
