import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getAuthUser } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/emails";

export async function POST(request: NextRequest) {
  try {
    // Autentica pela SESSÃO — nunca confia em userId vindo do corpo (anti-IDOR)
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const userId = authUser.id;

    const { houseName, fullName, phone, propertyType } = await request.json();

    if (!houseName) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // TRAVA DE PLANO no servidor: plano grátis permite apenas 1 casa.
    // Só quem tem plano pago/trial ATIVO pode ter casas adicionais.
    const { data: ownerHouses } = await supabase
      .from("houses")
      .select("plan, plan_status, plan_expires_at")
      .eq("owner_id", userId);

    const houseCount = ownerHouses?.length ?? 0;
    const hasActivePaid = (ownerHouses ?? []).some(
      (h) =>
        h.plan !== "free" &&
        (h.plan_status === "active" ||
          (h.plan_status === "trialing" &&
            (!h.plan_expires_at || new Date(h.plan_expires_at) > new Date())))
    );

    if (houseCount >= 1 && !hasActivePaid) {
      return NextResponse.json(
        { error: "O plano grátis permite apenas 1 casa. Assine o Plano Família para adicionar mais locais." },
        { status: 403 }
      );
    }

    // Email vem direto da sessão autenticada (sem chamada extra)
    const userEmail = authUser.email ?? "";

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
      // Trial de 7 dias SÓ para conta GENUINAMENTE nova: sem casa própria E que
      // NUNCA foi membro de nenhuma casa. Assim, um CONVIDADO (que já entrou via
      // convite e usou o premium do dono) NÃO ganha um novo trial ao criar a
      // própria casa — entra no plano grátis. Também evita farm de trial.
      const { count: ownedCount } = await supabase
        .from("houses")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId);

      const { count: memberCount } = await supabase
        .from("house_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      const isBrandNew = (ownedCount === 0 || ownedCount === null) && (memberCount === 0 || memberCount === null);

      if (isBrandNew) {
        // Conta nova de verdade — trial de 7 dias
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        inheritedPlan = { plan: "monthly", plan_status: "trialing", plan_expires_at: trialEnd.toISOString() };
      } else {
        // Já foi membro/convidado antes (ou já teve casa) → grátis, sem trial
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
