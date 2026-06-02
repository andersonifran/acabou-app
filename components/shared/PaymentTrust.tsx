import { cn } from "@/lib/utils";

/**
 * Selo de pagamento seguro — logo oficial do Mercado Pago + reforço de
 * segurança e formas de pagamento. Usado nos pontos de decisão de compra.
 *
 * Regra de marca do MP:
 *  - variant "light" (padrão) → fundo CLARO → logo colorida
 *  - variant "dark"           → fundo ESCURO/colorido → logo branca (pluma)
 */
export function PaymentTrust({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const isDark = variant === "dark";

  return (
    <div className={cn("flex flex-col items-center gap-2.5 text-center", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-semibold",
          isDark ? "text-white/70" : "text-gray-500"
        )}
      >
        <span>🔒</span> Pagamento 100% seguro processado por
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isDark ? "/mercadopago/mp-horizontal-white.png" : "/mercadopago/mp-horizontal.png"}
        alt="Mercado Pago"
        draggable={false}
        className="h-7 md:h-8 w-auto select-none"
      />
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {["Pix", "Cartão", "Boleto"].map((m) => (
          <span
            key={m}
            className={cn(
              "text-[11px] font-semibold rounded-lg px-2.5 py-1 border shadow-sm",
              isDark
                ? "text-white/80 bg-white/10 border-white/15"
                : "text-gray-600 bg-white border-gray-200"
            )}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
