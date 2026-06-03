import { createAdminClient } from "@/lib/supabase/server";
import { sendPaymentApprovedEmail } from "@/lib/emails";

// =============================================
// SINCRONIZAÇÃO DE ASSINATURA RECORRENTE
// =============================================
// Recebe um objeto de "preapproval" (assinatura) do Mercado Pago e ajusta o
// banco de acordo. É IDEMPOTENTE: usa o next_payment_date do MP como fonte da
// verdade do "acesso até quando". Reprocessar o mesmo evento dá o mesmo
// resultado — sem risco de estender período errado ou cobrar duas vezes.

type PreapprovalLike = {
  id?: string | number;
  status?: string;
  external_reference?: string | number;
  next_payment_date?: string | number;
};

function addPeriod(from: Date, plan: string): Date {
  const d = new Date(from);
  if (plan === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function syncSubscriptionFromPreapproval(pre: PreapprovalLike) {
  const externalRef = String(pre.external_reference ?? "");
  const parts = externalRef.split(":");
  if (parts.length !== 3) {
    console.error("[SubSync] external_reference inválido:", externalRef);
    return { ok: false, reason: "external_reference inválido" };
  }

  const [houseId, userId, plan] = parts;
  const preapprovalId = pre.id != null ? String(pre.id) : null;
  const status = pre.status ?? "";
  const supabase = createAdminClient();
  const now = new Date();

  // ---------- Assinatura ATIVA (autorizada / renovou) ----------
  if (status === "authorized") {
    // Acesso vale até a próxima cobrança. Fallback: +1 período a partir de agora.
    const npd = pre.next_payment_date ? new Date(pre.next_payment_date) : null;
    const expiresAt = npd && npd.getTime() > now.getTime() ? npd : addPeriod(now, plan);

    // Estado anterior — para mandar o e-mail de confirmação só na 1ª ativação
    // (não a cada renovação automática).
    const { data: prevSub } = await supabase
      .from("subscriptions")
      .select("id, status")
      .eq("house_id", houseId)
      .maybeSingle();
    const wasActive = prevSub?.status === "active";

    // Atualiza TODAS as casas do dono → libera os membros convidados também
    const { error: houseError } = await supabase
      .from("houses")
      .update({
        plan,
        plan_status: "active",
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq("owner_id", userId);
    if (houseError) console.error("[SubSync] erro ao atualizar casas:", houseError);

    if (prevSub) {
      await supabase
        .from("subscriptions")
        .update({
          provider: "mercadopago",
          provider_subscription_id: preapprovalId,
          plan,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", prevSub.id);
    } else {
      await supabase.from("subscriptions").insert({
        house_id: houseId,
        user_id: userId,
        provider: "mercadopago",
        provider_subscription_id: preapprovalId,
        plan,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: expiresAt.toISOString(),
      });
    }

    if (!wasActive) {
      try {
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", userId)
          .maybeSingle();
        if (authUser?.email) {
          sendPaymentApprovedEmail(
            authUser.email,
            profile?.full_name ?? "",
            plan,
            expiresAt.toISOString()
          ).catch((e) => console.error("[SubSync] erro e-mail:", e));
        }
      } catch (e) {
        console.error("[SubSync] erro ao buscar dados p/ e-mail:", e);
      }
    }

    console.log(`[SubSync] ✅ Assinatura ${preapprovalId} ATIVA — casa ${houseId} → ${plan} até ${expiresAt.toISOString()}`);
    return { ok: true, plan, status: "active", expiresAt: expiresAt.toISOString() };
  }

  // ---------- Assinatura CANCELADA / PAUSADA ----------
  // NÃO corta o acesso: o usuário continua até plan_expires_at (fim do período
  // pago). Só marca como cancelada — o vencimento em tempo real + o cron cuidam
  // de congelar quando a data chegar.
  if (status === "cancelled" || status === "paused") {
    await supabase
      .from("houses")
      .update({ plan_status: "cancelled" })
      .eq("owner_id", userId)
      .neq("plan", "free");
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: now.toISOString() })
      .eq("house_id", houseId);

    console.log(`[SubSync] ⚠️ Assinatura ${preapprovalId} ${status} — casa ${houseId} mantém acesso até o fim do período`);
    return { ok: true, plan, status: "cancelled" };
  }

  // ---------- pending / outros ----------
  console.log(`[SubSync] Assinatura ${preapprovalId} status "${status}" — ignorado`);
  return { ok: true, ignored: status };
}
