"use client";

import { useAppStore } from "@/store/appStore";
import { PLAN_LIMITS } from "@/types";

export function useSubscription() {
  const { currentHouse, items, members } = useAppStore();

  const plan = currentHouse?.plan ?? "free";
  const limits = PLAN_LIMITS[plan];

  const isPaid = plan === "monthly" || plan === "yearly";

  const itemCount = items.length;
  const memberCount = members.filter((m) => m.status === "active").length;

  const canAddItem = isPaid || itemCount < limits.max_items;
  const canAddMember = isPaid || memberCount < limits.max_members;

  const itemsRemaining = isPaid ? Infinity : Math.max(0, limits.max_items - itemCount);
  const membersRemaining = isPaid ? Infinity : Math.max(0, limits.max_members - memberCount);

  return {
    plan,
    isPaid,
    limits,
    canAddItem,
    canAddMember,
    itemsRemaining,
    membersRemaining,
    itemCount,
    memberCount,
  };
}
