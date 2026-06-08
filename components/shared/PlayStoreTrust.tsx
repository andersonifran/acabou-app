import { cn } from "@/lib/utils";

/**
 * Selo de pagamento seguro para o app da PLAY STORE (TWA) — espelha o
 * PaymentTrust (Mercado Pago) que usamos na web, mas reforçando que a cobrança
 * é pelo Google Play (confiança + exigência do Google).
 *
 * Importante: NÃO reproduz o logo colorido oficial do Google Play (regra de
 * marca). Usa o texto "Google Play" + um triângulo na cor da nossa marca.
 * Pra trocar pelo badge oficial depois, é só substituir o bloco do "Google Play".
 */
export function PlayStoreTrust({ className = "" }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2.5 text-center", className)}>
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
        <span>🔒</span> Pagamento 100% seguro pelo
      </div>
      <div className="inline-flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/google-play.png"
          alt="Google Play"
          width={26}
          height={26}
          draggable={false}
          className="w-[26px] h-[26px] select-none"
        />
        <span className="text-lg font-bold text-gray-800">Google Play</span>
      </div>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {["💳 Cobrança pelo Google", "🔁 Renovação automática", "↩️ Cancele quando quiser"].map((m) => (
          <span
            key={m}
            className="text-[11px] font-semibold rounded-lg px-2.5 py-1 border shadow-sm text-gray-600 bg-white border-gray-200"
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
