import MercadoPagoLib, { Preference } from "mercadopago";

const client = new MercadoPagoLib({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const preference = new Preference(client);

export { preference };

// ⚡ PREÇOS DE LANÇAMENTO — voltar para 12.90 e 89.90 após fase de lançamento
export const PLANS = {
  monthly: {
    id: "familia-mensal",
    title: "Acabou? — Plano Família Mensal",
    amount: 8.90,
  },
  yearly: {
    id: "familia-anual",
    title: "Acabou? — Plano Família Anual",
    amount: 59.90,
  },
} as const;

export async function createPaymentPreference(params: {
  houseId: string;
  userId: string;
  plan: "monthly" | "yearly";
  userEmail: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br";
  const { title, amount, id } = PLANS[params.plan];

  const result = await preference.create({
    body: {
      items: [{
        id,
        title,
        quantity: 1,
        unit_price: amount,
        currency_id: "BRL",
      }],
      payer: { email: params.userEmail },
      back_urls: {
        success: `${appUrl}/planos?status=sucesso`,
        failure: `${appUrl}/planos?status=erro`,
        pending: `${appUrl}/planos?status=pendente`,
      },
      auto_return: "approved",
      external_reference: `${params.houseId}:${params.userId}:${params.plan}`,
      notification_url: `${appUrl}/api/webhooks/payment`,
      statement_descriptor: "ACABOU APP",
    },
  });

  return result.init_point!;
}
