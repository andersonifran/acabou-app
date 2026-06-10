import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendAdminLeakAlert } from "@/lib/emails";
import { emailTrialHash } from "@/lib/trial-email";

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
    const { data: profs } = await admin
      .from("profiles")
      .select("email")
      .not("email", "is", null);
    const hashes = new Set<string>();
    for (const p of profs ?? []) {
      const em = ((p as any).email || "").trim();
      if (em) hashes.add(emailTrialHash(em));
    }
    const rows = [...hashes].map((email_hash) => ({ email_hash }));
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
      perfis_com_email: (profs ?? []).length,
      emails_unicos_marcados: hashes.size,
      gravados,
      message: `Backfill: ${hashes.size} email(s) marcados como já-usaram-trial (não ganham 14 dias ao excluir+recriar).`,
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
    },
  });
}
