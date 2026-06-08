"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { useSubscription } from "@/hooks/useSubscription";
import { House, HouseMember } from "@/types";

export function useHouse() {
  const { currentHouse, members, setCurrentHouse, setMembers } = useAppStore();
  const supabase = createClient();
  const { isPaid } = useSubscription();

  const generateInviteToken = useCallback(async (): Promise<string> => {
    if (!currentHouse) throw new Error("Nenhuma casa selecionada");
    if (!isPaid) throw new Error("Convites são exclusivos do Plano Família");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase
      .from("invite_tokens")
      .insert({ house_id: currentHouse.id, created_by: user.id })
      .select("token")
      .single();

    if (error) throw error;
    return data.token;
  }, [currentHouse, isPaid, supabase]);

  const getInviteUrl = useCallback(
    (token: string) => {
      const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      return `${base}/convite/${token}`;
    },
    []
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      // Removido via rota server-side (service_role): o trigger anti-burla
      // guard_member_status bloqueia UPDATE de status pelo cliente. A rota só
      // deixa o DONO remover, e remover sempre REDUZ acesso (seguro).
      const res = await fetch("/api/remover-membro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao remover membro");
      }
      setMembers(members.filter((m) => m.id !== memberId));
    },
    [members, setMembers]
  );

  const updateHouseName = useCallback(
    async (name: string) => {
      if (!currentHouse) return;
      const { error } = await supabase
        .from("houses")
        .update({ name })
        .eq("id", currentHouse.id);

      if (error) throw error;
      setCurrentHouse({ ...currentHouse, name });
    },
    [currentHouse, supabase, setCurrentHouse]
  );

  return {
    currentHouse,
    members,
    isPaid,
    generateInviteToken,
    getInviteUrl,
    removeMember,
    updateHouseName,
  };
}
