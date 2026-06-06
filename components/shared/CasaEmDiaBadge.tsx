"use client";

import { useEffect } from "react";
import { useCasaEmDia } from "@/hooks/useCasaEmDia";
import { Confetti } from "@/components/shared/Confetti";
import { Mascote } from "@/components/shared/Mascote";
import { hapticSuccess } from "@/lib/haptics";

/**
 * Badge de "humor da casa" — o Sacolino reage ao estado do local:
 *  - Nada faltando  → joinha 👍 + "{Local} em dia!" (premia o resultado)
 *  - Tem itens      → placa de alerta + "Você tem X pra comprar" (empurrãozinho amigável)
 * Só aparece após confirmar dados (ready) — nunca mostra estado errado do cache.
 */

export function CasaEmDiaBadge({
  shoppingCount,
  ready,
}: {
  shoppingCount: number;
  ready: boolean;
  // Mantido por compatibilidade com o caller; NÃO é mais usado. A saudação agora
  // é universal ("Tudo em dia") e não presume o tipo de local — uma "casa de
  // veraneio" pode ser sítio, chácara, fazenda, casa de praia, etc.
  propertyType?: string;
}) {
  const emDia = shoppingCount === 0;
  const { days, milestone } = useCasaEmDia(emDia, ready);

  useEffect(() => {
    if (milestone) hapticSuccess();
  }, [milestone]);

  if (!ready) return null;

  // ── Estado: TEM ITENS na lista → alerta amigável ──
  if (!emDia) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl pl-2 pr-4 py-2">
        <Mascote mood="alerta" size={56} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-sm leading-tight">Tem item te esperando! 🛒</p>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">
            Você tem <strong className="text-amber-700">{shoppingCount}</strong>{" "}
            {shoppingCount === 1 ? "item" : "itens"} pra comprar.
          </p>
        </div>
      </div>
    );
  }

  // ── Estado: TUDO EM DIA → joinha + streak ──
  if (days < 1) return null;

  const title = days === 1 ? "Tudo em dia! ✨" : `Tudo em dia há ${days} dias! 🏆`;
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
