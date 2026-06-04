import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

/**
 * Cron diário (Vercel) — roda 1x/dia às 18h (Brasília): "0 21 * * *" UTC.
 *
 * PARTE 1 (PAGO) — Lembrete de compras: "Hora de ir às compras".
 *   Vai para TODA casa com reminder_enabled + plano válido + itens na lista.
 *   (18h fixo: o horário escolhido pelo usuário é tratado como preferência,
 *    porque o cron grátis só dispara 1x/dia.)
 *
 * PARTE 2 (GRÁTIS, re-engajamento estilo Duolingo) — Nudge diário:
 *   "Dá uma olhada na despensa hoje". Vai para quem tem notificação ativa,
 *   NÃO abriu o app hoje e NÃO recebeu outra notificação hoje.
 *   Regra de ouro: NO MÁXIMO 1 notificação por dia por usuário (sem colisão).
 */

// Frases rotativas do nudge (gira por dia, pra nunca enjoar).
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
  // Verifica token de segurança do Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();

  // Conjunto de usuários que JÁ receberam alguma notificação hoje (dedup global,
  // garante no máximo 1 notificação/dia por usuário — sem colisão lembrete×nudge).
  const notifiedToday = new Set<string>();

  let remindersSent = 0;
  let nudgesSent = 0;

  try {
    // ─────────────────────────────────────────────────────────────
    // PARTE 1 — LEMBRETE DE COMPRAS (pago)
    // ─────────────────────────────────────────────────────────────
    const { data: houses } = await admin
      .from("houses")
      .select("id, name, owner_id, plan_expires_at")
      .eq("reminder_enabled", true)
      .in("plan_status", ["active", "trialing", "cancelled"]);

    for (const house of houses ?? []) {
      // Acesso expirado (trial/período pago) não recebe lembrete.
      if (house.plan_expires_at && new Date(house.plan_expires_at).getTime() <= now) continue;

      // Já enviou lembrete hoje pra essa casa? (evita duplicata)
      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("house_id", house.id)
        .eq("type", "reminder")
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

  try {
    // ─────────────────────────────────────────────────────────────
    // PARTE 2 — NUDGE DIÁRIO (re-engajamento, grátis)
    // ─────────────────────────────────────────────────────────────
    const { data: subs } = await admin.from("push_subscriptions").select("user_id");
    const pushUserIds = [...new Set((subs ?? []).map((s: { user_id: string }) => s.user_id))];

    if (pushUserIds.length > 0) {
      // Atividade (last_active_at) desses usuários.
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

      // Frase do dia (determinística, com variações de sexta e domingo).
      const brasil = new Date(now - 3 * 60 * 60 * 1000);
      const dayOfWeek = brasil.getUTCDay(); // 0=dom ... 6=sáb
      const dayOfYear = Math.floor(
        (brasil.getTime() - Date.UTC(brasil.getUTCFullYear(), 0, 0)) / 86_400_000
      );
      const phrase =
        dayOfWeek === 5 ? NUDGE_FRIDAY
        : dayOfWeek === 0 ? NUDGE_SUNDAY
        : NUDGE_PHRASES[dayOfYear % NUDGE_PHRASES.length];

      const MAX_INACTIVE = 21 * 24 * 60 * 60 * 1000; // não insiste em quem sumiu há +21 dias

      for (const prof of profs ?? []) {
        const uid = (prof as { user_id: string }).user_id;
        const la = (prof as { last_active_at: string | null }).last_active_at;

        if (notifiedToday.has(uid)) continue;          // já recebeu algo hoje
        if (!la) continue;                              // sem dado de atividade → não incomoda
        const laTime = new Date(la).getTime();
        if (laTime >= todayStart.getTime()) continue;   // abriu o app hoje → não incomoda
        if (now - laTime > MAX_INACTIVE) continue;      // sumiu há muito tempo → não insiste

        await sendPushToUser(admin, uid, {
          title: phrase.title,
          body: phrase.body,
          url: "/despensa",
          tag: `nudge-${uid}`,
        });
        notifiedToday.add(uid);
        nudgesSent++;
      }
    }
  } catch (err) {
    console.error("[Cron] Erro na Parte 2 (nudge):", err);
  }

  return NextResponse.json({ message: "OK", reminders: remindersSent, nudges: nudgesSent });
}
