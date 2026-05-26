import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPaymentApprovedEmail } from "@/lib/emails";
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
    console.log(`[Webhook] Processando pagamento ID: ${paymentId}`);

    // Busca detalhes do pagamento na API do Mercado Pago
    const client = new MercadoPagoLib({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    const paymentClient = new Payment(client);

    let payment;
    try {
      payment = await paymentClient.get({ id: paymentId });
      console.log(`[Webhook] Pagamento encontrado — status: ${payment?.status}, ref: ${payment?.external_reference}`);
    } catch (mpError) {
      console.error(`[Webhook] Erro ao buscar pagamento ${paymentId} no MP:`, mpError);
      return NextResponse.json({ ok: false, error: "Erro ao buscar pagamento" }, { status: 500 });
    }

    if (!payment || !payment.status) {
      return NextResponse.json({ ok: false, error: "Pagamento não encontrado" }, { status: 404 });
    }

    // Admin client para todas as operações de banco
    const supabase = createAdminClient();

    // Processa cancelamentos e expiração → downgrade para free
    if (payment.status === "cancelled" || payment.status === "refunded" || payment.status === "rejected") {
      const externalRef = payment.external_reference ?? "";
      const parts = externalRef.split(":");
      if (parts.length === 3) {
        const [houseId] = parts;
        await supabase
          .from("houses")
          .update({ plan: "free", plan_status: "inactive" })
          .eq("id", houseId);
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("house_id", houseId);
        console.log(`[Webhook] ⚠️ Pagamento ${paymentId} ${payment.status} — casa ${houseId} → downgrade para free`);
      }
      return NextResponse.json({ ok: true });
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

    // Idempotência: verifica se este pagamento já foi processado
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id, provider_subscription_id")
      .eq("house_id", houseId)
      .eq("provider_subscription_id", paymentId)
      .maybeSingle();

    if (existingSub) {
      console.log(`[Webhook] Pagamento ${paymentId} já processado — ignorando duplicata`);
      return NextResponse.json({ ok: true, message: "Já processado" });
    }

    // Calcula data de expiração do plano
    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // 1. Atualiza TODAS as casas do dono para o plano pago
    const { error: houseError } = await supabase
      .from("houses")
      .update({
        plan,
        plan_status: "active",
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq("owner_id", userId);

    if (houseError) {
      console.error("[Webhook] Erro ao atualizar casas:", houseError);
    } else {
      console.log(`[Webhook] ✅ Todas as casas do user ${userId} atualizadas para plano ${plan}`);
    }

    // 2. Salva subscription — tenta update primeiro, se não existe faz insert
    const { data: currentSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("house_id", houseId)
      .maybeSingle();

    if (currentSub) {
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({
          provider: "mercadopago",
          provider_subscription_id: paymentId,
          plan,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", currentSub.id);
      if (subError) console.error("[Webhook] Erro ao atualizar subscription:", subError);
      else console.log(`[Webhook] ✅ Subscription atualizada para casa ${houseId}`);
    } else {
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({
          house_id: houseId,
          user_id: userId,
          provider: "mercadopago",
          provider_subscription_id: paymentId,
          plan,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: expiresAt.toISOString(),
        });
      if (subError) console.error("[Webhook] Erro ao criar subscription:", subError);
      else console.log(`[Webhook] ✅ Subscription criada para casa ${houseId}`);
    }

    // 3. Envia e-mail de confirmação de pagamento (fire-and-forget)
    try {
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();

      if (authUser?.email) {
        sendPaymentApprovedEmail(
          authUser.email,
          profile?.full_name ?? "",
          plan,
          expiresAt.toISOString()
        ).catch((err) => console.error("[Webhook] Erro ao enviar email:", err));
      }
    } catch (emailErr) {
      console.error("[Webhook] Erro ao buscar dados para email:", emailErr);
    }

    console.log(`[Webhook] ✅ Pagamento ${paymentId} aprovado — casa ${houseId} → plano ${plan}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[Webhook Payment Error]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
