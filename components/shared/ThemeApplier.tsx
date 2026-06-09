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
        // Barra de status: força a cor desejada (want) ESCREVENDO o mesmo content
        // nos DOIS metas com media (em layout.tsx). Como ambos ficam com a mesma
        // cor, qualquer que seja o tema do SISTEMA que o Chrome use pra escolher, a
        // barra fica certa: navy no escuro do app; branco no claro/landing (mesmo
        // sob sistema escuro). Apendar um meta SEM media depois NÃO venceria
        // (first-match-wins). ANTI-FLASH: só altera quando o valor MUDA → na troca
        // de aba (mesmo tema) não toca, não pisca.
        const want = useDark ? "#0f172a" : "#FFFFFF";
        document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
          if (m.getAttribute("content") !== want) m.setAttribute("content", want);
        });
      } catch { /* localStorage bloqueado */ }
    }

    apply();
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", apply);
    // Toggle manual de tema dispara este evento → a barra de status atualiza NA
    // HORA, sem esperar a próxima navegação.
    window.addEventListener("acabou-theme", apply);
    return () => {
      mql.removeEventListener("change", apply);
      window.removeEventListener("acabou-theme", apply);
    };
  }, [pathname]);

  return null;
}
