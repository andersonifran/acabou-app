import * as Sentry from "@sentry/nextjs";

/**
 * TEMPORÁRIO — teste de source maps do Sentry.
 * Dispara um erro pra confirmar que o rastro aponta a LINHA exata do código.
 * Será REMOVIDA logo após a confirmação.
 */
function dispararErroDeTesteAcabou() {
  throw new Error("Teste de SOURCE MAPS — Acabou ✅ (erro proposital, pode ignorar)");
}

export async function GET() {
  try {
    dispararErroDeTesteAcabou();
  } catch (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);
    throw err;
  }
  return new Response("ok");
}
