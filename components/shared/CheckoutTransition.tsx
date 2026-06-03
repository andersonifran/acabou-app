import { LogoIcon } from "@/components/shared/Logo";
import { Mascote } from "@/components/shared/Mascote";

/**
 * Tela-ponte de confiança antes de redirecionar para o checkout do Mercado Pago.
 * Mostra nossa marca + Sacolino + selos de segurança para o usuário sentir
 * que está num ambiente protegido (reduz abandono no pagamento).
 */
export function CheckoutTransition({ planName, price }: { planName: string; price: string }) {
  return (
    <div className="fixed inset-0 z-[80] bg-white flex flex-col items-center justify-center px-6 text-center overflow-y-auto">
      {/* Marca */}
      <div className="flex items-center gap-2 mb-5">
        <LogoIcon size={36} />
        <span className="text-xl font-black text-gray-900">Acabou?</span>
      </div>

      {/* Sacolino feliz */}
      <Mascote mood="feliz" size={120} className="mb-2" />

      {/* Selo de segurança */}
      <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
        🔒 Ambiente 100% seguro
      </div>

      <h1 className="text-xl font-black text-gray-900 mb-2">
        Quase lá! Vamos ao pagamento seguro
      </h1>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-5">
        Estamos te levando para concluir pelo <strong className="text-gray-700">Mercado Pago</strong>,
        com total proteção dos seus dados. É rápido!
      </p>

      {/* Resumo do plano */}
      <div className="w-full max-w-xs bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-[11px] text-green-700 font-bold uppercase tracking-wide">Seu plano</p>
            <p className="font-black text-gray-900">{planName}</p>
          </div>
          <p className="text-lg font-black text-green-700">{price}</p>
        </div>
      </div>

      {/* Selos de confiança */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-gray-500 font-medium mb-4 max-w-xs">
        <span className="inline-flex items-center gap-1">🔐 Dados criptografados</span>
        <span className="inline-flex items-center gap-1">✓ Compra protegida</span>
        <span className="inline-flex items-center gap-1">↩️ Cancele quando quiser</span>
      </div>

      {/* Badge Mercado Pago oficial + formas de pagamento */}
      <div className="w-full max-w-xs bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 mb-6">
        <p className="text-[11px] text-gray-400 mb-2">Pagamento processado por</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mercadopago/mp-horizontal.png" alt="Mercado Pago" draggable={false} className="h-9 w-auto mx-auto mb-2.5 select-none" />
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {["💳 Cartão de crédito", "🔁 Renova automático"].map((m) => (
            <span key={m} className="text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Indicador de redirecionamento */}
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <span className="w-4 h-4 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin" />
        Redirecionando para o pagamento seguro...
      </div>
    </div>
  );
}
