"use client";

import { useEffect, useState } from "react";

const KEY = "acabou-streak";

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Streak de uso diário (estilo Duolingo) — conta dias consecutivos que o
 * usuário abre o app. Guardado em localStorage (por dispositivo): instantâneo,
 * sem chamada de rede, sem mexer no banco. Reforça o hábito e a retenção.
 *
 * Retorna:
 * - streak: número de dias seguidos
 * - milestone: true quando bate um múltiplo de 7 (momento de celebrar)
 */
export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [milestone, setMilestone] = useState(false);

  useEffect(() => {
    try {
      const today = new Date();
      const todayKey = dayKey(today);

      const raw = localStorage.getItem(KEY);
      let count = 0;
      let last = "";
      if (raw) {
        const parsed = JSON.parse(raw);
        count = parsed.count ?? 0;
        last = parsed.last ?? "";
      }

      // Já contou hoje → mantém
      if (last === todayKey) {
        setStreak(count);
        return;
      }

      // Ontem?
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayKey = dayKey(yesterday);

      const newCount = last === yesterdayKey ? count + 1 : 1;
      localStorage.setItem(KEY, JSON.stringify({ count: newCount, last: todayKey }));
      setStreak(newCount);

      // Celebra a cada 7 dias (e nunca no primeiro registro)
      if (newCount >= 7 && newCount % 7 === 0) {
        setMilestone(true);
      }
    } catch {
      /* localStorage indisponível — silencioso */
    }
  }, []);

  return { streak, milestone };
}
