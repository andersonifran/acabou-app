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

        // Se o next é uma página de convite, aceita server-side e vai direto para /home
        if (next.startsWith("/convite/")) {
          const conviteToken = next.replace("/convite/", "");

          // Aceita o convite server-side
          const { data: invite } = await adminClient
            .from("invite_tokens")
            .select("house_id, expires_at, used_at")
            .eq("token", conviteToken)
            .maybeSingle();

          if (invite && !invite.used_at && new Date(invite.expires_at) > new Date()) {
            // Verifica plano da casa
            const { data: house } = await adminClient
              .from("houses")
              .select("id, plan, plan_status, plan_expires_at")
              .eq("id", invite.house_id)
              .single();

            const canAccept = house && house.plan !== "free" &&
              (house.plan_status === "active" || house.plan_status === "trialing");

            if (canAccept) {
              // Verifica se já não é membro
              const { data: existing } = await adminClient
                .from("house_members")
                .select("id")
                .eq("house_id", invite.house_id)
                .eq("user_id", user.id)
                .maybeSingle();

              if (!existing) {
                // Busca dados extras do convite (nome, tipo, parentesco)
                const { data: inviteExtra } = await adminClient
                  .from("invite_tokens")
                  .select("invitee_name, member_type, relation_label")
                  .eq("token", conviteToken)
                  .maybeSingle();

                await adminClient.from("house_members").insert({
                  house_id: invite.house_id,
                  user_id: user.id,
                  role: "member",
                  status: "active",
                  invited_by: user.id,
                  display_name: inviteExtra?.invitee_name || null,
                  member_type: inviteExtra?.member_type || "familiar",
                  relation_label: inviteExtra?.relation_label || null,
                });

                await adminClient
                  .from("invite_tokens")
                  .update({ used_at: new Date().toISOString() })
                  .eq("token", conviteToken);

                console.log(`[OAuth Callback] ✅ Convite aceito: ${user.id} → casa ${invite.house_id}`);
              }
            }
          }

          return NextResponse.redirect(`${origin}/home`);
        }

        // Verifica se há convite pendente via cookie (fallback quando Supabase perde o next param)
        const pendingInviteCookie = request.cookies.get("acabou_pending_invite")?.value;
        if (pendingInviteCookie && !next.startsWith("/convite/")) {
          console.log(`[OAuth Callback] 🍪 Convite encontrado no cookie: ${pendingInviteCookie}`);

          const { data: invite } = await adminClient
            .from("invite_tokens")
            .select("house_id, expires_at, used_at")
            .eq("token", pendingInviteCookie)
            .maybeSingle();

          if (invite && !invite.used_at && new Date(invite.expires_at) > new Date()) {
            const { data: house } = await adminClient
              .from("houses")
              .select("id, plan, plan_status, plan_expires_at")
              .eq("id", invite.house_id)
              .single();

            const canAccept = house && house.plan !== "free" &&
              (house.plan_status === "active" || house.plan_status === "trialing");

            if (canAccept) {
              const { data: existing } = await adminClient
                .from("house_members")
                .select("id")
                .eq("house_id", invite.house_id)
                .eq("user_id", user.id)
                .maybeSingle();

              if (!existing) {
                // Busca dados extras do convite (nome, tipo, parentesco)
                const { data: inviteExtra } = await adminClient
                  .from("invite_tokens")
                  .select("invitee_name, member_type, relation_label")
                  .eq("token", pendingInviteCookie)
                  .maybeSingle();

                await adminClient.from("house_members").insert({
                  house_id: invite.house_id,
                  user_id: user.id,
                  role: "member",
                  status: "active",
                  invited_by: user.id,
                  display_name: inviteExtra?.invitee_name || null,
                  member_type: inviteExtra?.member_type || "familiar",
                  relation_label: inviteExtra?.relation_label || null,
                });

                await adminClient
                  .from("invite_tokens")
                  .update({ used_at: new Date().toISOString() })
                  .eq("token", pendingInviteCookie);

                console.log(`[OAuth Callback] ✅ Convite aceito via cookie: ${user.id} → casa ${invite.house_id}`);
              }
            }
          }

          // Limpa o cookie e redireciona para /home
          const redirectResponse = NextResponse.redirect(`${origin}/home`);
          redirectResponse.cookies.set("acabou_pending_invite", "", { path: "/", maxAge: 0 });
          return redirectResponse;
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
