"use client";

import { useEffect } from "react";

/**
 * Garante que o tema (claro/escuro) escolhido pelo usuário esteja
 * sempre aplicado, mesmo se o React sobrescrever a classe do <html>
 * durante a hidratação.
 *
 * O script inline no root layout aplica .dark antes do paint, mas
 * em alguns casos o React pode substituir o className durante hydrate.
 * Este componente roda um useEffect que reaplica a classe sempre.
 */
export function ThemeApplier() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem("acabou_theme");
      const html = document.documentElement;
      if (theme === "dark") {
        if (!html.classList.contains("dark")) html.classList.add("dark");
      } else {
        if (html.classList.contains("dark")) html.classList.remove("dark");
      }
    } catch { /* localStorage bloqueado */ }
  }, []);

  return null;
}
