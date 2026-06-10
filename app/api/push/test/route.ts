import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

// =============================================================
// Diagnóstico de notificações — envia um push de TESTE pro próprio usuário.
// POST: chamado pelo botão "Testar notificação" nas Configurações.
// GET : abrir no navegador (logado) também dispara — útil pra debug rápido.
// Retorna quantas inscrições o usuário tem e quantas receberam — assim dá pra
// saber se o problema é (a) sem inscrição salva, (b) envio falhando, ou (c) só
// as condições do cron (que pulam quem está ativo/sem itens).
// =============================================================

export const runtime = "nodejs";

async function handle() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (!subs || subs.length === 0) {
    return NextResponse.json({
      ok: false,
      reason: "sem_inscricao",
      message:
        "Você não tem nenhuma inscrição de notificação salva. Ative as notificações primeiro (e aceite a permissão do celular).",
      subscriptions: 0,
    });
  }

  let sent = 0;
  let expired = 0;
  let failed = 0;
  const expiredIds: string[] = [];
  await Promise.all(
    subs.map(async (sub) => {
      const r = await sendPushNotification(sub, {
        title: "Oi! Sou o Sacolino 👋",
        body: "Suas notificações estão ativas! Vou te lembrar do que falta em casa. 💚",
        icon: "/mascote/sacolino-acenando.png",
        url: "/home",
        tag: "teste-push",
      });
      if (r.success) sent++;
      else if (r.expired) { expired++; expiredIds.push(sub.id); }
      else failed++;
    })
  );

  // Limpa inscrições MORTAS (410/404) — assim o app volta a pedir pra ativar e
  // o usuário cria uma inscrição nova e válida (em vez de tentar uma morta).
  if (expiredIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return NextResponse.json({
    ok: sent > 0,
    subscriptions: subs.length,
    sent,
    expired,
    failed,
    message:
      sent > 0
        ? "Push de teste enviado! Deve chegar em segundos."
        : "Tinha inscrição, mas o envio falhou (expirada ou erro de VAPID). Reative as notificações.",
  });
}

export async function POST() {
  return handle();
}
export async function GET(_request: NextRequest) {
  return handle();
}
