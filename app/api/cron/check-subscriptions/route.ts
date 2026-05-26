import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPlanExpiringEmail } from "@/lib/emails";

// =============================================
// CRON: Verificar assinaturas expirando + expiradas
// =============================================
// Roda diariamente às 6h (UTC). Faz duas coisas:
// 1. Envia email de aviso para planos que expiram em 3 dias ou 1 dia
// 2. Faz downgrade de planos que já expiraram → free
//
// Configurado em vercel.json:
// { "path": "/api/cron/check-subscriptions", "schedule": "0 6 * * *" }

export async function GET(request: NextRequest) {
  // Verifica token de segurança do Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const nowISO = now.toISOString();

    let downgraded = 0;
    let emailsSent = 0;

    // =============================================
    // PARTE 1: Avisar planos que vão expirar (3 dias e 1 dia antes)
    // =============================================
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const { data: expiringHouses } = await supabase
      .from("houses")
      .select("id, name, plan, plan_expires_at, owner_id")
      .neq("plan", "free")
      .eq("plan_status", "active")
      .gt("plan_expires_at", nowISO)
      .lte("plan_expires_at", threeDaysFromNow.toISOString());

    if (expiringHouses && expiringHouses.length > 0) {
      for (const house of expiringHouses) {
        const expiresAt = new Date(house.plan_expires_at);
        const diffMs = expiresAt.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Só envia em dias específicos: 3 dias e 1 dia antes
        if (daysLeft !== 3 && daysLeft !== 1) continue;

        // Busca email e nome do dono
        try {
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(house.owner_id);
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", house.owner_id)
            .maybeSingle();

          if (authUser?.email) {
            await sendPlanExpiringEmail(
              authUser.email,
              profile?.full_name ?? "",
              house.plan,
              house.plan_expires_at,
              daysLeft
            );
            emailsSent++;
            console.log(`[Cron] 📧 Email de renovação enviado para casa "${house.name}" (${daysLeft} dias)`);
          }
        } catch (emailErr) {
          console.error(`[Cron] Erro ao enviar email para casa ${house.id}:`, emailErr);
        }
      }
    }

    // =============================================
    // PARTE 2: Downgrade de planos que já expiraram
    // =============================================
    const { data: expiredHouses, error } = await supabase
      .from("houses")
      .select("id, name, plan, plan_expires_at")
      .neq("plan", "free")
      .lt("plan_expires_at", nowISO);

    if (error) {
      console.error("[Cron Subscriptions] Erro ao buscar casas:", error);
      return NextResponse.json({ error: "Erro ao verificar" }, { status: 500 });
    }

    if (expiredHouses && expiredHouses.length > 0) {
      for (const house of expiredHouses) {
        // Downgrade da casa para free
        const { error: updateError } = await supabase
          .from("houses")
          .update({ plan: "free", plan_status: "inactive" })
          .eq("id", house.id);

        if (updateError) {
          console.error(`[Cron] Erro ao fazer downgrade da casa ${house.id}:`, updateError);
          continue;
        }

        // Atualiza subscription
        await supabase
          .from("subscriptions")
          .update({ status: "inactive", updated_at: nowISO })
          .eq("house_id", house.id)
          .eq("status", "active");

        console.log(`[Cron] ⬇️ Casa "${house.name}" (${house.id}) — plano ${house.plan} expirou → free`);
        downgraded++;
      }
    }

    const message = [
      downgraded > 0 ? `${downgraded} plano(s) expirado(s)` : null,
      emailsSent > 0 ? `${emailsSent} email(s) de renovação` : null,
      downgraded === 0 && emailsSent === 0 ? "Nenhuma ação necessária" : null,
    ].filter(Boolean).join(", ");

    return NextResponse.json({
      ok: true,
      message,
      downgraded,
      emails_sent: emailsSent,
    });
  } catch (err) {
    console.error("[Cron Subscriptions Error]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
