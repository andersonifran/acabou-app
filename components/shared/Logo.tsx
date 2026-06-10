"use client";

import Link from "next/link";

interface LogoProps {
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
  linked?: boolean;
}

// Logo definitiva (a bonita), usada em toda a UI — gerada da logo OFICIAL
// (public/logo-oficial.png). O favicon da aba usa o kit oficial sob medida
// (app/favicon.ico + favicon-16x16/32x32.png), gerado da mesma logo.
export function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-icon.png"
      alt="Acabou?"
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: size * 0.22, flexShrink: 0, display: "block" }}
    />
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
