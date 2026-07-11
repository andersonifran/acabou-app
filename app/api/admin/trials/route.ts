import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendAdminLeakAlert, sendPushReengageEmail, sendWinbackEmail } from "@/lib/emails";
import { emailTrialHash, phoneTrialHash } from "@/lib/trial-email";
import { sendPushNotification } from "@/lib/push";

// =============================================================
// Ferramenta de ADMIN (só Anderson) — auditoria + correção de trials.
//
//   GET  /api/admin/trials            → RELATÓRIO de auditoria (clica e vê):
//        conta trials/pagantes ativos e LISTA "vazamentos" (casas com plano
//        pago/trial que JÁ EXPIROU mas não foram congeladas — não deveria ter
//        nenhuma; se aparecer, é alerta).
//
//   GET  /api/admin/trials?acao=estender14  → CORREÇÃO ÚNICA: dá +7 dias aos
//        trials ATIVOS antigos (os de 7 dias) pra equiparar aos 14. Seguro e
//        idempotente: só pega trials que expiram em <8 dias (os antigos); ao
//        rodar de novo, os já-estendidos expiram em ~14d e ficam de fora.
//
// Acesso: só e-mails admin logados. NÃO mexe em pago, free nem expirado.
// =============================================================

export const runtime = "nodejs";

// E-mails que podem usar esta ferramenta (ajuste se o seu login do app for outro).
const ADMIN_EMAILS = [
  "anderson.ifran15@gmail.com",
  "anderson.ifran26@gmail.com",
];

async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) return null;
  return user;
}

