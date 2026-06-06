// =============================================================
// POST /api/play-billing/rtdn  — Real-time Developer Notifications
// =============================================================
// O Google Play envia (via Pub/Sub push) um aviso TODA vez que uma assinatura
// muda: renovou, cancelou, entrou em carência, expirou, foi estornada, etc.
// Aqui a gente RE-VALIDA o token direto com o Google (fonte da verdade) e
// ajusta o banco — assim:
//   • Renovou → estende plan_expires_at (NÃO corta quem pagou).
//   • Expirou / cancelou e venceu / estornou → vira grátis (anti-burla).
//
// Segurança: o endpoint só aceita chamadas com ?key=<PLAY_RTDN_SECRET> (segredo
// exclusivo do RTDN, configurado na URL de push do Pub/Sub). Quem não tem a
// chave leva 401. Se a env var não existir, TUDO é recusado (default seguro).
//
// Idempotente: reprocessar o mesmo aviso dá o mesmo resultado (usa a data real
// do Google, nunca soma período).

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyPlaySubscription, ANDROID_PACKAGE } from "@/lib/play-billing-verify";

export const runtime = "nodejs";

// Tipos de notificação de assinatura (Google). Referência apenas — a decisão de
// liberar/cortar vem SEMPRE da re-validação com o Google, não do tipo.
const TYPE_LABEL: Record<number, string> = {
  1: "RECOVERED", 2: "RENEWED", 3: "CANCELED", 4: "PURCHASED",
  5: "ON_HOLD", 6: "IN_GRACE_PERIOD", 7: "RESTARTED", 8: "PRICE_CHANGE_CONFIRMED",
  9: "DEFERRED", 10: "PAUSED", 11: "PAUSE_SCHEDULE_CHANGED", 12: "REVOKED", 13: "EXPIRED",
};

type RtdnPayload = {
  packageName?: string;
  subscriptionNotification?: { notificationType?: number; purchaseToken?: string; subscriptionId?: string };
  voidedPurchaseNotification?: { purchaseToken?: string; orderId?: string; productType?: number; refundType?: number };
  testNotification?: { version?: string };
};

