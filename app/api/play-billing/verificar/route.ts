// =============================================================
// POST /api/play-billing/verificar
// =============================================================
// Recebe { purchaseToken, productId } do app Android, valida com o Google
// (anti-burla) e, se a assinatura estiver ativa, libera o premium no servidor
// — escrevendo nas MESMAS tabelas/colunas do Mercado Pago (houses +
// subscriptions), só mudando provider para "google_play".
//
// GET /api/play-billing/verificar?selftest=1  (header: Authorization: Bearer CRON_SECRET)
//   → diagnóstico: confirma que a service account autentica e tem permissão,
//     sem precisar de uma compra real.

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  verifyPlaySubscription,
  acknowledgePlaySubscription,
  playBillingSelfTest,
} from "@/lib/play-billing-verify";

export const runtime = "nodejs";

// productId (Play Console) → plano interno (houses.plan)
const PRODUCT_TO_PLAN: Record<string, "monthly" | "yearly"> = {
  plano_familia_mensal: "monthly",
  plano_familia_anual: "yearly",
};

export async function POST(request: NextRequest) {
  // 1) Usuário autenticado (sessão real — anti-burla)
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // 2) Corpo da requisição
  let body: { purchaseToken?: unknown; productId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const purchaseToken = typeof body.purchaseToken === "string" ? body.purchaseToken : "";
  const productId = typeof body.productId === "string" ? body.productId : "";
  if (!purchaseToken || !productId) {
    return NextResponse.json(
      { error: "purchaseToken e productId são obrigatórios" },
      { status: 400 }
    );
  }
  const plan = PRODUCT_TO_PLAN[productId];
  if (!plan) {
    return NextResponse.json({ error: "productId desconhecido" }, { status: 400 });
  }

  // 3) Valida DIRETO com o Google
  let result;
  try {
    result = await verifyPlaySubscription(purchaseToken);
  } catch (e) {
    console.error("[play-billing] erro ao validar com o Google:", e);
    return NextResponse.json({ error: "Falha ao validar com o Google" }, { status: 502 });
  }

  if (!result.isValid) {
    console.warn("[play-billing] assinatura não liberada", {
      userId: user.id,
      productId,
      state: result.state,
      expiryMs: result.expiryMs,
      httpStatus: result.httpStatus,
      error: result.error,
    });
    return NextResponse.json(
      { ok: false, active: false, reason: result.state ?? "invalid" },
      { status: 200 }
    );
  }

  // 4) Libera premium nas MESMAS colunas do Mercado Pago (provider = google_play)
  const admin = createAdminClient();
  const expiresAt = new Date(result.expiryMs as number).toISOString();
  const nowISO = new Date().toISOString();

  // Casas que o usuário é dono (a assinatura é por dono, ativa todas)
  const { data: ownerHouses, error: housesErr } = await admin
    .from("houses")
    .select("id")
    .eq("owner_id", user.id);
  if (housesErr) {
    console.error("[play-billing] erro ao buscar casas:", housesErr);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }

  const { error: updErr } = await admin
    .from("houses")
    .update({ plan, plan_status: "active", plan_expires_at: expiresAt })
    .eq("owner_id", user.id);
  if (updErr) {
    console.error("[play-billing] erro ao liberar plano:", updErr);
    return NextResponse.json({ error: "Falha ao liberar o plano" }, { status: 500 });
  }

  // Reativa membros congelados (igual ao fluxo do MP)
  const ownerHouseIds = (ownerHouses ?? []).map((h) => h.id);
  if (ownerHouseIds.length > 0) {
    await admin
      .from("house_members")
      .update({ status: "active" })
      .in("house_id", ownerHouseIds)
      .eq("status", "frozen")
      .neq("role", "owner");
  }

  // Trilha de auditoria (subscriptions) — 1 por casa (onConflict house_id)
  const houseId = ownerHouseIds[0] ?? null;
  if (houseId) {
    const { error: subErr } = await admin.from("subscriptions").upsert(
      {
        house_id: houseId,
        user_id: user.id,
        provider: "google_play",
        provider_subscription_id: purchaseToken,
        plan,
        status: "active",
        current_period_start: nowISO,
        current_period_end: expiresAt,
        updated_at: nowISO,
      },
      { onConflict: "house_id" }
    );
    if (subErr) console.error("[play-billing] erro ao gravar subscriptions:", subErr);
  }

  // 5) Confirma a compra (OBRIGATÓRIO em 3 dias). Se falhar, não derruba a
  //    request — o premium já foi liberado; o RTDN (peça 3) reprocessa.
  if (!result.acknowledged) {
    try {
      await acknowledgePlaySubscription(productId, purchaseToken);
    } catch (e) {
      console.error("[play-billing] acknowledge falhou (tentaremos de novo):", e);
    }
  }

  return NextResponse.json({ ok: true, active: true, plan, expiresAt });
}

// Diagnóstico protegido por CRON_SECRET (não é público)
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("selftest") !== "1") {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const r = await playBillingSelfTest();
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ authOk: false, detail: (e as Error).message }, { status: 500 });
  }
}
