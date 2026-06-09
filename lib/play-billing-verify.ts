import "server-only"; // trava: nunca pode ir pro client (protege GOOGLE_PLAY_SA_JSON)

// =============================================================
// GOOGLE PLAY BILLING — validação no SERVIDOR (anti-burla)
// =============================================================
// Recebe o purchaseToken que o app Android mandou e pergunta DIRETO pro Google:
// "essa assinatura é real e está ativa?". Nunca confiamos no cliente.
//
// Autenticação: conta de serviço (service account) "Acabou Play Billing".
// A chave JSON fica SÓ na env var GOOGLE_PLAY_SA_JSON (criptografada na Vercel),
// nunca no código nem no git.
//
// Documentação da API: androidpublisher v3 → purchases.subscriptionsv2.get
//
// Esta peça fica dormente até existir um .aab com Play Billing + produtos criados
// no Play Console. Mas já valida 100% quando chegar um token real.

import { GoogleAuth } from "google-auth-library";

// Pacote do app na Play Store (TWA). NÃO muda.
export const ANDROID_PACKAGE = "br.com.acabouapp.www.twa";

const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const API_BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3";

// Estados de assinatura que contam como "tem premium" (ativo ou em carência).
const ACTIVE_STATES = new Set([
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
]);

let cachedAuth: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth;
  const raw = process.env.GOOGLE_PLAY_SA_JSON;
  if (!raw) {
    throw new Error(
      "GOOGLE_PLAY_SA_JSON ausente. Adicione o conteúdo da chave da conta de serviço nas variáveis de ambiente."
    );
  }
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_PLAY_SA_JSON inválido (não é um JSON válido).");
  }
  cachedAuth = new GoogleAuth({ credentials, scopes: [SCOPE] });
  return cachedAuth;
}

async function getAccessToken(): Promise<string> {
  const client = await getAuth().getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Não foi possível obter o token de acesso do Google.");
  return token;
}

export interface PlayVerifyResult {
  /** true só se a assinatura está ativa E não expirou (libera premium) */
  isValid: boolean;
  /** estado bruto retornado pelo Google (ex.: SUBSCRIPTION_STATE_ACTIVE) */
  state: string | null;
  /** vencimento da assinatura em ms (epoch), ou null */
  expiryMs: number | null;
  /** se a compra já foi "confirmada" (acknowledged) */
  acknowledged: boolean;
  /** auto-renovação ligada? */
  autoRenewing: boolean;
  /** mensagem de erro técnica (se houve) */
  error?: string;
  /** status HTTP da chamada ao Google (pra diagnóstico) */
  httpStatus?: number;
}

/**
 * Valida um purchaseToken de assinatura com a Google Play Developer API.
 * Usa o endpoint subscriptionsv2 (modelo novo de assinaturas).
 */
export async function verifyPlaySubscription(
  purchaseToken: string
): Promise<PlayVerifyResult> {
  const base: PlayVerifyResult = {
    isValid: false,
    state: null,
    expiryMs: null,
    acknowledged: false,
    autoRenewing: false,
  };

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (e) {
    return { ...base, error: `Auth falhou: ${(e as Error).message}` };
  }

  const url = `${API_BASE}/applications/${ANDROID_PACKAGE}/purchases/subscriptionsv2/tokens/${encodeURIComponent(
    purchaseToken
  )}`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  } catch (e) {
    return { ...base, error: `Falha de rede ao chamar o Google: ${(e as Error).message}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ...base, httpStatus: res.status, error: `Google API ${res.status}: ${body}` };
  }

  const data = (await res.json()) as {
    subscriptionState?: string;
    acknowledgementState?: string;
    lineItems?: Array<{ expiryTime?: string; autoRenewingPlan?: { autoRenewEnabled?: boolean } }>;
  };

  const state = data.subscriptionState ?? null;
  const acknowledged = data.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED";

  // Vencimento = maior expiryTime entre os lineItems (RFC3339 → ms).
  let expiryMs: number | null = null;
  let autoRenewing = false;
  for (const li of data.lineItems ?? []) {
    if (li.expiryTime) {
      const ms = Date.parse(li.expiryTime);
      if (!Number.isNaN(ms) && (expiryMs === null || ms > expiryMs)) expiryMs = ms;
    }
    if (li.autoRenewingPlan?.autoRenewEnabled) autoRenewing = true;
  }

  const stateActive = state ? ACTIVE_STATES.has(state) : false;
  const notExpired = expiryMs !== null ? expiryMs > Date.now() : false;

  return {
    isValid: stateActive && notExpired,
    state,
    expiryMs,
    acknowledged,
    autoRenewing,
    httpStatus: res.status,
  };
}

/**
 * "Confirma" (acknowledge) a compra. OBRIGATÓRIO em até 3 dias, senão o Google
 * estorna a assinatura automaticamente. Idempotente (confirmar 2x não dá erro
 * relevante). Usa o endpoint clássico de subscriptions (precisa do productId).
 */
export async function acknowledgePlaySubscription(
  productId: string,
  purchaseToken: string
): Promise<void> {
  const accessToken = await getAccessToken();
  const url = `${API_BASE}/applications/${ANDROID_PACKAGE}/purchases/subscriptions/${encodeURIComponent(
    productId
  )}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: "{}",
  });

  // 410 = já processado/expirado; tratamos como ok pra não quebrar o fluxo.
  if (!res.ok && res.status !== 410) {
    const body = await res.text().catch(() => "");
    throw new Error(`Acknowledge falhou (${res.status}): ${body}`);
  }
}

/**
 * Diagnóstico (smoke test): confirma que a service account autentica e tem
 * permissão na API, SEM precisar de uma compra real. Chama a API com um token
 * fajuto: se voltar 404/400 (token não encontrado) = auth+permissão OK; se
 * voltar 401/403 = problema de credencial/permissão.
 */
export async function playBillingSelfTest(): Promise<{
  authOk: boolean;
  permissionOk: boolean;
  httpStatus: number | null;
  detail: string;
}> {
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (e) {
    return { authOk: false, permissionOk: false, httpStatus: null, detail: (e as Error).message };
  }

  const url = `${API_BASE}/applications/${ANDROID_PACKAGE}/purchases/subscriptionsv2/tokens/${encodeURIComponent(
    "token-de-teste-inexistente-acabou"
  )}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await res.text().catch(() => "");

  // 404/400 = autenticou e tem permissão, só o token não existe (esperado).
  const permissionOk = res.status === 404 || res.status === 400;
  return {
    authOk: true,
    permissionOk,
    httpStatus: res.status,
    detail: permissionOk
      ? "Auth e permissão OK (token de teste não encontrado, como esperado)."
      : `Resposta inesperada do Google: ${res.status} ${body}`,
  };
}
