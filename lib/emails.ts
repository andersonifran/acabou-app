import "server-only"; // trava: nunca pode ir pro client (protege RESEND_API_KEY)
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
// Versões "-sm" (184px, ~50KB) pra carregar QUASE instantâneo no e-mail (as
// originais têm ~230KB e demoravam alguns segundos pra aparecer no Gmail).
const MASCOTE = {
  acenando: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br"}/mascote/sacolino-acenando-sm.png`,
  comemorando: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br"}/mascote/sacolino-comemorando-sm.png`,
  alerta: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br"}/mascote/sacolino-alerta-sm.png`,
  feliz: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.acabouapp.com.br"}/mascote/sacolino-feliz-sm.png`,
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
      ${greenHeader("Acabou?", "Que bom ter voc&ecirc; por aqui! 💚", MASCOTE.acenando)}
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
        <p style="margin: 0; font-size: 14px; color: #111827;">Qualquer coisa, &eacute; s&oacute; me chamar — vou estar por aqui. 💚<br><strong>Sacolino &amp; time Acabou?</strong> 🛒</p>
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
          Qualquer d&uacute;vida sobre sua assinatura, &eacute; s&oacute; responder este e-mail — a gente te ajuda de verdade.
        </p>
        <p style="margin: 24px 0 0; font-size: 14px; color: #111827;">
          Obrigado por confiar na gente! 💚<br>
          <strong>Sacolino &amp; time Acabou?</strong> 🛒
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
          Se precisar de qualquer ajuda, &eacute; s&oacute; responder este e-mail — t&ocirc; aqui pra te ajudar. 💚
        </p>
        <p style="margin: 24px 0 0; font-size: 14px; color: #111827;">
          Conta com a gente sempre,<br>
          <strong>Sacolino &amp; time Acabou?</strong> 🛒
        </p>
      </div>
    `),
  });

  console.log(`[Email] ✅ Plano expirando enviado para ${email} (${daysLeft} dias)`);
}

// =============================================
// 4. RECONQUISTA DE NOTIFICAÇÕES (push desligado)
// =============================================
// Pra quem NUNCA ativou (ou bloqueou no sistema, único caso que a web não cura
// sozinha). Convida de volta pra ligar as notificações — o CTA abre o app já
// com o convite (?ativar=notificacoes). Enviado UMA vez por usuário (controle
// via profiles.push_reengage_at) pela ferramenta admin. Sem spam.
export async function sendPushReengageEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) return;

  const firstName = name.split(" ")[0] || "Oi";
  const resend = getResend();

  await resend.emails.send({
    from: FROM,
    to: email,
    replyTo: REPLY_TO,
    subject: `${firstName}, ligue as notificações e não esqueça mais nada 🔔`,
    html: emailLayout(`
      ${greenHeader("Posso te avisar na hora certa? 🔔", "É só ligar as notificações — leva 1 toque", MASCOTE.acenando)}
      <div style="padding: 40px 32px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="margin: 0 0 16px; font-size: 22px; color: #111827;">
          Oi, ${firstName}! 👋
        </h2>
        <p style="margin: 0 0 20px; font-size: 15px; color: #4b5563; line-height: 1.7;">
          Notei que suas notificações estão <strong>desligadas</strong> — e assim
          você acaba perdendo os melhores avisos do Acabou?. Com elas ligadas, eu
          cuido disso pra você:
        </p>

        <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
          <p style="margin: 0 0 12px; font-size: 14px; color: #111827; line-height: 1.6;">🛒 &nbsp;<strong>Na hora certa</strong> de ir às compras</p>
          <p style="margin: 0 0 12px; font-size: 14px; color: #111827; line-height: 1.6;">📦 &nbsp;Quando algo estiver <strong>acabando</strong></p>
          <p style="margin: 0; font-size: 14px; color: #111827; line-height: 1.6;">👨‍👩‍👧 &nbsp;Quando alguém da família <strong>atualizar a lista</strong></p>
        </div>

        <p style="margin: 0 0 8px; font-size: 15px; color: #4b5563; line-height: 1.7;">
          É rapidinho — toque no botão e confirme em "Permitir":
        </p>

        <div style="text-align: center; margin: 24px 0 8px;">
          <a href="${APP_URL}/home?ativar=notificacoes" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 40px; border-radius: 12px;">🔔 Ativar minhas notificações</a>
        </div>

        <p style="margin: 16px 0 24px; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6;">
          Você controla tudo — pode desativar quando quiser. Não vamos mandar este lembrete de novo.
        </p>

        <p style="margin: 0; font-size: 14px; color: #111827;">
          Conto com você! 💚<br>
          <strong>Sacolino & Equipe Acabou?</strong> 🛒
        </p>
      </div>
    `),
  });

  console.log(`[Email] ✅ Reconquista de notificações enviada para ${email}`);
}

// =============================================
// WIN-BACK (+7 dias de volta) — congelados que SÓ pegaram 7 dias de trial.
// =============================================
// Enviado UMA vez por pessoa (controle em profiles.winback_granted_at +
// winback_grants por hash) pela rota admin reengage_winback. A concessão dos +7
// dias é feita lá (service_role); aqui é só o e-mail. Copy: gancho emocional
// ("seus dados continuam SALVOS") + melhorias + oportunidade ÚNICA, sem ser chato.
export async function sendWinbackEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) return;

  const firstName = (name || "").split(" ")[0] || "Oi";
  const appHost = APP_URL.replace(/^https?:\/\//, "");
  const resend = getResend();

  await resend.emails.send({
    // Remetente com NOME DE PESSOA (mesmo endereço/domínio) → sinal forte de
    // "e-mail pessoal" pro Gmail (ajuda a cair na Principal, não em Promoções).
    from: "Anderson do Acabou? <notificacoes@acabouapp.com.br>",
    to: email,
    replyTo: REPLY_TO,
    // List-Unsubscribe: exigência dos provedores p/ envio em volume + ajuda MUITO
    // a reputação/entrega (cair na caixa certa).
    headers: {
      "List-Unsubscribe": "<mailto:contato@acabouapp.com.br?subject=Sair%20dos%20e-mails>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    // Assunto SEM "grátis/oferta/🎁" e sem emojis de promo → menos cara de campanha.
    subject: `${esc(firstName)}, sua despensa ficou te esperando`,
    // Carta PESSOAL (texto, sem banner/botão gigante) — parece e-mail de gente,
    // não panfleto. Converte melhor em reconquista E vai mais p/ a Principal.
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; color: #1f2937; font-size: 15px; line-height: 1.7;">
        <p style="margin: 0 0 16px;">Oi, ${esc(firstName)}! 👋</p>
        <p style="margin: 0 0 16px;">Aqui &eacute; o Anderson, do <strong>Acabou?</strong>. Vi que voc&ecirc; chegou a testar o app e acabou saindo — e lembrei de voc&ecirc;.</p>
        <p style="margin: 0 0 16px;"><strong>Tudo que voc&ecirc; criou continua salvo</strong>: suas listas, sua despensa, sua casa. Est&aacute; tudo aqui, do jeitinho que voc&ecirc; deixou.</p>
        <p style="margin: 0 0 8px;">E a gente melhorou bastante desde ent&atilde;o:</p>
        <ul style="margin: 0 0 16px; padding-left: 20px; color: #374151;">
          <li style="margin-bottom: 6px;">Lembrete na hora certa (quando algo acaba e na hora do mercado)</li>
          <li style="margin-bottom: 6px;">Lista pronta pra mandar no WhatsApp pra fam&iacute;lia</li>
          <li style="margin-bottom: 6px;">Busca inteligente de itens e bem mais r&aacute;pido</li>
        </ul>
        <p style="margin: 0 0 16px;">Ent&atilde;o fiz o seguinte: <strong>deixei seu acesso liberado de novo por 7 dias, sem custo nenhum</strong>. Quis te dar uma segunda chance de ver como ficou — sem compromisso.</p>
        <p style="margin: 0 0 20px;">&Eacute; s&oacute; voltar por aqui &rarr; <a href="${APP_URL}/home" style="color: #15803d; font-weight: 700;">${appHost}/home</a></p>
        <p style="margin: 0 0 16px;">Qualquer d&uacute;vida, &eacute; s&oacute; responder este e-mail — eu leio. 💚</p>
        <p style="margin: 0;">Um abra&ccedil;o,<br><strong>Anderson</strong> &middot; Acabou?</p>
        <p style="margin: 28px 0 0; font-size: 12px; color: #9ca3af; border-top: 1px solid #f0f0f0; padding-top: 14px;">
          Voc&ecirc; recebeu este e-mail porque criou uma conta no Acabou?. Se n&atilde;o quiser mais receber, &eacute; s&oacute; responder "sair".
          &nbsp;&middot;&nbsp;<a href="${APP_URL}/privacidade" style="color: #9ca3af;">Privacidade</a>
        </p>
      </div>`,
  });

  console.log(`[Email] ✅ Win-back (+7d, carta pessoal) enviado para ${email}`);
}

