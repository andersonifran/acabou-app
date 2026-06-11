"use client";

import { useEffect, useState } from "react";
import { PaymentTrust } from "@/components/shared/PaymentTrust";
import { isPlayBillingAvailable } from "@/lib/play-billing";

// Selo "pagamento seguro · Mercado Pago" SÓ na web/PWA.
// REGRA DE OURO (compliance Google): DENTRO do app da Play Store (TWA) este selo
// NUNCA pode aparecer — nem por um frame — porque a política de Pagamentos do
// Google penaliza exibir marca de pagamento alternativo dentro do app da Loja.
// Por isso ESCONDE POR PADRÃO e só REVELA depois de confirmar que NÃO é TWA.
// Na web a checagem resolve num microtask (getDigitalGoodsService nem existe no
// navegador) → o selo aparece praticamente instantâneo, sem regressão pro
// usuário web/Facebook Ads (que é quem paga via Mercado Pago).
export function PaymentTrustWeb(props: React.ComponentProps<typeof PaymentTrust>) {
  const [showWeb, setShowWeb] = useState(false);
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(isPlayBillingAvailable())
      .then((avail) => { if (!cancelled && !avail) setShowWeb(true); })
      .catch(() => { if (!cancelled) setShowWeb(true); }); // erro = não é TWA = web
    return () => { cancelled = true; };
  }, []);
  if (!showWeb) return null;
  return <PaymentTrust {...props} />;
}
