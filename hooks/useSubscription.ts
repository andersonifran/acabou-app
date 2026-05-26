"use client";

import { useAppStore } from "@/store/appStore";
import { PLAN_LIMITS } from "@/types";

export function useSubscription() {
  const { currentHouse, items, members } = useAppStore();

  const rawPlan = currentHouse?.plan ?? "free";
  const planStatus = currentHouse?.plan_status ?? "active";

  // Trial: se plan_status é "trialing" E não expirou, trata como pago
  const isTrialing = planStatus === "trialing";
  const trialExpired = isTrialing && currentHouse?.plan_expires_at
    ? new Date(currentHouse.plan_expires_at) < new Date()
    : false;

  // Se o plano expirou (status inactive ou trial expirado), trata como free nos limites
  const isExpired = trialExpired || (rawPlan !== "free" && planStatus === "inactive");
  const plan = isExpired ? "free" : rawPlan;
  const limits = PLAN_LIMITS[plan];

  const isPaid = !isExpired && (rawPlan === "monthly" || rawPlan === "yearly");

  const itemCount = items.length;
  const memberCount = members.filter((m) => m.status === "active").length;

  const canAddItem = isPaid || itemCount < limits.max_items;
  const canAddMember = isPaid || memberCount < limits.max_members;

  const itemsRemaining = isPaid ? Infinity : Math.max(0, limits.max_items - itemCount);
  const membersRemaining = isPaid ? Infinity : Math.max(0, limits.max_members - memberCount);

  // Calcular dias restantes do trial
  const trialDaysLeft = isTrialing && !trialExpired && currentHouse?.plan_expires_at
    ? Math.max(0, Math.ceil((new Date(currentHouse.plan_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    plan,
    isPaid,
    isExpired,
    isTrialing: isTrialing && !trialExpired,
    trialExpired,
    trialDaysLeft,
    limits,
    canAddItem,
    canAddMember,
    itemsRemaining,
    membersRemaining,
    itemCount,
    memberCount,
  };
}
