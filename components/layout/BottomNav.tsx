"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";
import { hapticLight } from "@/lib/haptics";

// ── Ícones SVG customizados com cores ──────────────────────────

function NavIconHome({ active }: { active: boolean }) {
  const c = active ? "#16a34a" : "#9ca3af";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Telhado */}
      <path
        d="M3 11.5L12 3L21 11.5"
        stroke={c}
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Corpo da casa */}
      <path
        d="M5 10.5V20a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10.5"
        fill={active ? "#dcfce7" : "none"}
        stroke={c}
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavIconDespensa({ active }: { active: boolean }) {
  const c = active ? "#0d9488" : "#9ca3af";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Caixa */}
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
        fill={active ? "#ccfbf1" : "none"}
        stroke={c}
        strokeWidth={active ? 2 : 1.8}
      />
      {/* Prateleira do meio */}
      <line x1="3" y1="13" x2="21" y2="13" stroke={c} strokeWidth={active ? 2 : 1.8} />
      {/* Itens na prateleira de cima */}
      <rect x="6" y="7" width="3.5" height="4.5" rx="0.8" fill={c} fillOpacity={active ? 0.85 : 0.45} />
      <rect x="11" y="7.5" width="2.5" height="4" rx="0.8" fill={c} fillOpacity={active ? 0.85 : 0.45} />
      <rect x="15" y="7" width="3" height="4.5" rx="0.8" fill={c} fillOpacity={active ? 0.85 : 0.45} />
      {/* Itens na prateleira de baixo */}
      <rect x="6" y="15" width="5" height="4" rx="0.8" fill={c} fillOpacity={active ? 0.6 : 0.35} />
      <rect x="13" y="15" width="5" height="4" rx="0.8" fill={c} fillOpacity={active ? 0.6 : 0.35} />
    </svg>
  );
}

function NavIconLista({ active }: { active: boolean }) {
  const c = active ? "#d97706" : "#9ca3af";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Prancheta */}
      <rect
        x="5"
        y="4"
        width="14"
        height="17"
        rx="2"
        fill={active ? "#fef3c7" : "none"}
        stroke={c}
        strokeWidth={active ? 2 : 1.8}
      />
      {/* Clipe do topo */}
      <rect x="9" y="2.5" width="6" height="3.5" rx="1" fill={active ? c : "none"} stroke={c} strokeWidth={active ? 2 : 1.8} />
      {/* Linha 1 com check */}
      <path d="M9 11l2 2 4-4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Linha 2 */}
      <line x1="9" y1="16" x2="15" y2="16" stroke={c} strokeWidth="2" strokeLinecap="round" />
      {/* Linha 3 */}
      <line x1="9" y1="19" x2="13" y2="19" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeOpacity={active ? 0.6 : 0.5} />
    </svg>
  );
}

function NavIconCasa({ active }: { active: boolean }) {
  const c = active ? "#7c3aed" : "#9ca3af";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* Pessoa principal */}
      <circle
        cx="9"
        cy="7"
        r="3"
        fill={active ? "#ede9fe" : "none"}
        stroke={c}
        strokeWidth={active ? 2 : 1.8}
      />
      <path
        d="M2.5 21v-1a6.5 6.5 0 0113 0v1"
        stroke={c}
        strokeWidth={active ? 2 : 1.8}
        strokeLinecap="round"
      />
      {/* Pessoa secundária */}
      <circle
        cx="18.5"
        cy="9"
        r="2.5"
        fill={active ? "#ede9fe" : "none"}
        stroke={c}
        strokeWidth={active ? 2 : 1.8}
      />
      <path
        d="M15.5 21v-0.5a4 4 0 018 0V21"
        stroke={c}
        strokeWidth={active ? 2 : 1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Itens de navegação ─────────────────────────────────────────

const navItems = [
  { href: "/home",     label: "Início",   Icon: NavIconHome },
  { href: "/despensa", label: "Despensa", Icon: NavIconDespensa },
  { href: "/lista",    label: "Lista",    Icon: NavIconLista },
  // "Local" (não "Casa"): a aba gerencia QUALQUER tipo de local — casa, apê,
  // praia, empresa... Pra quem criou uma Empresa, "Casa" soava errado (02/07).
  { href: "/casa",     label: "Local",    Icon: NavIconCasa },
];

// Cores da label por aba (ativa)
const activeLabelColors: Record<string, string> = {
  "/home":           "text-green-700",
  "/despensa":       "text-teal-700",
  "/lista":          "text-amber-700",
  "/casa":           "text-violet-700",
  "/configuracoes":  "text-violet-700",
};

// Fundo da "pílula" atrás do ícone ativo (toque premium, estilo Material You)
const activePillColors: Record<string, string> = {
  "/home":           "bg-green-100",
  "/despensa":       "bg-teal-100",
  "/lista":          "bg-amber-100",
  "/casa":           "bg-violet-100",
  "/configuracoes":  "bg-violet-100",
};

export function BottomNav() {
  const pathname = usePathname();
  const { userId, currentHouse, setAddItemModalOpen } = useAppStore();

  // Síncrono — sem async, sem useEffect, sem flash
  const isOwner = !!(userId && currentHouse && (currentHouse as any).owner_id === userId);

  // Membros não veem aba "Casa" (gestão) — veem aba "Perfil" simplificada
  const items = isOwner
    ? navItems
    : navItems.map((item) =>
        item.href === "/casa"
          ? { ...item, href: "/configuracoes", label: "Perfil" }
          : item
      );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb">
      <div className="max-w-lg mx-auto flex">
        {items.map(({ href, label, Icon }) => {
          // Mantém a aba Casa ativa (pílula roxa) ao entrar em Configurações
          // ou em sub-páginas de Casa (ex: criar novo local).
          const active =
            pathname === href ||
            (href === "/casa" &&
              (pathname === "/configuracoes" || pathname.startsWith("/casa/")));
          return (
            <Link
              key={href}
              href={href}
              replace
              onClick={() => { setAddItemModalOpen(false); if (!active) hapticLight(); }}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors active:scale-90"
            >
              <span
                key={`${href}-${active}`}
                className={cn(
                  "flex items-center justify-center rounded-full px-5 py-1 transition-colors",
                  active && "animate-tab-bounce",
                  active ? activePillColors[href] : "bg-transparent"
                )}
              >
                <Icon active={active} />
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold mt-0.5",
                  active ? activeLabelColors[href] : "text-gray-400"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
