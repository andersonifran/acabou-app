import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/emails";

export async function POST(request: NextRequest) {
  try {
    const { userId, houseName, fullName, phone, propertyType } = await request.json();

    if (!userId || !houseName) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Busca o email do usuário no Auth
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.email ?? "";

    // Atualiza profile
    await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        full_name: fullName ?? "",
        email: userEmail,
        phone: phone ?? null,
      }, { onConflict: "user_id" });

    // Verifica se o dono tem alguma casa com plano pago → herda o plano
    const { data: paidHouse } = await supabase
      .from("houses")
      .select("plan, plan_status, plan_expires_at")
      .eq("owner_id", userId)
      .neq("plan", "free")
      .limit(1)
      .maybeSingle();

    let inheritedPlan: { plan: string; plan_status: string; plan_expires_at?: string };

    if (paidHouse && (paidHouse.plan_status === "active" || paidHouse.plan_status === "trialing")) {
      // Herda plano pago ou trial existente
      inheritedPlan = { plan: paidHouse.plan, plan_status: paidHouse.plan_status, plan_expires_at: paidHouse.plan_expires_at ?? undefined };
    } else {
      // Verifica se é a PRIMEIRA casa do usuário → ativa trial de 7 dias
      const { count } = await supabase
        .from("houses")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId);

      if (count === 0 || count === null) {
        // Primeira casa — trial de 7 dias
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        inheritedPlan = { plan: "monthly", plan_status: "trialing", plan_expires_at: trialEnd.toISOString() };
      } else {
        inheritedPlan = { plan: "free", plan_status: "active" };
      }
    }

    // Cria a casa (herdando plano se existir)
    const { data: house, error: houseError } = await supabase
      .from("houses")
      .insert({
        name: houseName.trim(),
        owner_id: userId,
        property_type: propertyType ?? "casa",
        ...inheritedPlan,
      })
      .select()
      .single();

    if (houseError) throw houseError;

    // Adiciona dono como membro
    const { error: memberError } = await supabase
      .from("house_members")
      .insert({
        house_id: house.id,
        user_id: userId,
        role: "owner",
        status: "active",
      });

    if (memberError) throw memberError;

    // Envia e-mail de boas-vindas (não bloqueia o cadastro se falhar)
    if (userEmail) {
      sendWelcomeEmail(userEmail, fullName ?? "", houseName.trim()).catch((err) =>
        console.error("[Welcome Email] Erro:", err)
      );
    }

    return NextResponse.json({ success: true, houseId: house.id });
  } catch (err: any) {
    console.error("[criar-casa]", err);
    return NextResponse.json(
      { error: err.message ?? "Erro ao criar casa" },
      { status: 500 }
    );
  }
}
