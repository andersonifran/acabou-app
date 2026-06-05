import * as Sentry from "@sentry/nextjs";

const DSN =
  "https://2c5e8a57b3819ec3560ec10eb9357dfb@o4511509952659456.ingest.us.sentry.io/4511509967601664";

// Monitoramento de erros NO SERVIDOR (rotas /api, server components, crons...).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: 0,
      sendDefaultPii: false,
      enabled: process.env.NODE_ENV === "production",
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: 0,
      sendDefaultPii: false,
      enabled: process.env.NODE_ENV === "production",
    });
  }
}

// Captura erros que acontecem ao processar requisições (Next.js 15+/16).
export const onRequestError = Sentry.captureRequestError;
