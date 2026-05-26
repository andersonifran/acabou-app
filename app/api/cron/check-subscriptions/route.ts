import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// =============================================
// CRON: Verificar assinaturas expiradas
// =============================================
// Roda diariamente. Casas com plan_expires_at no passado
// voltam para o plano grátis automaticamente.
//
// Configure no Vercel Cron ou chame via URL:
// GET /api/cron/check-subscriptions?key=SEU_CRON_SECRET

export async function GET(request: NextRequest) {
  // Verifica token de segurança do Vercel Cron (mesmo padrão do reminders)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Busca casas com plano pago que já expiraram
    const { data: expiredHouses, error } = await supabase
      .from("houses")
      .select("id, name, plan, plan_expires_at")
      .neq("plan", "free")
      .lt("plan_expires_at", now);

    if (error) {
      console.error("[Cron Subscriptions] Erro ao buscar casas:", error);
      return NextResponse.json({ error: "Erro ao verificar" }, { status: 500 });
    }

    if (!expiredHouses || expiredHouses.length === 0) {
      return NextResponse.json({ ok: true, message: "Nenhuma assinatura expirada", count: 0 });
    }

    let downgraded = 0;

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
        .update({ status: "inactive", updated_at: now })
        .eq("house_id", house.id)
        .eq("status", "active");

      console.log(`[Cron] ⬇️ Casa "${house.name}" (${house.id}) — plano ${house.plan} expirou → free`);
      downgraded++;
    }

    return NextResponse.json({
      ok: true,
      message: `${downgraded} assinatura(s) expirada(s) processada(s)`,
      count: downgraded,
    });
  } catch (err) {
    console.error("[Cron Subscriptions Error]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
