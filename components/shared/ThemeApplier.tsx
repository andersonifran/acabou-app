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
    try {
      const html = document.documentElement;
      const isAppRoute = APP_ROUTES.some(
        (r) => pathname === r || pathname.startsWith(r + "/")
      );
      // Só dark se o usuário escolheu explicitamente (revertido o "seguir sistema").
      if (isAppRoute && localStorage.getItem("acabou_theme") === "dark") {
        if (!html.classList.contains("dark")) html.classList.add("dark");
      } else {
        if (html.classList.contains("dark")) html.classList.remove("dark");
      }
    } catch { /* localStorage bloqueado */ }
  }, [pathname]);

  return null;
}
