"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { BottomNav } from "./BottomNav";

/**
 * Rodapé para páginas PÚBLICAS (Privacidade, Termos, Feedback) que também
 * podem ser abertas sem login (landing, Google, Play Store).
 *
 * Usa SÓ o cache do store (userId) — NÃO chama getUser() de propósito:
 *  - Evita disparar renovação de token concorrente (que deslogava o usuário)
 *  - Aparece na hora (sem "pisca" de espera assíncrona)
 *
 * Garantia: sem userId no cache (deslogado) → não mostra. O cache só tem
 * userId quando há sessão (é limpo no logout). O "mounted" evita divergência
 * de hidratação (SSR não tem o cache).
 */
export function PublicBottomNav() {
  const userId = useAppStore((s) => s.userId);
  const currentHouse = useAppStore((s) => s.currentHouse);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !userId || !currentHouse) return null;
  return <BottomNav />;
}
