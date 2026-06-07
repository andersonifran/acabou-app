import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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
  const user = await getAdmin();
  if (!user) {
    return NextResponse.json(
      { error: "Acesso só pra admin (logado com o e-mail de admin)." },
      { status: 403 }
    );
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

  const { count: pagantesAtivos } = await admin
    .from("houses")
    .select("id", { count: "exact", head: true })
    .in("plan", ["monthly", "yearly"])
    .eq("plan_status", "active")
    .gt("plan_expires_at", nowISO);

  const leaks = vazamentos ?? [];
  return NextResponse.json({
    gerado_em: nowISO,
    resumo: {
      trial_ativos: trialAtivos ?? 0,
      pagantes_ativos: pagantesAtivos ?? 0,
      vazamentos: leaks.length,
    },
    status:
      leaks.length === 0
        ? "✅ Nenhum vazamento — ninguém com benefício indevido. Blindagem OK."
        : `⚠️ ${leaks.length} casa(s) com plano vencido mas não congelado — verificar.`,
    vazamentos_detalhe: leaks,
    dica: "Pra estender os trials antigos pra 14 dias: abra esta mesma URL com ?acao=estender14",
  });
}
