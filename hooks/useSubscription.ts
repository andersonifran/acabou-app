"use client";

import { useAppStore } from "@/store/appStore";
import { PLAN_LIMITS } from "@/types";

export function useSubscription() {
  const { currentHouse, items, members } = useAppStore();

  const rawPlan = currentHouse?.plan ?? "free";
  const planStatus = currentHouse?.plan_status ?? "active";

  // Se o plano expirou (status inactive), trata como free nos limites
  const isExpired = rawPlan !== "free" && planStatus === "inactive";
  const plan = isExpired ? "free" : rawPlan;
  const limits = PLAN_LIMITS[plan];

  const isPaid = !isExpired && (rawPlan === "monthly" || rawPlan === "yearly");

  const itemCount = items.length;
  const memberCount = members.filter((m) => m.status === "active").length;

  const canAddItem = isPaid || itemCount < limits.max_items;
  const canAddMember = isPaid || memberCount < limits.max_members;

  const itemsRemaining = isPaid ? Infinity : Math.max(0, limits.max_items - itemCount);
  const membersRemaining = isPaid ? Infinity : Math.max(0, limits.max_members - memberCount);

  return {
    plan,
    isPaid,
    isExpired,
    limits,
    canAddItem,
    canAddMember,
    itemsRemaining,
    membersRemaining,
    itemCount,
    memberCount,
  };
}
