import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPaymentApprovedEmail } from "@/lib/emails";
import { cookies } from "next/headers";
import MercadoPagoLib, { Payment } from "mercadopago";

// =============================================
// CONFIRMAR PAGAMENTO — Fallback do Webhook
// =============================================
// Quando o usuário volta do Mercado Pago com status=sucesso,
// a página de planos chama esta API para verificar e ativar o plano.
// Isso garante ativação mesmo que o webhook falhe.

export async function POST(request: NextRequest) {
  try {
    // 1. Verifica autenticação
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // 2. Busca a casa do usuário
    const { data: membership } = await supabase
      .from("house_members")
      .select("house_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    const houseId = membership.house_id;

    // 3. Verifica se a casa já tem plano pago ativo
    const supabaseAdmin = createAdminClient();
    const { data: house } = await supabaseAdmin
      .from("houses")
      .select("plan, plan_status")
      .eq("id", houseId)
      .single();

    if (house && house.plan !== "free" && house.plan_status === "active") {
      return NextResponse.json({ ok: true, message: "Plano já ativo", plan: house.plan });
    }

    // 4. Busca pagamentos recentes no Mercado Pago para este usuário/casa
    const client = new MercadoPagoLib({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    const paymentClient = new Payment(client);

    // Busca pagamentos com external_reference contendo o houseId
    const searchResult = await paymentClient.search({
      options: {
        criteria: "desc",
        sort: "date_created",
      },
    });

    if (!searchResult || !searchResult.results) {
      return NextResponse.json({ error: "Nenhum pagamento encontrado" }, { status: 404 });
    }

    // Procura pagamento aprovado para esta casa
    const approvedPayment = searchResult.results.find((p: any) => {
      const ref = p.external_reference ?? "";
      return ref.startsWith(`${houseId}:`) && p.status === "approved";
    });

    if (!approvedPayment) {
      return NextResponse.json({ error: "Pagamento aprovado não encontrado para esta casa" }, { status: 404 });
    }

    // 5. Extrai dados do pagamento
    const externalRef = approvedPayment.external_reference ?? "";
    const parts = externalRef.split(":");
    if (parts.length !== 3) {
      return NextResponse.json({ error: "Referência inválida" }, { status: 400 });
    }

    const [, userId, plan] = parts;

    // 6. Calcula expiração
    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // 7. Atualiza o plano da casa
    const { error: houseError } = await supabaseAdmin
      .from("houses")
      .update({
        plan,
        plan_status: "active",
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq("id", houseId);

    if (houseError) {
      console.error("[Confirmar Pagamento] Erro ao atualizar casa:", houseError);
      return NextResponse.json({ error: "Erro ao ativar plano" }, { status: 500 });
    }

    // 8. Salva subscription — tenta update primeiro, se não existe faz insert
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("house_id", houseId)
      .maybeSingle();

    if (existingSub) {
      await supabaseAdmin
        .from("subscriptions")
        .update({
          provider: "mercadopago",
          provider_subscription_id: String(approvedPayment.id),
          plan,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", existingSub.id);
    } else {
      await supabaseAdmin
        .from("subscriptions")
        .insert({
          house_id: houseId,
          user_id: userId,
          provider: "mercadopago",
          provider_subscription_id: String(approvedPayment.id),
          plan,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: expiresAt.toISOString(),
        });
    }

    // Envia e-mail de confirmação de pagamento (fire-and-forget)
    if (user.email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      sendPaymentApprovedEmail(
        user.email,
        profile?.full_name ?? "",
        plan,
        expiresAt.toISOString()
      ).catch((err) => console.error("[Confirmar Pagamento] Erro email:", err));
    }

    console.log(`[Confirmar Pagamento] ✅ Casa ${houseId} → plano ${plan} ativado via confirmação`);

    return NextResponse.json({ ok: true, plan, expires_at: expiresAt.toISOString() });
  } catch (err) {
    console.error("[Confirmar Pagamento Error]", err);
    return NextResponse.json({ error: "Erro ao confirmar pagamento" }, { status: 500 });
  }
}
