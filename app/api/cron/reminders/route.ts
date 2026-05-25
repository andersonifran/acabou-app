import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

/**
 * Feature 1 (PAGO): Cron job que envia lembretes diários de compras
 * Roda a cada 15 minutos via Vercel Cron
 * Verifica quais casas têm reminder_enabled=true e se o horário bateu
 */
export async function GET(request: NextRequest) {
  // Verifica token de segurança do Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // Busca casas com lembrete ativado E plano pago
    const { data: houses } = await admin
      .from("houses")
      .select("id, name, owner_id, reminder_time")
      .eq("reminder_enabled", true)
      .in("plan_status", ["active"]);

    if (!houses || houses.length === 0) {
      return NextResponse.json({ message: "Nenhum lembrete para enviar", sent: 0 });
    }

    // Hora atual no Brasil (UTC-3)
    const now = new Date();
    const brasilOffset = -3;
    const brasilHour = (now.getUTCHours() + brasilOffset + 24) % 24;
    const brasilMinute = now.getUTCMinutes();
    const currentTime = `${String(brasilHour).padStart(2, "0")}:${String(brasilMinute).padStart(2, "0")}`;

    // Filtra casas cujo reminder_time está dentro da janela de 15 min
    const currentMinutes = brasilHour * 60 + brasilMinute;

    let sentCount = 0;

    for (const house of houses) {
      const [rh, rm] = (house.reminder_time ?? "18:00").split(":").map(Number);
      const reminderMinutes = rh * 60 + rm;

      // Verifica se estamos na janela de 15 minutos do lembrete
      if (currentMinutes < reminderMinutes || currentMinutes >= reminderMinutes + 15) {
        continue;
      }

      // Verifica se já enviou hoje (evita duplicatas)
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { data: existingNotif } = await admin
        .from("notifications")
        .select("id")
        .eq("house_id", house.id)
        .eq("type", "reminder")
        .gte("created_at", todayStart.toISOString())
        .limit(1);

      if (existingNotif && existingNotif.length > 0) {
        continue; // Já enviou hoje
      }

      // Conta itens na lista de compras
      const { count } = await admin
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("house_id", house.id)
        .in("status", ["acabou", "acabando", "comprar"]);

      if (!count || count === 0) {
        continue; // Nada para comprar, não incomoda
      }

      // Envia push para o dono
      const plural = count === 1 ? "item" : "itens";
      await sendPushToUser(admin, house.owner_id, {
        title: "🛒 Hora de ir às compras!",
        body: `Você tem ${count} ${plural} para comprar na "${house.name}"`,
        url: "/lista",
        tag: `reminder-${house.id}`,
      });

      // Salva notificação in-app
      await admin.from("notifications").insert({
        user_id: house.owner_id,
        house_id: house.id,
        type: "reminder",
        title: "Hora de ir às compras!",
        body: `Você tem ${count} ${plural} para comprar`,
        data: { items_count: count },
      });

      sentCount++;
    }

    return NextResponse.json({ message: "OK", sent: sentCount });
  } catch (err) {
    console.error("[Cron Reminders] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
