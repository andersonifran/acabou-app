"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hapticLight } from "@/lib/haptics";

/**
 * Permite navegar entre as abas deslizando o dedo (swipe horizontal),
 * como nos apps nativos modernos. Deslizar para a ESQUERDA → próxima aba;
 * para a DIREITA → aba anterior.
 *
 * Cuidados:
 * - Ignora se o toque começa em um elemento com scroll horizontal próprio
 *   (filtros, carrosséis) — para não brigar com esses gestos.
 * - Ignora quando há um modal aberto (passado via `disabled`).
 * - Só dispara em swipe claramente horizontal e longo o suficiente
 *   (evita disparo acidental durante scroll vertical).
 */
export function SwipeNavigator({
  tabs,
  disabled = false,
  children,
}: {
  tabs: string[];
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  useEffect(() => {
    function isScrollableX(target: EventTarget | null): boolean {
      let el = target as HTMLElement | null;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const ox = style.overflowX;
        if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth + 4) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    }

    function onStart(e: TouchEvent) {
      if (disabled || e.touches.length !== 1) {
        tracking.current = false;
        return;
      }
      const t = e.touches[0];
      // Ignora swipe iniciado bem na borda (conflita com "voltar" do sistema)
      if (t.clientX < 24 || t.clientX > window.innerWidth - 24) {
        tracking.current = false;
        return;
      }
      if (isScrollableX(e.target)) {
        tracking.current = false;
        return;
      }
      startX.current = t.clientX;
      startY.current = t.clientY;
      tracking.current = true;
    }

    function onEnd(e: TouchEvent) {
      if (!tracking.current) return;
      tracking.current = false;

      const t = e.changedTouches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Precisa ser horizontal (absX domina) e longo o suficiente
      if (absX < 70 || absX < absY * 2) return;

      const idx = tabs.indexOf(pathname);
      if (idx === -1) return;

      let next = idx;
      if (dx < 0 && idx < tabs.length - 1) next = idx + 1; // ←  próxima
      else if (dx > 0 && idx > 0) next = idx - 1; // →  anterior

      if (next !== idx) {
        hapticLight();
        // replace (não push): trocar de aba NÃO empilha histórico — evita o
        // acúmulo de entradas no Chrome que causava lentidão/travas com o tempo.
        router.replace(tabs[next]);
      }
    }

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [pathname, tabs, disabled, router]);

  return <>{children}</>;
}