// =============================================
// 5. RELATÓRIO DIÁRIO de notificações (interno — só admin)
// =============================================
// Enviado pelo cron logo após o nudge das 18h. Dá pro Anderson acompanhar a
// saúde das notificações TODO dia, sozinho: cobertura de push + envios do dia.
export async function sendDailyNotifReport(stats: {
  totalContas: number;
  comPush: number;
  semPush: number;
  coberturaPct: number;
  ativos30d: number;
  nudgesHoje: number;
  lembretesHoje: number;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = getResend();
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

  const linha = (label: string, valor: string | number, cor = "#111827") => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#6b7280;">${label}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:700;text-align:right;color:${cor};">${valor}</td>
    </tr>`;

  const corCobertura = stats.coberturaPct >= 50 ? "#16a34a" : stats.coberturaPct >= 25 ? "#d97706" : "#dc2626";

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAILS,
    replyTo: REPLY_TO,
    subject: `📊 Notificações ${hoje}: ${stats.nudgesHoje} enviadas · ${stats.coberturaPct}% com push`,
    html: emailLayout(`
      ${greenHeader("Relatório do dia 📊", `Saúde das notificações · ${hoje}`, MASCOTE.feliz)}
      <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          ${linha("Contas no total", stats.totalContas)}
          ${linha("Com push ativo", `${stats.comPush} (${stats.coberturaPct}%)`, corCobertura)}
          ${linha("Sem push (não recebem)", stats.semPush, stats.semPush > 0 ? "#dc2626" : "#16a34a")}
          ${linha("Ativos nos últimos 30 dias", stats.ativos30d)}
          ${linha("Nudges enviados HOJE", stats.nudgesHoje, stats.nudgesHoje > 0 ? "#16a34a" : "#d97706")}
          ${linha("Lembretes de compra HOJE", stats.lembretesHoje)}
        </table>
        <p style="margin: 20px 0 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
          ${stats.coberturaPct < 50
            ? `💡 Cobertura em ${stats.coberturaPct}%. O convite no app + e-mail de reconquista ajudam a subir esse número.`
            : `✅ Boa cobertura! Continue convidando pra manter o engajamento alto.`}
        </p>
      </div>
    `),
  });

  console.log(`[Email] 📊 Relatório diário enviado (push ${stats.coberturaPct}%, nudges ${stats.nudgesHoje})`);
}

// =============================================
// 6. ALERTA DE VAZAMENTO (interno — só admin)
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
