import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createRecurringSubscription, cancelRecurringSubscription, preApproval } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    if (!plan || !["monthly", "yearly"].includes(plan)) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    // Busca o usuário autenticado
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
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // Busca a casa do DONO. Usa role=owner + limit(1) + maybeSingle: dono com
    // mais de uma casa tinha .single() quebrando (múltiplas linhas → não assinava).
    const { data: membership } = await supabase
      .from("house_members")
      .select("house_id")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Casa não encontrada." }, { status: 404 });
    }

    // Só o DONO pode assinar (membros convidados não podem) — trava anti-burla
    const { data: house } = await supabase
      .from("houses")
      .select("owner_id, plan, plan_status, plan_expires_at")
      .eq("id", membership.house_id)
      .single();

    if (!house || house.owner_id !== user.id) {
      return NextResponse.json({ error: "Apenas o dono da casa pode assinar." }, { status: 403 });
    }

    // Reativação: se ainda há período pago no futuro (cancelou mas continua com
    // acesso), a 1ª cobrança da nova assinatura começa no fim desse período —
    // assim o usuário não paga em dobro. Senão, cobra já.
    let startDate: string | undefined;
    if (
      house.plan !== "free" &&
      house.plan_expires_at &&
      new Date(house.plan_expires_at).getTime() > Date.now()
    ) {
      startDate = new Date(house.plan_expires_at).toISOString();
    }

    // ANTI COBRANÇA EM DOBRO: cancela qualquer assinatura recorrente ATIVA do
    // usuário antes de criar uma nova (troca de mensal<->anual, reativação).
    // Garante no máximo 1 assinatura cobrando por dono.
    try {
      const existing = await preApproval.search({ options: { payer_email: user.email ?? "" } });
      const actives = (existing.results ?? []).filter((r) => {
        const ref = String(r.external_reference ?? "");
        return ref.includes(`:${user.id}:`) && r.status === "authorized";
      });
      for (const a of actives) {
        if (a.id) {
          try {
            await cancelRecurringSubscription(String(a.id));
          } catch (e) {
            console.error("[Pagamento] erro ao cancelar assinatura antiga:", e);
          }
        }
      }
    } catch (e) {
      console.error("[Pagamento] erro ao buscar assinaturas existentes:", e);
    }

    // Cria a assinatura recorrente no Mercado Pago
    const checkoutUrl = await createRecurringSubscription({
      houseId: membership.house_id,
      userId: user.id,
      plan: plan as "monthly" | "yearly",
      userEmail: user.email ?? "",
      startDate,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error("[Pagamento API]", err);
    return NextResponse.json({ error: "Erro ao criar assinatura." }, { status: 500 });
  }
}
