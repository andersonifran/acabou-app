"use client";

import { useEffect } from "react";
import { useCasaEmDia } from "@/hooks/useCasaEmDia";
import { Confetti } from "@/components/shared/Confetti";
import { hapticSuccess } from "@/lib/haptics";

/**
 * Badge "Casa em dia" — aparece SÓ quando não falta nada (estado bom),
 * premiando o resultado que o usuário quer. Conta dias seguidos em dia e
 * comemora a cada 7. Nunca aparece em estado ruim → nunca soa como cobrança.
 */
export function CasaEmDiaBadge({ emDia, ready }: { emDia: boolean; ready: boolean }) {
  const { days, milestone } = useCasaEmDia(emDia, ready);

  useEffect(() => {
    if (milestone) hapticSuccess();
  }, [milestone]);

  if (!emDia || days < 1) return null;

  const title =
    days === 1 ? "Casa em dia! ✨" : `Casa em dia há ${days} dias! 🏆`;
  const subtitle =
    days === 1
      ? "Tudo abastecido, nada faltando."
      : days < 7
        ? "Continue assim — sua família agradece 💚"
        : days < 30
          ? "Que constância! Nada passa batido por aqui 🙌"
          : "Lendário! Sua casa nunca fica sem nada 👑";

  return (
    <>
      {milestone && <Confetti />}
      <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-4 py-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4 4 10-10" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-sm leading-tight">{title}</p>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">{subtitle}</p>
        </div>
      </div>
    </>
  );
}
