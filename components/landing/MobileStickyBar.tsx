"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function MobileStickyBar() {
  const [pastHero, setPastHero] = useState(false);
  const [ctaFinalVisible, setCtaFinalVisible] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setPastHero(window.scrollY > 600);
    }

    // Esconde assim que a seção de CTA final (que leva ao rodapé) aparece
    const ctaFinal = document.getElementById("final-cta");
    let io: IntersectionObserver | undefined;
    if (ctaFinal) {
      io = new IntersectionObserver(
        ([entry]) => setCtaFinalVisible(entry.isIntersecting),
        { rootMargin: "0px 0px -8% 0px" }
      );
      io.observe(ctaFinal);
    }

    // Se o banner de instalar estiver aberto, esconde a barra (não competir)
    function syncInstall() {
      setInstallOpen(!!(window as any).__installBannerOpen);
    }
    syncInstall();
    window.addEventListener("install-banner-change", syncInstall);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("install-banner-change", syncInstall);
      io?.disconnect();
    };
  }, []);

  // A barra só aparece no MEIO da página, e nunca quando o banner de instalar
  // está aberto (pra não cobrir o "Instalar").
  const visible = pastHero && !ctaFinalVisible && !installOpen;

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
