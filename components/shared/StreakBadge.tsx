"use client";

import { useEffect } from "react";
import { useStreak } from "@/hooks/useStreak";
import { Confetti } from "@/components/shared/Confetti";
import { hapticSuccess } from "@/lib/haptics";

/**
 * Badge de streak (dias seguidos) na Home. Motiva o usuário a voltar todos
 * os dias — gatilho de retenção. A cada 7 dias, solta confete + vibração.
 */
export function StreakBadge() {
  const { streak, milestone } = useStreak();

  useEffect(() => {
    if (milestone) hapticSuccess();
  }, [milestone]);

  // Não mostra nada até ter pelo menos 1 dia computado
  if (streak < 1) return null;

  const subtitle =
    streak === 1
      ? "Bem-vindo! Comece sua sequência 💚"
      : streak < 7
        ? "Você está cuidando bem da sua casa 💚"
        : streak < 30
          ? "Que constância! Sua casa agradece 🙌"
          : "Lendário! Sua casa nunca fica sem nada 👑";

  const daysToNext = 7 - (streak % 7 === 0 ? 7 : streak % 7);

  return (
    <>
      {milestone && <Confetti />}
      <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-4 py-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-2xl shrink-0 shadow-sm">
          🔥
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-sm leading-tight">
            {streak} {streak === 1 ? "dia" : "dias"} seguidos!
          </p>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">{subtitle}</p>
        </div>
        {streak >= 2 && daysToNext > 0 && daysToNext < 7 && (
          <div className="text-right shrink-0">
            <p className="text-[10px] text-orange-500 font-bold leading-tight">+{daysToNext}</p>
            <p className="text-[9px] text-gray-400 leading-tight">p/ marco</p>
          </div>
        )}
      </div>
    </>
  );
}
