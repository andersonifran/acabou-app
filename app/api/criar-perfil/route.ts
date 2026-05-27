import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// =============================================
// API: Criar perfil + aceitar convite (server-side)
// =============================================
// Usado quando um usuário CONVIDADO se cadastra.
// Faz tudo de uma vez: cria perfil + aceita convite + entra na casa.
// Elimina a necessidade de redirecionar para /convite/TOKEN após cadastro.

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, phone, conviteToken } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Busca o email do usuário no Auth
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.email ?? "";

    // 2. Cria/atualiza profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        full_name: fullName ?? "",
        email: userEmail,
        phone: phone ?? null,
      }, { onConflict: "user_id" });

    if (profileError) throw profileError;

    // 3. Se tem convite, aceita automaticamente (server-side)
    let houseId: string | null = null;

    if (conviteToken) {
      // Busca o convite
      const { data: invite } = await supabase
        .from("invite_tokens")
        .select("house_id, expires_at, used_at")
        .eq("token", conviteToken)
        .maybeSingle();

      if (invite && !invite.used_at && new Date(invite.expires_at) > new Date()) {
        // Verifica se a casa tem plano pago (convites são do Plano Família)
        const { data: house } = await supabase
          .from("houses")
          .select("id, plan, plan_status, plan_expires_at")
          .eq("id", invite.house_id)
          .single();

        const canAccept = house && house.plan !== "free" &&
          (house.plan_status === "active" || house.plan_status === "trialing");

        // Verifica se trial não expirou
        const trialOk = house?.plan_status !== "trialing" ||
          !house.plan_expires_at ||
          new Date(house.plan_expires_at) > new Date();

        if (canAccept && trialOk) {
          // Verifica se já não é membro
          const { data: existing } = await supabase
            .from("house_members")
            .select("id")
            .eq("house_id", invite.house_id)
            .eq("user_id", userId)
            .maybeSingle();

          if (!existing) {
            // Adiciona como membro
            await supabase.from("house_members").insert({
              house_id: invite.house_id,
              user_id: userId,
              role: "member",
              status: "active",
              invited_by: userId,
            });

            // Marca token como usado
            await supabase
              .from("invite_tokens")
              .update({ used_at: new Date().toISOString() })
              .eq("token", conviteToken);

            houseId = invite.house_id;
            console.log(`[criar-perfil] ✅ Usuário ${userId} entrou na casa ${houseId} via convite`);
          } else {
            houseId = invite.house_id;
            console.log(`[criar-perfil] ℹ️ Usuário ${userId} já é membro da casa ${houseId}`);
          }
        } else {
          console.log(`[criar-perfil] ⚠️ Convite inválido ou plano inativo para casa ${invite.house_id}`);
        }
      }
    }

    return NextResponse.json({ success: true, houseId });
  } catch (err: any) {
    console.error("[criar-perfil]", err);
    return NextResponse.json(
      { error: err.message ?? "Erro ao criar perfil" },
      { status: 500 }
    );
  }
}
