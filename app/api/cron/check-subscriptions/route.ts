import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPlanExpiringEmail } from "@/lib/emails";
import { preApproval } from "@/lib/mercadopago";
import { syncSubscriptionFromPreapproval } from "@/lib/subscription-sync";

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
      .select("id, name, plan, plan_status, plan_expires_at, owner_id")
      .neq("plan", "free")
      .in("plan_status", ["active", "trialing"])
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
            const isTrial = house.plan_status === "trialing";
            await sendPlanExpiringEmail(
              authUser.email,
              profile?.full_name ?? "",
              isTrial ? "trial" : house.plan,
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
    // Inclui "cancelled": quem cancelou a assinatura recorrente mantém acesso até
    // o fim do período pago; quando essa data passa, congela igual aos demais.
    const { data: expiredHouses, error } = await supabase
      .from("houses")
      .select("id, name, plan, plan_status, plan_expires_at")
      .neq("plan", "free")
      .in("plan_status", ["active", "trialing", "cancelled"])
      .lt("plan_expires_at", nowISO);

    if (error) {
      console.error("[Cron Subscriptions] Erro ao buscar casas:", error);
      return NextResponse.json({ error: "Erro ao verificar" }, { status: 500 });
    }

    if (expiredHouses && expiredHouses.length > 0) {
      for (const house of expiredHouses) {
        // CONGELA a casa — mantém o plano original (não reseta para free)
        // Isso preserva o histórico e facilita reativação após pagamento
        const { error: updateError } = await supabase
          .from("houses")
          .update({ plan_status: "inactive" })
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

        // CONGELA OS CONVIDADOS (não-donos): acesso compartilhado é recurso
        // premium. Status "frozen" faz a RLS (que exige "active") bloquear o
        // acesso ao banco — não dá pra burlar pelo cliente. O dono permanece.
        const { error: freezeError } = await supabase
          .from("house_members")
          .update({ status: "frozen" })
          .eq("house_id", house.id)
          .neq("role", "owner")
          .eq("status", "active");
        if (freezeError) console.error(`[Cron] Erro ao congelar convidados da casa ${house.id}:`, freezeError);

        const wasTrialing = house.plan_status === "trialing";
        console.log(`[Cron] ⬇️ Casa "${house.name}" (${house.id}) — ${wasTrialing ? "trial" : "plano " + house.plan} expirou → free`);
        downgraded++;
      }
    }

    // =============================================
    // PARTE 3: RECONCILIAÇÃO — ativa quem PAGOU mas não ativou
    // (webhook do MP falhou E o cliente não voltou ao app). Idempotente.
    // Trava de segurança: só ativa assinatura AUTORIZADA no MP E com próxima
    // cobrança no FUTURO (= realmente paga). Nunca reativa de graça quem falhou.
    // =============================================
    let reconciled = 0;
    try {
      const search = await preApproval.search({ options: { status: "authorized", limit: 100 } });
      for (const pre of search.results ?? []) {
        const parts = String(pre.external_reference ?? "").split(":");
        if (parts.length !== 3) continue;

        // Só conta como paga se a próxima cobrança está no futuro
        const npd = pre.next_payment_date ? new Date(pre.next_payment_date) : null;
        if (!npd || npd.getTime() <= now.getTime()) continue;

        const houseId = parts[0];
        const { data: h } = await supabase
          .from("houses")
          .select("plan_status")
          .eq("id", houseId)
          .maybeSingle();
        // Já está ativo → pula (evita escrita desnecessária)
        if (!h || h.plan_status === "active") continue;

        // MP diz autorizado + pago, mas a casa não está ativa → ATIVA
        await syncSubscriptionFromPreapproval({
          id: pre.id,
          status: pre.status,
          external_reference: pre.external_reference,
          next_payment_date: pre.next_payment_date,
        });
        reconciled++;
        console.log(`[Cron] 🔄 Reconciliado: casa ${houseId} (assinatura ${pre.id}) ativada`);
      }
    } catch (e) {
      console.error("[Cron] erro na reconciliação:", e);
    }

    const message = [
      downgraded > 0 ? `${downgraded} plano(s) expirado(s)` : null,
      emailsSent > 0 ? `${emailsSent} email(s) de renovação` : null,
      reconciled > 0 ? `${reconciled} reconciliado(s)` : null,
      downgraded === 0 && emailsSent === 0 && reconciled === 0 ? "Nenhuma ação necessária" : null,
    ].filter(Boolean).join(", ");

    return NextResponse.json({
      ok: true,
      message,
      downgraded,
      emails_sent: emailsSent,
      reconciled,
    });
  } catch (err) {
    console.error("[Cron Subscriptions Error]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
