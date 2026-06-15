import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { sendDailyNotifReport } from "@/lib/emails";

/**
 * Cron (Vercel Pro) — roda a cada 15 minutos.
 *
 * PARTE 1 (PAGO) — Lembrete de compras no HORÁRIO QUE O USUÁRIO ESCOLHEU
 *   (reminder_time): "você tem N itens pra comprar". Só casas com plano válido +
 *   itens pendentes. Frase ROTACIONA (não repete dia a dia).
 *
 * PARTE 2 (GRÁTIS) — Nudge diário de re-engajamento (estilo Duolingo), 1x/dia
 *   na janela das 18h, pra TODO usuário com push (ativo nos últimos 30d). É o
 *   nosso DIFERENCIAL → SEMPRE vai, mesmo pra quem já tem lembrete agendado ou
 *   recebeu evento de item hoje. Conteúdo escolhido sem redundância:
 *     • tem lembrete agendado → nudge AMIGÁVEL de despensa (já é avisado dos
 *       itens no horário dele).
 *     • sem lembrete agendado E tem itens → "tem N pra comprar" (não esquece a
 *       lista).
 *     • sem itens → nudge de despensa (confere o que tá acabando).
 *
 * Regra: o lembrete agendado e o nudge são INDEPENDENTES (cada um só evita
 * repetir a si mesmo no dia). Logo um usuário pode receber 2 notificações
 * intencionais/dia (o lembrete que ELE marcou + nosso nudge) — de propósito,
 * pois ele pode perder/esquecer a que marcou. item_change (tempo real) não
 * bloqueia nenhum dos dois.
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
  { title: "Tem item esperando na lista 👀", body: (n, p, c) => `Você marcou ${n} ${p} pra comprar na "${c}".`, pose: POSE.alerta },
  { title: "Psiu, lembra das compras? 🙋", body: (n, p, c) => `Tem ${n} ${p} te esperando na lista da "${c}".`, pose: POSE.acenando },
  { title: "Antes que esqueça… 📌", body: (n, p, c) => `Você tem ${n} ${p} pra comprar na "${c}".`, pose: POSE.placa },
  { title: "Sua lista tá te chamando 🛒", body: (n, p, c) => `Tem ${n} ${p} aguardando compra na "${c}".`, pose: POSE.buscando },
];

// NUDGE DE ENGAJAMENTO — re-engajamento pra quem NÃO tem itens pendentes.
// Copy NEUTRO de propósito: serve pra QUALQUER local (Casa/Apê/Empresa/Praia…) e
// pra quem tem vários locais — sem citar "casa"/"família"/"despensa", que soariam
// errado pra quem escolheu "Empresa". O local só é citado no aviso de itens.
const NUDGE_PHRASES: { title: string; body: string; pose: string }[] = [
  { title: "Dá uma olhada no que tá acabando 👀", body: "Marque os itens no fim pra não faltar nada.", pose: POSE.buscando },
  { title: "Tá faltando alguma coisa? 🛒", body: "Deixa marcado pra não esquecer no mercado.", pose: POSE.buscando },
  { title: "Bora manter tudo abastecido? 🛒", body: "Confira seu estoque em 10 segundos.", pose: POSE.placa },
  { title: "Café, arroz, sabão... 🤔", body: "Se tá no fim, deixa anotado no Acabou?", pose: POSE.buscando },
  { title: "Antes de ir ao mercado 📝", body: "Marque o que falta — a lista se monta sozinha.", pose: POSE.placa },
  { title: "10 segundinhos agora 🙈", body: "Evite o 'ah, esqueci!' na hora das compras.", pose: POSE.acenando },
  { title: "Conta com a gente pra não esquecer 💚", body: "Marque o que estiver faltando.", pose: POSE.feliz },
  { title: "Estoque em dia = vida tranquila 😌", body: "Dá uma conferida rapidinho?", pose: POSE.feliz },
  { title: "O que será que tá acabando? 👀", body: "Confira rapidinho sua lista.", pose: POSE.buscando },
  { title: "Nada pior que ver que faltou 😅", body: "Confira antes de sair pro mercado!", pose: POSE.alerta },
];
const NUDGE_FRIDAY = { title: "Fim de semana chegando! 🛒", body: "Vê o que falta antes das compras.", pose: POSE.comemorando };
const NUDGE_SUNDAY = { title: "Bora começar a semana abastecido? 🗓️", body: "Confira o estoque e monte a lista.", pose: POSE.feliz };

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

  // Dedup POR TIPO (independentes): o lembrete agendado e o nudge diário podem
  // coexistir no mesmo dia (o usuário pode perder/esquecer o que marcou, então o
  // nudge amigável — nosso diferencial — SEMPRE vai). Cada um só evita repetir a
  // SI MESMO no dia. Eventos em tempo real (item_change) NÃO bloqueiam nenhum.
  const remindedToday = new Set<string>(); // já recebeu o lembrete agendado hoje
  const nudgedToday = new Set<string>();   // já recebeu o nudge diário hoje

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

      // Já recebeu O LEMBRETE AGENDADO hoje? (evita lembrete duplo p/ quem tem
      // várias casas — mas NÃO bloqueia o nudge nem é bloqueado por item_change.)
      if (remindedToday.has(house.owner_id)) continue;
      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", house.owner_id)
        .eq("type", "reminder")
        .gte("created_at", todayStartISO)
        .limit(1);
      if (existing && existing.length > 0) {
        remindedToday.add(house.owner_id);
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
      remindedToday.add(house.owner_id);
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
      // Push subscriptions — PAGINADO. O PostgREST corta em 1000 linhas; sem
      // paginar, acima de 1000 dispositivos os usuários PARAM de receber o nudge
      // EM SILÊNCIO (é por dispositivo → dedup por user_id). Crítico p/ escalar.
      const subUserSet = new Set<string>();
      for (let i = 0; i < 500; i++) {
        const { data, error } = await admin
          .from("push_subscriptions")
          .select("user_id")
          .range(i * 1000, i * 1000 + 999);
        if (error || !data || data.length === 0) break;
        for (const s of data as { user_id: string }[]) subUserSet.add(s.user_id);
        if (data.length < 1000) break;
        // Teto de 500k linhas (500 páginas). Se um dia bater aqui, é hora de
        // migrar pra processamento em lotes/fila (não dá pra carregar tudo numa
        // execução). Loga em vez de cortar em silêncio.
        if (i === 499) console.warn("[Cron] push_subscriptions atingiu o teto de paginação (500k) — aumentar/migrar pra lotes.");
      }
      const pushUserIds = [...subUserSet];

      if (pushUserIds.length > 0) {
        const CHUNK = 300; // limita o tamanho de cada .in() (URL/performance)

        // Local PRIMÁRIO de cada usuário — vindo de house_members, então cobre
        // DONO **e** CONVIDADO (antes só donos tinham primário → convidados
        // ficavam sem registro e podiam levar nudge duplicado). Determinístico:
        // o local de MENOR id vira o primário. Guardamos se o usuário é o DONO
        // (só o dono recebe a Parte 1).
        const userPrimary = new Map<
          string,
          { houseId: string; name: string; reminderEnabled: boolean; isOwner: boolean }
        >();
        for (let i = 0; i < pushUserIds.length; i += CHUNK) {
          const chunk = pushUserIds.slice(i, i + CHUNK);
          const { data: mems } = await admin
            .from("house_members")
            .select("user_id, house:houses(id, name, reminder_enabled, owner_id)")
            .eq("status", "active")
            .in("user_id", chunk);
          for (const m of (mems ?? []) as any[]) {
            const h = Array.isArray(m.house) ? m.house[0] : m.house;
            if (!h?.id) continue;
            const cur = userPrimary.get(m.user_id);
            if (!cur || String(h.id) < String(cur.houseId)) {
              userPrimary.set(m.user_id, {
                houseId: h.id,
                name: h.name,
                reminderEnabled: !!h.reminder_enabled,
                isOwner: h.owner_id === m.user_id,
              });
            }
          }
        }

        // Itens pendentes por local primário (chunked) → decide o conteúdo.
        const primaryHouseIds = [...new Set([...userPrimary.values()].map((v) => v.houseId))];
        const pendingByHouse = new Map<string, number>();
        for (let i = 0; i < primaryHouseIds.length; i += CHUNK) {
          const chunk = primaryHouseIds.slice(i, i + CHUNK);
          const { data: pendingItems } = await admin
            .from("items")
            .select("house_id")
            .in("house_id", chunk)
            .in("status", ["acabou", "acabando", "comprar"]);
          for (const it of (pendingItems ?? []) as { house_id: string }[]) {
            pendingByHouse.set(it.house_id, (pendingByHouse.get(it.house_id) ?? 0) + 1);
          }
        }

        // Última atividade (chunked).
        const lastActive = new Map<string, string | null>();
        for (let i = 0; i < pushUserIds.length; i += CHUNK) {
          const chunk = pushUserIds.slice(i, i + CHUNK);
          const { data: profs } = await admin
            .from("profiles")
            .select("user_id, last_active_at")
            .in("user_id", chunk);
          for (const p of (profs ?? []) as { user_id: string; last_active_at: string | null }[]) {
            lastActive.set(p.user_id, p.last_active_at);
          }
        }

        // Quem JÁ recebeu O NUDGE hoje (idempotência se o cron repetir na janela).
        // NÃO bloqueamos por lembrete agendado nem por item_change — o nudge
        // amigável é o diferencial e SEMPRE vai. Chunked.
        for (let i = 0; i < pushUserIds.length; i += CHUNK) {
          const chunk = pushUserIds.slice(i, i + CHUNK);
          const { data: nudgesToday } = await admin
            .from("notifications")
            .select("user_id")
            .eq("type", "nudge")
            .gte("created_at", todayStartISO)
            .in("user_id", chunk);
          for (const n of nudgesToday ?? []) nudgedToday.add((n as { user_id: string }).user_id);
        }

        const MAX_INACTIVE = 30 * 24 * 60 * 60 * 1000;

        for (const uid of pushUserIds) {
          if (nudgedToday.has(uid)) continue;          // não repete o nudge no dia

          const primary = userPrimary.get(uid);
          if (!primary) continue;                      // sem local nenhum → nada a nudar

          // MODELO DUOLINGO: nudge pra TODOS com push, mesmo quem abriu hoje.
          // Só pula quem sumiu há +30d.
          const la = lastActive.get(uid) ?? null;
          if (la && now - new Date(la).getTime() > MAX_INACTIVE) continue;

          const pendingCount = pendingByHouse.get(primary.houseId) ?? 0;
          // "Coberto" pelo lembrete agendado SÓ se for o DONO (membro não recebe
          // a Parte 1) E o lembrete estiver ligado → aí manda o nudge amigável.
          const coveredByReminder = primary.isOwner && primary.reminderEnabled;

          let title: string;
          let body: string;
          let icon: string;
          let url: string;
          let itemsCount: number | null = null;

          if (pendingCount > 0 && !coveredByReminder) {
            // Tem itens e NÃO é avisado pela Parte 1 → lembra das compras.
            const plural = pendingCount === 1 ? "item" : "itens";
            const ph = pick(PENDING_PHRASES, dayOfYear + userOffset(uid));
            title = ph.title;
            body = ph.body(pendingCount, plural, primary.name);
            icon = ph.pose;
            url = "/lista";
            itemsCount = pendingCount;
          } else {
            // Nudge de engajamento (sexta/domingo têm variações).
            const ph =
              dayOfWeek === 5 ? NUDGE_FRIDAY
              : dayOfWeek === 0 ? NUDGE_SUNDAY
              : pick(NUDGE_PHRASES, dayOfYear + userOffset(uid));
            title = ph.title;
            body = ph.body;
            icon = ph.pose;
            url = "/despensa";
          }

          // Grava ANTES de enviar (dedup entre execuções + histórico in-app).
          // SEMPRE type "nudge" → o dedup acima cobre os dois formatos. Se a
          // gravação falhar (ex.: constraint), NÃO bloqueia a ENTREGA — o push é
          // o que importa; só loga. (A dedup via DB fica degradada até o registro
          // voltar a gravar — risco baixo: a janela das 18h roda 1x/dia.)
          const { error: insErr } = await admin.from("notifications").insert({
            user_id: uid,
            house_id: primary.houseId,
            type: "nudge",
            title,
            body,
            ...(itemsCount != null ? { data: { items_count: itemsCount } } : {}),
          });
          if (insErr) console.error("[Cron] Falha ao gravar nudge (segue enviando):", uid, insErr.message);
          nudgedToday.add(uid);
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

      // ── RELATÓRIO DIÁRIO pro admin (1x/dia, logo após o nudge das 18h) ──
      // Em try próprio: nunca afeta a entrega (o nudge já foi acima). Dá pro
      // Anderson acompanhar a saúde das notificações sozinho, todo dia.
      try {
        const { count: totalContas } = await admin
          .from("profiles")
          .select("user_id", { count: "exact", head: true });
        const { count: ativos30d } = await admin
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .gte("last_active_at", new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString());
        const total = totalContas ?? 0;
        const comPush = pushUserIds.length;
        await sendDailyNotifReport({
          totalContas: total,
          comPush,
          semPush: Math.max(0, total - comPush),
          coberturaPct: total > 0 ? Math.round((comPush / total) * 100) : 0,
          ativos30d: ativos30d ?? 0,
          nudgesHoje: nudgesSent,
          lembretesHoje: remindersSent,
        });
      } catch (err) {
        console.error("[Cron] Erro no relatório diário:", err);
      }
    } catch (err) {
      console.error("[Cron] Erro na Parte 2 (nudge):", err);
    }
  }

  return NextResponse.json({ message: "OK", reminders: remindersSent, nudges: nudgesSent });
}
