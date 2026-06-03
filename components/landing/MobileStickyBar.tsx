"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function MobileStickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // A barra só aparece no MEIO da página:
    //  - some no topo (hero já tem CTA)
    //  - some no fim (CTA final + rodapé já têm CTA) → não cobre nada
    let pastHero = false;
    let ctaFinalVisible = false;

    function update() {
      setVisible(pastHero && !ctaFinalVisible);
    }

    function onScroll() {
      pastHero = window.scrollY > 600;
      update();
    }

    // Esconde assim que a seção de CTA final (que leva ao rodapé) aparece
    const ctaFinal = document.getElementById("final-cta");
    let io: IntersectionObserver | undefined;
    if (ctaFinal) {
      io = new IntersectionObserver(
        ([entry]) => {
          ctaFinalVisible = entry.isIntersecting;
          update();
        },
        { rootMargin: "0px 0px -8% 0px" }
      );
      io.observe(ctaFinal);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link
        href="/cadastro"
        className="block w-full bg-green-600 text-white text-center font-bold py-3.5 rounded-xl text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
      >
        Testar 7 dias grátis →
      </Link>
    </div>
  );
}
