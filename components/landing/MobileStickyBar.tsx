"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function MobileStickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      // Mostra após scroll de 600px (depois do hero)
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
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
