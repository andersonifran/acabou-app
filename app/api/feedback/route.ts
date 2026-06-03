import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Escapa HTML do conteúdo enviado pelo usuário antes de injetar no e-mail
// (evita injeção de HTML/script no e-mail que o suporte recebe).
function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: NextRequest) {
  try {
    const { content, userName, userEmail } = await request.json();

    if (!content || content.trim().length < 3) {
      return NextResponse.json({ error: "Feedback muito curto." }, { status: 400 });
    }

    // 1. Salva no banco Supabase
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

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("feedbacks" as any).insert({
      content: content.trim(),
      user_id: user?.id ?? null,
    });

    // 2. Manda e-mail de notificação (se RESEND_API_KEY estiver configurada)
    if (process.env.RESEND_API_KEY) {
      const senderName = userName || userEmail || "Usuário anônimo";
      const senderInfo = userEmail ? `${userName ? userName + " — " : ""}${userEmail}` : "Não informado";

      await resend.emails.send({
        from: "Acabou? App <notificacoes@acabouapp.com.br>",
        to: "suporteacabou@gmail.com",
        subject: `💬 Novo feedback — ${senderName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #16a34a; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; font-size: 20px;">💬 Novo feedback recebido</h2>
              <p style="margin: 6px 0 0; opacity: 0.85; font-size: 14px;">Acabou? App</p>
            </div>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Usuário</p>
              <p style="margin: 0 0 20px; font-size: 15px; color: #111827;">${escapeHtml(senderInfo)}</p>

              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Mensagem</p>
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                <p style="margin: 0; font-size: 15px; color: #111827; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(content.trim())}</p>
              </div>

              <p style="margin: 20px 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Recebido em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Feedback API]", error);
    return NextResponse.json({ error: "Erro ao enviar feedback." }, { status: 500 });
  }
}
