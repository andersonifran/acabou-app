/**
 * Ícones decorativos de fundo (cesta, carrinho, café, leite, etc.)
 * Posicionados nos cantos com baixa opacidade — discreto, estilo do
 * banner da Play Store. Não interfere no conteúdo (pointer-events-none).
 *
 * variant="light"  → ícones verdes para fundos claros
 * variant="dark"   → ícones brancos para fundos verdes/escuros
 */
export function DecorIcons({ variant = "light" }: { variant?: "light" | "dark" }) {
  const color = variant === "dark" ? "#ffffff" : "#16a34a";
  const opacity = variant === "dark" ? 0.08 : 0.05;

  const stroke = {
    stroke: color,
    strokeWidth: 2,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{ opacity }}
    >
      {/* Carrinho de compras — topo esquerda */}
      <svg className="absolute -left-4 top-8 w-20 h-20 md:w-28 md:h-28 -rotate-12" viewBox="0 0 24 24">
        <circle cx="9" cy="20" r="1.5" {...stroke} />
        <circle cx="18" cy="20" r="1.5" {...stroke} />
        <path d="M2 3h2l2.5 12h11l2-8H6" {...stroke} />
      </svg>

      {/* Cesta — topo direita */}
      <svg className="absolute right-2 top-16 w-16 h-16 md:w-24 md:h-24 rotate-6" viewBox="0 0 24 24">
        <path d="M4 9h16l-1.5 10h-13L4 9z" {...stroke} />
        <path d="M8 9l2-5M16 9l-2-5" {...stroke} />
        <path d="M9 13v3M15 13v3M12 13v3" {...stroke} />
      </svg>

      {/* Xícara de café — base esquerda */}
      <svg className="absolute left-6 bottom-8 w-14 h-14 md:w-20 md:h-20 rotate-6" viewBox="0 0 24 24">
        <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" {...stroke} />
        <path d="M17 9h2a2 2 0 0 1 0 4h-2" {...stroke} />
        <path d="M8 3v2M12 3v2" {...stroke} />
      </svg>

      {/* Caixa de leite — base direita */}
      <svg className="absolute right-6 bottom-10 w-12 h-12 md:w-16 md:h-16 -rotate-6" viewBox="0 0 24 24">
        <path d="M7 8l2-4h6l2 4v12H7V8z" {...stroke} />
        <path d="M7 8h10" {...stroke} />
        <path d="M11 12h2v3h-2z" {...stroke} />
      </svg>
    </div>
  );
}