export async function POST(request: NextRequest) {
  // 1) Autenticação simples por chave na URL (configurada no push do Pub/Sub).
  //    Segredo dedicado ao RTDN (não reaproveita o CRON_SECRET).
  const expected = process.env.PLAY_RTDN_SECRET;
  if (!expected || request.nextUrl.searchParams.get("key") !== expected) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // 2) Decodifica o envelope do Pub/Sub: { message: { data: base64(JSON) } }
  let payload: RtdnPayload;
  try {
    const body = await request.json();
    const dataB64 = body?.message?.data;
    if (!dataB64) {
      // Sem data → pode ser uma chamada de verificação do Pub/Sub. Ack.
      return NextResponse.json({ ok: true, note: "sem message.data" });
    }
    payload = JSON.parse(Buffer.from(dataB64, "base64").toString("utf8"));
  } catch (e) {
    console.error("[RTDN] envelope inválido:", e);
    // Ack pra não entrar em loop de retry — não é erro nosso recuperável.
    return NextResponse.json({ ok: true, note: "envelope inválido" });
  }

  // Notificação de teste (botão "Enviar notificação de teste" do Play Console) → ack.
  if (payload.testNotification) {
    console.log("[RTDN] testNotification recebida ✅");
    return NextResponse.json({ ok: true, test: true });
  }

  if (payload.packageName && payload.packageName !== ANDROID_PACKAGE) {
    console.warn("[RTDN] packageName diferente, ignorado:", payload.packageName);
    return NextResponse.json({ ok: true, note: "package diferente" });
  }

  const admin = createAdminClient();

  // 3) Estorno / chargeback → CORTA o acesso na hora (anti-burla)
  if (payload.voidedPurchaseNotification?.purchaseToken) {
    const token = payload.voidedPurchaseNotification.purchaseToken;
    const ok = await revokeByToken(admin, token, "voided/refund");
    return NextResponse.json({ ok: true, action: "revoked", matched: ok });
  }

  // 4) Mudança de assinatura → re-valida com o Google e ajusta
  const sn = payload.subscriptionNotification;
  if (!sn?.purchaseToken) {
    return NextResponse.json({ ok: true, note: "sem subscriptionNotification" });
  }
  const token = sn.purchaseToken;
  const typeLabel = TYPE_LABEL[sn.notificationType ?? -1] ?? String(sn.notificationType);

  // Acha a casa/dono dono deste token (gravado em subscriptions na 1ª compra).
  const { data: subRow } = await admin
    .from("subscriptions")
    .select("user_id, house_id, plan")
    .eq("provider", "google_play")
    .eq("provider_subscription_id", token)
    .maybeSingle();

  if (!subRow?.user_id) {
    // Pode ser um PURCHASED que chegou antes do cliente validar (a rota
    // /verificar cria a linha). Nada a fazer agora — ack.
    console.log(`[RTDN] ${typeLabel}: token ainda sem dono no banco (provável 1ª compra). Ignorado.`);
    return NextResponse.json({ ok: true, note: "token sem dono ainda" });
  }

  // Re-valida DIRETO com o Google (fonte da verdade)
  let result;
  try {
    result = await verifyPlaySubscription(token);
  } catch (e) {
    console.error("[RTDN] falha ao validar com o Google (retry):", e);
    // 500 → Pub/Sub reentrega depois. Bom pra erro transitório do Google.
    return NextResponse.json({ error: "validação falhou" }, { status: 500 });
  }

  const userId = subRow.user_id as string;
  const nowISO = new Date().toISOString();

  if (result.isValid && result.expiryMs) {
    // Ativa/renova → estende para a data REAL do Google em TODAS as casas do dono
    const expiresAt = new Date(result.expiryMs).toISOString();
    const plan = subRow.plan === "yearly" ? "yearly" : "monthly";

    await admin
      .from("houses")
      .update({ plan, plan_status: "active", plan_expires_at: expiresAt })
      .eq("owner_id", userId);

    // Descongela convidados
    const { data: ownerHouses } = await admin.from("houses").select("id").eq("owner_id", userId);
    const ids = (ownerHouses ?? []).map((h) => h.id);
    if (ids.length > 0) {
      await admin
        .from("house_members")
        .update({ status: "active" })
        .in("house_id", ids)
        .eq("status", "frozen")
        .neq("role", "owner");
    }

    await admin
      .from("subscriptions")
      .update({ status: "active", current_period_end: expiresAt, updated_at: nowISO })
      .eq("provider", "google_play")
      .eq("provider_subscription_id", token);

    console.log(`[RTDN] ${typeLabel}: casa do dono ${userId} ATIVA até ${expiresAt}`);
    return NextResponse.json({ ok: true, action: "active", expiresAt });
  }

  // Não está mais válida (expirou / revogada / cancelada e vencida) → CORTA
  await revokeByToken(admin, token, typeLabel);
  return NextResponse.json({ ok: true, action: "revoked", state: result.state });
}

/**
 * Corta o acesso premium ligado a um purchaseToken. NÃO apaga dados — apenas
 * marca como inativo; o vencimento em tempo real (verificar-limite) + o
 * useSubscription tratam como grátis e congelam o que passar do limite.
 */
async function revokeByToken(
  admin: ReturnType<typeof createAdminClient>,
  token: string,
  reason: string
): Promise<boolean> {
  const { data: subRow } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("provider", "google_play")
    .eq("provider_subscription_id", token)
    .maybeSingle();

  if (!subRow?.user_id) {
    console.log(`[RTDN] revoke (${reason}): token sem dono no banco. Ignorado.`);
    return false;
  }
  const userId = subRow.user_id as string;
  const nowISO = new Date().toISOString();

  // plan_expires_at no passado + status inactive → vira grátis em tempo real.
  await admin
    .from("houses")
    .update({ plan_status: "inactive", plan_expires_at: nowISO })
    .eq("owner_id", userId)
    .neq("plan", "free");

  await admin
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: nowISO })
    .eq("provider", "google_play")
    .eq("provider_subscription_id", token);

  console.log(`[RTDN] revoke (${reason}): casa do dono ${userId} → grátis`);
  return true;
}
