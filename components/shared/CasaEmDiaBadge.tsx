"use client";

import { useEffect } from "react";
import { useCasaEmDia } from "@/hooks/useCasaEmDia";
import { Confetti } from "@/components/shared/Confetti";
import { Mascote } from "@/components/shared/Mascote";
import { hapticSuccess } from "@/lib/haptics";

/**
 * Badge "{Local} em dia" — aparece SÓ quando não falta nada (estado bom),
 * premiando o resultado que o usuário quer. O Sacolino dá um joinha 👍.
 * Conta dias seguidos em dia e comemora a cada 7. Nunca aparece em estado
 * ruim → nunca soa como cobrança. O texto muda conforme o tipo de local.
 */

// "Casa em dia", "Apê em dia", etc. — personalizado por tipo de local
const EM_DIA_LABEL: Record<string, string> = {
  casa: "Casa em dia",
  apartamento: "Apê em dia",
  praia: "Praia em dia",
  veraneio: "Sítio em dia",
  empresa: "Empresa em dia",
  outro: "Local em dia",
};

export function CasaEmDiaBadge({
  emDia,
  ready,
  propertyType = "casa",
}: {
  emDia: boolean;
  ready: boolean;
  propertyType?: string;
}) {
  const { days, milestone } = useCasaEmDia(emDia, ready);

  useEffect(() => {
    if (milestone) hapticSuccess();
  }, [milestone]);

  if (!emDia || days < 1) return null;

  const label = EM_DIA_LABEL[propertyType] ?? EM_DIA_LABEL.casa;
  const title = days === 1 ? `${label}! ✨` : `${label} há ${days} dias! 🏆`;
  const subtitle =
    days === 1
      ? "Tudo abastecido, nada faltando."
      : days < 7
        ? "Continue assim — sua família agradece 💚"
        : days < 30
          ? "Que constância! Nada passa batido por aqui 🙌"
          : "Lendário! Nunca fica sem nada 👑";

  return (
    <>
      {milestone && <Confetti />}
      <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl pl-2 pr-4 py-2">
        <Mascote mood="feliz" size={56} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-sm leading-tight">{title}</p>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">{subtitle}</p>
        </div>
      </div>
    </>
  );
}
