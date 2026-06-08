"use client";

import { useEffect, useState } from "react";
import { PaymentTrust } from "@/components/shared/PaymentTrust";
import { isPlayBillingAvailable } from "@/lib/play-billing";

// Selo "pagamento seguro · Mercado Pago" SÓ na web/PWA.
// Mostra por PADRÃO (web/Facebook Ads/SSR — sem regressão pra quem importa) e
// ESCONDE dentro do app da Play Store (TWA), onde a política de Pagamentos do
// Google penaliza exibir marca de pagamento alternativo. A checagem só roda no
// cliente após montar; no TWA o selo some logo após o paint.
export function PaymentTrustWeb(props: React.ComponentProps<typeof PaymentTrust>) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(isPlayBillingAvailable())
      .then((avail) => { if (!cancelled && avail) setHide(true); })
      .catch(() => { /* fora do TWA: mantém visível */ });
    return () => { cancelled = true; };
  }, []);
  if (hide) return null;
  return <PaymentTrust {...props} />;
}
