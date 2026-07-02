import "server-only"; // trava: nunca pode ir pro client (protege MERCADOPAGO_ACCESS_TOKEN)
import MercadoPagoLib, { Preference, PreApproval } from "mercadopago";

const client = new MercadoPagoLib({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const preference = new Preference(client);
const preApproval = new PreApproval(client);

export { preference, preApproval };

// ⚡ PREÇOS DE LANÇAMENTO — voltar para 12.90 e 89.90 após fase de lançamento
export const PLANS = {
  monthly: {
    id: "familia-mensal",
    title: "Acabou? — Plano Família Mensal",
    amount: 6.90,
    // Cobrança recorrente: a cada 1 mês
    frequency: 1,
    frequency_type: "months",
  },
  yearly: {
    id: "familia-anual",
    title: "Acabou? — Plano Família Anual",
    amount: 39.90,
    // Cobrança recorrente: a cada 12 meses
    frequency: 12,
    frequency_type: "months",
  },
} as const;

// =============================================
// ASSINATURA RECORRENTE (auto-renovação) — Mercado Pago Preapproval
// =============================================
// Cria uma assinatura que cobra o cartão automaticamente a cada período.
// O usuário é redirecionado ao init_point para autorizar (cadastrar o cartão).
// Os eventos de cobrança/renovação/cancelamento chegam pelo webhook
// (tópicos: subscription_preapproval e subscription_authorized_payment),
// que precisam estar configurados no painel do Mercado Pago apontando para
// {APP_URL}/api/webhooks/payment.
export async function createRecurringSubscription(params: {
  houseId: string;
  userId: string;
  plan: "monthly" | "yearly";
  userEmail: string;
  /**
   * Quando o usuário REATIVA dentro de um período ainda pago (ex.: cancelou mas
   * ainda tem acesso até dia X), a primeira cobrança da nova assinatura começa
   * em X — assim ele NÃO paga em dobro. Para assinante novo, omitir (cobra já).
   */
  startDate?: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br";
  const { title, amount, frequency, frequency_type } = PLANS[params.plan];

  const result = await preApproval.create({
    body: {
      reason: title,
      auto_recurring: {
        frequency,
        frequency_type,
        transaction_amount: amount,
        currency_id: "BRL",
        ...(params.startDate ? { start_date: params.startDate } : {}),
      },
      back_url: `${appUrl}/planos?status=sucesso`,
      payer_email: params.userEmail,
      external_reference: `${params.houseId}:${params.userId}:${params.plan}`,
      status: "pending",
    },
  });

  return result.init_point!;
}

// Cancela uma assinatura recorrente no Mercado Pago (status terminal).
// O acesso do usuário NÃO é cortado aqui — ele continua até plan_expires_at.
export async function cancelRecurringSubscription(preapprovalId: string) {
  return preApproval.update({
    id: preapprovalId,
    body: { status: "cancelled" },
  });
}
