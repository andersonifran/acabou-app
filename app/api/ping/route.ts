import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Marca atividade do usuário (last_active_at = agora).
 * Chamado uma vez quando o app abre. Serve para o nudge diário NÃO
 * incomodar quem já abriu o app hoje (re-engajamento estilo Duolingo).
 * Fire-and-forget: nunca bloqueia a UI.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
