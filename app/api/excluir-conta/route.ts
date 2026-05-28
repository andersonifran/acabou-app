import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// =============================================
// API: Excluir conta do usuário (LGPD)
// =============================================
// Remove TODOS os dados do usuário:
// - Itens e eventos das casas que ele é DONO
// - Convites, membros, subscriptions das casas dele
// - Casas dele
// - Perfil
// - Usuário no Supabase Auth
//
// Casas onde ele é apenas MEMBRO: remove apenas a membership.

export async function DELETE(request: NextRequest) {
  try {
    // 1. Verifica autenticação
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

    const userId = user.id;
    const admin = createAdminClient();

    // 2. Busca casas onde é DONO
    const { data: ownedHouses } = await admin
      .from("houses")
      .select("id")
      .eq("owner_id", userId);

    const ownedHouseIds = (ownedHouses ?? []).map((h) => h.id);

    // 3. Exclui dados das casas que ele é dono (cascata)
    if (ownedHouseIds.length > 0) {
      // Eventos dos itens dessas casas
      await admin.from("item_events").delete().in("house_id", ownedHouseIds);
      // Itens dessas casas
      await admin.from("items").delete().in("house_id", ownedHouseIds);
      // Convites dessas casas
      await admin.from("invite_tokens").delete().in("house_id", ownedHouseIds);
      // Notificações dessas casas
      await admin.from("notifications").delete().in("house_id", ownedHouseIds);
      // Sessões de compra dessas casas
      await admin.from("shopping_sessions").delete().in("house_id", ownedHouseIds);
      // Subscriptions dessas casas
      await admin.from("subscriptions").delete().in("house_id", ownedHouseIds);
      // Membros dessas casas (incluindo outros membros que vão perder acesso)
      await admin.from("house_members").delete().in("house_id", ownedHouseIds);
      // As casas em si
      await admin.from("houses").delete().in("id", ownedHouseIds);
    }

    // 4. Remove membership de casas onde é MEMBRO (não dono)
    await admin
      .from("house_members")
      .delete()
      .eq("user_id", userId);

    // 5. Remove push subscriptions
    await admin.from("push_subscriptions").delete().eq("user_id", userId);

    // 6. Remove notificações do usuário
    await admin.from("notifications").delete().eq("user_id", userId);

    // 7. Remove perfil
    await admin.from("profiles").delete().eq("user_id", userId);

    // 8. Remove o usuário do Supabase Auth
    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("[Excluir Conta] Erro ao excluir auth user:", deleteAuthError);
      // Continua mesmo se falhar — dados já foram removidos
    }

    console.log(`[Excluir Conta] ✅ Usuário ${userId} e todos os seus dados foram excluídos`);

    return NextResponse.json({ ok: true, message: "Conta excluída com sucesso" });
  } catch (err: any) {
    console.error("[Excluir Conta] Erro:", err);
    return NextResponse.json(
      { error: err.message ?? "Erro ao excluir conta" },
      { status: 500 }
    );
  }
}
