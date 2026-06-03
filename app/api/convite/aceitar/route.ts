import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getAuthUser } from "@/lib/supabase/server";

// =============================================
// POST /api/convite/aceitar  { token }
// =============================================
// Aceita o convite para o usuário AUTENTICADO (servidor, admin client).
// Faz TODAS as validações no servidor (token válido/não usado/não expirado,
// casa com plano pago/trial ativo) — não dá pra burlar pelo cliente.
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token ausente" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Lê o convite
    const { data: invite } = await admin
      .from("invite_tokens")
      .select("house_id, used_at, expires_at, invitee_name, member_type, relation_label")
      .eq("token", token)
      .maybeSingle();

    if (!invite || invite.used_at) {
      return NextResponse.json({ error: "Convite inválido ou já utilizado." }, { status: 400 });
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Convite expirado." }, { status: 400 });
    }

    // 2. Já é membro? → ok (vai pro app)
    const { data: existing } = await admin
      .from("house_members")
      .select("id")
      .eq("house_id", invite.house_id)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, houseId: invite.house_id, alreadyMember: true });
    }

    // 3. Casa precisa ter plano pago/trial ATIVO e não expirado (convite é premium)
    const { data: house } = await admin
      .from("houses")
      .select("plan, plan_status, plan_expires_at")
      .eq("id", invite.house_id)
      .single();

    const validStatuses = ["active", "trialing"];
    const planOk = house && house.plan !== "free" && validStatuses.includes(house.plan_status);
    const notExpired = !house?.plan_expires_at || new Date(house.plan_expires_at) > new Date();

    if (!planOk || !notExpired) {
      return NextResponse.json(
        { error: "O dono desta casa precisa ter o Plano Família ativo para convidar membros." },
        { status: 403 }
      );
    }

    // 4. Adiciona como membro (com os dados do convite)
    const { error: insertError } = await admin.from("house_members").insert({
      house_id: invite.house_id,
      user_id: authUser.id,
      role: "member",
      status: "active",
      invited_by: authUser.id,
      display_name: invite.invitee_name || null,
      member_type: invite.member_type || "familiar",
      relation_label: invite.relation_label || null,
    } as any);

    if (insertError) {
      console.error("[convite/aceitar] erro ao inserir membro:", insertError);
      return NextResponse.json({ error: "Erro ao entrar na casa. Tente novamente." }, { status: 500 });
    }

    // 5. Marca o token como usado
    await admin
      .from("invite_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    return NextResponse.json({ ok: true, houseId: invite.house_id });
  } catch (err) {
    console.error("[convite/aceitar]", err);
    return NextResponse.json({ error: "Erro ao aceitar convite." }, { status: 500 });
  }
}
