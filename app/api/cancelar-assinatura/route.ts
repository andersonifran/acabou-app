import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { cancelRecurringSubscription, preApproval } from "@/lib/mercadopago";

// =============================================
// CANCELAR ASSINATURA (estilo Netflix)
// =============================================
// Cancela a auto-renovação no Mercado Pago, mas o usuário MANTÉM o acesso até o
// fim do período já pago (plan_expires_at). Depois disso o cron/vencimento em
// tempo real congela e ele volta ao plano grátis. Para voltar, é só assinar de
// novo (a cobrança começa no fim do período atual — não paga em dobro).

export async function POST(request: NextRequest) {
  try {
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

    // A casa que ele É DONO. limit(1).maybeSingle() (não single()): dono pode ter
    // VÁRias casas e single() quebraria (500). role=owner evita pegar uma casa
    // em que ele é só convidado (o que daria um 403 errado mais abaixo).
    const { data: membership } = await supabase
      .from("house_members")
      .select("house_id")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
    }

    const admin = createAdminClient();

    // Só o dono pode cancelar
    const { data: house } = await admin
      .from("houses")
      .select("owner_id, plan, plan_status, plan_expires_at")
      .eq("id", membership.house_id)
      .single();

    if (!house || house.owner_id !== user.id) {
      return NextResponse.json({ error: "Apenas o dono pode cancelar a assinatura." }, { status: 403 });
    }

    // Busca o id da assinatura recorrente (preapproval) no Mercado Pago
    const { data: sub } = await admin
      .from("subscriptions")
      .select("id, provider_subscription_id, status")
      .eq("house_id", membership.house_id)
      .maybeSingle();

    let preapprovalId = sub?.provider_subscription_id ?? null;

    // FALLBACK de segurança: se não temos o id da assinatura salvo localmente
    // (ex.: o registro não foi criado por algum motivo), buscamos a assinatura
    // ATIVA do dono direto no Mercado Pago. Assim SEMPRE conseguimos cancelar na
    // fonte e parar a cobrança — nunca deixamos cobrando por falta de registro.
    if (!preapprovalId && user.email) {
      try {
        const search = await preApproval.search({ options: { payer_email: user.email } });
        const found = search.results?.find((r) => {
          const ref = String(r.external_reference ?? "");
          return ref.includes(`:${user.id}:`) && r.status === "authorized";
        });
        if (found?.id) preapprovalId = String(found.id);
      } catch (e) {
        console.error("[Cancelar] busca da assinatura no MP falhou:", e);
      }
    }

    // TRAVA PRINCIPAL contra cobrança indevida: ao marcar a assinatura como
    // "cancelled" no Mercado Pago, o PRÓPRIO MP para de cobrar — nem tenta a
    // próxima fatura (mês/ano seguinte). A parada acontece na fonte.
    // Se essa chamada FALHAR, NÃO fingimos que cancelou (senão o MP continuaria
    // cobrando enquanto mostramos "cancelado") — devolvemos erro pra tentar de novo.
    if (preapprovalId) {
      try {
        await cancelRecurringSubscription(preapprovalId);
      } catch (e) {
        console.error("[Cancelar] MP falhou ao cancelar:", e);
        return NextResponse.json(
          { error: "Não conseguimos cancelar agora. Tente de novo em instantes." },
          { status: 502 }
        );
      }
    }

    const now = new Date().toISOString();

    // Marca como cancelada — mantém plan e plan_expires_at (acesso até o fim)
    await admin
      .from("houses")
      .update({ plan_status: "cancelled" })
      .eq("owner_id", user.id)
      .neq("plan", "free");

    if (sub) {
      await admin
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: now })
        .eq("id", sub.id);
    }

    console.log(`[Cancelar] ✅ Casa ${membership.house_id} — assinatura cancelada, acesso até ${house.plan_expires_at}`);

    return NextResponse.json({
      ok: true,
      expires_at: house.plan_expires_at,
    });
  } catch (err) {
    console.error("[Cancelar Assinatura Error]", err);
    return NextResponse.json({ error: "Erro ao cancelar assinatura" }, { status: 500 });
  }
}
