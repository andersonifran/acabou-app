// =============================================================
// GOOGLE PLAY BILLING — cliente (somente no app Android / TWA)
// =============================================================
// Regra do híbrido:
//   • App Android (TWA com billing)  -> Google Play Billing (exigência do Google)
//   • Web (navegador / PWA)          -> Mercado Pago (continua como hoje)
//
// A detecção usa a Digital Goods API, que SÓ existe dentro do app Android
// empacotado com Play Billing. No navegador, isPlayBillingAvailable() = false,
// então o app cai no fluxo do Mercado Pago automaticamente.
//
// Esta peça fica "dormente" até existir um .aab com Play Billing habilitado.

const PLAY_BILLING_METHOD = "https://play.google.com/billing";

// IDs dos produtos de assinatura — batem com os criados no Play Console.
// ✅ Produtos ATIVOS no Play Console (06/06/2026): plano_familia_mensal
// (R$ 8,90/mês) e plano_familia_anual (R$ 59,90/ano). Compra de teste real
// validada ponta a ponta em 07/06/2026. NÃO mudar estes IDs sem renomear lá.
export const PLAY_PRODUCT_IDS = {
  monthly: "plano_familia_mensal",
  yearly: "plano_familia_anual",
} as const;

export type PlanKey = "monthly" | "yearly";

// Retorna o serviço de Digital Goods se (e somente se) estamos no app Android
// com Play Billing disponível. No navegador, retorna null.
async function getDigitalGoodsService(): Promise<any | null> {
  if (typeof window === "undefined") return null;
  if (!("getDigitalGoodsService" in window)) return null;
  try {
    const svc = await (window as { getDigitalGoodsService: (m: string) => Promise<unknown> })
      .getDigitalGoodsService(PLAY_BILLING_METHOD);
    return svc ?? null;
  } catch {
    return null;
  }
}

// True só quando rodando no app Android (TWA) com Play Billing.
export async function isPlayBillingAvailable(): Promise<boolean> {
  return (await getDigitalGoodsService()) !== null;
}

export interface PlayPurchaseResult {
  purchaseToken: string;
  productId: string;
}

// Inicia a compra de uma assinatura via Google Play (dentro do app Android).
// Retorna o purchaseToken, que o BACKEND valida com a Google Play Developer API
// antes de liberar o plano (nunca confiamos só no cliente — anti-burla).
export async function purchaseSubscription(plan: PlanKey): Promise<PlayPurchaseResult | null> {
  const svc = await getDigitalGoodsService();
  if (!svc) return null; // não está no app Android -> chamador usa Mercado Pago

  const productId = PLAY_PRODUCT_IDS[plan];

  // PaymentRequest com o método do Google Play Billing.
  const request = new PaymentRequest(
    [{ supportedMethods: PLAY_BILLING_METHOD, data: { sku: productId } }],
    { total: { label: "Plano Família", amount: { currency: "BRL", value: "0" } } }
  );

  const response = await request.show();
  // O token vem em response.details (formato do Play Billing no TWA).
  const details = response.details as { token?: string; purchaseToken?: string };
  const purchaseToken = details.token ?? details.purchaseToken ?? "";
  await response.complete("success");

  if (!purchaseToken) return null;
  return { purchaseToken, productId };
}
