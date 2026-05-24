"use client";

import Link from "next/link";

interface LogoProps {
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  linked?: boolean;
}

// SVG fiel à logo enviada:
// - Fundo verde arredondado
// - Casa outline + checklist + interrogação formada pela base
export function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Fundo verde arredondado */}
      <rect width="100" height="100" rx="22" fill="#16a34a" />

      {/* Telhado da casa — traço externo */}
      <polyline
        points="20,42 50,13 80,42"
        stroke="white"
        strokeWidth="5.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />

      {/* Parede esquerda */}
      <path
        d="M 25 42 L 25 75 Q 25 81 31 81 L 60 81"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Parede direita — vira "?" */}
      <path
        d="M 75 42 L 75 63 Q 75 81 60 81 Q 50 81 50 90"
        stroke="white"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Ponto do "?" */}
      <circle cx="50" cy="95" r="3.5" fill="white" />

      {/* Checklist — item 1: checkmark + linha */}
      <polyline
        points="34,52 38,57 45,47"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="50" y1="52" x2="68" y2="52"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Checklist — item 2: bolinha + linha */}
      <circle cx="37" cy="63" r="2.8" fill="white" />
      <line
        x1="44" y1="63" x2="68" y2="63"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Checklist — item 3: bolinha + linha */}
      <circle cx="37" cy="73" r="2.8" fill="white" />
      <line
        x1="44" y1="73" x2="65" y2="73"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ iconOnly = false, size = "md", linked = false }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-xl" },
    md: { icon: 42, text: "text-2xl" },
    lg: { icon: 58, text: "text-4xl" },
  };
  const s = sizes[size];

  const content = (
    <div className="flex items-center gap-2.5">
      <LogoIcon size={s.icon} />
      {!iconOnly && (
        <span className={`font-black ${s.text} leading-none tracking-tight text-gray-900`}>
          Acabou?
        </span>
      )}
    </div>
  );

  if (linked) return <Link href="/">{content}</Link>;
  return content;
}

// Para usar inline em textos
export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black text-gray-900 ${className}`}>
      Acabou?
    </span>
  );
}
