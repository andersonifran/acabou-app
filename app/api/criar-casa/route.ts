import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getAuthUser } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/emails";
import { emailTrialHash, phoneTrialHash } from "@/lib/trial-email";

export async function POST(request: NextRequest) {
  try {
    // Autentica pela SESSÃO — nunca confia em userId vindo do corpo (anti-IDOR)
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const userId = authUser.id;

    const { houseName, fullName, phone, propertyType } = await request.json();

    if (!houseName) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // TRAVA DE PLANO no servidor: plano grátis permite apenas 1 casa.
    // Só quem tem plano pago/trial ATIVO pode ter casas adicionais.
    const { data: ownerHouses } = await supabase
      .from("houses")
      .select("plan, plan_status, plan_expires_at")
      .eq("owner_id", userId);

    const houseCount = ownerHouses?.length ?? 0;
    const hasActivePaid = (ownerHouses ?? []).some(
      (h) =>
        h.plan !== "free" &&
        (h.plan_status === "active" ||
          (h.plan_status === "trialing" &&
            (!h.plan_expires_at || new Date(h.plan_expires_at) > new Date())))
    );

    if (houseCount >= 1 && !hasActivePaid) {
      return NextResponse.json(
        { error: "O plano grátis permite apenas 1 casa. Assine o Plano Família para adicionar mais locais." },
        { status: 403 }
      );
    }

    // Email vem direto da sessão autenticada (sem chamada extra)
    const userEmail = authUser.email ?? "";

    // Atualiza profile
    await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        full_name: fullName ?? "",
        email: userEmail,
        phone: phone ?? null,
      }, { onConflict: "user_id" });

    // Marcador PERMANENTE de "já usou o trial" (sobrevive a apagar/recriar casa).
    // Leitura defensiva: se a coluna ainda não existir, cai pra checagem de membro.
    let trialUsed = false;
    const { data: profileRow, error: profErr } = await supabase
      .from("profiles")
      .select("trial_used")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profErr && profileRow) trialUsed = !!(profileRow as any).trial_used;

    // Marcadores DURÁVEIS por EMAIL e por TELEFONE — sobrevivem à EXCLUSÃO da
    // conta + recriar (o excluir-conta NÃO apaga a trial_grants). O trial_used
    // acima é por user_id e some quando a conta é apagada; estes aqui ficam.
    // 2 camadas: e-mail novo é grátis, mas o WhatsApp do cadastro quase sempre
    // se repete — juntas, encarecem muito o farm de trial.
    // ⚠️ FAIL-CLOSED (Anderson 02/07, inegociável): se a CHECAGEM falhar por
    // qualquer erro (tabela/banco), NEGA o trial. Melhor um usuário legítimo
    // acionar o suporte do que um furo de receita aberto em silêncio.
    const emailHash = userEmail ? emailTrialHash(userEmail) : null;
    const phoneHash = phoneTrialHash(phone);
    const grantHashes = [emailHash, phoneHash].filter(Boolean) as string[];
    let grantUsed = false;
    if (grantHashes.length === 0) {
      // sem e-mail nem telefone rastreáveis → sem como impedir repetição → nega
      grantUsed = true;
    } else {
      const { data: grants, error: grantsErr } = await supabase
        .from("trial_grants")
        .select("email_hash")
        .in("email_hash", grantHashes);
      if (grantsErr) {
        console.error(
          "[criar-casa] ANTI-FARM: checagem trial_grants FALHOU — trial NEGADO (fail-closed):",
          grantsErr.message
        );
        grantUsed = true;
      } else {
        grantUsed = (grants ?? []).length > 0;
      }
    }

    // Verifica se o dono tem alguma casa com plano pago → herda o plano
    const { data: paidHouse } = await supabase
      .from("houses")
      .select("plan, plan_status, plan_expires_at")
      .eq("owner_id", userId)
      .neq("plan", "free")
      .limit(1)
      .maybeSingle();

    let inheritedPlan: { plan: string; plan_status: string; plan_expires_at?: string };

    if (paidHouse && (paidHouse.plan_status === "active" || paidHouse.plan_status === "trialing")) {
      // Herda plano pago ou trial existente
      inheritedPlan = { plan: paidHouse.plan, plan_status: paidHouse.plan_status, plan_expires_at: paidHouse.plan_expires_at ?? undefined };
    } else {
      // Trial de 14 dias SÓ para conta GENUINAMENTE nova: sem casa própria E que
      // NUNCA foi membro de nenhuma casa. Assim, um CONVIDADO (que já entrou via
      // convite e usou o premium do dono) NÃO ganha um novo trial ao criar a
      // própria casa — entra no plano grátis. Também evita farm de trial.
      const { count: ownedCount } = await supabase
        .from("houses")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId);

      const { count: memberCount } = await supabase
        .from("house_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      // Trial só se: NUNCA usou trial (marcador permanente) E nunca teve casa E
      // nunca foi membro/convidado de nenhuma casa E nenhum marcador durável
      // (e-mail/telefone) consta como já-usado.
      const isBrandNew =
        !trialUsed &&
        !grantUsed &&
        (ownedCount === 0 || ownedCount === null) &&
        (memberCount === 0 || memberCount === null);

      if (isBrandNew) {
        // ⚠️ ORDEM É SEGURANÇA (fail-closed): grava os marcadores duráveis ANTES
        // de conceder o trial. Se a gravação falhar, o trial NÃO é concedido —
        // um trial sem registro reabriria o furo de farm (excluir + recriar).
        const rows = grantHashes.map((email_hash) => ({ email_hash }));
        const { error: grantErr } = await supabase
          .from("trial_grants")
          .upsert(rows, { onConflict: "email_hash", ignoreDuplicates: true });
        if (grantErr) {
          console.error(
            "[criar-casa] ANTI-FARM: gravação trial_grants FALHOU — trial NEGADO (fail-closed):",
            grantErr.message
          );
          inheritedPlan = { plan: "free", plan_status: "active" };
        } else {
          // Conta nova de verdade — trial de 14 dias (mais tempo de teste = mais
          // chance de ver o valor e converter). Anti-burla: o corte é por DATA
          // (plan_expires_at), então o fim do trial é sempre respeitado.
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 14);
          inheritedPlan = { plan: "monthly", plan_status: "trialing", plan_expires_at: trialEnd.toISOString() };
          // Marcador por user_id (redundância barata; some se a conta for apagada,
          // mas os hashes acima ficam pra sempre).
          await supabase.from("profiles").update({ trial_used: true } as any).eq("user_id", userId);
        }
      } else {
        // Já usou trial (por conta, e-mail OU telefone) / já foi membro / já teve
        // casa → grátis. Log ajuda a MEDIR tentativas de farm nos logs da Vercel.
        if (grantUsed && !trialUsed) {
          console.log("[criar-casa] trial negado: marcador durável já usado (anti-farm).");
        }
        inheritedPlan = { plan: "free", plan_status: "active" };
      }
    }

    // Cria a casa (herdando plano se existir)
    const { data: house, error: houseError } = await supabase
      .from("houses")
      .insert({
        name: houseName.trim(),
        owner_id: userId,
        property_type: propertyType ?? "casa",
        ...inheritedPlan,
      })
      .select()
      .single();

    if (houseError) throw houseError;

    // Adiciona dono como membro
    const { error: memberError } = await supabase
      .from("house_members")
      .insert({
        house_id: house.id,
        user_id: userId,
        role: "owner",
        status: "active",
      });

    if (memberError) throw memberError;

    // Envia e-mail de boas-vindas (não bloqueia o cadastro se falhar)
    if (userEmail) {
      sendWelcomeEmail(userEmail, fullName ?? "", houseName.trim()).catch((err) =>
        console.error("[Welcome Email] Erro:", err)
      );
    }

    // isPaid AUTORITATIVO (servidor): a casa nasceu com trial de 14 dias ou
    // herdou plano pago/trial ativo? Em ambos os casos o usuário tem acesso
    // ILIMITADO (sem teto de 10 itens) durante o onboarding. Conta que entrou
    // como grátis (já usou trial / é convidado) → isPaid=false → teto free.
    // Anti-burla: o gatilho de item no banco continua sendo a trava final.
    const isPaid =
      inheritedPlan.plan !== "free" &&
      (inheritedPlan.plan_status === "active" || inheritedPlan.plan_status === "trialing");

    return NextResponse.json({
      success: true,
      houseId: house.id,
      isPaid,
      plan: inheritedPlan.plan,
      plan_status: inheritedPlan.plan_status,
    });
  } catch (err: any) {
    console.error("[criar-casa]", err);
    return NextResponse.json(
      { error: err.message ?? "Erro ao criar casa" },
      { status: 500 }
    );
  }
}
