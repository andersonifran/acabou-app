"use client";

import { useEffect, useState } from "react";

const KEY = "acabou-casa-em-dia";

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * "Casa em dia" — gamificação alinhada à promessa do app.
 * Em vez de cobrar abertura diária (que briga com o nosso "a gente lembra
 * por você"), celebra o RESULTADO: dias seguidos com nada faltando.
 *
 * Só conta/aparece quando a casa está em dia (sem itens na lista de compras).
 * Quando há algo pra comprar, a badge some — nunca pune o usuário, só premia
 * o bom estado. A cada 7 dias seguidos em dia, solta confete.
 *
 * @param emDia  true quando não há itens pendentes de compra
 * @param ready  só computa após dados confirmados (evita cache stale)
 */
export function useCasaEmDia(emDia: boolean, ready: boolean) {
  const [days, setDays] = useState(0);
  const [milestone, setMilestone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    try {
      const today = dayKey(new Date());
      const raw = localStorage.getItem(KEY);
      let count = 0;
      let last = "";
      if (raw) {
        const p = JSON.parse(raw);
        count = p.count ?? 0;
        last = p.last ?? "";
      }

      // Casa NÃO está em dia hoje → zera (sem punir, só não mostra)
      if (!emDia) {
        if (last !== today || count !== 0) {
          localStorage.setItem(KEY, JSON.stringify({ count: 0, last: today }));
        }
        setDays(0);
        return;
      }

      // Em dia. Já contabilizado hoje?
      if (last === today) {
        if (count === 0) {
          localStorage.setItem(KEY, JSON.stringify({ count: 1, last: today }));
          setDays(1);
        } else {
          setDays(count);
        }
        return;
      }

      // Novo dia em dia: continua se ontem também estava, senão recomeça
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = dayKey(yesterday);
      const newCount = last === yesterdayKey ? count + 1 : 1;

      localStorage.setItem(KEY, JSON.stringify({ count: newCount, last: today }));
      setDays(newCount);

      if (newCount >= 7 && newCount % 7 === 0) setMilestone(true);
    } catch {
      /* localStorage indisponível — silencioso */
    }
  }, [emDia, ready]);

  return { days, milestone };
}
