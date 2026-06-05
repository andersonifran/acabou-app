import * as Sentry from "@sentry/nextjs";

/**
 * TEMPORÁRIO — rota de teste do Sentry.
 * Dispara um erro de propósito pra confirmar que o monitoramento está captando.
 * Será REMOVIDA assim que confirmarmos que o erro apareceu no painel do Sentry.
 */
export async function GET() {
  const err = new Error("Teste do Sentry — Acabou ✅ (erro proposital, pode ignorar)");
  Sentry.captureException(err);
  await Sentry.flush(2000);
  throw err;
}
