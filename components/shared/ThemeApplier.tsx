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
 * - Dentro do app (rotas APP_ROUTES): aplica .dark se o usuario escolheu
 * - Fora do app (landing, login, cadastro, termos, privacidade): sempre claro
 *
 * Reage a mudancas de pathname para navegacao client-side.
 */
export function ThemeApplier() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      const html = document.documentElement;
      const isAppRoute = APP_ROUTES.some(
        (r) => pathname === r || pathname.startsWith(r + "/")
      );

      if (isAppRoute && localStorage.getItem("acabou_theme") === "dark") {
        if (!html.classList.contains("dark")) html.classList.add("dark");
      } else {
        if (html.classList.contains("dark")) html.classList.remove("dark");
      }
    } catch { /* localStorage bloqueado */ }
  }, [pathname]);

  return null;
}
