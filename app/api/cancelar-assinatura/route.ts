import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { cancelRecurringSubscription } from "@/lib/mercadopago";

// =============================================
// CANCELAR ASSINATURA (estilo Netflix)
// =============================================
// Cancela a auto-renovação no Mercado Pago, mas o usuário MANTÉM o acesso até o
// fim do período já pago (plan_expires_at). Depois disso o cron/vencimento em
// tempo real congela e ele volta ao plano grátis. Para voltar, é só assinar de
// novo (a cobrança começa no fim do período atual — não paga em dobro).

export async function POST(request: NextRequest) {
  try {
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

    const { data: membership } = await supabase
      .from("house_members")
      .select("house_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    const admin = createAdminClient();

    // Só o dono pode cancelar
    const { data: house } = await admin
      .from("houses")
      .select("owner_id, plan, plan_status, plan_expires_at")
      .eq("id", membership.house_id)
      .single();

    if (!house || house.owner_id !== user.id) {
      return NextResponse.json({ error: "Apenas o dono pode cancelar a assinatura." }, { status: 403 });
    }

    // Busca o id da assinatura recorrente (preapproval) no Mercado Pago
    const { data: sub } = await admin
      .from("subscriptions")
      .select("id, provider_subscription_id, status")
      .eq("house_id", membership.house_id)
      .maybeSingle();

    const preapprovalId = sub?.provider_subscription_id;

    // Cancela no Mercado Pago (se houver assinatura recorrente vinculada)
    if (preapprovalId) {
      try {
        await cancelRecurringSubscription(preapprovalId);
      } catch (e) {
        console.error("[Cancelar] erro ao cancelar no Mercado Pago:", e);
        // Não bloqueia: ainda marcamos como cancelada localmente para parar a
        // renovação no nosso lado; o usuário pode tentar de novo se preciso.
      }
    }

    const now = new Date().toISOString();

    // Marca como cancelada — mantém plan e plan_expires_at (acesso até o fim)
    await admin
      .from("houses")
      .update({ plan_status: "cancelled" })
      .eq("owner_id", user.id)
      .neq("plan", "free");

    if (sub) {
      await admin
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: now })
        .eq("id", sub.id);
    }

    console.log(`[Cancelar] ✅ Casa ${membership.house_id} — assinatura cancelada, acesso até ${house.plan_expires_at}`);

    return NextResponse.json({
      ok: true,
      expires_at: house.plan_expires_at,
    });
  } catch (err) {
    console.error("[Cancelar Assinatura Error]", err);
    return NextResponse.json({ error: "Erro ao cancelar assinatura" }, { status: 500 });
  }
}
