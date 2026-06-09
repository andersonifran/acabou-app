"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const APP_ROUTES = [
  "/home",
  "/despensa",
  "/lista",
  "/casa",
  "/configuracoes",
  "/planos",
  "/feedback",
];

/**
 * Gerencia o tema (claro/escuro) em TODAS as rotas:
 * - Dentro do app (rotas APP_ROUTES): SEGUE o tema do CELULAR (prefers-color-scheme);
 *   o botão do app (acabou_theme no localStorage) é override manual.
 * - Fora do app (landing, login, cadastro, termos, privacidade): sempre claro.
 *
 * Reage a mudancas de pathname (navegacao) E ao usuario trocar o tema do celular
 * com o app aberto (matchMedia change) — para a barra do sistema e o app baterem.
 */
export function ThemeApplier() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const isAppRoute = APP_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );

    function apply() {
      try {
        const stored = localStorage.getItem("acabou_theme");
        const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        // Segue o celular; botão do app (acabou_theme) é override manual.
        const useDark = isAppRoute && (stored === "dark" || (stored == null && sysDark));
        if (useDark) {
          if (!html.classList.contains("dark")) html.classList.add("dark");
        } else {
          if (html.classList.contains("dark")) html.classList.remove("dark");
        }
        // NÃO mexer no theme-color aqui: re-setar a meta na navegação fazia a
        // barra de status piscar branco ao trocar de aba. A barra escura no app
        // da Loja vem da config NATIVA (themeColorDark no .aab), sem JS.
      } catch { /* localStorage bloqueado */ }
    }

    apply();
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [pathname]);

  return null;
}
