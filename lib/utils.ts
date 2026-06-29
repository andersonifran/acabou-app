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
    desejo: "text-purple-600 bg-purple-50",
  };
  return colors[status];
}

export function getStatusBorderColor(status: ItemStatus): string {
  const colors: Record<ItemStatus, string> = {
    tem: "border-green-200",
    acabando: "border-amber-200",
    acabou: "border-red-200",
    comprar: "border-blue-200",
    desejo: "border-purple-200",
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

/**
 * Ícone "inteligente" pro rótulo livre da categoria "Outros".
 * REGRA (intuitivo, NUNCA presunçoso): só damos ícone específico quando a palavra
 * diz CLARAMENTE o que tem dentro (Adega→🍷, Remédios→💊, Pet→🐾). Palavras de
 * LUGAR/depósito genérico (Almoxarifado, Estoque, Depósito, Garagem) NÃO ganham
 * ícone específico — caem na caixa 📦 neutra, que combina e nunca engana.
 * Ex.: "Almoxarifado" → 📦, mas "Almoxarifado de ferramentas" → 🔧 (a palavra decide).
 * Casa por PALAVRA (startsWith) pra não dar falso-positivo no meio de outra
 * (ex.: "tampão" NÃO vira 🥖 por causa de "pão").
 */
// Curado a partir de pesquisa BR (com apelidos/gírias) + auditoria anti-colisão.
// NÍVEL DE CATEGORIA (não de produto): é o que a pessoa escreve como "Outros".
// Só raízes SEGURAS (≥4 letras, sem casar começo de outra palavra) e de CONTEÚDO
// claro. Palavra de lugar genérico (almoxarifado, estoque, gaveta…) fica no 📦.
// Ordem: específico antes de genérico (1º grupo que casar vence).
const CUSTOM_CATEGORY_ICONS: { roots: string[]; icon: string }[] = [
  { roots: ["vinho", "adega"], icon: "🍷" },
  { roots: ["cerveja", "chopp", "chope", "breja", "gelada", "birita"], icon: "🍺" },
  { roots: ["cafe", "cafezinho"], icon: "☕" },
  { roots: ["bebida", "refrigerante", "refri", "suco", "drink"], icon: "🥤" },
  { roots: ["churrasco", "churras", "espeto", "carvao"], icon: "🍖" },
  { roots: ["acougue", "carne", "frango", "peixe"], icon: "🥩" },
  { roots: ["padaria", "pao", "paes"], icon: "🥖" },
  { roots: ["hortifruti", "verdura", "legume", "fruta", "feira", "sacolao"], icon: "🥦" },
  { roots: ["doce", "sobremesa", "chocolate", "confeitaria"], icon: "🍫" },
  { roots: ["marmita", "quentinha", "rango"], icon: "🍱" },
  { roots: ["cozinha", "panela", "utensilio"], icon: "🍽️" },
  { roots: ["pet", "racao", "cachorro", "gato", "aquario", "passarinho", "veterinari"], icon: "🐾" },
  { roots: ["limpeza", "faxina"], icon: "🧹" },
  { roots: ["higiene", "banheiro", "sabonete"], icon: "🧼" },
  { roots: ["bebe", "nenem", "nene", "fralda", "infantil", "crianca", "mamadeira"], icon: "🍼" },
  { roots: ["festa", "aniversario", "decoracao", "balao"], icon: "🎉" },
  { roots: ["ferramenta", "furadeira", "parafuso", "oficina", "marcenaria", "martelo", "serrote", "alicate", "broca", "ferragem"], icon: "🔧" },
  { roots: ["construcao", "obra", "cimento", "tijolo", "reboco", "alvenaria", "pedreiro"], icon: "🧱" },
  { roots: ["pintura", "tinta"], icon: "🎨" },
  { roots: ["encanamento", "hidraulica", "torneira", "tubulacao", "encanador"], icon: "🚰" },
  { roots: ["eletronico", "eletrica", "eletro", "informatica", "pilha", "bateria", "computador", "celular", "notebook"], icon: "🔌" },
  { roots: ["jardim", "jardinagem", "horta", "planta", "flor", "vaso"], icon: "🌱" },
  { roots: ["carro", "automovel", "veiculo", "automotivo", "moto", "pneu"], icon: "🚗" },
  { roots: ["roupa", "vestuario", "calcado", "sapato", "moda"], icon: "👕" },
  { roots: ["costura", "agulha", "tecido", "croche", "trico"], icon: "🧵" },
  { roots: ["praia", "piscina"], icon: "🏖️" },
  { roots: ["pesca", "pescaria", "anzol", "isca"], icon: "🎣" },
  { roots: ["camping", "acampamento", "barraca"], icon: "⛺" },
  { roots: ["viagem", "bagagem"], icon: "🧳" },
  { roots: ["academia", "treino", "esporte", "fitness", "gym"], icon: "🏋️" },
  { roots: ["remedio", "farmacia", "medicamento", "saude"], icon: "💊" },
  { roots: ["maquiagem", "cosmetico", "beleza", "make", "perfume", "perfumaria", "batom", "esmalte"], icon: "💄" },
  { roots: ["escritorio", "papelaria", "escolar", "escola", "caderno", "caneta"], icon: "✏️" },
];

export function customCategoryIcon(label?: string | null): string {
  if (!label || !label.trim()) return "📦";
  const words = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  for (const { roots, icon } of CUSTOM_CATEGORY_ICONS) {
    if (words.some((w) => roots.some((r) => w.startsWith(r)))) return icon;
  }
  return "📦"; // genérico/desconhecido → caixa neutra (combina, nunca engana)
}
