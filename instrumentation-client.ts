import * as Sentry from "@sentry/nextjs";

// Monitoramento de erros NO NAVEGADOR (cliente).
// O DSN é um endereço público de "só enviar" (não é segredo).
Sentry.init({
  dsn: "https://2c5e8a57b3819ec3560ec10eb9357dfb@o4511509952659456.ingest.us.sentry.io/4511509967601664",

  // Sem performance tracing (foca em ERROS e economiza a cota do plano grátis).
  tracesSampleRate: 0,

  // Privacidade (LGPD): NÃO envia dados pessoais (IP, cookies) por padrão.
  sendDefaultPii: false,

  // Só envia em produção — evita ruído no desenvolvimento.
  enabled: process.env.NODE_ENV === "production",
});

// Captura erros de navegação entre páginas (App Router).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
