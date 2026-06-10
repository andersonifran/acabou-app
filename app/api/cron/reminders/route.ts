import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";

/**
 * Cron (Vercel Pro) — roda a cada 15 minutos.
 *
 * PARTE 1 (PAGO) — Lembrete de compras no HORÁRIO QUE O USUÁRIO ESCOLHEU
 *   (reminder_time): "você tem N itens pra comprar". Só casas com plano válido +
 *   itens pendentes. Frase ROTACIONA (não repete dia a dia).
 *
 * PARTE 2 (GRÁTIS) — Nudge diário de re-engajamento (estilo Duolingo), 1x/dia
 *   na janela das 18h, pra quem tem push e NÃO recebeu outra notificação hoje:
 *     • TEM itens pendentes  → lembrete "tem N pra comprar" (pra quem não marcou
 *       horário — assim ninguém esquece os itens da lista).
 *     • SEM itens            → nudge de despensa (confere o que tá acabando).
 *
 * Regra de ouro: no máximo 1 notificação/dia por usuário (sem colisão).
 *
 * Variedade premium: a frase é escolhida por (dia-do-ano + offset do usuário) →
 * muda TODO dia (nunca repete a de ontem) e é diferente entre usuários. Cada
 * frase carrega uma POSE do Sacolino que combina com o contexto. O `tag` leva a
 * data → cada dia é uma notificação NOVA (não substitui silenciosamente a de
 * ontem, que era parte do "parece a mesma mensagem repetida").
 */

// ── Poses do Sacolino (ícone da notificação) por contexto ──
const POSE = {
  placa: "/mascote/sacolino-placa.png",        // segurando a lista/placa
  buscando: "/mascote/sacolino-buscando.png",  // procurando/conferindo
  acenando: "/mascote/sacolino-acenando.png",  // chamando/oi
  feliz: "/mascote/sacolino-feliz.png",        // leve, do dia a dia
  comemorando: "/mascote/sacolino-comemorando.png", // fim de semana
  alerta: "/mascote/sacolino-alerta.png",      // atenção, tá faltando
};

// LEMBRETE DE COMPRAS — quando há itens pendentes. {n}=qtd, {p}=item/itens,
// {c}=nome da casa. Frases pensadas pra funcionar no singular e no plural.
const PENDING_PHRASES: {
  title: string;
  body: (n: number, p: string, c: string) => string;
  pose: string;
}[] = [
  { title: "🛒 Hora de ir às compras!", body: (n, p, c) => `Você tem ${n} ${p} pra comprar na "${c}".`, pose: POSE.placa },
  { title: "Bora resolver as compras? 🛍️", body: (n, p, c) => `Tem ${n} ${p} esperando na lista da "${c}".`, pose: POSE.buscando },
  { title: "Sua lista já tá pronta 📝", body: (n, p, c) => `Tem ${n} ${p} pra pegar no mercado da "${c}".`, pose: POSE.placa },
  { title: "Vai ao mercado hoje? 🛒", body: (n, p, c) => `Não esqueça: ${n} ${p} na lista da "${c}".`, pose: POSE.buscando },
  { title: "Tem coisa faltando em casa 👀", body: (n, p, c) => `Você marcou ${n} ${p} pra comprar na "${c}".`, pose: POSE.alerta },
  { title: "Psiu, lembra das compras? 🙋", body: (n, p, c) => `Tem ${n} ${p} te esperando na lista da "${c}".`, pose: POSE.acenando },
  { title: "Antes que esqueça… 📌", body: (n, p, c) => `Você tem ${n} ${p} pra comprar na "${c}".`, pose: POSE.placa },
  { title: "Lista cheia, despensa vazia? 🛒", body: (n, p, c) => `Tem ${n} ${p} aguardando compra na "${c}".`, pose: POSE.buscando },
];

