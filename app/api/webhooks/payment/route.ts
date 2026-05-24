import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// =============================================
// WEBHOOK DE PAGAMENTO — Mercado Pago
// =============================================
// URL para configurar no Mercado Pago:
// https://seudominio.com/api/webhooks/payment
//
// Referência:
// https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica do evento
    if (!body.type || !body.data) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // =============================================
    // TODO: Implementar processamento do webhook
    // =============================================
    // Quando payment.updated ou payment.created:
    //
    // 1. Busque os detalhes do pagamento na API do MP
    // 2. Parse o external_reference: "houseId:userId:plan"
    // 3. Atualize a tabela subscriptions no Supabase
    // 4. Atualize o plano da house correspondente
    //
    // Exemplo:
    // if (body.type === 'payment') {
    //   const paymentId = body.data.id;
    //   const { body: payment } = await mercadopago.payment.findById(paymentId);
    //   if (payment.status === 'approved') {
    //     const [houseId, userId, plan] = payment.external_reference.split(':');
    //     const supabase = await createAdminClient();
    //     await supabase.from('houses').update({ plan, plan_status: 'active' }).eq('id', houseId);
    //     await supabase.from('subscriptions').upsert({...});
    //   }
    // }
    // =============================================

    console.log("[Webhook Payment]", body.type, body.data?.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook Payment Error]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
