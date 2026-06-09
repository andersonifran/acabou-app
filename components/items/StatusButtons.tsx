"use client";

import { ItemStatus, STATUS_LABELS } from "@/types";
import { cn } from "@/lib/utils";

interface StatusButtonsProps {
  currentStatus: ItemStatus;
  onChangeStatus: (status: ItemStatus) => void;
  disabled?: boolean;
}

const statuses: { status: ItemStatus; label: string; activeClass: string; inactiveClass: string }[] = [
  {
    status: "tem",
    label: "Tem",
    activeClass: "bg-green-600 text-white border-green-600",
    inactiveClass: "bg-white text-green-700 border-green-200 hover:bg-green-50",
  },
  {
    status: "acabando",
    label: "Acabando",
    activeClass: "bg-amber-500 text-white border-amber-500",
    inactiveClass: "bg-white text-amber-600 border-amber-200 hover:bg-amber-50",
  },
  {
    status: "acabou",
    label: "Acabou",
    activeClass: "bg-red-500 text-white border-red-500",
    inactiveClass: "bg-white text-red-600 border-red-200 hover:bg-red-50",
  },
  {
    status: "comprar",
    label: "Comprar",
    activeClass: "bg-blue-600 text-white border-blue-600",
    inactiveClass: "bg-white text-blue-600 border-blue-200 hover:bg-blue-50",
  },
];

export function StatusButtons({ currentStatus, onChangeStatus, disabled }: StatusButtonsProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {statuses.map(({ status, label, activeClass, inactiveClass }) => (
        <button
          key={status}
          onClick={() => onChangeStatus(status)}
          disabled={disabled}
          className={cn(
            // Feedback premium SÓ no botão tocado: "afundadinho" (scale-95) suave.
            // Sem opacity no disabled → os outros não dimam/piscam.
            "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-100 active:scale-90",
            currentStatus === status ? activeClass : inactiveClass,
            disabled && "cursor-not-allowed"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
