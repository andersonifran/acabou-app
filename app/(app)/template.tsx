"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Transição de página estilo nativo (o "slide com bounce" que o Chris cita).
 * A página entra deslizando HORIZONTALMENTE conforme a direção da navegação:
 *  - avançar (aba à direita) → entra da direita
 *  - voltar (aba à esquerda) → entra da esquerda
 * Páginas que não são abas usam um slide-up suave.
 */
// Só as 4 abas reais entram no slide horizontal direcional.
// Configurações (e outras sub-páginas) usam o slide-up suave (page-in).
const TAB_ORDER = ["/home", "/despensa", "/lista", "/casa"];

// Persiste entre remounts do template (módulo não recarrega na navegação SPA)
let lastTabIndex = -1;

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const idx = TAB_ORDER.indexOf(pathname);

  let cls = "animate-page-in"; // padrão (slide-up) para telas que não são abas
  if (idx !== -1 && lastTabIndex !== -1 && idx !== lastTabIndex) {
    cls = idx > lastTabIndex ? "animate-enter-right" : "animate-enter-left";
  }

  useEffect(() => {
    if (idx !== -1) lastTabIndex = idx;
  }, [idx]);

  // Container externo com overflow-x: clip → "recorta" o transbordo
  // horizontal do slide (a página entrando da direita começa fora da tela).
  // "clip" NÃO cria contexto de rolagem (não quebra sticky) e, por ser um
  // container interno (não o body), NÃO afeta a barra fixa do rodapé.
  // key={pathname} força remontar → a animação re-dispara a cada navegação.
  return (
    <div style={{ overflowX: "clip" }}>
      <div key={pathname} className={cls}>
        {children}
      </div>
    </div>
  );
}