// NUDGE DE DESPENSA — re-engajamento pra quem NÃO tem itens pendentes.
const NUDGE_PHRASES: { title: string; body: string; pose: string }[] = [
  { title: "Dá uma olhada na despensa hoje 👀", body: "Marque o que tá acabando pra não faltar nada.", pose: POSE.buscando },
  { title: "Tá faltando algo em casa? 🏠", body: "Deixa marcado pra não esquecer no mercado.", pose: POSE.buscando },
  { title: "Bora manter a casa abastecida? 🛒", body: "Confere a despensa em 10 segundos.", pose: POSE.placa },
  { title: "Café, arroz, sabão... 🤔", body: "Se tá no fim, deixa anotado no Acabou?", pose: POSE.buscando },
  { title: "Antes de ir ao mercado 📝", body: "Marque o que falta — a lista se monta sozinha.", pose: POSE.placa },
  { title: "10 segundos agora 🙈", body: "Evite o 'ah, esqueci!' na hora das compras.", pose: POSE.acenando },
  { title: "Sua família conta com você 💚", body: "Marque o que tá faltando em casa.", pose: POSE.feliz },
  { title: "Despensa em dia = vida tranquila 😌", body: "Dá uma conferida rapidinho?", pose: POSE.feliz },
  { title: "O que será que tá acabando aí? 👀", body: "Confere rapidinho na despensa.", pose: POSE.buscando },
  { title: "Nada pior que ver que faltou 😅", body: "Olha a despensa antes de sair de casa!", pose: POSE.alerta },
];
const NUDGE_FRIDAY = { title: "Fim de semana chegando! 🛒", body: "Vê o que falta antes das compras.", pose: POSE.comemorando };
const NUDGE_SUNDAY = { title: "Bora começar a semana abastecido? 🗓️", body: "Confere a despensa e monte a lista.", pose: POSE.feliz };

