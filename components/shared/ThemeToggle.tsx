"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

// Seletor de tema: Claro · Escuro · Sistema (feedback dos testadores).
// "Sistema" = REMOVE a preferência salva → o ThemeApplier (e o script inline do
// layout) voltam a SEGUIR o aparelho, ao vivo (matchMedia). NÃO mexe na lógica
// sensível do tema/barra de status — só na escolha do usuário.
type ThemeMode = "light" | "dark" | "system";

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "Claro", Icon: Sun },
  { mode: "dark", label: "Escuro", Icon: Moon },
  { mode: "system", label: "Sistema", Icon: Smartphone },
];

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("acabou_theme");
      setMode(stored === "dark" ? "dark" : stored === "light" ? "light" : "system");
    } catch {}
  }, []);

  function choose(next: ThemeMode) {
    setMode(next);
    try {
      if (next === "system") localStorage.removeItem("acabou_theme");
      else localStorage.setItem("acabou_theme", next);
    } catch {}
    // O ThemeApplier ouve este evento e reaplica NA HORA (classe .dark + barra de
    // status). No "system" ele volta a seguir o aparelho — e continua ao vivo.
    window.dispatchEvent(new Event("acabou-theme"));
  }

  if (!mounted) return null;

  return (
    <div className={cn("px-5 py-4", className)}>
      <p className="font-medium text-gray-900 text-sm mb-2.5">Tema</p>
      <div className="flex gap-2">
        {OPTIONS.map((o) => {
          const active = mode === o.mode;
          return (
            <button
              key={o.mode}
              onClick={() => choose(o.mode)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-transform duration-100 active:scale-[0.96]",
                active
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              )}
            >
              <o.Icon size={18} />
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
