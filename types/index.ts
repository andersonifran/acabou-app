// =============================================
// ACABOU? — Tipos TypeScript
// =============================================

export type ItemStatus = "tem" | "acabando" | "acabou" | "comprar";
export type MemberRole = "owner" | "admin" | "member";
export type PlanType = "free" | "monthly" | "yearly";
export type PlanStatus = "active" | "inactive" | "cancelled" | "past_due" | "trialing";
export type RecurrenceType = "weekly" | "biweekly" | "monthly" | "bimonthly";
export type EventSource = "app" | "whatsapp" | "web";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface House {
  id: string;
  name: string;
  owner_id: string;
  plan: PlanType;
  plan_status: PlanStatus;
  plan_expires_at?: string;
  reminder_enabled?: boolean;
  reminder_time?: string;
  created_at: string;
  updated_at: string;
}

export interface HouseMember {
  id: string;
  house_id: string;
  user_id: string;
  role: MemberRole;
  status: "active" | "invited" | "removed";
  invited_by?: string;
  created_at: string;
  profile?: Profile;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  is_default: boolean;
}

export interface Item {
  id: string;
  house_id: string;
  category_id: string;
  name: string;
  status: ItemStatus;
  note?: string;
  quantity_text?: string;
  is_recurring: boolean;
  recurrence_type?: RecurrenceType;
  next_reminder_at?: string;
  created_by: string;
  updated_by?: string;
  last_purchased_at?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ItemEvent {
  id: string;
  house_id: string;
  item_id: string;
  user_id: string;
  event_type: string;
  old_status?: ItemStatus;
  new_status?: ItemStatus;
  note?: string;
  source: EventSource;
  created_at: string;
  profile?: Profile;
  item?: Item;
}

export interface ShoppingSession {
  id: string;
  house_id: string;
  user_id: string;
  status: "open" | "finished";
  started_at: string;
  finished_at?: string;
}

export interface Subscription {
  id: string;
  house_id: string;
  user_id: string;
  plan: PlanType;
  status: PlanStatus;
  provider?: string;
  provider_customer_id?: string;
  provider_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface InviteToken {
  id: string;
  house_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

// --- Limites dos planos ---
export const PLAN_LIMITS = {
  free: {
    max_members: 1,
    max_items: 20,
    max_houses: 1,
    recurring_reminders: false,
    full_history: false,
  },
  monthly: {
    max_members: Infinity,
    max_items: Infinity,
    max_houses: Infinity,
    recurring_reminders: true,
    full_history: true,
  },
  yearly: {
    max_members: Infinity,
    max_items: Infinity,
    max_houses: Infinity,
    recurring_reminders: true,
    full_history: true,
  },
} as const;

// --- Categorias padrão ---
export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Alimentos", icon: "🛒", sort_order: 1, is_default: true },
  { name: "Limpeza", icon: "🧹", sort_order: 2, is_default: true },
  { name: "Higiene", icon: "🚿", sort_order: 3, is_default: true },
  { name: "Pet", icon: "🐾", sort_order: 4, is_default: true },
  { name: "Bebê", icon: "👶", sort_order: 5, is_default: true },
  { name: "Farmácia", icon: "💊", sort_order: 6, is_default: true },
  { name: "Outros", icon: "📦", sort_order: 7, is_default: true },
];

// --- Status que aparecem na lista de compras ---
export const SHOPPING_LIST_STATUSES: ItemStatus[] = ["acabando", "acabou", "comprar"];

// --- Labels amigáveis de status ---
export const STATUS_LABELS: Record<ItemStatus, string> = {
  tem: "Tem em casa",
  acabando: "Está acabando",
  acabou: "Acabou",
  comprar: "Comprar",
};

// --- Labels de recorrência ---
export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  weekly: "Toda semana",
  biweekly: "A cada 15 dias",
  monthly: "Todo mês",
  bimonthly: "A cada 2 meses",
};
