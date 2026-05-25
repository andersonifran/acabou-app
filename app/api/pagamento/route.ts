import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createPaymentPreference } from "@/lib/mercadopago";

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

    // Busca a casa do usuário
    const { data: membership } = await supabase
      .from("house_members")
      .select("house_id")
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Casa não encontrada." }, { status: 404 });
    }

    // Cria a preferência de pagamento no Mercado Pago
    const checkoutUrl = await createPaymentPreference({
      houseId: membership.house_id,
      userId: user.id,
      plan: plan as "monthly" | "yearly",
      userEmail: user.email ?? "",
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error("[Pagamento API]", err);
    return NextResponse.json({ error: "Erro ao criar preferência de pagamento." }, { status: 500 });
  }
}
