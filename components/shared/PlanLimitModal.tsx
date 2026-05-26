"use client";

import { useRouter } from "next/navigation";
import { X, Zap, Users, Package, Bell, Clock } from "lucide-react";

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "items" | "members";
}

const messages = {
  items: {
    title: "Limite de 20 itens atingido",
    description: "No plano grátis você pode ter até 20 itens na despensa.",
    emoji: "📦",
  },
  members: {
    title: "Convide sua família!",
    description: "No plano grátis apenas você pode usar o app.",
    emoji: "👨‍👩‍👧‍👦",
  },
};

export function PlanLimitModal({ isOpen, onClose, reason }: PlanLimitModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const msg = messages[reason];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl">
              {msg.emoji}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">{msg.title}</h2>
              <p className="text-sm text-gray-500">{msg.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Features do plano pago */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border border-green-100">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-green-600" />
            <p className="text-sm font-bold text-green-800">Plano Família inclui:</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Package, text: "Itens ilimitados" },
              { icon: Users, text: "Pessoas ilimitadas" },
              { icon: Bell, text: "Lembretes recorrentes" },
              { icon: Clock, text: "Histórico completo" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 bg-white/60 rounded-lg px-2.5 py-2">
                <Icon size={14} className="text-green-600 shrink-0" />
                <span className="text-xs font-medium text-green-800">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preço + CTA */}
        <div className="text-center mb-3">
          <p className="text-xs text-gray-500 mb-1">Tudo isso por menos que um cafezinho</p>
          <p className="text-2xl font-black text-green-700">
            R$ 4,99<span className="text-sm font-bold text-gray-500">/mês</span>
          </p>
        </div>

        <button
          onClick={() => { onClose(); router.push("/planos"); }}
          className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-colors shadow-md shadow-green-200 active:scale-[0.98]"
        >
          Desbloquear Plano Família
        </button>
        <button
          onClick={onClose}
          className="w-full mt-2 text-gray-400 py-2 text-xs hover:text-gray-600 transition-colors"
        >
          Continuar no plano grátis
        </button>
      </div>
    </div>
  );
}
