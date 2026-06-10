import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { subscription, deliberate } = await request.json();

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Subscription inválida" }, { status: 400 });
    }

    const admin = createAdminClient();

    // RESPEITA o "Desativar" DELIBERADO (fonte da verdade no servidor — o SW não
    // lê localStorage). deliberate=true = reativação pelo usuário (convite/config)
    // → limpa o opt-out e salva. Sem deliberate = re-cadastro AUTOMÁTICO (SW
    // pushsubscriptionchange / resync): se o usuário optou por sair, NÃO salva.
    if (deliberate) {
      await admin.from("profiles").update({ push_opted_out: false }).eq("user_id", user.id);
    } else {
      const { data: prof } = await admin
        .from("profiles")
        .select("push_opted_out")
        .eq("user_id", user.id)
        .maybeSingle();
      if ((prof as any)?.push_opted_out) {
        return NextResponse.json({ success: true, skipped: "opted_out" });
      }
    }

    // Upsert: se já existe esse endpoint para o user, atualiza
    const { error } = await admin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        { onConflict: "user_id,endpoint" }
      );

    if (error) {
      console.error("[Push Subscribe] Erro:", error);
      return NextResponse.json({ error: "Erro ao salvar subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Push Subscribe] Erro inesperado:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { endpoint, optout } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint obrigatório" }, { status: 400 });
    }

    const admin = createAdminClient();

    await admin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);

    // optout=true → "Desativar" DELIBERADO: marca no servidor pra o re-cadastro
    // AUTOMÁTICO (SW) não religar. (A limpeza de endpoint antigo dentro do
    // subscribe NÃO manda optout → não marca.)
    if (optout) {
      await admin.from("profiles").update({ push_opted_out: true }).eq("user_id", user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Push Unsubscribe] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
