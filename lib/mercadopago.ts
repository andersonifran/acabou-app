// =============================================
// INTEGRAÇÃO MERCADO PAGO — Estrutura preparada
// =============================================
//
// Para ativar:
// 1. Configure no .env.local:
//    MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
//    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-...
//
// 2. Instale o SDK:
//    npm install mercadopago
//
// 3. Descomente o código abaixo

// import MercadoPagoLib from 'mercadopago';
//
// const mercadopago = new MercadoPagoLib({
//   accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
// });
//
// export { mercadopago };
//
// export async function createSubscriptionPreference(params: {
//   houseId: string;
//   userId: string;
//   plan: 'monthly' | 'yearly';
//   userEmail: string;
//   appUrl: string;
// }) {
//   const prices = {
//     monthly: { amount: 9.90, title: 'Acabou? — Plano Família Mensal' },
//     yearly:  { amount: 79.90, title: 'Acabou? — Plano Família Anual' },
//   };
//
//   const { amount, title } = prices[params.plan];
//
//   const preference = await mercadopago.preferences.create({
//     body: {
//       items: [{
//         id: params.plan,
//         title,
//         quantity: 1,
//         unit_price: amount,
//         currency_id: 'BRL',
//       }],
//       payer: { email: params.userEmail },
//       back_urls: {
//         success: `${params.appUrl}/planos?status=sucesso`,
//         failure: `${params.appUrl}/planos?status=erro`,
//         pending: `${params.appUrl}/planos?status=pendente`,
//       },
//       auto_return: 'approved',
//       external_reference: `${params.houseId}:${params.userId}:${params.plan}`,
//       notification_url: `${params.appUrl}/api/webhooks/payment`,
//     },
//   });
//
//   return preference.body.init_point;
// }

export {};
