import { NextRequest, NextResponse } from "next/server";
import MercadoPagoLib, { PreApproval } from "mercadopago";
import { syncSubscriptionFromPreapproval } from "@/lib/subscription-sync";

// =============================================
// WEBHOOK DE ASSINATURA — Mercado Pago (recorrente)
// =============================================
// Configure no painel do Mercado Pago:
// Suas integrações → Webhooks → URL: https://www.acabouapp.com.br/api/webhooks/payment
// Eventos (tópicos):
//   • Assinaturas (subscription_preapproval)          → autorização/cancelamento
//   • Pagamento de assinatura (subscription_authorized_payment) → renovação automática
//
// A lógica de banco fica em lib/subscription-sync.ts (idempotente: usa o
// next_payment_date do MP como fonte da verdade do "acesso até quando").

const MP_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    // O MP manda tanto no corpo (Webhooks v2) quanto na query (IPN). Cobrimos os dois.
    const url = new URL(request.url);
    let body: any = {};
    try { body = await request.json(); } catch { /* IPN pode vir sem corpo */ }

    const type = String(
      body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? ""
    );
    const dataId = String(
      body.data?.id ?? body.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? ""
    );

    console.log(`[Webhook] type="${type}" id="${dataId}"`);

    if (!dataId) {
      return NextResponse.json({ ok: true }); // nada a processar
    }

    const client = new MercadoPagoLib({ accessToken: MP_TOKEN });
    const preApproval = new PreApproval(client);

    // ---------- Renovação automática (cobrança recorrente) ----------
    // O evento traz o id do "authorized_payment"; buscamos para achar o
    // preapproval e então re-sincronizamos a partir dele.
    if (type.includes("authorized_payment")) {
      try {
        const resp = await fetch(`https://api.mercadopago.com/authorized_payments/${dataId}`, {
          headers: { Authorization: `Bearer ${MP_TOKEN}` },
        });
        const ap = await resp.json();
        const preId = ap?.preapproval_id;
        if (preId) {
          const pre = await preApproval.get({ id: String(preId) });
          await syncSubscriptionFromPreapproval(pre);
        } else {
          console.error("[Webhook] authorized_payment sem preapproval_id:", dataId);
        }
      } catch (e) {
        console.error("[Webhook] erro ao processar authorized_payment:", e);
        return NextResponse.json({ ok: false }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // ---------- Autorização / cancelamento da assinatura ----------
    if (type.includes("preapproval")) {
      try {
        const pre = await preApproval.get({ id: dataId });
        await syncSubscriptionFromPreapproval(pre);
      } catch (e) {
        console.error("[Webhook] erro ao processar preapproval:", e);
        return NextResponse.json({ ok: false }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    // Outros eventos (ex.: "payment" avulso) — ignorados; a assinatura é tratada
    // pelos tópicos acima.
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook Error]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
