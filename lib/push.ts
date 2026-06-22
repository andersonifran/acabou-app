import "server-only"; // trava: nunca pode ir pro client (protege VAPID_PRIVATE_KEY)
import webpush from "web-push";

// Configura VAPID keys
webpush.setVapidDetails(
  "mailto:anderson.ifran26@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Envia push notification para uma subscription específica
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/web-app-manifest-192x192.png",
    badge: payload.badge ?? "/badge.png",
    url: payload.url ?? "/home",
    tag: payload.tag,
    data: payload.data ?? {},
  });

  try {
    // urgency:"high" + TTL: faz o push tentar FURAR a economia de bateria/Doze do
    // Android (alta prioridade na FCM = acorda o aparelho pra entregar na hora) e
    // segura a mensagem por até 24h se o device estiver offline/dormindo. É o TETO
    // do que a web/PWA controla — entrega 100% independente de bateria só no nativo.
    await webpush.sendNotification(pushSubscription, notificationPayload, {
      urgency: "high",
      TTL: 60 * 60 * 24,
    });
    return { success: true };
  } catch (error: any) {
    // 404 ou 410 = subscription expirada, deve ser removida
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { success: false, expired: true };
    }
    console.error("[Push] Erro ao enviar:", error.message);
    return { success: false, expired: false };
  }
}

/**
 * Envia push para todos os dispositivos de um usuário
 * Remove subscriptions expiradas automaticamente
 */
export async function sendPushToUser(
  supabaseAdmin: any,
  userId: string,
  payload: PushPayload
) {
  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  const expiredIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub: any) => {
      const result = await sendPushNotification(sub, payload);
      if (result.expired) {
        expiredIds.push(sub.id);
      }
    })
  );

  // Remove subscriptions expiradas
  if (expiredIds.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds);
  }
}
