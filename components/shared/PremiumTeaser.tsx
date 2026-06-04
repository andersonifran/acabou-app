"use client";

import Link from "next/link";
import { Lock, Sparkles, Check } from "lucide-react";

// =============================================
// PAYWALL CONTEXTUAL (teaser de função premium)
// =============================================
// Mostra ao usuário grátis O QUE ELE ESTÁ PERDENDO — descrição da função,
// benefícios e um CTA forte para /planos. Os dados reais NÃO são exibidos:
// o free vê só este teaser. Padrão de apps grandes (Spotify/LinkedIn) — converte
// mais que um redirect seco porque mostra o valor daquela função específica.

interface PremiumTeaserProps {
  emoji: string;
  title: string;
  subtitle: string;
  benefits: string[];
  /** Texto do CTA. Padrão: "Assinar Plano Família". */
  cta?: string;
}

export function PremiumTeaser({ emoji, title, subtitle, benefits, cta = "Assinar Plano Família" }: PremiumTeaserProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Topo — função + selo de cadeado */}
      <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 px-6 pt-8 pb-6 text-center border-b border-green-100">
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur px-2.5 py-1 rounded-full shadow-sm">
          <Lock size={12} className="text-amber-500" />
          <span className="text-[11px] font-bold text-amber-600">Plano Família</span>
        </div>
        <div className="text-5xl mb-2">{emoji}</div>
        <h3 className="font-black text-gray-900 text-lg">{title}</h3>
        <p className="text-sm text-gray-600 mt-1 max-w-xs mx-auto leading-relaxed">{subtitle}</p>
      </div>

      {/* Benefícios */}
      <div className="px-6 py-5 space-y-2.5">
        {benefits.map((b) => (
          <div key={b} className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Check size={12} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-700">{b}</span>
          </div>
        ))}
      </div>

      {/* Preço + CTA */}
      <div className="px-6 pb-6">
        <div className="text-center mb-3">
          <p className="text-xs text-gray-500">A partir de</p>
          <p className="text-2xl font-black text-green-700">
            R$ 4,99<span className="text-sm font-bold text-gray-500">/mês</span>
          </p>
        </div>
        <Link
          href="/planos"
          className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-colors shadow-md shadow-green-200 active:scale-[0.98]"
        >
          <Sparkles size={16} />
          {cta}
        </Link>
      </div>
    </div>
  );
}
