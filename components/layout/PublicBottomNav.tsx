"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "./BottomNav";

/**
 * Rodapé para páginas PÚBLICAS (Privacidade, Termos, Feedback) que também
 * podem ser abertas sem login (landing, Google, Play Store).
 *
 * Diferente do BottomNav direto (que confia no cache do store), aqui
 * verificamos a SESSÃO REAL do Supabase antes de mostrar. Garantia 100%:
 *  - Sem sessão válida  → não renderiza nada (nem com cache antigo)
 *  - Com sessão válida   → mostra o rodapé (sente que está no app)
 *
 * Começa como null (nada) e só aparece após confirmar — erra sempre para o
 * lado seguro (melhor não mostrar do que mostrar errado).
 */
export function PublicBottomNav() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (active) setAuthed(!!data.user);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!authed) return null;
  return <BottomNav />;
}
