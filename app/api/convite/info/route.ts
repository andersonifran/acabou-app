import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// =============================================
// GET /api/convite/info?token=...
// =============================================
// Lê um convite pelo token (no servidor, com admin client) para EXIBIR a tela
// de convite. Antes isso era feito no cliente com a tabela invite_tokens aberta
// para leitura (qualquer um listava todos os tokens e entrava em casas pagas).
// Agora a leitura é por token EXATO, no servidor — a RLS da tabela fica fechada.
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ valid: false, reason: "Token ausente" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: invite } = await admin
      .from("invite_tokens")
      .select("used_at, expires_at, house:houses(name, property_type)")
      .eq("token", token)
      .maybeSingle();

    if (!invite) {
      return NextResponse.json({ valid: false, reason: "Link de convite inválido." });
    }
    if (invite.used_at) {
      return NextResponse.json({ valid: false, reason: "Este convite já foi utilizado. Se foi você, acesse o app normalmente.", used: true });
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: "Este link de convite expirou. Peça um novo convite ao dono da casa." });
    }

    const house = invite.house as any;
    return NextResponse.json({
      valid: true,
      houseName: house?.name ?? "",
      propertyType: house?.property_type ?? "casa",
    });
  } catch (err) {
    console.error("[convite/info]", err);
    return NextResponse.json({ valid: false, reason: "Erro de conexão. Tente novamente." }, { status: 500 });
  }
}
