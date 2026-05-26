import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Verifica se o usuário já tem um perfil
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
          .from("profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        // Se não tem perfil, cria um (Google OAuth novo)
        if (!profile) {
          await adminClient.from("profiles").upsert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
            email: user.email ?? "",
          }, { onConflict: "user_id" });
        }

        // Se o next é uma página de convite, redireciona direto para lá
        // (não precisa criar casa — vai entrar na casa do convite)
        if (next.startsWith("/convite/")) {
          return NextResponse.redirect(`${origin}${next}`);
        }

        // Verifica se o usuário já tem alguma casa
        const { data: member } = await supabase
          .from("house_members")
          .select("house_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .single();

        if (!member) {
          // Novo usuário (Google OAuth) sem convite — vai para onboarding criar casa
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Em caso de erro, redireciona para login com mensagem
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
