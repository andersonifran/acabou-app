import { Resend } from "resend";

// =============================================
// ACABOU? — Templates de E-mail
// =============================================
// Centraliza todos os emails do app em um lugar.
// Usa Resend como provedor (chave em RESEND_API_KEY).
//
// Emails disponíveis:
// 1. Boas-vindas (cadastro)
// 2. Pagamento aprovado (assinatura ativada)
// 3. Plano expirando (3 dias antes — anti-churn)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br";
const FROM = "Acabou? App <notificacoes@acabouapp.com.br>";
// Quando o usuário "responde este e-mail", a resposta vai para o e-mail PÚBLICO
// e profissional contato@acabouapp.com.br. O ImprovMX (grátis) encaminha isso
// pro Gmail interno suporteacabou@gmail.com — que NUNCA aparece pro usuário.
const REPLY_TO = "contato@acabouapp.com.br";
// Mascotes (Sacolino) hospedados publicamente — usados no topo dos e-mails.
const MASCOTE = {
  acenando: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br"}/mascote/sacolino-acenando.png`,
  comemorando: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br"}/mascote/sacolino-comemorando.png`,
  alerta: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br"}/mascote/sacolino-alerta.png`,
  feliz: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br"}/mascote/sacolino-feliz.png`,
};
// Alertas internos (vazamento, etc.) vão para os e-mails de admin.
const ADMIN_EMAILS = ["anderson.ifran15@gmail.com", "anderson.ifran26@gmail.com"];

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Escapa HTML de conteúdo dinâmico (nome de casa é input do usuário).
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Layout base para todos os emails
function emailLayout(content: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      ${content}
      <div style="padding: 20px 32px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; background: #f9fafb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          <a href="${APP_URL}" style="color: #6b7280; text-decoration: none;">acabouapp.com.br</a>
          &nbsp;&middot;&nbsp;
          <a href="${APP_URL}/privacidade" style="color: #6b7280; text-decoration: none;">Privacidade</a>
          &nbsp;&middot;&nbsp;
          <a href="${APP_URL}/termos" style="color: #6b7280; text-decoration: none;">Termos</a>
        </p>
      </div>
    </div>
  `;
}

function mascoteImg(url?: string) {
  if (!url) return "";
  // width/height fixos + display block: o Sacolino aparece igual em todo cliente
  // de e-mail (Gmail, Outlook). Fundo do header é colorido, PNG transparente cai bem.
  return `<img src="${url}" alt="Sacolino" width="92" height="92" style="display:block;margin:0 auto 14px;width:92px;height:92px;object-fit:contain;" />`;
}

function greenHeader(title: string, subtitle?: string, mascote?: string) {
  return `
    <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 36px 32px; text-align: center; border-radius: 12px 12px 0 0;">
      ${mascoteImg(mascote)}
      <h1 style="margin: 0; font-size: 32px; color: white;">${title}</h1>
      ${subtitle ? `<p style="margin: 8px 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">${subtitle}</p>` : ""}
    </div>
  `;
}

function amberHeader(title: string, subtitle?: string, mascote?: string) {
  return `
    <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 36px 32px; text-align: center; border-radius: 12px 12px 0 0;">
      ${mascoteImg(mascote)}
      <h1 style="margin: 0; font-size: 32px; color: white;">${title}</h1>
      ${subtitle ? `<p style="margin: 8px 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">${subtitle}</p>` : ""}
    </div>
  `;
}

// =============================================
// 1. EMAIL DE BOAS-VINDAS (cadastro)
// =============================================
export async function sendWelcomeEmail(email: string, name: string, houseName: string) {
  if (!process.env.RESEND_API_KEY) return;

  const firstName = name.split(" ")[0] || "Oi";
  const resend = getResend();

  await resend.emails.send({
    from: FROM,
    to: email,
    replyTo: REPLY_TO,
    subject: `Bem-vindo(a) ao Acabou?, ${firstName}! 🏠`,
    html: emailLayout(`
      ${greenHeader("Acabou?", "Sua despensa inteligente", MASCOTE.acenando)}
      <div style="padding: 40px 32px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">
          Ei, ${firstName}! Que bom ter voc&ecirc; aqui! 🎉
        </h2>
        <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563; line-height: 1.7;">
          Sua casa <strong>"${houseName}"</strong> foi criada com sucesso.
          Agora sua fam&iacute;lia nunca mais vai esquecer o que precisa comprar.
        </p>
        <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em;">Primeiros passos</p>
          <div style="margin-bottom: 16px;">
            <span style="background: #16a34a; color: white; border-radius: 50%; width: 28px; height: 28px; display: inline-block; text-align: center; line-height: 28px; font-size: 14px; font-weight: 700;">1</span>
            <strong style="margin-left: 8px; color: #111827;">Adicione seus itens</strong>
            <span style="color: #6b7280; font-size: 13px;"> — cadastre o que costuma ter em casa</span>
          </div>
          <div style="margin-bottom: 16px;">
            <span style="background: #16a34a; color: white; border-radius: 50%; width: 28px; height: 28px; display: inline-block; text-align: center; line-height: 28px; font-size: 14px; font-weight: 700;">2</span>
            <strong style="margin-left: 8px; color: #111827;">Convide sua fam&iacute;lia</strong>
            <span style="color: #6b7280; font-size: 13px;"> — compartilhe pelo WhatsApp com 1 toque</span>
          </div>
          <div>
            <span style="background: #16a34a; color: white; border-radius: 50%; width: 28px; height: 28px; display: inline-block; text-align: center; line-height: 28px; font-size: 14px; font-weight: 700;">3</span>
            <strong style="margin-left: 8px; color: #111827;">Marque "Acabou!"</strong>
            <span style="color: #6b7280; font-size: 13px;"> — a lista de compras se monta sozinha</span>
          </div>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/home" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 40px; border-radius: 12px;">Abrir minha despensa</a>
        </div>
        <p style="margin: 0; font-size: 14px; color: #111827;">Um abra&ccedil;o,<br><strong>Equipe Acabou?</strong> 🛒</p>
      </div>
    `),
  });

  console.log(`[Email] ✅ Boas-vindas enviado para ${email}`);
}

// =============================================
// 2. EMAIL DE PAGAMENTO APROVADO (assinatura)
// =============================================
export async function sendPaymentApprovedEmail(
  email: string,
  name: string,
  plan: string,
  expiresAt: string
) {
  if (!process.env.RESEND_API_KEY) return;

  const firstName = name.split(" ")[0] || "Oi";
  const resend = getResend();

  const planName = plan === "yearly" ? "Fam&iacute;lia Anual" : "Fam&iacute;lia Mensal";
  const planPrice = plan === "yearly" ? "R$ 59,90/ano" : "R$ 8,90/m&ecirc;s";

  const expiresDate = new Date(expiresAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  await resend.emails.send({
    from: FROM,
    to: email,
    replyTo: REPLY_TO,
    subject: `Pagamento aprovado! Seu Plano Familia esta ativo 🎉`,
    html: emailLayout(`
      ${greenHeader("Pagamento Aprovado!", "Seu plano foi ativado com sucesso", MASCOTE.comemorando)}
      <div style="padding: 40px 32px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">
          Parab&eacute;ns, ${firstName}! 🎉
        </h2>
        <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.7;">
          Seu pagamento foi aprovado e o <strong>Plano ${planName}</strong> j&aacute; est&aacute; ativo.
          Aproveite todos os recursos sem limites!
        </p>

        <!-- Detalhes do plano -->
        <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Plano</td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 700; text-align: right;">${planName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Valor</td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 700; text-align: right;">${planPrice}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Status</td>
              <td style="padding: 8px 0; font-size: 14px; color: #16a34a; font-weight: 700; text-align: right;">&#10003; Ativo</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">V&aacute;lido at&eacute;</td>
              <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 700; text-align: right;">${expiresDate}</td>
            </tr>
          </table>
        </div>

        <!-- Benefícios -->
        <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em;">
          O que voc&ecirc; desbloqueou
        </p>
        <div style="margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #111827;">&#10003; Pessoas ilimitadas na sua casa</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #111827;">&#10003; Itens ilimitados na despensa</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #111827;">&#10003; Casas ilimitadas (praia, empresa...)</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #111827;">&#10003; Lembrete di&aacute;rio no celular</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #111827;">&#10003; Lembretes recorrentes</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #111827;">&#10003; Hist&oacute;rico completo</p>
          <p style="margin: 0; font-size: 14px; color: #111827;">&#10003; Suporte priorit&aacute;rio</p>
        </div>

        <!-- CTA principal -->
        <div style="text-align: center; margin: 32px 0 16px;">
          <a href="${APP_URL}/home" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 40px; border-radius: 12px;">Acessar meu plano</a>
        </div>

        <!-- CTA secundário: convidar família -->
        <div style="text-align: center; margin: 0 0 32px;">
          <a href="${APP_URL}/casa" style="display: inline-block; background: white; color: #16a34a; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 12px; border: 2px solid #16a34a;">Convidar minha fam&iacute;lia pelo WhatsApp</a>
        </div>

        <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
          <p style="margin: 0; font-size: 13px; color: #15803d; line-height: 1.6;">
            💡 <strong>Dica:</strong> Agora que voc&ecirc; tem pessoas ilimitadas, convide toda a fam&iacute;lia!
            Quanto mais gente usando, menos itens esquecidos no mercado.
          </p>
        </div>

        <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; line-height: 1.6;">
          Qualquer d&uacute;vida sobre sua assinatura, responda este e-mail.
        </p>
        <p style="margin: 24px 0 0; font-size: 14px; color: #111827;">
          Obrigado por confiar no Acabou?!<br>
          <strong>Equipe Acabou?</strong> 🛒
        </p>
      </div>
    `),
  });

  console.log(`[Email] ✅ Pagamento aprovado enviado para ${email}`);
}

// =============================================
// 3. EMAIL DE PLANO EXPIRANDO (anti-churn)
// =============================================
// Enviado 3 dias antes do plano expirar.
// Chamado pelo cron /api/cron/check-subscriptions.
export async function sendPlanExpiringEmail(
  email: string,
  name: string,
  plan: string,
  expiresAt: string,
  daysLeft: number
) {
  if (!process.env.RESEND_API_KEY) return;

  const firstName = name.split(" ")[0] || "Oi";
  const resend = getResend();

  const planName = plan === "yearly" ? "Fam&iacute;lia Anual" : "Fam&iacute;lia Mensal";
  const expiresDate = new Date(expiresAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const daysText = daysLeft === 1 ? "amanh&atilde;" : `em ${daysLeft} dias`;
  const urgencyText = daysLeft <= 1
    ? "Renove agora para n&atilde;o perder nenhum recurso!"
    : "Renove antes que expire para continuar aproveitando tudo sem limites.";

  await resend.emails.send({
    from: FROM,
    to: email,
    replyTo: REPLY_TO,
    subject: daysLeft <= 1
      ? `⚠️ ${firstName}, seu plano expira amanha!`
      : `${firstName}, seu plano expira em ${daysLeft} dias`,
    html: emailLayout(`
      ${amberHeader("Plano Expirando", `Seu plano vence ${daysText}`, MASCOTE.alerta)}
      <div style="padding: 40px 32px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">
          ${firstName}, seu plano est&aacute; acabando! ⏳
        </h2>
        <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.7;">
          Seu <strong>${planName}</strong> expira em <strong>${expiresDate}</strong>.
          ${urgencyText}
        </p>

        <!-- O que você perde -->
        <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
          <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.05em;">
            Sem o plano, voc&ecirc; perde:
          </p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #991b1b;">&#10007; Pessoas na casa (volta para 1 &mdash; s&oacute; voc&ecirc;)</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #991b1b;">&#10007; M&uacute;ltiplos locais (volta para 1 s&oacute;)</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #991b1b;">&#10007; Itens ilimitados (volta para 10)</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #991b1b;">&#10007; Compartilhar a lista no WhatsApp</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #991b1b;">&#10007; Membros convidados perdem o acesso</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #991b1b;">&#10007; Lembrete di&aacute;rio no celular</p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #991b1b;">&#10007; Lembretes recorrentes</p>
          <p style="margin: 0; font-size: 14px; color: #991b1b;">&#10007; Hist&oacute;rico completo</p>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${APP_URL}/planos" style="display: inline-block; background: #d97706; color: white; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 40px; border-radius: 12px;">Renovar meu plano agora</a>
        </div>

        <div style="background: #fffbeb; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
          <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.6;">
            💡 <strong>Dica:</strong> O plano anual sai por apenas R$ 4,99/m&ecirc;s
            — voc&ecirc; economiza R$ 46,90 por ano comparado ao mensal!
          </p>
        </div>

        <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280; line-height: 1.6;">
          Se precisar de ajuda, responda este e-mail.
        </p>
        <p style="margin: 24px 0 0; font-size: 14px; color: #111827;">
          Conte com a gente,<br>
          <strong>Equipe Acabou?</strong> 🛒
        </p>
      </div>
    `),
  });

  console.log(`[Email] ✅ Plano expirando enviado para ${email} (${daysLeft} dias)`);
}

// =============================================
// 4. ALERTA DE VAZAMENTO (interno — só admin)
// =============================================
// Disparado pela faxina diária (check-subscriptions) SE — depois de congelar
// tudo — ainda sobrar alguma casa com plano pago/trial vencido e não-inativa
// (não deveria sobrar nenhuma). É o "alarme de fumaça": só chega quando há algo
// de fato fora do lugar. Vai para os e-mails de admin.
export async function sendAdminLeakAlert(
  leaks: { name?: string | null; plan?: string | null; plan_expires_at?: string | null }[],
  isTeste = false
) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = getResend();

  const linhas = leaks.slice(0, 50).map((l) => {
    const venc = l.plan_expires_at
      ? new Date(l.plan_expires_at).toLocaleDateString("pt-BR")
      : "—";
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${esc(l.name) || "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${esc(l.plan) || "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#dc2626;">${venc}</td>
    </tr>`;
  }).join("");

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAILS,
    replyTo: REPLY_TO,
    subject: isTeste
      ? `✅ Teste do alerta de vazamento (tudo certo)`
      : `🚨 Acabou? — ${leaks.length} casa(s) com acesso indevido`,
    html: emailLayout(`
      ${isTeste
        ? greenHeader("Teste do alerta ✅", "É só um teste — o alarme está funcionando", MASCOTE.feliz)
        : amberHeader("Alerta de vazamento 🚨", `${leaks.length} casa(s) precisam de atenção`, MASCOTE.alerta)}
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #4b5563; line-height: 1.7;">
          ${isTeste
            ? "Se você está lendo isto, o alerta automático de vazamento <strong>chega no seu e-mail</strong>. Na operação normal você não recebe nada — só quando houver algo fora do lugar."
            : "A faxina diária encontrou casa(s) com plano <strong>vencido</strong> que ainda <strong>não foram congeladas</strong> (acesso premium indevido). Já tentei congelar automaticamente; confira no painel."}
        </p>
        ${leaks.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#f9fafb;text-align:left;">
              <th style="padding:8px 12px;">Casa</th>
              <th style="padding:8px 12px;">Plano</th>
              <th style="padding:8px 12px;">Venceu em</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>` : `<p style="color:#16a34a;font-weight:700;">Nenhum vazamento no momento — tudo certo. ✅</p>`}
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${APP_URL}/admin" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 32px;border-radius:12px;">Abrir painel /admin</a>
        </div>
      </div>
    `),
  });

  console.log(`[Email] ${isTeste ? "🧪 Teste de alerta" : "🚨 Alerta de vazamento"} enviado (${leaks.length})`);
}
