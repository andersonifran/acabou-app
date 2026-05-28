import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { PLAN_LIMITS } from "@/types";

// =============================================
// API: Verificar limite de itens antes de criar
// =============================================
// Chamado ANTES de inserir um item para garantir que o plano permite.
// Retorna { allowed: true/false, reason?: string }

export async function POST(request: NextRequest) {
  try {
    const { houseId } = await request.json();

    if (!houseId) {
      return NextResponse.json({ error: "Casa não informada" }, { status: 400 });
    }

    // Verifica autenticação
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verifica se é membro ativo da casa
    const { data: membership } = await supabase
      .from("house_members")
      .select("id")
      .eq("house_id", houseId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ allowed: false, reason: "Sem acesso a esta casa" }, { status: 403 });
    }

    // Usa admin client para consultas sem RLS
    const admin = createAdminClient();

    // Busca plano da casa
    const { data: house } = await admin
      .from("houses")
      .select("plan, plan_status, plan_expires_at")
      .eq("id", houseId)
      .single();

    if (!house) {
      return NextResponse.json({ allowed: false, reason: "Casa não encontrada" }, { status: 404 });
    }

    // Determina plano efetivo (verifica expiração de trial/plano)
    const isTrialing = house.plan_status === "trialing";
    const trialExpired = isTrialing && house.plan_expires_at
      ? new Date(house.plan_expires_at) < new Date()
      : false;
    const paidExpired = !isTrialing && house.plan !== "free" && house.plan_status === "inactive";
    const isExpired = trialExpired || paidExpired;

    const effectivePlan = isExpired ? "free" : house.plan;
    const isPaid = !isExpired && (house.plan === "monthly" || house.plan === "yearly");

    // Plano pago → sempre permitido
    if (isPaid) {
      return NextResponse.json({ allowed: true });
    }

    // Plano grátis → verifica limite
    const limits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;

    const { count } = await admin
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("house_id", houseId);

    const currentItems = count ?? 0;

    if (currentItems >= limits.max_items) {
      return NextResponse.json({
        allowed: false,
        reason: `Limite de ${limits.max_items} itens atingido no plano grátis`,
        currentItems,
        maxItems: limits.max_items,
      });
    }

    return NextResponse.json({ allowed: true, currentItems, maxItems: limits.max_items });
  } catch (err: any) {
    console.error("[Verificar Limite]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