// Escolhe um item do array de forma estável pelo "seed" (dia + usuário).
function pick<T>(arr: T[], seed: number): T {
  return arr[((Math.floor(seed) % arr.length) + arr.length) % arr.length];
}
// Offset estável por usuário → frases variam ENTRE pessoas (não é todo mundo a
// mesma frase no mesmo dia), sem precisar guardar nada no banco.
function userOffset(uid: string): number {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h + uid.charCodeAt(i)) % 9973;
  return h;
}

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

  // Seeds do dia (BRT) — compartilhados pela Parte 1 e 2 pra rotação consistente.
  const brasilNow = new Date(now - 3 * 60 * 60 * 1000);
  const dayOfWeek = brasilNow.getUTCDay();
  const dayOfYear = Math.floor(
    (brasilNow.getTime() - Date.UTC(brasilNow.getUTCFullYear(), 0, 0)) / 86_400_000
  );
  const dayKey = `${brasilNow.getUTCFullYear()}-${String(brasilNow.getUTCMonth() + 1).padStart(2, "0")}-${String(brasilNow.getUTCDate()).padStart(2, "0")}`;

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
      const ph = pick(PENDING_PHRASES, dayOfYear + userOffset(house.owner_id));
      const body = ph.body(count, plural, house.name);
      // Grava ANTES de enviar: o dedup lê a tabela `notifications`. Se o cron cair
      // entre enviar e gravar, a próxima execução já vê o registro e NÃO reenvia
      // (sem duplicata). Push falho é inofensivo — fica o histórico in-app.
      await admin.from("notifications").insert({
        user_id: house.owner_id,
        house_id: house.id,
        type: "reminder",
        title: ph.title,
        body,
        data: { items_count: count },
      });
      notifiedToday.add(house.owner_id);
      await sendPushToUser(admin, house.owner_id, {
        title: ph.title,
        body,
        icon: ph.pose,
        url: "/lista",
        tag: `reminder-${house.id}-${dayKey}`,
      });
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

      // Casa primária de cada dono (id + nome) → registrar o nudge + saber se tem
      // itens pendentes. Mantém a 1ª casa (a maioria tem só uma).
      const { data: nudgeHouses } = await admin
        .from("houses")
        .select("id, owner_id, name")
        .in("owner_id", pushUserIds.length > 0 ? pushUserIds : ["__none__"])
        .order("id", { ascending: true }); // determinístico: mesma casa primária todo dia
      const ownerPrimary = new Map<string, { houseId: string; name: string }>();
      for (const h of (nudgeHouses ?? []) as { id: string; owner_id: string; name: string }[]) {
        if (!ownerPrimary.has(h.owner_id)) ownerPrimary.set(h.owner_id, { houseId: h.id, name: h.name });
      }

      // Quantos itens pendentes por casa primária (1 query só) → pra decidir, por
      // usuário, entre "lembrete de compras" e "nudge de despensa".
      const primaryHouseIds = [...ownerPrimary.values()].map((v) => v.houseId);
      const pendingByHouse = new Map<string, number>();
      if (primaryHouseIds.length > 0) {
        const { data: pendingItems } = await admin
          .from("items")
          .select("house_id")
          .in("house_id", primaryHouseIds)
          .in("status", ["acabou", "acabando", "comprar"]);
        for (const it of (pendingItems ?? []) as { house_id: string }[]) {
          pendingByHouse.set(it.house_id, (pendingByHouse.get(it.house_id) ?? 0) + 1);
        }
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

        const MAX_INACTIVE = 30 * 24 * 60 * 60 * 1000;

        for (const prof of profs ?? []) {
          const uid = (prof as { user_id: string }).user_id;
          const la = (prof as { last_active_at: string | null }).last_active_at;

          if (notifiedToday.has(uid)) continue;        // regra de ouro: máx 1/dia
          // MODELO DUOLINGO: manda o lembrete diário pra TODOS com push, MESMO
          // quem abriu o app hoje (mantém engajado). Só pula quem sumiu há +30d.
          if (la && now - new Date(la).getTime() > MAX_INACTIVE) continue;

          const primary = ownerPrimary.get(uid);
          const pendingCount = primary ? (pendingByHouse.get(primary.houseId) ?? 0) : 0;

          let title: string;
          let body: string;
          let icon: string;
          let url: string;
          let type: string;

          if (pendingCount > 0 && primary) {
            // TEM itens pendentes → lembra das compras (rotaciona + pose).
            const plural = pendingCount === 1 ? "item" : "itens";
            const ph = pick(PENDING_PHRASES, dayOfYear + userOffset(uid));
            title = ph.title;
            body = ph.body(pendingCount, plural, primary.name);
            icon = ph.pose;
            url = "/lista";
            type = "reminder";
          } else {
            // SEM itens → nudge de despensa (sexta/domingo têm variações).
            const ph =
              dayOfWeek === 5 ? NUDGE_FRIDAY
              : dayOfWeek === 0 ? NUDGE_SUNDAY
              : pick(NUDGE_PHRASES, dayOfYear + userOffset(uid));
            title = ph.title;
            body = ph.body;
            icon = ph.pose;
            url = "/despensa";
            type = "nudge";
          }

          // Grava ANTES de enviar (dedup entre execuções + histórico in-app).
          if (primary) {
            await admin.from("notifications").insert({
              user_id: uid,
              house_id: primary.houseId,
              type,
              title,
              body,
              ...(pendingCount > 0 ? { data: { items_count: pendingCount } } : {}),
            });
          }
          notifiedToday.add(uid);
          await sendPushToUser(admin, uid, {
            title,
            body,
            icon,
            url,
            tag: `nudge-${uid}-${dayKey}`,
          });
          nudgesSent++;
        }
      }
    } catch (err) {
      console.error("[Cron] Erro na Parte 2 (nudge):", err);
    }
  }

  return NextResponse.json({ message: "OK", reminders: remindersSent, nudges: nudgesSent });
}
