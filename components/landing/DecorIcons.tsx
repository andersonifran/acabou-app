/**
 * Ícones decorativos de fundo (carrinho, cesta, café, leite, maçã, sacola).
 * Posicionados nos cantos, com FLUTUAÇÃO suave (cada um num ritmo diferente)
 * para dar vida sem distrair. Não interferem no conteúdo (pointer-events-none)
 * e respeitam prefers-reduced-motion.
 *
 * variant="light" → ícones verdes para fundos claros
 * variant="dark"  → ícones brancos para fundos verdes/escuros (mais visíveis)
 */
export function DecorIcons({ variant = "light" }: { variant?: "light" | "dark" }) {
  const color = variant === "dark" ? "#ffffff" : "#16a34a";
  const opacity = variant === "dark" ? 0.15 : 0.07;

  const stroke = {
    stroke: color,
    strokeWidth: 2,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons = [
    {
      // Carrinho de compras — topo esquerda
      wrap: "-left-4 top-8",
      svg: "w-20 h-20 md:w-28 md:h-28 -rotate-12",
      delay: "0s",
      dur: "9s",
      paths: (
        <>
          <circle cx="9" cy="20" r="1.5" {...stroke} />
          <circle cx="18" cy="20" r="1.5" {...stroke} />
          <path d="M2 3h2l2.5 12h11l2-8H6" {...stroke} />
        </>
      ),
    },
    {
      // Cesta — topo direita
      wrap: "right-2 top-16",
      svg: "w-16 h-16 md:w-24 md:h-24 rotate-6",
      delay: "1.4s",
      dur: "11s",
      paths: (
        <>
          <path d="M4 9h16l-1.5 10h-13L4 9z" {...stroke} />
          <path d="M8 9l2-5M16 9l-2-5" {...stroke} />
          <path d="M9 13v3M15 13v3M12 13v3" {...stroke} />
        </>
      ),
    },
    {
      // Xícara de café — base esquerda
      wrap: "left-6 bottom-8",
      svg: "w-14 h-14 md:w-20 md:h-20 rotate-6",
      delay: "2.5s",
      dur: "8s",
      paths: (
        <>
          <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" {...stroke} />
          <path d="M17 9h2a2 2 0 0 1 0 4h-2" {...stroke} />
          <path d="M8 3v2M12 3v2" {...stroke} />
        </>
      ),
    },
    {
      // Caixa de leite — base direita
      wrap: "right-6 bottom-10",
      svg: "w-12 h-12 md:w-16 md:h-16 -rotate-6",
      delay: "0.8s",
      dur: "10s",
      paths: (
        <>
          <path d="M7 8l2-4h6l2 4v12H7V8z" {...stroke} />
          <path d="M7 8h10" {...stroke} />
          <path d="M11 12h2v3h-2z" {...stroke} />
        </>
      ),
    },
    {
      // Maçã — meio esquerda
      wrap: "left-2 top-1/2",
      svg: "w-12 h-12 md:w-16 md:h-16 rotate-12",
      delay: "3.2s",
      dur: "12s",
      paths: (
        <>
          <path d="M12 7c-1-2-3-2.5-4.5-1.5C6 6.5 6 9 7 11.5c.8 2 1.8 4 3 5 .8.7 1.8.7 2.6 0" {...stroke} />
          <path d="M12 7c1-2 3-2.5 4.5-1.5C18 6.5 18 9 17 11.5c-.8 2-1.8 4-3 5-.8.7-1.8.7-2.6 0" {...stroke} />
          <path d="M12 7V4M12 4c0-1 1-2 2-2" {...stroke} />
        </>
      ),
    },
    {
      // Sacola de compras — meio direita
      wrap: "right-3 top-1/3",
      svg: "w-12 h-12 md:w-16 md:h-16 -rotate-6",
      delay: "1.9s",
      dur: "9.5s",
      paths: (
        <>
          <path d="M6 8h12l-1 12H7L6 8z" {...stroke} />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" {...stroke} />
        </>
      ),
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{ opacity }}
    >
      {icons.map((ic, i) => (
        <span
          key={i}
          className={`animate-float absolute ${ic.wrap}`}
          style={{ animationDelay: ic.delay, animationDuration: ic.dur }}
        >
          <svg className={ic.svg} viewBox="0 0 24 24">
            {ic.paths}
          </svg>
        </span>
      ))}
    </div>
  );
}
