"use client";

import { useAppStore } from "@/store/appStore";
import { MemberRole } from "@/types";

/**
 * Hook que retorna o role do usuário atual na casa selecionada.
 *
 * USA o userId do store (setado pelo layout) — NÃO chama getUser().
 * Isso elimina a chamada async e o flash de permissões erradas.
 *
 * Enquanto userId ainda não foi carregado (null), TODAS as permissões
 * são false. Isso é seguro: o membro nunca vê controles do dono.
 */
export function useRole() {
  const { userId, currentHouse, members } = useAppStore();

  // Loaded = userId existe no store (setado pelo layout no carregamento inicial)
  const loaded = !!userId;

  // Check owner via house.owner_id
  const isOwner = !!(loaded && currentHouse && (currentHouse as any).owner_id === userId);

  // Busca o role do membro atual via members array
  const currentMember = userId ? members.find((m) => m.user_id === userId) : undefined;
  const role: MemberRole = isOwner ? "owner" : (currentMember?.role ?? "member");

  const isAdmin = loaded && (role === "owner" || role === "admin");

  // Permissões — false até carregar (sem flash)
  const canManageItems = loaded && isAdmin;
  const canChangeStatus = true;
  const canManageHouse = loaded && isOwner;
  const canAccessPlans = loaded && isOwner;
  const canAccessSettings = true;
  const canInviteMembers = loaded && isOwner;

  return {
    role,
    isOwner,
    isAdmin,
    isMember: loaded && !isOwner && !isAdmin,
    currentUserId: userId ?? "",
    loaded,
    canManageItems,
    canChangeStatus,
    canManageHouse,
    canAccessPlans,
    canAccessSettings,
    canInviteMembers,
  };
}
