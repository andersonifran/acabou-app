import { cn } from "@/lib/utils";

/**
 * Ícones de local — minimalistas e premium (app-icon style).
 * Símbolo branco cheio sobre tile com gradiente da cor do tipo + brilho sutil.
 * Reconhecimento instantâneo no mobile, cores distintas sem exagero.
 */

type LocType = "casa" | "apartamento" | "praia" | "veraneio" | "empresa" | "outro";

const GRAD: Record<LocType, [string, string]> = {
  casa:        ["#34d399", "#059669"], // verde
  apartamento: ["#60a5fa", "#2563eb"], // azul
  praia:       ["#22d3ee", "#0891b2"], // ciano
  veraneio:    ["#fbbf24", "#f59e0b"], // âmbar (campo/rústico)
  empresa:     ["#c084fc", "#7c3aed"], // roxo
  outro:       ["#cbd5e1", "#94a3b8"], // cinza
};

// recesso suave (portas/janelas) — funciona em qualquer cor de tile
const REC = "rgba(0,0,0,0.16)";

function Symbol({ type }: { type: LocType }) {
  switch (type) {
    case "casa":
      return (
        <>
          <path d="M24 12.5 L36.5 22.5 H34 V34 a1 1 0 0 1-1 1 H15 a1 1 0 0 1-1-1 V22.5 H11.5 Z" fill="#fff" />
          <rect x="21" y="27" width="6" height="8" rx="1.4" fill={REC} />
        </>
      );
    case "apartamento":
      return (
        <>
          <rect x="14.5" y="13" width="19" height="22" rx="2" fill="#fff" />
          {[17.5, 22, 26.5].map((x) =>
            [16.5, 21, 25.5].map((y) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="2.6" height="2.6" rx="0.6" fill={REC} />
            ))
          )}
          <rect x="21" y="30.5" width="6" height="4.5" rx="1" fill={REC} />
        </>
      );
    case "praia":
      return (
        <>
          <circle cx="24" cy="18" r="5" fill="#fff" />
          <g stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
            <path d="M24 9.5v-2M24 28.5v2M13.5 18h-2M36.5 18h-2M16.6 10.6l-1.4-1.4M32.8 26.8l-1.4-1.4M31.4 10.6l1.4-1.4M16.6 25.4l-1.4 1.4" />
          </g>
          <path d="M12 32 q3 -3.5 6 0 t6 0 t6 0" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </>
      );
    case "veraneio":
      return (
        <>
          <path d="M24 13 L30.5 23 H17.5 Z" fill="#fff" />
          <path d="M24 19 L32.5 31 H15.5 Z" fill="#fff" />
          <rect x="22.4" y="31" width="3.2" height="4.5" rx="0.8" fill="#fff" />
        </>
      );
    case "empresa":
      return (
        <>
          {/* corpo da loja */}
          <rect x="15" y="23.5" width="18" height="11.5" rx="1.4" fill="#fff" />
          {/* toldo */}
          <path d="M13 19.5 H35 L33.2 23.5 H14.8 Z" fill="#fff" />
          {[17.7, 21.4, 25.1, 28.8].map((x) => (
            <path key={x} d={`M${x} 19.5 L${x - 1.2} 23.5`} stroke={REC} strokeWidth="2.2" />
          ))}
          {/* porta */}
          <rect x="21.5" y="27" width="5" height="8" rx="1" fill={REC} />
        </>
      );
    case "outro":
    default:
      return (
        <path
          d="M24 35 C24 35 31 26.5 31 20.5 A7 7 0 1 0 17 20.5 C17 26.5 24 35 24 35 Z M24 17.4 A3.1 3.1 0 1 0 24.01 17.4 Z"
          fill="#fff"
          fillRule="evenodd"
        />
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
  const t = (GRAD[type as LocType] ? type : "casa") as LocType;
  const [from, to] = GRAD[t];
  const gid = `loc-${t}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("select-none", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      {/* tile */}
      <rect width="48" height="48" rx="13" fill={`url(#${gid})`} />
      {/* brilho premium no topo */}
      <rect width="48" height="22" rx="13" fill="#fff" fillOpacity="0.12" />
      <Symbol type={t} />
    </svg>
  );
}
