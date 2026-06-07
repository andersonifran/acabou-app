import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

/**
 * Cron (Vercel Pro) — roda a cada 15 minutos.
 *
 * PARTE 1 (PAGO) — Lembrete de compras: "Hora de ir às compras".
 *   Enviado no HORÁRIO QUE O USUÁRIO ESCOLHEU (reminder_time), dentro da
 *   janela de 15 min correspondente. Só para casas com plano válido + itens.
 *
 * PARTE 2 (GRÁTIS) — Nudge diário de re-engajamento (estilo Duolingo):
 *   Roda 1x/dia, SÓ na janela das 18h. Vai para quem tem push ativo, NÃO
 *   abriu o app hoje e NÃO recebeu outra notificação hoje.
 *
 * Regra de ouro: no máximo 1 notificação/dia por usuário (sem colisão).
 */

const NUDGE_PHRASES = [
  { title: "Dá uma olhada na despensa hoje 👀", body: "Marque o que tá acabando pra não faltar nada." },
  { title: "Tá faltando algo em casa? 🏠", body: "Deixa marcado pra não esquecer no mercado." },
  { title: "Bora manter a casa abastecida? 🛒", body: "Confere a despensa em 10 segundos." },
  { title: "Café, arroz, sabão... 🤔", body: "Se tá no fim, deixa anotado no Acabou?" },
  { title: "Antes de ir ao mercado 📝", body: "Marque o que falta — a lista se monta sozinha." },
  { title: "10 segundos agora 🙈", body: "Evite o 'ah, esqueci!' na hora das compras." },
  { title: "Sua família conta com você 💚", body: "Marque o que tá faltando em casa." },
  { title: "Despensa em dia = vida tranquila 😌", body: "Dá uma conferida rapidinho?" },
  { title: "O que será que tá acabando aí? 👀", body: "Confere rapidinho na despensa." },
  { title: "Nada pior que ver que faltou 😅", body: "Olha a despensa antes de sair de casa!" },
];
const NUDGE_FRIDAY = { title: "Fim de semana chegando! 🛒", body: "Vê o que falta antes das compras." };
const NUDGE_SUNDAY = { title: "Bora começar a semana abastecido? 🗓️", body: "Confere a despensa e monte a lista." };

