"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);

    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("acabou_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("acabou_theme", "light");
    }
  }

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center justify-between w-full px-5 py-4 hover:bg-gray-50 transition-colors",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isDark ? "bg-indigo-100" : "bg-amber-100"
        )}>
          {isDark ? (
            <Moon size={16} className="text-indigo-600" />
          ) : (
            <Sun size={16} className="text-amber-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 text-sm">Modo escuro</p>
          <p className="text-xs text-gray-500">{isDark ? "Ativado" : "Desativado"}</p>
        </div>
      </div>

      {/* Toggle switch */}
      <div
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          isDark ? "bg-green-600" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            isDark ? "translate-x-6" : "translate-x-1"
          )}
        />
      </div>
    </button>
  );
}
