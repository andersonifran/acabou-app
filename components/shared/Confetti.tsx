"use client";

import { useEffect, useMemo, useState } from "react";

const COLORS = ["#16a34a", "#22c55e", "#f59e0b", "#3b82f6", "#ef4444", "#a855f7", "#ec4899"];

/**
 * Confete leve (sem dependências) para celebrar momentos especiais —
 * ex: finalizar a compra. Cai do topo, gira, e some sozinho.
 * pointer-events-none: nunca atrapalha o toque do usuário.
 */
export function Confetti({ count = 44, duration = 2400 }: { count?: number; duration?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 350,
        dur: 1500 + Math.random() * 1100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 7,
        rot: Math.random() * 360,
        drift: (Math.random() - 0.5) * 160,
        round: Math.random() > 0.6,
      })),
    [count]
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  // Respeita quem prefere menos movimento
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!visible || reduceMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 confetti-piece"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.round ? p.size : p.size * 1.5}px`,
            background: p.color,
            borderRadius: p.round ? "9999px" : "2px",
            ["--drift" as string]: `${p.drift}px`,
            ["--rot" as string]: `${p.rot}deg`,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.dur}ms`,
          }}
        />
      ))}
    </div>
  );
}
