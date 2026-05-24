import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ItemStatus, RecurrenceType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "agora mesmo";
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  return formatDate(dateString);
}

export function getStatusColor(status: ItemStatus): string {
  const colors: Record<ItemStatus, string> = {
    tem: "text-green-600 bg-green-50",
    acabando: "text-amber-600 bg-amber-50",
    acabou: "text-red-600 bg-red-50",
    comprar: "text-blue-600 bg-blue-50",
  };
  return colors[status];
}

export function getStatusBorderColor(status: ItemStatus): string {
  const colors: Record<ItemStatus, string> = {
    tem: "border-green-200",
    acabando: "border-amber-200",
    acabou: "border-red-200",
    comprar: "border-blue-200",
  };
  return colors[status];
}

export function getNextReminderDate(recurrence: RecurrenceType): Date {
  const now = new Date();
  const days: Record<RecurrenceType, number> = {
    weekly: 7,
    biweekly: 15,
    monthly: 30,
    bimonthly: 60,
  };
  const result = new Date(now);
  result.setDate(result.getDate() + days[recurrence]);
  return result;
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildShoppingListText(items: { name: string; category: string; note?: string }[]): string {
  const grouped: Record<string, typeof items> = {};
  items.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const lines = ["🛒 *Lista de Compras — Acabou?*\n"];
  Object.entries(grouped).forEach(([category, categoryItems]) => {
    lines.push(`*${category}*`);
    categoryItems.forEach((item) => {
      lines.push(`• ${item.name}${item.note ? ` (${item.note})` : ""}`);
    });
    lines.push("");
  });

  return lines.join("\n");
}

export function generateInviteMessage(houseName: string, inviteUrl: string): string {
  return `Entre na lista da nossa casa no Acabou? Assim todo mundo sabe o que precisa comprar.\n\n🏠 Casa: ${houseName}\n🔗 ${inviteUrl}`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}
