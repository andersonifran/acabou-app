"use client";

import { useRouter } from "next/navigation";
import { X, Zap } from "lucide-react";

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "items" | "members";
}

const messages = {
  items: {
    title: "Você chegou ao limite de 40 itens",
    description: "No plano grátis você pode ter até 40 itens na despensa.",
  },
  members: {
    title: "Você chegou ao limite de 2 pessoas",
    description: "No plano grátis sua casa pode ter até 2 membros.",
  },
};

export function PlanLimitModal({ isOpen, onClose, reason }: PlanLimitModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const msg = messages[reason];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Zap size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{msg.title}</h2>
              <p className="text-sm text-gray-500">{msg.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="bg-green-50 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-green-800 mb-1">Plano Família</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✓ Itens ilimitados</li>
            <li>✓ Pessoas ilimitadas</li>
            <li>✓ Lembretes recorrentes</li>
            <li>✓ Histórico completo</li>
          </ul>
        </div>

        <button
          onClick={() => { onClose(); router.push("/planos"); }}
          className="w-full bg-green-600 text-white font-semibold py-3.5 rounded-xl hover:bg-green-700 transition-colors"
        >
          Desbloquear Plano Família por R$ 9,90/mês
        </button>
        <button
          onClick={onClose}
          className="w-full mt-2 text-gray-500 py-2 text-sm hover:text-gray-700 transition-colors"
        >
          Continuar no plano grátis
        </button>
      </div>
    </div>
  );
}
