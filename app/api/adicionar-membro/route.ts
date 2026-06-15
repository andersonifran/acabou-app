import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getAuthUser } from "@/lib/supabase/server";

// =============================================================
// POST /api/adicionar-membro
//   { houseId, userId, display_name?, member_type?, relation_label? }
//
// Adiciona um MEMBRO EXISTENTE do dono a OUTRA casa dele — a mesma pessoa pode
// cuidar de vários locais (casa, praia, veraneio, empresa…).
//
// MOVIDO PRO SERVIDOR (12/06/2026): o trigger anti-burla `guard_member_status`
// (blindagem #2, migration 2026-06-11) bloqueia INSERT de house_members com
// status='active' pela sessão authenticated/anon. O insert direto do cliente
// (casa/page.tsx) passou a falhar com "Erro ao adicionar membro". Aqui usamos o
// admin client (service_role), ISENTO do trigger — igual a /api/convite/aceitar
// e /api/remover-membro — com TODAS as validações no servidor:
//   1. identidade vem da SESSÃO (anti-IDOR), nunca do corpo;
//   2. só o DONO da casa-alvo pode adicionar membros nela;
//   3. a casa-alvo precisa ter Plano Família ATIVO/trial não expirado;
//   4. ANTI-BURLA: o userId tem que JÁ SER membro ATIVO de OUTRA casa do MESMO
//      dono — ou seja, só dá pra RE-adicionar alguém que o dono já tem (não
//      concede acesso novo a um estranho).
// =============================================================
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const ownerId = authUser.id;

    const { houseId, userId, display_name, member_type, relation_label } =
      await request.json();
    if (!houseId || !userId) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    if (userId === ownerId) {
      return NextResponse.json({ error: "Você já participa desta casa." }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1+2. Só o DONO da casa-alvo pode adicionar; e a casa precisa do plano ativo.
    const { data: house } = await admin
      .from("houses")
      .select("owner_id, plan, plan_status, plan_expires_at")
      .eq("id", houseId)
      .single();

    if (!house || house.owner_id !== ownerId) {
      return NextResponse.json(
        { error: "Apenas o dono da casa pode adicionar membros." },
        { status: 403 }
      );
    }

    const validStatuses = ["active", "trialing"];
    const planOk = house.plan !== "free" && validStatuses.includes(house.plan_status);
    const notExpired =
      !house.plan_expires_at || new Date(house.plan_expires_at) > new Date();
    if (!planOk || !notExpired) {
      return NextResponse.json(
        { error: "Esta casa precisa do Plano Família ativo para ter membros." },
        { status: 403 }
      );
    }

    // 3. ANTI-BURLA: userId tem que JÁ ser membro ATIVO de OUTRA casa do MESMO dono.
    //    (Só dá pra re-adicionar um membro que o dono já tem — não cria acesso novo.)
    const { data: ownerHouses } = await admin
      .from("houses")
      .select("id")
      .eq("owner_id", ownerId);
    const ownerHouseIds = (ownerHouses ?? []).map((h) => h.id);

    const { data: source } = await admin
      .from("house_members")
      .select("display_name, member_type, relation_label")
      .in("house_id", ownerHouseIds)
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!source) {
      return NextResponse.json(
        { error: "Esta pessoa precisa já ser um membro seu em outro local." },
        { status: 403 }
      );
    }

    // Rótulos (não-sensíveis): usa o que veio do cliente, com fallback no registro
    // de origem. member_type clampeado ao enum válido.
    const rawType = member_type ?? source.member_type;
    const mtype = rawType === "funcionario" ? "funcionario" : "familiar";
    const dName = (display_name ?? source.display_name) || null;
    const rLabel = (relation_label ?? source.relation_label) || null;

    // 4. Já existe registro nesta casa? (ok se ativo; reativa se removed/frozen)
    const { data: existing } = await admin
      .from("house_members")
      .select("id, status")
      .eq("house_id", houseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json({ ok: true, alreadyMember: true });
      }
      const { error: reactErr } = await admin
        .from("house_members")
        .update({
          status: "active",
          role: "member",
          invited_by: ownerId,
          display_name: dName,
          member_type: mtype,
          relation_label: rLabel,
        } as any)
        .eq("id", existing.id);
      if (reactErr) throw reactErr;
      return NextResponse.json({ ok: true, reactivated: true });
    }

    // 5. Insere o membro ATIVO (service_role = isento do trigger anti-burla).
    const { error: insertError } = await admin.from("house_members").insert({
      house_id: houseId,
      user_id: userId,
      role: "member",
      status: "active",
      invited_by: ownerId,
      display_name: dName,
      member_type: mtype,
      relation_label: rLabel,
    } as any);

    if (insertError) {
      // Corrida (double-click): se já existir, trata como sucesso suave.
      if ((insertError as any).code === "23505") {
        return NextResponse.json({ ok: true, alreadyMember: true });
      }
      throw insertError;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[adicionar-membro]", err);
    return NextResponse.json(
      { error: err.message ?? "Erro ao adicionar membro" },
      { status: 500 }
    );
  }
}