export async function GET(request: NextRequest) {
  // Acesso: (a) admin logado por e-mail, OU (b) chave secreta na URL (mesma do
  // RTDN) — permite rodar a auditoria/correção de forma controlada via servidor.
  const key = request.nextUrl.searchParams.get("key");
  const viaSecret = !!key && !!process.env.PLAY_RTDN_SECRET && key === process.env.PLAY_RTDN_SECRET;
  if (!viaSecret) {
    const user = await getAdmin();
    if (!user) {
      return NextResponse.json(
        { error: "Acesso só pra admin (logado com o e-mail de admin) ou com a chave." },
        { status: 403 }
      );
    }
  }

  const admin = createAdminClient();
  const nowISO = new Date().toISOString();
  const acao = request.nextUrl.searchParams.get("acao");

  // ── CORREÇÃO: estender +7 dias os trials antigos (de 7 dias) ──
  if (acao === "estender14") {
    const limite = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();
    const { data: alvos } = await admin
      .from("houses")
      .select("id, plan_expires_at")
      .eq("plan_status", "trialing")
      .gt("plan_expires_at", nowISO)
      .lt("plan_expires_at", limite);

    let estendidos = 0;
    for (const h of alvos ?? []) {
      const novo = new Date(
        new Date(h.plan_expires_at as string).getTime() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const { error } = await admin
        .from("houses")
        .update({ plan_expires_at: novo })
        .eq("id", h.id);
      if (!error) estendidos++;
    }
    return NextResponse.json({
      ok: true,
      acao: "estender14",
      trials_antigos_encontrados: (alvos ?? []).length,
      estendidos,
      message: `${estendidos} trial(s) antigo(s) estendido(s) +7 dias (agora 14 no total).`,
    });
  }

  // ── LIMPEZA: congela na hora as casas vencidas (= o que o cron faz às 6h) ──
  if (acao === "congelar_vencidos") {
    const { data: vencidas } = await admin
      .from("houses")
      .select("id")
      .neq("plan", "free")
      .lt("plan_expires_at", nowISO)
      .neq("plan_status", "inactive");

    let congeladas = 0;
    for (const h of vencidas ?? []) {
      await admin.from("houses").update({ plan_status: "inactive" }).eq("id", h.id);
      await admin
        .from("subscriptions")
        .update({ status: "inactive", updated_at: nowISO })
        .eq("house_id", h.id as string)
        .eq("status", "active");
      // Congela convidados (não-donos) — acesso compartilhado é premium.
      await admin
        .from("house_members")
        .update({ status: "frozen" })
        .eq("house_id", h.id as string)
        .neq("role", "owner")
        .eq("status", "active");
      congeladas++;
    }
    return NextResponse.json({
      ok: true,
      acao: "congelar_vencidos",
      congeladas,
      message: `${congeladas} casa(s) vencida(s) congelada(s) + convidados bloqueados.`,
    });
  }

  // ── TESTE: dispara um e-mail de alerta de exemplo pros admins ──
  if (acao === "testar_alerta") {
    await sendAdminLeakAlert(
      [{ name: "Casa de Teste", plan: "Mensal", plan_expires_at: nowISO }],
      true
    );
    return NextResponse.json({
      ok: true,
      acao: "testar_alerta",
      message: "E-mail de teste enviado para anderson.ifran15@ e anderson.ifran26@. Confira a caixa de entrada (e o spam).",
    });
  }

  // ── BACKFILL: marca os usuários ATUAIS como "já usaram trial" (por email) ──
  // Rode UMA vez após a migration 2026-06-09_trial_grants. Sem isso, um usuário
  // EXISTENTE poderia farmar trial excluindo + recriando com o mesmo email.
  // Idempotente (upsert ignora duplicados); pode rodar de novo sem problema.
  if (acao === "backfill_trial_grants") {
    // E-mail E TELEFONE (2ª camada anti-farm, 02/07): quem já está na base fica
    // marcado pelos dois fingerprints — recriar conta com "outro e-mail" mas o
    // mesmo WhatsApp também NÃO ganha trial de novo.
    const { data: profs } = await admin
      .from("profiles")
      .select("email, phone");
    const emailHashes = new Set<string>();
    const phoneHashes = new Set<string>();
    for (const p of profs ?? []) {
      const em = ((p as any).email || "").trim();
      if (em) emailHashes.add(emailTrialHash(em));
      const ph = phoneTrialHash((p as any).phone);
      if (ph) phoneHashes.add(ph);
    }
    const rows = [...emailHashes, ...phoneHashes].map((email_hash) => ({ email_hash }));
    let gravados = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await admin
        .from("trial_grants")
        .upsert(batch, { onConflict: "email_hash", ignoreDuplicates: true });
      if (!error) gravados += batch.length;
    }
    return NextResponse.json({
      ok: true,
      acao: "backfill_trial_grants",
      perfis: (profs ?? []).length,
      emails_unicos_marcados: emailHashes.size,
      telefones_unicos_marcados: phoneHashes.size,
      gravados,
      message: `Backfill: ${emailHashes.size} e-mail(s) + ${phoneHashes.size} telefone(s) marcados como já-usaram-trial.`,
    });
  }

  // ── CHECK: quantos usuários NÃO confirmaram o email ──
  // Segurança ANTES de ligar "Confirm email": se algum atual não estiver
  // confirmado, ligar o trancaria. (Quando estava OFF, o Supabase auto-confirma,
  // então o esperado é ZERO não-confirmados.)
  if (acao === "check_confirmados") {
    const users: any[] = [];
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data) break;
      const batch = data.users ?? [];
      users.push(...batch);
      if (batch.length < 200) break;
    }
    const naoConf = users.filter((u) => !u.email_confirmed_at && !u.confirmed_at);
    return NextResponse.json({
      ok: true,
      acao: "check_confirmados",
      total: users.length,
      confirmados: users.length - naoConf.length,
      nao_confirmados: naoConf.length,
      exemplos_nao_confirmados: naoConf.slice(0, 20).map((u) => u.email || u.id),
      message:
        naoConf.length === 0
          ? "✅ TODOS confirmados — pode ligar o Confirm email sem trancar ninguém."
          : `⚠️ ${naoConf.length} conta(s) NÃO confirmada(s) — marcar como confirmadas ANTES de ligar.`,
    });
  }

  // ── DIAGNÓSTICO: cobertura das notificações push (quem RECEBE o nudge) ──
  // Mede o alcance REAL do nudge diário: quantos têm push ativo, quantos estão
  // ativos (last_active_at), quantos seriam alcançados hoje, e quantos nudges
  // realmente saíram nas últimas 24/48h. Ajuda a achar quem NÃO recebe e por quê.
  if (acao === "check_push") {
    const DAY = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const d30 = new Date(nowMs - 30 * DAY).toISOString();
    const d7 = new Date(nowMs - 7 * DAY).toISOString();
    const h24 = new Date(nowMs - DAY).toISOString();
    const h48 = new Date(nowMs - 2 * DAY).toISOString();

    // Perfis (id + última atividade). Paginado p/ aguentar a base crescer.
    const profs: { user_id: string; last_active_at: string | null }[] = [];
    for (let i = 0; i < 50; i++) {
      const { data, error } = await admin
        .from("profiles")
        .select("user_id, last_active_at")
        .range(i * 1000, i * 1000 + 999);
      if (error || !data || data.length === 0) break;
      profs.push(...(data as any));
      if (data.length < 1000) break;
    }

    // Quem tem ao menos uma subscription de push.
    const subUserIds = new Set<string>();
    let totalSubs = 0;
    for (let i = 0; i < 50; i++) {
      const { data, error } = await admin
        .from("push_subscriptions")
        .select("user_id")
        .range(i * 1000, i * 1000 + 999);
      if (error || !data || data.length === 0) break;
      for (const s of data as any) subUserIds.add(s.user_id);
      totalSubs += data.length;
      if (data.length < 1000) break;
    }

    const isActive = (la: string | null, sinceISO: string) =>
      !!la && new Date(la).getTime() >= new Date(sinceISO).getTime();

    const comPush = profs.filter((p) => subUserIds.has(p.user_id));
    const semPush = profs.filter((p) => !subUserIds.has(p.user_id));
    const alcancaveis = comPush.filter((p) => isActive(p.last_active_at, d30)); // recebem o nudge
    const pushInativos = comPush.filter((p) => !isActive(p.last_active_at, d30)); // pulados (+30d)

    // Nudges realmente enviados (registro = enviado): últimas 24h e 24–48h.
    const { data: nud24 } = await admin
      .from("notifications")
      .select("user_id")
      .eq("type", "nudge")
      .gte("created_at", h24);
    const { data: nud48 } = await admin
      .from("notifications")
      .select("user_id")
      .eq("type", "nudge")
      .gte("created_at", h48)
      .lt("created_at", h24);
    const recebeuOntem = new Set((nud24 ?? []).map((n: any) => n.user_id));
    const recebeuAnteontem = new Set((nud48 ?? []).map((n: any) => n.user_id));

    // Quem DEVERIA receber mas NÃO recebeu nas últimas 24h (investigar).
    const alcancaveisSemNudge = alcancaveis.filter((p) => !recebeuOntem.has(p.user_id));

    const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

    return NextResponse.json({
      ok: true,
      acao: "check_push",
      gerado_em: nowISO,
      base: {
        total_contas: profs.length,
        com_push_ativo: comPush.length,
        sem_push: semPush.length,
        cobertura_push_pct: pct(comPush.length, profs.length),
        total_subscriptions: totalSubs,
      },
      atividade: {
        ativos_7d: profs.filter((p) => isActive(p.last_active_at, d7)).length,
        ativos_30d: profs.filter((p) => isActive(p.last_active_at, d30)).length,
      },
      alcance_do_nudge: {
        alcancaveis_hoje: alcancaveis.length, // com push + ativo nos últimos 30d
        pulados_por_inatividade_30d: pushInativos.length,
        receberam_nudge_ultimas_24h: recebeuOntem.size,
        receberam_nudge_24_48h: recebeuAnteontem.size,
        alcancaveis_que_nao_receberam_24h: alcancaveisSemNudge.length,
      },
      diagnostico:
        comPush.length === 0
          ? "⚠️ NINGUÉM tem push ativo — verificar VAPID/permissões."
          : recebeuOntem.size === 0
          ? "⚠️ 0 nudges nas últimas 24h — o cron pode não ter rodado na janela das 18h, ou ninguém elegível. Confira os logs do cron."
          : `✅ ${recebeuOntem.size} usuário(s) receberam o nudge nas últimas 24h. ${semPush.length} ainda SEM push (não recebem até ativarem). ${pushInativos.length} pulado(s) por inatividade (+30d).`,
      sem_push_exemplos: semPush.slice(0, 25).map((p) => p.user_id),
    });
  }

  // ── DEBUG de push de UM usuário (por email) — diagnóstico de aparelho ──
  // Lista as inscrições do usuário, opcionalmente ENVIA um teste em cada uma e
  // mostra o status real (entregue à FCM / morta / falhou). Também confirma na
  // prática se a tabela aceita type='nudge'. Uso: ?acao=push_debug&email=...&send=1
  if (acao === "push_debug") {
    const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Passe ?email=<email do usuário>." }, { status: 400 });
    }
    const { data: prof } = await admin
      .from("profiles")
      .select("user_id, full_name, email")
      .ilike("email", email)
      .maybeSingle();
    if (!prof) {
      return NextResponse.json({ ok: false, error: `Nenhum perfil com email ${email}.` }, { status: 404 });
    }
    const uid = (prof as any).user_id as string;

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    const wantSend = request.nextUrl.searchParams.get("send") === "1";
    const detalhe = [];
    for (const s of (subs ?? []) as any[]) {
      let host = "";
      try { host = new URL(s.endpoint).host; } catch {}
      let envio: string | null = null;
      if (wantSend) {
        const r = await sendPushNotification(
          { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
          {
            title: "Teste do Sacolino 🔧",
            body: "Diagnóstico de notificação — se chegou, tá tudo certo! 💚",
            icon: "/mascote/sacolino-acenando.png",
            url: "/home",
            tag: "diag-push",
          }
        );
        envio = r.success ? "entregue_a_fcm(201)" : r.expired ? "morta(410/404)" : "falhou";
      }
      detalhe.push({
        host,
        endpoint_fim: String(s.endpoint).slice(-14),
        created_at: s.created_at,
        envio,
      });
    }

    // Confirma na prática se a tabela aceita type='nudge' (insere + apaga).
    let nudge_type_aceito: boolean | null = null;
    let nudge_type_erro: string | null = null;
    const { data: anyHouse } = await admin
      .from("house_members")
      .select("house_id")
      .eq("user_id", uid)
      .limit(1)
      .maybeSingle();
    if ((anyHouse as any)?.house_id) {
      const { data: ins, error: nErr } = await admin
        .from("notifications")
        .insert({ user_id: uid, house_id: (anyHouse as any).house_id, type: "nudge", title: "__diag__", body: "__diag__" })
        .select("id")
        .maybeSingle();
      if (nErr) {
        nudge_type_aceito = false;
        nudge_type_erro = nErr.message;
      } else {
        nudge_type_aceito = true;
        if ((ins as any)?.id) await admin.from("notifications").delete().eq("id", (ins as any).id);
      }
    }

    return NextResponse.json({
      ok: true,
      acao: "push_debug",
      usuario: { email: (prof as any).email, nome: (prof as any).full_name, user_id: uid },
      inscricoes: (subs ?? []).length,
      detalhe,
      nudge_type_aceito,
      nudge_type_erro,
      dica:
        (subs ?? []).length === 0
          ? "Sem inscrição salva → o aparelho não está inscrito no servidor (reative no app)."
          : wantSend
          ? "Se 'entregue_a_fcm(201)' e mesmo assim não aparece no aparelho → é permissão/canal do Android (reabrir permissão de notificação do app). 'morta' → inscrição obsoleta."
          : "Adicione &send=1 pra enviar um teste em cada inscrição e ver o status real.",
    });
  }

  // ── RECONQUISTA por e-mail: "ligue as notificações" (push desligado) ──
  // Alvo: tem e-mail + SEM push + ativo nos últimos N dias + nunca recebeu este
  // e-mail (push_reengage_at null). dry (padrão) = só conta/preview; send=1 =
  // envia de verdade (em lotes pra não estourar timeout/rate). Idempotente:
  // marca push_reengage_at após enviar → nunca manda 2x.
  if (acao === "reengage_push") {
    // Modo TESTE: ?acao=reengage_push&test=seu@email.com → manda UM e-mail real
    // pra você revisar (sem checar elegibilidade, sem marcar nada). Pra aprovar
    // o visual antes de disparar pros usuários.
    const testEmail = request.nextUrl.searchParams.get("test");
    if (testEmail) {
      try {
        await sendPushReengageEmail(testEmail, "Anderson");
        return NextResponse.json({
          ok: true,
          acao: "reengage_push",
          modo: "teste",
          enviado_para: testEmail,
          message: "E-mail de TESTE enviado — confira a caixa de entrada (e o spam).",
        });
      } catch (e: any) {
        return NextResponse.json({ ok: false, erro: e?.message || "falha no envio" }, { status: 500 });
      }
    }

    const dias = Math.max(1, parseInt(request.nextUrl.searchParams.get("dias") || "45", 10));
    const lote = Math.max(1, Math.min(60, parseInt(request.nextUrl.searchParams.get("lote") || "30", 10)));
    const enviar = request.nextUrl.searchParams.get("send") === "1";
    const ativoDesde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).getTime();

    // Perfis (paginado).
    const profs: { user_id: string; email: string | null; full_name: string | null; last_active_at: string | null; push_reengage_at: string | null }[] = [];
    for (let i = 0; i < 50; i++) {
      const { data, error } = await admin
        .from("profiles")
        .select("user_id, email, full_name, last_active_at, push_reengage_at")
        .range(i * 1000, i * 1000 + 999);
      if (error || !data || data.length === 0) break;
      profs.push(...(data as any));
      if (data.length < 1000) break;
    }

    // Quem TEM push (paginado) → excluir.
    const comPush = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const { data, error } = await admin
        .from("push_subscriptions")
        .select("user_id")
        .range(i * 1000, i * 1000 + 999);
      if (error || !data || data.length === 0) break;
      for (const s of data as any) comPush.add(s.user_id);
      if (data.length < 1000) break;
    }

    const elegiveis = profs.filter((p) => {
      if (!p.email) return false;
      if (comPush.has(p.user_id)) return false;          // já tem notificação
      if (p.push_reengage_at) return false;              // já recebeu este e-mail
      if (!p.last_active_at) return false;               // nunca usou → pula
      return new Date(p.last_active_at).getTime() >= ativoDesde; // ativo recente
    });

    if (!enviar) {
      return NextResponse.json({
        ok: true,
        acao: "reengage_push",
        modo: "dry_run",
        criterio: `sem push + ativo nos últimos ${dias} dias + nunca recebeu`,
        elegiveis: elegiveis.length,
        exemplos: elegiveis.slice(0, 15).map((p) => p.email),
        como_enviar: `Adicione &send=1 pra enviar (lotes de ${lote}). Ex.: ?acao=reengage_push&send=1`,
      });
    }

    // ENVIO (lote) — sequencial pra respeitar rate-limit do Resend.
    const alvo = elegiveis.slice(0, lote);
    let enviados = 0;
    const falhas: string[] = [];
    for (const p of alvo) {
      try {
        await sendPushReengageEmail(p.email as string, p.full_name || "");
        await admin
          .from("profiles")
          .update({ push_reengage_at: nowISO })
          .eq("user_id", p.user_id);
        enviados++;
      } catch (e: any) {
        falhas.push(`${p.email}: ${e?.message || "erro"}`);
      }
    }

    return NextResponse.json({
      ok: true,
      acao: "reengage_push",
      modo: "envio",
      elegiveis_total: elegiveis.length,
      enviados,
      falhas: falhas.length,
      falhas_detalhe: falhas.slice(0, 10),
      restantes: elegiveis.length - enviados,
      message:
        elegiveis.length - enviados > 0
          ? `Enviados ${enviados}. Ainda faltam ${elegiveis.length - enviados} — rode de novo pra mandar o próximo lote.`
          : `Enviados ${enviados}. Todos os elegíveis foram contatados. ✅`,
    });
  }

  // ── WIN-BACK: +7 dias de volta SÓ pros congelados que pegaram só 7 dias ──
  // Anti-farm BLINDADO: UMA vez por pessoa, marcado em profiles.winback_granted_at
  // + winback_grants (hash, sobrevive a apagar/recriar). Quem recebeu e não
  // assinou NUNCA mais recebe. Os +7d são por DATA → o cron recongela depois
  // (pay-or-frozen). Segmento: trial de ~7 dias (os de 14 ficam de fora) + nunca
  // pagou. test=email → 1 teste; dry (padrão) → só conta/preview; send=1 → executa.
  if (acao === "reengage_winback") {
    const testEmail = request.nextUrl.searchParams.get("test");
    if (testEmail) {
      try {
        await sendWinbackEmail(testEmail, "Anderson");
        return NextResponse.json({ ok: true, acao: "reengage_winback", modo: "teste", enviado_para: testEmail, message: "E-mail de TESTE enviado — confira a caixa (e o spam). NÃO concedeu nada." });
      } catch (e: any) {
        return NextResponse.json({ ok: false, erro: e?.message || "falha no envio" }, { status: 500 });
      }
    }

    const SETE = 24 * 60 * 60 * 1000;
    const lote = Math.max(1, Math.min(60, parseInt(request.nextUrl.searchParams.get("lote") || "30", 10)));
    const maxTrialDias = Math.max(1, parseInt(request.nextUrl.searchParams.get("maxdias") || "9", 10)); // ~7d entra; 14d fica de fora
    const enviar = request.nextUrl.searchParams.get("send") === "1";

    // 1) Casas NÃO-free e JÁ vencidas (trial/plano que expirou = congelado por data).
    const casas: { id: string; owner_id: string; plan_expires_at: string | null; created_at: string }[] = [];
    for (let i = 0; i < 50; i++) {
      const { data, error } = await admin
        .from("houses")
        .select("id, owner_id, plan_expires_at, created_at")
        .neq("plan", "free")
        .lt("plan_expires_at", nowISO)
        .range(i * 1000, i * 1000 + 999);
      if (error || !data || data.length === 0) break;
      casas.push(...(data as any));
      if (data.length < 1000) break;
    }

    // 2) Casas que JÁ tiveram assinatura (pagaram) → EXCLUIR.
    const casasPagaram = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const { data, error } = await admin.from("subscriptions").select("house_id").range(i * 1000, i * 1000 + 999);
      if (error || !data || data.length === 0) break;
      for (const s of data as any) if (s.house_id) casasPagaram.add(s.house_id as string);
      if (data.length < 1000) break;
    }

    // 3) Hashes que JÁ receberam o win-back (anti apagar+recriar) → EXCLUIR.
    const hashesUsados = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const { data, error } = await admin.from("winback_grants").select("email_hash").range(i * 1000, i * 1000 + 999);
      if (error || !data || data.length === 0) break;
      for (const g of data as any) hashesUsados.add(g.email_hash as string);
      if (data.length < 1000) break;
    }

    // 4) Só casas com trial de ~7 dias (não pagou) — os de 14 dias ficam de fora.
    const candidatas = casas.filter((h) => {
      if (casasPagaram.has(h.id)) return false;
      if (!h.plan_expires_at || !h.created_at) return false;
      const dias = (new Date(h.plan_expires_at).getTime() - new Date(h.created_at).getTime()) / SETE;
      return dias > 0 && dias <= maxTrialDias;
    });

    // 5) Donos elegíveis: perfil com e-mail, winback_granted_at null, hash livre.
    const elegiveis: { user_id: string; house_id: string; email: string; full_name: string | null; trial_dias: number; venceu_em: string }[] = [];
    for (const h of candidatas) {
      const { data: prof } = await admin
        .from("profiles")
        .select("user_id, email, full_name, winback_granted_at")
        .eq("user_id", h.owner_id)
        .maybeSingle();
      const p = prof as any;
      if (!p || !p.email) continue;
      if (p.winback_granted_at) continue;                       // já recebeu o win-back
      if (hashesUsados.has(emailTrialHash(p.email))) continue;  // recriou conta → bloqueado
      elegiveis.push({
        user_id: p.user_id, house_id: h.id, email: p.email, full_name: p.full_name ?? null,
        trial_dias: Math.round((new Date(h.plan_expires_at as string).getTime() - new Date(h.created_at).getTime()) / SETE),
        venceu_em: (h.plan_expires_at as string).slice(0, 10),
      });
    }

    if (!enviar) {
      return NextResponse.json({
        ok: true, acao: "reengage_winback", modo: "dry_run",
        criterio: `congelado + nunca pagou + trial de ~${maxTrialDias}d ou menos (os de 14 ficam de fora) + nunca recebeu win-back`,
        elegiveis: elegiveis.length,
        detalhe: elegiveis.slice(0, 40).map((e) => ({ email: e.email, trial_dias: e.trial_dias, venceu_em: e.venceu_em })),
        como_enviar: "Teste 1 e-mail: &test=seu@email.com. Depois execute: &send=1 (concede +7d e envia, em lotes).",
      });
    }

    // ENVIO: MARCA PRIMEIRO (anti dupla-concessão se algo falhar) → +7d → e-mail.
    const novoExpira = new Date(Date.now() + 7 * SETE).toISOString();
    const alvo = elegiveis.slice(0, lote);
    let feitos = 0; const falhas: string[] = [];
    for (const e of alvo) {
      try {
        // (a) MARCA — uma vez pra sempre (perfil + hash anti-recria). PRIMEIRO de propósito.
        await admin.from("profiles").update({ winback_granted_at: nowISO }).eq("user_id", e.user_id);
        await admin.from("winback_grants").upsert({ email_hash: emailTrialHash(e.email) }, { onConflict: "email_hash" });
        // (b) concede +7 dias (data-based; cron recongela depois) + descongela convidados da casa
        await admin.from("houses").update({ plan: "monthly", plan_status: "trialing", plan_expires_at: novoExpira }).eq("id", e.house_id);
        await admin.from("house_members").update({ status: "active" }).eq("house_id", e.house_id).eq("status", "frozen");
        // (c) e-mail
        await sendWinbackEmail(e.email, e.full_name || "");
        feitos++;
      } catch (err: any) {
        falhas.push(`${e.email}: ${err?.message || "erro"}`);
      }
    }
    return NextResponse.json({
      ok: true, acao: "reengage_winback", modo: "envio",
      elegiveis_total: elegiveis.length, concedidos_e_enviados: feitos, falhas: falhas.length, falhas_detalhe: falhas.slice(0, 10),
      restantes: elegiveis.length - feitos,
      message: elegiveis.length - feitos > 0 ? `Feito ${feitos}. Faltam ${elegiveis.length - feitos} — rode de novo pro próximo lote.` : `Feito ${feitos}. Todos os elegíveis contatados. ✅`,
    });
  }

  // ── AUDITORIA (relatório) ──
  // Vazamentos = plano != free, JÁ vencido, mas status não está "inactive"
  // (deveriam estar congelados). O esperado é ZERO.
  const { data: vazamentos } = await admin
    .from("houses")
    .select("id, name, plan, plan_status, plan_expires_at, owner_id")
    .neq("plan", "free")
    .lt("plan_expires_at", nowISO)
    .neq("plan_status", "inactive");

  const { count: trialAtivos } = await admin
    .from("houses")
    .select("id", { count: "exact", head: true })
    .eq("plan_status", "trialing")
    .gt("plan_expires_at", nowISO);

  // PAGANTES (detalhe): plano pago, ativo e ainda válido. Pega dono p/ exibir.
  const { data: pagantesRows } = await admin
    .from("houses")
    .select("id, name, plan, plan_status, plan_expires_at, owner_id")
    .in("plan", ["monthly", "yearly"])
    .eq("plan_status", "active")
    .gt("plan_expires_at", nowISO);

  const ownerIds = [...new Set((pagantesRows ?? []).map((h) => h.owner_id as string))];
  const { data: ownerProfiles } = ownerIds.length
    ? await admin.from("profiles").select("user_id, full_name, email").in("user_id", ownerIds)
    : { data: [] as any[] };
  const profById = new Map(
    (ownerProfiles ?? []).map((p: any) => [p.user_id, p])
  );
  const pagantes_detalhe = (pagantesRows ?? []).map((h: any) => ({
    casa: h.name,
    plano: h.plan === "yearly" ? "Anual" : "Mensal",
    dono: profById.get(h.owner_id)?.full_name || "—",
    email: profById.get(h.owner_id)?.email || "—",
    vence_em: h.plan_expires_at,
  }));

  // Visão geral da base
  const { count: totalProfiles } = await admin
    .from("profiles")
    .select("user_id", { count: "exact", head: true });
  const { count: totalHouses } = await admin
    .from("houses")
    .select("id", { count: "exact", head: true });
  const { count: contasFree } = await admin
    .from("houses")
    .select("id", { count: "exact", head: true })
    .eq("plan", "free");
  const { count: congeladas } = await admin
    .from("houses")
    .select("id", { count: "exact", head: true })
    .eq("plan_status", "inactive");

  const leaks = vazamentos ?? [];
  return NextResponse.json({
    gerado_em: nowISO,
    resumo: {
      total_contas: totalProfiles ?? 0,
      total_casas: totalHouses ?? 0,
      trial_ativos: trialAtivos ?? 0,
      pagantes_ativos: (pagantesRows ?? []).length,
      contas_free: contasFree ?? 0,
      congeladas_inativas: congeladas ?? 0,
      vazamentos: leaks.length,
    },
    status:
      leaks.length === 0
        ? "✅ Nenhum vazamento — ninguém com benefício indevido. Blindagem OK."
        : `⚠️ ${leaks.length} casa(s) com plano vencido mas não congelado — verificar.`,
    pagantes_detalhe,
    vazamentos_detalhe: leaks,
    acoes: {
      estender_trials_14: "?acao=estender14",
      congelar_vencidos_agora: "?acao=congelar_vencidos",
      backfill_trial_grants: "?acao=backfill_trial_grants",
      check_confirmados: "?acao=check_confirmados",
      check_push: "?acao=check_push",
      push_debug: "?acao=push_debug&email=...&send=1",
      reengage_push: "?acao=reengage_push (dry) | &send=1 pra enviar",
      reengage_winback: "?acao=reengage_winback (dry) | &test=email | &send=1 — +7d 1x só p/ congelados que pegaram só 7 dias (anti-farm por hash)",
    },
  });
}