export async function GET(request: NextRequest) {
  // Token de segurança do Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();

  // Hora atual no Brasil (UTC-3) + janela de 15 min (alinhada ao cron).
  const d = new Date();
  const brasilHour = (d.getUTCHours() - 3 + 24) % 24;
  const brasilMinute = d.getUTCMinutes();
  const currentMinutes = brasilHour * 60 + brasilMinute;
  const slotStart = Math.floor(currentMinutes / 15) * 15; // 0,15,30,45...

  // Dedup global: no máximo 1 notificação/dia por usuário.
  const notifiedToday = new Set<string>();

  let remindersSent = 0;
  let nudgesSent = 0;

  // ───────────────────────────────────────────────────────────────
  // PARTE 1 — LEMBRETE DE COMPRAS (no horário escolhido pelo usuário)
  // ───────────────────────────────────────────────────────────────
  try {
    const { data: houses } = await admin
      .from("houses")
      .select("id, name, owner_id, reminder_time, plan_expires_at")
      .eq("reminder_enabled", true)
      .in("plan_status", ["active", "trialing", "cancelled"]);

    for (const house of houses ?? []) {
      // Acesso expirado (trial/período pago) não recebe lembrete.
      if (house.plan_expires_at && new Date(house.plan_expires_at).getTime() <= now) continue;

      // O horário escolhido cai na janela de 15 min atual?
      const [rh, rm] = (house.reminder_time ?? "18:00").split(":").map(Number);
      const reminderMinutes = rh * 60 + rm;
      if (reminderMinutes < slotStart || reminderMinutes >= slotStart + 15) continue;

      // Já recebeu QUALQUER notificação hoje? (regra de ouro: máx 1/dia por usuário)
      if (notifiedToday.has(house.owner_id)) continue;
      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", house.owner_id)
        .gte("created_at", todayStartISO)
        .limit(1);
      if (existing && existing.length > 0) {
        notifiedToday.add(house.owner_id);
        continue;
      }

      // Tem itens pra comprar? Se não, não incomoda.
      const { count } = await admin
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("house_id", house.id)
        .in("status", ["acabou", "acabando", "comprar"]);
      if (!count || count === 0) continue;

      const plural = count === 1 ? "item" : "itens";
      await sendPushToUser(admin, house.owner_id, {
        title: "🛒 Hora de ir às compras!",
        body: `Você tem ${count} ${plural} para comprar na "${house.name}"`,
        url: "/lista",
        tag: `reminder-${house.id}`,
      });
      await admin.from("notifications").insert({
        user_id: house.owner_id,
        house_id: house.id,
        type: "reminder",
        title: "Hora de ir às compras!",
        body: `Você tem ${count} ${plural} para comprar`,
        data: { items_count: count },
      });
      notifiedToday.add(house.owner_id);
      remindersSent++;
    }
  } catch (err) {
    console.error("[Cron] Erro na Parte 1 (lembrete):", err);
  }

  // ───────────────────────────────────────────────────────────────
  // PARTE 2 — NUDGE DIÁRIO (re-engajamento) — só na janela das 18h
  // ───────────────────────────────────────────────────────────────
  const isNudgeWindow = brasilHour === 18 && brasilMinute < 15;
  if (isNudgeWindow) {
    try {
      const { data: subs } = await admin.from("push_subscriptions").select("user_id");
      const pushUserIds = [...new Set((subs ?? []).map((s: { user_id: string }) => s.user_id))];

      // Mapa dono → uma casa (pra registrar o nudge em notifications: dedup + histórico).
      const { data: nudgeHouses } = await admin
        .from("houses")
        .select("id, owner_id")
        .in("owner_id", pushUserIds.length > 0 ? pushUserIds : ["__none__"]);
      const ownerToHouse = new Map<string, string>();
      for (const h of (nudgeHouses ?? []) as { id: string; owner_id: string }[]) {
        if (!ownerToHouse.has(h.owner_id)) ownerToHouse.set(h.owner_id, h.id);
      }

      if (pushUserIds.length > 0) {
        const { data: profs } = await admin
          .from("profiles")
          .select("user_id, last_active_at")
          .in("user_id", pushUserIds);

        // Quem já recebeu QUALQUER notificação hoje → não recebe nudge.
        const { data: notifsToday } = await admin
          .from("notifications")
          .select("user_id")
          .gte("created_at", todayStartISO)
          .in("user_id", pushUserIds);
        for (const n of notifsToday ?? []) notifiedToday.add((n as { user_id: string }).user_id);

        // Frase do dia (determinística; sexta e domingo têm variações).
        const brasil = new Date(now - 3 * 60 * 60 * 1000);
        const dayOfWeek = brasil.getUTCDay();
        const dayOfYear = Math.floor(
          (brasil.getTime() - Date.UTC(brasil.getUTCFullYear(), 0, 0)) / 86_400_000
        );
        const phrase =
          dayOfWeek === 5 ? NUDGE_FRIDAY
          : dayOfWeek === 0 ? NUDGE_SUNDAY
          : NUDGE_PHRASES[dayOfYear % NUDGE_PHRASES.length];

        const MAX_INACTIVE = 30 * 24 * 60 * 60 * 1000;

        for (const prof of profs ?? []) {
          const uid = (prof as { user_id: string }).user_id;
          const la = (prof as { last_active_at: string | null }).last_active_at;

          if (notifiedToday.has(uid)) continue;        // regra de ouro: máx 1/dia
          // MODELO DUOLINGO: manda o lembrete diário pra TODOS com push, MESMO
          // quem abriu o app hoje (mantém engajado). Só pula quem sumiu há +30d.
          if (la && now - new Date(la).getTime() > MAX_INACTIVE) continue;

          await sendPushToUser(admin, uid, {
            title: phrase.title,
            body: phrase.body,
            icon: "/mascote/sacolino-acenando.png",
            url: "/despensa",
            tag: `nudge-${uid}`,
          });
          // Registra o nudge (dedup entre execuções + histórico in-app).
          const hid = ownerToHouse.get(uid);
          if (hid) {
            await admin.from("notifications").insert({
              user_id: uid,
              house_id: hid,
              type: "nudge",
              title: phrase.title,
              body: phrase.body,
            });
          }
          notifiedToday.add(uid);
          nudgesSent++;
        }
      }
    } catch (err) {
      console.error("[Cron] Erro na Parte 2 (nudge):", err);
    }
  }

  return NextResponse.json({ message: "OK", reminders: remindersSent, nudges: nudgesSent });
}
