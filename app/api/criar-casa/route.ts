import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const { userId, houseName, fullName, phone, propertyType } = await request.json();

    if (!userId || !houseName) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Busca o email do usuário no Auth
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.email ?? "";

    // Atualiza profile
    await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        full_name: fullName ?? "",
        email: userEmail,
        phone: phone ?? null,
      }, { onConflict: "user_id" });

    // Cria a casa
    const { data: house, error: houseError } = await supabase
      .from("houses")
      .insert({ name: houseName.trim(), owner_id: userId, property_type: propertyType ?? "casa" })
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
    if (process.env.RESEND_API_KEY && userEmail) {
      sendWelcomeEmail(userEmail, fullName ?? "", houseName.trim()).catch((err) =>
        console.error("[Welcome Email] Erro:", err)
      );
    }

    return NextResponse.json({ success: true, houseId: house.id });
  } catch (err: any) {
    console.error("[criar-casa]", err);
    return NextResponse.json(
      { error: err.message ?? "Erro ao criar casa" },
      { status: 500 }
    );
  }
}

// =============================================
// E-MAIL DE BOAS-VINDAS
// =============================================
async function sendWelcomeEmail(email: string, name: string, houseName: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const firstName = name.split(" ")[0] || "Olá";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br";

  await resend.emails.send({
    from: "Acabou? App <notificacoes@acabouapp.com.br>",
    to: email,
    subject: `Bem-vindo(a) ao Acabou?, ${firstName}! 🏠`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">

        <!-- Header verde -->
        <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 32px; color: white;">Acabou?</h1>
          <p style="margin: 8px 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">Sua despensa inteligente</p>
        </div>

        <!-- Conteúdo -->
        <div style="padding: 40px 32px; border: 1px solid #e5e7eb; border-top: none;">

          <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">
            Ei, ${firstName}! Que bom ter você aqui! 🎉
          </h2>

          <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563; line-height: 1.7;">
            Sua casa <strong>"${houseName}"</strong> foi criada com sucesso.
            Agora sua fam&iacute;lia nunca mais vai esquecer o que precisa comprar.
          </p>

          <!-- 3 passos -->
          <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <p style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em;">
              Primeiros passos
            </p>

            <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
              <span style="background: #16a34a; color: white; border-radius: 50%; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0;">1</span>
              <div>
                <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 600;">Adicione seus itens</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Cadastre o que voc&ecirc; costuma ter em casa</p>
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
              <span style="background: #16a34a; color: white; border-radius: 50%; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0;">2</span>
              <div>
                <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 600;">Convide sua fam&iacute;lia</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Compartilhe pelo WhatsApp com 1 toque</p>
              </div>
            </div>

            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="background: #16a34a; color: white; border-radius: 50%; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0;">3</span>
              <div>
                <p style="margin: 0; font-size: 15px; color: #111827; font-weight: 600;">Marque "Acabou!"</p>
                <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">A lista de compras se monta sozinha</p>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${appUrl}/home" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 40px; border-radius: 12px;">
              Abrir minha despensa
            </a>
          </div>

          <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; line-height: 1.6;">
            Qualquer d&uacute;vida, responda este e-mail. Estamos aqui para ajudar!
          </p>

          <p style="margin: 24px 0 0; font-size: 14px; color: #111827;">
            Um abra&ccedil;o,<br>
            <strong>Equipe Acabou?</strong> 🛒
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 32px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; background: #f9fafb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            <a href="${appUrl}" style="color: #6b7280; text-decoration: none;">acabouapp.com.br</a>
            &nbsp;&middot;&nbsp;
            <a href="${appUrl}/privacidade" style="color: #6b7280; text-decoration: none;">Privacidade</a>
            &nbsp;&middot;&nbsp;
            <a href="${appUrl}/termos" style="color: #6b7280; text-decoration: none;">Termos</a>
          </p>
        </div>
      </div>
    `,
  });

  console.log(`[Welcome Email] ✅ Enviado para ${email}`);
}
