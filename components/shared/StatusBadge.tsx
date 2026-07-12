"use client";

import { ItemStatus } from "@/types";
import { statusLabelFor } from "@/lib/local-terms";
import { useAppStore } from "@/store/appStore";
import { getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ItemStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Vocabulário por tipo de local: "Tem em casa" / "Tem na empresa" / etc.
  const currentHouse = useAppStore((s) => s.currentHouse);
  const propertyType = (currentHouse as any)?.property_type;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        getStatusColor(status),
        className
      )}
    >
      {statusLabelFor(status, propertyType)}
    </span>
  );
}
