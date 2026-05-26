import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// API para criar apenas o perfil do usuário (sem casa)
// Usado quando um usuário convidado se cadastra — ele não precisa criar casa,
// vai entrar na casa do convite.

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, phone } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Busca o email do usuário no Auth
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.email ?? "";

    // Cria/atualiza profile
    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        full_name: fullName ?? "",
        email: userEmail,
        phone: phone ?? null,
      }, { onConflict: "user_id" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[criar-perfil]", err);
    return NextResponse.json(
      { error: err.message ?? "Erro ao criar perfil" },
      { status: 500 }
    );
  }
}
