/**
 * Ícones de local em estilo "mini app icon" — quadrado arredondado com
 * gradiente e símbolo branco. Consistentes, premium e idênticos em qualquer
 * aparelho (ao contrário de emoji, que muda de visual por OS).
 */

type LocationType = "casa" | "apartamento" | "praia" | "veraneio" | "empresa" | "outro";

const GRADIENTS: Record<LocationType, [string, string]> = {
  casa: ["#34d399", "#16a34a"],
  apartamento: ["#60a5fa", "#2563eb"],
  praia: ["#22d3ee", "#0891b2"],
  veraneio: ["#34d399", "#059669"],
  empresa: ["#a78bfa", "#7c3aed"],
  outro: ["#94a3b8", "#64748b"],
};

const S = {
  fill: "none",
  stroke: "#fff",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Symbol({ type }: { type: LocationType }) {
  switch (type) {
    case "casa":
      return (
        <>
          <path d="M15 25.5 L24 17 L33 25.5" {...S} />
          <path d="M17.5 24 V33 a1 1 0 001 1 H29.5 a1 1 0 001-1 V24" {...S} />
          <path d="M21.5 34 V30 a1 1 0 011-1 H25.5 a1 1 0 011 1 V34" {...S} />
        </>
      );
    case "apartamento":
      return (
        <>
          <path d="M17 34 V16.5 a1 1 0 011-1 H30 a1 1 0 011 1 V34" {...S} />
          <line x1="15" y1="34" x2="33" y2="34" {...S} />
          <line x1="21" y1="20" x2="21" y2="20.5" {...S} />
          <line x1="27" y1="20" x2="27" y2="20.5" {...S} />
          <line x1="21" y1="25" x2="21" y2="25.5" {...S} />
          <line x1="27" y1="25" x2="27" y2="25.5" {...S} />
        </>
      );
    case "praia":
      return (
        <>
          <circle cx="24" cy="21" r="4" {...S} />
          <path d="M24 13.5v-1.5M24 30v1.5M16.2 21h-1.5M33.3 21h-1.5M18.7 15.7l-1-1M30.3 27.3l-1-1M29.3 15.7l1-1M18.7 27.3l-1-1" {...S} />
          <path d="M15 33 q2.5 -2.5 5 0 t5 0 t5 0" {...S} />
        </>
      );
    case "veraneio":
      return (
        <>
          <path d="M24 15 L29 23.5 H19 Z" {...S} />
          <path d="M24 20 L31 31 H17 Z" {...S} />
          <line x1="24" y1="31" x2="24" y2="35" {...S} />
        </>
      );
    case "empresa":
      return (
        <>
          <rect x="15" y="20.5" width="18" height="13.5" rx="2.2" {...S} />
          <path d="M20 20.5 V18.5 a2 2 0 012-2 H26 a2 2 0 012 2 V20.5" {...S} />
          <line x1="15.5" y1="26" x2="32.5" y2="26" {...S} />
        </>
      );
    case "outro":
    default:
      return (
        <>
          <path d="M24 34.5 C24 34.5 31 27.5 31 21.5 a7 7 0 10-14 0 C17 27.5 24 34.5 24 34.5 Z" {...S} />
          <circle cx="24" cy="21" r="2.6" fill="#fff" stroke="none" />
        </>
      );
  }
}

export function LocationIcon({
  type,
  size = 40,
  className = "",
}: {
  type?: string;
  size?: number;
  className?: string;
}) {
  const t = (GRADIENTS[type as LocationType] ? type : "casa") as LocationType;
  const [from, to] = GRADIENTS[t];
  const gid = `loc-grad-${t}`;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill={`url(#${gid})`} />
      <Symbol type={t} />
    </svg>
  );
}
