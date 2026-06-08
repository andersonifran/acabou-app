import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, getAuthUser } from "@/lib/supabase/server";

// Remoção de membro MOVIDA PRO SERVIDOR (08/06/2026).
// Motivo: o trigger anti-burla `guard_member_status` (migration 2026-06-08)
// bloqueia QUALQUER UPDATE de house_members.status pela sessão authenticated/anon
// (impede o dono de "descongelar" convidado sem pagar). Isso quebrou o
// removeMember que era feito direto do cliente. Aqui usamos o admin client
// (service_role), isento do trigger.
//
// Anti-burla: remover SEMPRE reduz acesso (status='removed'), nunca concede —
// então é seguro. E só o DONO da casa pode remover membros dela (anti-IDOR:
// identidade vem da SESSÃO, nunca do corpo).
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const userId = authUser.id;

    const { memberId } = await request.json();
    if (!memberId) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Busca o membro alvo
    const { data: member } = await admin
      .from("house_members")
      .select("id, house_id, role")
      .eq("id", memberId)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
    }

    // Nunca remover o dono por este fluxo
    if (member.role === "owner") {
      return NextResponse.json(
        { error: "Não é possível remover o dono da casa." },
        { status: 400 }
      );
    }

    // Só o DONO da casa onde o membro está pode removê-lo (anti-IDOR)
    const { data: house } = await admin
      .from("houses")
      .select("owner_id")
      .eq("id", member.house_id)
      .single();

    if (!house || house.owner_id !== userId) {
      return NextResponse.json(
        { error: "Apenas o dono da casa pode remover membros." },
        { status: 403 }
      );
    }

    const { error } = await admin
      .from("house_members")
      .update({ status: "removed" })
      .eq("id", memberId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[remover-membro]", err);
    return NextResponse.json(
      { error: err.message ?? "Erro ao remover membro" },
      { status: 500 }
    );
  }
}
