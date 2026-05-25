import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import MercadoPagoLib, { Payment } from "mercadopago";

// =============================================
// WEBHOOK DE PAGAMENTO — Mercado Pago
// =============================================
// Configure esta URL no painel do Mercado Pago:
// https://www.mercadopago.com.br/developers/panel/app
// Notifications → Webhooks → https://acabouapp.com.br/api/webhooks/payment
// Tópicos: payment

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Webhook Payment]", JSON.stringify(body));

    // Mercado Pago envia: { type: 'payment', data: { id: '123456' } }
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ ok: true }); // ignora outros eventos
    }

    const paymentId = String(body.data.id);

    // Busca detalhes do pagamento na API do Mercado Pago
    const client = new MercadoPagoLib({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment || !payment.status) {
      return NextResponse.json({ ok: false, error: "Pagamento não encontrado" }, { status: 404 });
    }

    // Só processa pagamentos aprovados
    if (payment.status !== "approved") {
      console.log(`[Webhook] Pagamento ${paymentId} com status: ${payment.status} — ignorado`);
      return NextResponse.json({ ok: true });
    }

    // Parse do external_reference: "houseId:userId:plan"
    const externalRef = payment.external_reference ?? "";
    const parts = externalRef.split(":");
    if (parts.length !== 3) {
      console.error("[Webhook] external_reference inválido:", externalRef);
      return NextResponse.json({ ok: false, error: "external_reference inválido" }, { status: 400 });
    }

    const [houseId, userId, plan] = parts;

    // Calcula data de expiração do plano
    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Atualiza o banco via admin client (bypassa RLS)
    const supabase = createAdminClient();

    // 1. Atualiza o plano da casa
    const { error: houseError } = await supabase
      .from("houses")
      .update({
        plan,
        plan_status: "active",
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq("id", houseId);

    if (houseError) {
      console.error("[Webhook] Erro ao atualizar casa:", houseError);
    }

    // 2. Upsert na tabela subscriptions
    const { error: subError } = await supabase
      .from("subscriptions")
      .upsert({
        house_id: houseId,
        user_id: userId,
        provider: "mercadopago",
        provider_payment_id: paymentId,
        plan,
        status: "active",
        amount: payment.transaction_amount ?? 0,
        currency: "BRL",
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      }, {
        onConflict: "house_id",
      });

    if (subError) {
      console.error("[Webhook] Erro ao salvar subscription:", subError);
    }

    console.log(`[Webhook] ✅ Pagamento ${paymentId} aprovado — casa ${houseId} → plano ${plan}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[Webhook Payment Error]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
