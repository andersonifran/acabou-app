import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

/**
 * Feature 2 (GRÁTIS): Notifica o dono da casa quando alguém marca um item
 * como "Acabou" ou "Está acabando"
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { itemName, newStatus, houseId } = await request.json();

    if (!itemName || !newStatus || !houseId) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Só notifica para acabou e acabando
    if (newStatus !== "acabou" && newStatus !== "acabando") {
      return NextResponse.json({ success: true, skipped: true });
    }

    const admin = createAdminClient();

    // Busca o dono da casa
    const { data: house } = await admin
      .from("houses")
      .select("id, name, owner_id")
      .eq("id", houseId)
      .single();

    if (!house) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    // Não notifica se quem alterou é o próprio dono
    if (house.owner_id === user.id) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Busca nome de quem alterou
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const userName = profile?.full_name?.split(" ")[0] ?? "Alguém";
    const statusText = newStatus === "acabou" ? "acabou" : "está acabando";

    // Envia push para o dono
    await sendPushToUser(admin, house.owner_id, {
      title: `🏠 ${house.name}`,
      body: `${userName} marcou "${itemName}" como "${statusText}"`,
      url: "/despensa",
      tag: `item-${houseId}-${Date.now()}`,
    });

    // Salva notificação in-app
    await admin.from("notifications").insert({
      user_id: house.owner_id,
      house_id: houseId,
      type: "item_change",
      title: `${house.name}`,
      body: `${userName} marcou "${itemName}" como "${statusText}"`,
      data: { item_name: itemName, new_status: newStatus, changed_by: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Notify Item] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
