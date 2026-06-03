"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { BottomNav } from "./BottomNav";

/**
 * Rodapé para páginas PÚBLICAS (Privacidade, Termos, Feedback) que também
 * podem ser abertas sem login (landing, Google, Play Store).
 *
 * Estratégia anti-"pisca" + segura:
 *  1) Se já há userId no cache → mostra NA HORA (logado não vê piscar)
 *  2) Confirma com a SESSÃO REAL do Supabase e corrige se for cache velho
 *
 * Garantia: sem sessão válida → nunca mostra (nem com cache antigo).
 * Começa escondido no 1º render (igual ao SSR) e resolve logo após montar.
 */
export function PublicBottomNav() {
  const cachedUserId = useAppStore((s) => s.userId);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let active = true;

    // 1) Otimista: se o cache já tem usuário, mostra imediatamente (sem piscar)
    if (cachedUserId) setAuthed(true);

    // 2) Verifica a sessão real e corrige (cache velho / sessão expirada → some)
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (active) setAuthed(!!data.user);
    });

    return () => {
      active = false;
    };
  }, [cachedUserId]);

  if (!authed) return null;
  return <BottomNav />;
}
