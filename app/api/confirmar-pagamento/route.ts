import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { preApproval } from "@/lib/mercadopago";
import { syncSubscriptionFromPreapproval } from "@/lib/subscription-sync";

// =============================================
// CONFIRMAR ASSINATURA — Fallback do Webhook
// =============================================
// Quando o usuário volta do Mercado Pago com status=sucesso, a página de planos
// chama esta API para garantir a ativação mesmo que o webhook atrase/falhe.
// Busca a assinatura (preapproval) autorizada do usuário e sincroniza o banco.

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
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

    // 2. Casa do usuário
    const { data: membership } = await supabase
      .from("house_members")
      .select("house_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    const houseId = membership.house_id;

    // 3. Se já está ativo, não precisa fazer nada
    const supabaseAdmin = createAdminClient();
    const { data: house } = await supabaseAdmin
      .from("houses")
      .select("plan, plan_status, plan_expires_at")
      .eq("id", houseId)
      .single();

    if (house && house.plan !== "free" && house.plan_status === "active") {
      return NextResponse.json({
        ok: true,
        message: "Plano já ativo",
        plan: house.plan,
        expires_at: house.plan_expires_at,
      });
    }

    // 4. Busca a assinatura autorizada deste usuário no Mercado Pago
    const search = await preApproval.search({
      options: { payer_email: user.email ?? "" },
    });

    // Casa o preapproval pelo DONO (parts[1] = userId), igual ao cancelamento —
    // a assinatura é por dono (ativa todas as casas), então não importa de qual
    // casa ele assinou; o que importa é ser a assinatura autorizada DESTE usuário.
    const sub = search.results?.find((r) => {
      const parts = String(r.external_reference ?? "").split(":");
      return parts[1] === user.id && r.status === "authorized";
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Assinatura autorizada não encontrada para esta casa" },
        { status: 404 }
      );
    }

    // 5. Sincroniza o banco a partir da assinatura
    const result = await syncSubscriptionFromPreapproval({
      id: sub.id,
      status: sub.status,
      external_reference: sub.external_reference,
      next_payment_date: sub.next_payment_date,
    });

    if (!result.ok || result.status !== "active") {
      return NextResponse.json({ error: "Não foi possível ativar a assinatura" }, { status: 500 });
    }

    console.log(`[Confirmar Assinatura] ✅ Casa ${houseId} → plano ${result.plan} ativado`);
    return NextResponse.json({ ok: true, plan: result.plan, expires_at: result.expiresAt });
  } catch (err) {
    console.error("[Confirmar Assinatura Error]", err);
    return NextResponse.json({ error: "Erro ao confirmar assinatura" }, { status: 500 });
  }
}
