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
 *
 * Filosofia de permissões:
 * - Convidados (member) podem gerenciar itens (add/edit/delete/status/notes)
 *   porque o objetivo é AJUDAR o dono, não sobrecarregá-lo.
 * - Ações estruturais (casa, plano, convites, categorias) ficam com o dono.
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

  // ── Permissões — false até carregar (sem flash) ──

  // Itens: TODOS os membros podem gerenciar (add, edit, rename, delete, notes, status)
  // Isso permite que convidados ajudem o dono sem sobrecarregá-lo
  const canManageItems = loaded;

  // Status: todos podem mudar
  const canChangeStatus = loaded;

  // Compartilhar lista via WhatsApp: todos podem
  const canShareList = loaded;

  // Finalizar compras: todos podem (útil quando convidado vai ao mercado)
  const canFinishShopping = loaded;

  // ── Ações protegidas — somente dono (owner) ──
  const canManageHouse = loaded && isOwner;       // Renomear/excluir casa
  const canAccessPlans = loaded && isOwner;        // Ver/alterar plano/pagamento
  const canInviteMembers = loaded && isOwner;      // Enviar convites
  const canRemoveMembers = loaded && isOwner;      // Remover outros membros
  const housePlan = (currentHouse as any)?.plan;
  const isPaidPlan = housePlan && housePlan !== "free";
  const canEditCategories = loaded && isAdmin && isPaidPlan; // Renomear categorias (owner/admin + plano pago)
  const canAccessSettings = loaded;                // Configurações pessoais (todos)
  const canDeleteHouse = loaded && isOwner;        // Excluir casa/local

  return {
    role,
    isOwner,
    isAdmin,
    isMember: loaded && !isOwner && !isAdmin,
    currentUserId: userId ?? "",
    loaded,
    // Itens (todos)
    canManageItems,
    canChangeStatus,
    canShareList,
    canFinishShopping,
    // Estruturais (dono)
    canManageHouse,
    canAccessPlans,
    canAccessSettings,
    canInviteMembers,
    canRemoveMembers,
    canEditCategories,
    canDeleteHouse,
  };
}
