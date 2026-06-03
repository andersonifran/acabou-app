"use client";

import { usePathname } from "next/navigation";

/**
 * Transição de página estilo nativo (slide com bounce).
 * Entre as ABAS, desliza na HORIZONTAL conforme a direção:
 *  - avançar (aba à direita) → entra da direita
 *  - voltar (aba à esquerda) → entra da esquerda
 * Outras telas usam um slide-up suave.
 */
const TAB_ORDER = ["/home", "/despensa", "/lista", "/casa"];

// Persiste entre navegações (módulo não recarrega no SPA).
let lastTabIndex = -1;

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const idx = TAB_ORDER.indexOf(pathname);

  let cls = "animate-page-in"; // padrão (slide-up) para telas que não são abas
  if (idx !== -1) {
    if (lastTabIndex !== -1 && idx !== lastTabIndex) {
      cls = idx > lastTabIndex ? "animate-enter-right" : "animate-enter-left";
    }
    // Atualiza SÍNCRONO (não em useEffect) → a direção é sempre certa,
    // evitando misturar slide horizontal com vertical (sensação diagonal).
    lastTabIndex = idx;
  }

  return (
    <div style={{ overflowX: "clip" }}>
      <div key={pathname} className={cls}>
        {children}
      </div>
    </div>
  );
}
