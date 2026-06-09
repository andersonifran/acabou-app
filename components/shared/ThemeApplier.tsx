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
        // Barra de status (topo) segue o tema do app. Só altera quando MUDA de
        // verdade (senão re-setava a cada troca de aba → piscava a tarja branca).
        const m = document.querySelector('meta[name="theme-color"]');
        const want = useDark ? "#0f172a" : "#FFFFFF";
        if (m && m.getAttribute("content") !== want) m.setAttribute("content", want);
      } catch { /* localStorage bloqueado */ }
    }

    apply();
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [pathname]);

  return null;
}
