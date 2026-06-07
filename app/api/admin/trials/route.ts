import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendAdminLeakAlert } from "@/lib/emails";

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
    },
  });
}
